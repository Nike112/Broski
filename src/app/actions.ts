
'use server';

import { automateFinancialForecasting, type AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';
import type { FinancialInputs } from '@/lib/store';
import fs from 'fs/promises';
import path from 'path';

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

  if (parts.length === 0) return '';
  
  const joinedParts = parts.join(', ');
  return `Calculate revenue based on these parameters: ${joinedParts}.`;
}

export async function getFinancialForecast(query: string, inputs: FinancialInputs | null): Promise<AutomateFinancialForecastingOutput | string> {
  try {
    let finalQuery = query;
    if (inputs && Object.keys(inputs).length > 0) {
      const inputsQuery = formatInputsForQuery(inputs);
      finalQuery = query ? `${query}, using the following parameters: ${inputsQuery}` : inputsQuery;
    }

    if (!finalQuery) {
        return "Please provide a query or set some inputs in the dashboard.";
    }

    const filePath = path.join(process.cwd(), 'src', 'lib', 'financial-formulas.json');
    const financialFormulas = await fs.readFile(filePath, 'utf-8');

    const result = await automateFinancialForecasting({
      query: finalQuery,
      financialFormulas,
    });

    return result;
  } catch (error) {
    console.error('Error getting financial forecast:', error);
    return 'Error: Could not generate the forecast. The AI model may be unavailable or the query could not be processed. Please try again later.';
  }
}
