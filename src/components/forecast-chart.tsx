'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ForecastChartProps = {
  data: any[];
};

export function ForecastChart({ data }: ForecastChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map(item => ({
    name: item.Month,
    'Revenue from large clients': parseFloat(item['Revenue from large clients'].replace(/[^0-9.-]+/g, "")),
    'Revenue from small and medium clients': parseFloat(item['Revenue from small and medium clients'].replace(/[^0-9.-]+/g, "")),
    'Total Revenues': parseFloat(item['Total Revenues'].replace(/[^0-9.-]+/g, "")),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
            tickFormatter={(value) =>
            new Intl.NumberFormat('en-US', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
          }
        />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)
          }
        />
        <Legend />
        <Bar dataKey="Revenue from large clients" stackId="a" fill="hsl(var(--chart-1))" />
        <Bar dataKey="Revenue from small and medium clients" stackId="a" fill="hsl(var(--chart-2))" />
      </BarChart>
    </ResponsiveContainer>
  );
}
