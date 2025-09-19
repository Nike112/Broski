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

  if (inputs.largeCustomers) parts.push(`${inputs.largeCustomers} large customers`);
  if (inputs.revPerLargeCustomer) parts.push(`with large customer revenue at $${inputs.revPerLargeCustomer}/mo`);
  if (inputs.smallMediumCustomers) parts.push(`${inputs.smallMediumCustomers} small/medium customers`);
  if (inputs.revPerSmallMediumCustomer) parts.push(`with S/M customer revenue at $${inputs.revPerSmallMediumCustomer}/mo`);
  if (inputs.operatingExpenses) parts.push(`operating expenses of $${inputs.operatingExpenses}/mo`);
  if (inputs.cashInBank) parts.push(`cash in bank of $${inputs.cashInBank}`);
  if (inputs.cac) parts.push(`a CAC of $${inputs.cac}`);

  if (parts.length === 0) return '';
  
  const joinedParts = parts.join(', ');
  return `Calculate revenue based on these parameters: ${joinedParts}.`;
}

function generateForecastData(query: string, inputs: FinancialInputs | null): string {
  const lowerQuery = query.toLowerCase();
  
  // Determine forecast period
  let months = 6; // default
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

    const prompt = `You are an AI CFO Assistant integrated with a dashboard.

**DECISION FRAMEWORK:**

1. **CHAT OUTPUT ONLY** (Single value, short explanation):
   - Direct facts: "What is our current MRR?"
   - Single metrics: "How many new customers this quarter?"
   - Formula applications: "What is our CAC?"
   - Keep responses SHORT and DIRECT
   - NO tables, NO verbose explanations

2. **FORECAST SECTION** (Multiple periods, breakdowns):
   - Projections: "Show MRR forecast for next 6 months"
   - Comparisons: "Compare large vs small customers for 12 months"
   - Breakdowns: "Give churn projections for next 3 quarters"
   - Return structured data for dashboard

**USER QUERY:** ${contextQuery}

**FINANCIAL FORMULAS KNOWLEDGE BASE:** ${JSON.stringify(formulas, null, 2)}

**YOUR TASK:**
1. Determine if this needs a simple chat answer OR forecast data
2. For simple answers: Be direct and concise
3. For forecasts: Say "Check the Forecast tab for detailed projections"
4. Use the knowledge base for accurate calculations

**RESPONSE FORMAT:**
- Simple questions → Short, direct answers
- Forecast questions → "Check the Forecast tab for detailed projections"
- Be helpful but concise
- Use actual calculations from the knowledge base

Respond now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Check if this is a forecast request that needs structured data
    const lowerQuery = query.toLowerCase();
    const isForecastRequest = (
      // Explicit forecast/projection requests
      (lowerQuery.includes('forecast') && (lowerQuery.includes('generate') || lowerQuery.includes('create') || lowerQuery.includes('show') || lowerQuery.includes('next'))) ||
      (lowerQuery.includes('projection') && (lowerQuery.includes('generate') || lowerQuery.includes('create') || lowerQuery.includes('show') || lowerQuery.includes('next'))) ||
      (lowerQuery.includes('predict') && (lowerQuery.includes('generate') || lowerQuery.includes('create') || lowerQuery.includes('show'))) ||
      
      // Specific time period requests
      (lowerQuery.includes('month') && (lowerQuery.includes('6') || lowerQuery.includes('12') || lowerQuery.includes('18') || lowerQuery.includes('24'))) ||
      (lowerQuery.includes('year') && (lowerQuery.includes('1') || lowerQuery.includes('2'))) ||
      (lowerQuery.includes('quarter') && (lowerQuery.includes('3') || lowerQuery.includes('forecast') || lowerQuery.includes('projection'))) ||
      
      // Scenario analysis requests
      (lowerQuery.includes('what if') && (lowerQuery.includes('double') || lowerQuery.includes('reduce') || lowerQuery.includes('increase') || lowerQuery.includes('next'))) ||
      (lowerQuery.includes('scenario') && (lowerQuery.includes('optimistic') || lowerQuery.includes('pessimistic') || lowerQuery.includes('realistic') || lowerQuery.includes('with'))) ||
      (lowerQuery.includes('show scenario')) ||
      
      // Specific forecast types
      lowerQuery.includes('quarterly forecast') ||
      lowerQuery.includes('annual forecast') ||
      lowerQuery.includes('month by month') ||
      lowerQuery.includes('breakdown') ||
      lowerQuery.includes('table') ||
      
      // Time-based analysis
      lowerQuery.includes('monthly') ||
      lowerQuery.includes('quarterly') ||
      lowerQuery.includes('yearly') ||
      lowerQuery.includes('over time') ||
      lowerQuery.includes('trend analysis')
    );
    
    if (isForecastRequest) {
      // Generate forecast data with real-time months
      const forecastData = generateForecastData(query, inputs);
      
      return {
        responseType: 'forecast',
        explanation: text,
        forecast: forecastData
      };
    }

    return {
      responseType: 'answer',
      explanation: text,
    };

  } catch (error) {
    console.error('Error in getFinancialForecast:', error);
    
    return {
      responseType: 'answer' as const,
      explanation: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
    };
  }
}