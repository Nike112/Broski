'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFinancialForecast } from '@/app/actions';

export default function TestChatPage() {
  const [query, setQuery] = useState('Show model with $1,500 CAC and 45% demo-to-customer conversion');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mockInputs = {
    largeCustomers: 2,
    smallMediumCustomers: 5,
    revPerLargeCustomer: 16500,
    revPerSmallMediumCustomer: 3000,
    operatingExpenses: 50000,
    cashInBank: 500000,
    cac: 1500,
    marketingSpend: 5000
  };

  const testQueries = [
    "Show model with $1,500 CAC and 45% demo-to-customer conversion",
    "What's our MRR?",
    "Generate a 6-month forecast",
    "What's our burn rate?",
    "Hello",
    "Help me"
  ];

  const handleTest = async () => {
    setIsLoading(true);
    setResponse('');

    try {
      const result = await getFinancialForecast(query, mockInputs);
      setResponse(typeof result === 'string' ? result : result.explanation);
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🤖 Test Conversational Chatbot</h1>
        <p className="text-muted-foreground">
          Test the conversational responses directly from the actions.ts file
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Query</CardTitle>
            <CardDescription>
              Enter a query to test the conversational chatbot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query..."
            />
            
            <Button onClick={handleTest} disabled={isLoading} className="w-full">
              {isLoading ? 'Testing...' : 'Test Chatbot'}
            </Button>

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
            <CardTitle>Response</CardTitle>
            <CardDescription>
              Conversational response from the chatbot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Testing chatbot...
              </div>
            )}
            
            {response && (
              <div className="p-4 bg-gray-50 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📊 Mock Data Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <div>Large Customers: 2</div>
            <div>SMB Customers: 5</div>
            <div>Large ARPU: $16,500</div>
            <div>SMB ARPU: $3,000</div>
            <div>Operating Expenses: $50,000</div>
            <div>Cash in Bank: $500,000</div>
            <div>CAC: $1,500</div>
            <div>Marketing Spend: $5,000</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
