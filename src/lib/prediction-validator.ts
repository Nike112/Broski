import { HistoricalData } from './excel-parser';
import { PredictionResult } from './ml-predictor';

export interface ValidationMetrics {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Squared Error
  mae: number;  // Mean Absolute Error
  bias: number; // Systematic over/under estimation
  accuracy: number; // Overall accuracy percentage
}

export interface ValidationResult {
  metrics: ValidationMetrics;
  predictions: PredictionResult[];
  actuals: { date: string; revenue: number; customers: number }[];
  errors: { date: string; revenueError: number; customerError: number }[];
  recommendations: string[];
}

export class PredictionValidator {
  /**
   * Perform backtesting on historical data to validate prediction accuracy
   */
  static backtest(
    historicalData: HistoricalData[],
    predictionMonths: number = 3,
    trainTestSplit: number = 0.8
  ): ValidationResult {
    if (historicalData.length < 6) {
      throw new Error('Need at least 6 months of data for backtesting');
    }

    const splitIndex = Math.floor(historicalData.length * trainTestSplit);
    const trainingData = historicalData.slice(0, splitIndex);
    const testData = historicalData.slice(splitIndex);

    // Generate predictions for the test period
    const predictions: PredictionResult[] = [];
    const actuals: { date: string; revenue: number; customers: number }[] = [];
    const errors: { date: string; revenueError: number; customerError: number }[] = [];

    for (let i = 0; i < Math.min(predictionMonths, testData.length); i++) {
      const testPoint = testData[i];
      const monthsAhead = i + 1;
      
      // Generate prediction using training data up to this point
      const currentTrainingData = [...trainingData, ...testData.slice(0, i)];
      
      // Simple prediction for validation (using trend)
      const revenuePrediction = this.predictRevenue(currentTrainingData, monthsAhead);
      const customerPrediction = this.predictCustomers(currentTrainingData, monthsAhead);
      
      predictions.push({
        date: testPoint.date,
        revenue: revenuePrediction,
        customers: customerPrediction,
        confidence: 75, // Default confidence for validation
        method: 'Backtest Validation'
      });

      actuals.push({
        date: testPoint.date,
        revenue: testPoint.revenue,
        customers: testPoint.customers
      });

      // Calculate errors
      const revenueError = ((revenuePrediction - testPoint.revenue) / testPoint.revenue) * 100;
      const customerError = ((customerPrediction - testPoint.customers) / testPoint.customers) * 100;
      
      errors.push({
        date: testPoint.date,
        revenueError,
        customerError
      });
    }

    // Calculate validation metrics
    const metrics = this.calculateValidationMetrics(predictions, actuals);
    const recommendations = this.generateRecommendations(metrics, historicalData);

    return {
      metrics,
      predictions,
      actuals,
      errors,
      recommendations
    };
  }

  /**
   * Cross-validation to test model robustness
   */
  static crossValidate(
    historicalData: HistoricalData[],
    folds: number = 5
  ): ValidationResult[] {
    if (historicalData.length < 10) {
      throw new Error('Need at least 10 months of data for cross-validation');
    }

    const results: ValidationResult[] = [];
    const foldSize = Math.floor(historicalData.length / folds);

    for (let fold = 0; fold < folds; fold++) {
      const startIndex = fold * foldSize;
      const endIndex = Math.min(startIndex + foldSize, historicalData.length);
      
      const testData = historicalData.slice(startIndex, endIndex);
      const trainingData = [
        ...historicalData.slice(0, startIndex),
        ...historicalData.slice(endIndex)
      ];

      if (trainingData.length < 3 || testData.length < 1) continue;

      const foldResult = this.backtest(
        [...trainingData, ...testData],
        testData.length,
        0.8
      );

      results.push(foldResult);
    }

    return results;
  }

  /**
   * Calculate validation metrics
   */
  private static calculateValidationMetrics(
    predictions: PredictionResult[],
    actuals: { date: string; revenue: number; customers: number }[]
  ): ValidationMetrics {
    if (predictions.length !== actuals.length) {
      throw new Error('Predictions and actuals must have the same length');
    }

    const n = predictions.length;
    let mapeSum = 0;
    let rmseSum = 0;
    let maeSum = 0;
    let biasSum = 0;

    for (let i = 0; i < n; i++) {
      const pred = predictions[i];
      const actual = actuals[i];

      // Revenue metrics
      const revenueError = Math.abs(pred.revenue - actual.revenue);
      const revenuePercentageError = (revenueError / actual.revenue) * 100;
      const revenueSquaredError = Math.pow(pred.revenue - actual.revenue, 2);
      const revenueBias = pred.revenue - actual.revenue;

      // Customer metrics
      const customerError = Math.abs(pred.customers - actual.customers);
      const customerPercentageError = (customerError / actual.customers) * 100;
      const customerSquaredError = Math.pow(pred.customers - actual.customers, 2);
      const customerBias = pred.customers - actual.customers;

      // Aggregate metrics (average of revenue and customer metrics)
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
   * Generate recommendations based on validation results
   */
  private static generateRecommendations(
    metrics: ValidationMetrics,
    data: HistoricalData[]
  ): string[] {
    const recommendations: string[] = [];

    // Accuracy-based recommendations
    if (metrics.accuracy < 60) {
      recommendations.push('Low prediction accuracy - consider adding more historical data');
    } else if (metrics.accuracy < 80) {
      recommendations.push('Moderate prediction accuracy - data quality could be improved');
    } else {
      recommendations.push('Good prediction accuracy - model is performing well');
    }

    // Bias-based recommendations
    if (Math.abs(metrics.bias) > 1000) {
      if (metrics.bias > 0) {
        recommendations.push('Model tends to overestimate - consider more conservative assumptions');
      } else {
        recommendations.push('Model tends to underestimate - consider more optimistic assumptions');
      }
    }

    // Data quality recommendations
    if (data.length < 12) {
      recommendations.push('Limited historical data - collect 12+ months for better accuracy');
    }

    // Volatility recommendations
    const revenues = data.map(d => d.revenue);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const variance = revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / revenues.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    if (coefficientOfVariation > 0.3) {
      recommendations.push('High revenue volatility detected - consider external factors');
    }

    // MAPE recommendations
    if (metrics.mape > 20) {
      recommendations.push('High prediction error - review model assumptions and data quality');
    }

    return recommendations;
  }

  /**
   * Simple revenue prediction for validation
   */
  private static predictRevenue(data: HistoricalData[], monthsAhead: number): number {
    if (data.length < 2) return 0;

    const revenues = data.map(d => d.revenue);
    const lastRevenue = revenues[revenues.length - 1];
    
    // Calculate growth rate
    const firstRevenue = revenues[0];
    const periods = revenues.length - 1;
    const growthRate = periods > 0 ? Math.pow(lastRevenue / firstRevenue, 1 / periods) - 1 : 0;
    
    // Apply growth rate
    return lastRevenue * Math.pow(1 + growthRate, monthsAhead);
  }

  /**
   * Simple customer prediction for validation
   */
  private static predictCustomers(data: HistoricalData[], monthsAhead: number): number {
    if (data.length < 2) return 0;

    const customers = data.map(d => d.customers);
    const lastCustomers = customers[customers.length - 1];
    
    // Calculate growth rate
    const firstCustomers = customers[0];
    const periods = customers.length - 1;
    const growthRate = periods > 0 ? Math.pow(lastCustomers / firstCustomers, 1 / periods) - 1 : 0;
    
    // Apply growth rate
    return lastCustomers * Math.pow(1 + growthRate, monthsAhead);
  }

  /**
   * Generate validation summary
   */
  static generateValidationSummary(results: ValidationResult[]): string {
    if (results.length === 0) return 'No validation results available';

    const avgAccuracy = results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length;
    const avgMape = results.reduce((sum, r) => sum + r.metrics.mape, 0) / results.length;
    const avgBias = results.reduce((sum, r) => sum + r.metrics.bias, 0) / results.length;

    return `Validation Summary:
    • Average Accuracy: ${avgAccuracy.toFixed(1)}%
    • Average MAPE: ${avgMape.toFixed(1)}%
    • Average Bias: ${avgBias.toFixed(0)}
    • Validation Folds: ${results.length}
    • Model Performance: ${avgAccuracy >= 80 ? 'Excellent' : avgAccuracy >= 60 ? 'Good' : 'Needs Improvement'}`;
  }
}
