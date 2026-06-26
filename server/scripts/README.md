# Server Scripts

The backend uses Supabase Postgres. Database schema changes should be made through
`server/supabase/migrations`, then applied to Supabase with the SQL editor, the
Supabase connector, or the Supabase CLI.

## Current Scripts

- `test-bazi.ts`: validates the Bazi calculation logic without requiring a database.

## Database Setup

Run:

```sql
server/supabase/migrations/0001_init_schema.sql
```

Then configure:

```env
SUPABASE_DB_URL=postgresql://...
SUPABASE_DB_SSL=true
```
