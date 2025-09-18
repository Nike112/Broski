import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabs } from '@elevenlabs/elevenlabs-js';

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

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

    // Generate speech
    const audioStream = await elevenlabs.generate({
      voice: voiceId,
      text: text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    });

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

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

    const voices = await elevenlabs.voices.getAll();
    
    return NextResponse.json({
      success: true,
      voices: voices.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
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
