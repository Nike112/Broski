import { NextRequest, NextResponse } from 'next/server';
import { getFinancialForecast } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, inputs } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Processing query:', query.substring(0, 50) + '...');
    
    const result = await getFinancialForecast(query, inputs || null);
    
    console.log('Query processed successfully');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in test-chat API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
