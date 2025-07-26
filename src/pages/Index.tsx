import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe3D } from '@/components/Globe3D';
import { ControlPanel } from '@/components/ControlPanel';
import { LatencyChart } from '@/components/LatencyChart';

import CloudflareRadarService from '@/services/cloudflareRadar';
import { 
  Globe2, 
  Activity, 
  Zap, 
  Server,
  Clock,
  Wifi,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { exchangeServers, generateLatencyConnections } from '@/data/exchanges';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedExchange, setSelectedExchange] = useState<string>();
  const [showConnections, setShowConnections] = useState(true);
  const [cloudFilter, setCloudFilter] = useState<string[]>(['AWS', 'GCP', 'Azure']);
  const [latencyFilter, setLatencyFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTimeLatency, setRealTimeLatency] = useState<Record<string, number>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [radarService] = useState<CloudflareRadarService>(new CloudflareRadarService());
  const { toast } = useToast();


  // Cloudflare Radar latency monitoring
  const startCloudflareMonitoring = useCallback(async () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    toast({
      title: "Cloudflare Radar Monitoring Started",
      description: "Real-time network quality measurements active",
      duration: 3000,
    });

    const monitorInterval = setInterval(async () => {
      try {
        const latencyUpdates: Record<string, number> = {};
        
        // Get latency data for each exchange location
        for (const exchange of exchangeServers) {
          try {
            const country = CloudflareRadarService.getCountryForExchange(exchange.id);
            const qualityData = await radarService.getNetworkQuality(country, '1h');
            
            if (qualityData.length > 0) {
              // Use the most recent latency value and scale it appropriately
              const networkLatency = qualityData[qualityData.length - 1].latency;
              // Convert from network quality metric to latency (inverse relationship)
              const latency = Math.max(5, Math.round(100 - networkLatency + Math.random() * 20));
              latencyUpdates[exchange.id] = latency;
            }
          } catch (error) {
            console.warn(`Failed to get data for ${exchange.id}:`, error);
          }
        }
        
        setRealTimeLatency(prev => ({ ...prev, ...latencyUpdates }));
        
        // Check for latency spikes
        Object.entries(latencyUpdates).forEach(([exchangeId, latency]) => {
          const exchange = exchangeServers.find(e => e.id === exchangeId);
          if (exchange && latency > exchange.avgLatency * 1.5) {
            toast({
              title: "High Latency Alert",
              description: `${exchange.name}: ${latency}ms (${Math.round(((latency - exchange.avgLatency) / exchange.avgLatency) * 100)}% increase)`,
              duration: 4000,
            });
          }
        });
      } catch (error) {
        console.error('Cloudflare monitoring error:', error);
        toast({
          title: "Monitoring Error",
          description: "Failed to fetch latest network data",
          duration: 3000,
        });
      }
    }, 15000);

    // Store interval ID for cleanup
    return () => {
      clearInterval(monitorInterval);
      setIsMonitoring(false);
    };
  }, [isMonitoring, radarService, toast]);

  // Filter exchanges based on current filters
  const filteredExchanges = useMemo(() => {
    return exchangeServers.filter(exchange => {
      // Cloud provider filter
      if (!cloudFilter.includes(exchange.cloudProvider)) {
        return false;
      }

      // Latency filter
      const currentLatency = realTimeLatency[exchange.id] || exchange.avgLatency;
      switch (latencyFilter) {
        case 'low':
          return currentLatency < 20;
        case 'medium':
          return currentLatency >= 20 && currentLatency < 50;
        case 'high':
          return currentLatency >= 50;
        default:
          return true;
      }
    });
  }, [cloudFilter, latencyFilter, realTimeLatency]);


  // Stop monitoring
  const stopLatencyMonitoring = useCallback(() => {
    setIsMonitoring(false);
    toast({
      title: "Latency Monitoring Stopped",
      description: "Real-time measurements disabled",
      duration: 2000,
    });
  }, [toast]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate latency updates
      if (Math.random() < 0.1) { // 10% chance every 5 seconds
        const randomExchange = exchangeServers[Math.floor(Math.random() * exchangeServers.length)];
        toast({
          title: "Latency Alert",
          description: `${randomExchange.name} experiencing increased latency: ${randomExchange.avgLatency + Math.floor(Math.random() * 20)}ms`,
          duration: 3000,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [toast]);

  const handleExchangeSelect = (exchangeId: string) => {
    setSelectedExchange(exchangeId === selectedExchange ? undefined : exchangeId);
    const exchange = filteredExchanges.find(e => e.id === exchangeId);
    if (exchange) {
      const currentLatency = realTimeLatency[exchange.id] || exchange.avgLatency;
      toast({
        title: `Selected ${exchange.name}`,
        description: `${exchange.location.city}, ${exchange.location.country} • ${exchange.cloudProvider} • ${currentLatency}ms`,
        duration: 2000,
      });
    }
  };

  const stats = {
    totalServers: exchangeServers.length,
    activeServers: filteredExchanges.filter(e => e.status === 'active').length,
    avgLatency: isMonitoring && Object.keys(realTimeLatency).length > 0
      ? Math.round(Object.values(realTimeLatency).reduce((sum, val) => sum + val, 0) / Object.values(realTimeLatency).length)
      : null
  };

  return (
    <div className="min-h-screen bg-background terminal-grid">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Globe2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text font-mono">
                  Crypto Latency Voyager
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time exchange latency monitoring • {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-mono gradient-text">{stats.activeServers}/{stats.totalServers}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono status-low">{stats.avgLatency ? `${stats.avgLatency}ms` : 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">Avg Latency</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
          {/* Control Panel - Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            
            <ControlPanel
              selectedExchange={selectedExchange}
              onExchangeSelect={handleExchangeSelect}
              showConnections={showConnections}
              onToggleConnections={setShowConnections}
              cloudFilter={cloudFilter}
              onCloudFilterChange={setCloudFilter}
              latencyFilter={latencyFilter}
              onLatencyFilterChange={setLatencyFilter}
              filteredExchanges={filteredExchanges}
              realTimeLatency={realTimeLatency}
              isMonitoring={isMonitoring}
              onStartMonitoring={startCloudflareMonitoring}
              onStopMonitoring={stopLatencyMonitoring}
            />
          </div>

          {/* Main Visualization - Center */}
          <div className="lg:col-span-2">
            <Card className="h-[60vh] lg:h-full terminal-border cyber-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 gradient-text">
                    <Globe2 className="w-5 h-5" />
                    Global Exchange Network
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success latency-pulse" />
                    <span className="text-sm text-muted-foreground font-mono">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)] p-0">
                <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
                  <Globe3D
                    selectedExchange={selectedExchange}
                    onExchangeSelect={handleExchangeSelect}
                    showConnections={showConnections}
                    filteredExchanges={filteredExchanges}
                    realTimeLatency={realTimeLatency}
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="cyber-glow bg-card/80 backdrop-blur-sm"
                      onClick={() => setShowConnections(!showConnections)}
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      {showConnections ? 'Hide' : 'Show'} Connections
                    </Button>
                  </div>
                  
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg p-3 border border-border">
                    <div className="text-xs font-mono text-muted-foreground mb-2">Cloud Providers</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--aws))' }} />
                        <span className="text-xs font-mono">AWS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--gcp))' }} />
                        <span className="text-xs font-mono">GCP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--azure))' }} />
                        <span className="text-xs font-mono">Azure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Panel - Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Time Range Selector */}
            <Card className="terminal-border cyber-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 gradient-text">
                  <Clock className="w-5 h-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-mono text-muted-foreground">Time Range</label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="bg-muted/50 border-primary/20 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/20">
                        <SelectItem value="1h">Last Hour</SelectItem>
                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latency Chart */}
            <div className="h-96">
              <LatencyChart
                selectedExchange={selectedExchange}
                timeRange={timeRange}
                isMonitoring={isMonitoring}
                realTimeLatency={realTimeLatency}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
