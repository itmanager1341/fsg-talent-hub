# FSG Talent Hub – DEV PLAN (V2)

**Version:** 2.5
**Last Updated:** 2025-12-17
**Status:** In Progress
**Authors:** Development Team

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2025-12-16 | Dev Team | Initial V2 planning document |
| 2.1 | 2025-12-16 | Dev Team | Phase 1 (AI Resume Builder) complete |
| 2.2 | 2025-12-16 | Dev Team | Phase 2 (Vector Search) complete |
| 2.3 | 2025-12-16 | Dev Team | Phase 4 (Resume Database) complete |
| 2.4 | 2025-12-17 | Dev Team | Phase 5 (AI Applicant Ranking) complete |
| 2.5 | 2025-12-17 | Dev Team | Phase 6 (External Job Import) complete |

---

## Overview

V2 enhances the platform with AI-powered candidate features, vector search, and external job aggregation.

| Feature Category | Purpose | Priority | Status |
|------------------|---------|----------|--------|
| **AI Resume Builder** | Candidate resume optimization | High | ✅ Complete |
| **Vector Search (pgvector)** | Job/candidate matching | High | ✅ Complete |
| **Partner Program** | FSI/AMAA white-label instances | - | ❌ Deferred to V4 |
| **Resume Database** | Employer candidate search | High | ✅ Complete |
| **AI Applicant Ranking** | Employer hiring assistance | Medium | ✅ Complete |
| **External Job Import** | Multi-source job aggregation | High | ✅ Complete |

---

## V2 Feature Breakdown

### Phase 1: AI Resume Builder (High Priority) ✅ COMPLETE

**PRD Reference:** REQ: AI-001, Section 2.5

**Purpose:** Enable candidates to optimize their resumes using AI

#### Features
- [ ] Resume text extraction from uploaded PDF/DOCX (deferred - manual paste for now)
- [x] AI-powered resume analysis and suggestions
- [x] Section-by-section rewriting (summary, experience, skills)
- [x] ATS optimization scoring
- [x] Multiple resume versions (tailored per job)
- [x] Premium tier gating (optimization requires Premium)

#### Database Changes
```sql
-- Resume versions table
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) NOT NULL,
  version_name TEXT NOT NULL DEFAULT 'Default',
  original_text TEXT,
  optimized_text TEXT,
  ats_score INTEGER,
  suggestions JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI resume usage tracking (uses existing ai_usage_logs)
-- feature = 'resume_builder'
```

#### Edge Functions
| Function | Purpose | Auth | Status |
|----------|---------|------|--------|
| `analyze-resume` | Analyze resume, generate suggestions, ATS score | User JWT | ✅ Deployed |
| `optimize-resume` | AI rewrite sections | User JWT (Premium) | ✅ Deployed |

#### UI Components
| Component | Location | Status |
|-----------|----------|--------|
| Resume Builder Page | `src/app/account/candidate/resume/page.tsx` | ✅ Complete |
| Resume Builder Client | `src/app/account/candidate/resume/ResumeBuilder.tsx` | ✅ Complete |
| Server Actions | `src/app/account/candidate/resume/actions.ts` | ✅ Complete |

#### Rate Limits
| Tier | Analyses/day | Rewrites/day |
|------|--------------|--------------|
| Free | 1 | 0 |
| Career Plus | 5 | 10 |
| Career Pro | Unlimited | Unlimited |

---

### Phase 2: Vector Search with pgvector (High Priority) ✅ COMPLETE

**PRD Reference:** Section 1.2, 2.2

**Purpose:** Enable semantic job/candidate matching

#### Features
- [x] Enable pgvector extension in Supabase
- [x] Job embedding generation (on create/update)
- [x] Candidate embedding generation (on profile update)
- [x] Similar jobs API endpoint
- [x] Job recommendations for candidates
- [x] Candidate matching for employers (database function ready)

#### Database Changes
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns (1536 dimensions for OpenAI ada-002)
ALTER TABLE jobs ADD COLUMN embedding vector(1536);
ALTER TABLE candidates ADD COLUMN embedding vector(1536);

-- Create indexes for similarity search
CREATE INDEX idx_jobs_embedding ON jobs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_candidates_embedding ON candidates
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Similar jobs function
CREATE OR REPLACE FUNCTION get_similar_jobs(job_id UUID, match_count INT DEFAULT 5)
RETURNS TABLE (id UUID, title TEXT, similarity FLOAT)
AS $$
  SELECT j.id, j.title, 1 - (j.embedding <=> (SELECT embedding FROM jobs WHERE id = job_id)) as similarity
  FROM jobs j
  WHERE j.id != job_id AND j.status = 'active' AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> (SELECT embedding FROM jobs WHERE id = job_id)
  LIMIT match_count;
$$ LANGUAGE SQL;
```

#### Edge Functions
| Function | Purpose | Trigger | Status |
|----------|---------|---------|--------|
| `generate-embedding` | Create embeddings via OpenAI | Job/candidate create/update | ✅ Deployed |

#### UI Components
| Component | Location | Status |
|-----------|----------|--------|
| Similar Jobs Section | `src/app/jobs/[id]/SimilarJobs.tsx` | ✅ Complete |
| Recommended Jobs | `src/app/account/candidate/JobRecommendations.tsx` | ✅ Complete |
| Server Actions | `src/app/jobs/[id]/actions.ts` | ✅ Complete |

#### Database Functions (Deployed)
| Function | Purpose |
|----------|---------|
| `get_similar_jobs(job_id, count)` | Returns similar jobs based on embedding |
| `get_job_recommendations(candidate_id, count)` | Returns job recommendations for candidate |
| `get_matching_candidates(job_id, count)` | Returns matching candidates for a job |

---

### Phase 3: Partner Program ❌ DEFERRED TO V4

**Status:** Deferred - Will be implemented as V4 Partner Program

**Clarification (2024-12-23):** FSI and AMAA are not just "brand context layers" but will be **Partners** (resellers) hosting their own white-label instances, similar to [YMCareers](https://www.ymcareers.com/). This is a larger scope than originally planned and is deferred to V4.

**Original Scope (Now Deferred):**
- [ ] Brand context wrapper component
- [ ] FSI theme configuration (colors, logo, fonts)
- [ ] AM&AA theme configuration
- [ ] Brand-specific default filters
- [ ] Brand-specific hero content
- [ ] Cross-brand toggle UI
- [ ] WordPress embedding widget

**V4 Partner Program Scope (Future):**
- [ ] Multi-tenant white-label architecture
- [ ] Partner admin dashboard
- [ ] Partner-specific job boards
- [ ] Revenue sharing/billing model
- [ ] Custom domain support

#### Architecture
```
src/app/
├── (main)/           # Brand-agnostic routes
│   ├── jobs/
│   ├── companies/
│   └── ...
├── fsi/              # FSI brand context
│   ├── layout.tsx    # FSI theme provider
│   ├── page.tsx      # FSI homepage
│   └── jobs/
│       └── page.tsx  # FSI-filtered jobs
├── amaa/             # AMAA brand context
│   ├── layout.tsx    # AMAA theme provider
│   ├── page.tsx      # AMAA homepage
│   └── jobs/
│       └── page.tsx  # AMAA-filtered jobs
└── api/
    └── widget/       # Embeddable widget API
```

#### Database Usage
```sql
-- Associations table already exists
-- Update with theme configuration
UPDATE associations SET theme = '{
  "primaryColor": "#1e40af",
  "secondaryColor": "#3b82f6",
  "logo": "/logos/fsi-logo.svg",
  "font": "Inter"
}' WHERE slug = 'fsi';

UPDATE associations SET theme = '{
  "primaryColor": "#065f46",
  "secondaryColor": "#10b981",
  "logo": "/logos/amaa-logo.svg",
  "font": "Inter"
}' WHERE slug = 'amaa';
```

#### Components
| Component | Purpose |
|-----------|---------|
| `BrandContextProvider` | Theme and filter context |
| `BrandHeader` | Brand-specific navigation |
| `BrandHero` | Brand marketing content |
| `CrossBrandToggle` | "View all jobs" toggle |

#### Widget API
```typescript
// GET /api/widget/jobs?brand=fsi&limit=10
// Returns JSON for embedding on external sites

// Widget script
// <script src="https://jobs.fsgmedia.com/widget.js" data-brand="fsi"></script>
```

---

### Phase 4: Resume Database for Employers (High Priority) ✅ COMPLETE

**PRD Reference:** Section 2.4, V2

**Purpose:** Allow employers to search and browse candidate resumes

#### Features
- [x] Candidate search page for employers
- [x] Advanced filters (skills, experience, location, availability)
- [x] Resume preview modal
- [x] Contact/invite to apply functionality
- [x] Saved candidates list
- [x] Premium tier gating (Starter+ only)
- [x] Candidate invitations shown in candidate dashboard

#### Database Changes
```sql
-- Saved candidates table
CREATE TABLE saved_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  candidate_id UUID REFERENCES candidates(id) NOT NULL,
  saved_by UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, candidate_id)
);

-- Candidate invitations
CREATE TABLE candidate_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) NOT NULL,
  candidate_id UUID REFERENCES candidates(id) NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, viewed, applied, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- RLS policies
CREATE POLICY employer_view_searchable_candidates ON candidates
  FOR SELECT USING (
    is_searchable = true
    AND is_active = true
    AND EXISTS (
      SELECT 1 FROM company_users cu
      JOIN companies c ON cu.company_id = c.id
      WHERE cu.user_id = auth.uid()
      AND c.tier IN ('standard', 'professional', 'enterprise')
    )
  );
```

#### UI Components
| Component | Location |
|-----------|----------|
| Candidate Search | `src/app/employers/candidates/page.tsx` |
| Candidate Profile Modal | `src/components/employer/CandidatePreview.tsx` |
| Invite to Apply Button | `src/components/employer/InviteButton.tsx` |
| Saved Candidates | `src/app/employers/candidates/saved/page.tsx` |

---

### Phase 5: AI Applicant Ranking (Medium Priority) ✅ COMPLETE

**PRD Reference:** REQ: AI-001, Section 2.4

**Purpose:** Help employers identify best-fit candidates

#### Features
- [x] AI-powered match scoring for applications
- [x] Ranking criteria configuration (ranking_criteria column)
- [x] Match explanation display with category breakdown
- [x] Bulk ranking for job applicants
- [x] Premium tier gating (Professional+ only)
- [x] Sort applications by AI score
- [ ] Automatic ranking on application submit (deferred - manual trigger for now)

#### Database Changes
```sql
-- applications table already has:
-- ai_match_score NUMERIC
-- ai_match_reasons JSONB

-- Add ranking configuration
ALTER TABLE jobs ADD COLUMN ranking_criteria JSONB DEFAULT '{}';
-- Example: { "required_skills": ["React", "TypeScript"], "experience_years": 5 }
```

#### Edge Functions
| Function | Purpose | Auth | Status |
|----------|---------|------|--------|
| `rank-applicant` | Score candidate vs job | User JWT (Professional+) | ✅ Deployed |

#### UI Components
| Component | Location | Status |
|-----------|----------|--------|
| Match Score Badge | `src/components/employer/MatchScoreBadge.tsx` | ✅ Complete |
| Match Explanation | `src/components/employer/MatchExplanation.tsx` | ✅ Complete |
| Bulk Rank Button | `src/app/employers/jobs/[id]/applications/BulkRankButton.tsx` | ✅ Complete |
| Applications Page | `src/app/employers/jobs/[id]/applications/page.tsx` | ✅ Updated |

#### Rate Limits
| Tier | Rankings/day |
|------|--------------|
| Free | 0 |
| Starter | 10 |
| Professional | 100 |
| Enterprise | Unlimited |

---

### Phase 6: External Job Import System (High Priority) ✅ COMPLETE

**Purpose:** Aggregate jobs from external sources (APIs, RSS feeds) to populate the platform

#### Features
- [x] Multi-source job ingestion (Indeed, Jooble, Adzuna, RSS feeds)
- [x] Admin portal for source management (`/admin/job-sources`)
- [x] Import queue with approval workflow
- [x] Quality scoring and monitoring dashboard
- [x] Duplicate detection system
- [x] Company matching (match external jobs to existing companies)
- [x] Employer prospecting (identify new employer leads from imported jobs)
- [x] HubSpot CRM integration for lead creation
- [x] Feed discovery tool for RSS sources

#### Database Schema
```sql
-- Job sources configuration
CREATE TABLE job_sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'indeed', 'jooble', 'adzuna', 'rss', 'generic_rss'
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External jobs staging
CREATE TABLE external_jobs (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES job_sources(id),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT,
  matched_company_id UUID REFERENCES companies(id),
  status TEXT DEFAULT 'pending', -- pending, matched, imported, rejected, duplicate
  quality_score INTEGER,
  raw_data JSONB,
  UNIQUE(source_id, external_id)
);

-- Sync history tracking
CREATE TABLE job_sync_logs (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES job_sources(id),
  status TEXT, -- success, failed, partial
  jobs_found INTEGER,
  jobs_new INTEGER,
  jobs_updated INTEGER,
  jobs_duplicates INTEGER,
  errors JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

#### Edge Functions
| Function | Purpose | Status |
|----------|---------|--------|
| `sync-job-source` | Fetch jobs from external sources | ✅ Deployed |
| `process-external-jobs` | Match and import external jobs | ✅ Deployed |
| `create-hubspot-lead` | Create employer leads in HubSpot | ✅ Deployed |

#### Services
| Service | Location | Purpose |
|---------|----------|---------|
| job-import.ts | `src/lib/services/` | Core import orchestration |
| job-normalization.ts | `src/lib/services/` | Normalize job data across sources |
| company-matching.ts | `src/lib/services/` | Match jobs to existing companies |
| duplicate-detection.ts | `src/lib/services/` | Identify duplicate postings |
| source-quality.ts | `src/lib/services/` | Calculate quality scores |
| rss-parser.ts | `src/lib/services/` | Parse RSS/Atom feeds |
| feed-discovery.ts | `src/lib/services/` | Discover feeds from websites |

#### UI Components
| Component | Location | Status |
|-----------|----------|--------|
| Job Sources List | `/admin/job-sources` | ✅ Complete |
| Source Configuration | `/admin/job-sources/[id]` | ✅ Complete |
| Import Queue | `/admin/job-sources/imports` | ✅ Complete |
| Feed Discovery | `/admin/job-sources/feeds` | ✅ Complete |
| Quality Dashboard | `/admin/job-sources` (metrics) | ✅ Complete |
| Employer Prospecting | `/admin/job-sources/prospecting` | ✅ Complete |

#### External Source Status
| Source | API Status | Implementation |
|--------|------------|----------------|
| Indeed | RSS deprecated, Publisher API required | ✅ Ready (awaiting API approval) |
| Jooble | Free API available | ✅ Complete |
| Adzuna | Free tier (10K/month) | ✅ Complete |
| Generic RSS | Any valid feed | ✅ Complete |

#### Documentation
| Document | Purpose |
|----------|---------|
| `docs/JOB_SOURCE_STRATEGY.md` | Strategy and legal compliance |
| `docs/JOB_POPULATION_AUDIT.md` | Implementation audit |
| `docs/INDEED_API_SETUP.md` | Indeed-specific setup guide |
| `docs/SYNC_TROUBLESHOOTING.md` | Troubleshooting guide |

---

## Implementation Order

| Phase | Feature | Estimated Effort | Dependencies | Status |
|-------|---------|------------------|--------------|--------|
| 1 | AI Resume Builder | 1-2 weeks | None | ✅ Complete |
| 2 | Vector Search | 1 week | pgvector extension | ✅ Complete |
| 3 | Brand Context Layers | 1-2 weeks | None | Pending |
| 4 | Resume Database | 1 week | Phase 2 (for matching) | ✅ Complete |
| 5 | AI Applicant Ranking | 1 week | Phase 2 (embeddings) | ✅ Complete |
| 6 | External Job Import | 1-2 weeks | None | ✅ Complete |

---

## Technical Considerations

### pgvector Setup
```bash
# Supabase already has pgvector available
# Enable via SQL:
CREATE EXTENSION IF NOT EXISTS vector;
```

### OpenAI Embedding Costs
| Model | Cost per 1K tokens | Dimensions |
|-------|-------------------|------------|
| text-embedding-ada-002 | $0.0001 | 1536 |
| text-embedding-3-small | $0.00002 | 1536 |

**Recommendation:** Use `text-embedding-3-small` for cost efficiency

### Rate Limiting (AI Features)
| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Resume analyses | 1/day | 5/day | 20/day | Unlimited |
| Resume rewrites | 0 | 10/day | 50/day | Unlimited |
| Applicant rankings | 0 | 10/day | 100/day | Unlimited |

---

## Migration from V1

### Database Migrations Needed
1. `20251217_resume_versions` - Resume builder tables
2. `20251217_pgvector_setup` - Enable pgvector, add embedding columns
3. `20251217_candidate_search` - Saved candidates, invitations
4. `20251217_ranking_criteria` - Job ranking configuration

### Edge Function Updates
1. Deploy `analyze-resume` function
2. Deploy `optimize-resume` function
3. Deploy `generate-embedding` function
4. Deploy `rank-applicant` function

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| AI Resume Builder | Usage rate | 30% of premium candidates |
| Vector Search | Click-through on recommendations | 15% |
| Brand Context | FSI/AMAA traffic share | 40% branded, 60% main |
| Resume Database | Employer searches/week | 50+ |
| AI Ranking | Ranking accuracy (hired from top 3) | 60% |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| pgvector performance | Index tuning, pagination limits |
| AI cost overruns | Strict rate limits, caching |
| Brand confusion | Clear UI indicators, easy toggle |
| Privacy (resume search) | Candidate opt-in controls |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/01_PRD_Job_Board_Platform.md` | Full product requirements |
| `docs/DEV_PLAN_v1.md` | V1 implementation (complete) |
| `docs/DEV_PLAN.md` | V0 implementation guide |

---

**Document End**
