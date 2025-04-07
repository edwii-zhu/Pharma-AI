'use client';

import { useState, useEffect } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart4 
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

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Inventory Management</h1>
                <p className="text-muted-foreground">
                  Manage and track your pharmacy inventory
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => router.push('/inventory/analytics')}
                >
                  <BarChart4 className="h-4 w-4" />
                  Analytics
                </Button>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => setCurrentItem(null)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{currentItem ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
                      <DialogDescription>
                        {currentItem ? "Update the details of this inventory item." : "Enter the details of the new inventory item."}
                      </DialogDescription>
                    </DialogHeader>
                    <InventoryItemForm 
                      item={currentItem} 
                      onSave={handleSaveItem} 
                      onCancel={() => setOpenDialog(false)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryItems.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Low Stock Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">
                    {inventoryItems.filter(item => item.status === "Low Stock").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Out of Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {inventoryItems.filter(item => item.status === "Out of Stock").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Inventory Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${inventoryItems.reduce((sum, item) => sum + (item.stockQuantity * item.unitPrice), 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, NDC, or manufacturer..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-1 sm:flex-none gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Inventory Table */}
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
          </div>
        </div>
      </main>
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