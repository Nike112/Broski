import { NextRequest, NextResponse } from 'next/server';
import { RealtimeDataManager } from '@/lib/realtime-data-manager';

// POST /api/realtime/predict - Get real-time predictions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timespan = 6, predictionType = 'both' } = body;
    
    // Validate input
    if (timespan < 1 || timespan > 24) {
      return NextResponse.json(
        { success: false, error: 'Timespan must be between 1 and 24 months' },
        { status: 400 }
      );
    }
    
    if (!['revenue', 'customers', 'both'].includes(predictionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid prediction type' },
        { status: 400 }
      );
    }
    
    // Get real-time predictions
    const predictions = await RealtimeDataManager.getRealtimePrediction(
      timespan,
      predictionType as 'revenue' | 'customers' | 'both'
    );
    
    // Get data freshness info
    const freshness = RealtimeDataManager.getDataFreshness();
    
    return NextResponse.json({
      success: true,
      data: {
        predictions,
        freshness,
        generatedAt: new Date().toISOString(),
        dataPoints: RealtimeDataManager.getDataForRange().length
      }
    });
  } catch (error) {
    console.error('Error generating real-time predictions:', error);
    
    if (error instanceof Error && error.message.includes('Insufficient real-time data')) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          suggestion: 'Please ensure your data sources are connected and providing data'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
