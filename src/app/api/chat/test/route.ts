import { NextRequest, NextResponse } from 'next/server';
import { automateFinancialForecasting } from '@/ai/flows/automate-financial-forecasting';
import financialFormulas from '@/lib/financial-formulas.json';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    console.log('Test API - Message:', message);
    console.log('Test API - Financial formulas loaded:', !!financialFormulas);

    // Test the financial forecasting flow
    const result = await automateFinancialForecasting({
      query: message || 'What is the current MRR?',
      financialFormulas: JSON.stringify(financialFormulas)
    });

    console.log('Test API - Result:', result);

    return NextResponse.json({
      success: true,
      message: message,
      result: result,
      hasExplanation: !!result?.explanation,
      responseType: result?.responseType
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
