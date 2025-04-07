'use client';

import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';

// Define the LayoutType since it's not directly exported from recharts
type LayoutType = 'horizontal' | 'vertical';

// Type definitions for props
interface DataPoint {
  [key: string]: any;
}

interface LineConfig {
  dataKey: string;
  color: string;
  name: string;
  dash?: boolean;
  strokeWidth?: number;
  activeDot?: Record<string, any>;
  strokeOpacity?: number;
  connectNulls?: boolean;
}

interface BarChartProps {
  data: DataPoint[];
  layout?: LayoutType;
  xAxisKey?: string;
  barKey?: string;
  barName?: string;
  colors?: string[];
}

interface LineChartProps {
  data: DataPoint[];
  xAxisKey?: string;
  lines?: LineConfig[];
}

interface PieChartProps {
  data: DataPoint[];
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
}

interface ForecastChartProps {
  data: DataPoint[];
}

// Create a single component that loads the right chart based on a type prop
export default function ChartComponent(props: any) {
  const { type, ...chartProps } = props;
  
  switch (type) {
    case 'BarChart':
      return <CustomBarChart {...chartProps} />;
    case 'LineChart':
      return <CustomLineChart {...chartProps} />;
    case 'PieChart':
      return <CustomPieChart {...chartProps} />;
    case 'ForecastChart':
      return <ForecastChart {...chartProps} />;
    default:
      return <div>Invalid chart type</div>;
  }
}

// Wrapper for bar chart with simpler API
function CustomBarChart({ 
  data, 
  layout = 'horizontal',
  xAxisKey = 'name', 
  barKey = 'value',
  barName = 'Value',
  colors = ['#8884d8']
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xAxisKey} />
            <YAxis />
          </>
        ) : (
          <>
            <XAxis type="number" />
            <YAxis type="category" dataKey={xAxisKey} />
          </>
        )}
        <Tooltip />
        <Legend />
        <Bar dataKey={barKey} fill={colors[0]} name={barName} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Wrapper for line chart with simpler API
function CustomLineChart({ 
  data, 
  xAxisKey = 'name',
  lines = [{ dataKey: 'value', color: '#8884d8', name: 'Value' }]
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            name={line.name}
            strokeDasharray={line.dash ? "5 5" : undefined}
            strokeWidth={line.strokeWidth || 1}
            activeDot={line.activeDot || { r: 6 }}
            strokeOpacity={line.strokeOpacity}
            connectNulls={line.connectNulls}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Wrapper for pie chart with simpler API
function CustomPieChart({ 
  data, 
  nameKey = 'name', 
  valueKey = 'value',
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// Specialized chart for forecast with confidence intervals
function ForecastChart({ data }: ForecastChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  // Find the current month index (last month with actual data)
  const currentMonthIndex = data.findIndex(item => item.actual === null) - 1;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        
        {/* Confidence interval area */}
        <defs>
          <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        
        <Area 
          type="monotone" 
          dataKey="upperBound" 
          stroke="none" 
          fill="url(#confidenceGradient)" 
          fillOpacity={1}
          name="Confidence Interval"
        />
        
        <Area 
          type="monotone" 
          dataKey="lowerBound" 
          stroke="none" 
          fill="transparent" 
          name="Lower Bound"
          legendType="none"
        />
        
        {/* Current month reference line */}
        {currentMonthIndex >= 0 && (
          <ReferenceLine 
            x={data[currentMonthIndex].month} 
            stroke="#666" 
            strokeDasharray="3 3" 
            label="Current" 
          />
        )}
        
        {/* Actual demand line */}
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="#8884d8" 
          strokeWidth={2}
          activeDot={{ r: 8 }} 
          name="Historical Demand"
          connectNulls={true}
        />
        
        {/* Forecast line */}
        <Line 
          type="monotone" 
          dataKey="forecast" 
          stroke="#82ca9d" 
          strokeWidth={2}
          name="Forecasted Demand"
          connectNulls={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 