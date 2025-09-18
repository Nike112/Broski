import { HistoricalData } from './excel-parser';

export interface PredictionResult {
  date: string;
  revenue: number;
  customers: number;
  confidence: number;
  method: string;
  // Enhanced accuracy features
  revenueRange?: {
    optimistic: number;
    pessimistic: number;
  };
  customerRange?: {
    optimistic: number;
    pessimistic: number;
  };
  scenarios?: {
    optimistic: { revenue: number; customers: number };
    realistic: { revenue: number; customers: number };
    pessimistic: { revenue: number; customers: number };
  };
  riskFactors?: string[];
  externalFactors?: {
    marketGrowth: number;
    economicIndex: number;
    competitivePressure: number;
    seasonality: number;
  };
}

export interface PredictionRequest {
  data: HistoricalData[];
  timespan: number; // months
  predictionType: 'revenue' | 'customers' | 'both';
  // Enhanced accuracy options
  includeScenarios?: boolean;
  includeExternalFactors?: boolean;
  externalFactors?: {
    marketGrowth?: number; // Industry growth rate (e.g., 0.15 for 15%)
    economicIndex?: number; // Economic health (0-1, where 1 is best)
    competitivePressure?: number; // Competition level (0-1, where 1 is high)
    seasonality?: number[]; // Monthly seasonality factors
  };
}

export class MLPredictor {
  static predict(request: PredictionRequest): PredictionResult[] {
    const { data, timespan, predictionType, includeScenarios = true, includeExternalFactors = true, externalFactors } = request;
    
    if (data.length < 3) {
      throw new Error('Need at least 3 data points for predictions');
    }

    const predictions: PredictionResult[] = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    // Preprocess data for better accuracy
    const preprocessedData = this.preprocessData(data);
    
    // Calculate multiple prediction methods for ensemble
    const revenueTrend = this.calculateAdvancedTrend(preprocessedData.map(d => d.revenue));
    const customerTrend = this.calculateAdvancedTrend(preprocessedData.map(d => d.customers));
    
    // Calculate seasonality with improved algorithm
    const revenueSeasonality = this.calculateAdvancedSeasonality(preprocessedData.map(d => d.revenue));
    const customerSeasonality = this.calculateAdvancedSeasonality(preprocessedData.map(d => d.customers));
    
    // Calculate volatility and momentum
    const revenueVolatility = this.calculateVolatility(preprocessedData.map(d => d.revenue));
    const customerVolatility = this.calculateVolatility(preprocessedData.map(d => d.customers));
    
    const revenueMomentum = this.calculateMomentum(preprocessedData.map(d => d.revenue));
    const customerMomentum = this.calculateMomentum(preprocessedData.map(d => d.customers));
    
    // Calculate confidence based on data quality and model performance
    const confidence = this.calculateAdvancedConfidence(preprocessedData);
    
    for (let i = 1; i <= timespan; i++) {
      const predictionDate = new Date(lastDate);
      predictionDate.setMonth(predictionDate.getMonth() + i);
      
      let revenue = 0;
      let customers = 0;
      let method = '';
      
      if (predictionType === 'revenue' || predictionType === 'both') {
        const ensembleResult = this.ensembleRevenuePrediction(
          preprocessedData, i, revenueTrend, revenueSeasonality, revenueVolatility, revenueMomentum
        );
        revenue = ensembleResult.value;
        method = ensembleResult.method;
      }
      
      if (predictionType === 'customers' || predictionType === 'both') {
        const ensembleResult = this.ensembleCustomerPrediction(
          preprocessedData, i, customerTrend, customerSeasonality, customerVolatility, customerMomentum
        );
        customers = ensembleResult.value;
        method = method ? `${method} + ${ensembleResult.method}` : ensembleResult.method;
      }
      
      // Calculate dynamic confidence based on prediction distance and data quality
      const dynamicConfidence = this.calculateDynamicConfidence(confidence, i, timespan, preprocessedData);
      
      // Calculate confidence intervals
      const revenueRange = this.calculateConfidenceInterval(revenue, dynamicConfidence);
      const customerRange = this.calculateConfidenceInterval(customers, dynamicConfidence);
      
      // Generate scenarios if requested
      let scenarios;
      if (includeScenarios) {
        scenarios = this.generateScenarios(
          preprocessedData, i, revenueTrend, customerTrend, 
          revenueSeasonality, customerSeasonality, externalFactors
        );
      }
      
      // Calculate risk factors
      const riskFactors = this.identifyRiskFactors(preprocessedData, i, dynamicConfidence, externalFactors);
      
      // Calculate external factors impact
      let externalFactorsImpact;
      if (includeExternalFactors && externalFactors) {
        externalFactorsImpact = this.calculateExternalFactorsImpact(externalFactors, i);
      }
      
      predictions.push({
        date: predictionDate.toISOString().split('T')[0],
        revenue: Math.round(revenue),
        customers: Math.round(customers),
        confidence: Math.max(0, Math.min(100, dynamicConfidence)),
        method: method || 'Ensemble ML',
        revenueRange,
        customerRange,
        scenarios,
        riskFactors,
        externalFactors: externalFactorsImpact
      });
    }
    
    return predictions;
  }

  // Data preprocessing for better accuracy
  private static preprocessData(data: HistoricalData[]): HistoricalData[] {
    // Remove outliers using IQR method
    const revenues = data.map(d => d.revenue);
    const customers = data.map(d => d.customers);
    
    const cleanRevenues = this.removeOutliers(revenues);
    const cleanCustomers = this.removeOutliers(customers);
    
    // Apply smoothing to reduce noise
    const smoothedRevenues = this.applySmoothing(cleanRevenues);
    const smoothedCustomers = this.applySmoothing(cleanCustomers);
    
    return data.map((d, index) => ({
      ...d,
      revenue: smoothedRevenues[index] || d.revenue,
      customers: smoothedCustomers[index] || d.customers
    }));
  }

  private static removeOutliers(values: number[]): number[] {
    if (values.length < 4) return values;
    
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.map(v => Math.max(lowerBound, Math.min(upperBound, v)));
  }

  private static applySmoothing(values: number[]): number[] {
    if (values.length < 3) return values;
    
    const smoothed = [...values];
    for (let i = 1; i < values.length - 1; i++) {
      smoothed[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
    }
    return smoothed;
  }

  // Advanced trend calculation with weighted regression
  private static calculateAdvancedTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    // Weight recent data more heavily
    const weights = x.map((_, i) => Math.pow(1.1, i));
    
    let weightedSumX = 0, weightedSumY = 0, weightedSumXY = 0, weightedSumXX = 0, totalWeight = 0;
    
    for (let i = 0; i < n; i++) {
      const w = weights[i];
      weightedSumX += w * x[i];
      weightedSumY += w * y[i];
      weightedSumXY += w * x[i] * y[i];
      weightedSumXX += w * x[i] * x[i];
      totalWeight += w;
    }
    
    const slope = (totalWeight * weightedSumXY - weightedSumX * weightedSumY) / 
                  (totalWeight * weightedSumXX - weightedSumX * weightedSumX);
    return slope;
  }

  private static calculateTrend(values: number[]): number {
    return this.calculateAdvancedTrend(values);
  }

  // Advanced seasonality calculation with multiple periods
  private static calculateAdvancedSeasonality(values: number[]): number[] {
    if (values.length < 12) return new Array(12).fill(0);
    
    // Calculate multiple seasonal periods (monthly, quarterly, yearly)
    const monthlySeasonality = this.calculateMonthlySeasonality(values);
    const quarterlySeasonality = this.calculateQuarterlySeasonality(values);
    
    // Combine seasonal patterns with weights
    return monthlySeasonality.map((monthly, index) => {
      const quarterly = quarterlySeasonality[Math.floor(index / 3)];
      return (monthly * 0.7) + (quarterly * 0.3);
    });
  }

  private static calculateMonthlySeasonality(values: number[]): number[] {
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    
    values.forEach((value, index) => {
      const month = index % 12;
      monthlyAverages[month] += value;
      monthlyCounts[month]++;
    });
    
    const overallAverage = values.reduce((a, b) => a + b, 0) / values.length;
    
    return monthlyAverages.map((avg, index) => {
      if (monthlyCounts[index] > 0) {
        return (avg / monthlyCounts[index]) / overallAverage - 1;
      }
      return 0;
    });
  }

  private static calculateQuarterlySeasonality(values: number[]): number[] {
    const quarterlyAverages = new Array(4).fill(0);
    const quarterlyCounts = new Array(4).fill(0);
    
    values.forEach((value, index) => {
      const quarter = Math.floor((index % 12) / 3);
      quarterlyAverages[quarter] += value;
      quarterlyCounts[quarter]++;
    });
    
    const overallAverage = values.reduce((a, b) => a + b, 0) / values.length;
    
    return quarterlyAverages.map((avg, index) => {
      if (quarterlyCounts[index] > 0) {
        return (avg / quarterlyCounts[index]) / overallAverage - 1;
      }
      return 0;
    });
  }

  private static calculateSeasonality(values: number[]): number[] {
    return this.calculateAdvancedSeasonality(values);
  }

  // Volatility calculation for uncertainty estimation
  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  // Momentum calculation for trend acceleration
  private static calculateMomentum(values: number[]): number {
    if (values.length < 4) return 0;
    
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  // Ensemble prediction combining multiple methods
  private static ensembleRevenuePrediction(
    data: HistoricalData[], 
    monthsAhead: number, 
    trend: number, 
    seasonality: number[], 
    volatility: number, 
    momentum: number
  ): { value: number; method: string } {
    const lastRevenue = data[data.length - 1].revenue;
    const lastDate = new Date(data[data.length - 1].date);
    const predictionDate = new Date(lastDate);
    predictionDate.setMonth(predictionDate.getMonth() + monthsAhead);
    
    // Method 1: Linear trend with seasonality
    let linearPrediction = lastRevenue + (trend * monthsAhead);
    const month = predictionDate.getMonth();
    const seasonalFactor = seasonality[month] || 0;
    linearPrediction = linearPrediction * (1 + seasonalFactor);
    
    // Method 2: Exponential growth with momentum
    const growthRate = this.calculateGrowthRate(data.map(d => d.revenue));
    const momentumAdjustedGrowth = growthRate + (momentum * 0.5);
    const exponentialPrediction = lastRevenue * Math.pow(1 + momentumAdjustedGrowth, monthsAhead);
    
    // Method 3: Moving average with volatility adjustment
    const recentValues = data.slice(-6).map(d => d.revenue);
    const movingAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const volatilityAdjustment = 1 + (volatility * 0.1 * Math.random() - 0.05);
    const movingAvgPrediction = movingAvg * Math.pow(1 + growthRate, monthsAhead) * volatilityAdjustment;
    
    // Method 4: ARIMA-like prediction (simplified)
    const arimaPrediction = this.calculateARIMAPrediction(data.map(d => d.revenue), monthsAhead);
    
    // Ensemble with weighted average
    const weights = [0.3, 0.25, 0.25, 0.2]; // Linear, Exponential, Moving Avg, ARIMA
    const ensembleValue = (
      linearPrediction * weights[0] +
      exponentialPrediction * weights[1] +
      movingAvgPrediction * weights[2] +
      arimaPrediction * weights[3]
    );
    
    return {
      value: Math.max(0, ensembleValue),
      method: 'Ensemble (Linear+Exp+MA+ARIMA)'
    };
  }

  private static ensembleCustomerPrediction(
    data: HistoricalData[], 
    monthsAhead: number, 
    trend: number, 
    seasonality: number[], 
    volatility: number, 
    momentum: number
  ): { value: number; method: string } {
    const lastCustomers = data[data.length - 1].customers;
    const lastDate = new Date(data[data.length - 1].date);
    const predictionDate = new Date(lastDate);
    predictionDate.setMonth(predictionDate.getMonth() + monthsAhead);
    
    // Similar ensemble approach for customers
    let linearPrediction = lastCustomers + (trend * monthsAhead);
    const month = predictionDate.getMonth();
    const seasonalFactor = seasonality[month] || 0;
    linearPrediction = linearPrediction * (1 + seasonalFactor);
    
    const growthRate = this.calculateGrowthRate(data.map(d => d.customers));
    const momentumAdjustedGrowth = growthRate + (momentum * 0.3);
    const exponentialPrediction = lastCustomers * Math.pow(1 + momentumAdjustedGrowth, monthsAhead);
    
    const recentValues = data.slice(-6).map(d => d.customers);
    const movingAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const movingAvgPrediction = movingAvg * Math.pow(1 + growthRate, monthsAhead);
    
    const arimaPrediction = this.calculateARIMAPrediction(data.map(d => d.customers), monthsAhead);
    
    const weights = [0.3, 0.25, 0.25, 0.2];
    const ensembleValue = (
      linearPrediction * weights[0] +
      exponentialPrediction * weights[1] +
      movingAvgPrediction * weights[2] +
      arimaPrediction * weights[3]
    );
    
    return {
      value: Math.max(0, ensembleValue),
      method: 'Ensemble (Linear+Exp+MA+ARIMA)'
    };
  }

  // Simplified ARIMA-like prediction
  private static calculateARIMAPrediction(values: number[], periods: number): number {
    if (values.length < 3) return values[values.length - 1] || 0;
    
    // Calculate first differences
    const firstDiff = [];
    for (let i = 1; i < values.length; i++) {
      firstDiff.push(values[i] - values[i - 1]);
    }
    
    // Calculate second differences
    const secondDiff = [];
    for (let i = 1; i < firstDiff.length; i++) {
      secondDiff.push(firstDiff[i] - firstDiff[i - 1]);
    }
    
    // Simple autoregressive component
    const lastValue = values[values.length - 1];
    const lastFirstDiff = firstDiff[firstDiff.length - 1] || 0;
    const lastSecondDiff = secondDiff[secondDiff.length - 1] || 0;
    
    // ARIMA(1,2,0) simplified prediction
    let prediction = lastValue;
    for (let i = 0; i < periods; i++) {
      prediction += lastFirstDiff + (lastSecondDiff * (i + 1));
    }
    
    return Math.max(0, prediction);
  }

  private static predictRevenue(data: HistoricalData[], monthsAhead: number, trend: number, seasonality: number[]): number {
    const lastRevenue = data[data.length - 1].revenue;
    const lastDate = new Date(data[data.length - 1].date);
    const predictionDate = new Date(lastDate);
    predictionDate.setMonth(predictionDate.getMonth() + monthsAhead);
    
    // Base prediction with trend
    let prediction = lastRevenue + (trend * monthsAhead);
    
    // Apply seasonality
    const month = predictionDate.getMonth();
    const seasonalFactor = seasonality[month] || 0;
    prediction = prediction * (1 + seasonalFactor);
    
    // Apply growth rate from historical data
    const growthRate = this.calculateGrowthRate(data.map(d => d.revenue));
    prediction = prediction * Math.pow(1 + growthRate, monthsAhead);
    
    return Math.max(0, prediction);
  }

  private static predictCustomers(data: HistoricalData[], monthsAhead: number, trend: number, seasonality: number[]): number {
    const lastCustomers = data[data.length - 1].customers;
    const lastDate = new Date(data[data.length - 1].date);
    const predictionDate = new Date(lastDate);
    predictionDate.setMonth(predictionDate.getMonth() + monthsAhead);
    
    // Base prediction with trend
    let prediction = lastCustomers + (trend * monthsAhead);
    
    // Apply seasonality
    const month = predictionDate.getMonth();
    const seasonalFactor = seasonality[month] || 0;
    prediction = prediction * (1 + seasonalFactor);
    
    // Apply growth rate from historical data
    const growthRate = this.calculateGrowthRate(data.map(d => d.customers));
    prediction = prediction * Math.pow(1 + growthRate, monthsAhead);
    
    return Math.max(0, prediction);
  }

  private static calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const periods = values.length - 1;
    
    if (firstValue <= 0) return 0;
    
    // Calculate compound annual growth rate
    const growthRate = Math.pow(lastValue / firstValue, 1 / periods) - 1;
    return growthRate;
  }

  // Advanced confidence calculation with multiple factors
  private static calculateAdvancedConfidence(data: HistoricalData[]): number {
    let confidence = 100;
    
    // Dataset size factor
    if (data.length < 6) confidence -= 25;
    else if (data.length < 12) confidence -= 15;
    else if (data.length < 24) confidence -= 5;
    
    // Data consistency factor
    const revenues = data.map(d => d.revenue);
    const customers = data.map(d => d.customers);
    
    const revenueVariance = this.calculateVariance(revenues);
    const customerVariance = this.calculateVariance(customers);
    
    const revenueMean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const customerMean = customers.reduce((a, b) => a + b, 0) / customers.length;
    
    const revenueCV = Math.sqrt(revenueVariance) / revenueMean;
    const customerCV = Math.sqrt(customerVariance) / customerMean;
    
    // Penalize high variability
    if (revenueCV > 0.6) confidence -= 20;
    else if (revenueCV > 0.4) confidence -= 15;
    else if (revenueCV > 0.2) confidence -= 10;
    
    if (customerCV > 0.6) confidence -= 15;
    else if (customerCV > 0.4) confidence -= 10;
    else if (customerCV > 0.2) confidence -= 5;
    
    // Trend stability factor
    const revenueTrend = this.calculateAdvancedTrend(revenues);
    const customerTrend = this.calculateAdvancedTrend(customers);
    
    const trendStability = this.calculateTrendStability(revenues);
    if (trendStability < 0.7) confidence -= 10;
    else if (trendStability < 0.8) confidence -= 5;
    
    // Missing data factor
    const missingDataPoints = data.filter(d => !d.revenue || !d.customers).length;
    const missingPercentage = missingDataPoints / data.length;
    confidence -= missingPercentage * 25;
    
    // Seasonality strength factor
    const seasonalityStrength = this.calculateSeasonalityStrength(revenues);
    if (seasonalityStrength > 0.3) confidence += 5; // Strong seasonality is good for predictions
    
    return Math.max(25, Math.min(95, confidence)); // Range: 25-95%
  }

  private static calculateTrendStability(values: number[]): number {
    if (values.length < 4) return 0.5;
    
    const trends = [];
    for (let i = 2; i < values.length; i++) {
      const shortTrend = (values[i] - values[i-2]) / 2;
      trends.push(shortTrend);
    }
    
    const trendVariance = this.calculateVariance(trends);
    const trendMean = trends.reduce((a, b) => a + b, 0) / trends.length;
    
    if (trendMean === 0) return 0.5;
    
    const trendCV = Math.sqrt(trendVariance) / Math.abs(trendMean);
    return Math.max(0, 1 - trendCV);
  }

  private static calculateSeasonalityStrength(values: number[]): number {
    if (values.length < 12) return 0;
    
    const seasonality = this.calculateAdvancedSeasonality(values);
    const maxSeasonal = Math.max(...seasonality.map(Math.abs));
    return maxSeasonal;
  }

  private static calculateDynamicConfidence(
    baseConfidence: number, 
    monthsAhead: number, 
    totalTimespan: number, 
    data: HistoricalData[]
  ): number {
    // Base confidence decreases with prediction distance
    const distancePenalty = (monthsAhead / totalTimespan) * 20;
    
    // Volatility penalty
    const revenues = data.map(d => d.revenue);
    const volatility = this.calculateVolatility(revenues);
    const volatilityPenalty = volatility * 10;
    
    // Data recency bonus (more recent data = higher confidence)
    const dataAge = this.calculateDataAge(data);
    const recencyBonus = Math.max(0, 5 - dataAge);
    
    const dynamicConfidence = baseConfidence - distancePenalty - volatilityPenalty + recencyBonus;
    
    return Math.max(15, Math.min(95, dynamicConfidence));
  }

  private static calculateDataAge(data: HistoricalData[]): number {
    if (data.length === 0) return 10;
    
    const lastDate = new Date(data[data.length - 1].date);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + 
                      (now.getMonth() - lastDate.getMonth());
    
    return monthsDiff;
  }

  private static calculateConfidence(data: HistoricalData[]): number {
    return this.calculateAdvancedConfidence(data);
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  // Calculate confidence intervals based on prediction uncertainty
  private static calculateConfidenceInterval(value: number, confidence: number): { optimistic: number; pessimistic: number } {
    // Calculate uncertainty range based on confidence level
    const uncertaintyFactor = (100 - confidence) / 100;
    const range = value * uncertaintyFactor * 0.3; // 30% of uncertainty as range
    
    return {
      optimistic: Math.round(value + range),
      pessimistic: Math.round(Math.max(0, value - range))
    };
  }

  // Generate multiple scenarios for better planning
  private static generateScenarios(
    data: HistoricalData[], 
    monthsAhead: number, 
    revenueTrend: number, 
    customerTrend: number,
    revenueSeasonality: number[], 
    customerSeasonality: number[],
    externalFactors?: any
  ): { optimistic: { revenue: number; customers: number }; realistic: { revenue: number; customers: number }; pessimistic: { revenue: number; customers: number } } {
    const lastRevenue = data[data.length - 1].revenue;
    const lastCustomers = data[data.length - 1].customers;
    
    // Base realistic scenario
    const realisticRevenue = this.predictRevenue(data, monthsAhead, revenueTrend, revenueSeasonality);
    const realisticCustomers = this.predictCustomers(data, monthsAhead, customerTrend, customerSeasonality);
    
    // Optimistic scenario (+25% growth, -50% churn impact)
    const optimisticRevenue = realisticRevenue * 1.25;
    const optimisticCustomers = realisticCustomers * 1.15;
    
    // Pessimistic scenario (-25% growth, +50% churn impact)
    const pessimisticRevenue = realisticRevenue * 0.75;
    const pessimisticCustomers = realisticCustomers * 0.85;
    
    // Apply external factors if provided
    if (externalFactors) {
      const marketImpact = externalFactors.marketGrowth || 0;
      const economicImpact = externalFactors.economicIndex || 1;
      const competitiveImpact = 1 - (externalFactors.competitivePressure || 0);
      
      return {
        optimistic: {
          revenue: Math.round(optimisticRevenue * (1 + marketImpact * 0.5) * economicImpact * competitiveImpact),
          customers: Math.round(optimisticCustomers * (1 + marketImpact * 0.3) * economicImpact * competitiveImpact)
        },
        realistic: {
          revenue: Math.round(realisticRevenue * (1 + marketImpact * 0.2) * economicImpact * competitiveImpact),
          customers: Math.round(realisticCustomers * (1 + marketImpact * 0.1) * economicImpact * competitiveImpact)
        },
        pessimistic: {
          revenue: Math.round(pessimisticRevenue * (1 - marketImpact * 0.2) * economicImpact * competitiveImpact),
          customers: Math.round(pessimisticCustomers * (1 - marketImpact * 0.1) * economicImpact * competitiveImpact)
        }
      };
    }
    
    return {
      optimistic: {
        revenue: Math.round(optimisticRevenue),
        customers: Math.round(optimisticCustomers)
      },
      realistic: {
        revenue: Math.round(realisticRevenue),
        customers: Math.round(realisticCustomers)
      },
      pessimistic: {
        revenue: Math.round(pessimisticRevenue),
        customers: Math.round(pessimisticCustomers)
      }
    };
  }

  // Identify risk factors that could affect prediction accuracy
  private static identifyRiskFactors(
    data: HistoricalData[], 
    monthsAhead: number, 
    confidence: number, 
    externalFactors?: any
  ): string[] {
    const riskFactors: string[] = [];
    
    // Data quality risks
    if (data.length < 6) {
      riskFactors.push('Limited historical data (< 6 months)');
    }
    if (data.length < 12) {
      riskFactors.push('Insufficient data for seasonality analysis');
    }
    
    // Prediction distance risks
    if (monthsAhead > 6) {
      riskFactors.push('Long-term prediction (> 6 months)');
    }
    if (monthsAhead > 12) {
      riskFactors.push('Very long-term prediction (> 12 months)');
    }
    
    // Confidence-based risks
    if (confidence < 60) {
      riskFactors.push('Low prediction confidence');
    }
    if (confidence < 40) {
      riskFactors.push('Very low prediction confidence');
    }
    
    // Volatility risks
    const revenues = data.map(d => d.revenue);
    const volatility = this.calculateVolatility(revenues);
    if (volatility > 0.3) {
      riskFactors.push('High revenue volatility');
    }
    
    // External factor risks
    if (externalFactors) {
      if (externalFactors.competitivePressure > 0.7) {
        riskFactors.push('High competitive pressure');
      }
      if (externalFactors.economicIndex < 0.6) {
        riskFactors.push('Economic uncertainty');
      }
      if (externalFactors.marketGrowth < 0.05) {
        riskFactors.push('Slow market growth');
      }
    }
    
    // Data recency risks
    const dataAge = this.calculateDataAge(data);
    if (dataAge > 3) {
      riskFactors.push('Outdated historical data');
    }
    
    return riskFactors;
  }

  // Calculate impact of external factors on predictions
  private static calculateExternalFactorsImpact(externalFactors: any, monthsAhead: number): {
    marketGrowth: number;
    economicIndex: number;
    competitivePressure: number;
    seasonality: number;
  } {
    const marketGrowth = externalFactors.marketGrowth || 0;
    const economicIndex = externalFactors.economicIndex || 1;
    const competitivePressure = externalFactors.competitivePressure || 0;
    
    // Calculate seasonality impact for the specific month
    let seasonality = 0;
    if (externalFactors.seasonality && externalFactors.seasonality.length >= 12) {
      const monthIndex = (new Date().getMonth() + monthsAhead) % 12;
      seasonality = externalFactors.seasonality[monthIndex] || 0;
    }
    
    return {
      marketGrowth: marketGrowth * 100, // Convert to percentage
      economicIndex: economicIndex * 100,
      competitivePressure: competitivePressure * 100,
      seasonality: seasonality * 100
    };
  }

  // Generate prediction summary
  static generateSummary(predictions: PredictionResult[]): string {
    if (predictions.length === 0) return 'No predictions available';
    
    const totalRevenue = predictions.reduce((sum, p) => sum + p.revenue, 0);
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    const firstPrediction = predictions[0];
    const lastPrediction = predictions[predictions.length - 1];
    
    const revenueGrowth = ((lastPrediction.revenue - firstPrediction.revenue) / firstPrediction.revenue) * 100;
    const customerGrowth = ((lastPrediction.customers - firstPrediction.customers) / firstPrediction.customers) * 100;
    
    return `Prediction Summary:
    • Period: ${firstPrediction.date} to ${lastPrediction.date}
    • Total Revenue: $${totalRevenue.toLocaleString()}
    • Revenue Growth: ${revenueGrowth.toFixed(1)}%
    • Customer Growth: ${customerGrowth.toFixed(1)}%
    • Average Confidence: ${avgConfidence.toFixed(1)}%
    • Method: ${firstPrediction.method}`;
  }
}
