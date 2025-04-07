import { NextResponse } from 'next/server';
import { supabase, checkSupabaseConfig } from '@/lib/supabase';

export async function GET() {
  try {
    // Check environment configuration
    const config = checkSupabaseConfig();
    
    // Test basic connection
    const connectionTest = await supabase.from('prescriptions').select('id').limit(1);
    
    // Check for tables existence
    const tableTests = {
      prescriptions: await supabase.from('prescriptions').select('count').single(),
      patients: await supabase.from('patients').select('count').single(),
      medications: await supabase.from('medications').select('count').single(),
    };
    
    // Build detailed response
    const tableStatuses = Object.entries(tableTests).map(([table, result]) => ({
      table,
      success: !result.error,
      count: result.data?.count ?? null,
      error: result.error ? result.error.message : null
    }));
    
    // Determine overall status
    const hasErrors = tableStatuses.some(status => !status.success);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: hasErrors ? 'error' : 'healthy',
      environment: {
        ...config,
        nodeEnv: process.env.NODE_ENV
      },
      connection: {
        success: !connectionTest.error,
        error: connectionTest.error ? connectionTest.error.message : null
      },
      tables: tableStatuses
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      environment: checkSupabaseConfig(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : null
    }, { status: 500 });
  }
} 