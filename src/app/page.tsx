'use client';
import { useState } from 'react';
import { Bot, LineChart, PieChart, Activity, Settings, Phone } from 'lucide-react';
import { ChatInterface } from '@/components/chat-interface';
import { Dashboard } from '@/components/dashboard';
import { ForecastView } from '@/components/forecast-view';
import { RealtimeDashboard } from '@/components/realtime-dashboard';
import { DataSourcesConfig } from '@/components/data-sources-config';
import { VoiceChat } from '@/components/voice-chat';
import { Button } from '@/components/ui/button';
import { useFinancialStore } from '@/lib/store';
import { AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';
import { PredictionResult } from '@/lib/ml-predictor';

export type View = 'dashboard' | 'chatbot' | 'forecast' | 'realtime' | 'sources' | 'voice-chat';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const { hasBeenSaved } = useFinancialStore();
  const [forecastData, setForecastData] = useState<AutomateFinancialForecastingOutput | null>(null);
  const [mlPredictions, setMlPredictions] = useState<PredictionResult[]>([]);

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleForecastGenerated = (data: AutomateFinancialForecastingOutput) => {
    setForecastData(data);
    setView('forecast');
  };

  const handleMlPredictionsGenerated = (predictions: PredictionResult[]) => {
    setMlPredictions(predictions);
    setView('forecast');
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b shadow-sm bg-card">
        <div className="flex items-center">
          <Bot className="w-8 h-8 mr-2 text-primary" />
          <h1 className="text-2xl font-bold text-primary-foreground font-headline">
            Inceptico
          </h1>
        </div>
        <nav className="flex items-center gap-2">
          <Button
            variant={view === 'dashboard' ? 'secondary' : 'ghost'}
            onClick={() => handleViewChange('dashboard')}
            size="sm"
          >
            <LineChart className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={view === 'realtime' ? 'secondary' : 'ghost'}
            onClick={() => handleViewChange('realtime')}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Live Data
          </Button>
          <Button
            variant={view === 'sources' ? 'secondary' : 'ghost'}
            onClick={() => handleViewChange('sources')}
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Sources
          </Button>
          <Button
            variant={view === 'chatbot' ? 'secondary' : 'ghost'}
            onClick={() => handleViewChange('chatbot')}
            size="sm"
            disabled={!hasBeenSaved}
          >
            <Bot className="w-4 h-4 mr-2" />
            EVE
          </Button>
          <Button
            variant={view === 'voice-chat' ? 'secondary' : 'ghost'}
            onClick={() => handleViewChange('voice-chat')}
            size="sm"
            disabled={!hasBeenSaved}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call EVE
          </Button>
           <Button
            variant={view === 'forecast' ? 'secondary' : 'ghost'}
            onClick={() => handleViewChange('forecast')}
            size="sm"
            disabled={!forecastData}
          >
            <PieChart className="w-4 h-4 mr-2" />
            Forecast
          </Button>
        </nav>
      </header>
      <main className="flex-1 overflow-auto">
        {view === 'dashboard' && <Dashboard onProceedToChat={() => handleViewChange('chatbot')} />}
        {view === 'realtime' && <RealtimeDashboard />}
        {view === 'sources' && <DataSourcesConfig />}
        {view === 'chatbot' && <ChatInterface onForecastGenerated={handleForecastGenerated} onMlPredictionsGenerated={handleMlPredictionsGenerated} onSwitchToVoice={() => handleViewChange('voice-chat')} />}
        {view === 'voice-chat' && <VoiceChat />}
        {view === 'forecast' && forecastData && <ForecastView data={forecastData} mlPredictions={mlPredictions} />}
      </main>
    </div>
  );
}
