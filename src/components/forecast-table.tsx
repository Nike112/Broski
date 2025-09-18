'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

type ForecastTableProps = {
  data: string;
};

export function ForecastTable({ data }: ForecastTableProps) {
  const lines = data.trim().split('\n').filter(line => line.trim().startsWith('|'));
  
  if (lines.length < 2) {
    return <p className="whitespace-pre-wrap">{data}</p>;
  }

  const parseLine = (line: string): string[] => {
    return line.split('|').map(s => s.trim()).slice(1, -1);
  };
  
  const headerLine = lines[0];
  const dataLines = lines[1].includes('---') ? lines.slice(2) : lines.slice(1);
  
  const headers = parseLine(headerLine);
  const rows = dataLines.map(parseLine);

  if (headers.length === 0 || rows.length === 0 || headers.length !== rows[0].length) {
      return <p className="whitespace-pre-wrap">{data}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index} className={index > 0 ? 'text-right' : 'text-left'}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className={cellIndex > 0 ? 'text-right font-mono' : 'font-medium'}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
