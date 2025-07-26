import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { exchangeServers } from '@/data/exchanges';

interface LatencyChartProps {
  selectedExchange?: string;
  timeRange: string;
  isMonitoring?: boolean;
  realTimeLatency?: Record<string, number>;
}

// Generate mock historical data
const generateHistoricalData = (exchangeId: string, hours: number = 24) => {
  const exchange = exchangeServers.find(e => e.id === exchangeId);
  if (!exchange) return [];

  const data = [];
  const baseLatency = exchange.avgLatency;
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const variation = (Math.random() - 0.5) * 20;
    const latency = Math.max(5, baseLatency + variation);
    
    data.push({
      time: timestamp.toISOString(),
      latency: Math.round(latency), // Remove decimals
      timestamp: timestamp.getTime(),
      formatted: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
  }

  return data;
};

const generateRealTimeHistoricalData = (exchangeId: string, currentLatency: number, hours: number = 24) => {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    // Use current latency with small variation for historical simulation
    const variation = (Math.random() - 0.5) * 10;
    const latency = Math.max(5, currentLatency + variation);
    
    data.push({
      time: timestamp.toISOString(),
      latency: Math.round(latency),
      timestamp: timestamp.getTime(),
      formatted: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
  }

  return data;
};

const generateRealTimeComparisonData = (realTimeLatency: Record<string, number>, hours: number = 24) => {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    const entry: any = {
      time: timestamp.toISOString(),
      timestamp: timestamp.getTime(),
      formatted: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Add real latency data for each exchange that has current data
    exchangeServers.forEach(exchange => {
      if (realTimeLatency[exchange.id] !== undefined) {
        // Use actual real-time value with small random variation for historical simulation
        const baseLatency = realTimeLatency[exchange.id];
        const variation = (Math.random() - 0.5) * 5; // Smaller variation for more realistic data
        entry[exchange.name] = Math.round(Math.max(5, baseLatency + variation));
      }
    });

    data.push(entry);
  }

  return data;
};

const generateComparisonData = (hours: number = 24) => {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    const entry: any = {
      time: timestamp.toISOString(),
      timestamp: timestamp.getTime(),
      formatted: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Add latency data for each exchange
    exchangeServers.forEach(exchange => {
      const variation = (Math.random() - 0.5) * 15;
      entry[exchange.name] = Math.round(Math.max(5, exchange.avgLatency + variation)); // Remove decimals
    });

    data.push(entry);
  }

  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-primary/20 rounded-lg p-3 shadow-lg">
        <p className="font-mono text-sm text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-mono text-sm">
              {entry.name}: <span className="font-bold">{Math.round(entry.value)}ms</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const LatencyChart = ({ selectedExchange, timeRange, isMonitoring = false, realTimeLatency = {} }: LatencyChartProps) => {
  const hours = useMemo(() => {
    switch (timeRange) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 24 * 7;
      case '30d': return 24 * 30;
      default: return 24;
    }
  }, [timeRange]);

  const historicalData = useMemo(() => {
    if (!isMonitoring) {
      return [];
    }
    if (selectedExchange) {
      // For single exchange, use real-time data if available
      if (realTimeLatency[selectedExchange] !== undefined) {
        return generateRealTimeHistoricalData(selectedExchange, realTimeLatency[selectedExchange], Math.min(hours, 48));
      }
      return generateHistoricalData(selectedExchange, Math.min(hours, 48));
    }
    // For comparison view, generate data points using real-time latency values
    if (Object.keys(realTimeLatency).length > 0) {
      return generateRealTimeComparisonData(realTimeLatency, Math.min(hours, 48));
    }
    return [];
  }, [selectedExchange, hours, isMonitoring, realTimeLatency]);

  const stats = useMemo(() => {
    if (!historicalData.length) return null;

    if (selectedExchange) {
      const latencies = historicalData.map(d => d.latency);
      const avg = Math.round(latencies.reduce((sum, val) => sum + val, 0) / latencies.length);
      const min = Math.min(...latencies);
      const max = Math.max(...latencies);

      return { avg, min, max };
    } else {
      // For comparison view, calculate stats from real-time data
      const allLatencies: number[] = [];
      
      // Use current real-time latency values
      Object.values(realTimeLatency).forEach(latency => {
        if (typeof latency === 'number') {
          allLatencies.push(latency);
        }
      });

      if (allLatencies.length === 0) return null;

      const avg = Math.round(allLatencies.reduce((sum, val) => sum + val, 0) / allLatencies.length);
      const min = Math.min(...allLatencies);
      const max = Math.max(...allLatencies);

      return { avg, min, max };
    }
  }, [historicalData, selectedExchange, realTimeLatency]);

  const selectedExchangeData = selectedExchange ? 
    exchangeServers.find(e => e.id === selectedExchange) : null;

  if (!isMonitoring) {
    return (
      <Card className="terminal-border cyber-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Activity className="w-5 h-5" />
            {selectedExchange ? 'Latency History' : 'Exchange Comparison'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground font-mono">N/A</div>
            <div className="text-xs text-muted-foreground">Start real-time monitoring to view data</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!historicalData.length) {
    const message = !isMonitoring 
      ? "Start real-time monitoring to view data"
      : selectedExchange 
        ? "No data available for selected exchange"
        : "Select an exchange to view comparison data";
        
    return (
      <Card className="terminal-border cyber-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Activity className="w-5 h-5" />
            {selectedExchange ? 'Latency History' : 'Exchange Comparison'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground font-mono">N/A</div>
            <div className="text-xs text-muted-foreground">{message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-border cyber-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Activity className="w-5 h-5" />
            {selectedExchange ? 'Latency History' : 'Exchange Comparison'}
          </CardTitle>
          {selectedExchangeData && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${selectedExchangeData.cloudProvider.toLowerCase()}-badge`}>
                {selectedExchangeData.cloudProvider}
              </Badge>
              <Badge variant="outline">
                {selectedExchangeData.location.city}
              </Badge>
            </div>
          )}
        </div>
        
        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-mono gradient-text">{stats.avg}ms</div>
              <div className="text-xs text-muted-foreground">Average</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono status-low">{stats.min}ms</div>
              <div className="text-xs text-muted-foreground">Minimum</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono status-high">{stats.max}ms</div>
              <div className="text-xs text-muted-foreground">Maximum</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {selectedExchange ? (
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formatted" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  fontFamily="monospace"
                  label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#latencyGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formatted" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  fontFamily="monospace"
                  label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {exchangeServers.slice(0, 5).map((exchange, index) => {
                  const colors = [
                    'hsl(var(--primary))',
                    'hsl(var(--aws))',
                    'hsl(var(--gcp))',
                    'hsl(var(--azure))',
                    'hsl(var(--accent))'
                  ];
                  return (
                    <Line
                      key={exchange.id}
                      type="monotone"
                      dataKey={exchange.name}
                      stroke={colors[index]}
                      strokeWidth={2}
                      dot={false}
                    />
                  );
                })}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};