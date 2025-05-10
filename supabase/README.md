# Supabase Configuration for ローディングDXスクール

This directory contains the Supabase database schema and migration files for the ローディングDXスクール (Loading DX School) application.

## Schema

The main database schema is defined in `schema.sql`. It includes:

- `cases` table for storing DX failure scenarios
- Indexes for performance optimization
- Row Level Security (RLS) policies for secure access

## Migrations

The `migrations` directory contains SQL files that can be applied to update an existing Supabase database.

## How to Apply Changes

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file (e.g., `migrations/20250510_fix_cases_table.sql`)
4. Paste into the SQL Editor and run the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
# Apply the schema
supabase db push

# Or apply a specific migration
supabase db execute --file ./migrations/20250510_fix_cases_table.sql
```

## Important Notes

### Row Level Security (RLS)

The `cases` table has RLS enabled with the following policies:

- `Allow anonymous inserts to cases`: Allows unauthenticated users to insert new records
- `Allow public reads from cases`: Allows unauthenticated users to read records

### Column Types

- `tags` column is of type `JSONB` to store JSON data
- `id` column uses UUID generation via the `uuid-ossp` extension

## Troubleshooting

If you encounter a "404 Not Found" error when submitting to the `cases` table, ensure:

1. The table exists in your Supabase database
2. RLS policies are correctly configured
3. The `anon` role has the necessary permissions
4. The column types match the application's expectations (especially `tags` as `JSONB`)
