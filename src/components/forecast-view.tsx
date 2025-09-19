'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Brain } from 'lucide-react';
import { ForecastTable } from './forecast-table';
import { ForecastChart } from './forecast-chart';
import { VoiceExplainer } from './voice-explainer';
import { useMemo } from 'react';
import { AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';
import { PredictionResult } from '@/lib/ml-predictor';

type ForecastViewProps = {
  data: AutomateFinancialForecastingOutput | null;
  mlPredictions?: PredictionResult[];
};

function parseForecastData(forecast: string) {
  const lines = forecast.trim().split('\n').filter(line => line.trim().startsWith('|'));
  if (lines.length < 2) return null;

  const parseLine = (line: string): string[] => {
    return line.split('|').map(s => s.trim()).slice(1, -1);
  };

  const headerLine = lines[0];
  const dataLines = lines[1].includes('---') ? lines.slice(2) : lines.slice(1);

  const headers = parseLine(headerLine);
  const rows = dataLines.map(parseLine);
  
  if (headers.length === 0 || rows.length === 0) return null;

  const monthHeaders = headers.slice(1); // M1, M2, ...
  const metricHeaders = rows.map(r => r[0]); // # of sales people, ...

  const structuredData = monthHeaders.map((month, monthIndex) => {
    const monthData: {[key: string]: string} = { Month: month };
    metricHeaders.forEach((metric, metricIndex) => {
      monthData[metric] = rows[metricIndex][monthIndex + 1];
    });
    return monthData;
  });

  return structuredData;
}


function MLPredictionTable({ predictions }: { predictions: PredictionResult[] }) {
  if (predictions.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Enhanced Prediction Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-secondary">
              <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Date</th>
              <th className="border border-border px-4 py-2 text-right font-semibold text-foreground">Revenue Range</th>
              <th className="border border-border px-4 py-2 text-right font-semibold text-foreground">Customer Range</th>
              <th className="border border-border px-4 py-2 text-right font-semibold text-foreground">Confidence</th>
              <th className="border border-border px-4 py-2 text-center font-semibold text-foreground">Method</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((prediction, index) => (
              <tr key={index} className="hover:bg-accent">
                <td className="border border-border px-4 py-2 text-foreground">
                  {new Date(prediction.date).toLocaleDateString()}
                </td>
                <td className="border border-border px-4 py-2 text-right">
                  <div className="font-mono">
                    <div className="text-green-600">${prediction.revenueRange?.optimistic.toLocaleString()}</div>
                    <div className="font-semibold text-foreground">${prediction.revenue.toLocaleString()}</div>
                    <div className="text-red-600">${prediction.revenueRange?.pessimistic.toLocaleString()}</div>
                  </div>
                </td>
                <td className="border border-border px-4 py-2 text-right">
                  <div className="font-mono">
                    <div className="text-green-600">{prediction.customerRange?.optimistic.toLocaleString()}</div>
                    <div className="font-semibold text-foreground">{prediction.customers.toLocaleString()}</div>
                    <div className="text-red-600">{prediction.customerRange?.pessimistic.toLocaleString()}</div>
                  </div>
                </td>
                <td className="border border-border px-4 py-2 text-right">
                  <span className={`px-2 py-1 rounded text-sm ${
                    prediction.confidence >= 80 ? 'bg-primary text-primary-foreground' :
                    prediction.confidence >= 60 ? 'bg-secondary text-secondary-foreground' :
                    'bg-destructive text-destructive-foreground'
                  }`}>
                    {prediction.confidence.toFixed(1)}%
                  </span>
                </td>
                <td className="border border-border px-4 py-2 text-center text-sm text-muted-foreground">
                  {prediction.method}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scenario Analysis */}
      {predictions[0]?.scenarios && (
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Scenario Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded">
              <h5 className="font-semibold text-green-800 dark:text-green-200">Optimistic Scenario</h5>
              <p className="text-sm text-green-700 dark:text-green-300">
                Revenue: ${predictions[0].scenarios?.optimistic.revenue.toLocaleString()}<br/>
                Customers: {predictions[0].scenarios?.optimistic.customers.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded">
              <h5 className="font-semibold text-blue-800 dark:text-blue-200">Realistic Scenario</h5>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Revenue: ${predictions[0].scenarios?.realistic.revenue.toLocaleString()}<br/>
                Customers: {predictions[0].scenarios?.realistic.customers.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded">
              <h5 className="font-semibold text-red-800 dark:text-red-200">Pessimistic Scenario</h5>
              <p className="text-sm text-red-700 dark:text-red-300">
                Revenue: ${predictions[0].scenarios?.pessimistic.revenue.toLocaleString()}<br/>
                Customers: {predictions[0].scenarios?.pessimistic.customers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {predictions[0]?.riskFactors && predictions[0].riskFactors.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">⚠️ Risk Factors</h4>
          <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200">
            {predictions[0].riskFactors.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* External Factors */}
      {predictions[0]?.externalFactors && (
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">📊 External Factors Impact</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-purple-700 dark:text-purple-300">Market Growth:</span>
              <span className="ml-2 font-semibold">{predictions[0].externalFactors?.marketGrowth.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-purple-700 dark:text-purple-300">Economic Index:</span>
              <span className="ml-2 font-semibold">{predictions[0].externalFactors?.economicIndex.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-purple-700 dark:text-purple-300">Competition:</span>
              <span className="ml-2 font-semibold">{predictions[0].externalFactors?.competitivePressure.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-purple-700 dark:text-purple-300">Seasonality:</span>
              <span className="ml-2 font-semibold">{predictions[0].externalFactors?.seasonality.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ForecastView({ data, mlPredictions }: ForecastViewProps) {
    
  const handleDownload = () => {
    if (!data?.forecast) return;
    const lines = data.forecast.trim().split('\n').filter(line => line.trim().startsWith('|'));
    if (lines.length === 0) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + lines.map(line => line.split('|').slice(1, -1).map(s => s.trim()).join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_forecast.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    if (!data?.forecast) return [];
    
    const parsed = parseForecastData(data.forecast);
    const revenueMetrics = [
        'Revenue from large clients',
        'Revenue from small and medium clients',
        'Total Revenues',
    ];
    return parsed?.filter(p => revenueMetrics.some(m => p[m])) || [];
  }, [data?.forecast]);

  // Show empty state when no forecast data is available
  if (!data) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">EveBhau Financial Forecast Dashboard</h1>
          <p className="text-muted-foreground">AI-powered predictions and machine learning insights for your business</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Forecast Data Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              To see your financial forecasts, please:
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Enter your business data in the Dashboard</p>
              <p>2. Ask EVE to generate a forecast</p>
              <p>3. Or use the chatbot to request specific projections</p>
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>💡 Tip:</strong> Try asking EVE: "Generate a 6-month forecast" or "What's our MRR?"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">EveBhau Financial Forecast Dashboard</h1>
        <p className="text-muted-foreground">AI-powered predictions and machine learning insights for your business</p>
      </div>
      {/* AI Forecast */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5" />
                AI Financial Forecast
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">{data.explanation}</CardDescription>
            </div>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download as CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ForecastTable data={data.forecast} />
        </CardContent>
      </Card>

      {/* ML Predictions */}
      {mlPredictions && mlPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Brain className="h-5 w-5" />
              ML-Based Predictions
            </CardTitle>
            <CardDescription>
              Machine learning predictions based on your historical data with confidence scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MLPredictionTable predictions={mlPredictions} />
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5" />
            Revenue Projections Chart
          </CardTitle>
          <CardDescription>A graphical representation of the projected revenue streams over time, showing both large and small/medium customer segments.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastChart data={chartData} />
        </CardContent>
      </Card>

      {/* Voice Explanation */}
      <VoiceExplainer 
        forecastData={data} 
        mlPredictions={mlPredictions}
        className="mt-8"
      />
    </div>
  );
}
