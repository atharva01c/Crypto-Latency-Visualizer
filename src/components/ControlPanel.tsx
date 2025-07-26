import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  Activity, 
  Server, 
  Zap,
  Filter,
  Wifi,
  Clock
} from 'lucide-react';
import { exchangeServers, ExchangeServer } from '@/data/exchanges';

interface ControlPanelProps {
  selectedExchange?: string;
  onExchangeSelect?: (exchangeId: string) => void;
  showConnections: boolean;
  onToggleConnections: (show: boolean) => void;
  cloudFilter: string[];
  onCloudFilterChange: (providers: string[]) => void;
  latencyFilter: string;
  onLatencyFilterChange: (filter: string) => void;
  filteredExchanges?: ExchangeServer[];
  realTimeLatency?: Record<string, number>;
  isMonitoring?: boolean;
  onStartMonitoring?: () => void;
  onStopMonitoring?: () => void;
}

export const ControlPanel = ({
  selectedExchange,
  onExchangeSelect,
  showConnections,
  onToggleConnections,
  cloudFilter,
  onCloudFilterChange,
  latencyFilter,
  onLatencyFilterChange,
  filteredExchanges = exchangeServers,
  realTimeLatency = {},
  isMonitoring = false,
  onStartMonitoring,
  onStopMonitoring
}: ControlPanelProps) => {
  const displayedExchanges = filteredExchanges;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'maintenance': return 'bg-warning text-warning-foreground';
      case 'offline': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLatencyStatusColor = (latency: number) => {
    if (latency < 20) return 'status-low';
    if (latency < 50) return 'status-medium';
    return 'status-high';
  };

  const cloudProviders = ['AWS', 'GCP', 'Azure'];

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="terminal-border cyber-glow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Filter className="w-5 h-5" />
            Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Visualization Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <Label htmlFor="connections" className="text-sm font-mono">Show Connections</Label>
              </div>
              <Switch
                id="connections"
                checked={showConnections}
                onCheckedChange={onToggleConnections}
              />
            </div>
            
            {/* Real-time Monitoring */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <Label htmlFor="monitoring" className="text-sm font-mono">Real-time Monitoring</Label>
              </div>
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                onClick={isMonitoring ? onStopMonitoring : onStartMonitoring}
                className="font-mono"
              >
                {isMonitoring ? 'Stop' : 'Start'}
              </Button>
            </div>
          </div>

          {/* Cloud Provider Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-mono">Cloud Providers</Label>
            <div className="flex gap-2 flex-wrap">
              {cloudProviders.map((provider) => (
                <Button
                  key={provider}
                  variant={cloudFilter.includes(provider) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (cloudFilter.includes(provider)) {
                      onCloudFilterChange(cloudFilter.filter(p => p !== provider));
                    } else {
                      onCloudFilterChange([...cloudFilter, provider]);
                    }
                  }}
                  className={`${provider.toLowerCase()}-badge font-mono`}
                >
                  {provider}
                </Button>
              ))}
            </div>
          </div>

          {/* Latency Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-mono">Latency Filter</Label>
            <Select value={latencyFilter} onValueChange={onLatencyFilterChange}>
              <SelectTrigger className="bg-muted/50 border-primary/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/20">
                <SelectItem value="all">All Latencies</SelectItem>
                <SelectItem value="low">Low (&lt; 20ms)</SelectItem>
                <SelectItem value="medium">Medium (20-50ms)</SelectItem>
                <SelectItem value="high">High (&gt; 50ms)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exchange List */}
      <Card className="terminal-border cyber-glow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Server className="w-5 h-5" />
            Exchange Servers ({displayedExchanges.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {displayedExchanges.map((exchange) => {
            const currentLatency = isMonitoring ? (realTimeLatency[exchange.id] || null) : null;
            const isRealTime = realTimeLatency[exchange.id] !== undefined && isMonitoring;
            
            return (
              <div
                key={exchange.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all exchange-marker ${
                  selectedExchange === exchange.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 bg-muted/20'
                }`}
                onClick={() => onExchangeSelect?.(exchange.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full latency-pulse" 
                         style={{ backgroundColor: exchange.status === 'active' ? 'hsl(var(--success))' : 'hsl(var(--warning))' }} />
                    <span className="font-mono font-medium">{exchange.name}</span>
                    {isRealTime && (
                      <div className="w-1 h-1 rounded-full bg-primary animate-pulse" title="Real-time data" />
                    )}
                  </div>
                  <Badge variant="outline" className={`${exchange.cloudProvider.toLowerCase()}-badge`}>
                    {exchange.cloudProvider}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {exchange.location.city}, {exchange.location.country}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className={`font-mono ${currentLatency ? getLatencyStatusColor(currentLatency) : 'text-muted-foreground'}`}>
                        {currentLatency ? `${currentLatency}ms` : 'N/A'}
                        {isRealTime && <span className="text-xs ml-1">(live)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span className="font-mono">{exchange.currentLoad}%</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <Badge variant="outline" className={getStatusColor(exchange.status)}>
                      {exchange.status}
                    </Badge>
                    <span className="ml-2 text-muted-foreground">{exchange.region}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
};