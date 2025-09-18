'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, Plus, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { HistoricalData } from '@/lib/excel-parser';

interface HistoricalDataInputProps {
  onDataSubmit: (data: HistoricalData[]) => void;
  existingData?: HistoricalData[];
}

export function HistoricalDataInput({ onDataSubmit, existingData = [] }: HistoricalDataInputProps) {
  const [dataPoints, setDataPoints] = useState<HistoricalData[]>(existingData);
  const [externalFactors, setExternalFactors] = useState({
    marketGrowth: 0.15, // 15% industry growth
    economicIndex: 0.85, // 85% economic health
    competitivePressure: 0.3, // 30% competitive pressure
    seasonality: [1.2, 0.8, 1.1, 1.0, 0.9, 1.3, 1.1, 0.7, 0.8, 1.0, 1.2, 1.4] // Monthly factors
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addDataPoint = () => {
    const newDataPoint: HistoricalData = {
      date: new Date().toISOString().split('T')[0],
      revenue: 0,
      customers: 0,
      churn: 0,
      acquisition: 0
    };
    setDataPoints([...dataPoints, newDataPoint]);
  };

  const removeDataPoint = (index: number) => {
    setDataPoints(dataPoints.filter((_, i) => i !== index));
  };

  const updateDataPoint = (index: number, field: keyof HistoricalData, value: string | number) => {
    const updated = [...dataPoints];
    updated[index] = { ...updated[index], [field]: value };
    setDataPoints(updated);
  };

  const handleSubmit = () => {
    if (dataPoints.length < 3) {
      alert('Please add at least 3 data points for accurate predictions');
      return;
    }

    // Validate data
    const validData = dataPoints.filter(d => d.revenue > 0 && d.customers > 0);
    if (validData.length < 3) {
      alert('Please ensure all data points have valid revenue and customer values');
      return;
    }

    onDataSubmit(validData);
  };

  const generateSampleData = () => {
    const sampleData: HistoricalData[] = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11); // 12 months of data

    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      // Generate realistic SaaS data with growth trend
      const baseRevenue = 50000 + (i * 5000); // Growing revenue
      const baseCustomers = 100 + (i * 10); // Growing customers
      const seasonalFactor = externalFactors.seasonality[i] || 1;
      
      sampleData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(baseRevenue * seasonalFactor),
        customers: Math.round(baseCustomers * seasonalFactor),
        churn: 0.02 + Math.random() * 0.01, // 2-3% churn
        acquisition: Math.round(15 + Math.random() * 10) // 15-25 new customers
      });
    }
    
    setDataPoints(sampleData);
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Revenue,Customers,Churn,Acquisition\n"
      + dataPoints.map(d => `${d.date},${d.revenue},${d.customers},${d.churn},${d.acquisition}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historical_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dataQualityScore = () => {
    let score = 0;
    
    // Data points count (max 30 points)
    score += Math.min(30, dataPoints.length * 2.5);
    
    // Data completeness (max 20 points)
    const completeData = dataPoints.filter(d => d.revenue > 0 && d.customers > 0 && d.churn > 0 && d.acquisition > 0);
    score += (completeData.length / dataPoints.length) * 20;
    
    // Data recency (max 20 points)
    if (dataPoints.length > 0) {
      const lastDate = new Date(dataPoints[dataPoints.length - 1].date);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
      score += Math.max(0, 20 - monthsDiff * 2);
    }
    
    // Data consistency (max 30 points)
    if (dataPoints.length > 1) {
      const revenues = dataPoints.map(d => d.revenue);
      const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      const variance = revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / revenues.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;
      score += Math.max(0, 30 - coefficientOfVariation * 50);
    }
    
    return Math.round(score);
  };

  const qualityScore = dataQualityScore();

  return (
    <div className="space-y-6">
      {/* Data Quality Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Data Quality Score
          </CardTitle>
          <CardDescription>
            Higher quality data leads to more accurate predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">{qualityScore}/100</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    qualityScore >= 80 ? 'bg-green-500' :
                    qualityScore >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${qualityScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {qualityScore >= 80 ? 'Excellent data quality' :
                 qualityScore >= 60 ? 'Good data quality' :
                 qualityScore >= 40 ? 'Fair data quality' :
                 'Poor data quality - more data needed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data Input */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Business Data</CardTitle>
          <CardDescription>
            Add your historical revenue, customer, and metrics data for more accurate predictions.
            Minimum 3 data points required, 12+ months recommended for best accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button onClick={addDataPoint} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Data Point
            </Button>
            <Button onClick={generateSampleData} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Generate Sample Data
            </Button>
            <Button onClick={exportData} variant="outline" size="sm" disabled={dataPoints.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Data Points Table */}
          <div className="space-y-2">
            {dataPoints.map((dataPoint, index) => (
              <div key={index} className="grid grid-cols-6 gap-2 items-center p-3 border rounded-lg">
                <div>
                  <Label htmlFor={`date-${index}`}>Date</Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={dataPoint.date}
                    onChange={(e) => updateDataPoint(index, 'date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`revenue-${index}`}>Revenue ($)</Label>
                  <Input
                    id={`revenue-${index}`}
                    type="number"
                    value={dataPoint.revenue}
                    onChange={(e) => updateDataPoint(index, 'revenue', Number(e.target.value))}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label htmlFor={`customers-${index}`}>Customers</Label>
                  <Input
                    id={`customers-${index}`}
                    type="number"
                    value={dataPoint.customers}
                    onChange={(e) => updateDataPoint(index, 'customers', Number(e.target.value))}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor={`churn-${index}`}>Churn Rate</Label>
                  <Input
                    id={`churn-${index}`}
                    type="number"
                    step="0.01"
                    value={dataPoint.churn}
                    onChange={(e) => updateDataPoint(index, 'churn', Number(e.target.value))}
                    placeholder="0.02"
                  />
                </div>
                <div>
                  <Label htmlFor={`acquisition-${index}`}>New Customers</Label>
                  <Input
                    id={`acquisition-${index}`}
                    type="number"
                    value={dataPoint.acquisition}
                    onChange={(e) => updateDataPoint(index, 'acquisition', Number(e.target.value))}
                    placeholder="20"
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => removeDataPoint(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Data Quality Alerts */}
          {dataPoints.length > 0 && (
            <div className="space-y-2">
              {dataPoints.length < 6 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    For better accuracy, add at least 6 months of historical data.
                  </AlertDescription>
                </Alert>
              )}
              {dataPoints.length < 12 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    For seasonality analysis, 12+ months of data is recommended.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Advanced External Factors */}
          <div className="space-y-4">
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              size="sm"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced External Factors
            </Button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="marketGrowth">Market Growth Rate (%)</Label>
                  <Input
                    id="marketGrowth"
                    type="number"
                    step="0.01"
                    value={externalFactors.marketGrowth * 100}
                    onChange={(e) => setExternalFactors({
                      ...externalFactors,
                      marketGrowth: Number(e.target.value) / 100
                    })}
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label htmlFor="economicIndex">Economic Health Index (0-100)</Label>
                  <Input
                    id="economicIndex"
                    type="number"
                    min="0"
                    max="100"
                    value={externalFactors.economicIndex * 100}
                    onChange={(e) => setExternalFactors({
                      ...externalFactors,
                      economicIndex: Number(e.target.value) / 100
                    })}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="competitivePressure">Competitive Pressure (0-100)</Label>
                  <Input
                    id="competitivePressure"
                    type="number"
                    min="0"
                    max="100"
                    value={externalFactors.competitivePressure * 100}
                    onChange={(e) => setExternalFactors({
                      ...externalFactors,
                      competitivePressure: Number(e.target.value) / 100
                    })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label>Seasonality Factors</Label>
                  <Textarea
                    value={externalFactors.seasonality.map(s => s.toFixed(2)).join(', ')}
                    onChange={(e) => {
                      const values = e.target.value.split(',').map(v => parseFloat(v.trim()) || 1);
                      if (values.length === 12) {
                        setExternalFactors({ ...externalFactors, seasonality: values });
                      }
                    }}
                    placeholder="1.2, 0.8, 1.1, 1.0, 0.9, 1.3, 1.1, 0.7, 0.8, 1.0, 1.2, 1.4"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={dataPoints.length < 3}
              className="min-w-[200px]"
            >
              Generate Enhanced Predictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
