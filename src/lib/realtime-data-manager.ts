import { HistoricalData } from './excel-parser';
import { PredictionResult } from './ml-predictor';

export interface DataSource {
  id: string;
  name: string;
  type: 'crm' | 'analytics' | 'financial' | 'marketing' | 'api' | 'webhook';
  endpoint?: string;
  apiKey?: string;
  refreshInterval: number; // minutes
  lastUpdated?: string;
  isActive: boolean;
  config: {
    [key: string]: any;
  };
}

export interface RealtimeDataPoint {
  timestamp: string;
  revenue: number;
  customers: number;
  churn: number;
  acquisition: number;
  source: string;
  confidence: number; // Data quality confidence
}

export interface DataFreshness {
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

export class RealtimeDataManager {
  private static dataSources: DataSource[] = [];
  private static realtimeData: RealtimeDataPoint[] = [];
  private static updateInterval: NodeJS.Timeout | null = null;
  private static webhookHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * Initialize real-time data sources
   */
  static initialize(): void {
    this.setupDefaultDataSources();
    this.startDataRefresh();
    this.setupWebhookEndpoints();
  }

  /**
   * Setup default data sources for common integrations
   */
  private static setupDefaultDataSources(): void {
    const defaultSources: DataSource[] = [
      {
        id: 'stripe',
        name: 'Stripe Payments',
        type: 'financial',
        endpoint: '/api/stripe/revenue',
        refreshInterval: 15, // 15 minutes
        isActive: true,
        config: {
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          apiKey: process.env.STRIPE_API_KEY
        }
      },
      {
        id: 'hubspot',
        name: 'HubSpot CRM',
        type: 'crm',
        endpoint: '/api/hubspot/customers',
        refreshInterval: 30, // 30 minutes
        isActive: true,
        config: {
          apiKey: process.env.HUBSPOT_API_KEY,
          portalId: process.env.HUBSPOT_PORTAL_ID
        }
      },
      {
        id: 'google_analytics',
        name: 'Google Analytics',
        type: 'analytics',
        endpoint: '/api/analytics/metrics',
        refreshInterval: 60, // 1 hour
        isActive: true,
        config: {
          propertyId: process.env.GA_PROPERTY_ID,
          credentials: process.env.GA_CREDENTIALS
        }
      },
      {
        id: 'salesforce',
        name: 'Salesforce CRM',
        type: 'crm',
        endpoint: '/api/salesforce/opportunities',
        refreshInterval: 20, // 20 minutes
        isActive: true,
        config: {
          instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
          accessToken: process.env.SALESFORCE_ACCESS_TOKEN
        }
      },
      {
        id: 'mixpanel',
        name: 'Mixpanel Analytics',
        type: 'analytics',
        endpoint: '/api/mixpanel/events',
        refreshInterval: 45, // 45 minutes
        isActive: true,
        config: {
          projectId: process.env.MIXPANEL_PROJECT_ID,
          apiSecret: process.env.MIXPANEL_API_SECRET
        }
      }
    ];

    this.dataSources = defaultSources;
  }

  /**
   * Start automatic data refresh
   */
  private static startDataRefresh(): void {
    // Refresh data every 5 minutes
    this.updateInterval = setInterval(() => {
      this.refreshAllDataSources();
    }, 5 * 60 * 1000);

    // Initial data fetch
    this.refreshAllDataSources();
  }

  /**
   * Refresh data from all active sources
   */
  private static async refreshAllDataSources(): Promise<void> {
    const activeSources = this.dataSources.filter(source => source.isActive);
    
    const refreshPromises = activeSources.map(source => 
      this.refreshDataSource(source).catch(error => {
        console.error(`Error refreshing ${source.name}:`, error);
        return null;
      })
    );

    await Promise.all(refreshPromises);
    
    // Update data freshness
    this.updateDataFreshness();
  }

  /**
   * Refresh data from a specific source
   */
  private static async refreshDataSource(source: DataSource): Promise<void> {
    try {
      const response = await fetch(source.endpoint!, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${source.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const processedData = this.processDataSourceData(source, data);
      
      // Add to real-time data
      this.addRealtimeDataPoint(processedData);
      
      // Update source last updated time
      source.lastUpdated = new Date().toISOString();
      
    } catch (error) {
      console.error(`Failed to refresh ${source.name}:`, error);
    }
  }

  /**
   * Process data from different source types
   */
  private static processDataSourceData(source: DataSource, rawData: any): RealtimeDataPoint {
    const timestamp = new Date().toISOString();
    
    switch (source.type) {
      case 'financial':
        return {
          timestamp,
          revenue: rawData.revenue || rawData.amount || 0,
          customers: rawData.customers || rawData.subscriptions || 0,
          churn: rawData.churn_rate || 0,
          acquisition: rawData.new_customers || 0,
          source: source.id,
          confidence: rawData.confidence || 0.9
        };
        
      case 'crm':
        return {
          timestamp,
          revenue: rawData.pipeline_value || rawData.revenue || 0,
          customers: rawData.total_customers || rawData.contacts || 0,
          churn: rawData.churn_rate || 0,
          acquisition: rawData.new_leads || rawData.new_customers || 0,
          source: source.id,
          confidence: rawData.confidence || 0.8
        };
        
      case 'analytics':
        return {
          timestamp,
          revenue: rawData.revenue || 0,
          customers: rawData.active_users || rawData.customers || 0,
          churn: rawData.bounce_rate || 0,
          acquisition: rawData.new_users || rawData.signups || 0,
          source: source.id,
          confidence: rawData.confidence || 0.7
        };
        
      default:
        return {
          timestamp,
          revenue: rawData.revenue || 0,
          customers: rawData.customers || 0,
          churn: rawData.churn || 0,
          acquisition: rawData.acquisition || 0,
          source: source.id,
          confidence: 0.5
        };
    }
  }

  /**
   * Add real-time data point
   */
  private static addRealtimeDataPoint(dataPoint: RealtimeDataPoint): void {
    this.realtimeData.push(dataPoint);
    
    // Keep only last 1000 data points to prevent memory issues
    if (this.realtimeData.length > 1000) {
      this.realtimeData = this.realtimeData.slice(-1000);
    }
  }

  /**
   * Get latest real-time data
   */
  static getLatestData(): RealtimeDataPoint | null {
    if (this.realtimeData.length === 0) return null;
    
    // Get the most recent data point
    return this.realtimeData[this.realtimeData.length - 1];
  }

  /**
   * Get real-time data for a specific time range
   */
  static getDataForRange(hours: number = 24): RealtimeDataPoint[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return this.realtimeData.filter(point => 
      new Date(point.timestamp) >= cutoffTime
    );
  }

  /**
   * Convert real-time data to historical format for predictions
   */
  static getHistoricalDataFromRealtime(hours: number = 24 * 30): HistoricalData[] {
    const realtimeData = this.getDataForRange(hours);
    
    // Group by day and aggregate
    const dailyData: { [date: string]: RealtimeDataPoint[] } = {};
    
    realtimeData.forEach(point => {
      const date = point.timestamp.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(point);
    });
    
    // Convert to HistoricalData format
    return Object.entries(dailyData).map(([date, points]) => {
      // Calculate weighted averages based on confidence
      const totalConfidence = points.reduce((sum, p) => sum + p.confidence, 0);
      
      const revenue = points.reduce((sum, p) => sum + (p.revenue * p.confidence), 0) / totalConfidence;
      const customers = points.reduce((sum, p) => sum + (p.customers * p.confidence), 0) / totalConfidence;
      const churn = points.reduce((sum, p) => sum + (p.churn * p.confidence), 0) / totalConfidence;
      const acquisition = points.reduce((sum, p) => sum + (p.acquisition * p.confidence), 0) / totalConfidence;
      
      return {
        date,
        revenue: Math.round(revenue),
        customers: Math.round(customers),
        churn: Math.round(churn * 100) / 100,
        acquisition: Math.round(acquisition)
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Setup webhook endpoints for instant updates
   */
  private static setupWebhookEndpoints(): void {
    // Stripe webhook
    this.webhookHandlers.set('stripe', (data) => {
      if (data.type === 'invoice.payment_succeeded') {
        this.addRealtimeDataPoint({
          timestamp: new Date().toISOString(),
          revenue: data.data.object.amount_paid / 100, // Convert from cents
          customers: 1, // New payment
          churn: 0,
          acquisition: 0,
          source: 'stripe_webhook',
          confidence: 1.0
        });
      }
    });

    // HubSpot webhook
    this.webhookHandlers.set('hubspot', (data) => {
      if (data.subscriptionType === 'contact.creation') {
        this.addRealtimeDataPoint({
          timestamp: new Date().toISOString(),
          revenue: 0,
          customers: 1,
          churn: 0,
          acquisition: 1,
          source: 'hubspot_webhook',
          confidence: 0.9
        });
      }
    });

    // Salesforce webhook
    this.webhookHandlers.set('salesforce', (data) => {
      if (data.eventType === 'OpportunityWon') {
        this.addRealtimeDataPoint({
          timestamp: new Date().toISOString(),
          revenue: data.opportunity.amount || 0,
          customers: 1,
          churn: 0,
          acquisition: 1,
          source: 'salesforce_webhook',
          confidence: 0.95
        });
      }
    });
  }

  /**
   * Handle webhook data
   */
  static handleWebhook(sourceId: string, data: any): void {
    const handler = this.webhookHandlers.get(sourceId);
    if (handler) {
      handler(data);
    }
  }

  /**
   * Get data freshness information
   */
  static getDataFreshness(): DataFreshness {
    const now = new Date();
    const sources: { [sourceId: string]: any } = {};
    
    this.dataSources.forEach(source => {
      const lastUpdate = source.lastUpdated ? new Date(source.lastUpdated) : null;
      const ageMinutes = lastUpdate ? (now.getTime() - lastUpdate.getTime()) / (1000 * 60) : Infinity;
      const isStale = ageMinutes > source.refreshInterval;
      
      sources[source.id] = {
        lastUpdate: source.lastUpdated || 'Never',
        ageMinutes: Math.round(ageMinutes),
        isStale
      };
    });
    
    const latestUpdate = this.realtimeData.length > 0 
      ? this.realtimeData[this.realtimeData.length - 1].timestamp 
      : null;
    
    const latestAgeMinutes = latestUpdate 
      ? (now.getTime() - new Date(latestUpdate).getTime()) / (1000 * 60)
      : Infinity;
    
    const nextUpdate = new Date(now.getTime() + 5 * 60 * 1000); // Next update in 5 minutes
    
    return {
      lastUpdate: latestUpdate || 'Never',
      ageMinutes: Math.round(latestAgeMinutes),
      isStale: latestAgeMinutes > 30, // Consider stale if older than 30 minutes
      nextUpdate: nextUpdate.toISOString(),
      sources
    };
  }

  /**
   * Update data freshness
   */
  private static updateDataFreshness(): void {
    // This could trigger UI updates or notifications
    const freshness = this.getDataFreshness();
    
    if (freshness.isStale) {
      console.warn('Data is stale, consider refreshing sources');
    }
  }

  /**
   * Add custom data source
   */
  static addDataSource(source: DataSource): void {
    this.dataSources.push(source);
  }

  /**
   * Remove data source
   */
  static removeDataSource(sourceId: string): void {
    this.dataSources = this.dataSources.filter(s => s.id !== sourceId);
  }

  /**
   * Get all data sources
   */
  static getDataSources(): DataSource[] {
    return [...this.dataSources];
  }

  /**
   * Force refresh all data sources
   */
  static async forceRefresh(): Promise<void> {
    await this.refreshAllDataSources();
  }

  /**
   * Get real-time prediction with live data
   */
  static async getRealtimePrediction(
    timespan: number,
    predictionType: 'revenue' | 'customers' | 'both' = 'both'
  ): Promise<PredictionResult[]> {
    // Get latest real-time data
    const historicalData = this.getHistoricalDataFromRealtime();
    
    if (historicalData.length < 3) {
      throw new Error('Insufficient real-time data for predictions. Need at least 3 data points.');
    }
    
    // Import MLPredictor dynamically to avoid circular imports
    const { MLPredictor } = await import('./ml-predictor');
    
    return MLPredictor.predict({
      data: historicalData,
      timespan,
      predictionType,
      includeScenarios: true,
      includeExternalFactors: true,
      externalFactors: {
        marketGrowth: 0.15,
        economicIndex: 0.85,
        competitivePressure: 0.3,
        seasonality: [1.2, 0.8, 1.1, 1.0, 0.9, 1.3, 1.1, 0.7, 0.8, 1.0, 1.2, 1.4]
      }
    });
  }

  /**
   * Cleanup resources
   */
  static cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
