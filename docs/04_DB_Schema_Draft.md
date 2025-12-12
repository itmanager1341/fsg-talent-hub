# Database Schema Draft - MVP

**Version:** 1.0
**Date:** 2025-12-10
**Status:** Draft
**Scope:** V0/V1 MVP (employers, jobs, candidates, applications)

---

## Overview

Supabase Postgres schema for the FSG Talent Hub MVP. Brand is a **tag/filter**, not a data partition—all jobs are visible cross-brand by default.

---

## Extensions

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for embeddings (V1+)
```

---

## Core Tables

### associations

Brand/association definitions (FSI, AM&AA, future partners).

```sql
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

-- Seed data
INSERT INTO associations (name, slug, theme) VALUES
    ('FSG Media', 'fsg', '{"primaryColor": "#2563eb"}'),
    ('Five Star Institute', 'fsi', '{"primaryColor": "#1e40af"}'),
    ('AM&AA', 'amaa', '{"primaryColor": "#059669"}');
```

### companies

Employer profiles. Synced with HubSpot.

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    hubspot_id TEXT UNIQUE,
    association_id UUID REFERENCES associations(id) ON DELETE SET NULL,

    -- Profile
    website TEXT,
    description TEXT,
    logo_url TEXT,
    industry TEXT,
    company_size TEXT,  -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'

    -- Location
    headquarters_city TEXT,
    headquarters_state TEXT,
    headquarters_country TEXT DEFAULT 'USA',

    -- Membership & billing
    membership_status TEXT DEFAULT 'none',  -- none, member, premium_member
    tier TEXT NOT NULL DEFAULT 'free',      -- free, standard, premium
    stripe_customer_id TEXT UNIQUE,

    -- HubSpot sync
    sync_status TEXT NOT NULL DEFAULT 'pending',  -- pending, synced, conflict, error
    last_synced_at TIMESTAMPTZ,
    pending_overrides JSONB DEFAULT '{}',

    -- Metadata
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_association ON companies(association_id);
CREATE INDEX idx_companies_hubspot ON companies(hubspot_id) WHERE hubspot_id IS NOT NULL;
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);
```

### company_users

Links Supabase auth users to companies (employer team members).

```sql
CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'recruiter',  -- owner, recruiter, billing
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_users_user ON company_users(user_id);
CREATE INDEX idx_company_users_company ON company_users(company_id);
```

### jobs

Job postings. `association_id` is a tag for filtering, not isolation.

```sql
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'expired');
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary');
CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE work_setting AS ENUM ('onsite', 'remote', 'hybrid');

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    association_id UUID REFERENCES associations(id) ON DELETE SET NULL,  -- Brand tag (optional)
    posted_by UUID REFERENCES auth.users(id),

    -- Core fields
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,

    -- Classification
    department TEXT,
    profession TEXT,          -- e.g., 'mortgage_servicing', 'mna_advisory'
    industry TEXT,
    job_type job_type NOT NULL DEFAULT 'full_time',
    experience_level experience_level,

    -- Location
    work_setting work_setting NOT NULL DEFAULT 'onsite',
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'USA',

    -- Compensation (optional)
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    salary_period TEXT DEFAULT 'year',  -- year, month, hour
    show_salary BOOLEAN NOT NULL DEFAULT false,

    -- Status & visibility
    status job_status NOT NULL DEFAULT 'draft',
    tier TEXT NOT NULL DEFAULT 'free',  -- free, featured, premium
    is_confidential BOOLEAN NOT NULL DEFAULT false,

    -- AI & matching (V1+)
    embedding VECTOR(1536),

    -- Metrics
    view_count INTEGER NOT NULL DEFAULT 0,
    apply_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(company_id, slug)
);

-- Performance indexes
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'active';
CREATE INDEX idx_jobs_association ON jobs(association_id);
CREATE INDEX idx_jobs_published ON jobs(published_at DESC) WHERE status = 'active';
CREATE INDEX idx_jobs_location ON jobs(location_state, location_city) WHERE status = 'active';
CREATE INDEX idx_jobs_work_setting ON jobs(work_setting) WHERE status = 'active';
CREATE INDEX idx_jobs_title_trgm ON jobs USING gin(title gin_trgm_ops);

-- Full-text search
CREATE INDEX idx_jobs_fts ON jobs USING gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Vector search (V1+)
-- CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### candidates

Job seeker profiles.

```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Profile
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    headline TEXT,           -- e.g., "Senior Mortgage Analyst"
    summary TEXT,

    -- Location
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    willing_to_relocate BOOLEAN DEFAULT false,

    -- Preferences
    desired_job_types job_type[] DEFAULT '{}',
    desired_work_settings work_setting[] DEFAULT '{}',
    desired_salary_min INTEGER,
    desired_industries TEXT[] DEFAULT '{}',

    -- Resume
    resume_url TEXT,
    resume_filename TEXT,
    resume_uploaded_at TIMESTAMPTZ,
    resume_text TEXT,        -- Extracted text for search/AI

    -- Profile completeness
    profile_data JSONB DEFAULT '{}',  -- Experience, education, skills
    profile_complete BOOLEAN NOT NULL DEFAULT false,

    -- AI & matching (V1+)
    embedding VECTOR(1536),

    -- Subscription
    tier TEXT NOT NULL DEFAULT 'free',  -- free, plus, pro
    stripe_customer_id TEXT UNIQUE,

    -- Visibility
    is_searchable BOOLEAN NOT NULL DEFAULT true,  -- Visible to employers
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_user ON candidates(user_id);
CREATE INDEX idx_candidates_location ON candidates(state, city);
CREATE INDEX idx_candidates_searchable ON candidates(is_searchable) WHERE is_searchable = true;
CREATE INDEX idx_candidates_name_trgm ON candidates USING gin(
    (coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops
);
```

### applications

Job applications linking candidates to jobs.

```sql
CREATE TYPE application_status AS ENUM (
    'applied',
    'viewed',
    'screening',
    'interviewing',
    'offered',
    'hired',
    'rejected',
    'withdrawn'
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

    -- Application content
    cover_letter TEXT,
    resume_url TEXT,          -- Snapshot at time of application
    answers JSONB DEFAULT '{}',  -- Screening question responses

    -- Status tracking
    status application_status NOT NULL DEFAULT 'applied',
    status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status_changed_by UUID REFERENCES auth.users(id),

    -- AI scoring (V1+)
    ai_match_score DECIMAL(5,2),  -- 0.00 to 100.00
    ai_match_reasons JSONB DEFAULT '{}',

    -- Employer notes (internal)
    internal_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Timestamps
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
```

---

## Supporting Tables

### job_alerts

Saved searches for candidates to receive notifications.

```sql
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',  -- {keywords, location, job_type, etc.}
    frequency TEXT NOT NULL DEFAULT 'daily',  -- daily, weekly, instant
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_alerts_candidate ON job_alerts(candidate_id);
CREATE INDEX idx_job_alerts_active ON job_alerts(is_active) WHERE is_active = true;
```

### saved_jobs

Bookmarked jobs for candidates.

```sql
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_saved_jobs_candidate ON saved_jobs(candidate_id);
```

---

## Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
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

-- Companies: Public read for active, write for team members
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

-- Company Users: Team members can view their own company's team
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

-- Jobs: Public read for active, write for company team
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

CREATE POLICY "Company team can manage their jobs"
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

CREATE POLICY "Company team can delete their jobs"
    ON jobs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.company_id = jobs.company_id
            AND company_users.user_id = auth.uid()
            AND company_users.role = 'owner'
        )
    );

-- Candidates: Own profile only
CREATE POLICY "Candidates can view their own profile"
    ON candidates FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Candidates can update their own profile"
    ON candidates FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Candidates can insert their own profile"
    ON candidates FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employers can view searchable candidates"
    ON candidates FOR SELECT
    USING (
        is_searchable = true
        AND EXISTS (
            SELECT 1 FROM company_users
            WHERE company_users.user_id = auth.uid()
        )
    );

-- Applications: Candidates see own, employers see for their jobs
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

CREATE POLICY "Candidates can withdraw applications"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = applications.candidate_id
            AND candidates.user_id = auth.uid()
        )
    )
    WITH CHECK (status = 'withdrawn');

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

-- Job Alerts: Own only
CREATE POLICY "Candidates can manage their job alerts"
    ON job_alerts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = job_alerts.candidate_id
            AND candidates.user_id = auth.uid()
        )
    );

-- Saved Jobs: Own only
CREATE POLICY "Candidates can manage their saved jobs"
    ON saved_jobs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM candidates
            WHERE candidates.id = saved_jobs.candidate_id
            AND candidates.user_id = auth.uid()
        )
    );
```

---

## Functions & Triggers

### Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
```

### Job Slug Generation

```sql
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
```

### Application Counter

```sql
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
```

---

## Notes

1. **Brand as Tag**: `association_id` on jobs/companies is for filtering and theming, not data isolation. All RLS policies allow cross-brand access.

2. **pgvector**: Embedding columns and vector indexes are included but commented out until V1 AI features are implemented.

3. **Admin Access**: Admin RLS policies omitted from this draft—will be added via service role or separate admin policies.

4. **Subscriptions**: Stripe subscription tracking table not included in MVP scope—will be added in V1.

5. **Audit Logging**: Consider adding an `audit_log` table for tracking changes to sensitive data.
