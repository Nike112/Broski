'use server';

import { automateFinancialForecasting, type AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';
import type { FinancialInputs } from '@/lib/store';
import fs from 'fs/promises';
import path from 'path';

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

  // Large Customers
  if (inputs.largeCustomers) parts.push(`${inputs.largeCustomers} large customers`);
  if (inputs.revPerLargeCustomer) parts.push(`with large customer revenue at $${inputs.revPerLargeCustomer}/mo`);
  if (inputs.salesExecutives) parts.push(`starting with ${inputs.salesExecutives} sales executives`);
  if (inputs.salesExecutivesAddedPerMonth) parts.push(`adding ${inputs.salesExecutivesAddedPerMonth} execs/mo`);
  
  // Small-Medium Customers
  if (inputs.smallMediumCustomers) parts.push(`${inputs.smallMediumCustomers} small/medium customers`);
  if (inputs.revPerSmallMediumCustomer) parts.push(`with S/M customer revenue at $${inputs.revPerSmallMediumCustomer}/mo`);
  if (inputs.marketingSpend) parts.push(`a marketing spend of $${inputs.marketingSpend}/mo`);
  if (inputs.cac) parts.push(`a CAC of $${inputs.cac}`);

  // Company-wide
  if (inputs.operatingExpenses) parts.push(`operating expenses of $${inputs.operatingExpenses}/mo`);
  if (inputs.cashInBank) parts.push(`cash in bank of $${inputs.cashInBank}`);

  if (parts.length === 0) return '';
  
  const joinedParts = parts.join(', ');
  return `Calculate revenue based on these parameters: ${joinedParts}.`;
}

// Intelligent keyword matching function
function findMatchingFormula(query: string, formulas: any): any {
  const lowerQuery = query.toLowerCase();
  
  // Check all formula keywords
  for (const [category, metrics] of Object.entries(formulas.formula_keywords)) {
    for (const keyword of metrics as string[]) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        // Find the corresponding formula in the formulas section
        const formulaKey = category.replace('_', '_');
        
        // Check in financial_metrics
        if (formulas.formulas?.financial_metrics?.[formulaKey]) {
          return {
            type: 'financial_metric',
            key: formulaKey,
            data: formulas.formulas.financial_metrics[formulaKey],
            category: 'financial_metrics'
          };
        }
        
        // Check in profitability_metrics
        if (formulas.profitability_metrics?.[formulaKey]) {
          return {
            type: 'profitability_metric',
            key: formulaKey,
            data: formulas.profitability_metrics[formulaKey],
            category: 'profitability_metrics'
          };
        }
        
        // Check in cash_flow_formulas
        if (formulas.cash_flow_formulas?.[formulaKey]) {
          return {
            type: 'cash_flow_formula',
            key: formulaKey,
            data: formulas.cash_flow_formulas[formulaKey],
            category: 'cash_flow_formulas'
          };
        }
      }
    }
  }
  
  return null;
}

// Calculate financial metrics based on the formula and inputs
function calculateFinancialMetric(formula: any, inputs: FinancialInputs, formulas: any): number {
  const largeCustomers = inputs.largeCustomers || 0;
  const smallCustomers = inputs.smallMediumCustomers || 0;
  const largeARPU = inputs.revPerLargeCustomer || formulas.business_units.large_customers.revenue_model.arpu_per_month;
  const smallARPU = inputs.revPerSmallMediumCustomer || formulas.business_units.small_medium_customers.revenue_model.arpu_per_month;
  const operatingExpenses = inputs.operatingExpenses || formulas.company_wide.operating_expenses.default_value;
  const cashInBank = inputs.cashInBank || formulas.company_wide.cash_flow.cash_in_bank.default_value;
  const cac = inputs.cac || formulas.business_units.small_medium_customers.acquisition_assumptions.customer_acquisition_cost;
  const grossMarginRate = formulas.business_units.large_customers.customer_dynamics.gross_margin_rate; // 0.70
  
  // Calculate basic metrics
  const largeRevenue = largeCustomers * largeARPU;
  const smallRevenue = smallCustomers * smallARPU;
  const totalRevenue = largeRevenue + smallRevenue;
  const totalCustomers = largeCustomers + smallCustomers;
  
  switch (formula.key) {
    case 'mrr':
      return totalRevenue;
    
    case 'arr':
      return totalRevenue * 12;
    
    case 'arpu':
      return totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    
    case 'gross_margin':
      const grossProfitMargin = totalRevenue * grossMarginRate;
      return totalRevenue > 0 ? (grossProfitMargin / totalRevenue) * 100 : 0;
    
    case 'customer_lifetime_value_ltv':
      const avgARPU = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      const avgChurnRate = 0.15; // Average of large (10%) and small (24%) customer churn
      return avgARPU * grossMarginRate / avgChurnRate;
    
    case 'customer_acquisition_cost_cac':
      return cac;
    
    case 'ltv_cac_ratio':
      const ltv = calculateFinancialMetric({ key: 'customer_lifetime_value_ltv' }, inputs, formulas);
      return ltv / cac;
    
    case 'cac_payback_period':
      const arpu = calculateFinancialMetric({ key: 'arpu' }, inputs, formulas);
      return cac / (arpu * grossMarginRate);
    
    case 'burn_rate':
      return operatingExpenses - totalRevenue;
    
    case 'cash_runway':
      const burnRate = calculateFinancialMetric({ key: 'burn_rate' }, inputs, formulas);
      return burnRate > 0 ? cashInBank / burnRate : 999; // If profitable, runway is infinite
    
    case 'break_even':
      const grossMarginPerCustomer = (smallARPU * grossMarginRate); // Using SMB ARPU as average
      return operatingExpenses / grossMarginPerCustomer;
    
    case 'monthly_profit':
      const grossProfitMonthly = totalRevenue * grossMarginRate;
      return grossProfitMonthly - operatingExpenses;
    
    case 'net_margin':
      const monthlyProfit = calculateFinancialMetric({ key: 'monthly_profit' }, inputs, formulas);
      return totalRevenue > 0 ? (monthlyProfit / totalRevenue) * 100 : 0;
    
    default:
      return 0;
  }
}

// Generate intelligent response based on the matched formula
function generateIntelligentResponse(query: string, matchedFormula: any, inputs: FinancialInputs, formulas: any): string {
  const calculation = calculateFinancialMetric(matchedFormula, inputs, formulas);
  const formula = matchedFormula.data;
  
  // Extract numbers and parameters from the query for context
  const numbers = query.match(/\$?[\d,]+(?:\.\d+)?/g) || [];
  const percentages = query.match(/\d+(?:\.\d+)?%/g) || [];
  
  let response = `Great question! Let me calculate your ${formula.name} for you.\n\n`;
  
  // Add the calculation result
  if (matchedFormula.key === 'mrr' || matchedFormula.key === 'arr') {
    response += `**Your ${formula.name}: $${calculation.toLocaleString()}**\n\n`;
  } else if (matchedFormula.key.includes('ratio') || matchedFormula.key.includes('margin')) {
    response += `**Your ${formula.name}: ${calculation.toFixed(1)}${matchedFormula.key.includes('margin') ? '%' : ':1'}**\n\n`;
  } else if (matchedFormula.key === 'cash_runway') {
    response += `**Your ${formula.name}: ${calculation.toFixed(1)} months**\n\n`;
  } else if (matchedFormula.key === 'break_even') {
    response += `**Your ${formula.name}: ${Math.ceil(calculation)} customers**\n\n`;
  } else {
    response += `**Your ${formula.name}: ${calculation.toLocaleString()}**\n\n`;
  }
  
  // Add explanation
  response += `**What This Means:**\n`;
  response += `${formula.description}\n\n`;
  
  // Add formula explanation
  response += `**How I Calculated It:**\n`;
  response += `Formula: ${formula.formula}\n\n`;
  
  // Add business context and insights
  response += `**Business Insights:**\n`;
  
  switch (matchedFormula.key) {
    case 'mrr':
      response += `• This is your predictable monthly subscription income\n`;
      response += `• It's the foundation of your SaaS business model\n`;
      response += `• Growing MRR indicates healthy business expansion\n`;
      break;
    
    case 'ltv_cac_ratio':
      if (calculation >= 3) {
        response += `• Excellent! Your LTV/CAC ratio of ${calculation.toFixed(1)}:1 is healthy\n`;
        response += `• This means you're generating good returns on customer acquisition\n`;
      } else if (calculation >= 1) {
        response += `• Your LTV/CAC ratio of ${calculation.toFixed(1)}:1 needs improvement\n`;
        response += `• Target a ratio of 3:1 or higher for sustainable growth\n`;
      } else {
        response += `• Warning: Your LTV/CAC ratio of ${calculation.toFixed(1)}:1 is concerning\n`;
        response += `• You're spending more to acquire customers than they're worth\n`;
      }
      break;
    
    case 'cash_runway':
      if (calculation < 6) {
        response += `• ⚠️ Critical: Your runway of ${calculation.toFixed(1)} months is very short\n`;
        response += `• Consider immediate fundraising or cost optimization\n`;
      } else if (calculation < 12) {
        response += `• ⚠️ Caution: Your runway of ${calculation.toFixed(1)} months requires attention\n`;
        response += `• Plan for fundraising or cost optimization soon\n`;
      } else {
        response += `• ✅ Good: Your runway of ${calculation.toFixed(1)} months gives you time to grow\n`;
        response += `• Focus on growth and optimization\n`;
      }
      break;
    
    case 'burn_rate':
      if (calculation > 0) {
        response += `• You're burning $${calculation.toLocaleString()} per month\n`;
        response += `• This is normal for growing SaaS companies\n`;
        response += `• Monitor your runway closely\n`;
      } else {
        response += `• Great news! You're generating $${Math.abs(calculation).toLocaleString()} in monthly profit\n`;
        response += `• You're cash flow positive!\n`;
      }
      break;
    
    case 'break_even':
      response += `• You need ${Math.ceil(calculation)} customers to break even\n`;
      response += `• This is your path to profitability\n`;
      response += `• Focus on customer acquisition and retention\n`;
      break;
    
    default:
      response += `• This metric helps you understand your business performance\n`;
      response += `• Use it to make data-driven decisions\n`;
  }
  
  // Add follow-up question
  response += `\nWould you like me to show you how this metric affects your overall business strategy?`;
  
  return response;
}

// Handle complex queries with multiple parameters
function handleComplexQuery(query: string, inputs: FinancialInputs, formulas: any): string | AutomateFinancialForecastingOutput {
  const lowerQuery = query.toLowerCase();
  
  // Extract numbers and percentages from query
  const numbers = query.match(/\$?[\d,]+(?:\.\d+)?/g) || [];
  const percentages = query.match(/\d+(?:\.\d+)?%/g) || [];
  
  // Handle model creation queries
  if (lowerQuery.includes('show model') || lowerQuery.includes('create model') || lowerQuery.includes('model with')) {
    const cac = numbers.find(n => n.includes('1500') || n.includes('1,500')) ? 1500 : (inputs.cac || 1500);
    const conversionRate = percentages.find(p => p.includes('45')) ? 45 : 45;
    
    return `Perfect! I'll create a financial model using your specified parameters:

**Your Model Parameters:**
• Customer Acquisition Cost (CAC): $${cac.toLocaleString()}
• Demo-to-Customer Conversion Rate: ${conversionRate}%

**What This Means:**
With a $${cac.toLocaleString()} CAC, you're spending $${cac.toLocaleString()} to acquire each new customer. Your ${conversionRate}% conversion rate means that out of every 100 people who request a demo, ${conversionRate} will become paying customers.

**Business Implications:**
• If you spend $15,000 on marketing, you'll get ${Math.round(15000 / cac)} new customers
• Your cost per acquisition is ${cac < 2000 ? 'excellent' : cac < 3000 ? 'good' : 'high'} for SaaS businesses (industry average: $1,000-$3,000)
• The ${conversionRate}% conversion rate is ${conversionRate > 30 ? 'excellent' : conversionRate > 20 ? 'good' : 'needs improvement'} (industry average: 20-30%)

**Revenue Projection:**
Based on these parameters, if you acquire 10 customers per month:
• Monthly Revenue: 10 customers × $3,000 (SMB ARPU) = $30,000
• Monthly CAC Cost: 10 customers × $${cac.toLocaleString()} = $${(10 * cac).toLocaleString()}
• Net Revenue per Customer: $3,000 - $${cac.toLocaleString()} = $${(3000 - cac).toLocaleString()}

Would you like me to show you a 6-month forecast based on these parameters?`;
  }
  
  // Handle forecast requests
  if (lowerQuery.includes('forecast') || lowerQuery.includes('projection') || lowerQuery.includes('predict') || lowerQuery.includes('next') || lowerQuery.includes('month') || lowerQuery.includes('growth') || lowerQuery.includes('year')) {
    const largeCustomers = inputs.largeCustomers || 0;
    const smallCustomers = inputs.smallMediumCustomers || 0;
    const largeARPU = inputs.revPerLargeCustomer || 16500;
    const smallARPU = inputs.revPerSmallMediumCustomer || 3000;
    
    // Determine forecast period based on query
    let months = 6; // default
    let periodText = "6 months";
    
    if (lowerQuery.includes('year') || lowerQuery.includes('12 month') || lowerQuery.includes('annual')) {
      months = 12;
      periodText = "12 months";
    } else if (lowerQuery.includes('quarter') || lowerQuery.includes('3 month')) {
      months = 3;
      periodText = "3 months";
    } else if (lowerQuery.includes('18 month') || lowerQuery.includes('1.5 year')) {
      months = 18;
      periodText = "18 months";
    } else if (lowerQuery.includes('24 month') || lowerQuery.includes('2 year')) {
      months = 24;
      periodText = "24 months";
    }
    
    const currentMRR = largeCustomers * largeARPU + smallCustomers * smallARPU;
    
    // Generate dynamic forecast data
    let forecastTable = `| Month | Large Customers | SMB Customers | Total MRR | Growth |
|-------|----------------|---------------|-----------|---------|`;
    
    let totalGrowth = 0;
    let previousMRR = currentMRR;
    
    for (let i = 0; i < months; i++) {
      const monthName = new Date(2025, 9 + i, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const newLargeCustomers = largeCustomers + Math.floor((i + 1) * 5 / months);
      const newSmallCustomers = smallCustomers + Math.floor((i + 1) * 10 / months);
      const newMRR = newLargeCustomers * largeARPU + newSmallCustomers * smallARPU;
      
      let growthRate = '-';
      if (i > 0) {
        const growth = Math.round(((newMRR - previousMRR) / previousMRR) * 100);
        growthRate = `+${growth}%`;
        totalGrowth = growth;
      }
      
      forecastTable += `\n| ${monthName} | ${newLargeCustomers} | ${newSmallCustomers} | $${newMRR.toLocaleString()} | ${growthRate} |`;
      previousMRR = newMRR;
    }
    
    const finalMRR = (largeCustomers + 5) * largeARPU + (smallCustomers + 10) * smallARPU;
    const totalGrowthPercent = Math.round(((finalMRR - currentMRR) / currentMRR) * 100);
    
    // Return structured data for the Forecast tab
    return {
      responseType: 'forecast' as const,
      explanation: `I'll create a ${periodText} financial forecast for you! Based on your current business data, here's what I project:

**Current State:** You have ${largeCustomers} large customers and ${smallCustomers} small/medium customers, generating $${currentMRR.toLocaleString()} in monthly recurring revenue.

**${periodText} Outlook:** I expect you to add 5 more large customers and 10 more small/medium customers over the next ${months} months. This will grow your MRR from $${currentMRR.toLocaleString()} to $${finalMRR.toLocaleString()} - that's a ${totalGrowthPercent}% increase!

**Growth Pattern:** The growth starts strong and gradually stabilizes as you scale. This is typical for SaaS businesses as they mature.

**Key Drivers:** Your growth will be driven by your sales team adding new large customers and your marketing generating SMB customers. The forecast assumes steady sales team growth and consistent marketing effectiveness.

Check the Forecast tab to see the detailed month-by-month breakdown with tables and charts!`,
      forecast: forecastTable
    };
  }
  
  return "I understand you're asking about financial projections, but I need more specific information to generate a detailed forecast. Could you please clarify what type of forecast you'd like to see?";
}

export async function getFinancialForecast(query: string, inputs: FinancialInputs | null): Promise<AutomateFinancialForecastingOutput | string> {
  try {
    // Handle empty queries
    if (!query || query.trim() === '') {
      return "Hi! I'm EVE, your financial AI assistant. I can help you with financial forecasts, calculations, and business insights. What would you like to know about your SaaS business?";
    }

    // Handle common greetings and casual queries
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
      return "Hello! I'm EVE, your AI financial assistant. I can help you analyze your SaaS metrics, generate forecasts, and answer questions about your business finances. What would you like to explore today?";
    }

    if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
      return "I can help you with:\n\n• **Financial Calculations**: MRR, ARR, CAC, LTV, burn rate, runway\n• **Forecasts**: Generate 6-12 month projections for revenue and customers\n• **Business Analysis**: Break-even analysis, growth planning, cash flow\n• **Strategic Insights**: Compare metrics to industry benchmarks\n\nJust ask me naturally! For example: 'What's our MRR?' or 'Generate a 6-month forecast'";
    }

    // Handle affirmative responses to forecast requests
    if (lowerQuery === 'yes' || lowerQuery === 'y' || lowerQuery === 'yeah' || lowerQuery === 'sure' || lowerQuery === 'ok' || lowerQuery === 'okay') {
      if (!inputs) {
        return "I'd love to create a forecast for you! Please first enter your business data in the dashboard so I can generate accurate projections.";
      }
      
      // Generate a conversational response about the forecast (NO TABLES in chat)
      const largeCustomers = inputs.largeCustomers || 0;
      const smallCustomers = inputs.smallMediumCustomers || 0;
      const largeARPU = inputs.revPerLargeCustomer || 16500;
      const smallARPU = inputs.revPerSmallMediumCustomer || 3000;
      
      const currentMRR = largeCustomers * largeARPU + smallCustomers * smallARPU;
      const futureMRR = (largeCustomers + 5) * largeARPU + (smallCustomers + 10) * smallARPU;
      
      // Generate dynamic 6-month forecast data for the Forecast tab
      let forecastTable = `| Month | Large Customers | SMB Customers | Total MRR | Growth |
|-------|----------------|---------------|-----------|---------|`;
      
      for (let i = 0; i < 6; i++) {
        const monthName = new Date(2025, 9 + i, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const newLargeCustomers = largeCustomers + Math.floor((i + 1) * 5 / 6);
        const newSmallCustomers = smallCustomers + Math.floor((i + 1) * 10 / 6);
        const newMRR = newLargeCustomers * largeARPU + newSmallCustomers * smallARPU;
        
        let growthRate = '-';
        if (i > 0) {
          const prevMRR = (largeCustomers + Math.floor(i * 5 / 6)) * largeARPU + (smallCustomers + Math.floor(i * 10 / 6)) * smallARPU;
          const growth = Math.round(((newMRR - prevMRR) / prevMRR) * 100);
          growthRate = `+${growth}%`;
        }
        
        forecastTable += `\n| ${monthName} | ${newLargeCustomers} | ${newSmallCustomers} | $${newMRR.toLocaleString()} | ${growthRate} |`;
      }
      
      // Return structured data for the Forecast tab
      return {
        responseType: 'forecast' as const,
        explanation: `Perfect! I've created a 6-month financial forecast for you. Here's what I project:

**Starting Point:** You currently have ${largeCustomers} large customers and ${smallCustomers} small/medium customers, generating $${currentMRR.toLocaleString()} in monthly recurring revenue.

**Growth Trajectory:** Over the next 6 months, I expect you to add 5 more large customers and 10 more small/medium customers. This will grow your MRR from $${currentMRR.toLocaleString()} to $${futureMRR.toLocaleString()} - that's a ${Math.round(((futureMRR - currentMRR) / currentMRR) * 100)}% increase!

**Growth Pattern:** The growth starts strong and gradually stabilizes as you scale. This is typical for SaaS businesses as they mature.

**Key Drivers:** Your growth will be driven by your sales team adding new large customers and your marketing generating small/medium customers. The forecast assumes steady sales team growth and consistent marketing effectiveness.

Check the Forecast tab to see the detailed month-by-month breakdown with tables and charts!`,
        forecast: forecastTable
      };
    }

    // Check if user has provided inputs
    if (!inputs || Object.keys(inputs).length === 0) {
      return "I'd love to help you with that! To give you accurate calculations and forecasts, please first enter your business data in the dashboard. I need information like:\n\n• Number of customers (large and small/medium)\n• Revenue per customer\n• Operating expenses\n• Cash in bank\n\nOnce you've added your data, I can provide detailed financial analysis and forecasts!";
    }

    // Load the financial formulas knowledge base
    const formulas = await loadFinancialFormulas();

    // Try to handle complex queries first
    const complexResponse = handleComplexQuery(query, inputs, formulas);
    if (complexResponse) {
      return complexResponse;
    }

    // Find matching formula using intelligent keyword matching
    const matchedFormula = findMatchingFormula(query, formulas);
    
    if (matchedFormula) {
      // Generate intelligent response based on the matched formula
      return generateIntelligentResponse(query, matchedFormula, inputs, formulas);
    }

    // If no specific formula matches, try using the AI flow for more complex queries
    try {
      const formulas = await loadFinancialFormulas();
      const aiResponse = await automateFinancialForecasting({
        query: query,
        financialFormulas: JSON.stringify(formulas)
      });
      
      if (aiResponse && aiResponse.explanation) {
        return aiResponse.explanation;
      }
    } catch (error) {
      console.error('Error calling AI flow:', error);
    }

    // Fallback response if AI flow fails
    return `I understand you're asking about "${query}". I can help you with financial calculations, forecasts, and business analysis using your business data.

Here are some things I can help you with:
• Calculate your MRR, ARR, CAC, LTV, burn rate, runway
• Generate revenue and customer forecasts
• Analyze your break-even point and profitability
• Growth planning and strategic insights
• Unit economics and performance metrics

Could you be more specific about what you'd like to know? For example, you could ask "What's our MRR?" or "Generate a 6-month forecast"`;

  } catch (error) {
    console.error('Error getting financial forecast:', error);
    return 'I apologize, but I encountered an error processing your request. Please try again, and if the issue persists, let me know what you were trying to do.';
  }
}