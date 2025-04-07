// Script to test environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('=========================');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing'}`);

// Check if URL and key are properly formatted
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(`URL Valid: ✅ (${url.hostname})`);
  } catch (e) {
    console.log(`URL Valid: ❌ (Invalid URL format)`);
  }
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Check if the key looks like a JWT (simplistic check)
  const parts = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.');
  if (parts.length === 3) {
    console.log(`ANON_KEY Valid: ✅ (Looks like a valid JWT format)`);
  } else {
    console.log(`ANON_KEY Valid: ❌ (Does not appear to be in JWT format)`);
  }
  
  // Log the first 10 chars to verify it's not truncated
  const firstTenChars = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10);
  const lastTenChars = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 10
  );
  console.log(`ANON_KEY Start: ${firstTenChars}...`);
  console.log(`ANON_KEY End: ...${lastTenChars}`);
}

console.log('\nTrying to create Supabase client...');
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  console.log('✅ Supabase client created successfully');
  
  // Test a simple query
  console.log('\nTesting connection to Supabase...');
  supabase.from('patients').select('id').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log(`❌ Connection test failed: ${error.message}`);
      } else {
        console.log(`✅ Connection successful! Received data: ${JSON.stringify(data)}`);
      }
    })
    .catch(err => {
      console.log(`❌ Connection test failed with exception: ${err.message}`);
    });
} catch (err) {
  console.log(`❌ Failed to create Supabase client: ${err.message}`);
} 