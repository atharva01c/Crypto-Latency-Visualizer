import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { exchangeServers, ExchangeServer, getCloudProviderColor } from '@/data/exchanges';

interface Globe3DProps {
  selectedExchange?: string;
  onExchangeSelect?: (exchangeId: string) => void;
  showConnections?: boolean;
  filteredExchanges?: ExchangeServer[];
  realTimeLatency?: Record<string, number>;
}

// Convert lat/lng to 3D coordinates on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number = 2) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

const GlobeGeometry = () => {
  const globeRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  // Create earth texture using theme colors
  const globeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Use darker theme colors - secondary background
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'hsl(220, 70%, 15%)'); // --secondary
    gradient.addColorStop(0.3, 'hsl(222, 84%, 6%)'); // --muted  
    gradient.addColorStop(0.7, 'hsl(222, 84%, 4%)'); // --card
    gradient.addColorStop(1, 'hsl(220, 70%, 15%)'); // --secondary
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    // Add continents in primary color with low opacity
    ctx.fillStyle = 'hsl(180, 100%, 50%, 0.2)'; // --primary with transparency
    ctx.fillRect(50, 80, 100, 60);
    ctx.fillRect(200, 90, 150, 80);
    ctx.fillRect(380, 70, 80, 50);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  return (
    <mesh ref={globeRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 64, 32]} />
      <meshPhongMaterial 
        map={globeTexture}
        transparent 
        opacity={0.9}
        color="hsl(222, 84%, 8%)"
        emissive="hsl(180, 100%, 50%)"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

const ExchangeMarker = ({ 
  exchange, 
  isSelected, 
  onClick 
}: { 
  exchange: ExchangeServer; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  const position = latLngToVector3(exchange.location.lat, exchange.location.lng, 2.1);
  const markerRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.lookAt(state.camera.position);
      if (isSelected) {
        markerRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
      }
    }
  });

  const color = getCloudProviderColor(exchange.cloudProvider);
  
  return (
    <group position={position}>
      <mesh 
        ref={markerRef}
        onClick={onClick}
        onPointerOver={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={exchange.status === 'active' ? 1 : 0.5}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Status indicator */}
      <Html distanceFactor={8} position={[0, 0.1, 0]}>
        <div className="text-xs font-mono text-center pointer-events-none">
          <div 
            className={`w-2 h-2 rounded-full mx-auto mb-1 ${
              exchange.status === 'active' ? 'bg-success' : 
              exchange.status === 'maintenance' ? 'bg-warning' : 'bg-destructive'
            }`}
            style={{ 
              boxShadow: `0 0 10px ${color}`,
              backgroundColor: color
            }}
          />
          <div className="text-foreground text-[10px] bg-card/80 px-1 rounded whitespace-nowrap">
            {exchange.name}
          </div>
        </div>
      </Html>
    </group>
  );
};

const LatencyConnection = ({ 
  fromPos, 
  toPos, 
  latency 
}: { 
  fromPos: THREE.Vector3; 
  toPos: THREE.Vector3; 
  latency: number;
}) => {
  const points = useMemo(() => {
    // Create curved line between two points on sphere
    const distance = fromPos.distanceTo(toPos);
    const numPoints = Math.max(20, Math.floor(distance * 10));
    const points: [number, number, number][] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const point = new THREE.Vector3().lerpVectors(fromPos, toPos, t);
      
      // Add curvature to make it arc over the globe
      const height = Math.sin(t * Math.PI) * 0.5;
      point.normalize().multiplyScalar(2.1 + height);
      
      points.push([point.x, point.y, point.z]);
    }
    
    return points;
  }, [fromPos, toPos]);

  const color = latency < 20 ? '#00ff88' : latency < 50 ? '#ffaa00' : '#ff4444';

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
};

const Globe3DScene = ({ 
  selectedExchange, 
  onExchangeSelect, 
  showConnections,
  filteredExchanges = exchangeServers,
  realTimeLatency = {}
}: Globe3DProps) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(5, 2, 5);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#00aaff" />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#ff4400" />
      <directionalLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" />
      
      <GlobeGeometry />
      
      {filteredExchanges.map((exchange) => (
        <ExchangeMarker
          key={exchange.id}
          exchange={exchange}
          isSelected={selectedExchange === exchange.id}
          onClick={() => onExchangeSelect?.(exchange.id)}
        />
      ))}
      
      {showConnections && filteredExchanges.map((exchange, i) => 
        filteredExchanges.slice(i + 1).map((otherExchange) => {
          const fromPos = latLngToVector3(exchange.location.lat, exchange.location.lng, 2.1);
          const toPos = latLngToVector3(otherExchange.location.lat, otherExchange.location.lng, 2.1);
          
          // Use real-time latency if available, otherwise fall back to average
          const fromLatency = realTimeLatency[exchange.id] || exchange.avgLatency;
          const toLatency = realTimeLatency[otherExchange.id] || otherExchange.avgLatency;
          const avgLatency = (fromLatency + toLatency) / 2;
          
          return (
            <LatencyConnection
              key={`${exchange.id}-${otherExchange.id}`}
              fromPos={fromPos}
              toPos={toPos}
              latency={avgLatency}
            />
          );
        })
      )}
      
      <OrbitControls 
        enableZoom={true} 
        enablePan={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
      />
    </>
  );
};

export const Globe3D = (props: Globe3DProps) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [5, 2, 5], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Globe3DScene {...props} />
      </Canvas>
    </div>
  );
};