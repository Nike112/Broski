'use server';

/**
 * @fileOverview Interprets a financial query using the Gemini API to identify relevant formulas and data points.
 *
 * - interpretFinancialQuery - A function that interprets the financial query.
 * - InterpretFinancialQueryInput - The input type for the interpretFinancialQuery function.
 * - InterpretFinancialQueryOutput - The return type for the interpretFinancialQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const InterpretFinancialQueryInputSchema = z.object({
  query: z.string().describe('The financial query in natural language.'),
});
export type InterpretFinancialQueryInput = z.infer<typeof InterpretFinancialQueryInputSchema>;

const InterpretFinancialQueryOutputSchema = z.object({
  relevantFormulas: z.array(z.string()).describe('The relevant financial formulas identified.'),
  dataPoints: z.array(z.string()).describe('The data points to display.'),
});
export type InterpretFinancialQueryOutput = z.infer<typeof InterpretFinancialQueryOutputSchema>;

export async function interpretFinancialQuery(input: InterpretFinancialQueryInput): Promise<InterpretFinancialQueryOutput> {
  return interpretFinancialQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretFinancialQueryPrompt',
  input: {schema: InterpretFinancialQueryInputSchema},
  output: {schema: InterpretFinancialQueryOutputSchema},
  prompt: `You are a financial expert. Analyze the following financial query and identify the relevant financial formulas and data points to display in a tabular format.

Query: {{{query}}}

Specifically identify:
1. The financial formulas that are most relevant to answering the query.
2. The specific data points that would be most helpful to display in a table to address the query.

Format your output as a JSON object with "relevantFormulas" and "dataPoints" keys. Each key should have an array of strings as its value.
`, 
});

const interpretFinancialQueryFlow = ai.defineFlow(
  {
    name: 'interpretFinancialQueryFlow',
    inputSchema: InterpretFinancialQueryInputSchema,
    outputSchema: InterpretFinancialQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
