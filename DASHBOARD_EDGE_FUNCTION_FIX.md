# Dashboard Edge Function Issues & Fixes

## Problems Identified

The `dashboard-data` edge function is failing because:

1. ❌ **Missing Environment Variable**: `BACKEND_WEBHOOK_URL` not configured in edge function
2. ❌ **Edge Function Not Deployed**: The function hasn't been deployed to Supabase
3. ⚠️ **Database Table**: `dashboard_cache` table may not exist

## Solutions

### 1. Deploy the Edge Function

First, you need to deploy the `dashboard-data` edge function:

```bash
# Deploy dashboard-data function
supabase functions deploy dashboard-data
```

> **Note**: You might need to install Supabase CLI first if the command fails

### 2. Set Environment Variable

The edge function needs the backend webhook URL. You need to set it as a secret:

```bash
# Set the backend webhook URL as a secret
supabase secrets set BACKEND_WEBHOOK_URL=<your-backend-url>
```

Replace `<your-backend-url>` with your actual backend webhook URL (the same one used in `REACT_APP_BACKEND_WEBHOOK` from your frontend `.env`).

### 3. Ensure Database Table Exists

Run the migration to create the `dashboard_cache` table:

```bash
# Run migrations
supabase db push
```

Or manually create the table:

```sql
CREATE TABLE IF NOT EXISTS public.dashboard_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dashboard_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own cache
CREATE POLICY "Users can access own cache"
    ON public.dashboard_cache
    FOR ALL
    USING (auth.uid() = user_id);
```

### 4. Alternative: Temporary Mock Data Fix

If you want the dashboard to work **right now** while you set up the edge function, I can add back a **better fallback** that:
- Shows an error message at the top
- Displays sample data so you can see the UI
- Makes it clear it's not real data

Would you like me to:
- **A)** Help you deploy and configure the edge function properly? (Recommended)
- **B)** Add a temporary fallback with clear error messaging?
- **C)** Both - add fallback now, then fix properly?

## What's Happening

The edge function flow is:
1. Frontend calls `supabase.functions.invoke('dashboard-data')`
2. Edge function authenticates user
3. Edge function fetches clients from database
4. Edge function calls **YOUR BACKEND** at `BACKEND_WEBHOOK_URL/fetch-snap-campaigns`
5. Backend calls Snapchat API and returns metrics
6. Edge function aggregates data and returns to frontend

The failure is likely at step 4 - either the env var is missing, or the backend URL is wrong.
