// Script to update the prescriptions table with a contraindication_data column
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env.local contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const sqlFilePath = path.join(__dirname, 'add_contraindication_column.sql');
let sqlCommands;

try {
  sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('SQL file loaded successfully');
} catch (error) {
  console.error('Error reading SQL file:', error);
  process.exit(1);
}

// Execute the SQL commands
async function executeSql() {
  try {
    console.log('Connecting to Supabase...');
    
    // Execute the SQL as a single query
    const { error } = await supabase.rpc('alter_table_prescriptions', {
      sql_commands: sqlCommands
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Fallback: try direct table update if RPC fails
      console.log('Attempting direct table update...');
      
      // Execute a simpler alter table command
      const { error: directError } = await supabase
        .from('prescriptions')
        .select('id')
        .limit(1);
        
      if (directError) {
        console.error('Database connection failed:', directError);
        process.exit(1);
      }
      
      console.log('Database connection successful. Please execute the SQL command directly in the Supabase dashboard.');
      console.log('SQL to execute:');
      console.log(sqlCommands);
    } else {
      console.log('Database updated successfully!');
      
      // Verify the column was added
      const { data, error: verifyError } = await supabase
        .from('prescriptions')
        .select('contraindication_data')
        .limit(1);
      
      if (verifyError) {
        console.error('Verification failed:', verifyError);
      } else {
        console.log('Column verification successful');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the update
executeSql(); 