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

    // Check if this is a definition question (not asking for current values)
    const lowerQuery = query.toLowerCase();
    const isDefinitionQuestion = (
      (lowerQuery.includes('what is') && !lowerQuery.includes('our current') && !lowerQuery.includes('our ')) ||
      (lowerQuery.includes('what are') && !lowerQuery.includes('our current') && !lowerQuery.includes('our ')) ||
      lowerQuery.includes('define') ||
      lowerQuery.includes('explain') ||
      lowerQuery.includes('meaning of')
    );

    const prompt = `You are an AI CFO Assistant with access to a comprehensive financial knowledge base.

**CRITICAL INSTRUCTIONS:**
1. ALWAYS use the provided knowledge base for ALL financial questions
2. Keep responses SHORT and DIRECT - NO explanations
3. For DEFINITIONS: Just give the definition and formula
4. For CALCULATIONS: Just show the result
5. For TABLES/COMPARISONS: Say "Check the Forecast tab for detailed data"

**USER QUERY:** ${contextQuery}

**FINANCIAL KNOWLEDGE BASE:** ${JSON.stringify(formulas, null, 2)}

**YOUR TASK:**
1. **DEFINITION QUESTIONS** (What is MRR?, What is CAC?, etc.):
   - Give the definition from knowledge base
   - Include the formula
   - NO explanations or examples

2. **CALCULATION QUESTIONS** (Calculate our MRR, What's our burn rate, etc.):
   - Use the knowledge base formulas
   - Show the calculation result
   - NO explanations

3. **TABLE/COMPARISON QUESTIONS** (Show breakdown, Compare metrics, etc.):
   - Say "Check the Forecast tab for detailed data"

**RESPONSE FORMAT:**
- Be direct and concise
- NO explanations or context
- Just the answer
- Use knowledge base formulas

Respond now using the knowledge base:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Check if this is a forecast request that needs structured data
    const isForecastRequest = (
      // Explicit forecast/projection requests with action words
      (lowerQuery.includes('generate') && (lowerQuery.includes('forecast') || lowerQuery.includes('projection'))) ||
      (lowerQuery.includes('create') && (lowerQuery.includes('forecast') || lowerQuery.includes('projection'))) ||
      (lowerQuery.includes('show') && (lowerQuery.includes('forecast') || lowerQuery.includes('projection'))) ||
      
      // Specific time period forecasts
      (lowerQuery.includes('6 month') && lowerQuery.includes('forecast')) ||
      (lowerQuery.includes('12 month') && lowerQuery.includes('forecast')) ||
      (lowerQuery.includes('quarterly forecast')) ||
      (lowerQuery.includes('annual forecast')) ||
      (lowerQuery.includes('month by month')) ||
      
      // Scenario analysis with specific actions
      (lowerQuery.includes('what if') && (lowerQuery.includes('double') || lowerQuery.includes('reduce') || lowerQuery.includes('increase'))) ||
      (lowerQuery.includes('scenario') && (lowerQuery.includes('optimistic') || lowerQuery.includes('pessimistic') || lowerQuery.includes('realistic'))) ||
      
      // Table requests for forecast tab
      (lowerQuery.includes('breakdown') && (lowerQuery.includes('monthly') || lowerQuery.includes('quarterly') || lowerQuery.includes('forecast'))) ||
      (lowerQuery.includes('table') && (lowerQuery.includes('forecast') || lowerQuery.includes('projection'))) ||
      (lowerQuery.includes('compare') && (lowerQuery.includes('month') || lowerQuery.includes('quarter') || lowerQuery.includes('year')))
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