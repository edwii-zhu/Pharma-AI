// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Import Supabase
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * This file contains functions to test the connection to Supabase
 * and verify that the data has been loaded correctly.
 * 
 * You can run this with:
 * node lib/test-connection.js
 */

async function testConnection() {
  try {
    console.log('🔄 Testing connection to Supabase...');
    
    // Just test the connection with a simpler query
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

async function checkDataCounts() {
  console.log('🔄 Checking data counts in tables...');
  
  const tables = [
    'users',
    'patients',
    'medications',
    'inventory',
    'prescribers',
    'prescriptions',
    'suppliers',
    'alerts'
  ];
  
  const counts = {};
  
  for (const table of tables) {
    const { data, count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ Error fetching count for ${table}:`, error.message);
      continue;
    }
    
    counts[table] = count || 0;
  }
  
  console.log('📊 Table counts:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`   ${table}: ${count} records`);
  }
  
  // Check if we have data in each table
  const hasData = Object.values(counts).every(count => count > 0);
  if (hasData) {
    console.log('✅ All tables have data!');
  } else {
    console.log('⚠️ Some tables are empty. You may need to run the mock data script.');
  }
  
  return counts;
}

async function fetchSampleData() {
  console.log('🔄 Fetching sample data...');
  
  // Fetch a few patients
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*')
    .limit(3);
  
  if (patientsError) {
    console.error('❌ Error fetching patients:', patientsError.message);
  } else {
    console.log('👤 Sample patients:');
    console.log(patients);
  }
  
  // Fetch some prescriptions with related data
  const { data: prescriptions, error: prescriptionsError } = await supabase
    .from('prescriptions')
    .select(`
      id,
      status,
      patients (first_name, last_name),
      medications (name, dosage_form, strength),
      prescribers (first_name, last_name)
    `)
    .limit(3);
  
  if (prescriptionsError) {
    console.error('❌ Error fetching prescriptions:', prescriptionsError.message);
  } else {
    console.log('\n📝 Sample prescriptions with joins:');
    console.log(prescriptions);
  }
  
  // Fetch some alerts
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .limit(3);
  
  if (alertsError) {
    console.error('❌ Error fetching alerts:', alertsError.message);
  } else {
    console.log('\n🔔 Sample alerts:');
    console.log(alerts);
  }
}

async function runTests() {
  console.log('🧪 Starting Supabase connection and data tests...');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Connection test failed. Please check your credentials in .env.local');
    return;
  }
  
  await checkDataCounts();
  await fetchSampleData();
  
  console.log('\n✅ Tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ An unexpected error occurred:', error);
}); 