import { NextRequest, NextResponse } from 'next/server';
import { automateFinancialForecasting } from '@/ai/flows/automate-financial-forecasting';
import financialFormulas from '@/lib/financial-formulas.json';
import { getFinancialForecast } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context = 'chat' } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use the existing financial forecasting flow for AI responses
    const result = await automateFinancialForecasting({
      query: message,
      financialFormulas: JSON.stringify(financialFormulas)
    });

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
    return NextResponse.json(
      { success: false, error: 'Failed to process your message' },
      { status: 500 }
    );
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
