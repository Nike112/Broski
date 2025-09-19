import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create sample financial projections data
    const projections = generateSampleProjections();
    
    // Create Excel workbook
    const workbook = createExcelWorkbook(projections);
    
    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="sample-financial-projections.xlsx"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
}

function generateSampleProjections() {
  const projections = [];
  
  for (let month = 1; month <= 11; month++) {
    // Calculate large customers (sales-led growth)
    const salesPeople = Math.min(1 + Math.floor((month - 1) / 2), 6);
    const newLargeCustomers = Math.floor(salesPeople * 1.5);
    const cumulativeLargeCustomers = month === 1 ? 1 : projections[month - 2].cumulativeLargeCustomers + newLargeCustomers;
    
    // Calculate SMB customers (marketing-led growth)
    const marketingSpend = 200000;
    const cac = 1500;
    const inquiries = Math.floor(marketingSpend / cac);
    const conversionRate = 0.45;
    const newSMBCustomers = Math.floor(inquiries * conversionRate);
    const cumulativeSMBCustomers = month === 1 ? 72 : projections[month - 2].cumulativeSMBCustomers + newSMBCustomers;
    
    // Calculate revenues
    const largeARPU = 16500;
    const smbARPU = 5000;
    const largeRevenue = cumulativeLargeCustomers * largeARPU;
    const smbRevenue = cumulativeSMBCustomers * smbARPU;
    const totalRevenue = largeRevenue + smbRevenue;
    
    projections.push({
      month: `M${month}`,
      salesPeople,
      largeCustomersPerSalesPerson: 1.5,
      newLargeCustomers,
      cumulativeLargeCustomers,
      largeARPU,
      largeRevenue,
      marketingSpend,
      cac,
      inquiries,
      conversionRate,
      newSMBCustomers,
      cumulativeSMBCustomers,
      smbARPU,
      smbRevenue,
      totalRevenue,
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
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Projections');
  
  return workbook;
}
