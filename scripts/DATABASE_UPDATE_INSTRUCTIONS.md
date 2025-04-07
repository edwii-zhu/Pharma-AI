# Database Update Instructions

## Issue
The application is looking for a `contraindication_data` column in the `prescriptions` table that doesn't exist yet in your database. This is causing the error:

```
Failed to load prescription details: Failed to fetch prescription: Query error: column prescriptions.contraindication_data does not exist
```

## How to Fix

### Option 1: Using the Supabase Dashboard SQL Editor

1. Log in to your Supabase dashboard at https://app.supabase.com/ 
2. Select your project (the one with URL: `https://grqfabvzlpuhvciytpcn.supabase.co`)
3. Go to the SQL Editor tab in the left sidebar
4. Click "New Query"
5. Paste the following SQL:

```sql
-- Add contraindication_data column to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS contraindication_data JSONB;

-- Add comment to column
COMMENT ON COLUMN prescriptions.contraindication_data IS 'Stores data about drug interactions and other contraindications in JSON format';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_contraindication_data_exists ON prescriptions ((contraindication_data IS NOT NULL));
```

6. Click "Run" to execute the SQL statement
7. Verify the column was added by running: `SELECT * FROM prescriptions LIMIT 1;`

### Option 2: Using the API Directly

If you prefer to use code:

1. Create a file named `update_db.js` with this content:

```javascript
// update_db.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDatabase() {
  // Need to use service key or pgSQL direct access
  console.log('To perform this operation, please use the Supabase dashboard SQL editor');
  console.log('See DATABASE_UPDATE_INSTRUCTIONS.md for details');
}

updateDatabase();
```

2. Use the Supabase dashboard SQL editor instead, as the standard API key doesn't have permission to modify tables.

### Option 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

1. Install it with: `npm install -g supabase`
2. Login: `supabase login`
3. Create a migration: `supabase migration new add_contraindication_column`
4. Edit the generated file with the SQL above
5. Apply the migration: `supabase db push`

## After Update

After updating the database, restart your Next.js application:

```bash
npm run dev
```

Your application should now work without the error as the missing column has been added.

## About The Column Format

The `contraindication_data` column uses a JSONB format with this structure:

```json
{
  "hasSevereContraindications": boolean,
  "contraindications": [
    {
      "type": "drug-interaction" | "condition" | "allergy" | "age" | "other",
      "description": "string",
      "severity": "high" | "medium" | "low",
      "recommendation": "string"
    }
  ]
}
```

You might want to populate some sample data after creating the column. 