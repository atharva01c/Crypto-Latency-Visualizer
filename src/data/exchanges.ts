export interface ExchangeServer {
  id: string;
  name: string;
  location: {
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
  cloudProvider: 'AWS' | 'GCP' | 'Azure';
  region: string;
  status: 'active' | 'maintenance' | 'offline';
  avgLatency: number;
  currentLoad: number;
}

export interface LatencyConnection {
  id: string;
  from: string;
  to: string;
  latency: number;
  status: 'low' | 'medium' | 'high';
  timestamp: number;
}

export const exchangeServers: ExchangeServer[] = [
  {
    id: 'binance-tokyo',
    name: 'Binance',
    location: { country: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    cloudProvider: 'AWS',
    region: 'ap-northeast-1',
    status: 'active',
    avgLatency: 12,
    currentLoad: 78
  },
  {
    id: 'okx-singapore',
    name: 'OKX',
    location: { country: 'Singapore', city: 'Singapore', lat: 1.3521, lng: 103.8198 },
    cloudProvider: 'GCP',
    region: 'asia-southeast1',
    status: 'active',
    avgLatency: 8,
    currentLoad: 65
  },
  {
    id: 'deribit-london',
    name: 'Deribit',
    location: { country: 'UK', city: 'London', lat: 51.5074, lng: -0.1278 },
    cloudProvider: 'Azure',
    region: 'northeurope',
    status: 'active',
    avgLatency: 15,
    currentLoad: 82
  },
  {
    id: 'bybit-virginia',
    name: 'Bybit',
    location: { country: 'USA', city: 'Virginia', lat: 38.9072, lng: -77.0369 },
    cloudProvider: 'AWS',
    region: 'us-east-1',
    status: 'active',
    avgLatency: 25,
    currentLoad: 91
  },
  {
    id: 'kraken-frankfurt',
    name: 'Kraken',
    location: { country: 'Germany', city: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
    cloudProvider: 'GCP',
    region: 'europe-west3',
    status: 'active',
    avgLatency: 18,
    currentLoad: 73
  },
  {
    id: 'coinbase-california',
    name: 'Coinbase',
    location: { country: 'USA', city: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    cloudProvider: 'Azure',
    region: 'westus2',
    status: 'active',
    avgLatency: 22,
    currentLoad: 85
  },
  {
    id: 'bitfinex-ireland',
    name: 'Bitfinex',
    location: { country: 'Ireland', city: 'Dublin', lat: 53.3498, lng: -6.2603 },
    cloudProvider: 'AWS',
    region: 'eu-west-1',
    status: 'active',
    avgLatency: 14,
    currentLoad: 69
  },
  {
    id: 'kucoin-mumbai',
    name: 'KuCoin',
    location: { country: 'India', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    cloudProvider: 'GCP',
    region: 'asia-south1',
    status: 'active',
    avgLatency: 32,
    currentLoad: 77
  },
  {
    id: 'huobi-sydney',
    name: 'Huobi',
    location: { country: 'Australia', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
    cloudProvider: 'Azure',
    region: 'australiaeast',
    status: 'active',
    avgLatency: 45,
    currentLoad: 63
  },
  {
    id: 'ftx-stockholm',
    name: 'FTX',
    location: { country: 'Sweden', city: 'Stockholm', lat: 59.3293, lng: 18.0686 },
    cloudProvider: 'AWS',
    region: 'eu-north-1',
    status: 'maintenance',
    avgLatency: 28,
    currentLoad: 45
  }
];

export const cloudRegions = [
  {
    id: 'aws-us-east-1',
    provider: 'AWS',
    name: 'US East (N. Virginia)',
    code: 'us-east-1',
    location: { lat: 38.9072, lng: -77.0369 }
  },
  {
    id: 'aws-eu-west-1',
    provider: 'AWS',
    name: 'EU (Ireland)',
    code: 'eu-west-1',
    location: { lat: 53.3498, lng: -6.2603 }
  },
  {
    id: 'gcp-asia-southeast1',
    provider: 'GCP',
    name: 'Asia Southeast (Singapore)',
    code: 'asia-southeast1',
    location: { lat: 1.3521, lng: 103.8198 }
  },
  {
    id: 'azure-northeurope',
    provider: 'Azure',
    name: 'North Europe',
    code: 'northeurope',
    location: { lat: 53.3498, lng: -6.2603 }
  }
];

// Generate mock latency data
export const generateLatencyConnections = (): LatencyConnection[] => {
  const connections: LatencyConnection[] = [];
  
  for (let i = 0; i < exchangeServers.length; i++) {
    for (let j = i + 1; j < exchangeServers.length; j++) {
      const from = exchangeServers[i];
      const to = exchangeServers[j];
      
      // Calculate approximate latency based on distance and add randomness
      const distance = Math.sqrt(
        Math.pow(from.location.lat - to.location.lat, 2) +
        Math.pow(from.location.lng - to.location.lng, 2)
      );
      
      const baseLatency = Math.floor(distance * 5 + Math.random() * 20);
      const latency = Math.max(5, baseLatency + Math.floor(Math.random() * 30));
      
      let status: 'low' | 'medium' | 'high';
      if (latency < 20) status = 'low';
      else if (latency < 50) status = 'medium';
      else status = 'high';
      
      connections.push({
        id: `${from.id}-${to.id}`,
        from: from.id,
        to: to.id,
        latency,
        status,
        timestamp: Date.now()
      });
    }
  }
  
  return connections;
};

export const getLatencyStatus = (latency: number): 'low' | 'medium' | 'high' => {
  if (latency < 20) return 'low';
  if (latency < 50) return 'medium';
  return 'high';
};

export const getCloudProviderColor = (provider: string): string => {
  switch (provider) {
    case 'AWS': return 'hsl(var(--aws))';
    case 'GCP': return 'hsl(var(--gcp))';
    case 'Azure': return 'hsl(var(--azure))';
    default: return 'hsl(var(--primary))';
  }
};