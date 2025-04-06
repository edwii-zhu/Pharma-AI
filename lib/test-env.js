// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

console.log('Checking environment variables...');

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
console.log('GOOGLE_AI_API_KEY present:', !!process.env.GOOGLE_AI_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV); 