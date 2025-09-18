'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VoiceChatProps {
  onMessage?: (message: string) => void;
  onForecastGenerated?: (data: any) => void;
  className?: string;
}

interface ConversationState {
  isCallActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  currentMessage: string;
  conversationHistory: Array<{
    type: 'user' | 'assistant';
    message: string;
    timestamp: Date;
    hasData?: boolean;
    dataType?: string;
  }>;
}

export function VoiceChat({ onMessage, onForecastGenerated, className }: VoiceChatProps) {
  const [state, setState] = useState<ConversationState>({
    isCallActive: false,
    isListening: false,
    isSpeaking: false,
    isMuted: false,
    currentMessage: '',
    conversationHistory: []
  });

  const [selectedVoice, setSelectedVoice] = useState('pNInz6obpgDQGcFmaJgB');
  const [voices, setVoices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setState(prev => ({
              ...prev,
              currentMessage: finalTranscript,
              conversationHistory: [
                ...prev.conversationHistory,
                {
                  type: 'user',
                  message: finalTranscript,
                  timestamp: new Date()
                }
              ]
            }));

            // Process the message with EVE
            processUserMessage(finalTranscript);
          } else {
            setState(prev => ({
              ...prev,
              currentMessage: interimTranscript
            }));
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setState(prev => ({ ...prev, isListening: false }));
        };

        recognitionRef.current.onend = () => {
          setState(prev => ({ ...prev, isListening: false }));
        };
      } else {
        setError('Speech recognition not supported in this browser');
      }
    }

    // Load available voices
    loadVoices();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
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

  const startCall = () => {
    setState(prev => ({
      ...prev,
      isCallActive: true,
      conversationHistory: []
    }));
    setError(null);
    
    // Start with a greeting
    speakMessage("Hello! I'm EVE, your AI financial assistant. I can help you understand your forecasts, analyze your business data, and answer questions about your financial projections. What would you like to know?");
  };

  const endCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    
    setState(prev => ({
      ...prev,
      isCallActive: false,
      isListening: false,
      isSpeaking: false,
      currentMessage: ''
    }));
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (state.isListening) {
      recognitionRef.current.stop();
      setState(prev => ({ ...prev, isListening: false }));
    } else {
      recognitionRef.current.start();
      setState(prev => ({ ...prev, isListening: true, currentMessage: '' }));
    }
  };

  const toggleMute = () => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = state.isMuted ? 1 : 0;
    }
  };

  const processUserMessage = async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call EVE's chat interface
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: 'voice_chat'
        })
      });

      const result = await response.json();
      
      console.log('Voice chat - API response:', result);
      
      if (result.success && result.response) {
        // Add EVE's response to conversation history
        setState(prev => ({
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            {
              type: 'assistant',
              message: result.response,
              timestamp: new Date(),
              hasData: result.hasData,
              dataType: result.dataType
            }
          ]
        }));

        // Speak EVE's response
        await speakMessage(result.response);
        
        // If there's forecast data, provide additional guidance and trigger callback
        if (result.hasForecast && result.forecastData) {
          // Trigger forecast generation callback
          if (onForecastGenerated) {
            onForecastGenerated(result.forecastData);
          }
          
          setTimeout(async () => {
            await speakMessage("I've also generated detailed ML predictions with confidence intervals and scenario analysis. You can find all the data in the Forecast tab.");
          }, 2000);
        }
      } else {
        const errorMsg = result.error || 'Failed to get response from EVE';
        console.error('Voice chat - API error:', errorMsg, result);
        setError(errorMsg);
        
        // Provide a more helpful error message
        let errorResponse = "I'm sorry, I encountered an error processing your request. ";
        if (message.toLowerCase().includes('mrr') || message.toLowerCase().includes('revenue')) {
          errorResponse += "For MRR and revenue information, try asking me to 'generate a financial forecast' first.";
        } else if (message.toLowerCase().includes('customer') || message.toLowerCase().includes('trend')) {
          errorResponse += "For customer trends, try asking me to 'generate a financial forecast' or 'show customer growth trends'.";
        } else {
          errorResponse += "Please try rephrasing your question or ask me to 'generate a financial forecast'.";
        }
        
        await speakMessage(errorResponse);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setError('Failed to process your message');
      await speakMessage("I'm sorry, I couldn't process your message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (text: string) => {
    if (state.isMuted) return;

    try {
      setState(prev => ({ ...prev, isSpeaking: true }));

      const response = await fetch('/api/voice/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voiceId: selectedVoice,
          modelId: 'eleven_monolingual_v1'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Stop any current audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }

        // Create new audio
        const audioBlob = new Blob([Uint8Array.from(atob(result.audio), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.volume = state.isMuted ? 0 : 1;
        
        audio.onended = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
          setError('Failed to play audio response');
        };

        currentAudioRef.current = audio;
        await audio.play();
      } else {
        setState(prev => ({ ...prev, isSpeaking: false }));
        setError(result.error || 'Failed to generate speech');
      }
    } catch (error) {
      console.error('Error speaking message:', error);
      setState(prev => ({ ...prev, isSpeaking: false }));
      setError('Failed to generate speech response');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Voice Chat with EVE
          {state.isCallActive && (
            <Badge variant="default" className="bg-green-500">
              Live Call
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {!state.isCallActive ? (
            <Button
              onClick={startCall}
              size="lg"
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-6 w-6" />
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleListening}
                disabled={state.isSpeaking || isLoading}
                variant={state.isListening ? "destructive" : "outline"}
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                {state.isListening ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={toggleMute}
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                {state.isMuted ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Status Indicators */}
        {state.isCallActive && (
          <div className="flex justify-center gap-4 text-sm">
            {state.isListening && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Mic className="h-3 w-3 mr-1" />
                Listening...
              </Badge>
            )}
            {state.isSpeaking && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Volume2 className="h-3 w-3 mr-1" />
                EVE Speaking
              </Badge>
            )}
            {isLoading && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processing...
              </Badge>
            )}
          </div>
        )}

        {/* Current Message */}
        {state.currentMessage && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">You said:</p>
            <p className="text-sm">{state.currentMessage}</p>
          </div>
        )}

        {/* Voice Selection */}
        {state.isCallActive && (
          <div className="space-y-2">
            <label className="text-sm font-medium">EVE's Voice</label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select voice" />
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
        )}

        {/* Conversation History */}
        {state.conversationHistory.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-medium">Conversation</h4>
            {state.conversationHistory.map((entry, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-sm ${
                  entry.type === 'user'
                    ? 'bg-blue-50 text-blue-900 ml-4'
                    : 'bg-purple-50 text-purple-900 mr-4'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p>{entry.message}</p>
                    {entry.hasData && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          📊 Data Available
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Check Forecast tab
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs opacity-70 ml-2">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {!state.isCallActive && (
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Start a voice conversation with EVE</p>
            <p>Ask questions about:</p>
            <ul className="text-xs space-y-1 mt-2">
              <li>• "Generate a financial forecast for my business"</li>
              <li>• "What's my revenue projection for next quarter?"</li>
              <li>• "Show me customer growth trends"</li>
              <li>• "What are the risk factors in my forecast?"</li>
              <li>• "Explain my ML predictions and confidence levels"</li>
              <li>• "Create a scenario analysis for my business"</li>
            </ul>
            <p className="text-xs mt-3 p-2 bg-blue-50 rounded">
              💡 <strong>Tip:</strong> For detailed data and charts, EVE will guide you to the Forecast tab
            </p>
            <p className="text-xs p-2 bg-green-50 rounded">
              🎯 <strong>Note:</strong> EVE has full access to all chatbot knowledge and can answer any financial question
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
