-- Employer prospecting table
CREATE TABLE employer_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    company_url TEXT,
    job_count INTEGER NOT NULL DEFAULT 0,
    
    -- HubSpot integration
    hubspot_company_id TEXT,
    hubspot_contact_id TEXT,
    
    -- Enrichment
    enrichment_status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'enriched', 'failed'
    enrichment_data JSONB DEFAULT '{}',
    
    -- Outreach tracking
    outreach_status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'contacted', 'responded', 'converted', 'rejected'
    outreach_date TIMESTAMPTZ,
    conversion_date TIMESTAMPTZ,
    notes TEXT,
    
    -- Timestamps
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employer_prospects_company_name ON employer_prospects USING gin(company_name gin_trgm_ops);
CREATE INDEX idx_employer_prospects_outreach_status ON employer_prospects(outreach_status);
CREATE INDEX idx_employer_prospects_enrichment_status ON employer_prospects(enrichment_status);
CREATE INDEX idx_employer_prospects_hubspot_company ON employer_prospects(hubspot_company_id) WHERE hubspot_company_id IS NOT NULL;

-- RLS policies
ALTER TABLE employer_prospects ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage employer prospects"
    ON employer_prospects
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

