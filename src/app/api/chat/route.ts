import { NextRequest, NextResponse } from 'next/server';
import { automateFinancialForecasting } from '@/ai/flows/automate-financial-forecasting';
import { financialFormulas } from '@/lib/financial-formulas.json';

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
    
    if (result.responseType === 'forecast') {
      // For forecast requests, provide a summary for voice
      response = `I've generated a forecast for you. ${result.explanation} You can view the detailed forecast in the Forecast tab.`;
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
      hasForecast: result.responseType === 'forecast'
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
  if (!conversational.startsWith('I') && !conversational.startsWith('Your') && !conversational.startsWith('Based')) {
    conversational = `Let me help you with that. ${conversational}`;
  }
  
  // Replace formal language with conversational alternatives
  conversational = conversational.replace(/Based on your business model/g, 'Looking at your business');
  conversational = conversational.replace(/I can see/g, 'I notice');
  conversational = conversational.replace(/Please note/g, 'Just so you know');
  conversational = conversational.replace(/It is important/g, 'It\'s important');
  
  // Add friendly endings for certain responses
  if (conversational.includes('MRR') || conversational.includes('revenue') || conversational.includes('customers')) {
    conversational += ' Does this help answer your question?';
  }
  
  return conversational;
}
