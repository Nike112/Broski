'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Download, TestTube, ExternalLink } from 'lucide-react';

export default function APITestPage() {
  const [query, setQuery] = useState('Generate 11-month financial projections');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testQueries = [
    'Generate 11-month financial projections',
    'Show me our cash flow forecast for next 6 months',
    'What will our revenue look like over the next 12 months?',
    'Create a burn rate analysis',
    'Generate customer acquisition forecast',
    'Show me break-even analysis',
    'What\'s our runway with current burn rate?',
    'Project our MRR growth for next 8 months'
  ];

  const handleTest = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          // Excel file response
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'financial_forecast.xlsx';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setResult('✅ Excel file downloaded successfully!');
        } else {
          // JSON response
          const data = await response.json();
          setResult(JSON.stringify(data, null, 2));
        }
      } else {
        const errorData = await response.json();
        setError(`Error ${response.status}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectURL = () => {
    const url = `/api/search?query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🚀 API Test Interface</h1>
        <p className="text-muted-foreground">
          Test the financial forecasting API with natural language queries
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Test Query
            </CardTitle>
            <CardDescription>
              Enter a natural language query to test the API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your financial query..."
              className="min-h-[100px]"
            />
            
            <div className="flex gap-2">
              <Button onClick={handleTest} disabled={isLoading} className="flex-1">
                {isLoading ? 'Testing...' : 'Test API'}
              </Button>
              <Button variant="outline" onClick={testDirectURL}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Test Queries:</p>
              <div className="grid gap-2">
                {testQueries.map((testQuery, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(testQuery)}
                    className="text-left justify-start h-auto p-2"
                  >
                    <span className="text-xs">{testQuery}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              API response will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Testing API...
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {result && !error && (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">{result}</p>
                </div>
                {result.includes('JSON') && (
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-60">
                    {result}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📖 How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">1. Direct URL Testing</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Test directly in your browser:
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                /api/search?query=Generate 11-month financial projections
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. cURL Testing</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Test from command line:
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                curl "http://localhost:3000/api/search?query=Generate%2011-month%20financial%20projections"
              </code>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. Expected Responses</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Excel File:</strong> Downloads automatically for forecast queries</li>
              <li>• <strong>JSON Response:</strong> For general questions and explanations</li>
              <li>• <strong>Error Response:</strong> If query cannot be processed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
