import { NextRequest, NextResponse } from 'next/server';
import { automateFinancialForecasting } from '@/ai/flows/automate-financial-forecasting';
import financialFormulas from '@/lib/financial-formulas.json';

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
    
    // Enhance the query with business data context for better AI responses
    let enhancedQuery = message;
    if (businessData) {
      enhancedQuery = `${message}\n\nCurrent Business Data:\n${JSON.stringify(businessData, null, 2)}`;
    }
    
    // Always use the AI flow for dynamic responses
    result = await automateFinancialForecasting({
      query: enhancedQuery,
      financialFormulas: JSON.stringify(financialFormulas)
    });

    console.log('Chat API - Result:', result);

    // If AI fails, provide a helpful error message instead of static responses
    if (!result || !result.explanation || result.explanation.includes('Sorry, I had trouble processing')) {
      console.log('Chat API - AI flow failed');
      return NextResponse.json({
        success: false,
        error: 'I apologize, but I encountered an issue processing your request. Please try rephrasing your question or ask me to generate a financial forecast to get started.'
      }, { status: 500 });
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
    return NextResponse.json({
      success: false,
      error: 'I apologize, but I encountered an issue processing your request. Please try rephrasing your question or ask me to generate a financial forecast to get started.'
    }, { status: 500 });
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
