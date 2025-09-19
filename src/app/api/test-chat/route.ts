import { NextRequest, NextResponse } from 'next/server';
import { getFinancialForecast } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, inputs } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await getFinancialForecast(query, inputs || null);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in test-chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
