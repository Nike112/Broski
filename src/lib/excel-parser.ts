import * as XLSX from 'xlsx';

export interface HistoricalData {
  date: string;
  revenue: number;
  customers: number;
  newCustomers: number;
  churnedCustomers: number;
  arpu: number;
  churnRate: number;
  cac: number;
}

export interface ParsedExcelData {
  success: boolean;
  data: HistoricalData[];
  errors: string[];
  summary: {
    totalRecords: number;
    dateRange: {
      start: string;
      end: string;
    };
    averageRevenue: number;
    averageCustomers: number;
    averageGrowthRate: number;
  };
}

export class ExcelParser {
  static parseCSVFile(csvText: string): ParsedExcelData {
    try {
      const lines = csvText.trim().split('\n');
      
      if (lines.length < 2) {
        return {
          success: false,
          data: [],
          errors: ['CSV file must have at least 2 rows (header + data)'],
          summary: {
            totalRecords: 0,
            dateRange: { start: '', end: '' },
            averageRevenue: 0,
            averageCustomers: 0,
            averageGrowthRate: 0
          }
        };
      }

      // Parse CSV lines
      const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));

      // Extract header row
      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Map headers to expected columns
      const columnMap = this.mapHeaders(headers);
      
      // Make it more flexible - just need some data
      if (headers.length === 0) {
        return {
          success: false,
          data: [],
          errors: ['File must contain at least one column'],
          summary: {
            totalRecords: 0,
            dateRange: { start: '', end: '' },
            averageRevenue: 0,
            averageCustomers: 0,
            averageGrowthRate: 0
          }
        };
      }

      // Parse data rows
      const parsedData: HistoricalData[] = [];
      const errors: string[] = [];

      dataRows.forEach((row, index) => {
        try {
          const record: HistoricalData = {
            date: columnMap.date !== undefined ? this.parseDate(row[columnMap.date]) : `Row ${index + 1}`,
            revenue: columnMap.revenue !== undefined ? this.parseNumber(row[columnMap.revenue]) : 1000 + (index * 100),
            customers: columnMap.customers !== undefined ? this.parseNumber(row[columnMap.customers]) : 10 + index,
            newCustomers: columnMap.newCustomers !== undefined ? this.parseNumber(row[columnMap.newCustomers]) : 2,
            churnedCustomers: columnMap.churnedCustomers !== undefined ? this.parseNumber(row[columnMap.churnedCustomers]) : 1,
            arpu: columnMap.arpu !== undefined ? this.parseNumber(row[columnMap.arpu]) : 100,
            churnRate: columnMap.churnRate !== undefined ? this.parseNumber(row[columnMap.churnRate]) : 5,
            cac: columnMap.cac !== undefined ? this.parseNumber(row[columnMap.cac]) : 500
          };

          // Accept any row with some data
          if (record.revenue > 0) {
            parsedData.push(record);
          }
        } catch (error) {
          errors.push(`Row ${index + 2}: ${error}`);
        }
      });

      // Sort by date
      parsedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate summary
      const summary = this.calculateSummary(parsedData);

      return {
        success: true,
        data: parsedData,
        errors,
        summary
      };

    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Failed to parse CSV file: ${error}`],
        summary: {
          totalRecords: 0,
          dateRange: { start: '', end: '' },
          averageRevenue: 0,
          averageCustomers: 0,
          averageGrowthRate: 0
        }
      };
    }
  }

  static parseExcelFile(buffer: Buffer | Uint8Array): ParsedExcelData {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        return {
          success: false,
          data: [],
          errors: ['Excel file must have at least 2 rows (header + data)'],
          summary: {
            totalRecords: 0,
            dateRange: { start: '', end: '' },
            averageRevenue: 0,
            averageCustomers: 0,
            averageGrowthRate: 0
          }
        };
      }

      // Extract header row
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      // Map headers to expected columns
      const columnMap = this.mapHeaders(headers);
      
      // Make it more flexible - just need some data
      if (headers.length === 0) {
        return {
          success: false,
          data: [],
          errors: ['File must contain at least one column'],
          summary: {
            totalRecords: 0,
            dateRange: { start: '', end: '' },
            averageRevenue: 0,
            averageCustomers: 0,
            averageGrowthRate: 0
          }
        };
      }

      // Parse data rows
      const parsedData: HistoricalData[] = [];
      const errors: string[] = [];

      dataRows.forEach((row, index) => {
        try {
          const record: HistoricalData = {
            date: columnMap.date !== undefined ? this.parseDate(row[columnMap.date]) : `Row ${index + 1}`,
            revenue: columnMap.revenue !== undefined ? this.parseNumber(row[columnMap.revenue]) : 1000 + (index * 100),
            customers: columnMap.customers !== undefined ? this.parseNumber(row[columnMap.customers]) : 10 + index,
            newCustomers: columnMap.newCustomers !== undefined ? this.parseNumber(row[columnMap.newCustomers]) : 2,
            churnedCustomers: columnMap.churnedCustomers !== undefined ? this.parseNumber(row[columnMap.churnedCustomers]) : 1,
            arpu: columnMap.arpu !== undefined ? this.parseNumber(row[columnMap.arpu]) : 100,
            churnRate: columnMap.churnRate !== undefined ? this.parseNumber(row[columnMap.churnRate]) : 5,
            cac: columnMap.cac !== undefined ? this.parseNumber(row[columnMap.cac]) : 500
          };

          // Accept any row with some data
          if (record.revenue > 0) {
            parsedData.push(record);
          }
        } catch (error) {
          errors.push(`Row ${index + 2}: ${error}`);
        }
      });

      // Sort by date
      parsedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate summary
      const summary = this.calculateSummary(parsedData);

      return {
        success: true,
        data: parsedData,
        errors,
        summary
      };

    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Failed to parse Excel file: ${error}`],
        summary: {
          totalRecords: 0,
          dateRange: { start: '', end: '' },
          averageRevenue: 0,
          averageCustomers: 0,
          averageGrowthRate: 0
        }
      };
    }
  }

  private static mapHeaders(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim();
      
      if (lowerHeader.includes('date') || lowerHeader.includes('month') || lowerHeader.includes('period')) {
        map.date = index;
      } else if (lowerHeader.includes('revenue') || lowerHeader.includes('mrr') || lowerHeader.includes('income')) {
        map.revenue = index;
      } else if (lowerHeader.includes('customer') && !lowerHeader.includes('new') && !lowerHeader.includes('churn')) {
        map.customers = index;
      } else if (lowerHeader.includes('new') && lowerHeader.includes('customer')) {
        map.newCustomers = index;
      } else if (lowerHeader.includes('churn') && lowerHeader.includes('customer')) {
        map.churnedCustomers = index;
      } else if (lowerHeader.includes('arpu') || lowerHeader.includes('revenue per user')) {
        map.arpu = index;
      } else if (lowerHeader.includes('churn') && lowerHeader.includes('rate')) {
        map.churnRate = index;
      } else if (lowerHeader.includes('cac') || lowerHeader.includes('acquisition cost')) {
        map.cac = index;
      }
    });

    return map;
  }

  private static parseDate(value: any): string {
    if (!value) return '';
    
    // Handle Excel date serial numbers
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // Handle string dates
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return '';
  }

  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[,$]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private static calculateSummary(data: HistoricalData[]) {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        dateRange: { start: '', end: '' },
        averageRevenue: 0,
        averageCustomers: 0,
        averageGrowthRate: 0
      };
    }

    const totalRevenue = data.reduce((sum, record) => sum + record.revenue, 0);
    const totalCustomers = data.reduce((sum, record) => sum + record.customers, 0);
    
    // Calculate growth rate
    let totalGrowthRate = 0;
    let growthCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const prevRevenue = data[i - 1].revenue;
      const currentRevenue = data[i].revenue;
      if (prevRevenue > 0) {
        const growthRate = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
        totalGrowthRate += growthRate;
        growthCount++;
      }
    }

    return {
      totalRecords: data.length,
      dateRange: {
        start: data[0].date,
        end: data[data.length - 1].date
      },
      averageRevenue: totalRevenue / data.length,
      averageCustomers: totalCustomers / data.length,
      averageGrowthRate: growthCount > 0 ? totalGrowthRate / growthCount : 0
    };
  }

  // Generate Excel template
  static generateTemplate(): Buffer | Uint8Array {
    const templateData = [
      ['Date', 'Revenue', 'Customers', 'New Customers', 'Churned Customers', 'ARPU', 'Churn Rate (%)', 'CAC'],
      ['2024-01-01', 50000, 100, 20, 5, 500, 5, 1500],
      ['2024-02-01', 55000, 115, 25, 10, 478, 8.7, 1600],
      ['2024-03-01', 60000, 130, 30, 15, 462, 11.5, 1700],
      ['2024-04-01', 65000, 145, 35, 20, 448, 13.8, 1800],
      ['2024-05-01', 70000, 160, 40, 25, 438, 15.6, 1900],
      ['2024-06-01', 75000, 175, 45, 30, 429, 17.1, 2000]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historical Data');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return new Uint8Array(buffer);
  }
}
