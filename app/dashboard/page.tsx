'use client';

import { useState, useEffect } from "react";
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pill, Stethoscope, Package, Activity, DollarSign, AlertTriangle, Clock, ShieldAlert, CalendarClock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Types for the dashboard data
interface PendingPrescription {
  id: string;
  status: string;
  patients: {
    first_name: string;
    last_name: string;
  };
  medications: {
    name: string;
    strength: string;
  };
}

interface LowStockItem {
  id: string;
  quantity: number;
  reorder_level: number;
  medications: {
    name: string;
    strength: string;
  };
}

interface Alert {
  id: string;
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
  related_id: string;
}

interface ExpiringItem {
  id: string;
  batch_number: string;
  expiration_date: string;
  medications: {
    name: string;
    dosage_form: string;
    strength: string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    inventoryItemsCount: 0,
    lowStockCount: 0,
    activePatients: 0,
  });
  const [pendingPrescriptions, setPendingPrescriptions] = useState<PendingPrescription[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log("🔄 Dashboard - Fetching data...");
        
        // Fetch total prescriptions
        const { count: prescriptionCount, error: prescriptionError } = await supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true });
        
        if (prescriptionError) {
          console.error("❌ Error fetching prescriptions:", prescriptionError);
          throw prescriptionError;
        }
        console.log("✅ Fetched prescription count:", prescriptionCount);
        
        // Fetch inventory stats
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('id, quantity, reorder_level');
        
        if (inventoryError) {
          console.error("❌ Error fetching inventory:", inventoryError);
          throw inventoryError;
        }
        
        if (!inventoryData) {
          console.error("❌ No inventory data returned");
          throw new Error("No inventory data returned");
        }
        
        console.log("✅ Fetched inventory data:", inventoryData.length, "items");
        
        // Fetch patient count
        const { count: patientCount, error: patientError } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        
        if (patientError) {
          console.error("❌ Error fetching patients:", patientError);
          throw patientError;
        }
        console.log("✅ Fetched patient count:", patientCount);
        
        // Fetch pending prescriptions
        const { data: pendingRx, error: pendingRxError } = await supabase
          .from('prescriptions')
          .select(`
            id,
            status,
            patients:patient_id(first_name, last_name),
            medications:medication_id(name, strength)
          `)
          .eq('status', 'pending')
          .limit(5);
          
        if (pendingRxError) {
          console.error("❌ Error fetching pending prescriptions:", pendingRxError);
          throw pendingRxError;
        }
        console.log("✅ Fetched pending prescriptions:", pendingRx?.length || 0);
        setPendingPrescriptions(pendingRx ? (pendingRx as unknown as PendingPrescription[]) : []);
        
        // Fetch detailed low stock items
        let filteredLowStock = [];
        try {
          console.log("🔄 Fetching inventory for low stock calculation...");
          const { data: inventoryForLowStock, error: inventoryError } = await supabase
            .from('inventory')
            .select(`
              id,
              quantity,
              reorder_level,
              medications:medication_id(name, strength)
            `)
            .limit(100);
            
          if (inventoryError) {
            console.error("❌ Error fetching inventory for low stock:", inventoryError);
            throw inventoryError;
          }
            
          // Filter in JavaScript
          filteredLowStock = inventoryForLowStock ? 
            inventoryForLowStock.filter(item => {
              // Convert to numbers to ensure proper comparison
              const quantity = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
              const reorderLevel = typeof item.reorder_level === 'number' ? item.reorder_level : Number(item.reorder_level);
              return quantity <= reorderLevel;
            }) : 
            [];
              
          console.log("✅ Found low stock items:", filteredLowStock.length);
          setLowStockItems(filteredLowStock.slice(0, 5) as unknown as LowStockItem[]);
        } catch (lowStockErr) {
          console.error("❌ Error in low stock fetch process:", lowStockErr);
          // Set empty array to avoid breaking the dashboard
          setLowStockItems([]);
        }
        
        // Fetch alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .eq('is_read', false)
          .order('priority', { ascending: false })
          .limit(5);
          
        if (alertsError) {
          console.error("❌ Error fetching alerts:", alertsError);
          throw alertsError;
        }
        console.log("✅ Fetched alerts:", alertsData?.length || 0);
        setAlerts(alertsData ? (alertsData as unknown as Alert[]) : []);
        
        // Fetch expiring inventory
        const { data: expiringData, error: expiringError } = await supabase
          .from('inventory')
          .select(`
            id,
            batch_number,
            expiration_date,
            medications:medication_id(name, dosage_form, strength)
          `)
          .lt('expiration_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .gt('expiration_date', new Date().toISOString().split('T')[0])
          .order('expiration_date', { ascending: true })
          .limit(5);
          
        if (expiringError) {
          console.error("❌ Error fetching expiring inventory:", expiringError);
          throw expiringError;
        }
        console.log("✅ Fetched expiring inventory:", expiringData?.length || 0);
        setExpiringItems(expiringData ? (expiringData as unknown as ExpiringItem[]) : []);
        
        // Update state with all fetched data
        setStats({
          totalPrescriptions: prescriptionCount || 0,
          inventoryItemsCount: inventoryData.length,
          lowStockCount: filteredLowStock.length,
          activePatients: patientCount || 0,
        });
        
        console.log("✅ Dashboard data fetched successfully");
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
        let errorMessage = "Failed to load dashboard data";
        
        if (err instanceof Error) {
          errorMessage += `: ${err.message}`;
        } else if (typeof err === 'object' && err !== null) {
          try {
            errorMessage += `: ${JSON.stringify(err)}`;
          } catch {
            errorMessage += " (Unable to stringify error object)";
          }
        } else {
          errorMessage += `: ${String(err)}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  function formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
  
  function daysUntil(dateString: string): number {
    if (!dateString) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(dateString);
    const diffTime = futureDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg max-w-2xl">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Dashboard Error</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>
              Go Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
                <p className="text-muted-foreground">
                  Your pharmacy at a glance
                </p>
              </div>
              <div className="flex items-center space-x-2">
                
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Prescriptions
                  </CardTitle>
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.totalPrescriptions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {loading ? 'Please wait...' : 'Processed through our system'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Inventory Items
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.inventoryItemsCount.toLocaleString()}</div>
                  <div className="flex items-center space-x-1 text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{loading ? 'Please wait...' : `${stats.lowStockCount} items below reorder point`}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Patients
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? 'Loading...' : stats.activePatients.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {loading ? 'Please wait...' : 'Registered in our system'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Alerts
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? 'Loading...' : alerts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {loading ? 'Please wait...' : 'Active alerts requiring attention'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Pending Prescriptions
                  </CardTitle>
                  <CardDescription>
                    Prescriptions awaiting verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading pending prescriptions...</div>
                  ) : pendingPrescriptions.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No pending prescriptions</div>
                  ) : (
                    <div className="space-y-4">
                      {pendingPrescriptions.map((rx) => (
                        <div key={rx.id} className="flex items-center justify-between border-b pb-2">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {rx.patients ? `${rx.patients.first_name} ${rx.patients.last_name}` : 'Unknown Patient'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {rx.medications ? `${rx.medications.name} ${rx.medications.strength}` : 'Unknown Medication'}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/prescriptions/${rx.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                      <div className="text-right">
                        <Button variant="link" onClick={() => router.push('/prescriptions')}>
                          View All Prescriptions
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    Alerts
                  </CardTitle>
                  <CardDescription>
                    Important notifications requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading alerts...</div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No active alerts</div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex gap-2 border-b pb-2">
                          <div className={`
                            h-2 w-2 mt-2 rounded-full flex-shrink-0
                            ${alert.priority === 'high' ? 'bg-red-500' : 
                              alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}
                          `} />
                          <div className="space-y-1 flex-grow">
                            <p className="text-sm">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} alert
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="text-right">
                        <Button variant="link" onClick={() => console.log('View all alerts')}>
                          View All Alerts
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Low Stock Items
                  </CardTitle>
                  <CardDescription>
                    Inventory items below reorder level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading low stock items...</div>
                  ) : lowStockItems.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No low stock items</div>
                  ) : (
                    <div className="space-y-4">
                      {lowStockItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-2">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {item.medications ? `${item.medications.name} ${item.medications.strength}` : 'Unknown Medication'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: <span className="font-medium">{item.quantity}</span> / Reorder Level: {item.reorder_level}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/inventory')}
                          >
                            Order
                          </Button>
                        </div>
                      ))}
                      <div className="text-right">
                        <Button variant="link" onClick={() => router.push('/inventory')}>
                          View All Inventory
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-orange-500" />
                    Expiring Medications
                  </CardTitle>
                  <CardDescription>
                    Inventory items expiring soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading expiring medications...</div>
                  ) : expiringItems.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No medications expiring soon</div>
                  ) : (
                    <div className="space-y-4">
                      {expiringItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-2">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {item.medications ? `${item.medications.name} ${item.medications.strength}` : 'Unknown Medication'}
                            </p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Batch: {item.batch_number}
                              </span>
                              <span className={`
                                font-medium
                                ${daysUntil(item.expiration_date) <= 7 ? 'text-red-500' : 
                                  daysUntil(item.expiration_date) <= 14 ? 'text-orange-500' : 'text-yellow-500'}
                              `}>
                                Expires: {formatDate(item.expiration_date)}
                                ({daysUntil(item.expiration_date)} days)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-right">
                        <Button variant="link" onClick={() => router.push('/inventory')}>
                          View All Inventory
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 