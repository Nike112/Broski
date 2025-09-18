import { NextRequest, NextResponse } from 'next/server';
import { automateFinancialForecasting } from '@/ai/flows/automate-financial-forecasting';
import financialFormulas from '@/lib/financial-formulas.json';
import { getFinancialForecast } from '@/app/actions';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context = 'chat', businessData } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('Chat API - Processing message:', message);
    
    let result;
    
    try {
      // Enhance the query with business data context
      let enhancedQuery = message;
      if (businessData) {
        enhancedQuery = `${message}\n\nCurrent Business Data:\n${JSON.stringify(businessData, null, 2)}`;
      }
      
      // Use the existing financial forecasting flow for AI responses
      result = await automateFinancialForecasting({
        query: enhancedQuery,
        financialFormulas: JSON.stringify(financialFormulas)
      });

      console.log('Chat API - Result:', result);

      // Check if result is valid
      if (!result || !result.explanation || result.explanation.includes('Sorry, I had trouble processing')) {
        console.log('Chat API - AI flow failed, using fallback');
        throw new Error('AI flow failed');
      }
    } catch (aiError) {
      console.log('Chat API - AI flow error, using fallback:', aiError);
      // Use fallback response system with business data
      result = getFallbackResponse(message, businessData);
    }

    // Format response for voice chat
    let response = '';
    let hasData = false;
    let dataType = '';
    
    if (result.responseType === 'forecast') {
      // For forecast requests, provide a summary for voice
      hasData = true;
      dataType = 'forecast';
      response = `I've generated a comprehensive financial forecast for you. ${result.explanation} The forecast includes detailed projections for revenue, customers, and key metrics. Please navigate to the Forecast tab to view the complete data and charts.`;
    } else if (result.responseType === 'answer' && (result.explanation.includes('table') || result.explanation.includes('data') || result.explanation.includes('chart'))) {
      // Detect table/data responses
      hasData = true;
      dataType = 'table';
      response = `I have the data you requested. ${result.explanation} Please navigate to the Forecast tab to see the detailed tables and visualizations.`;
    } else {
      // For direct questions, use the explanation
      response = result.explanation;
    }

    // Make response more conversational for voice
    if (context === 'voice_chat') {
      response = makeConversational(response);
    }

    return NextResponse.json({
      success: true,
      response: response,
      responseType: result.responseType,
      hasForecast: result.responseType === 'forecast',
      hasData: hasData,
      dataType: dataType,
      forecastData: result.responseType === 'forecast' ? result : null
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Use the enhanced fallback response system
    const fallbackResult = getFallbackResponse(message, businessData);
    const fallbackResponse = fallbackResult.explanation;
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      responseType: 'answer',
      hasForecast: false,
      hasData: false,
      dataType: '',
      forecastData: null
    });
  }
}

function getFallbackResponse(message: string, businessData?: any) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('mrr') || lowerMessage.includes('revenue')) {
    if (businessData) {
      // Calculate actual MRR from business data
      const largeCustomers = businessData.largeCustomers || 0;
      const revPerLargeCustomer = businessData.revPerLargeCustomer || 16500;
      const smallMediumCustomers = businessData.smallMediumCustomers || 0;
      const revPerSmallMediumCustomer = businessData.revPerSmallMediumCustomer || 3000;
      
      const mrr = (largeCustomers * revPerLargeCustomer) + (smallMediumCustomers * revPerSmallMediumCustomer);
      
      return {
        responseType: 'answer',
        explanation: `Your current MRR is $${mrr.toLocaleString()}. This is calculated from ${largeCustomers} large customers at $${revPerLargeCustomer.toLocaleString()} each and ${smallMediumCustomers} small/medium customers at $${revPerSmallMediumCustomer.toLocaleString()} each.`,
        forecast: ''
      };
    } else {
      return {
        responseType: 'answer',
        explanation: "I'd be happy to help you with MRR and revenue information. To provide accurate data, I need to generate a financial forecast first. Could you ask me to 'generate a financial forecast' or provide more specific details about your business?",
        forecast: ''
      };
    }
  } else if (lowerMessage.includes('customer') || lowerMessage.includes('trend')) {
    if (businessData) {
      const largeCustomers = businessData.largeCustomers || 0;
      const smallMediumCustomers = businessData.smallMediumCustomers || 0;
      const totalCustomers = largeCustomers + smallMediumCustomers;
      
      return {
        responseType: 'answer',
        explanation: `You currently have ${totalCustomers} total customers: ${largeCustomers} large customers and ${smallMediumCustomers} small/medium customers. To see detailed trends and projections, please ask me to 'generate a financial forecast' or navigate to the Forecast tab.`,
        forecast: ''
      };
    } else {
      return {
        responseType: 'answer',
        explanation: "I can help you analyze customer trends and growth patterns. To give you detailed insights, I'll need to create a forecast with your business data. Try asking me to 'generate a financial forecast' or 'show customer growth trends'.",
        forecast: ''
      };
    }
  } else if (lowerMessage.includes('forecast') || lowerMessage.includes('prediction')) {
    return {
      responseType: 'forecast',
      explanation: "I can generate comprehensive financial forecasts for your business. Please ask me to 'generate a financial forecast' and I'll create detailed projections for revenue, customers, and key metrics.",
      forecast: ''
    };
  } else {
    return {
      responseType: 'answer',
      explanation: "I'm here to help with financial forecasting and business analysis. You can ask me to generate forecasts, analyze trends, or explain business metrics. What specific financial information would you like to know about?",
      forecast: ''
    };
  }
}

function makeConversational(text: string): string {
  // Make the response more natural for voice conversation
  let conversational = text;
  
  // Add conversational starters
  if (!conversational.startsWith('I') && !conversational.startsWith('Your') && !conversational.startsWith('Based') && !conversational.startsWith('I\'ve')) {
    conversational = `Let me help you with that. ${conversational}`;
  }
  
  // Replace formal language with conversational alternatives
  conversational = conversational.replace(/Based on your business model/g, 'Looking at your business');
  conversational = conversational.replace(/I can see/g, 'I notice');
  conversational = conversational.replace(/Please note/g, 'Just so you know');
  conversational = conversational.replace(/It is important/g, 'It\'s important');
  conversational = conversational.replace(/Please navigate/g, 'You can navigate');
  conversational = conversational.replace(/The forecast includes/g, 'This forecast includes');
  
  // Add friendly endings for certain responses
  if (conversational.includes('MRR') || conversational.includes('revenue') || conversational.includes('customers')) {
    if (!conversational.includes('Forecast tab') && !conversational.includes('navigate')) {
      conversational += ' Does this help answer your question?';
    }
  }
  
  // Add helpful context for data responses
  if (conversational.includes('Forecast tab')) {
    conversational += ' The data will be displayed with interactive charts and detailed tables.';
  }
  
  return conversational;
}
