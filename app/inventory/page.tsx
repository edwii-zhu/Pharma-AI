'use client';

import { useState, useEffect } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  BarChart4,
  TrendingUp,
  FileWarning,
  Activity
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

// Define the inventory item interface based on the database schema
interface Medication {
  id: string;
  name: string;
  ndc: string;
  manufacturer: string;
  dosage_form: string;
  strength: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  created_at: string;
  updated_at: string;
  medication_id: string;
  quantity: number;
  batch_number: string | null;
  expiration_date: string;
  cost_price: number;
  selling_price: number;
  supplier_id: string | null;
  reorder_level: number;
  location: string | null;
  medications: Medication;
  suppliers?: Supplier;
}

interface FormattedInventoryItem {
  id: string;
  ndcCode: string;
  name: string;
  manufacturer: string;
  stockQuantity: number;
  reorderPoint: number;
  unitPrice: number;
  costPrice: number;
  category: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
  expirationDate: string;
  batchNumber: string | null;
  location: string | null;
  medication_id: string;
  supplier_id: string | null;
}

// Determine badge color based on stock status
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'In Stock':
      return 'success';
    case 'Low Stock':
      return 'warning';
    case 'Out of Stock':
      return 'destructive';
    default:
      return 'default';
  }
};

// Function to determine stock status
const getStockStatus = (quantity: number, reorderLevel: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
};

export default function InventoryPage() {
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<FormattedInventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<FormattedInventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("inventory");

  // Fetch inventory data from Supabase
  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('inventory')
          .select(`
            *,
            medications (
              id, name, ndc, manufacturer, dosage_form, strength
            ),
            suppliers (id, name)
          `)
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Extract unique medication categories for filtering
          const allCategories = Array.from(new Set(data.map((item: any) => 
            item.medications.dosage_form || 'Unknown'
          )));
          setCategories(allCategories);

          // Format data for the UI
          const formattedItems = data.map((item: InventoryItem) => {
            const stockStatus = getStockStatus(item.quantity, item.reorder_level);
            return {
              id: item.id,
              ndcCode: item.medications.ndc,
              name: `${item.medications.name} ${item.medications.strength}`,
              manufacturer: item.medications.manufacturer || 'Unknown',
              stockQuantity: item.quantity,
              reorderPoint: item.reorder_level,
              unitPrice: item.selling_price,
              costPrice: item.cost_price,
              category: item.medications.dosage_form || 'Unknown',
              status: stockStatus,
              lastUpdated: new Date(item.updated_at).toLocaleDateString(),
              expirationDate: new Date(item.expiration_date).toLocaleDateString(),
              batchNumber: item.batch_number,
              location: item.location,
              medication_id: item.medication_id,
              supplier_id: item.supplier_id
            };
          });
          
          setInventoryItems(formattedItems);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load inventory items');
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  // Filter inventory items based on search term and filters
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.ndcCode.includes(searchTerm) ||
                          item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handler for adding/editing an item
  const handleSaveItem = async (item: FormattedInventoryItem) => {
    try {
      setLoading(true);
      
      if (currentItem) {
        // Edit existing item
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity: item.stockQuantity,
            reorder_level: item.reorderPoint,
            cost_price: item.costPrice,
            selling_price: item.unitPrice,
            location: item.location,
            batch_number: item.batchNumber,
            expiration_date: new Date(item.expirationDate).toISOString(),
            supplier_id: item.supplier_id
          })
          .eq('id', item.id);
          
        if (error) throw error;
        
        // Update local state
        setInventoryItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          stockQuantity: item.stockQuantity,
          reorderPoint: item.reorderPoint,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          location: item.location,
          batchNumber: item.batchNumber,
          expirationDate: item.expirationDate,
          status: getStockStatus(item.stockQuantity, item.reorderPoint),
          lastUpdated: new Date().toLocaleDateString()
        } : i));
      } else {
        // This is simplified - in a real app you'd need to handle creating new inventory items
        // which would require selecting a medication and supplier
        alert("Adding new items requires selecting medication and supplier. Please use the full interface.");
      }
    } catch (err) {
      console.error('Error saving inventory item:', err);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
      setOpenDialog(false);
      setCurrentItem(null);
    }
  };

  // Handler for deleting an item
  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Update local state
        setInventoryItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('Error deleting inventory item:', err);
        alert('Failed to delete item');
      } finally {
        setLoading(false);
      }
    }
  };

  // Calculate overview data from inventory
  const getOverviewData = () => {
    const totalItems = inventoryItems.length;
    const lowStockCount = inventoryItems.filter(item => item.status === 'Low Stock').length;
    const outOfStockCount = inventoryItems.filter(item => item.status === 'Out of Stock').length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.unitPrice * item.stockQuantity), 0);
    
    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalValue: totalValue.toFixed(2)
    };
  };

  // Prepare chart data
  const getCategoryChartData = () => {
    const categoryMap = new Map();
    
    inventoryItems.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, 0);
      }
      categoryMap.set(item.category, categoryMap.get(item.category) + item.stockQuantity);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const getStatusChartData = () => {
    const counts = {
      'In Stock': inventoryItems.filter(item => item.status === 'In Stock').length,
      'Low Stock': inventoryItems.filter(item => item.status === 'Low Stock').length,
      'Out of Stock': inventoryItems.filter(item => item.status === 'Out of Stock').length
    };
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getTopItemsData = () => {
    return [...inventoryItems]
      .sort((a, b) => b.stockQuantity - a.stockQuantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        value: item.stockQuantity
      }));
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B6B'];
  const STATUS_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  // Render the UI
  const { totalItems, lowStockCount, outOfStockCount, totalValue } = getOverviewData();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <MainNav />
      <div className="flex-1">
        <div className="container px-4 py-6 md:px-6">
          <div className="grid gap-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Inventory Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your pharmacy inventory, track stock levels, and monitor expiry dates
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/inventory/batch')}
                >
                  <FileWarning className="h-4 w-4" />
                  Batch Management
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/inventory/analytics')}
                >
                  <Activity className="h-4 w-4" />
                  Advanced Analytics
                </Button>
              </div>
            </div>

            {/* Add tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inventory">Inventory List</TabsTrigger>
                <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
                <TabsTrigger value="forecasting">AI Insights</TabsTrigger>
              </TabsList>

              {/* Inventory List Tab */}
              <TabsContent value="inventory" className="space-y-4">
                {/* Existing inventory management UI */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex w-full max-w-sm items-center gap-1.5">
                    <Search className="absolute ml-2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search by name, NDC, or manufacturer..." 
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-1.5">
                      <Select 
                        value={categoryFilter}
                        onValueChange={setCategoryFilter}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Select 
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="Low Stock">Low Stock</SelectItem>
                          <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      className="flex items-center gap-2" 
                      onClick={() => {
                        setCurrentItem(null);
                        setOpenDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* Existing table code */}
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredItems.length === 0 ? (
                      <div className="text-center p-4 text-muted-foreground">
                        No matching inventory items found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>NDC</TableHead>
                              <TableHead>Manufacturer</TableHead>
                              <TableHead className="text-right">Stock</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Updated</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.ndcCode}</TableCell>
                                <TableCell>{item.manufacturer}</TableCell>
                                <TableCell className="text-right">
                                  {item.stockQuantity} 
                                  {item.stockQuantity <= item.reorderPoint && (
                                    <span className="ml-1 text-xs text-yellow-500" title="Below reorder point">
                                      (Min: {item.reorderPoint})
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(item.status) as any}>{item.status}</Badge>
                                </TableCell>
                                <TableCell>{item.lastUpdated}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setCurrentItem(item);
                                        setOpenDialog(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Visualizations Tab */}
              <TabsContent value="visualizations" className="space-y-4">
                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalItems}</div>
                      <p className="text-xs text-muted-foreground">
                        Across {categories.length} categories
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Low Stock Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-500">{lowStockCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((lowStockCount / totalItems) * 100)}% of inventory
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Out of Stock Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">{outOfStockCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((outOfStockCount / totalItems) * 100)}% of inventory
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Inventory Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${totalValue}</div>
                      <p className="text-xs text-muted-foreground">
                        Based on current unit prices
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Status Distribution</CardTitle>
                      <CardDescription>
                        Overview of inventory status levels
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getStatusChartData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getStatusChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Category Distribution</CardTitle>
                      <CardDescription>
                        Inventory by medication category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getCategoryChartData()}
                            layout="vertical"
                            margin={{
                              top: 5,
                              right: 30,
                              left: 80,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Quantity" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Items Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Items by Quantity</CardTitle>
                    <CardDescription>
                      Highest inventory quantities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getTopItemsData()}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 60,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#82ca9d" name="Quantity">
                            {getTopItemsData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="forecasting" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Generated Insights</CardTitle>
                    <CardDescription>
                      Smart insights powered by advanced analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-800">Low Stock Alert</h3>
                          <p className="text-sm text-amber-700">
                            {lowStockCount} items are below their reorder points. Consider restocking soon to avoid stockouts.
                          </p>
                          <Button size="sm" variant="outline" className="mt-2">View Items</Button>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Top Restocking Priorities</h3>
                      <ul className="space-y-2">
                        {inventoryItems
                          .filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock')
                          .sort((a, b) => {
                            // Out of stock takes priority
                            if (a.status === 'Out of Stock' && b.status !== 'Out of Stock') return -1;
                            if (a.status !== 'Out of Stock' && b.status === 'Out of Stock') return 1;
                            // Then sort by how close they are to reorder point (as a percentage)
                            const aRatio = a.stockQuantity / a.reorderPoint;
                            const bRatio = b.stockQuantity / b.reorderPoint;
                            return aRatio - bRatio;
                          })
                          .slice(0, 5)
                          .map(item => (
                            <li key={item.id} className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <Badge 
                                  variant={item.status === 'Out of Stock' ? 'destructive' : 'outline'} 
                                  className="ml-2"
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Current: </span>
                                <span className="font-medium">{item.stockQuantity}</span>
                                <span className="text-muted-foreground ml-2">Target: </span>
                                <span className="font-medium">{item.reorderPoint * 2}</span>
                              </div>
                            </li>
                          ))
                        }
                      </ul>
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => router.push('/inventory/analytics')}
                      >
                        View Full AI Recommendations
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Demand Forecast Summary</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Based on historical data and seasonal patterns, here are key predictions for the next 30 days:
                      </p>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">Expected Sales Growth</p>
                            <p className="text-lg font-bold text-green-600">+8.5%</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">High Demand Categories</p>
                            <p className="text-sm font-medium">Cardiovascular, Antibiotics</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">At Risk of Stockout</p>
                            <p className="text-lg font-bold text-amber-600">12 items</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">Forecast Confidence</p>
                            <p className="text-lg font-bold">93%</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4"
                        onClick={() => router.push('/inventory/analytics')}
                      >
                        View Detailed Forecast
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Dialog for adding/editing inventory items */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentItem ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
                  <DialogDescription>
                    {currentItem 
                      ? "Update the inventory item details below."
                      : "Fill in the details to add a new inventory item."}
                  </DialogDescription>
                </DialogHeader>
                {currentItem && (
                  <InventoryItemForm 
                    item={currentItem} 
                    onSave={handleSaveItem}
                    onCancel={() => setOpenDialog(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form component for adding/editing inventory items
interface InventoryItemFormProps {
  item: FormattedInventoryItem | null;
  onSave: (item: FormattedInventoryItem) => void;
  onCancel: () => void;
}

function InventoryItemForm({ item, onSave, onCancel }: InventoryItemFormProps) {
  const [formData, setFormData] = useState<FormattedInventoryItem>(
    item || {
      id: '',
      ndcCode: '',
      name: '',
      manufacturer: '',
      stockQuantity: 0,
      reorderPoint: 10,
      unitPrice: 0,
      costPrice: 0,
      category: '',
      status: 'Out of Stock',
      lastUpdated: new Date().toLocaleDateString(),
      expirationDate: new Date().toLocaleDateString(),
      batchNumber: '',
      location: '',
      medication_id: '',
      supplier_id: null
    }
  );

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to actual numbers
    const processedValue = type === 'number' ? 
      name === 'unitPrice' || name === 'costPrice' ? parseFloat(value) : parseInt(value, 10) 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate status based on quantity and reorder point
    const status = formData.stockQuantity === 0 
      ? 'Out of Stock' 
      : formData.stockQuantity <= formData.reorderPoint 
        ? 'Low Stock' 
        : 'In Stock';
    
    // Pass updated form data to parent component
    onSave({
      ...formData,
      status
    });
  };

  // Render form
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {item && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Product
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              disabled={true}
              className="col-span-3"
            />
          </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="stockQuantity" className="text-right">
            Quantity
          </Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="reorderPoint" className="text-right">
            Reorder Point
          </Label>
          <Input
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            min="0"
            value={formData.reorderPoint}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="costPrice" className="text-right">
            Cost Price ($)
          </Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.costPrice}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="unitPrice" className="text-right">
            Selling Price ($)
          </Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.unitPrice}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="batchNumber" className="text-right">
            Batch Number
          </Label>
          <Input
            id="batchNumber"
            name="batchNumber"
            value={formData.batchNumber || ''}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="expirationDate" className="text-right">
            Expiration Date
          </Label>
          <Input
            id="expirationDate"
            name="expirationDate"
            type="date"
            value={formData.expirationDate}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="location" className="text-right">
            Location
          </Label>
          <Input
            id="location"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
} 