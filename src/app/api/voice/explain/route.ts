import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB', modelId = 'eleven_monolingual_v1' } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Generate speech using direct API call
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Return audio as base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({
      success: true,
      audio: base64Audio,
      format: 'mp3',
      duration: audioBuffer.length / 16000 // Rough estimate
    });

  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available voices
export async function GET() {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      voices: data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category || 'general',
        description: voice.description || '',
        preview_url: voice.preview_url
      }))
    });

  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
