import { PredictionResult } from './ml-predictor';
import { ValidationMetrics } from './prediction-validator';

export interface PredictionRecord {
  id: string;
  timestamp: string;
  predictions: PredictionResult[];
  actualData?: {
    date: string;
    revenue: number;
    customers: number;
  }[];
  accuracy?: ValidationMetrics;
  feedback?: {
    userRating: number; // 1-5 scale
    comments: string;
    actualOutcome: 'better' | 'worse' | 'as_expected';
  };
}

export interface AccuracyTrend {
  period: string;
  accuracy: number;
  mape: number;
  bias: number;
  predictionCount: number;
}

export class PredictionTracker {
  private static storageKey = 'prediction_tracker_records';

  /**
   * Store a prediction record for future accuracy tracking
   */
  static storePrediction(predictions: PredictionResult[]): string {
    const record: PredictionRecord = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      predictions: [...predictions]
    };

    const existingRecords = this.getAllRecords();
    existingRecords.push(record);
    
    // Keep only last 100 records to prevent storage bloat
    if (existingRecords.length > 100) {
      existingRecords.splice(0, existingRecords.length - 100);
    }

    this.saveRecords(existingRecords);
    return record.id;
  }

  /**
   * Update a prediction record with actual results
   */
  static updateWithActuals(
    recordId: string, 
    actualData: { date: string; revenue: number; customers: number }[]
  ): boolean {
    const records = this.getAllRecords();
    const recordIndex = records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) return false;

    records[recordIndex].actualData = actualData;
    
    // Calculate accuracy metrics
    const accuracy = this.calculateAccuracy(records[recordIndex].predictions, actualData);
    records[recordIndex].accuracy = accuracy;

    this.saveRecords(records);
    return true;
  }

  /**
   * Add user feedback to a prediction record
   */
  static addFeedback(
    recordId: string,
    feedback: {
      userRating: number;
      comments: string;
      actualOutcome: 'better' | 'worse' | 'as_expected';
    }
  ): boolean {
    const records = this.getAllRecords();
    const recordIndex = records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) return false;

    records[recordIndex].feedback = feedback;
    this.saveRecords(records);
    return true;
  }

  /**
   * Get accuracy trends over time
   */
  static getAccuracyTrends(months: number = 6): AccuracyTrend[] {
    const records = this.getAllRecords();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const recentRecords = records.filter(r => 
      new Date(r.timestamp) >= cutoffDate && r.accuracy
    );

    // Group by month
    const monthlyData: { [key: string]: PredictionRecord[] } = {};
    
    recentRecords.forEach(record => {
      const date = new Date(record.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(record);
    });

    // Calculate trends
    const trends: AccuracyTrend[] = [];
    
    Object.entries(monthlyData).forEach(([period, records]) => {
      const avgAccuracy = records.reduce((sum, r) => sum + (r.accuracy?.accuracy || 0), 0) / records.length;
      const avgMape = records.reduce((sum, r) => sum + (r.accuracy?.mape || 0), 0) / records.length;
      const avgBias = records.reduce((sum, r) => sum + (r.accuracy?.bias || 0), 0) / records.length;

      trends.push({
        period,
        accuracy: avgAccuracy,
        mape: avgMape,
        bias: avgBias,
        predictionCount: records.length
      });
    });

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get overall accuracy statistics
   */
  static getOverallStats(): {
    totalPredictions: number;
    averageAccuracy: number;
    averageMape: number;
    averageBias: number;
    feedbackCount: number;
    averageUserRating: number;
  } {
    const records = this.getAllRecords();
    const recordsWithAccuracy = records.filter(r => r.accuracy);
    const recordsWithFeedback = records.filter(r => r.feedback);

    const totalPredictions = records.length;
    const averageAccuracy = recordsWithAccuracy.length > 0 
      ? recordsWithAccuracy.reduce((sum, r) => sum + (r.accuracy?.accuracy || 0), 0) / recordsWithAccuracy.length
      : 0;
    const averageMape = recordsWithAccuracy.length > 0
      ? recordsWithAccuracy.reduce((sum, r) => sum + (r.accuracy?.mape || 0), 0) / recordsWithAccuracy.length
      : 0;
    const averageBias = recordsWithAccuracy.length > 0
      ? recordsWithAccuracy.reduce((sum, r) => sum + (r.accuracy?.bias || 0), 0) / recordsWithAccuracy.length
      : 0;
    const feedbackCount = recordsWithFeedback.length;
    const averageUserRating = recordsWithFeedback.length > 0
      ? recordsWithFeedback.reduce((sum, r) => sum + (r.feedback?.userRating || 0), 0) / recordsWithFeedback.length
      : 0;

    return {
      totalPredictions,
      averageAccuracy,
      averageMape,
      averageBias,
      feedbackCount,
      averageUserRating
    };
  }

  /**
   * Get recommendations for improving accuracy
   */
  static getImprovementRecommendations(): string[] {
    const stats = this.getOverallStats();
    const trends = this.getAccuracyTrends(3);
    const recommendations: string[] = [];

    // Accuracy-based recommendations
    if (stats.averageAccuracy < 60) {
      recommendations.push('Low overall accuracy - consider adding more historical data');
    } else if (stats.averageAccuracy < 80) {
      recommendations.push('Moderate accuracy - review prediction models and data quality');
    }

    // Bias-based recommendations
    if (Math.abs(stats.averageBias) > 1000) {
      if (stats.averageBias > 0) {
        recommendations.push('Model consistently overestimates - adjust growth assumptions');
      } else {
        recommendations.push('Model consistently underestimates - review conservative assumptions');
      }
    }

    // Trend-based recommendations
    if (trends.length >= 2) {
      const recentTrend = trends[trends.length - 1];
      const previousTrend = trends[trends.length - 2];
      
      if (recentTrend.accuracy < previousTrend.accuracy) {
        recommendations.push('Accuracy declining - review recent changes and data quality');
      }
    }

    // Feedback-based recommendations
    if (stats.feedbackCount > 0 && stats.averageUserRating < 3) {
      recommendations.push('Low user satisfaction - review prediction methodology');
    }

    // Data volume recommendations
    if (stats.totalPredictions < 10) {
      recommendations.push('Limited prediction history - more data needed for reliable accuracy metrics');
    }

    return recommendations;
  }

  /**
   * Calculate accuracy metrics for a prediction record
   */
  private static calculateAccuracy(
    predictions: PredictionResult[],
    actualData: { date: string; revenue: number; customers: number }[]
  ): ValidationMetrics {
    if (predictions.length === 0 || actualData.length === 0) {
      return { mape: 0, rmse: 0, mae: 0, bias: 0, accuracy: 0 };
    }

    const n = Math.min(predictions.length, actualData.length);
    let mapeSum = 0;
    let rmseSum = 0;
    let maeSum = 0;
    let biasSum = 0;

    for (let i = 0; i < n; i++) {
      const pred = predictions[i];
      const actual = actualData[i];

      // Revenue metrics
      const revenueError = Math.abs(pred.revenue - actual.revenue);
      const revenuePercentageError = actual.revenue > 0 ? (revenueError / actual.revenue) * 100 : 0;
      const revenueSquaredError = Math.pow(pred.revenue - actual.revenue, 2);
      const revenueBias = pred.revenue - actual.revenue;

      // Customer metrics
      const customerError = Math.abs(pred.customers - actual.customers);
      const customerPercentageError = actual.customers > 0 ? (customerError / actual.customers) * 100 : 0;
      const customerSquaredError = Math.pow(pred.customers - actual.customers, 2);
      const customerBias = pred.customers - actual.customers;

      // Aggregate metrics
      mapeSum += (revenuePercentageError + customerPercentageError) / 2;
      rmseSum += (revenueSquaredError + customerSquaredError) / 2;
      maeSum += (revenueError + customerError) / 2;
      biasSum += (revenueBias + customerBias) / 2;
    }

    const mape = mapeSum / n;
    const rmse = Math.sqrt(rmseSum / n);
    const mae = maeSum / n;
    const bias = biasSum / n;
    const accuracy = Math.max(0, 100 - mape);

    return { mape, rmse, mae, bias, accuracy };
  }

  /**
   * Get all prediction records
   */
  private static getAllRecords(): PredictionRecord[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading prediction records:', error);
      return [];
    }
  }

  /**
   * Save prediction records
   */
  private static saveRecords(records: PredictionRecord[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving prediction records:', error);
    }
  }

  /**
   * Generate unique ID for prediction records
   */
  private static generateId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all prediction records (for testing/reset)
   */
  static clearAllRecords(): void {
    localStorage.removeItem(this.storageKey);
  }
}
