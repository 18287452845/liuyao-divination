# Supabase Backend Setup

The backend now uses Supabase Postgres instead of MySQL.

## 1. Create schema

Run this migration in the Supabase SQL editor:

```sql
server/supabase/migrations/0001_init_schema.sql
```

Or use the Supabase CLI if the project is linked:

```bash
supabase db push
```

## 2. Configure backend connection

Set one of these environment variables:

```env
SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-0-region.pooler.supabase.com:6543/postgres
DATABASE_URL=postgresql://...
```

`SUPABASE_DB_URL` takes precedence. SSL is enabled by default for Supabase hosts.

## 3. Existing data

This migration creates the schema and base RBAC seed data. If you already have MySQL data, export it and import it into the matching Postgres tables. The large 64-hexagram text dataset from `server/sql` should be migrated as data, not mixed into the structural schema migration.

## Notes

The existing app-level JWT/RBAC flow is intentionally preserved. Supabase Auth is not yet wired into the frontend login flow. RLS is enabled for public tables so they are not accidentally exposed through the Supabase Data API.
