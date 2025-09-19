'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FinancialInputs } from '@/lib/store';
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

function generateForecastData(query: string, inputs: FinancialInputs | null): string {
  const lowerQuery = query.toLowerCase();
  
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
  
  // Default forecast for other requests
  let months = 6;
  if (lowerQuery.includes('12 month') || lowerQuery.includes('year') || lowerQuery.includes('annual')) {
    months = 12;
  } else if (lowerQuery.includes('18 month')) {
    months = 18;
  } else if (lowerQuery.includes('24 month') || lowerQuery.includes('2 year')) {
    months = 24;
  } else if (lowerQuery.includes('3 month') || lowerQuery.includes('quarter')) {
    months = 3;
  } else if (lowerQuery.includes('9 month')) {
    months = 9;
  }
  
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
  
  // Determine forecast period
  let periods = 6; // Default to 6 months
  if (lowerQuery.includes('3 year') || lowerQuery.includes('36 month')) {
    periods = 36;
  } else if (lowerQuery.includes('2 year') || lowerQuery.includes('24 month')) {
    periods = 24;
  } else if (lowerQuery.includes('year') || lowerQuery.includes('12 month')) {
    periods = 12;
  } else if (lowerQuery.includes('6 month')) {
    periods = 6;
  } else if (lowerQuery.includes('quarter') || lowerQuery.includes('3 month')) {
    periods = 3;
  } else if (lowerQuery.includes('forecast') || lowerQuery.includes('projection')) {
    // If it's a forecast/projection request, default to 12 months
    periods = 12;
  }
  
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

    const prompt = `You are an AI CFO Assistant. Answer the user's financial question concisely.

**USER QUERY:** ${contextQuery}

**FINANCIAL KNOWLEDGE BASE:** ${JSON.stringify(formulas, null, 2)}

Use the knowledge base to provide accurate financial information. Be concise and direct.`;

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
      (lowerQuery.includes('quarterly') && lowerQuery.includes('breakdown'))
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