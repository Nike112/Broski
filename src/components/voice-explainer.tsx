'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  Mic,
  MicOff,
  Loader2
} from 'lucide-react';
import { PredictionResult } from '@/lib/ml-predictor';
import { AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';
import { VoiceScriptGenerator, VoiceScriptOptions } from '@/lib/voice-script-generator';

interface Voice {
  id: string;
  name: string;
  category: string;
  description: string;
  preview_url?: string;
}

interface VoiceExplainerProps {
  forecastData?: AutomateFinancialForecastingOutput;
  mlPredictions?: PredictionResult[];
  className?: string;
}

export function VoiceExplainer({ forecastData, mlPredictions, className }: VoiceExplainerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('pNInz6obpgDQGcFmaJgB'); // Default voice
  const [speed, setSpeed] = useState([1.0]);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptOptions, setScriptOptions] = useState<VoiceScriptOptions>({
    tone: 'professional',
    detailLevel: 'detailed',
    includeScenarios: true,
    includeRiskFactors: true,
    includeRecommendations: true
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load available voices on component mount
  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await fetch('/api/voice/explain');
      const result = await response.json();
      
      if (result.success) {
        setVoices(result.voices);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  const generateExplanationText = (): string => {
    return VoiceScriptGenerator.generateScript(forecastData, mlPredictions, scriptOptions);
  };

  const generateAndPlayExplanation = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const explanationText = generateExplanationText();
      
      const response = await fetch('/api/voice/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: explanationText,
          voiceId: selectedVoice,
          modelId: 'eleven_monolingual_v1'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Create audio element and play
        const audioBlob = new Blob([Uint8Array.from(atob(result.audio), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = '';
        }
        
        const audio = new Audio(audioUrl);
        audio.playbackRate = speed[0];
        audio.volume = isMuted ? 0 : 1;
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setError('Audio playback failed. Please try again.');
          setIsPlaying(false);
        };
        
        setCurrentAudio(audio);
        await audio.play();
      } else {
        console.error('API Error:', result);
        setError(result.error || 'Failed to generate speech');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setError('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
    } else {
      generateAndPlayExplanation();
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentAudio) {
      currentAudio.volume = isMuted ? 1 : 0;
    }
  };

  const updateSpeed = (newSpeed: number[]) => {
    setSpeed(newSpeed);
    if (currentAudio) {
      currentAudio.playbackRate = newSpeed[0];
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Explanation
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Badge variant="secondary">
              AI Voice
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Voice Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleMute}
            variant="outline"
            size="sm"
            className={isMuted ? 'text-red-600' : ''}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={togglePlayPause}
            disabled={isLoading}
            size="lg"
            className="w-16 h-16 rounded-full"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          
          <Button
            onClick={stopAudio}
            variant="outline"
            size="sm"
            disabled={!currentAudio}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div>
              <label className="text-sm font-medium mb-2 block">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name} - {voice.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Speed: {speed[0].toFixed(1)}x
              </label>
              <Slider
                value={speed}
                onValueChange={updateSpeed}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tone</label>
              <Select 
                value={scriptOptions.tone} 
                onValueChange={(value) => setScriptOptions({...scriptOptions, tone: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Detail Level</label>
              <Select 
                value={scriptOptions.detailLevel} 
                onValueChange={(value) => setScriptOptions({...scriptOptions, detailLevel: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Explanation Preview */}
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">What will be explained:</p>
          <div className="max-h-32 overflow-y-auto p-3 bg-muted rounded text-xs">
            {generateExplanationText().substring(0, 200)}...
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={generateAndPlayExplanation}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Explain Forecast
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
