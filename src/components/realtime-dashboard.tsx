'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { RealtimeDataManager } from '@/lib/realtime-data-manager';
import { PredictionResult } from '@/lib/ml-predictor';

interface RealtimeDataPoint {
  timestamp: string;
  revenue: number;
  customers: number;
  churn: number;
  acquisition: number;
  source: string;
  confidence: number;
}

interface DataFreshness {
  lastUpdate: string;
  ageMinutes: number;
  isStale: boolean;
  nextUpdate: string;
  sources: {
    [sourceId: string]: {
      lastUpdate: string;
      ageMinutes: number;
      isStale: boolean;
    };
  };
}

export function RealtimeDashboard() {
  const [latestData, setLatestData] = useState<RealtimeDataPoint | null>(null);
  const [dataFreshness, setDataFreshness] = useState<DataFreshness | null>(null);
  const [realtimePredictions, setRealtimePredictions] = useState<PredictionResult[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch real-time data
  const fetchRealtimeData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetch('/api/realtime');
      const result = await response.json();

      if (result.success) {
        setLatestData(result.data.latest);
        setDataFreshness(result.data.freshness);
      } else {
        setError(result.error || 'Failed to fetch real-time data');
      }
    } catch (err) {
      setError('Network error while fetching real-time data');
      console.error('Error fetching real-time data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch real-time predictions
  const fetchRealtimePredictions = async () => {
    try {
      const response = await fetch('/api/realtime/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timespan: 6,
          predictionType: 'both'
        })
      });

      const result = await response.json();

      if (result.success) {
        setRealtimePredictions(result.data.predictions);
      } else {
        console.error('Failed to fetch real-time predictions:', result.error);
      }
    } catch (err) {
      console.error('Error fetching real-time predictions:', err);
    }
  };

  // Force refresh all data sources
  const forceRefresh = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/realtime', {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchRealtimeData();
        await fetchRealtimePredictions();
      }
    } catch (err) {
      setError('Failed to refresh data sources');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchRealtimeData();
    fetchRealtimePredictions();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRealtimeData();
        fetchRealtimePredictions();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusIcon = (isStale: boolean, ageMinutes: number) => {
    if (ageMinutes < 5) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (ageMinutes < 30) return <Activity className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Data Dashboard</h2>
          <p className="text-muted-foreground">
            Live data integration with automatic updates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            {autoRefresh ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={forceRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Freshness Status */}
      {dataFreshness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Data Freshness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(dataFreshness.isStale, dataFreshness.ageMinutes)}
                <div>
                  <p className="text-sm font-medium">Last Update</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(dataFreshness.lastUpdate)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Next Update</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(dataFreshness.nextUpdate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={dataFreshness.isStale ? 'destructive' : 'default'}>
                  {dataFreshness.isStale ? 'Stale' : 'Fresh'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Data */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestData.revenue)}</div>
              <p className="text-xs text-muted-foreground">
                From {latestData.source}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestData.customers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Confidence: {(latestData.confidence * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(latestData.churn * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Monthly churn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestData.acquisition}</div>
              <p className="text-xs text-muted-foreground">
                Recent acquisitions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-Time Predictions */}
      {realtimePredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Live Predictions</CardTitle>
            <CardDescription>
              Predictions generated from real-time data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {realtimePredictions.slice(0, 3).map((prediction, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(prediction.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {prediction.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(prediction.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {prediction.customers.toLocaleString()} customers
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        prediction.confidence >= 80 ? 'default' :
                        prediction.confidence >= 60 ? 'secondary' : 'destructive'
                      }
                    >
                      {prediction.confidence.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources Status */}
      {dataFreshness && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>
              Status of connected data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(dataFreshness.sources).map(([sourceId, status]) => (
                <div key={sourceId} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.isStale, status.ageMinutes)}
                    <span className="font-medium capitalize">{sourceId.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimeAgo(status.lastUpdate)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
