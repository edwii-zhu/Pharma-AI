# Database Update Instructions

## Issue Fixed

This project fixes the following error that occurs when viewing prescription details:

```
Failed to load prescription details: Failed to fetch prescription: Query error: column prescriptions.contraindication_data does not exist
```

The error happens because the frontend code expects a `contraindication_data` column in the `prescriptions` table, but it doesn't exist in the database yet.

## Files Created

1. **scripts/add_contraindication_column.sql**  
   SQL commands to add the missing column to the database.

2. **scripts/sample_contraindications.sql**  
   Example data to populate the new column for testing.

3. **scripts/DATABASE_UPDATE_INSTRUCTIONS.md**  
   Detailed instructions for updating the database.

4. **lib/database.types.ts**  
   TypeScript definitions for the database schema, including the new column.

## How to Update Your Database

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor tab
4. Create a new query and paste the contents of `scripts/add_contraindication_column.sql`
5. Run the query
6. Optionally run the sample data script (`scripts/sample_contraindications.sql`)

### About The New Column Format

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

## Post-Update Steps

1. Restart your Next.js development server
2. Try viewing a prescription detail page
3. The error should be resolved

## Troubleshooting

If you encounter issues:

1. Check that the column was added correctly using the SQL Editor
2. Verify the TypeScript types match your database schema
3. Clear browser cache and restart the application

You can also run the health check API by visiting `/api/supabase-health` in your browser. This will show information about your database connection and tables. 