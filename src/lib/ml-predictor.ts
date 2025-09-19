import { HistoricalData } from './excel-parser';

// Advanced ML Model Types
export interface NeuralNetworkConfig {
  hiddenLayers: number[];
  learningRate: number;
  epochs: number;
  activationFunction: 'relu' | 'sigmoid' | 'tanh';
}

export interface TimeSeriesModel {
  type: 'ARIMA' | 'LSTM' | 'Prophet' | 'ExponentialSmoothing';
  parameters: Record<string, any>;
  accuracy: number;
}

export interface EnsembleWeights {
  linear: number;
  exponential: number;
  movingAverage: number;
  arima: number;
  neuralNetwork: number;
  lstm: number;
}

export interface MonteCarloConfig {
  simulations: number;
  confidenceLevels: number[];
  randomSeed?: number;
}

export interface ScenarioAnalysis {
  optimistic: PredictionResult[];
  realistic: PredictionResult[];
  pessimistic: PredictionResult[];
  monteCarlo: {
    percentiles: Record<number, PredictionResult[]>;
    mean: PredictionResult[];
    standardDeviation: number[];
  };
  stressTest: {
    scenarios: string[];
    results: Record<string, PredictionResult[]>;
  };
}

export interface ModelExplanation {
  predictionMethod: string;
  confidenceFactors: {
    dataQuality: number;
    trendStability: number;
    seasonalityStrength: number;
    volatilityImpact: number;
    externalFactors: number;
  };
  keyDrivers: {
    factor: string;
    impact: number;
    explanation: string;
  }[];
  assumptions: string[];
  limitations: string[];
  recommendations: string[];
}

export interface ExternalDataSources {
  marketData?: {
    industryGrowthRate: number;
    marketSize: number;
    competitiveIndex: number;
    lastUpdated: string;
  };
  economicIndicators?: {
    gdpGrowth: number;
    inflationRate: number;
    unemploymentRate: number;
    interestRate: number;
    lastUpdated: string;
  };
  sectorMetrics?: {
    saasGrowthRate: number;
    averageChurnRate: number;
    averageLTV: number;
    averageCAC: number;
    lastUpdated: string;
  };
}

export interface ExternalDataConfig {
  enableMarketData: boolean;
  enableEconomicIndicators: boolean;
  enableSectorMetrics: boolean;
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  dataProviders: string[];
}

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
  // Cash Flow & Profitability Predictions
  cashFlow?: {
    burnRate: number;
    cashRunway: number;
    breakEvenPoint: number;
    monthlyProfit: number;
    grossMargin: number;
    netMargin: number;
    cashFlowProjection: {
      month: number;
      revenue: number;
      expenses: number;
      netCashFlow: number;
      cumulativeCash: number;
    }[];
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
  // Cash Flow & Profitability inputs
  cashFlowInputs?: {
    cashInBank: number; // Current cash balance
    operatingExpenses: number; // Current monthly operating expenses
    operatingExpenseGrowthRate: number; // Monthly growth rate of operating expenses (e.g., 0.05 for 5%)
    grossMarginRate: number; // Gross margin percentage (e.g., 0.70 for 70%)
    includeCashFlowProjections?: boolean;
  };
}

export class MLPredictor {
  private static neuralNetworkConfig: NeuralNetworkConfig = {
    hiddenLayers: [64, 32, 16],
    learningRate: 0.001,
    epochs: 100,
    activationFunction: 'relu'
  };

  private static ensembleWeights: EnsembleWeights = {
    linear: 0.2,
    exponential: 0.2,
    movingAverage: 0.15,
    arima: 0.15,
    neuralNetwork: 0.2,
    lstm: 0.1
  };

  static predict(request: PredictionRequest): PredictionResult[] {
    const { data, timespan, predictionType, includeScenarios = true, includeExternalFactors = true, externalFactors, cashFlowInputs } = request;
    
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
      
      // Calculate cash flow and profitability metrics
      let cashFlowMetrics;
      if (cashFlowInputs && cashFlowInputs.includeCashFlowProjections) {
        cashFlowMetrics = this.calculateCashFlowMetrics(
          revenue, customers, i, cashFlowInputs, preprocessedData
        );
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
        externalFactors: externalFactorsImpact,
        cashFlow: cashFlowMetrics
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
    
    // Method 5: Neural Network prediction
    const neuralNetworkPrediction = this.calculateNeuralNetworkPrediction(data.map(d => d.revenue), monthsAhead);
    
    // Method 6: LSTM-like prediction (simplified)
    const lstmPrediction = this.calculateLSTMPrediction(data.map(d => d.revenue), monthsAhead);
    
    // Enhanced ensemble with weighted average
    const ensembleValue = (
      linearPrediction * this.ensembleWeights.linear +
      exponentialPrediction * this.ensembleWeights.exponential +
      movingAvgPrediction * this.ensembleWeights.movingAverage +
      arimaPrediction * this.ensembleWeights.arima +
      neuralNetworkPrediction * this.ensembleWeights.neuralNetwork +
      lstmPrediction * this.ensembleWeights.lstm
    );
    
    return {
      value: Math.max(0, ensembleValue),
      method: 'Advanced Ensemble (Linear+Exp+MA+ARIMA+NN+LSTM)'
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
    
    // Method 5: Neural Network prediction
    const neuralNetworkPrediction = this.calculateNeuralNetworkPrediction(data.map(d => d.customers), monthsAhead);
    
    // Method 6: LSTM-like prediction (simplified)
    const lstmPrediction = this.calculateLSTMPrediction(data.map(d => d.customers), monthsAhead);
    
    // Enhanced ensemble with weighted average
    const ensembleValue = (
      linearPrediction * this.ensembleWeights.linear +
      exponentialPrediction * this.ensembleWeights.exponential +
      movingAvgPrediction * this.ensembleWeights.movingAverage +
      arimaPrediction * this.ensembleWeights.arima +
      neuralNetworkPrediction * this.ensembleWeights.neuralNetwork +
      lstmPrediction * this.ensembleWeights.lstm
    );
    
    return {
      value: Math.max(0, ensembleValue),
      method: 'Advanced Ensemble (Linear+Exp+MA+ARIMA+NN+LSTM)'
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

  // Neural Network prediction using simplified feedforward network
  private static calculateNeuralNetworkPrediction(values: number[], periods: number): number {
    if (values.length < 5) return values[values.length - 1] || 0;
    
    // Prepare features: recent values, trends, seasonality
    const features = this.extractFeatures(values);
    
    // Simplified neural network with 3 layers
    const hidden1 = this.neuralNetworkLayer(features, this.neuralNetworkConfig.hiddenLayers[0]);
    const hidden2 = this.neuralNetworkLayer(hidden1, this.neuralNetworkConfig.hiddenLayers[1]);
    const output = this.neuralNetworkLayer(hidden2, 1);
    
    // Apply activation function and scale to prediction
    const prediction = this.applyActivation(output[0], this.neuralNetworkConfig.activationFunction);
    const lastValue = values[values.length - 1];
    
    return Math.max(0, lastValue * (1 + prediction * periods * 0.1));
  }

  // LSTM-like prediction using simplified recurrent approach
  private static calculateLSTMPrediction(values: number[], periods: number): number {
    if (values.length < 6) return values[values.length - 1] || 0;
    
    // Use sliding window approach to capture temporal dependencies
    const windowSize = Math.min(6, values.length - 1);
    const recentWindow = values.slice(-windowSize);
    
    // Calculate weighted average with exponential decay (simulating LSTM memory)
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < recentWindow.length; i++) {
      const weight = Math.exp(-i * 0.2); // Exponential decay
      weightedSum += recentWindow[i] * weight;
      totalWeight += weight;
    }
    
    const lstmOutput = weightedSum / totalWeight;
    const trend = this.calculateAdvancedTrend(recentWindow);
    
    return Math.max(0, lstmOutput + (trend * periods));
  }

  // Extract features for neural network
  private static extractFeatures(values: number[]): number[] {
    const features = [];
    
    // Recent values (normalized)
    const recent = values.slice(-3);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length);
    
    features.push((recent[recent.length - 1] - mean) / (std || 1)); // Last value normalized
    features.push(this.calculateAdvancedTrend(values)); // Trend
    features.push(this.calculateVolatility(values)); // Volatility
    features.push(this.calculateMomentum(values)); // Momentum
    
    return features;
  }

  // Simplified neural network layer
  private static neuralNetworkLayer(inputs: number[], outputSize: number): number[] {
    const outputs = [];
    
    for (let i = 0; i < outputSize; i++) {
      let sum = 0;
      for (let j = 0; j < inputs.length; j++) {
        // Simplified weights (in real implementation, these would be learned)
        const weight = Math.sin(i * j + i) * 0.5; // Pseudo-random weights
        sum += inputs[j] * weight;
      }
      outputs.push(sum);
    }
    
    return outputs;
  }

  // Apply activation function
  private static applyActivation(value: number, activation: string): number {
    switch (activation) {
      case 'relu':
        return Math.max(0, value);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-value));
      case 'tanh':
        return Math.tanh(value);
      default:
        return value;
    }
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

  // Calculate comprehensive cash flow and profitability metrics
  private static calculateCashFlowMetrics(
    revenue: number,
    customers: number,
    monthsAhead: number,
    cashFlowInputs: any,
    historicalData: HistoricalData[]
  ): {
    burnRate: number;
    cashRunway: number;
    breakEvenPoint: number;
    monthlyProfit: number;
    grossMargin: number;
    netMargin: number;
    cashFlowProjection: {
      month: number;
      revenue: number;
      expenses: number;
      netCashFlow: number;
      cumulativeCash: number;
    }[];
  } {
    const {
      cashInBank,
      operatingExpenses,
      operatingExpenseGrowthRate,
      grossMarginRate
    } = cashFlowInputs;

    // Calculate projected operating expenses with growth
    const projectedOperatingExpenses = operatingExpenses * Math.pow(1 + operatingExpenseGrowthRate, monthsAhead);
    
    // Calculate gross profit (revenue * gross margin rate)
    const grossProfit = revenue * grossMarginRate;
    
    // Calculate net profit (gross profit - operating expenses)
    const netProfit = grossProfit - projectedOperatingExpenses;
    
    // Calculate burn rate (negative net profit means burning cash)
    const burnRate = -netProfit; // Positive burn rate means burning cash
    
    // Calculate cash runway (months of cash remaining)
    const cashRunway = burnRate > 0 ? cashInBank / burnRate : Infinity;
    
    // Calculate break-even point (customers needed to break even)
    const revenuePerCustomer = revenue / Math.max(customers, 1);
    const grossProfitPerCustomer = revenuePerCustomer * grossMarginRate;
    const breakEvenPoint = grossProfitPerCustomer > 0 ? 
      Math.ceil(projectedOperatingExpenses / grossProfitPerCustomer) : 0;
    
    // Calculate margins
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    // Generate cash flow projection for the next 12 months
    const cashFlowProjection = this.generateCashFlowProjection(
      cashFlowInputs, historicalData, monthsAhead
    );

    return {
      burnRate: Math.round(burnRate),
      cashRunway: Math.round(cashRunway * 10) / 10, // Round to 1 decimal
      breakEvenPoint,
      monthlyProfit: Math.round(netProfit),
      grossMargin: Math.round(grossMargin * 10) / 10,
      netMargin: Math.round(netMargin * 10) / 10,
      cashFlowProjection
    };
  }

  // Generate detailed cash flow projection
  private static generateCashFlowProjection(
    cashFlowInputs: any,
    historicalData: HistoricalData[],
    currentMonth: number
  ): {
    month: number;
    revenue: number;
    expenses: number;
    netCashFlow: number;
    cumulativeCash: number;
  }[] {
    const projection = [];
    const { cashInBank, operatingExpenses, operatingExpenseGrowthRate, grossMarginRate } = cashFlowInputs;
    
    // Get revenue trend for projection
    const revenueTrend = this.calculateAdvancedTrend(historicalData.map(d => d.revenue));
    const lastRevenue = historicalData[historicalData.length - 1].revenue;
    
    let cumulativeCash = cashInBank;
    
    // Project next 12 months from current month
    for (let month = 1; month <= 12; month++) {
      const monthIndex = currentMonth + month;
      
      // Project revenue with trend
      const projectedRevenue = lastRevenue + (revenueTrend * monthIndex);
      
      // Project operating expenses with growth
      const projectedExpenses = operatingExpenses * Math.pow(1 + operatingExpenseGrowthRate, monthIndex);
      
      // Calculate net cash flow
      const grossProfit = projectedRevenue * grossMarginRate;
      const netCashFlow = grossProfit - projectedExpenses;
      
      // Update cumulative cash
      cumulativeCash += netCashFlow;
      
      projection.push({
        month: monthIndex,
        revenue: Math.round(projectedRevenue),
        expenses: Math.round(projectedExpenses),
        netCashFlow: Math.round(netCashFlow),
        cumulativeCash: Math.round(cumulativeCash)
      });
    }
    
    return projection;
  }

  // Advanced prediction validation and accuracy tracking
  static validatePrediction(prediction: PredictionResult, actualData?: HistoricalData): {
    accuracy: number;
    error: number;
    isAccurate: boolean;
    feedback: string;
  } {
    if (!actualData) {
      return {
        accuracy: 0,
        error: 0,
        isAccurate: false,
        feedback: 'No actual data available for validation'
      };
    }

    const revenueError = Math.abs(prediction.revenue - actualData.revenue) / actualData.revenue;
    const customerError = Math.abs(prediction.customers - actualData.customers) / actualData.customers;
    
    const avgError = (revenueError + customerError) / 2;
    const accuracy = Math.max(0, (1 - avgError) * 100);
    
    const isAccurate = accuracy >= 80; // 80% accuracy threshold
    
    let feedback = '';
    if (accuracy >= 90) {
      feedback = 'Excellent prediction accuracy';
    } else if (accuracy >= 80) {
      feedback = 'Good prediction accuracy';
    } else if (accuracy >= 70) {
      feedback = 'Moderate prediction accuracy';
    } else {
      feedback = 'Low prediction accuracy - consider model retraining';
    }

    return {
      accuracy,
      error: avgError * 100,
      isAccurate,
      feedback
    };
  }

  // Model performance tracking
  static trackModelPerformance(predictions: PredictionResult[], actualData: HistoricalData[]): {
    overallAccuracy: number;
    methodAccuracy: Record<string, number>;
    recommendations: string[];
  } {
    const methodAccuracy: Record<string, number[]> = {};
    const recommendations: string[] = [];

    predictions.forEach((prediction, index) => {
      if (actualData[index]) {
        const validation = this.validatePrediction(prediction, actualData[index]);
        
        if (!methodAccuracy[prediction.method]) {
          methodAccuracy[prediction.method] = [];
        }
        methodAccuracy[prediction.method].push(validation.accuracy);
      }
    });

    // Calculate average accuracy per method
    const methodAccuracyAvg: Record<string, number> = {};
    Object.keys(methodAccuracy).forEach(method => {
      const accuracies = methodAccuracy[method];
      methodAccuracyAvg[method] = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    });

    // Calculate overall accuracy
    const allAccuracies = Object.values(methodAccuracy).flat();
    const overallAccuracy = allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length;

    // Generate recommendations
    if (overallAccuracy < 70) {
      recommendations.push('Consider increasing training data or adjusting model parameters');
    }
    if (overallAccuracy < 80) {
      recommendations.push('Review external factors and seasonality adjustments');
    }
    if (Object.keys(methodAccuracyAvg).length > 1) {
      const bestMethod = Object.entries(methodAccuracyAvg).reduce((a, b) => a[1] > b[1] ? a : b);
      recommendations.push(`Best performing method: ${bestMethod[0]} (${bestMethod[1].toFixed(1)}% accuracy)`);
    }

    return {
      overallAccuracy,
      methodAccuracy: methodAccuracyAvg,
      recommendations
    };
  }

  // Real-time learning: Update model weights based on performance
  static updateModelWeights(performance: { overallAccuracy: number; methodAccuracy: Record<string, number> }): void {
    const { methodAccuracy } = performance;
    
    // Adjust ensemble weights based on individual method performance
    const totalAccuracy = Object.values(methodAccuracy).reduce((a, b) => a + b, 0);
    
    if (totalAccuracy > 0) {
      // Normalize weights based on performance
      const newWeights: Partial<EnsembleWeights> = {};
      
      if (methodAccuracy['Linear']) {
        newWeights.linear = methodAccuracy['Linear'] / totalAccuracy;
      }
      if (methodAccuracy['Exponential']) {
        newWeights.exponential = methodAccuracy['Exponential'] / totalAccuracy;
      }
      if (methodAccuracy['Moving Average']) {
        newWeights.movingAverage = methodAccuracy['Moving Average'] / totalAccuracy;
      }
      if (methodAccuracy['ARIMA']) {
        newWeights.arima = methodAccuracy['ARIMA'] / totalAccuracy;
      }
      if (methodAccuracy['Neural Network']) {
        newWeights.neuralNetwork = methodAccuracy['Neural Network'] / totalAccuracy;
      }
      if (methodAccuracy['LSTM']) {
        newWeights.lstm = methodAccuracy['LSTM'] / totalAccuracy;
      }

      // Update weights with learning rate to avoid drastic changes
      const learningRate = 0.1;
      Object.keys(newWeights).forEach(key => {
        const currentWeight = this.ensembleWeights[key as keyof EnsembleWeights];
        const newWeight = newWeights[key as keyof EnsembleWeights] || 0;
        this.ensembleWeights[key as keyof EnsembleWeights] = 
          currentWeight + learningRate * (newWeight - currentWeight);
      });
    }
  }

  // Dedicated cash flow prediction method
  static predictCashFlow(request: {
    data: HistoricalData[];
    timespan: number;
    cashFlowInputs: {
      cashInBank: number;
      operatingExpenses: number;
      operatingExpenseGrowthRate: number;
      grossMarginRate: number;
    };
  }): {
    burnRateForecast: {
      month: number;
      burnRate: number;
      cumulativeBurn: number;
    }[];
    cashRunwayAnalysis: {
      currentRunway: number;
      projectedRunway: number[];
      breakEvenMonth?: number;
    };
    breakEvenAnalysis: {
      currentBreakEvenPoint: number;
      projectedBreakEvenPoint: number[];
      monthsToBreakEven?: number;
    };
    summary: string;
  } {
    const { data, timespan, cashFlowInputs } = request;
    
    if (data.length < 3) {
      throw new Error('Need at least 3 data points for cash flow predictions');
    }

    const preprocessedData = this.preprocessData(data);
    const revenueTrend = this.calculateAdvancedTrend(preprocessedData.map(d => d.revenue));
    const customerTrend = this.calculateAdvancedTrend(preprocessedData.map(d => d.customers));
    
    const lastRevenue = preprocessedData[preprocessedData.length - 1].revenue;
    const lastCustomers = preprocessedData[preprocessedData.length - 1].customers;
    
    const burnRateForecast = [];
    const projectedRunway = [];
    const projectedBreakEvenPoint = [];
    
    let cumulativeBurn = 0;
    let foundBreakEven = false;
    let breakEvenMonth: number | undefined;
    let monthsToBreakEven: number | undefined;
    
    for (let i = 1; i <= timespan; i++) {
      // Project revenue and customers
      const projectedRevenue = lastRevenue + (revenueTrend * i);
      const projectedCustomers = lastCustomers + (customerTrend * i);
      
      // Project operating expenses
      const projectedOperatingExpenses = cashFlowInputs.operatingExpenses * 
        Math.pow(1 + cashFlowInputs.operatingExpenseGrowthRate, i);
      
      // Calculate burn rate
      const grossProfit = projectedRevenue * cashFlowInputs.grossMarginRate;
      const netProfit = grossProfit - projectedOperatingExpenses;
      const burnRate = -netProfit; // Positive means burning cash
      
      cumulativeBurn += burnRate;
      
      // Calculate cash runway
      const remainingCash = cashFlowInputs.cashInBank - cumulativeBurn;
      const runway = burnRate > 0 ? remainingCash / burnRate : Infinity;
      
      // Calculate break-even point
      const revenuePerCustomer = projectedRevenue / Math.max(projectedCustomers, 1);
      const grossProfitPerCustomer = revenuePerCustomer * cashFlowInputs.grossMarginRate;
      const breakEvenPoint = grossProfitPerCustomer > 0 ? 
        Math.ceil(projectedOperatingExpenses / grossProfitPerCustomer) : 0;
      
      burnRateForecast.push({
        month: i,
        burnRate: Math.round(burnRate),
        cumulativeBurn: Math.round(cumulativeBurn)
      });
      
      projectedRunway.push(Math.round(runway * 10) / 10);
      projectedBreakEvenPoint.push(breakEvenPoint);
      
      // Check for break-even
      if (!foundBreakEven && netProfit >= 0) {
        foundBreakEven = true;
        breakEvenMonth = i;
        monthsToBreakEven = i;
      }
    }
    
    // Current analysis
    const currentGrossProfit = lastRevenue * cashFlowInputs.grossMarginRate;
    const currentNetProfit = currentGrossProfit - cashFlowInputs.operatingExpenses;
    const currentBurnRate = -currentNetProfit;
    const currentRunway = currentBurnRate > 0 ? 
      cashFlowInputs.cashInBank / currentBurnRate : Infinity;
    
    const currentRevenuePerCustomer = lastRevenue / Math.max(lastCustomers, 1);
    const currentGrossProfitPerCustomer = currentRevenuePerCustomer * cashFlowInputs.grossMarginRate;
    const currentBreakEvenPoint = currentGrossProfitPerCustomer > 0 ? 
      Math.ceil(cashFlowInputs.operatingExpenses / currentGrossProfitPerCustomer) : 0;
    
    const summary = `Cash Flow Analysis:
    • Current Burn Rate: $${Math.round(currentBurnRate).toLocaleString()}/month
    • Current Cash Runway: ${Math.round(currentRunway * 10) / 10} months
    • Current Break-Even Point: ${currentBreakEvenPoint} customers
    • Projected Break-Even: ${foundBreakEven ? `${breakEvenMonth} months` : 'Not reached in forecast period'}
    • Total Cash Burn (${timespan} months): $${Math.round(cumulativeBurn).toLocaleString()}`;
    
    return {
      burnRateForecast,
      cashRunwayAnalysis: {
        currentRunway: Math.round(currentRunway * 10) / 10,
        projectedRunway,
        breakEvenMonth
      },
      breakEvenAnalysis: {
        currentBreakEvenPoint,
        projectedBreakEvenPoint,
        monthsToBreakEven
      },
      summary
    };
  }

  // Advanced Monte Carlo simulation for scenario analysis
  static runMonteCarloSimulation(
    request: PredictionRequest,
    config: MonteCarloConfig = { simulations: 1000, confidenceLevels: [5, 25, 50, 75, 95] }
  ): ScenarioAnalysis {
    const { data, timespan, predictionType, includeScenarios = true, includeExternalFactors = true, externalFactors, cashFlowInputs } = request;
    
    if (data.length < 3) {
      throw new Error('Need at least 3 data points for Monte Carlo simulation');
    }

    const preprocessedData = this.preprocessData(data);
    const revenueVolatility = this.calculateVolatility(preprocessedData.map(d => d.revenue));
    const customerVolatility = this.calculateVolatility(preprocessedData.map(d => d.customers));
    
    // Run multiple simulations
    const simulationResults: PredictionResult[][] = [];
    
    for (let sim = 0; sim < config.simulations; sim++) {
      // Add random noise to simulate uncertainty
      const noisyData = this.addRandomNoise(preprocessedData, revenueVolatility, customerVolatility, sim);
      
      // Generate prediction with noisy data
      const prediction = this.predict({
        ...request,
        data: noisyData
      });
      
      simulationResults.push(prediction);
    }
    
    // Calculate percentiles
    const percentiles: Record<number, PredictionResult[]> = {};
    config.confidenceLevels.forEach(level => {
      percentiles[level] = this.calculatePercentile(simulationResults, level);
    });
    
    // Calculate mean and standard deviation
    const mean = this.calculateMean(simulationResults);
    const standardDeviation = this.calculateStandardDeviation(simulationResults);
    
    // Generate traditional scenarios
    const optimistic = this.generateOptimisticScenario(request);
    const realistic = this.predict(request);
    const pessimistic = this.generatePessimisticScenario(request);
    
    // Run stress tests
    const stressTest = this.runStressTests(request);
    
    return {
      optimistic,
      realistic,
      pessimistic,
      monteCarlo: {
        percentiles,
        mean,
        standardDeviation
      },
      stressTest
    };
  }

  // Add random noise to data for Monte Carlo simulation
  private static addRandomNoise(
    data: HistoricalData[], 
    revenueVolatility: number, 
    customerVolatility: number, 
    seed: number
  ): HistoricalData[] {
    // Simple pseudo-random number generator with seed
    const random = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    return data.map((d, index) => ({
      ...d,
      revenue: d.revenue * (1 + (random(seed + index) - 0.5) * revenueVolatility * 0.5),
      customers: d.customers * (1 + (random(seed + index + 1000) - 0.5) * customerVolatility * 0.5)
    }));
  }

  // Calculate percentile from simulation results
  private static calculatePercentile(simulations: PredictionResult[][], percentile: number): PredictionResult[] {
    const timespan = simulations[0].length;
    const results: PredictionResult[] = [];
    
    for (let i = 0; i < timespan; i++) {
      const revenues = simulations.map(sim => sim[i].revenue).sort((a, b) => a - b);
      const customers = simulations.map(sim => sim[i].customers).sort((a, b) => a - b);
      const confidences = simulations.map(sim => sim[i].confidence).sort((a, b) => a - b);
      
      const revenueIndex = Math.floor((percentile / 100) * revenues.length);
      const customerIndex = Math.floor((percentile / 100) * customers.length);
      const confidenceIndex = Math.floor((percentile / 100) * confidences.length);
      
      results.push({
        ...simulations[0][i],
        revenue: revenues[revenueIndex],
        customers: customers[customerIndex],
        confidence: confidences[confidenceIndex]
      });
    }
    
    return results;
  }

  // Calculate mean from simulation results
  private static calculateMean(simulations: PredictionResult[][]): PredictionResult[] {
    const timespan = simulations[0].length;
    const results: PredictionResult[] = [];
    
    for (let i = 0; i < timespan; i++) {
      const avgRevenue = simulations.reduce((sum, sim) => sum + sim[i].revenue, 0) / simulations.length;
      const avgCustomers = simulations.reduce((sum, sim) => sum + sim[i].customers, 0) / simulations.length;
      const avgConfidence = simulations.reduce((sum, sim) => sum + sim[i].confidence, 0) / simulations.length;
      
      results.push({
        ...simulations[0][i],
        revenue: Math.round(avgRevenue),
        customers: Math.round(avgCustomers),
        confidence: Math.round(avgConfidence * 10) / 10
      });
    }
    
    return results;
  }

  // Calculate standard deviation from simulation results
  private static calculateStandardDeviation(simulations: PredictionResult[][]): number[] {
    const timespan = simulations[0].length;
    const results: number[] = [];
    
    for (let i = 0; i < timespan; i++) {
      const revenues = simulations.map(sim => sim[i].revenue);
      const mean = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
      const variance = revenues.reduce((sum, rev) => sum + Math.pow(rev - mean, 2), 0) / revenues.length;
      results.push(Math.sqrt(variance));
    }
    
    return results;
  }

  // Generate optimistic scenario
  private static generateOptimisticScenario(request: PredictionRequest): PredictionResult[] {
    const optimisticRequest = {
      ...request,
      externalFactors: {
        ...request.externalFactors,
        marketGrowth: (request.externalFactors?.marketGrowth || 0) + 0.25,
        economicIndex: Math.min(1, (request.externalFactors?.economicIndex || 1) + 0.2),
        competitivePressure: Math.max(0, (request.externalFactors?.competitivePressure || 0) - 0.2)
      }
    };
    
    return this.predict(optimisticRequest);
  }

  // Generate pessimistic scenario
  private static generatePessimisticScenario(request: PredictionRequest): PredictionResult[] {
    const pessimisticRequest = {
      ...request,
      externalFactors: {
        ...request.externalFactors,
        marketGrowth: Math.max(0, (request.externalFactors?.marketGrowth || 0) - 0.25),
        economicIndex: Math.max(0, (request.externalFactors?.economicIndex || 1) - 0.2),
        competitivePressure: Math.min(1, (request.externalFactors?.competitivePressure || 0) + 0.2)
      }
    };
    
    return this.predict(pessimisticRequest);
  }

  // Run stress tests
  private static runStressTests(request: PredictionRequest): {
    scenarios: string[];
    results: Record<string, PredictionResult[]>;
  } {
    const scenarios = [
      'Economic Recession',
      'High Competition',
      'Market Growth Slowdown',
      'Increased Churn',
      'Cost Inflation'
    ];
    
    const results: Record<string, PredictionResult[]> = {};
    
    // Economic Recession
    results['Economic Recession'] = this.predict({
      ...request,
      externalFactors: {
        ...request.externalFactors,
        economicIndex: 0.3,
        marketGrowth: -0.1
      }
    });
    
    // High Competition
    results['High Competition'] = this.predict({
      ...request,
      externalFactors: {
        ...request.externalFactors,
        competitivePressure: 0.9
      }
    });
    
    // Market Growth Slowdown
    results['Market Growth Slowdown'] = this.predict({
      ...request,
      externalFactors: {
        ...request.externalFactors,
        marketGrowth: 0.02
      }
    });
    
    // Increased Churn (simulated by reducing customer growth)
    const increasedChurnData = request.data.map(d => ({
      ...d,
      customers: d.customers * 0.8 // 20% reduction in customers
    }));
    results['Increased Churn'] = this.predict({
      ...request,
      data: increasedChurnData
    });
    
    // Cost Inflation (simulated by increasing operating expenses)
    results['Cost Inflation'] = this.predict({
      ...request,
      cashFlowInputs: {
        ...request.cashFlowInputs,
        operatingExpenses: (request.cashFlowInputs?.operatingExpenses || 50000) * 1.3,
        operatingExpenseGrowthRate: (request.cashFlowInputs?.operatingExpenseGrowthRate || 0.05) + 0.1
      }
    });
    
    return { scenarios, results };
  }

  // Generate model explanation for predictions
  static explainPrediction(
    request: PredictionRequest,
    prediction: PredictionResult
  ): ModelExplanation {
    const { data, externalFactors, cashFlowInputs } = request;
    const preprocessedData = this.preprocessData(data);
    
    // Calculate confidence factors
    const dataQuality = this.calculateDataQualityScore(preprocessedData);
    const trendStability = this.calculateTrendStability(preprocessedData.map(d => d.revenue));
    const seasonalityStrength = this.calculateSeasonalityStrength(preprocessedData.map(d => d.revenue));
    const volatilityImpact = this.calculateVolatility(preprocessedData.map(d => d.revenue));
    const externalFactorsImpact = this.calculateExternalFactorsImpact(externalFactors || {}, 1);
    
    // Identify key drivers
    const keyDrivers = this.identifyKeyDrivers(preprocessedData, externalFactors, cashFlowInputs);
    
    // Generate assumptions
    const assumptions = this.generateAssumptions(preprocessedData, externalFactors);
    
    // Identify limitations
    const limitations = this.identifyLimitations(preprocessedData, prediction);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(preprocessedData, prediction, keyDrivers);
    
    return {
      predictionMethod: prediction.method,
      confidenceFactors: {
        dataQuality,
        trendStability,
        seasonalityStrength,
        volatilityImpact,
        externalFactors: Object.values(externalFactorsImpact).reduce((a, b) => a + b, 0) / 4
      },
      keyDrivers,
      assumptions,
      limitations,
      recommendations
    };
  }

  // Calculate data quality score
  private static calculateDataQualityScore(data: HistoricalData[]): number {
    let score = 100;
    
    // Dataset size factor
    if (data.length < 6) score -= 30;
    else if (data.length < 12) score -= 20;
    else if (data.length < 24) score -= 10;
    
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
    if (revenueCV > 0.6) score -= 25;
    else if (revenueCV > 0.4) score -= 15;
    else if (revenueCV > 0.2) score -= 10;
    
    if (customerCV > 0.6) score -= 20;
    else if (customerCV > 0.4) score -= 10;
    else if (customerCV > 0.2) score -= 5;
    
    // Missing data factor
    const missingDataPoints = data.filter(d => !d.revenue || !d.customers).length;
    const missingPercentage = missingDataPoints / data.length;
    score -= missingPercentage * 30;
    
    return Math.max(0, Math.min(100, score));
  }

  // Identify key drivers of predictions
  private static identifyKeyDrivers(
    data: HistoricalData[],
    externalFactors?: any,
    cashFlowInputs?: any
  ): { factor: string; impact: number; explanation: string }[] {
    const drivers = [];
    
    // Revenue trend
    const revenueTrend = this.calculateAdvancedTrend(data.map(d => d.revenue));
    const trendImpact = Math.abs(revenueTrend) * 100;
    drivers.push({
      factor: 'Revenue Trend',
      impact: trendImpact,
      explanation: `Historical revenue shows a ${revenueTrend > 0 ? 'positive' : 'negative'} trend of $${Math.abs(revenueTrend).toFixed(0)}/month`
    });
    
    // Customer growth
    const customerTrend = this.calculateAdvancedTrend(data.map(d => d.customers));
    const customerImpact = Math.abs(customerTrend) * 10;
    drivers.push({
      factor: 'Customer Growth',
      impact: customerImpact,
      explanation: `Customer base is ${customerTrend > 0 ? 'growing' : 'declining'} by ${Math.abs(customerTrend).toFixed(1)} customers/month`
    });
    
    // Seasonality
    const seasonalityStrength = this.calculateSeasonalityStrength(data.map(d => d.revenue));
    if (seasonalityStrength > 0.1) {
      drivers.push({
        factor: 'Seasonality',
        impact: seasonalityStrength * 100,
        explanation: `Strong seasonal patterns detected with ${(seasonalityStrength * 100).toFixed(1)}% variation`
      });
    }
    
    // External factors
    if (externalFactors) {
      if (externalFactors.marketGrowth && externalFactors.marketGrowth > 0.1) {
        drivers.push({
          factor: 'Market Growth',
          impact: externalFactors.marketGrowth * 100,
          explanation: `Market growing at ${(externalFactors.marketGrowth * 100).toFixed(1)}% annually`
        });
      }
      
      if (externalFactors.competitivePressure && externalFactors.competitivePressure > 0.5) {
        drivers.push({
          factor: 'Competition',
          impact: externalFactors.competitivePressure * 100,
          explanation: `High competitive pressure (${(externalFactors.competitivePressure * 100).toFixed(1)}%) affecting growth`
        });
      }
    }
    
    // Cash flow factors
    if (cashFlowInputs) {
      const burnRate = cashFlowInputs.operatingExpenses - (data[data.length - 1].revenue * (cashFlowInputs.grossMarginRate || 0.7));
      if (burnRate > 0) {
        drivers.push({
          factor: 'Cash Burn',
          impact: Math.min(100, burnRate / 10000),
          explanation: `Monthly burn rate of $${Math.round(burnRate).toLocaleString()} impacts growth capacity`
        });
      }
    }
    
    return drivers.sort((a, b) => b.impact - a.impact);
  }

  // Generate model assumptions
  private static generateAssumptions(data: HistoricalData[], externalFactors?: any): string[] {
    const assumptions = [];
    
    assumptions.push('Historical trends will continue in the near term');
    assumptions.push('Current business model and pricing remain stable');
    assumptions.push('No major market disruptions or competitive changes');
    
    if (data.length < 12) {
      assumptions.push('Limited historical data - predictions based on short-term trends');
    }
    
    if (externalFactors) {
      if (externalFactors.marketGrowth) {
        assumptions.push(`Market growth rate of ${(externalFactors.marketGrowth * 100).toFixed(1)}% will be maintained`);
      }
      if (externalFactors.economicIndex < 0.7) {
        assumptions.push('Economic conditions may impact customer acquisition and retention');
      }
    }
    
    return assumptions;
  }

  // Identify model limitations
  private static identifyLimitations(data: HistoricalData[], prediction: PredictionResult): string[] {
    const limitations = [];
    
    if (data.length < 6) {
      limitations.push('Limited historical data reduces prediction accuracy');
    }
    
    if (prediction.confidence < 70) {
      limitations.push('Low confidence score indicates high uncertainty');
    }
    
    const volatility = this.calculateVolatility(data.map(d => d.revenue));
    if (volatility > 0.3) {
      limitations.push('High revenue volatility makes predictions less reliable');
    }
    
    const dataAge = this.calculateDataAge(data);
    if (dataAge > 3) {
      limitations.push('Outdated historical data may not reflect current market conditions');
    }
    
    limitations.push('Predictions assume no major business model changes');
    limitations.push('External factors (economic, competitive) may change unpredictably');
    
    return limitations;
  }

  // Generate actionable recommendations
  private static generateRecommendations(
    data: HistoricalData[],
    prediction: PredictionResult,
    keyDrivers: { factor: string; impact: number; explanation: string }[]
  ): string[] {
    const recommendations = [];
    
    // Data quality recommendations
    if (data.length < 12) {
      recommendations.push('Collect more historical data to improve prediction accuracy');
    }
    
    // Confidence-based recommendations
    if (prediction.confidence < 70) {
      recommendations.push('Consider multiple scenarios and stress test assumptions');
    }
    
    // Driver-based recommendations
    const topDriver = keyDrivers[0];
    if (topDriver) {
      if (topDriver.factor === 'Revenue Trend' && topDriver.impact < 50) {
        recommendations.push('Focus on revenue growth strategies to improve predictions');
      }
      if (topDriver.factor === 'Customer Growth' && topDriver.impact < 30) {
        recommendations.push('Invest in customer acquisition to strengthen growth trends');
      }
      if (topDriver.factor === 'Competition' && topDriver.impact > 70) {
        recommendations.push('Develop competitive differentiation strategies');
      }
    }
    
    // Volatility recommendations
    const volatility = this.calculateVolatility(data.map(d => d.revenue));
    if (volatility > 0.3) {
      recommendations.push('Implement revenue smoothing strategies to reduce volatility');
    }
    
    // General recommendations
    recommendations.push('Monitor actual performance vs. predictions monthly');
    recommendations.push('Update predictions with new data regularly');
    recommendations.push('Consider external market factors in decision making');
    
    return recommendations;
  }

  // External data integration for enhanced predictions
  static async fetchExternalData(config: ExternalDataConfig): Promise<ExternalDataSources> {
    const externalData: ExternalDataSources = {};
    
    try {
      if (config.enableMarketData) {
        externalData.marketData = await this.fetchMarketData();
      }
      
      if (config.enableEconomicIndicators) {
        externalData.economicIndicators = await this.fetchEconomicIndicators();
      }
      
      if (config.enableSectorMetrics) {
        externalData.sectorMetrics = await this.fetchSectorMetrics();
      }
    } catch (error) {
      console.warn('Failed to fetch external data:', error);
    }
    
    return externalData;
  }

  // Fetch market data from external sources
  private static async fetchMarketData(): Promise<ExternalDataSources['marketData']> {
    // In a real implementation, this would call external APIs
    // For now, return mock data that represents typical SaaS market conditions
    return {
      industryGrowthRate: 0.15, // 15% annual growth
      marketSize: 500000000000, // $500B SaaS market
      competitiveIndex: 0.6, // Moderate competition
      lastUpdated: new Date().toISOString()
    };
  }

  // Fetch economic indicators
  private static async fetchEconomicIndicators(): Promise<ExternalDataSources['economicIndicators']> {
    // In a real implementation, this would call economic data APIs
    // For now, return mock data representing current economic conditions
    return {
      gdpGrowth: 0.025, // 2.5% GDP growth
      inflationRate: 0.03, // 3% inflation
      unemploymentRate: 0.04, // 4% unemployment
      interestRate: 0.05, // 5% interest rate
      lastUpdated: new Date().toISOString()
    };
  }

  // Fetch sector-specific metrics
  private static async fetchSectorMetrics(): Promise<ExternalDataSources['sectorMetrics']> {
    // In a real implementation, this would call industry data providers
    // For now, return mock data representing typical SaaS metrics
    return {
      saasGrowthRate: 0.20, // 20% average SaaS growth
      averageChurnRate: 0.05, // 5% monthly churn
      averageLTV: 5000, // $5,000 average LTV
      averageCAC: 1000, // $1,000 average CAC
      lastUpdated: new Date().toISOString()
    };
  }

  // Enhance predictions with external data
  static enhancePredictionsWithExternalData(
    predictions: PredictionResult[],
    externalData: ExternalDataSources,
    historicalData: HistoricalData[]
  ): PredictionResult[] {
    return predictions.map(prediction => {
      const enhancedPrediction = { ...prediction };
      
      // Apply market data adjustments
      if (externalData.marketData) {
        const marketAdjustment = this.calculateMarketAdjustment(
          prediction,
          externalData.marketData,
          historicalData
        );
        enhancedPrediction.revenue = Math.round(prediction.revenue * marketAdjustment);
        enhancedPrediction.customers = Math.round(prediction.customers * marketAdjustment);
      }
      
      // Apply economic indicators adjustments
      if (externalData.economicIndicators) {
        const economicAdjustment = this.calculateEconomicAdjustment(
          prediction,
          externalData.economicIndicators
        );
        enhancedPrediction.revenue = Math.round(enhancedPrediction.revenue * economicAdjustment);
        enhancedPrediction.customers = Math.round(enhancedPrediction.customers * economicAdjustment);
      }
      
      // Apply sector metrics adjustments
      if (externalData.sectorMetrics) {
        const sectorAdjustment = this.calculateSectorAdjustment(
          prediction,
          externalData.sectorMetrics,
          historicalData
        );
        enhancedPrediction.revenue = Math.round(enhancedPrediction.revenue * sectorAdjustment);
        enhancedPrediction.customers = Math.round(enhancedPrediction.customers * sectorAdjustment);
      }
      
      // Update confidence based on external data quality
      enhancedPrediction.confidence = this.adjustConfidenceWithExternalData(
        prediction.confidence,
        externalData
      );
      
      return enhancedPrediction;
    });
  }

  // Calculate market adjustment factor
  private static calculateMarketAdjustment(
    prediction: PredictionResult,
    marketData: ExternalDataSources['marketData'],
    historicalData: HistoricalData[]
  ): number {
    if (!marketData) return 1;
    
    // Calculate company's growth rate vs industry
    const companyGrowthRate = this.calculateGrowthRate(historicalData.map(d => d.revenue));
    const industryGrowthRate = marketData.industryGrowthRate / 12; // Convert to monthly
    
    // Adjust based on relative performance
    const growthRatio = companyGrowthRate / industryGrowthRate;
    
    // Competitive pressure adjustment
    const competitiveAdjustment = 1 - (marketData.competitiveIndex * 0.1);
    
    return Math.max(0.5, Math.min(1.5, growthRatio * competitiveAdjustment));
  }

  // Calculate economic adjustment factor
  private static calculateEconomicAdjustment(
    prediction: PredictionResult,
    economicIndicators: ExternalDataSources['economicIndicators']
  ): number {
    if (!economicIndicators) return 1;
    
    // GDP growth impact
    const gdpImpact = 1 + (economicIndicators.gdpGrowth * 0.5);
    
    // Inflation impact (negative for SaaS)
    const inflationImpact = 1 - (economicIndicators.inflationRate * 0.3);
    
    // Interest rate impact (negative for growth companies)
    const interestImpact = 1 - (economicIndicators.interestRate * 0.2);
    
    // Unemployment impact (negative for B2B SaaS)
    const unemploymentImpact = 1 - (economicIndicators.unemploymentRate * 0.4);
    
    return Math.max(0.7, Math.min(1.3, gdpImpact * inflationImpact * interestImpact * unemploymentImpact));
  }

  // Calculate sector adjustment factor
  private static calculateSectorAdjustment(
    prediction: PredictionResult,
    sectorMetrics: ExternalDataSources['sectorMetrics'],
    historicalData: HistoricalData[]
  ): number {
    if (!sectorMetrics) return 1;
    
    // Compare company metrics to sector averages
    const companyChurnRate = this.calculateChurnRate(historicalData);
    const companyGrowthRate = this.calculateGrowthRate(historicalData.map(d => d.revenue));
    
    // Churn rate comparison (lower is better)
    const churnAdjustment = sectorMetrics.averageChurnRate / Math.max(companyChurnRate, 0.01);
    
    // Growth rate comparison
    const growthAdjustment = companyGrowthRate / (sectorMetrics.saasGrowthRate / 12);
    
    return Math.max(0.8, Math.min(1.2, (churnAdjustment + growthAdjustment) / 2));
  }

  // Adjust confidence based on external data quality
  private static adjustConfidenceWithExternalData(
    baseConfidence: number,
    externalData: ExternalDataSources
  ): number {
    let adjustedConfidence = baseConfidence;
    
    // Boost confidence if we have external data
    if (externalData.marketData) adjustedConfidence += 5;
    if (externalData.economicIndicators) adjustedConfidence += 5;
    if (externalData.sectorMetrics) adjustedConfidence += 5;
    
    // Check data freshness
    const now = new Date();
    if (externalData.marketData) {
      const marketDataAge = now.getTime() - new Date(externalData.marketData.lastUpdated).getTime();
      const daysOld = marketDataAge / (1000 * 60 * 60 * 24);
      if (daysOld > 30) adjustedConfidence -= 5;
    }
    
    return Math.max(0, Math.min(100, adjustedConfidence));
  }

  // Calculate churn rate from historical data
  private static calculateChurnRate(data: HistoricalData[]): number {
    if (data.length < 2) return 0;
    
    const customerChanges = [];
    for (let i = 1; i < data.length; i++) {
      const change = data[i].customers - data[i - 1].customers;
      customerChanges.push(change);
    }
    
    const avgChange = customerChanges.reduce((a, b) => a + b, 0) / customerChanges.length;
    const avgCustomers = data.reduce((sum, d) => sum + d.customers, 0) / data.length;
    
    return Math.max(0, -avgChange / avgCustomers);
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
    
    let summary = `Prediction Summary:
    • Period: ${firstPrediction.date} to ${lastPrediction.date}
    • Total Revenue: $${totalRevenue.toLocaleString()}
    • Revenue Growth: ${revenueGrowth.toFixed(1)}%
    • Customer Growth: ${customerGrowth.toFixed(1)}%
    • Average Confidence: ${avgConfidence.toFixed(1)}%
    • Method: ${firstPrediction.method}`;
    
    // Add cash flow summary if available
    if (firstPrediction.cashFlow) {
      const avgBurnRate = predictions.reduce((sum, p) => sum + (p.cashFlow?.burnRate || 0), 0) / predictions.length;
      const avgRunway = predictions.reduce((sum, p) => sum + (p.cashFlow?.cashRunway || 0), 0) / predictions.length;
      
      summary += `
    • Average Burn Rate: $${Math.round(avgBurnRate).toLocaleString()}/month
    • Average Cash Runway: ${Math.round(avgRunway * 10) / 10} months`;
    }
    
    return summary;
  }
}
