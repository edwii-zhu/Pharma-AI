'use client';

import { useState } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Truck, FileText, AlertTriangle, BarcodeIcon, PackagePlus, Plus, Trash, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// Mock interfaces
interface InventoryItem {
  id: string;
  ndcCode: string;
  name: string;
  manufacturer: string;
  category: string;
}

interface BatchItem {
  itemId: string;
  ndcCode: string;
  name: string;
  quantity: number;
  lotNumber: string;
  expirationDate: string;
  unitCost: number;
}

interface Supplier {
  id: string;
  name: string;
}

// Mock data
const mockInventoryItems: InventoryItem[] = [
  { id: "1", ndcCode: "0002-3232-30", name: "Lisinopril 10mg", manufacturer: "Lupin Pharmaceuticals", category: "Cardiovascular" },
  { id: "2", ndcCode: "0069-2700-30", name: "Metformin 500mg", manufacturer: "Bristol-Myers Squibb", category: "Diabetes" },
  { id: "3", ndcCode: "0378-3225-05", name: "Simvastatin 20mg", manufacturer: "Mylan", category: "Cardiovascular" },
  { id: "4", ndcCode: "0093-5260-01", name: "Omeprazole 20mg", manufacturer: "Teva", category: "Gastrointestinal" },
  { id: "5", ndcCode: "0781-5180-31", name: "Atorvastatin 40mg", manufacturer: "Sandoz", category: "Cardiovascular" },
  { id: "6", ndcCode: "0069-0242-30", name: "Amoxicillin 500mg", manufacturer: "Pfizer", category: "Antibiotics" },
];

const mockSuppliers: Supplier[] = [
  { id: "1", name: "Cardinal Health" },
  { id: "2", name: "McKesson" },
  { id: "3", name: "AmerisourceBergen" },
  { id: "4", name: "Morris & Dickson" },
  { id: "5", name: "HD Smith" },
];

// Recent batch records
const recentBatches = [
  { id: "B001", type: "Shipment Received", supplier: "Cardinal Health", date: "2024-04-01", items: 12, value: 4250.00 },
  { id: "B002", type: "Inventory Adjustment", supplier: "N/A", date: "2024-04-02", items: 3, value: -215.00 },
  { id: "B003", type: "Shipment Received", supplier: "McKesson", date: "2024-04-04", items: 8, value: 1820.00 },
];

export default function BatchInventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("receive");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [lotNumber, setLotNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [autoIncrementId, setAutoIncrementId] = useState(1);
  const [isBarcodeMode, setIsBarcodeMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  const handleAddItem = () => {
    if (!selectedItem || !lotNumber || !expirationDate || !quantity) return;
    
    const selectedInventoryItem = mockInventoryItems.find(item => item.id === selectedItem);
    if (!selectedInventoryItem) return;

    const newItem: BatchItem = {
      itemId: autoIncrementId.toString(),
      ndcCode: selectedInventoryItem.ndcCode,
      name: selectedInventoryItem.name,
      quantity: parseInt(quantity),
      lotNumber,
      expirationDate,
      unitCost: parseFloat(unitCost) || 0
    };

    setBatchItems([...batchItems, newItem]);
    setAutoIncrementId(autoIncrementId + 1);
    
    // Reset form
    setSelectedItem(null);
    setLotNumber("");
    setExpirationDate("");
    setQuantity("");
    setUnitCost("");
  };

  const handleRemoveItem = (itemId: string) => {
    setBatchItems(batchItems.filter(item => item.itemId !== itemId));
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // In a real application, this would lookup the item based on the scanned barcode
      // For this demo, we'll just simulate finding a match
      const matchedItem = mockInventoryItems.find(item => item.ndcCode.includes(barcodeInput.substring(0, 5)));
      
      if (matchedItem) {
        setSelectedItem(matchedItem.id);
        // In a real system, you might also extract lot number, expiration date, etc. from barcode
        setLotNumber(`LOT-${Math.floor(Math.random() * 10000)}`);
        
        // Set expiration date to 2 years from now
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 2);
        setExpirationDate(format(expirationDate, 'yyyy-MM-dd'));
        
        setQuantity("1");
        setBarcodeInput("");
        
        // Focus back on the barcode input for continuous scanning
        const barcodeInputEl = document.getElementById('barcode-input');
        if (barcodeInputEl) (barcodeInputEl as HTMLInputElement).focus();
      } else {
        alert("Item not found. Please try again or enter manually.");
        setBarcodeInput("");
      }
    }
  };

  const calculateTotalValue = () => {
    return batchItems.reduce((total, item) => total + (item.quantity * item.unitCost), 0);
  };

  const handleSubmitBatch = () => {
    if (batchItems.length === 0) {
      alert("Please add at least one item to the batch");
      return;
    }
    
    // In a real application, this would submit the batch data to an API
    alert(`Batch ${activeTab === "receive" ? "received" : "adjusted"} successfully!`);
    
    // Reset form
    setBatchItems([]);
    setSupplier("");
    setInvoiceNumber("");
    setNotes("");
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
                <h1 className="text-3xl font-bold">Batch Inventory Operations</h1>
                <p className="text-muted-foreground">
                  Process inventory in batches: receive shipments or make adjustments
                </p>
              </div>
            </div>

            <Tabs 
              defaultValue="receive" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList>
                <TabsTrigger value="receive" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span>Receive Shipment</span>
                </TabsTrigger>
                <TabsTrigger value="adjust" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Inventory Adjustment</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Recent Batches</span>
                </TabsTrigger>
              </TabsList>

              {/* Receive Shipment Tab */}
              <TabsContent value="receive" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Shipment Details Card */}
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Shipment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Select value={supplier} onValueChange={setSupplier}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSuppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoice-number">Invoice Number</Label>
                        <Input 
                          id="invoice-number" 
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea 
                          id="notes" 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="barcode-mode" 
                          checked={isBarcodeMode}
                          onCheckedChange={setIsBarcodeMode}
                        />
                        <Label htmlFor="barcode-mode" className="flex items-center gap-2">
                          <BarcodeIcon className="h-4 w-4" />
                          Barcode Scan Mode
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Item Entry */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Add Items</CardTitle>
                      <CardDescription>
                        {isBarcodeMode 
                          ? "Scan product barcode to add items quickly" 
                          : "Add items to the shipment manually"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isBarcodeMode ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="barcode-input">Scan Barcode</Label>
                            <Input 
                              id="barcode-input" 
                              value={barcodeInput}
                              onChange={(e) => setBarcodeInput(e.target.value)}
                              onKeyDown={handleBarcodeScan}
                              placeholder="Scan or type barcode and press Enter"
                              autoFocus
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Items will be added automatically when barcode is scanned
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="medication">Medication</Label>
                              <Select value={selectedItem || ""} onValueChange={setSelectedItem}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select medication" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockInventoryItems.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lot-number">Lot Number</Label>
                              <Input 
                                id="lot-number" 
                                value={lotNumber}
                                onChange={(e) => setLotNumber(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="expiration-date">Expiration Date</Label>
                              <Input 
                                id="expiration-date" 
                                type="date"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity</Label>
                              <Input 
                                id="quantity" 
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                              <Input 
                                id="unit-cost" 
                                type="number"
                                step="0.01"
                                min="0"
                                value={unitCost}
                                onChange={(e) => setUnitCost(e.target.value)}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button 
                                onClick={handleAddItem}
                                className="w-full flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Add Item
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Batch Items Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipment Contents</CardTitle>
                    <CardDescription>
                      {batchItems.length} items | Total Value: ${calculateTotalValue().toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NDC Code</TableHead>
                          <TableHead>Medication</TableHead>
                          <TableHead>Lot Number</TableHead>
                          <TableHead>Expiration</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchItems.length > 0 ? (
                          batchItems.map(item => (
                            <TableRow key={item.itemId}>
                              <TableCell>{item.ndcCode}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.lotNumber}</TableCell>
                              <TableCell>{item.expirationDate}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.itemId)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <PackagePlus className="h-8 w-8" />
                                <p>No items added to this shipment yet</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setBatchItems([]);
                        setSupplier("");
                        setInvoiceNumber("");
                        setNotes("");
                      }}
                    >
                      Clear All
                    </Button>
                    <Button 
                      onClick={handleSubmitBatch}
                      disabled={batchItems.length === 0}
                    >
                      Process Shipment
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Inventory Adjustment Tab */}
              <TabsContent value="adjust" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Adjustment Details Card */}
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Adjustment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="adjustment-type">Adjustment Type</Label>
                        <Select defaultValue="count">
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="count">Physical Count</SelectItem>
                            <SelectItem value="damage">Damage/Loss</SelectItem>
                            <SelectItem value="expiration">Expiration</SelectItem>
                            <SelectItem value="return">Return to Supplier</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reference-number">Reference Number</Label>
                        <Input id="reference-number" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustment-notes">Reason for Adjustment</Label>
                        <Textarea 
                          id="adjustment-notes" 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          placeholder="Explain why this adjustment is needed..."
                        />
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Inventory adjustments require a valid reason and may be audited.</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Item Entry */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Add Items for Adjustment</CardTitle>
                      <CardDescription>
                        Specify quantities to adjust (use negative values for decreases)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="adjustment-medication">Medication</Label>
                            <Select value={selectedItem || ""} onValueChange={setSelectedItem}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medication" />
                              </SelectTrigger>
                              <SelectContent>
                                {mockInventoryItems.map(item => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="adjustment-lot-number">Lot Number</Label>
                            <Input 
                              id="adjustment-lot-number" 
                              value={lotNumber}
                              onChange={(e) => setLotNumber(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="adjustment-quantity">Quantity Adjustment</Label>
                            <Input 
                              id="adjustment-quantity" 
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="Use negative for decreases"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button 
                              onClick={handleAddItem}
                              className="w-full flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Item
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Batch Items Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Items to Adjust</CardTitle>
                    <CardDescription>
                      {batchItems.length} items included in this adjustment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NDC Code</TableHead>
                          <TableHead>Medication</TableHead>
                          <TableHead>Lot Number</TableHead>
                          <TableHead className="text-right">Quantity Adjustment</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchItems.length > 0 ? (
                          batchItems.map(item => (
                            <TableRow key={item.itemId}>
                              <TableCell>{item.ndcCode}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.lotNumber}</TableCell>
                              <TableCell className="text-right">
                                <span className={`${parseInt(quantity) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                  {parseInt(quantity) > 0 ? '+' : ''}{item.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.itemId)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <FileText className="h-8 w-8" />
                                <p>No items added to this adjustment yet</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setBatchItems([]);
                        setNotes("");
                      }}
                    >
                      Clear All
                    </Button>
                    <Button 
                      onClick={handleSubmitBatch}
                      disabled={batchItems.length === 0}
                    >
                      Process Adjustment
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Recent Batches Tab */}
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Batch Operations</CardTitle>
                    <CardDescription>
                      View recent shipments and inventory adjustments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Supplier/Reference</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentBatches.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell className="font-medium">{batch.id}</TableCell>
                            <TableCell>
                              {batch.type === "Shipment Received" ? (
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4" />
                                  <span>{batch.type}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span>{batch.type}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{batch.date}</TableCell>
                            <TableCell>{batch.supplier}</TableCell>
                            <TableCell className="text-right">{batch.items}</TableCell>
                            <TableCell className="text-right">
                              <span className={batch.value < 0 ? 'text-red-500' : ''}>
                                ${Math.abs(batch.value).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                Completed
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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