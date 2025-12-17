-- External Job Sources and Import System
-- Run this in Supabase SQL Editor

-- External job sources configuration
CREATE TABLE job_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,  -- 'indeed_api', 'indeed_rss', 'adzuna_api', etc.
    source_type TEXT NOT NULL,  -- 'api', 'rss', 'scraper', 'partner'
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}',  -- API keys, endpoints, etc.
    rate_limit_per_hour INTEGER,
    last_synced_at TIMESTAMPTZ,
    sync_frequency TEXT DEFAULT 'hourly',  -- 'hourly', 'daily', 'realtime'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- External job listings (before matching to companies)
CREATE TABLE external_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES job_sources(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,  -- ID from source (e.g., Indeed job key)
    source_url TEXT NOT NULL,
    
    -- Job data (raw from source)
    title TEXT NOT NULL,
    description TEXT,
    company_name TEXT,  -- May not match our companies table
    company_url TEXT,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'USA',
    salary_min INTEGER,
    salary_max INTEGER,
    job_type TEXT,
    work_setting TEXT,
    experience_level TEXT,
    
    -- Matching status
    matched_company_id UUID REFERENCES companies(id),  -- If we matched to existing company
    match_confidence DECIMAL(3,2),  -- 0.00 to 1.00
    match_method TEXT,  -- 'exact_name', 'fuzzy_name', 'domain', 'manual'
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'matched', 'imported', 'duplicate', 'rejected'
    processing_notes TEXT,
    
    -- Metadata
    raw_data JSONB,  -- Full response from source
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    
    UNIQUE(source_id, external_id)
);

-- Indexes for external_jobs
CREATE INDEX idx_external_jobs_source ON external_jobs(source_id);
CREATE INDEX idx_external_jobs_status ON external_jobs(status) WHERE status IN ('pending', 'matched');
CREATE INDEX idx_external_jobs_company_name ON external_jobs USING gin(company_name gin_trgm_ops);
CREATE INDEX idx_external_jobs_title_trgm ON external_jobs USING gin(title gin_trgm_ops);
CREATE INDEX idx_external_jobs_expires ON external_jobs(expires_at) WHERE expires_at IS NOT NULL;

-- Job import queue (for converting external_jobs to jobs)
CREATE TABLE job_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_job_id UUID NOT NULL REFERENCES external_jobs(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),  -- Target company (if matched)
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'importing', 'imported', 'failed'
    import_method TEXT,  -- 'auto', 'manual_review', 'employer_approval'
    imported_job_id UUID REFERENCES jobs(id),  -- Resulting job if imported
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- Sync logs for monitoring
CREATE TABLE job_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES job_sources(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL,  -- 'full', 'incremental', 'manual'
    status TEXT NOT NULL,  -- 'success', 'partial', 'failed'
    jobs_found INTEGER DEFAULT 0,
    jobs_new INTEGER DEFAULT 0,
    jobs_updated INTEGER DEFAULT 0,
    jobs_duplicates INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

CREATE INDEX idx_sync_logs_source ON job_sync_logs(source_id, started_at DESC);

-- Add source tracking to jobs table
ALTER TABLE jobs ADD COLUMN source_id UUID REFERENCES job_sources(id);
ALTER TABLE jobs ADD COLUMN external_job_id UUID REFERENCES external_jobs(id);
ALTER TABLE jobs ADD COLUMN is_external BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE jobs ADD COLUMN external_url TEXT;  -- Link back to original listing

CREATE INDEX idx_jobs_source ON jobs(source_id) WHERE is_external = true;

-- Updated at trigger for job_sources
CREATE TRIGGER update_job_sources_updated_at
    BEFORE UPDATE ON job_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

