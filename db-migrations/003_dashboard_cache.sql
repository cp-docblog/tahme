-- Dashboard Cache Table
-- Stores aggregated dashboard data to avoid frequent API calls

CREATE TABLE IF NOT EXISTS dashboard_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dashboard_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own cache
CREATE POLICY "Users can view own dashboard cache"
    ON dashboard_cache FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own cache
CREATE POLICY "Users can insert own dashboard cache"
    ON dashboard_cache FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cache
CREATE POLICY "Users can update own dashboard cache"
    ON dashboard_cache FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_user_id ON dashboard_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_updated_at ON dashboard_cache(updated_at);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS trigger_update_dashboard_cache_timestamp ON dashboard_cache;
CREATE TRIGGER trigger_update_dashboard_cache_timestamp
    BEFORE UPDATE ON dashboard_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_cache_timestamp();

COMMENT ON TABLE dashboard_cache IS 'Caches aggregated dashboard data for each user';
COMMENT ON COLUMN dashboard_cache.user_id IS 'User who owns this cache entry';
COMMENT ON COLUMN dashboard_cache.data IS 'Aggregated dashboard data in JSON format';
COMMENT ON COLUMN dashboard_cache.updated_at IS 'Last time cache was updated';
