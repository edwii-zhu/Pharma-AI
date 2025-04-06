'use client';

import { useState } from "react";
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

// Mock data for inventory items
interface InventoryItem {
  id: string;
  ndcCode: string;
  name: string;
  manufacturer: string;
  stockQuantity: number;
  reorderPoint: number;
  unitPrice: number;
  category: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

const mockInventoryData: InventoryItem[] = [
  {
    id: "1",
    ndcCode: "0002-3232-30",
    name: "Lisinopril 10mg",
    manufacturer: "Lupin Pharmaceuticals",
    stockQuantity: 250,
    reorderPoint: 50,
    unitPrice: 0.87,
    category: "Cardiovascular",
    status: "In Stock",
    lastUpdated: "2024-04-05T12:00:00Z"
  },
  {
    id: "2",
    ndcCode: "0069-2700-30",
    name: "Metformin 500mg",
    manufacturer: "Bristol-Myers Squibb",
    stockQuantity: 35,
    reorderPoint: 40,
    unitPrice: 0.32,
    category: "Diabetes",
    status: "Low Stock",
    lastUpdated: "2024-04-04T15:30:00Z"
  },
  {
    id: "3",
    ndcCode: "0378-3225-05",
    name: "Simvastatin 20mg",
    manufacturer: "Mylan",
    stockQuantity: 0,
    reorderPoint: 30,
    unitPrice: 0.25,
    category: "Cardiovascular",
    status: "Out of Stock",
    lastUpdated: "2024-04-03T09:45:00Z"
  },
  {
    id: "4",
    ndcCode: "0093-5260-01",
    name: "Omeprazole 20mg",
    manufacturer: "Teva",
    stockQuantity: 125,
    reorderPoint: 40,
    unitPrice: 0.57,
    category: "Gastrointestinal",
    status: "In Stock",
    lastUpdated: "2024-04-02T14:20:00Z"
  },
  {
    id: "5",
    ndcCode: "0781-5180-31",
    name: "Atorvastatin 40mg",
    manufacturer: "Sandoz",
    stockQuantity: 78,
    reorderPoint: 50,
    unitPrice: 0.93,
    category: "Cardiovascular",
    status: "In Stock",
    lastUpdated: "2024-04-01T10:15:00Z"
  }
];

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

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryData);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);

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
  const handleSaveItem = (item: InventoryItem) => {
    if (currentItem) {
      // Edit existing item
      setInventoryItems(prev => prev.map(i => i.id === item.id ? item : i));
    } else {
      // Add new item
      setInventoryItems(prev => [...prev, { ...item, id: (prev.length + 1).toString() }]);
    }
    setOpenDialog(false);
    setCurrentItem(null);
  };

  // Handler for deleting an item
  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setInventoryItems(prev => prev.filter(item => item.id !== id));
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
                <Button variant="outline" className="flex items-center gap-2">
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
                        Fill in the details for the inventory item
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <InventoryItemForm 
                        item={currentItem} 
                        onSave={handleSaveItem} 
                        onCancel={() => {
                          setOpenDialog(false);
                          setCurrentItem(null);
                        }}
                      />
                    </div>
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-10" 
                  placeholder="Search by name, NDC code, or manufacturer..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-row gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                    <SelectItem value="Gastrointestinal">Gastrointestinal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
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
                <CardTitle>Inventory Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NDC Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.ndcCode}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.manufacturer}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">{item.stockQuantity}</TableCell>
                          <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getStatusBadgeVariant(item.status) as any}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => {
                                  setCurrentItem(item);
                                  setOpenDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-8 w-8" />
                            <p>No inventory items found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
  item: InventoryItem | null;
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}

function InventoryItemForm({ item, onSave, onCancel }: InventoryItemFormProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>(
    item || {
      ndcCode: "",
      name: "",
      manufacturer: "",
      stockQuantity: 0,
      reorderPoint: 0,
      unitPrice: 0,
      category: "",
      status: "In Stock",
      lastUpdated: new Date().toISOString()
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "stockQuantity" || name === "reorderPoint" || name === "unitPrice" 
        ? parseFloat(value) 
        : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate status based on stock quantity and reorder point
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    if (formData.stockQuantity === 0) {
      status = 'Out of Stock';
    } else if (formData.stockQuantity && formData.reorderPoint && formData.stockQuantity <= formData.reorderPoint) {
      status = 'Low Stock';
    } else {
      status = 'In Stock';
    }
    
    onSave({
      ...formData,
      id: item?.id || "new",
      stockQuantity: formData.stockQuantity || 0,
      reorderPoint: formData.reorderPoint || 0,
      unitPrice: formData.unitPrice || 0,
      status,
      lastUpdated: new Date().toISOString()
    } as InventoryItem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ndcCode">NDC Code</Label>
          <Input
            id="ndcCode"
            name="ndcCode"
            value={formData.ndcCode}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Medication Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
              <SelectItem value="Diabetes">Diabetes</SelectItem>
              <SelectItem value="Gastrointestinal">Gastrointestinal</SelectItem>
              <SelectItem value="Antibiotics">Antibiotics</SelectItem>
              <SelectItem value="Pain Management">Pain Management</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorderPoint">Reorder Point</Label>
          <Input
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            min="0"
            value={formData.reorderPoint}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price ($)</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.unitPrice}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{item ? "Update Item" : "Add Item"}</Button>
      </DialogFooter>
    </form>
  );
} 