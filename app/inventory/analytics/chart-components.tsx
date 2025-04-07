'use client';

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
  Cell
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

// Wrapper for bar chart with simpler API
export function CustomBarChart({ 
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
export function CustomLineChart({ 
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
export function CustomPieChart({ 
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
export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
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
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="#8884d8" 
          strokeWidth={2}
          activeDot={{ r: 8 }} 
          name="Historical Demand"
          connectNulls={true}
        />
        <Line 
          type="monotone" 
          dataKey="forecast" 
          stroke="#82ca9d" 
          strokeWidth={2}
          name="Forecasted Demand"
        />
        <Line 
          type="monotone" 
          dataKey="upperBound" 
          stroke="#82ca9d" 
          strokeWidth={1}
          strokeDasharray="3 3"
          name="Upper Bound (95% CI)"
          strokeOpacity={0.6}
        />
        <Line 
          type="monotone" 
          dataKey="lowerBound" 
          stroke="#82ca9d" 
          strokeWidth={1}
          strokeDasharray="3 3"
          name="Lower Bound (95% CI)"
          strokeOpacity={0.6}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Export the components with their renamed versions
export { 
  ResponsiveContainer,
  CustomBarChart as BarChart,
  CustomLineChart as LineChart,
  CustomPieChart as PieChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Pie,
  Cell
}; 