import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

// We need to manually check if we're in a Node.js environment without Next.js
const isBrowser = typeof window !== 'undefined'

// In a browser context, Next.js will use the process.env.NEXT_PUBLIC_* variables
// In a direct Node.js context (like our tests), we need to load them from dotenv
if (!isBrowser && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  // We're in Node.js context without environment variables
  try {
    // Try to load dotenv
    require('dotenv').config({ path: '.env.local' })
  } catch (e) {
    // Dotenv might not be available, only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('dotenv not available, environment variables might be missing')
    }
  }
}

// Get the environment variables (now they should be available in both contexts)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if they're available
if (!supabaseUrl || !supabaseAnonKey) {
  if (isBrowser) {
    // In browser, show a console error but don't crash the app
    console.error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  } else {
    // In Node.js, we can throw an error
    throw new Error(
      'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
}

// Create the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || '', // Provide fallbacks to avoid TypeScript errors
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Enable appropriate headers for browser requests
      headers: {
        'X-Client-Info': 'pharmacy-management-system'
      }
    }
  }
)

// Helper to check for storage availability
export const checkStorageAvailability = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Storage API error:', error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error checking storage availability:', err);
    return false;
  }
}

// Helper hooks and utilities can be added here
export const getPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('last_name', { ascending: true })
  
  if (error) throw error
  return data
}

export const getPatientById = async (id: string) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Function to get all patient IDs for generateStaticParams
export const getAllPatientIds = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('id')

  if (error) {
    console.error('Error fetching patient IDs:', error)
    return []
  }

  return data || []
}

export const getPatientPrescriptions = async (patientId: string) => {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      medications(id, name, dosage_form, strength),
      prescribers(id, first_name, last_name)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const createPatient = async (patient: Database['public']['Tables']['patients']['Insert']) => {
  const { data, error } = await supabase
    .from('patients')
    .insert(patient)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updatePatient = async (id: string, updates: Database['public']['Tables']['patients']['Update']) => {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getPrescriptions = async () => {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      patients(id, first_name, last_name),
      medications(id, name, dosage_form, strength),
      prescribers(id, first_name, last_name)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getLowStockItems = async () => {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      medications(id, name, dosage_form, strength)
    `)
    .lt('quantity', 'reorder_level')
  
  if (error) throw error
  return data
}

export const getAlerts = async () => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .eq('is_read', false)
  
  if (error) throw error
  return data
}

// Debug helper for prescription queries with better error reporting
export const debugGetPrescriptionById = async (prescriptionId: string) => {
  try {
    console.log('Starting debug query for prescription ID:', prescriptionId);
    
    // Check if supabase is initialized
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return { 
        success: false, 
        error: 'Supabase client is not initialized',
        data: null
      };
    }
    
    // First try a simple query to check connection
    console.log('Testing connection with simple query...');
    const testQuery = await supabase.from('prescriptions').select('id').limit(1);
    
    if (testQuery.error) {
      console.error('Connection test failed:', testQuery.error);
      return { 
        success: false, 
        error: `Connection error: ${testQuery.error.message}`,
        data: null
      };
    }
    
    console.log('Connection test successful, proceeding with full query');
    
    // Now perform the actual query
    const result = await supabase
      .from('prescriptions')
      .select(`
        id,
        created_at,
        updated_at,
        patient_id,
        prescriber_id,
        medication_id,
        dosage,
        frequency,
        duration,
        quantity,
        refills,
        instructions,
        date_written,
        date_filled,
        status,
        verification_pharmacist_id,
        original_document_url,
        notes,
        contraindication_data,
        patients (first_name, last_name, date_of_birth),
        medications (name, dosage_form, strength, description),
        prescribers (first_name, last_name)
      `)
      .eq('id', prescriptionId)
      .single();
    
    if (result.error) {
      console.error('Error fetching prescription:', result.error);
      return {
        success: false,
        error: `Query error: ${result.error.message || 'Unknown error'}`,
        details: result.error,
        data: null
      };
    }
    
    if (!result.data) {
      console.log('No data found for prescription ID:', prescriptionId);
      return {
        success: false,
        error: 'No prescription found with this ID',
        data: null
      };
    }
    
    console.log('Query successful, data retrieved');
    return {
      success: true,
      error: null,
      data: result.data
    };
  } catch (error) {
    console.error('Unexpected error in debugGetPrescriptionById:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in debugGetPrescriptionById',
      unexpectedError: error,
      data: null
    };
  }
};

// Helper to check environment values
export const checkSupabaseConfig = () => {
  return {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : 'missing',
    isBrowser
  };
}; 