import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini 2.5 Pro
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Simple response processor - keep it short and clean
const processSmartResponse = (text: string) => {
  // Clean up the response
  let cleanText = text
    .replace(/```json|```/g, '')
    .replace(/^\s*[\{\[]/, '')
    .replace(/[\}\]]\s*$/, '')
    .trim();

  // Check if it's a forecast table (contains | separators)
  if (cleanText.includes('|') && cleanText.includes('Month') && cleanText.includes('$')) {
    // Extract the table part (everything after "Table:" or the table itself)
    const tableMatch = cleanText.match(/\|.*\|[\s\S]*/);
    if (tableMatch) {
      return {
        responseType: 'forecast',
        explanation: 'Check Forecast tab',
        forecast: tableMatch[0].trim()
      };
    }
  }

  // Check if it's a structured forecast JSON (fallback)
  if (cleanText.includes('"type": "forecast"') || cleanText.includes('"metric"') || cleanText.includes('"data"')) {
    try {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.type === 'forecast') {
          // For forecasts, always just say "Check Forecast tab"
          return {
            responseType: 'forecast',
            explanation: 'Check Forecast tab',
            forecast: JSON.stringify(parsed, null, 2)
          };
        }
      }
    } catch (e) {
      // Fall through to simple text processing
    }
  }

  // For all other responses, keep them short
  // Truncate if too long
  if (cleanText.length > 200) {
    cleanText = cleanText.substring(0, 200) + '...';
  }

  return {
    responseType: 'answer',
    explanation: cleanText,
    forecast: ''
  };
};

export const ai = {
  definePrompt: ({ name, input, output, prompt }: any) => {
    const promptFunction = async (inputData: any) => {
      try {
        // Replace placeholders in the prompt with actual data
        let formattedPrompt = prompt;
        Object.keys(inputData).forEach(key => {
          const placeholder = `{{{${key}}}}`;
          formattedPrompt = formattedPrompt.replace(new RegExp(placeholder, 'g'), inputData[key]);
        });

        const result = await model.generateContent(formattedPrompt);
        const response = await result.response;
        const text = response.text();

        // Process the response with smart routing
        const processedResponse = processSmartResponse(text);
        
        return { 
          output: processedResponse
        };
      } catch (error) {
        console.error('Error calling Gemini API:', error);
        return {
          output: {
            responseType: 'answer',
            explanation: 'Sorry, I had trouble processing that. Could you try rephrasing your question?',
            forecast: ''
          }
        };
      }
    };

    return {
      name,
      input,
      output,
      prompt,
      async: promptFunction
    };
  },
  defineFlow: ({ name, inputSchema, outputSchema }: any, handler: any) => {
    return async (input: any) => {
      try {
        return await handler(input);
      } catch (error) {
        console.error('Error in AI flow:', error);
        return {
          responseType: 'answer',
          explanation: 'Sorry, I had trouble with that request. Could you try asking in a different way?',
          forecast: ''
        };
      }
    };
  }
};
