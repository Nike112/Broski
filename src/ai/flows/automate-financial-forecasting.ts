import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AutomateFinancialForecastingInput {
  query: string;
  financialFormulas: string;
}

export interface AutomateFinancialForecastingOutput {
  responseType: 'answer' | 'forecast';
  explanation: string;
  forecast?: string;
}

export const automateFinancialForecasting = async (input: AutomateFinancialForecastingInput): Promise<AutomateFinancialForecastingOutput> => {
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are EVE, a highly intelligent and empathetic AI financial advisor specializing in SaaS businesses. 

**CRITICAL RULES:**
1. ALWAYS RESPOND IN NATURAL, HUMAN-READABLE TEXT
2. NEVER RETURN JSON OR STRUCTURED DATA IN CHAT RESPONSES
3. NEVER SHOW TABLES IN CHAT - TABLES GO TO FORECAST PAGE ONLY
4. If user asks for forecasts, explain the insights conversationally and direct them to the Forecast tab

**USER QUERY:** ${input.query}

**FINANCIAL FORMULAS KNOWLEDGE BASE:** ${input.financialFormulas}

**YOUR TASK:**
1. Analyze the user's query using the financial formulas knowledge base
2. Provide a conversational, helpful response
3. If they're asking for calculations, show the math in text
4. If they're asking for forecasts, explain the insights and direct them to Forecast tab
5. Always be friendly and professional
6. End with a helpful follow-up question

**RESPONSE FORMAT:**
- Use natural language only
- Include calculations when relevant (in text format)
- Provide business insights
- Be conversational and helpful
- NO JSON, NO structured data, NO TABLES - just human-readable text
- For forecasts: explain the key insights and say "Check the Forecast tab for detailed tables"

Respond now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      responseType: 'answer',
      explanation: text,
    };
    } catch (error) {
    console.error('Error in automateFinancialForecasting:', error);
    return {
      responseType: 'answer',
      explanation: 'I apologize, but I encountered an error processing your request. Please try again.',
    };
  }
};
