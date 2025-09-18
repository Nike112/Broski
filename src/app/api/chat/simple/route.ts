import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    console.log('Simple API - Message:', message);

    // Simple response without AI flow
    let response = '';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('mrr') || lowerMessage.includes('revenue')) {
      response = "I'd be happy to help you with MRR and revenue information. To provide accurate data, I need to generate a financial forecast first. Could you ask me to 'generate a financial forecast' or provide more specific details about your business?";
    } else if (lowerMessage.includes('customer') || lowerMessage.includes('trend')) {
      response = "I can help you analyze customer trends and growth patterns. To give you detailed insights, I'll need to create a forecast with your business data. Try asking me to 'generate a financial forecast' or 'show customer growth trends'.";
    } else if (lowerMessage.includes('forecast') || lowerMessage.includes('prediction')) {
      response = "I can generate comprehensive financial forecasts for your business. Please ask me to 'generate a financial forecast' and I'll create detailed projections for revenue, customers, and key metrics.";
    } else {
      response = "I'm here to help with financial forecasting and business analysis. You can ask me to generate forecasts, analyze trends, or explain business metrics. What specific financial information would you like to know about?";
    }

    return NextResponse.json({
      success: true,
      response: response,
      responseType: 'answer',
      hasForecast: false,
      hasData: false,
      dataType: '',
      forecastData: null
    });

  } catch (error) {
    console.error('Simple API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
