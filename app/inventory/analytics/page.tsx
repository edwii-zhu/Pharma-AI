'use client';

import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { ArrowLeft, Download, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for charts
const stockTrendsData = [
  { month: 'Jan', stock: 120, forecast: 110 },
  { month: 'Feb', stock: 100, forecast: 95 },
  { month: 'Mar', stock: 80, forecast: 75 },
  { month: 'Apr', stock: 110, forecast: 105 },
  { month: 'May', stock: 90, forecast: 85 },
  { month: 'Jun', stock: 75, forecast: 70 },
  { month: 'Jul', stock: 60, forecast: 65 },
  { month: 'Aug', stock: 80, forecast: 80 },
  { month: 'Sep', stock: 95, forecast: 90 },
  { month: 'Oct', stock: 85, forecast: 85 },
  { month: 'Nov', stock: 70, forecast: 75 },
  { month: 'Dec', stock: 90, forecast: 95 },
];

const categoryDistributionData = [
  { name: 'Cardiovascular', value: 35 },
  { name: 'Diabetes', value: 20 },
  { name: 'Gastrointestinal', value: 15 },
  { name: 'Antibiotics', value: 10 },
  { name: 'Pain Management', value: 15 },
  { name: 'Other', value: 5 },
];

const stockStatusData = [
  { name: 'In Stock', value: 65 },
  { name: 'Low Stock', value: 25 },
  { name: 'Out of Stock', value: 10 },
];

const topSellingItems = [
  { name: 'Lisinopril 10mg', value: 320 },
  { name: 'Metformin 500mg', value: 280 },
  { name: 'Atorvastatin 40mg', value: 250 },
  { name: 'Omeprazole 20mg', value: 210 },
  { name: 'Simvastatin 20mg', value: 180 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B6B'];
const STATUS_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function InventoryAnalyticsPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Button 
                  variant="ghost" 
                  className="mb-2 flex items-center gap-1"
                  onClick={() => router.push('/inventory')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Inventory
                </Button>
                <h1 className="text-3xl font-bold">Inventory Analytics</h1>
                <p className="text-muted-foreground">
                  Analyze inventory trends, forecast demand, and optimize stock levels
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Time Period Selector */}
            <div className="flex justify-end items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Time Period:</span>
                <Select defaultValue="last12Months">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last30Days">Last 30 Days</SelectItem>
                    <SelectItem value="last90Days">Last 90 Days</SelectItem>
                    <SelectItem value="last6Months">Last 6 Months</SelectItem>
                    <SelectItem value="last12Months">Last 12 Months</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">567</div>
                  <p className="text-xs text-muted-foreground">
                    +12 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Turnover Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2x</div>
                  <p className="text-xs text-muted-foreground">
                    +0.4x from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Stockout Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">42</div>
                  <p className="text-xs text-muted-foreground">
                    -15% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Forecast Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.8%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="trends" className="space-y-4">
              <TabsList>
                <TabsTrigger value="trends">Inventory Trends</TabsTrigger>
                <TabsTrigger value="distribution">Category Distribution</TabsTrigger>
                <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
                <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
              </TabsList>

              {/* Inventory Trends Tab */}
              <TabsContent value="trends" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Level Trends</CardTitle>
                      <CardDescription>
                        12-month view of inventory levels
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={stockTrendsData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="stock" 
                              stroke="#8884d8" 
                              activeDot={{ r: 8 }} 
                              name="Actual Stock"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="forecast" 
                              stroke="#82ca9d" 
                              strokeDasharray="5 5" 
                              name="Forecasted Stock"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Selling Items</CardTitle>
                      <CardDescription>
                        Most popular items by sales volume
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topSellingItems}
                            layout="vertical"
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Units Sold" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Category Distribution Tab */}
              <TabsContent value="distribution" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Distribution</CardTitle>
                      <CardDescription>
                        Inventory breakdown by category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryDistributionData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {categoryDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Status</CardTitle>
                      <CardDescription>
                        Current inventory status breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stockStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {stockStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Demand Forecast Tab */}
              <TabsContent value="forecast" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Demand Forecast</CardTitle>
                    <CardDescription>
                      AI-powered prediction of future inventory needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={stockTrendsData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="stock" 
                            stroke="#8884d8" 
                            name="Historical Data"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast" 
                            stroke="#82ca9d" 
                            name="Forecasted Demand"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-medium">Forecast Insights</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <span>Expected peak demand</span>
                          <span className="font-semibold">December 2024</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                          <span>Recommended restock date</span>
                          <span className="font-semibold">October 10, 2024</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                          <span>High stockout risk categories</span>
                          <span className="font-semibold">Antibiotics, Diabetes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>
                      Smart suggestions to optimize your inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/10">
                        <h3 className="text-lg font-medium mb-2">Reorder Recommendations</h3>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Metformin 500mg</span>
                            <span className="font-semibold">Order 200 units</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Simvastatin 20mg</span>
                            <span className="font-semibold">Order 150 units</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Amoxicillin 500mg</span>
                            <span className="font-semibold">Order 100 units</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/10">
                        <h3 className="text-lg font-medium mb-2">Overstocked Items</h3>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Lisinopril 10mg</span>
                            <span className="font-semibold">Consider reducing by 15%</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Omeprazole 20mg</span>
                            <span className="font-semibold">Consider reducing by 10%</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/10">
                        <h3 className="text-lg font-medium mb-2">Seasonal Adjustments</h3>
                        <p className="mb-2">Based on historical data, consider adjusting stock for:</p>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Allergy medications</span>
                            <span className="font-semibold">Increase by 25% for spring</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Cold & flu medications</span>
                            <span className="font-semibold">Increase by 40% for winter</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/10">
                        <h3 className="text-lg font-medium mb-2">Expiration Alerts</h3>
                        <p className="text-sm mb-2">The following items have batches approaching expiration:</p>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Insulin vials (Batch #2342)</span>
                            <span className="font-semibold text-amber-600">Expires in 45 days</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Epinephrine injectors (Batch #1123)</span>
                            <span className="font-semibold text-amber-600">Expires in 60 days</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
} 