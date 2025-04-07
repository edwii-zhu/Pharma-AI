'use client';

import { useState, useEffect } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface Results {
  [key: string]: any;
}

interface Errors {
  [key: string]: any;
}

export default function DebugPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('Unknown');
  const [results, setResults] = useState<Results>({});
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  async function testSupabaseConnection() {
    setLoading(true);
    setErrors({});
    setResults({});
    
    try {
      console.log('🔍 Testing Supabase connection...');
      setConnectionStatus('Testing...');
      
      // Test a simple query to check connection
      const { data: healthData, error: healthError } = await supabase.from('patients').select('count', { count: 'exact' });
      
      if (healthError) {
        console.error('❌ Connection test failed:', healthError);
        setConnectionStatus('Failed');
        setErrors(prev => ({ ...prev, connection: healthError }));
      } else {
        console.log('✅ Connection successful');
        setConnectionStatus('Connected');
      }
      
      // Run the dashboard queries one by one for debugging
      await fetchPrescriptions();
      await fetchInventory();
      await fetchPatients();
      await fetchPendingPrescriptions();
      await fetchLowStock();
      
    } catch (error) {
      console.error('❌ Error during testing:', error);
      setConnectionStatus('Error');
      setErrors((prev: Errors) => ({ ...prev, general: error }));
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchPrescriptions() {
    try {
      const { count, error } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      setResults((prev: Results) => ({ ...prev, prescriptions: { count } }));
    } catch (error) {
      console.error('❌ Failed to fetch prescriptions:', error);
      setErrors((prev: Errors) => ({ ...prev, prescriptions: error }));
    }
  }
  
  async function fetchInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, quantity, reorder_level, selling_price');
        
      if (error) throw error;
      
      const lowStock = data.filter(item => item.quantity <= item.reorder_level);
      setResults((prev: Results) => ({ 
        ...prev, 
        inventory: { 
          count: data.length,
          lowStockCount: lowStock.length,
          sample: data.slice(0, 2) 
        } 
      }));
    } catch (error) {
      console.error('❌ Failed to fetch inventory:', error);
      setErrors((prev: Errors) => ({ ...prev, inventory: error }));
    }
  }
  
  async function fetchPatients() {
    try {
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      setResults((prev: Results) => ({ ...prev, patients: { count } }));
    } catch (error) {
      console.error('❌ Failed to fetch patients:', error);
      setErrors((prev: Errors) => ({ ...prev, patients: error }));
    }
  }
  
  async function fetchPendingPrescriptions() {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id,
          patients (first_name, last_name),
          medications (name, strength)
        `)
        .eq('status', 'pending')
        .limit(3);
        
      if (error) throw error;
      setResults((prev: Results) => ({ 
        ...prev, 
        pendingPrescriptions: { 
          count: data.length,
          data: data 
        } 
      }));
    } catch (error) {
      console.error('❌ Failed to fetch pending prescriptions:', error);
      setErrors((prev: Errors) => ({ ...prev, pendingPrescriptions: error }));
    }
  }
  
  async function fetchLowStock() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          quantity,
          reorder_level,
          medications (name, strength)
        `)
        .lt('quantity', 'reorder_level')
        .limit(3);
        
      if (error) throw error;
      setResults((prev: Results) => ({ 
        ...prev, 
        lowStock: { 
          count: data.length,
          data: data 
        } 
      }));
    } catch (error) {
      console.error('❌ Failed to fetch low stock:', error);
      setErrors((prev: Errors) => ({ ...prev, lowStock: error }));
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Debug Page</h1>
                <p className="text-muted-foreground">
                  Testing the Supabase connection and queries
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={testSupabaseConnection} 
                  disabled={loading}
                >
                  {loading ? 'Testing...' : 'Run Tests'}
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-semibold ${
                  connectionStatus === 'Connected' ? 'text-green-500' : 
                  connectionStatus === 'Failed' ? 'text-red-500' : 
                  'text-yellow-500'
                }`}>
                  {connectionStatus}
                </div>
                {errors.connection && (
                  <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/10 rounded text-red-600 dark:text-red-300">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(errors.connection, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.keys(results).map(key => (
                      <div key={key} className="border-b pb-2">
                        <h3 className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                        <pre className="whitespace-pre-wrap text-sm mt-1">{JSON.stringify(results[key], null, 2)}</pre>
                      </div>
                    ))}
                    {Object.keys(results).length === 0 && !loading && (
                      <p className="text-muted-foreground">No results yet. Click "Run Tests" to begin.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.keys(errors).filter(k => k !== 'connection').map(key => (
                      <div key={key} className="border-b pb-2">
                        <h3 className="font-medium text-red-500">{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                        <pre className="whitespace-pre-wrap text-sm mt-1 text-red-500">{JSON.stringify(errors[key], null, 2)}</pre>
                      </div>
                    ))}
                    {Object.keys(errors).filter(k => k !== 'connection').length === 0 && !loading && (
                      <p className="text-muted-foreground">No errors detected.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 