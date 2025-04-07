'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar,
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Simple data for testing
const data = [
  { name: 'Page A', value: 400 },
  { name: 'Page B', value: 300 },
  { name: 'Page C', value: 200 },
  { name: 'Page D', value: 100 }
];

// Test line chart data
const lineData = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 200 },
  { month: 'Mar', value: 150 },
  { month: 'Apr', value: 300 }
];

export default function TestChart() {
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    console.log("Test chart component mounted");
  }, []);

  // If not client-side yet, show a loading message
  if (!isClient) {
    return <div>Loading charts...</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold">Chart Testing Page</h1>
      <p>This page tests various charts to debug rendering issues.</p>
      
      {/* Basic Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Bar Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Simple Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Line Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Fixed dimension chart (not responsive) */}
      <Card>
        <CardHeader>
          <CardTitle>Fixed Dimension Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <BarChart
              width={500}
              height={300}
              data={data}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 