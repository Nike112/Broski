import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Test API key by fetching voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          success: false, 
          error: `API key test failed: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'API key is working correctly',
      voiceCount: data.voices?.length || 0,
      apiKeyLength: process.env.ELEVENLABS_API_KEY.length
    });

  } catch (error) {
    console.error('API key test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
