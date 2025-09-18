'use client';

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { ExcelParser, ParsedExcelData } from '@/lib/excel-parser';

interface ExcelUploadProps {
  onDataParsed: (data: ParsedExcelData) => void;
  onPredictionRequested: (timespan: number, predictionType: 'revenue' | 'customers' | 'both') => void;
}

export function ExcelUpload({ onDataParsed, onPredictionRequested }: ExcelUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [timespan, setTimespan] = useState(6);
  const [predictionType, setPredictionType] = useState<'revenue' | 'customers' | 'both'>('both');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      alert('Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)');
      return;
    }

    setIsUploading(true);
    
    try {
      if (file.name.endsWith('.csv')) {
        // Handle CSV files
        const text = await file.text();
        const parsed = ExcelParser.parseCSVFile(text);
        setParsedData(parsed);
        onDataParsed(parsed);
      } else {
        // Handle Excel files
        const buffer = await file.arrayBuffer();
        const parsed = ExcelParser.parseExcelFile(new Uint8Array(buffer));
        setParsedData(parsed);
        onDataParsed(parsed);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please check the format.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = ExcelParser.generateTemplate();
    const blob = new Blob([template], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historical-data-template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrediction = () => {
    if (parsedData?.success) {
      onPredictionRequested(timespan, predictionType);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Historical Data
          </CardTitle>
          <CardDescription>
            Upload an Excel file with your historical business data to get accurate predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
            <div>
              <h4 className="font-medium text-blue-900">Need a template?</h4>
              <p className="text-sm text-blue-700">Download our Excel template to get started</p>
            </div>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Data File (.xlsx, .xls, .csv)'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Supports Excel files (.xlsx, .xls) and CSV files (.csv)
            </p>
          </div>

          {/* Upload Status */}
          {parsedData && (
            <Alert className={parsedData.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {parsedData.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={parsedData.success ? 'text-green-800' : 'text-red-800'}>
                {parsedData.success ? (
                  <div>
                    <p className="font-medium">File uploaded successfully!</p>
                    <p className="text-sm">
                      {parsedData.summary.totalRecords} records from {parsedData.summary.dateRange.start} to {parsedData.summary.dateRange.end}
                    </p>
                    <p className="text-sm">
                      Average Revenue: ${parsedData.summary.averageRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm">
                      Average Growth Rate: {parsedData.summary.averageGrowthRate.toFixed(1)}%
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Upload failed</p>
                    <ul className="text-sm list-disc list-inside">
                      {parsedData.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Prediction Settings */}
          {parsedData?.success && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium text-blue-900">Prediction Settings</h4>
              <p className="text-sm text-blue-700">Configure your ML prediction parameters</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900">Timespan</label>
                  <Select value={timespan.toString()} onValueChange={(value) => setTimespan(Number(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select timespan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900">Prediction Type</label>
                  <Select value={predictionType} onValueChange={(value: 'revenue' | 'customers' | 'both') => setPredictionType(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select prediction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Revenue & Customers</SelectItem>
                      <SelectItem value="revenue">Revenue Only</SelectItem>
                      <SelectItem value="customers">Customers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handlePrediction} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Brain className="h-4 w-4 mr-2" />
                Generate ML Predictions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
