import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

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
  supabaseAnonKey || ''
)

// Helper hooks and utilities can be added here
export const getPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('last_name', { ascending: true })
  
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