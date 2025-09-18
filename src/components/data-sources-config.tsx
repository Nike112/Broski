'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Plus, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Key,
  Clock
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'crm' | 'analytics' | 'financial' | 'marketing' | 'api' | 'webhook';
  endpoint?: string;
  apiKey?: string;
  refreshInterval: number;
  lastUpdated?: string;
  isActive: boolean;
  config: {
    [key: string]: any;
  };
}

export function DataSourcesConfig() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSource, setNewSource] = useState<Partial<DataSource>>({
    name: '',
    type: 'api',
    refreshInterval: 30,
    isActive: true,
    config: {}
  });
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  // Load data sources on mount
  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      const response = await fetch('/api/realtime');
      const result = await response.json();
      
      if (result.success) {
        setDataSources(result.data.sources || []);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
    }
  };

  const addDataSource = async () => {
    if (!newSource.name || !newSource.type) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/realtime/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSource)
      });

      if (response.ok) {
        setNewSource({
          name: '',
          type: 'api',
          refreshInterval: 30,
          isActive: true,
          config: {}
        });
        setIsAddingNew(false);
        loadDataSources();
      } else {
        alert('Failed to add data source');
      }
    } catch (error) {
      console.error('Error adding data source:', error);
      alert('Error adding data source');
    }
  };

  const removeDataSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to remove this data source?')) {
      return;
    }

    try {
      const response = await fetch(`/api/realtime/sources/${sourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadDataSources();
      } else {
        alert('Failed to remove data source');
      }
    } catch (error) {
      console.error('Error removing data source:', error);
      alert('Error removing data source');
    }
  };

  const toggleDataSource = async (sourceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/realtime/sources/${sourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        loadDataSources();
      } else {
        alert('Failed to update data source');
      }
    } catch (error) {
      console.error('Error updating data source:', error);
      alert('Error updating data source');
    }
  };

  const testDataSource = async (sourceId: string) => {
    setTestingSource(sourceId);
    
    try {
      const response = await fetch(`/api/realtime/sources/${sourceId}/test`, {
        method: 'POST'
      });

      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        [sourceId]: result.success
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [sourceId]: false
      }));
    } finally {
      setTestingSource(null);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'crm': return '👥';
      case 'analytics': return '📊';
      case 'financial': return '💰';
      case 'marketing': return '📢';
      case 'api': return '🔌';
      case 'webhook': return '🪝';
      default: return '📡';
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'crm': return 'bg-blue-100 text-blue-800';
      case 'analytics': return 'bg-green-100 text-green-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      case 'api': return 'bg-gray-100 text-gray-800';
      case 'webhook': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Sources Configuration</h2>
          <p className="text-muted-foreground">
            Connect your business systems for real-time data updates
          </p>
        </div>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Add New Data Source */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Data Source</CardTitle>
            <CardDescription>
              Configure a new data source for real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sourceName">Source Name</Label>
                <Input
                  id="sourceName"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="e.g., Stripe Payments"
                />
              </div>
              <div>
                <Label htmlFor="sourceType">Source Type</Label>
                <Select
                  value={newSource.type}
                  onValueChange={(value) => setNewSource({ ...newSource, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial (Stripe, PayPal)</SelectItem>
                    <SelectItem value="crm">CRM (HubSpot, Salesforce)</SelectItem>
                    <SelectItem value="analytics">Analytics (Google Analytics, Mixpanel)</SelectItem>
                    <SelectItem value="marketing">Marketing (Facebook Ads, Google Ads)</SelectItem>
                    <SelectItem value="api">Custom API</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="endpoint"
                  value={newSource.endpoint || ''}
                  onChange={(e) => setNewSource({ ...newSource, endpoint: e.target.value })}
                  placeholder="https://api.example.com/data"
                />
              </div>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={newSource.apiKey || ''}
                  onChange={(e) => setNewSource({ ...newSource, apiKey: e.target.value })}
                  placeholder="Your API key"
                />
              </div>
              <div>
                <Label htmlFor="refreshInterval">Refresh Interval (minutes)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  value={newSource.refreshInterval}
                  onChange={(e) => setNewSource({ ...newSource, refreshInterval: parseInt(e.target.value) })}
                  min="1"
                  max="1440"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newSource.isActive}
                  onCheckedChange={(checked) => setNewSource({ ...newSource, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addDataSource}>
                Add Data Source
              </Button>
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSourceIcon(source.type)}</span>
                  <div>
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <Badge className={getSourceColor(source.type)}>
                      {source.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={source.isActive}
                    onCheckedChange={(checked) => toggleDataSource(source.id, checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Updates every {source.refreshInterval} minutes
                </div>
                {source.lastUpdated && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Last update: {new Date(source.lastUpdated).toLocaleString()}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testDataSource(source.id)}
                  disabled={testingSource === source.id}
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  {testingSource === source.id ? 'Testing...' : 'Test'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDataSource(source.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              {testResults[source.id] !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  {testResults[source.id] ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Connection successful</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Connection failed</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Setup Guides */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guides</CardTitle>
          <CardDescription>
            Popular integrations with step-by-step instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">💰 Stripe Integration</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get real-time revenue and customer data from Stripe payments
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Setup Guide
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">👥 HubSpot CRM</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Sync customer data and deal information from HubSpot
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Setup Guide
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">📊 Google Analytics</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Track user behavior and conversion metrics
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Setup Guide
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🔌 Custom API</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Connect any REST API with your business data
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                API Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook URLs</CardTitle>
          <CardDescription>
            Use these URLs to receive instant data updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Stripe Webhook</p>
                <p className="text-sm text-muted-foreground">
                  For payment and subscription events
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Key className="h-3 w-3 mr-1" />
                Copy URL
              </Button>
            </div>
            <code className="text-xs text-muted-foreground mt-2 block">
              {window.location.origin}/api/webhooks/stripe
            </code>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">HubSpot Webhook</p>
                <p className="text-sm text-muted-foreground">
                  For contact and deal updates
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Key className="h-3 w-3 mr-1" />
                Copy URL
              </Button>
            </div>
            <code className="text-xs text-muted-foreground mt-2 block">
              {window.location.origin}/api/webhooks/hubspot
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
