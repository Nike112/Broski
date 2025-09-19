
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, User, Bot, Loader2, PieChart, Trash2, FileSpreadsheet, Phone } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFinancialForecast } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useFinancialStore, type ChatMessage } from '@/lib/store';
import { AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';
import { ExcelUpload } from './excel-upload';
import { ParsedExcelData } from '@/lib/excel-parser';
import { MLPredictor, PredictionResult } from '@/lib/ml-predictor';
import { MarkdownText } from '@/lib/markdown-parser';

type ChatInterfaceProps = {
  onForecastGenerated: (data: AutomateFinancialForecastingOutput) => void;
  onMlPredictionsGenerated?: (predictions: PredictionResult[]) => void;
  onSwitchToVoice?: () => void;
};

// Helper function to detect if response contains table-like content
function containsTableContent(response: string): boolean {
  const lowerResponse = response.toLowerCase();
  
  // Check for table indicators
  const tableIndicators = [
    'table', 'breakdown', 'month by month', 'projection', 'forecast',
    'detailed', 'analysis', 'revenue', 'customers', 'growth',
    'mrr', 'arr', 'cac', 'ltv', 'burn rate'
  ];
  
  const hasTableIndicators = tableIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  );
  
  // Check for numerical data patterns
  const hasNumericalData = /\$\d+|\d+%|\d+ customers|\d+ months|\d+\.\d+/.test(response);
  
  // Check for structured data patterns
  const hasStructuredData = /- \w+:|• \w+:|:\s*\$\d+/.test(response);
  
  return hasTableIndicators && (hasNumericalData || hasStructuredData);
}

// Helper function to generate a table from response content
function generateTableFromResponse(response: string, inputs: any): string {
  // Extract key metrics from the response
  const mrrMatch = response.match(/\$([\d,]+)/);
  const customersMatch = response.match(/(\d+)\s*(?:large|small|medium)?\s*customers/i);
  const revenueMatch = response.match(/revenue[:\s]*\$([\d,]+)/i);
  
  // Create a simple summary table
  let table = `| Metric | Value |\n`;
  table += `|--------|-------|\n`;
  
  if (mrrMatch) {
    table += `| MRR | $${mrrMatch[1]} |\n`;
  }
  
  if (customersMatch) {
    table += `| Customers | ${customersMatch[1]} |\n`;
  }
  
  if (revenueMatch) {
    table += `| Revenue | $${revenueMatch[1]} |\n`;
  }
  
  // Add input data if available
  if (inputs) {
    if (inputs.largeCustomers) {
      table += `| Large Customers | ${inputs.largeCustomers} |\n`;
    }
    if (inputs.smallMediumCustomers) {
      table += `| SMB Customers | ${inputs.smallMediumCustomers} |\n`;
    }
    if (inputs.operatingExpenses) {
      table += `| Operating Expenses | $${inputs.operatingExpenses.toLocaleString()} |\n`;
    }
  }
  
  return table;
}


export function ChatInterface({ onForecastGenerated, onMlPredictionsGenerated, onSwitchToVoice }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [mlPredictions, setMlPredictions] = useState<PredictionResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { inputs, messages, addMessage, clearMessages, removeMessage, updateMessage } = useFinancialStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleExcelDataParsed = (data: ParsedExcelData) => {
    setParsedData(data);
    
    if (data.success) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Excel file uploaded successfully! Found ${data.summary.totalRecords} records from ${data.summary.dateRange.start} to ${data.summary.dateRange.end}. Average revenue: $${data.summary.averageRevenue.toLocaleString()}, Growth rate: ${data.summary.averageGrowthRate.toFixed(1)}%`,
      };
      addMessage(message);
    }
  };

  const handlePredictionRequested = (timespan: number, predictionType: 'revenue' | 'customers' | 'both') => {
    if (!parsedData?.success) return;

    try {
      const predictions = MLPredictor.predict({
        data: parsedData.data,
        timespan,
        predictionType
      });

      setMlPredictions(predictions);
      onMlPredictionsGenerated?.(predictions);
      
      const summary = MLPredictor.generateSummary(predictions);
      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🤖 ML Predictions Generated!\n\n${summary}\n\nCheck the Forecast tab to see detailed predictions.`,
        forecastData: {
          responseType: 'forecast',
          explanation: 'Check Forecast tab',
          forecast: predictions.map(p => 
            `| ${p.date} | $${p.revenue.toLocaleString()} | ${p.customers} | ${p.confidence.toFixed(1)}% |`
          ).join('\n')
        }
      };
      addMessage(message);
    } catch (error) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Error generating predictions: ${error}`,
      };
      addMessage(message);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput && !inputs) return;


    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: currentInput || 'Using inputs from dashboard...' };
    addMessage(userMessage);
    setInput('');

    startTransition(() => {
      const assistantThinkingMessageId = (Date.now() + 1).toString();
      const thinkingMessage: ChatMessage = {
        id: assistantThinkingMessageId,
        role: 'assistant',
        content: 'Thinking...',
        isThinking: true,
      };

      addMessage(thinkingMessage);
      
      getFinancialForecast(currentInput, inputs).then(response => {
        removeMessage(assistantThinkingMessageId);

        if (typeof response === 'string') { // Error case
           const assistantResponseMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
          };
          addMessage(assistantResponseMessage);

        } else { // Success case
          const assistantResponseMessage: ChatMessage = {
            id: (Date.now()).toString(),
            role: 'assistant',
            content: response.explanation,
            forecastData: response.responseType === 'forecast' ? response : null,
          };
           
           addMessage(assistantResponseMessage);
           
           // Automatically update forecast if this is a forecast response
           if (response.responseType === 'forecast') {
             onForecastGenerated(response);
           }
           
           // Also check if the response contains table-like content and trigger forecast update
           if (response.responseType === 'answer' && containsTableContent(response.explanation)) {
             // Convert the answer response to a forecast response for the forecast tab
             const forecastResponse = {
               responseType: 'forecast' as const,
               explanation: response.explanation,
               forecast: generateTableFromResponse(response.explanation, inputs)
             };
             onForecastGenerated(forecastResponse);
           }
        }
      });
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">EVE - AI Assistant</h2>
        <Button variant="outline" size="sm" onClick={clearMessages} disabled={messages.length === 0}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>
      
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 md:p-6 space-y-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                  <Bot className="w-16 h-16 mb-4" />
                  <h2 className="text-2xl font-semibold">Welcome to EVE</h2>
                  <p className="mt-2 max-w-md">
                    Your inputs from the dashboard have been loaded. Ask me to generate a financial forecast, or refine the query. For example: "Project this out for 24 months." or simply hit send to use the dashboard inputs.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'rounded-lg p-3 max-w-3xl',
                      'prose dark:prose-invert',
                       message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    )}
                  >
                   {message.isThinking ? (
                     <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{message.content}</span>
                      </div>
                   ) : (
                    <div>
                      <MarkdownText content={message.content} />
                       {message.forecastData && (
                         <Button
                          onClick={() => onForecastGenerated(message.forecastData!)}
                          className="mt-4"
                          size="sm"
                        >
                          <PieChart className="w-4 h-4 mr-2" />
                          View Forecast Details
                        </Button>
                      )}
                    </div>
                   )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 bg-card border-t">
            <div className="flex gap-2 mb-2">
              {onSwitchToVoice && (
                <Button
                  onClick={onSwitchToVoice}
                  variant="outline"
                  size="sm"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Voice Chat
                </Button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask for a financial forecast or refine the previous one..."
                className="pr-20 min-h-[48px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.target as HTMLTextAreaElement;
                    form.closest('form')?.requestSubmit();
                  }
                }}
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute top-1/2 right-3 -translate-y-1/2"
                disabled={isPending}
              >
                <Send className="w-5 h-5" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="flex-1">
          <ScrollArea className="flex-1">
            <div className="p-4">
              <ExcelUpload 
                onDataParsed={handleExcelDataParsed}
                onPredictionRequested={handlePredictionRequested}
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
