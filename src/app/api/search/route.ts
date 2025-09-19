import { NextRequest, NextResponse } from 'next/server';
import { MLPredictor } from '@/lib/ml-predictor';
import { automateFinancialForecasting } from '@/ai/flows/automate-financial-forecasting';
import { HistoricalData } from '@/lib/excel-parser';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Parse query to extract parameters
    const params = parseQuery(query);
    
    // Generate financial projections
    const projections = await generateFinancialProjections(params);
    
    // Create Excel workbook
    const workbook = createExcelWorkbook(projections);
    
    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="financial-projections-${Date.now()}.xlsx"`,
      },
    });
    
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface QueryParams {
  months: number;
  largeCustomers: number;
  smbCustomers: number;
  salesPeople: number;
  marketingSpend: number;
  cac: number;
  conversionRate: number;
  largeARPU: number;
  smbARPU: number;
}

function parseQuery(query: string): QueryParams {
  // Default values based on the Excel sheet
  const defaults: QueryParams = {
    months: 11,
    largeCustomers: 0,
    smbCustomers: 0,
    salesPeople: 1,
    marketingSpend: 200000,
    cac: 1500,
    conversionRate: 0.45,
    largeARPU: 16500,
    smbARPU: 5000
  };

  // Extract parameters from query (simplified parsing)
  const lowerQuery = query.toLowerCase();
  
  // Extract months
  const monthsMatch = lowerQuery.match(/(\d+)\s*months?/);
  if (monthsMatch) {
    defaults.months = parseInt(monthsMatch[1]);
  }
  
  // Extract sales people
  const salesMatch = lowerQuery.match(/(\d+)\s*sales\s*people?/);
  if (salesMatch) {
    defaults.salesPeople = parseInt(salesMatch[1]);
  }
  
  // Extract marketing spend
  const marketingMatch = lowerQuery.match(/\$?(\d+(?:,\d{3})*)\s*marketing/);
  if (marketingMatch) {
    defaults.marketingSpend = parseInt(marketingMatch[1].replace(/,/g, ''));
  }
  
  // Extract CAC
  const cacMatch = lowerQuery.match(/\$?(\d+(?:,\d{3})*)\s*cac/);
  if (cacMatch) {
    defaults.cac = parseInt(cacMatch[1].replace(/,/g, ''));
  }
  
  // Extract conversion rate
  const conversionMatch = lowerQuery.match(/(\d+)%\s*conversion/);
  if (conversionMatch) {
    defaults.conversionRate = parseInt(conversionMatch[1]) / 100;
  }

  return defaults;
}

async function generateFinancialProjections(params: QueryParams) {
  // Create historical data based on parameters
  const historicalData: HistoricalData[] = [];
  const currentDate = new Date();
  
  // Generate 6 months of historical data
  for (let i = 6; i >= 1; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    
    // Simulate growth
    const growthFactor = 1 + (6 - i) * 0.1;
    const largeCustomers = Math.floor(params.largeCustomers * growthFactor);
    const smbCustomers = Math.floor(params.smbCustomers * growthFactor);
    
    historicalData.push({
      date: date.toISOString().split('T')[0],
      revenue: (largeCustomers * params.largeARPU) + (smbCustomers * params.smbARPU),
      customers: largeCustomers + smbCustomers
    });
  }

  // Generate projections
  const projections = [];
  
  for (let month = 1; month <= params.months; month++) {
    // Calculate large customers (sales-led growth)
    const salesPeopleThisMonth = Math.min(params.salesPeople + month - 1, 10);
    const newLargeCustomers = Math.min(salesPeopleThisMonth * 1.5, 10); // 1-2 customers per sales person
    const cumulativeLargeCustomers = params.largeCustomers + (newLargeCustomers * month);
    
    // Calculate SMB customers (marketing-led growth)
    const inquiries = Math.floor(params.marketingSpend / params.cac);
    const newSMBCustomers = Math.floor(inquiries * params.conversionRate);
    const cumulativeSMBCustomers = params.smbCustomers + (newSMBCustomers * month);
    
    // Calculate revenues
    const largeRevenue = cumulativeLargeCustomers * params.largeARPU;
    const smbRevenue = cumulativeSMBCustomers * params.smbARPU;
    const totalRevenue = largeRevenue + smbRevenue;
    
    projections.push({
      month: `M${month}`,
      salesPeople: salesPeopleThisMonth,
      largeCustomersPerSalesPerson: 1.5,
      newLargeCustomers: newLargeCustomers,
      cumulativeLargeCustomers: cumulativeLargeCustomers,
      largeARPU: params.largeARPU,
      largeRevenue: largeRevenue,
      marketingSpend: params.marketingSpend,
      cac: params.cac,
      inquiries: inquiries,
      conversionRate: params.conversionRate,
      newSMBCustomers: newSMBCustomers,
      cumulativeSMBCustomers: cumulativeSMBCustomers,
      smbARPU: params.smbARPU,
      smbRevenue: smbRevenue,
      totalRevenue: totalRevenue,
      totalRevenueMn: totalRevenue / 1000000
    });
  }
  
  return projections;
}

function createExcelWorkbook(projections: any[]) {
  const workbook = XLSX.utils.book_new();
  
  // Create the main projection sheet
  const worksheetData = [
    // Headers
    ['Large Customer Metrics', '', '', '', '', '', '', '', '', '', '', ''],
    ['# of sales people', ...projections.map(p => p.salesPeople)],
    ['# of large customer accounts they can sign per month/ sales person', ...projections.map(p => p.largeCustomersPerSalesPerson)],
    ['# of large customer accounts onboarded per month', ...projections.map(p => p.newLargeCustomers)],
    ['Cumulative # of paying customers', ...projections.map(p => p.cumulativeLargeCustomers)],
    ['Average revenue per customer', ...projections.map(p => p.largeARPU)],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['Digital Marketing & Average CAC', '', '', '', '', '', '', '', '', '', '', ''],
    ['Digital Marketing spend per month', ...projections.map(p => p.marketingSpend)],
    ['Average CAC', ...projections.map(p => p.cac)],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['Sales Enquiries & Conversions (for Small and Medium Customers)', '', '', '', '', '', '', '', '', '', '', ''],
    ['# of sales enquiries', ...projections.map(p => p.inquiries)],
    ['% conversions from demo to sign ups', ...projections.map(p => `${(p.conversionRate * 100).toFixed(0)}%`)],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['Small and Medium Customer Metrics', '', '', '', '', '', '', '', '', '', '', ''],
    ['# of paying customers onboarded', ...projections.map(p => p.newSMBCustomers)],
    ['Cumulative number of paying customers', ...projections.map(p => p.cumulativeSMBCustomers)],
    ['Average revenue per customer', ...projections.map(p => p.smbARPU)],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['Total Revenues', '', '', '', '', '', '', '', '', '', '', ''],
    ['Revenue from large clients ($ per month)', ...projections.map(p => p.largeRevenue)],
    ['Revenue from small and medium clients ($ per month)', ...projections.map(p => p.smbRevenue)],
    ['Total Revenues ($ per month)', ...projections.map(p => p.totalRevenue)],
    ['Total Revenues ($ Mn per month)', ...projections.map(p => p.totalRevenueMn.toFixed(2))]
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Add month headers
  const monthHeaders = ['', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11'];
  XLSX.utils.sheet_add_aoa(worksheet, [monthHeaders], { origin: 'A1' });
  
  // Style the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;
      
      // Style headers
      if (row === 0 || row === 1 || row === 7 || row === 12 || row === 16 || row === 21) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E6E6FA" } }
        };
      }
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Projections');
  
  return workbook;
}
