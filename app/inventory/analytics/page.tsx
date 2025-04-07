'use client';

import { useState, useEffect } from 'react';
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Define recommendation interface
interface Recommendation {
  id: number | string;
  title: string;
  description: string;
  impact: string;
  category: string;
}

// Mock data for AI recommendations
const mockRecommendations: Recommendation[] = [
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

export default function InventoryAnalyticsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
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
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
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
        const parsedRecommendations = JSON.parse(jsonStr);
        
        // Ensure each recommendation has a unique id
        const newRecommendations = parsedRecommendations.map((rec: any, index: number) => ({
          ...rec,
          id: rec.id || index + 1 // Use existing id or generate one based on index
        }));
        
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
                  AI-powered inventory analysis and recommendations
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
                    +2.5% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Turnover Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2x</div>
                  <p className="text-xs text-muted-foreground">
                    +0.3x from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Items Low in Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">142</div>
                  <p className="text-xs text-muted-foreground">
                    25% of inventory
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
                  <div className="text-2xl font-bold">42</div>
                  <p className="text-xs text-muted-foreground">
                    -12% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>AI-Powered Recommendations</CardTitle>
                  <Button 
                    onClick={generateRecommendations} 
                    disabled={loadingRecommendations}
                    size="sm"
                  >
                    {loadingRecommendations ? 'Generating...' : 'Refresh'}
                  </Button>
                </div>
                <CardDescription>
                  Smart recommendations to optimize your inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  {recommendations.map((rec: Recommendation, index: number) => (
                    <div key={rec.id || `rec-${index}`} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{rec.title}</h3>
                        <Badge className={
                          rec.impact === 'high' ? 'bg-red-500' : 
                          rec.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }>
                          {rec.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{rec.category}</Badge>
                        <Button variant="ghost" size="sm">Implement</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 