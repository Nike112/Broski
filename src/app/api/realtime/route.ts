import { NextRequest, NextResponse } from 'next/server';
import { RealtimeDataManager } from '@/lib/realtime-data-manager';

// GET /api/realtime - Get latest real-time data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    
    const latestData = RealtimeDataManager.getLatestData();
    const dataForRange = RealtimeDataManager.getDataForRange(hours);
    const freshness = RealtimeDataManager.getDataFreshness();
    
    return NextResponse.json({
      success: true,
      data: {
        latest: latestData,
        range: dataForRange,
        freshness,
        sources: RealtimeDataManager.getDataSources()
      }
    });
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch real-time data' },
      { status: 500 }
    );
  }
}

// POST /api/realtime - Force refresh all data sources
export async function POST(request: NextRequest) {
  try {
    await RealtimeDataManager.forceRefresh();
    
    return NextResponse.json({
      success: true,
      message: 'Data sources refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing data sources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh data sources' },
      { status: 500 }
    );
  }
}
