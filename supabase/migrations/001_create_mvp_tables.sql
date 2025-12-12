-- FSG Talent Hub MVP Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/apeunjsunohisnlrawfg/sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'expired');
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary');
CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE work_setting AS ENUM ('onsite', 'remote', 'hybrid');
CREATE TYPE application_status AS ENUM (
    'applied', 'viewed', 'screening', 'interviewing',
    'offered', 'hired', 'rejected', 'withdrawn'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Associations (Brands)
CREATE TABLE associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    logo_url TEXT,
    theme JSONB NOT NULL DEFAULT '{}',
    default_filters JSONB DEFAULT '{}',
    hero_title TEXT,
    hero_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed associations
INSERT INTO associations (name, slug, theme) VALUES
    ('FSG Media', 'fsg', '{"primaryColor": "#2563eb"}'),
    ('Five Star Institute', 'fsi', '{"primaryColor": "#1e40af"}'),
    ('AM&AA', 'amaa', '{"primaryColor": "#059669"}');

-- Companies (Employers)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    hubspot_id TEXT UNIQUE,
    association_id UUID REFERENCES associations(id) ON DELETE SET NULL,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    industry TEXT,
    company_size TEXT,
    headquarters_city TEXT,
    headquarters_state TEXT,
    headquarters_country TEXT DEFAULT 'USA',
    membership_status TEXT DEFAULT 'none',
    tier TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    last_synced_at TIMESTAMPTZ,
    pending_overrides JSONB DEFAULT '{}',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_association ON companies(association_id);
CREATE INDEX idx_companies_hubspot ON companies(hubspot_id) WHERE hubspot_id IS NOT NULL;
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- Company Users (Team Members)
CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'recruiter',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_users_user ON company_users(user_id);
CREATE INDEX idx_company_users_company ON company_users(company_id);

-- Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    association_id UUID REFERENCES associations(id) ON DELETE SET NULL,
    posted_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    department TEXT,
    profession TEXT,
    industry TEXT,
    job_type job_type NOT NULL DEFAULT 'full_time',
    experience_level experience_level,
    work_setting work_setting NOT NULL DEFAULT 'onsite',
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'USA',
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    salary_period TEXT DEFAULT 'year',
    show_salary BOOLEAN NOT NULL DEFAULT false,
    status job_status NOT NULL DEFAULT 'draft',
    tier TEXT NOT NULL DEFAULT 'free',
    is_confidential BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    apply_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, slug)
);

CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'active';
CREATE INDEX idx_jobs_association ON jobs(association_id);
CREATE INDEX idx_jobs_published ON jobs(published_at DESC) WHERE status = 'active';
CREATE INDEX idx_jobs_location ON jobs(location_state, location_city) WHERE status = 'active';
CREATE INDEX idx_jobs_work_setting ON jobs(work_setting) WHERE status = 'active';
CREATE INDEX idx_jobs_title_trgm ON jobs USING gin(title gin_trgm_ops);
CREATE INDEX idx_jobs_fts ON jobs USING gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Candidates
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    headline TEXT,
    summary TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    willing_to_relocate BOOLEAN DEFAULT false,
    desired_job_types job_type[] DEFAULT '{}',
    desired_work_settings work_setting[] DEFAULT '{}',
    desired_salary_min INTEGER,
    desired_industries TEXT[] DEFAULT '{}',
    resume_url TEXT,
    resume_filename TEXT,
    resume_uploaded_at TIMESTAMPTZ,
    resume_text TEXT,
    profile_data JSONB DEFAULT '{}',
    profile_complete BOOLEAN NOT NULL DEFAULT false,
    tier TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    is_searchable BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_user ON candidates(user_id);
CREATE INDEX idx_candidates_location ON candidates(state, city);
CREATE INDEX idx_candidates_searchable ON candidates(is_searchable) WHERE is_searchable = true;
CREATE INDEX idx_candidates_name_trgm ON candidates USING gin(
    (coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops
);

-- Applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    cover_letter TEXT,
    resume_url TEXT,
    answers JSONB DEFAULT '{}',
    status application_status NOT NULL DEFAULT 'applied',
    status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status_changed_by UUID REFERENCES auth.users(id),
    ai_match_score DECIMAL(5,2),
    ai_match_reasons JSONB DEFAULT '{}',
    internal_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied ON applications(applied_at DESC);

-- Job Alerts
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    frequency TEXT NOT NULL DEFAULT 'daily',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_alerts_candidate ON job_alerts(candidate_id);
CREATE INDEX idx_job_alerts_active ON job_alerts(is_active) WHERE is_active = true;

-- Saved Jobs
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_saved_jobs_candidate ON saved_jobs(candidate_id);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_associations_updated_at
    BEFORE UPDATE ON associations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Job slug generation
CREATE OR REPLACE FUNCTION generate_job_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;

    WHILE EXISTS (
        SELECT 1 FROM jobs
        WHERE company_id = NEW.company_id
        AND slug = final_slug
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_job_slug_trigger
    BEFORE INSERT OR UPDATE OF title ON jobs
    FOR EACH ROW EXECUTE FUNCTION generate_job_slug();

-- Application counter
CREATE OR REPLACE FUNCTION increment_apply_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs SET apply_count = apply_count + 1 WHERE id = NEW.job_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_job_apply_count
    AFTER INSERT ON applications
    FOR EACH ROW EXECUTE FUNCTION increment_apply_count();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Associations: Public read
CREATE POLICY "Associations are viewable by everyone"
    ON associations FOR SELECT
    USING (is_active = true);

-- Companies: Public read, team write
CREATE POLICY "Active companies are viewable by everyone"
    ON companies FOR SELECT
    USING (is_active = true);

CREATE POLICY "Company team members can update their company"
    ON companies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.company_id = companies.id
            AND company_users.user_id = auth.uid()
            AND company_users.role IN ('owner', 'recruiter')
        )
    );

-- Company Users
CREATE POLICY "Users can view their company team"
    ON company_users FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = company_users.company_id
            AND cu.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage company team"
    ON company_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = company_users.company_id
            AND cu.user_id = auth.uid()
            AND cu.role = 'owner'
        )
    );

-- Jobs: Public read active, team manage
CREATE POLICY "Active jobs are viewable by everyone"
    ON jobs FOR SELECT
    USING (status = 'active');

CREATE POLICY "Company team can view all their jobs"
    ON jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.company_id = jobs.company_id
            AND company_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Company team can insert jobs"
    ON jobs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.company_id = jobs.company_id
            AND company_users.user_id = auth.uid()
            AND company_users.role IN ('owner', 'recruiter')
        )
    );

CREATE POLICY "Company team can update their jobs"
    ON jobs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.company_id = jobs.company_id
            AND company_users.user_id = auth.uid()
            AND company_users.role IN ('owner', 'recruiter')
        )
    );

CREATE POLICY "Owners can delete jobs"
    ON jobs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.company_id = jobs.company_id
            AND company_users.user_id = auth.uid()
            AND company_users.role = 'owner'
        )
    );

-- Candidates: Own profile
CREATE POLICY "Candidates can view their own profile"
    ON candidates FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Candidates can insert their own profile"
    ON candidates FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Candidates can update their own profile"
    ON candidates FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Employers can view searchable candidates"
    ON candidates FOR SELECT
    USING (
        is_searchable = true
        AND EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.user_id = auth.uid()
        )
    );

-- Applications
CREATE POLICY "Candidates can view their applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = applications.candidate_id
            AND candidates.user_id = auth.uid()
        )
    );

CREATE POLICY "Candidates can create applications"
    ON applications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = applications.candidate_id
            AND candidates.user_id = auth.uid()
        )
    );

CREATE POLICY "Candidates can update their applications"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = applications.candidate_id
            AND candidates.user_id = auth.uid()
        )
    );

CREATE POLICY "Employers can view applications for their jobs"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            JOIN company_users ON company_users.company_id = jobs.company_id
            WHERE jobs.id = applications.job_id
            AND company_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Employers can update application status"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            JOIN company_users ON company_users.company_id = jobs.company_id
            WHERE jobs.id = applications.job_id
            AND company_users.user_id = auth.uid()
            AND company_users.role IN ('owner', 'recruiter')
        )
    );

-- Job Alerts & Saved Jobs: Own only
CREATE POLICY "Candidates can manage their job alerts"
    ON job_alerts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = job_alerts.candidate_id
            AND candidates.user_id = auth.uid()
        )
    );

CREATE POLICY "Candidates can manage their saved jobs"
    ON saved_jobs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = saved_jobs.candidate_id
            AND candidates.user_id = auth.uid()
        )
    );