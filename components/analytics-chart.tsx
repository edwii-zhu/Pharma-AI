"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Jan', prescriptions: 400, revenue: 2400 },
  { name: 'Feb', prescriptions: 300, revenue: 1398 },
  { name: 'Mar', prescriptions: 520, revenue: 3800 },
  { name: 'Apr', prescriptions: 270, revenue: 4908 },
  { name: 'May', prescriptions: 450, revenue: 3800 },
  { name: 'Jun', prescriptions: 380, revenue: 4300 },
]

export function AnalyticsChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Monthly prescriptions and revenue trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="prescriptions" stroke="hsl(var(--chart-1))" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}