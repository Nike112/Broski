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
2. For DEFINITIONS: Use the knowledge base formulas and provide detailed explanations
3. For CALCULATIONS: Use the exact formulas from the knowledge base
4. For TABLES/COMPARISONS: Say "Check the Forecast tab for detailed data"

**USER QUERY:** ${contextQuery}

**FINANCIAL KNOWLEDGE BASE:** ${JSON.stringify(formulas, null, 2)}

**YOUR TASK:**
1. **DEFINITION QUESTIONS** (What is MRR?, What is CAC?, etc.):
   - Use the knowledge base to provide comprehensive explanations
   - Include the exact formula from the knowledge base
   - Explain what it means for SaaS businesses
   - Give examples and business context
   - Be educational and detailed

2. **CALCULATION QUESTIONS** (Calculate our MRR, What's our burn rate, etc.):
   - Use the knowledge base formulas
   - Show the exact calculation steps
   - Provide the result with context
   - Explain what the number means

3. **TABLE/COMPARISON QUESTIONS** (Show breakdown, Compare metrics, etc.):
   - Say "Check the Forecast tab for detailed data"
   - Provide a brief summary in chat
   - Let the forecast system handle the tables

**RESPONSE FORMAT:**
- Always reference the knowledge base
- Use exact formulas provided
- Be comprehensive for definitions
- Be precise for calculations
- Direct to forecast tab for tables

Respond now using the knowledge base:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Check if this is a forecast request that needs structured data
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
      
      // Table and comparison requests
      lowerQuery.includes('breakdown') ||
      lowerQuery.includes('table') ||
      lowerQuery.includes('compare') ||
      lowerQuery.includes('vs') ||
      lowerQuery.includes('versus') ||
      lowerQuery.includes('analysis') ||
      lowerQuery.includes('detailed') ||
      
      // Specific forecast types
      lowerQuery.includes('quarterly forecast') ||
      lowerQuery.includes('annual forecast') ||
      lowerQuery.includes('month by month') ||
      
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