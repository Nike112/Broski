'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FinancialInputs } from '@/lib/store';
import { MLPredictor, PredictionResult } from '@/lib/ml-predictor';
import { HistoricalData } from '@/lib/excel-parser';
import fs from 'fs/promises';
import path from 'path';

// Define the output type
interface AutomateFinancialForecastingOutput {
  responseType: 'answer' | 'forecast';
  explanation: string;
  forecast?: string;
}

// Load the financial formulas knowledge base
let financialFormulas: any = null;

async function loadFinancialFormulas() {
  if (!financialFormulas) {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'financial-formulas.json');
    const formulasText = await fs.readFile(filePath, 'utf-8');
    financialFormulas = JSON.parse(formulasText);
  }
  return financialFormulas;
}

function formatInputsForQuery(inputs: FinancialInputs): string {
  let parts: string[] = [];

  if (inputs.largeCustomers) parts.push(`LargeCustomers: ${inputs.largeCustomers}`);
  if (inputs.revPerLargeCustomer) parts.push(`ARPULarge: $${inputs.revPerLargeCustomer}/mo`);
  if (inputs.smallMediumCustomers) parts.push(`SmallCustomers: ${inputs.smallMediumCustomers}`);
  if (inputs.revPerSmallMediumCustomer) parts.push(`ARPUSmall: $${inputs.revPerSmallMediumCustomer}/mo`);
  if (inputs.operatingExpenses) parts.push(`OperatingExpenses: $${inputs.operatingExpenses}/mo`);
  if (inputs.cashInBank) parts.push(`CashInBank: $${inputs.cashInBank}`);
  if (inputs.cac) parts.push(`CAC: $${inputs.cac}`);

  if (parts.length === 0) return '';
  
  const joinedParts = parts.join(', ');
  return `Business Data: ${joinedParts}`;
}

// Generate realistic historical data from current inputs
function generateHistoricalData(inputs: FinancialInputs): HistoricalData[] {
  const historicalData: HistoricalData[] = [];
  const currentDate = new Date();
  
  // Generate 24 months of historical data leading up to current state
  for (let i = 23; i >= 0; i--) {
    const dataDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    
    // Calculate historical values based on current inputs with realistic growth
    const monthsBack = 23 - i;
    const growthFactor = Math.pow(0.95, monthsBack); // 5% monthly growth backwards
    
    const historicalLargeCustomers = Math.max(1, Math.round((inputs.largeCustomers || 0) * growthFactor));
    const historicalSmallCustomers = Math.max(1, Math.round((inputs.smallMediumCustomers || 0) * growthFactor));
    
    const historicalRevenue = (historicalLargeCustomers * (inputs.revPerLargeCustomer || 16500)) + 
                             (historicalSmallCustomers * (inputs.revPerSmallMediumCustomer || 3000));
    
    historicalData.push({
      date: dataDate.toISOString().split('T')[0],
      revenue: Math.round(historicalRevenue),
      customers: historicalLargeCustomers + historicalSmallCustomers
    });
  }
  
  return historicalData;
}

// Convert ML predictions to table format
function predictionsToTable(predictions: PredictionResult[], modelName: string): string {
  let table = `| Month | Revenue | Customers | Confidence | Method |\n`;
  table += `|-------|---------|-----------|------------|--------|\n`;
  
  predictions.forEach(prediction => {
    const date = new Date(prediction.date);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    table += `| ${monthName} | $${prediction.revenue.toLocaleString()} | ${prediction.customers.toLocaleString()} | ${prediction.confidence.toFixed(1)}% | ${prediction.method} |\n`;
  });
  
  return table;
}

// Specialized ML Model Forecast Functions using real ML algorithms
function generateEnsembleMLForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor for ensemble predictions
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: true,
      includeExternalFactors: true,
      cashFlowInputs: {
        includeCashFlowProjections: true,
        operatingExpenses: inputs.operatingExpenses || 50000,
        growthRate: 0.05
      }
    });
    
    return predictionsToTable(predictions, 'Ensemble ML');
  } catch (error) {
    console.error('Error in ensemble ML forecast:', error);
    return 'Error generating ensemble ML forecast. Please try again.';
  }
}

function generateARIMAForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with ARIMA focus
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: false,
      modelPreferences: {
        preferredModels: ['ARIMA'],
        ensembleWeights: {
          linear: 0.1,
          exponential: 0.1,
          movingAverage: 0.1,
          arima: 0.7, // Focus on ARIMA
          neuralNetwork: 0.0,
          lstm: 0.0
        }
      }
    });
    
    return predictionsToTable(predictions, 'ARIMA');
  } catch (error) {
    console.error('Error in ARIMA forecast:', error);
    return 'Error generating ARIMA forecast. Please try again.';
  }
}

function generateNeuralNetworkForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with Neural Network focus
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: false,
      modelPreferences: {
        preferredModels: ['NeuralNetwork'],
        ensembleWeights: {
          linear: 0.1,
          exponential: 0.1,
          movingAverage: 0.1,
          arima: 0.1,
          neuralNetwork: 0.6, // Focus on Neural Networks
          lstm: 0.0
        }
      }
    });
    
    return predictionsToTable(predictions, 'Neural Network');
  } catch (error) {
    console.error('Error in Neural Network forecast:', error);
    return 'Error generating Neural Network forecast. Please try again.';
  }
}

function generateLSTMForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with LSTM focus
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: false,
      modelPreferences: {
        preferredModels: ['LSTM'],
        ensembleWeights: {
          linear: 0.1,
          exponential: 0.1,
          movingAverage: 0.1,
          arima: 0.1,
          neuralNetwork: 0.1,
          lstm: 0.6 // Focus on LSTM
        }
      }
    });
    
    return predictionsToTable(predictions, 'LSTM');
  } catch (error) {
    console.error('Error in LSTM forecast:', error);
    return 'Error generating LSTM forecast. Please try again.';
  }
}

function generateMonteCarloForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with Monte Carlo simulations
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: true, // Enable Monte Carlo scenarios
      includeExternalFactors: true,
      monteCarloConfig: {
        simulations: 1000,
        confidenceLevels: [0.05, 0.25, 0.5, 0.75, 0.95]
      }
    });
    
    // Format Monte Carlo results with optimistic/pessimistic ranges
    let table = `| Month | Revenue (Monte Carlo) | Optimistic | Pessimistic | Confidence | Method |\n`;
    table += `|-------|----------------------|------------|-------------|------------|--------|\n`;
    
    predictions.forEach(prediction => {
      const date = new Date(prediction.date);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const optimistic = prediction.revenueRange?.optimistic || Math.round(prediction.revenue * 1.15);
      const pessimistic = prediction.revenueRange?.pessimistic || Math.round(prediction.revenue * 0.85);
      
      table += `| ${monthName} | $${prediction.revenue.toLocaleString()} | $${optimistic.toLocaleString()} | $${pessimistic.toLocaleString()} | ${prediction.confidence.toFixed(1)}% | Monte Carlo (1000 simulations) |\n`;
    });
    
    return table;
  } catch (error) {
    console.error('Error in Monte Carlo forecast:', error);
    return 'Error generating Monte Carlo forecast. Please try again.';
  }
}

function generateScenarioAnalysisForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with scenario analysis
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: true, // Enable scenario analysis
      includeExternalFactors: true
    });
    
    // Format scenario analysis results
    let table = `| Month | Optimistic | Realistic | Pessimistic | Confidence | Method |\n`;
    table += `|-------|------------|-----------|-------------|------------|--------|\n`;
    
    predictions.forEach(prediction => {
      const date = new Date(prediction.date);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const optimistic = prediction.scenarios?.optimistic?.revenue || Math.round(prediction.revenue * 1.2);
      const realistic = prediction.revenue;
      const pessimistic = prediction.scenarios?.pessimistic?.revenue || Math.round(prediction.revenue * 0.8);
      
      table += `| ${monthName} | $${optimistic.toLocaleString()} | $${realistic.toLocaleString()} | $${pessimistic.toLocaleString()} | ${prediction.confidence.toFixed(1)}% | Scenario Analysis |\n`;
    });
    
    return table;
  } catch (error) {
    console.error('Error in scenario analysis forecast:', error);
    return 'Error generating scenario analysis forecast. Please try again.';
  }
}

function generateSalesPipelineForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor for sales pipeline analysis
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: true,
      externalFactors: {
        marketData: {
          industryGrowthRate: 0.12,
          marketSize: 1000000000,
          competitiveIndex: 0.7,
          lastUpdated: new Date().toISOString()
        }
      }
    });
    
    // Format sales pipeline results
    let table = `| Month | Pipeline Value | Win Probability | Expected Revenue | Confidence | Method |\n`;
    table += `|-------|---------------|-----------------|------------------|------------|--------|\n`;
    
    predictions.forEach((prediction, index) => {
      const date = new Date(prediction.date);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Calculate pipeline metrics based on ML predictions
      const pipelineValue = Math.round(prediction.revenue * 3); // Pipeline is typically 3x expected revenue
      const winProbability = Math.max(0.4, 0.6 - (index * 0.02)); // Decreasing over time
      const expectedRevenue = prediction.revenue;
      
      table += `| ${monthName} | $${pipelineValue.toLocaleString()} | ${(winProbability * 100).toFixed(1)}% | $${expectedRevenue.toLocaleString()} | ${prediction.confidence.toFixed(1)}% | Sales Pipeline Analysis |\n`;
    });
    
    return table;
  } catch (error) {
    console.error('Error in sales pipeline forecast:', error);
    return 'Error generating sales pipeline forecast. Please try again.';
  }
}

function generateTrendsAnalysisForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor for trends analysis
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: true
    });
    
    // Format trends analysis results
    let table = `| Month | Revenue Trend | Customer Trend | Growth Rate | Confidence | Method |\n`;
    table += `|-------|--------------|----------------|-------------|------------|--------|\n`;
    
    predictions.forEach((prediction, index) => {
      const date = new Date(prediction.date);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Calculate growth rate based on ML predictions
      const growthRate = index > 0 ? 
        (((prediction.revenue - predictions[index - 1].revenue) / predictions[index - 1].revenue) * 100).toFixed(1) : 
        '5.0';
      
      table += `| ${monthName} | $${prediction.revenue.toLocaleString()} | ${prediction.customers.toLocaleString()} | ${growthRate}% | ${prediction.confidence.toFixed(1)}% | Trends Analysis |\n`;
    });
    
    return table;
  } catch (error) {
    console.error('Error in trends analysis forecast:', error);
    return 'Error generating trends analysis forecast. Please try again.';
  }
}

function generateProfitabilityAnalysisForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor for profitability analysis
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: true,
      cashFlowInputs: {
        includeCashFlowProjections: true,
        operatingExpenses: inputs.operatingExpenses || 50000,
        growthRate: 0.05
      }
    });
    
    // Format profitability analysis results
    let table = `| Month | Revenue | Expenses | Net Profit | Margin % | Confidence | Method |\n`;
    table += `|-------|---------|----------|------------|----------|------------|--------|\n`;
    
    predictions.forEach((prediction, index) => {
      const date = new Date(prediction.date);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const revenue = prediction.revenue;
      const expenses = Math.round((inputs.operatingExpenses || 50000) * (1 + (0.02 * (index + 1)))); // 2% expense growth
      const netProfit = revenue - expenses;
      const margin = ((netProfit / revenue) * 100).toFixed(1);
      
      table += `| ${monthName} | $${revenue.toLocaleString()} | $${expenses.toLocaleString()} | $${netProfit.toLocaleString()} | ${margin}% | ${prediction.confidence.toFixed(1)}% | Profitability Analysis |\n`;
    });
    
    return table;
  } catch (error) {
    console.error('Error in profitability analysis forecast:', error);
    return 'Error generating profitability analysis forecast. Please try again.';
  }
}

function generateLinearRegressionForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with Linear Regression focus
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: false,
      modelPreferences: {
        preferredModels: ['Linear'],
        ensembleWeights: {
          linear: 0.8, // Focus on Linear Regression
          exponential: 0.1,
          movingAverage: 0.1,
          arima: 0.0,
          neuralNetwork: 0.0,
          lstm: 0.0
        }
      }
    });
    
    return predictionsToTable(predictions, 'Linear Regression');
  } catch (error) {
    console.error('Error in Linear Regression forecast:', error);
    return 'Error generating Linear Regression forecast. Please try again.';
  }
}

function generateExponentialSmoothingForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with Exponential Smoothing focus
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: false,
      modelPreferences: {
        preferredModels: ['Exponential'],
        ensembleWeights: {
          linear: 0.1,
          exponential: 0.8, // Focus on Exponential Smoothing
          movingAverage: 0.1,
          arima: 0.0,
          neuralNetwork: 0.0,
          lstm: 0.0
        }
      }
    });
    
    return predictionsToTable(predictions, 'Exponential Smoothing');
  } catch (error) {
    console.error('Error in Exponential Smoothing forecast:', error);
    return 'Error generating Exponential Smoothing forecast. Please try again.';
  }
}

function generateMovingAverageForecast(query: string, inputs: FinancialInputs): string {
  try {
    const months = getForecastPeriod(query);
    const historicalData = generateHistoricalData(inputs);
    
    // Use real ML predictor with Moving Average focus
    const mlPredictor = new MLPredictor();
    const predictions = mlPredictor.predict({
      data: historicalData,
      timespan: months,
      predictionType: 'both',
      includeScenarios: false,
      includeExternalFactors: false,
      modelPreferences: {
        preferredModels: ['MovingAverage'],
        ensembleWeights: {
          linear: 0.1,
          exponential: 0.1,
          movingAverage: 0.8, // Focus on Moving Average
          arima: 0.0,
          neuralNetwork: 0.0,
          lstm: 0.0
        }
      }
    });
    
    return predictionsToTable(predictions, 'Moving Average');
  } catch (error) {
    console.error('Error in Moving Average forecast:', error);
    return 'Error generating Moving Average forecast. Please try again.';
  }
}

function getForecastPeriod(query: string): number {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('36 month') || lowerQuery.includes('3 year')) return 36;
  if (lowerQuery.includes('24 month') || lowerQuery.includes('2 year')) return 24;
  if (lowerQuery.includes('18 month') || lowerQuery.includes('1.5 year')) return 18;
  if (lowerQuery.includes('12 month') || lowerQuery.includes('year')) return 12;
  if (lowerQuery.includes('9 month')) return 9;
  if (lowerQuery.includes('6 month')) return 6;
  if (lowerQuery.includes('quarter') || lowerQuery.includes('3 month')) return 3;
  return 12; // Default
}

function generateForecastData(query: string, inputs: FinancialInputs | null): string {
  if (!inputs) {
    return 'No business data available for forecasting.';
  }

  const lowerQuery = query.toLowerCase();
  
  // Check for specific ML model requests
  if (lowerQuery.includes('ensemble') || lowerQuery.includes('ml') || lowerQuery.includes('machine learning')) {
    return generateEnsembleMLForecast(query, inputs);
  }
  
  if (lowerQuery.includes('arima') || lowerQuery.includes('time series')) {
    return generateARIMAForecast(query, inputs);
  }
  
  if (lowerQuery.includes('neural network') || lowerQuery.includes('neural networks')) {
    return generateNeuralNetworkForecast(query, inputs);
  }
  
  if (lowerQuery.includes('lstm')) {
    return generateLSTMForecast(query, inputs);
  }
  
  if (lowerQuery.includes('linear regression') || lowerQuery.includes('linear trend')) {
    return generateLinearRegressionForecast(query, inputs);
  }
  
  if (lowerQuery.includes('exponential smoothing')) {
    return generateExponentialSmoothingForecast(query, inputs);
  }
  
  if (lowerQuery.includes('moving average') || lowerQuery.includes('moving averages')) {
    return generateMovingAverageForecast(query, inputs);
  }
  
  if (lowerQuery.includes('monte carlo') || lowerQuery.includes('simulation')) {
    return generateMonteCarloForecast(query, inputs);
  }
  
  if (lowerQuery.includes('scenario') || lowerQuery.includes('what if')) {
    return generateScenarioAnalysisForecast(query, inputs);
  }
  
  if (lowerQuery.includes('pipeline') || lowerQuery.includes('sales pipeline')) {
    return generateSalesPipelineForecast(query, inputs);
  }
  
  if (lowerQuery.includes('trends') || lowerQuery.includes('acquisition trends')) {
    return generateTrendsAnalysisForecast(query, inputs);
  }
  
  if (lowerQuery.includes('profitability') || lowerQuery.includes('unit economics') || lowerQuery.includes('economics')) {
    return generateProfitabilityAnalysisForecast(query, inputs);
  }
  
  // Check if this is a revenue forecasting request
  const isRevenueForecast = lowerQuery.includes('revenue') && (
    lowerQuery.includes('forecast') || 
    lowerQuery.includes('projection') || 
    lowerQuery.includes('table') ||
    lowerQuery.includes('breakdown')
  );

  if (isRevenueForecast && inputs) {
    return generateRevenueForecastTable(query, inputs);
  }
  
  // Default forecast for other requests - use same logic as revenue forecast
  let months = 6;
  if (lowerQuery.includes('36 month') || lowerQuery.includes('3 year')) {
    months = 36;
  } else if (lowerQuery.includes('24 month') || lowerQuery.includes('2 year') || lowerQuery.includes('24-month')) {
    months = 24;
  } else if (lowerQuery.includes('18 month') || lowerQuery.includes('1.5 year')) {
    months = 18;
  } else if (lowerQuery.includes('12 month') || (lowerQuery.includes('year') && !lowerQuery.includes('2 year') && !lowerQuery.includes('3 year'))) {
    months = 12;
  } else if (lowerQuery.includes('9 month')) {
    months = 9;
  } else if (lowerQuery.includes('6 month')) {
    months = 6;
  } else if (lowerQuery.includes('quarter') || lowerQuery.includes('3 month')) {
    months = 3;
  } else if (lowerQuery.includes('forecast') || lowerQuery.includes('projection')) {
    months = 12;
  }
  
  console.log(`Default forecast period detected: ${months} months for query: "${query}"`);
  
  // Get business data
  const largeCustomers = inputs?.largeCustomers || 0;
  const smallCustomers = inputs?.smallMediumCustomers || 0;
  const largeARPU = inputs?.revPerLargeCustomer || 16500;
  const smallARPU = inputs?.revPerSmallMediumCustomer || 3000;
  const operatingExpenses = inputs?.operatingExpenses || 50000;
  
  // Generate forecast table with real-time months
  let forecastTable = `| Month | Large Customers | SMB Customers | Total Revenue | Operating Expenses | Net Profit |\n`;
  forecastTable += `|-------|----------------|---------------|---------------|-------------------|------------|\n`;
  
  let currentLargeCustomers = largeCustomers;
  let currentSmallCustomers = smallCustomers;
  
  // Start from current month
  const currentDate = new Date();
  
  for (let month = 0; month < months; month++) {
    const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + month, 1);
    const monthName = forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Simple growth model
    if (month > 0) {
      // Add new customers each month
      currentSmallCustomers += 2;
      if (month % 2 === 0) { // Add large customers every 2 months
        currentLargeCustomers += 1;
      }
    }
    
    const largeRevenue = currentLargeCustomers * largeARPU;
    const smallRevenue = currentSmallCustomers * smallARPU;
    const totalRevenue = largeRevenue + smallRevenue;
    const netProfit = totalRevenue - operatingExpenses;
    
    forecastTable += `| ${monthName} | ${currentLargeCustomers} | ${currentSmallCustomers} | $${totalRevenue.toLocaleString()} | $${operatingExpenses.toLocaleString()} | $${netProfit.toLocaleString()} |\n`;
  }
  
  return forecastTable;
}

function generateRevenueForecastTable(query: string, inputs: FinancialInputs): string {
  const lowerQuery = query.toLowerCase();
  
  // Extract parameters from dashboard inputs
  const largeCustomers = inputs.largeCustomers || 0;
  const arpuLarge = inputs.revPerLargeCustomer || 0;
  const smallCustomers = inputs.smallMediumCustomers || 0;
  const arpuSmall = inputs.revPerSmallMediumCustomer || 0;
  
  // Check if user wants current revenue only
  const isCurrentOnly = lowerQuery.includes('current') && !lowerQuery.includes('forecast');
  
  // Determine forecast period - be more specific about timeframe detection
  let periods = 6; // Default to 6 months
  
  // Check for specific time periods first - be more aggressive with detection
  if (lowerQuery.includes('36 month') || lowerQuery.includes('3 year')) {
    periods = 36;
  } else if (lowerQuery.includes('24 month') || lowerQuery.includes('2 year') || lowerQuery.includes('24-month')) {
    periods = 24;
  } else if (lowerQuery.includes('18 month') || lowerQuery.includes('1.5 year')) {
    periods = 18;
  } else if (lowerQuery.includes('12 month') || (lowerQuery.includes('year') && !lowerQuery.includes('2 year') && !lowerQuery.includes('3 year'))) {
    periods = 12;
  } else if (lowerQuery.includes('9 month')) {
    periods = 9;
  } else if (lowerQuery.includes('6 month')) {
    periods = 6;
  } else if (lowerQuery.includes('quarter') || lowerQuery.includes('3 month')) {
    periods = 3;
  } else if (lowerQuery.includes('forecast') || lowerQuery.includes('projection')) {
    // If it's a forecast/projection request without specific timeframe, default to 12 months
    periods = 12;
  }
  
  // Debug logging
  console.log(`Forecast period detected: ${periods} months for query: "${query}"`);
  
  // Calculate current revenue
  const currentRevenue = (largeCustomers * arpuLarge) + (smallCustomers * arpuSmall);
  
  // Generate forecast table
  let forecastTable = `| Period | Large Customers | Small Customers | Total Customers | Large Revenue | Small Revenue | Total Revenue |\n`;
  forecastTable += `|--------|----------------|-----------------|-----------------|---------------|---------------|---------------|\n`;
  
  const currentDate = new Date();
  
  for (let i = 0; i < periods; i++) {
    const futureDate = new Date(currentDate);
    futureDate.setMonth(currentDate.getMonth() + i);
    const periodName = i === 0 ? 'Current' : futureDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    let periodRevenue = currentRevenue;
    let periodLargeCustomers = largeCustomers;
    let periodSmallCustomers = smallCustomers;
    
    // Apply growth if not current only
    if (!isCurrentOnly && i > 0) {
      // Sales pipeline analysis with win probability
      const winProbability = lowerQuery.includes('85%') ? 0.85 : 0.7; // Default 70% win rate
      
      // Large customers: Sales-led growth (1.5 new customers per sales person per month)
      const salesPeopleGrowth = Math.floor(i / 3); // Add 1 sales person every 3 months
      const newLargeCustomers = Math.round(salesPeopleGrowth * 1.5 * winProbability);
      periodLargeCustomers = largeCustomers + newLargeCustomers;
      
      // Small customers: Marketing-led growth (consistent acquisition)
      const monthlySmallCustomerGrowth = Math.round(72 * winProbability); // 72 new customers per month
      periodSmallCustomers = smallCustomers + (monthlySmallCustomerGrowth * i);
      
      periodRevenue = (periodLargeCustomers * arpuLarge) + (periodSmallCustomers * arpuSmall);
    }
    
    const largeRevenue = periodLargeCustomers * arpuLarge;
    const smallRevenue = periodSmallCustomers * arpuSmall;
    
    forecastTable += `| ${periodName} | ${periodLargeCustomers} | ${periodSmallCustomers} | ${periodLargeCustomers + periodSmallCustomers} | $${largeRevenue.toLocaleString()} | $${smallRevenue.toLocaleString()} | $${periodRevenue.toLocaleString()} |\n`;
  }
  
  return forecastTable;
}

export async function getFinancialForecast(query: string, inputs: FinancialInputs | null): Promise<{ responseType: 'answer' | 'forecast'; explanation: string; forecast?: string } | string> {
  try {
    console.log('getFinancialForecast called with query:', query.substring(0, 50));
    
    // Load financial formulas knowledge base
    const formulas = await loadFinancialFormulas();
    console.log('Financial formulas loaded successfully');
    
    // Initialize Gemini
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY is not set');
      return "I apologize, but the AI service is not properly configured. Please contact support.";
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Create context with user's business data
    let contextQuery = query;
    if (inputs) {
      const businessContext = formatInputsForQuery(inputs);
      contextQuery = `${query}\n\n${businessContext}`;
    }

    const lowerQuery = query.toLowerCase();

    const prompt = `You are an AI CFO Assistant with comprehensive financial expertise. Use the knowledge base to answer ALL financial questions accurately.

**USER QUERY:** ${contextQuery}

**FINANCIAL KNOWLEDGE BASE:** ${JSON.stringify(formulas, null, 2)}

**INSTRUCTIONS:**
1. ALWAYS use the knowledge base for financial definitions and calculations
2. For definitions: Provide the exact definition and formula from the knowledge base
3. For calculations: Use the exact formulas and show the calculation steps
4. For complex analysis: Reference the appropriate formulas and methodologies
5. Be comprehensive but concise

**RESPONSE REQUIREMENTS:**
- Use exact formulas from the knowledge base
- Include relevant keywords and calculations
- Provide business context when appropriate
- Reference specific metrics and methodologies

Answer the user's question using the knowledge base:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Check if this would generate a huge table (but don't auto-switch)
    const wouldGenerateTable = (
      // Table requests
      lowerQuery.includes('table') ||
      lowerQuery.includes('projection table') ||
      lowerQuery.includes('forecast table') ||
      
      // Projection/forecast with timeframes
      (lowerQuery.includes('projection') && (lowerQuery.includes('6 month') || lowerQuery.includes('12 month') || lowerQuery.includes('24 month') || lowerQuery.includes('11 month'))) ||
      (lowerQuery.includes('forecast') && (lowerQuery.includes('6 month') || lowerQuery.includes('12 month') || lowerQuery.includes('24 month') || lowerQuery.includes('11 month'))) ||
      
      // Revenue forecast requests
      (lowerQuery.includes('revenue') && lowerQuery.includes('forecast')) ||
      (lowerQuery.includes('generate') && lowerQuery.includes('forecast')) ||
      
      // Breakdown requests
      lowerQuery.includes('breakdown') ||
      (lowerQuery.includes('monthly') && lowerQuery.includes('breakdown')) ||
      (lowerQuery.includes('quarterly') && lowerQuery.includes('breakdown')) ||
      
      // Scenario analysis
      lowerQuery.includes('scenario') ||
      lowerQuery.includes('what if') ||
      lowerQuery.includes('analysis') ||
      
      // Sales pipeline
      lowerQuery.includes('pipeline') ||
      lowerQuery.includes('sales pipeline') ||
      
      // Trends and acquisition
      lowerQuery.includes('trends') ||
      lowerQuery.includes('acquisition trends') ||
      
      // Profitability and unit economics
      lowerQuery.includes('profitability') ||
      lowerQuery.includes('unit economics') ||
      lowerQuery.includes('economics')
    );

    // Always return chat response, but include table data if available
    if (wouldGenerateTable) {
      // Generate forecast data but don't auto-switch
      const forecastData = generateForecastData(query, inputs);
      
      // Return simple message instead of full table in chat
      const simpleMessage = "I've generated a detailed table for you. Click the button below to view it in the Forecast tab.";
      
      return {
        responseType: 'answer',
        explanation: simpleMessage,
        forecast: forecastData,
        hasTable: true
      };
    }

    return {
      responseType: 'answer',
      explanation: text,
      hasTable: false
    };

  } catch (error) {
    console.error('Error in getFinancialForecast:', error);
    
    return {
      responseType: 'answer' as const,
      explanation: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
    };
  }
}