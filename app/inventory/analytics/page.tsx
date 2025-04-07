'use client';

import { useState, useEffect } from 'react';
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';

// Dynamically import recharts components with no SSR to avoid hydration issues
const ChartComponents = dynamic(() => import('./chart-components'), { ssr: false });

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

// Mock data for AI recommendations
const mockRecommendations = [
  {
    id: 1,
    title: "Increase Stock for Lisinopril 10mg",
    description: "Based on the last 3 months' sales trends and seasonal patterns, consider increasing Lisinopril 10mg stock by 15% to prevent stockouts.",
    impact: "high",
    category: "Restocking"
  },
  {
    id: 2,
    title: "Optimize Reorder Points for Antibiotics",
    description: "Current reorder points for antibiotics are too high, leading to excess inventory. Consider lowering by 10-15% to improve cash flow while maintaining service levels.",
    impact: "medium",
    category: "Inventory Parameters"
  },
  {
    id: 3, 
    title: "Dispose of Expiring Medication",
    description: "10 batches of medications are expiring within 60 days with low sell-through rates. Consider discounting or return-to-vendor options to minimize losses.",
    impact: "high", 
    category: "Expiry Management"
  },
  {
    id: 4,
    title: "Review Slow-Moving Items",
    description: "15 products have had no sales in the past 90 days. Consider discontinuing or reducing stock levels for these items.",
    impact: "medium",
    category: "Portfolio Optimization"
  }
];

// Fixed forecast data
const forecastData = [
  { month: 'Jan', actual: 120, forecast: 110, upperBound: 125, lowerBound: 95 },
  { month: 'Feb', actual: 100, forecast: 95, upperBound: 110, lowerBound: 80 },
  { month: 'Mar', actual: 80, forecast: 75, upperBound: 90, lowerBound: 60 },
  { month: 'Apr', actual: 110, forecast: 105, upperBound: 120, lowerBound: 90 },
  { month: 'May', actual: 90, forecast: 85, upperBound: 100, lowerBound: 70 },
  { month: 'Jun', actual: 75, forecast: 70, upperBound: 85, lowerBound: 55 },
  { month: 'Jul', actual: null, forecast: 65, upperBound: 80, lowerBound: 50 },
  { month: 'Aug', actual: null, forecast: 75, upperBound: 90, lowerBound: 60 },
  { month: 'Sep', actual: null, forecast: 90, upperBound: 105, lowerBound: 75 },
  { month: 'Oct', actual: null, forecast: 100, upperBound: 115, lowerBound: 85 },
  { month: 'Nov', actual: null, forecast: 80, upperBound: 95, lowerBound: 65 },
  { month: 'Dec', actual: null, forecast: 95, upperBound: 110, lowerBound: 80 }
];

export default function InventoryAnalyticsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedItem, setSelectedItem] = useState('all');
  const [forecastPeriod, setForecastPeriod] = useState('months6');
  const [forecastLoading, setForecastLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    console.log("Analytics page mounted");
  }, []);

  // Function to generate AI recommendations
  const generateRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      // Initialize the Gemini API
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Prepare context for LLM
      const prompt = `
      You are an AI inventory management assistant for a pharmacy. Based on the following inventory data:
      
      - Total Items: 567
      - Average Turnover Rate: 3.2x
      - Stockout Incidents: 42
      - Top selling items: Lisinopril 10mg, Metformin 500mg, Atorvastatin 40mg
      - Categories with highest stock: Cardiovascular (35%), Diabetes (20%)
      - Items with low stock: 25% of inventory
      - Items out of stock: 10% of inventory
      
      Provide 4 specific, actionable recommendations to optimize inventory management. 
      Format each recommendation with a title, detailed description, impact level (high/medium/low), 
      and category (Restocking, Inventory Parameters, Expiry Management, Portfolio Optimization).
      
      Return the response as a JSON array.
      `;

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON from response
      try {
        const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || '';
        const newRecommendations = JSON.parse(jsonStr);
        setRecommendations(newRecommendations);
      } catch (err) {
        console.error("Failed to parse AI recommendations:", err);
        // Fall back to mock data if parsing fails
        setRecommendations(mockRecommendations);
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      // Fall back to mock data on error
      setRecommendations(mockRecommendations);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Generate forecast for a specific item
  const generateForecast = async () => {
    setForecastLoading(true);
    // In a real implementation, this would call an API with actual forecasting logic
    // For now, we'll just simulate a delay and use the mock data
    setTimeout(() => {
      setForecastLoading(false);
    }, 1500);
  };

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
              <TabsList className="w-full grid grid-cols-4">
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
                      <div style={{ width: '100%', height: '300px' }}>
                        {isClient && <ChartComponents.LineChart 
                          data={stockTrendsData} 
                          xAxisKey="month"
                          lines={[
                            { dataKey: "stock", color: "#8884d8", name: "Actual Stock" },
                            { dataKey: "forecast", color: "#82ca9d", name: "Forecasted Stock", dash: true }
                          ]}
                        />}
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
                      <div style={{ width: '100%', height: '300px' }}>
                        {isClient && <ChartComponents.BarChart 
                          data={topSellingItems} 
                          layout="vertical"
                          xAxisKey="name"
                          barKey="value"
                          barName="Units Sold"
                        />}
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
                      <div style={{ width: '100%', height: '300px' }}>
                        {isClient && <ChartComponents.PieChart 
                          data={categoryDistributionData} 
                          nameKey="name"
                          valueKey="value"
                          colors={COLORS}
                        />}
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
                      <div style={{ width: '100%', height: '300px' }}>
                        {isClient && <ChartComponents.PieChart 
                          data={stockStatusData} 
                          nameKey="name"
                          valueKey="value"
                          colors={STATUS_COLORS}
                        />}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Enhanced Demand Forecast Tab */}
              <TabsContent value="forecast" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Powered Demand Forecast</CardTitle>
                    <CardDescription>
                      Predictive analysis for inventory demand with confidence intervals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Product:</span>
                        <Select 
                          value={selectedItem} 
                          onValueChange={setSelectedItem}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            <SelectItem value="lisinopril">Lisinopril 10mg</SelectItem>
                            <SelectItem value="metformin">Metformin 500mg</SelectItem>
                            <SelectItem value="atorvastatin">Atorvastatin 40mg</SelectItem>
                            <SelectItem value="omeprazole">Omeprazole 20mg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Forecast Period:</span>
                        <Select 
                          value={forecastPeriod} 
                          onValueChange={setForecastPeriod}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="months3">Next 3 Months</SelectItem>
                            <SelectItem value="months6">Next 6 Months</SelectItem>
                            <SelectItem value="months12">Next 12 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={generateForecast}
                        disabled={forecastLoading}
                      >
                        {forecastLoading ? "Generating..." : "Generate Forecast"}
                      </Button>
                    </div>
                    
                    <div style={{ width: '100%', height: '400px' }} className="bg-slate-50 p-2 rounded-md">
                      {isClient && <ChartComponents.ForecastChart data={forecastData} />}
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Forecast Insights</h3>
                      <p className="text-sm text-muted-foreground">
                        Based on historical sales patterns, seasonal trends, and market factors, 
                        we predict a 12% increase in demand for cardiovascular medications in Q3, 
                        with a potential 15-20% spike in September. Consider adjusting inventory 
                        levels accordingly to prevent stockouts while minimizing carrying costs.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>AI-Generated Inventory Recommendations</CardTitle>
                        <CardDescription>
                          Smart suggestions to optimize your inventory management
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={generateRecommendations}
                        disabled={loadingRecommendations}
                      >
                        {loadingRecommendations ? "Generating..." : "Refresh Recommendations"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{rec.title}</h3>
                            <Badge 
                              variant={
                                rec.impact === 'high' ? 'destructive' : 
                                rec.impact === 'medium' ? 'default' : 'outline'
                              }
                            >
                              {rec.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {rec.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{rec.category}</Badge>
                            <Button variant="outline" size="sm">Apply Recommendation</Button>
                          </div>
                        </div>
                      ))}
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