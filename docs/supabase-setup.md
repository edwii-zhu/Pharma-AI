# Supabase Setup Guide for Pharmacy Management System

## Prerequisites
- A Supabase account (free tier is sufficient to start)
- Node.js installed on your machine
- Access to the Pharmacy Management System codebase

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Click "New Project" and fill in the details:
   - Organization: Your organization name
   - Name: `pharmacy-management` (or your preferred name)
   - Database Password: Create a secure password
   - Region: Choose the region closest to your users
3. Click "Create new project" and wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In the Supabase dashboard, go to Project Settings > API
2. You'll find two important values:
   - Project URL (labeled as "URL")
   - API Key (labeled as "anon" "public")
3. Copy these values as you'll need them for the next step

## Step 3: Configure Your Local Environment

1. In your project's `.env.local` file, add the following values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
   Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

## Step 4: Create the Database Tables

### Option 1: Using the Supabase UI
1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `lib/schema.sql` in this project
3. Paste into the SQL Editor and click "Run"
4. After the schema is created successfully, copy the contents of `lib/mock-data.sql`
5. Paste into the SQL Editor and click "Run" to populate the database with test data

### Option 2: Using the Supabase CLI
1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```
2. Login to Supabase:
   ```bash
   supabase login
   ```
3. Initialize Supabase in your project:
   ```bash
   supabase init
   ```
4. Link to your remote project:
   ```bash
   supabase link --project-ref your_project_ref
   ```
   (You can find your project reference in the URL of your Supabase dashboard)
5. Run the schema migrations:
   ```bash
   supabase db push
   ```
6. Load the mock data:
   ```bash
   cat lib/mock-data.sql | supabase db sql
   ```

## Step 5: Set Up Row-Level Security (Optional but Recommended)

For added security, you can set up Row-Level Security (RLS) policies in Supabase:

1. Go to Authentication > Policies in your Supabase dashboard
2. For each table, create appropriate policies based on your application's security requirements
3. Common patterns include:
   - Allow authenticated users to read all records
   - Allow users to create their own records
   - Allow users to update only their own records
   - Allow admin users to have full access

## Step 6: Test the Connection

1. Run your application:
   ```bash
   npm run dev
   ```
2. Verify that the application can connect to Supabase by checking the console for any connection errors
3. Try to perform a database operation to ensure everything is working correctly

## Step 7: Set Up Authentication (Future Enhancement)

Supabase provides authentication services that you can integrate with your application:

1. In the Supabase dashboard, go to Authentication > Settings
2. Configure providers as needed (Email, Google, GitHub, etc.)
3. Update your application to use Supabase authentication

## Troubleshooting

### Connection Issues
- Verify that the URL and API key in your `.env.local` file are correct
- Check that your Supabase project is active
- Ensure that your IP is not blocked by Supabase

### Database Issues
- Check the SQL console for any error messages during table creation
- Verify that the database schema matches what your application expects
- Use the Supabase table viewer to ensure your tables are properly created

### API Issues
- Check for CORS issues if accessing from a browser
- Ensure that your Supabase project has sufficient resources (free tier has limits)
- Verify that your application is using the correct API endpoints

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/start)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth) 