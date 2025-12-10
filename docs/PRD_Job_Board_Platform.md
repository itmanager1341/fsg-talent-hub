# FSG Job Board Platform - Product Requirements Document

**Version:** 1.0  
**Date:** 2025-12-10  
**Status:** ✅ Approved by Senior Development Team  
**Owners:** FSG Media (Product), Development Team

---

## Executive Summary

Build a unified, AI-powered job board platform at **jobs.fsgmedia.com** supporting multiple associations (FSI, AM&AA, and future partners) with a multi-brand marketplace, employer recruitment portal, candidate career platform, and revenue engine.

### Core Value Propositions
- **Employers**: Quality applicant pipeline with AI-enhanced matching
- **Candidates**: Modern job search with AI resume tools
- **FSG**: Revenue generation and member engagement platform
- **Associations**: Private-label white-label capabilities

---

## 1. Technical Architecture

### 1.1 System Design

**Architecture Pattern**: Brand-Agnostic Core Platform with Brand-Specific Context Views

**CRITICAL CONCEPT**: 
- **jobs.fsgmedia.com** = Complete, brand-agnostic job board platform (ALL functionality)
- **jobs.fsgmedia.com/fsi** = Brand-filtered view with FSI theming
- **jobs.fsgmedia.com/amaa** = Brand-filtered view with AM&AA theming
- **jobs.fsgmedia.com/admin** = Administrative interface

```
┌─────────────────────────────────────────────────────────────────┐
│              jobs.fsgmedia.com (Main Platform)                  │
│         Brand-Agnostic • Full Feature Set • All Jobs           │
│                                                                 │
│  Core Pages:                                                   │
│  • /jobs → All jobs across all brands                         │
│  • /companies → All companies                                  │
│  • /employers → Employer portal                               │
│  • /candidates → Candidate portal                             │
│  • /about → Platform information                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Brand Context Views (Layers)                  │
│                                                                 │
│  /fsi/*                    /amaa/*                /admin/*     │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────┐ │
│  │ FSI Theme    │         │ AMAA Theme   │      │ Admin    │ │
│  │ FSI Filters  │         │ AMAA Filters │      │ Controls │ │
│  │ FSI Content  │         │ AMAA Content │      │ All Data │ │
│  └──────────────┘         └──────────────┘      └──────────┘ │
│                                                                 │
│  Same routes as main platform, just themed/filtered:           │
│  • /fsi/jobs → FSI-focused jobs                               │
│  • /amaa/jobs → AM&AA-focused jobs                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Unified Backend (Supabase)                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Single Postgres DB • RLS • pgvector • Auth • Storage    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Integrations                        │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐            │
│  │ HubSpot  │      │ Stripe   │      │OpenRouter│            │
│  └──────────┘      └──────────┘      └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Supabase | Database, Auth, Storage, RLS |
| **Frontend** | React/Next.js | UI Framework |
| **AI** | OpenRouter | LLM routing for JD/Resume generation |
| **Vector DB** | pgvector | Job/candidate similarity matching |
| **Payments** | Stripe | Billing and subscriptions |
| **CRM** | HubSpot | Company data sync |
| **Queue** | Supabase Edge Functions | Async job processing |

### 1.3 Development Philosophy: Brand-Agnostic Core First

**Phase 1: Build the Complete Platform (Brand-Agnostic)**
- Develop full functionality at **jobs.fsgmedia.com**
- NO brand-specific logic in core features
- Neutral design system and theming
- All jobs visible by default (cross-brand discovery)
- Complete feature set:
  - Job search & filtering
  - Employer portal
  - Candidate portal  
  - Admin dashboard
  - AI features
  - Payment processing

**Phase 2: Layer Brand Contexts**
- Create brand context wrapper at **/fsi** and **/amaa**
- Apply brand-specific:
  - Theme (colors, logos, fonts)
  - Default filters (show relevant jobs first)
  - Marketing content
  - Navigation links
- Brand contexts inherit ALL functionality from main platform
- No duplicate code - just configuration layers

**Why This Approach?**
1. ✅ **Single Source of Truth**: One codebase, easier maintenance
2. ✅ **Cross-Brand Discovery**: Users can see ALL jobs if desired
3. ✅ **Easier Testing**: Test once on main platform
4. ✅ **Faster Feature Development**: Build once, available everywhere
5. ✅ **Scalable**: Adding new brands = adding new config, not new code
6. ✅ **Better User Experience**: Users can explore beyond their primary brand

**Implementation Pattern**:
```typescript
// Main platform (brand-agnostic)
// Route: /jobs
<JobSearchPage 
  defaultFilters={{}} 
  theme={neutralTheme}
  showAllBrands={true}
/>

// FSI brand context
// Route: /fsi/jobs  
<BrandContextWrapper brand="fsi">
  <JobSearchPage 
    defaultFilters={{ industry: 'mortgage_servicing' }}
    theme={fsiTheme}
    showAllBrands={false} // but user can toggle to see all
  />
</BrandContextWrapper>

// AMAA brand context
// Route: /amaa/jobs
<BrandContextWrapper brand="amaa">
  <JobSearchPage 
    defaultFilters={{ profession: 'mna_advisory' }}
    theme={amaaTheme}
    showAllBrands={false}
  />
</BrandContextWrapper>
```

### 1.4 Database Architecture

**Core Principle**: Brand is a **context/filter**, not a data isolation mechanism.

**Core Tables:**
- `associations` - Brand definitions (FSI, AM&AA, future partners)
- `companies` - Employer profiles (synced with HubSpot)
- `jobs` - Job postings (tagged with association, but visible across platform)
- `candidates` - User profiles (can apply to jobs from any brand)
- `applications` - Job applications (cross-brand compatible)
- `subscriptions` - Stripe subscription tracking
- `embeddings` - Vector embeddings for matching

**Critical Design Decision**:
```sql
-- Jobs table includes association_id as a TAG, not a PARTITION
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  association_id UUID REFERENCES associations(id), -- Brand tag
  title TEXT NOT NULL,
  description TEXT,
  -- ... other fields
  
  -- NO RLS restriction by association!
  -- Users can see jobs from ALL brands by default
);

-- Brand filtering is done at APPLICATION LEVEL, not database level
SELECT * FROM jobs 
WHERE status = 'active'
-- Brand filter applied only when user is in brand context:
-- AND association_id = $1  (only when on /fsi or /amaa)
```

**Key Indexes**:
```sql
-- Performance-critical indexes
CREATE INDEX idx_jobs_brand_industry ON jobs(association_id, industry);
CREATE INDEX idx_jobs_location ON jobs USING GIN (location);
CREATE INDEX idx_jobs_vector ON jobs USING ivfflat (embedding vector_cosine_ops);

-- But also index for cross-brand search
CREATE INDEX idx_jobs_search_all ON jobs(status, created_at DESC)
WHERE status = 'active';
```

**Brand Context Configuration**:
```sql
-- Brand configuration controls theming and defaults, not access
CREATE TABLE associations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,              -- "Five Star Institute"
  slug TEXT UNIQUE NOT NULL,       -- "fsi"
  domain TEXT,                     -- For future private-label
  
  -- UI Configuration
  theme JSONB NOT NULL,            -- Colors, logos, fonts
  
  -- Default Filters (suggestions, not restrictions)
  default_filters JSONB,           -- { industry: 'mortgage_servicing' }
  
  -- Marketing Content
  hero_title TEXT,
  hero_description TEXT,
  featured_companies UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 URL Structure & Routing

**Main Platform Routes** (Brand-Agnostic):
```
jobs.fsgmedia.com/                    → Homepage (all brands)
jobs.fsgmedia.com/jobs                → Job search (all jobs)
jobs.fsgmedia.com/jobs/:id            → Job details
jobs.fsgmedia.com/companies           → Company directory
jobs.fsgmedia.com/companies/:id       → Company profile

jobs.fsgmedia.com/employers           → Employer portal
jobs.fsgmedia.com/employers/signup    → Employer registration
jobs.fsgmedia.com/employers/dashboard → Employer dashboard
jobs.fsgmedia.com/employers/jobs/new  → Post new job

jobs.fsgmedia.com/candidates          → Candidate portal
jobs.fsgmedia.com/candidates/signup   → Candidate registration  
jobs.fsgmedia.com/candidates/profile  → Candidate profile
jobs.fsgmedia.com/candidates/resume   → Resume builder

jobs.fsgmedia.com/admin              → Admin portal
```

**Brand Context Routes** (Themed/Filtered Views):
```
jobs.fsgmedia.com/fsi                 → FSI homepage
jobs.fsgmedia.com/fsi/jobs            → FSI jobs (filtered)
jobs.fsgmedia.com/fsi/jobs/:id        → Job details (FSI theme)
jobs.fsgmedia.com/fsi/companies       → FSI companies

jobs.fsgmedia.com/amaa                → AMAA homepage
jobs.fsgmedia.com/amaa/jobs           → AMAA jobs (filtered)
jobs.fsgmedia.com/amaa/jobs/:id       → Job details (AMAA theme)
jobs.fsgmedia.com/amaa/companies      → AMAA companies
```

**Key Routing Principles**:
1. Brand context routes mirror main platform routes
2. Brand context is determined by URL prefix (/fsi, /amaa)
3. Same components, different configurations
4. Users can navigate between contexts freely
5. Deep links work across all contexts

**Routing Implementation**:
```typescript
// Route configuration
const routes = {
  // Main platform
  '/': HomePage,
  '/jobs': JobSearchPage,
  '/jobs/:id': JobDetailsPage,
  
  // Brand contexts (same components, different props)
  '/fsi': HomePage, // with brandContext='fsi'
  '/fsi/jobs': JobSearchPage, // with brandContext='fsi'
  '/fsi/jobs/:id': JobDetailsPage, // with brandContext='fsi'
  
  '/amaa': HomePage, // with brandContext='amaa'
  '/amaa/jobs': JobSearchPage, // with brandContext='amaa'
  '/amaa/jobs/:id': JobDetailsPage, // with brandContext='amaa'
};
```

---

## 2. Feature Requirements

### 2.1 Multi-Brand System (REQ: SYS-001, SYS-010)

**Requirement**: Support multiple associations via themed context layers over brand-agnostic core platform

**Architecture Overview**:
```
Main Platform (jobs.fsgmedia.com)
    ↓
Brand Context Layer (/fsi, /amaa)
    ↓
Same Features, Different Presentation
```

**Core Platform (jobs.fsgmedia.com)**:
- Complete, brand-agnostic functionality
- Shows ALL jobs by default (cross-brand discovery)
- Neutral design system
- No brand-specific business logic
- Users can filter by brand if desired

**Brand Context Pages (/fsi/*, /amaa/*)** :
- Inherit ALL functionality from main platform
- Apply brand-specific theme (colors, logos, fonts)
- Apply default filters (show relevant jobs first)
- Add brand-specific marketing content
- Provide brand-specific navigation
- Users can still toggle to see all brands

**Implementation**:
```typescript
interface BrandContext {
  id: string;
  slug: string; // 'fsi', 'amaa'
  name: string;
  
  // UI Theming
  theme: {
    primaryColor: string;
    logo: string;
    font: string;
    // ... other theme properties
  };
  
  // Default Filters (not restrictions!)
  defaultFilters: {
    industry?: string[];
    profession?: string[];
    // User can always clear these
  };
  
  // Marketing Content
  hero: {
    title: string;
    description: string;
    cta: string;
  };
  
  // Optional custom domain for white-label
  customDomain?: string; // e.g., jobs.amaaonline.com
}

// Usage in application
function JobsPage({ brandContext }: { brandContext?: BrandContext }) {
  // If brandContext is provided, apply defaults
  // Otherwise, show all jobs (main platform behavior)
  const initialFilters = brandContext?.defaultFilters || {};
  
  return (
    <JobSearch 
      defaultFilters={initialFilters}
      theme={brandContext?.theme || neutralTheme}
      allowCrossBrand={true} // ALWAYS allow users to see all
    />
  );
}
```

**Key Principles**:
1. ✅ Brand is a **presentation layer**, not a data partition
2. ✅ All features work identically across brand contexts
3. ✅ Users benefit from cross-brand job discovery
4. ✅ Single codebase, multiple themes
5. ✅ Easy to add new brands (just configuration)

**Development Order**:
1. **First**: Build complete platform at jobs.fsgmedia.com (brand-agnostic)
2. **Then**: Create brand context wrappers at /fsi and /amaa
3. **Finally**: Test that ALL features work in all contexts

### 2.2 Job Search & Discovery (REQ: FRNT-001, FRNT-002, FRNT-003)

**Core Features**:
- Advanced filtering (keyword, location, remote, industry, profession, experience)
- URL-driven filters for shareability
- Vector-based job recommendations
- Pagination and infinite scroll support

**Search Implementation**:
```sql
-- Example query with brand context
SELECT j.*, ts_rank(to_tsvector(j.title || ' ' || j.description), query) as rank
FROM jobs j
WHERE j.association_id = $1
  AND j.status = 'active'
  AND to_tsvector(j.title || ' ' || j.description) @@ query
ORDER BY rank DESC, j.created_at DESC
LIMIT 20 OFFSET $2;
```

### 2.3 AI-Powered Features (REQ: AI-001)

**Features**:
1. **Job Description Generator** (Employer)
2. **Resume Builder** (Candidate)
3. **Applicant Ranking** (Employer - Premium)
4. **Job Matching** (Candidate)
5. **Quality Monitoring** (Admin)

**AI Integration Pattern**:
```typescript
// Supabase Edge Function
export async function generateJobDescription(req: Request) {
  const { title, company, requirements } = await req.json();
  
  // Rate limiting check
  await checkRateLimit(req.user.id);
  
  // OpenRouter call
  const response = await openrouter.chat.completions.create({
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      { role: "system", content: JD_SYSTEM_PROMPT },
      { role: "user", content: generatePrompt(title, company, requirements) }
    ]
  });
  
  // Cache result
  await cacheResponse(req.user.id, response);
  
  return response.choices[0].message.content;
}
```

### 2.4 Employer Portal (REQ: EP-001 - EP-005)

**Features**:
- Multi-user team management
- Job posting with AI assistance
- Applicant inbox with AI ranking
- Analytics dashboard
- Upgrade path (Free → Standard → Premium)

**Team Permissions**:
```typescript
enum EmployerRole {
  OWNER = 'owner',       // Full access
  RECRUITER = 'recruiter', // Job management
  BILLING = 'billing'    // Payment management
}
```

### 2.5 Candidate Portal (REQ: CP-001 - CP-006)

**Features**:
- Profile creation with resume upload
- AI resume builder/optimizer
- Job alerts and recommendations
- Application tracking
- Upgrade path (Free → Plus → Pro)

### 2.6 Admin Portal (REQ: ADM-001 - ADM-005)

**Features**:
- Full CRUD for jobs, companies, candidates
- HubSpot sync management
- Company profile approval queue
- AI quality flags review
- Analytics dashboards
- Scraping job management

---

## 3. Integration Requirements

### 3.1 HubSpot Integration

**Sync Strategy**: Bidirectional with conflict resolution

**Data Flow**:
```
HubSpot Company → Platform Company (read)
Platform Company Overrides → Pending Approval → HubSpot (write)
```

**Fields to Sync**:
- Company name, website, description
- Industry, size, location
- Membership status (FSI/AM&AA)
- Contact information

**Implementation**:
```typescript
interface CompanySync {
  hubspot_id: string;
  last_synced_at: timestamp;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
  local_overrides: Record<string, any>;
  pending_approval: boolean;
}
```

### 3.2 Stripe Integration (REQ: BILL-002, BILL-010, BILL-011, BILL-020)

**Components**:
- Stripe Checkout for subscriptions
- Customer Portal for management
- Webhooks for event handling
- Pricing rules with member discounts

**Pricing Logic**:
```typescript
interface PricingRule {
  association_id: string;
  membership_level: string;
  discount_percentage: number;
  applies_to: 'tier' | 'product_id';
}

function calculatePrice(base: number, user: User): number {
  const rules = getPricingRules(user.association_id, user.membership_level);
  const discount = rules.reduce((acc, rule) => acc + rule.discount_percentage, 0);
  return base * (1 - discount / 100);
}
```

**Webhook Events**:
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 3.3 WordPress Widget Embedding (REQ: FRNT-006)

**Purpose**: Embed job feeds on association websites

**Implementation**:
```javascript
// Embeddable widget script
<script src="https://jobs.fsgmedia.com/widget.js"></script>

<!-- Option 1: Brand-filtered widget -->
<div 
  data-fsg-jobs-widget 
  data-brand="fsi"          <!-- Shows FSI-focused jobs -->
  data-limit="10"
  data-theme="light"
></div>

<!-- Option 2: All jobs widget -->
<div 
  data-fsg-jobs-widget 
  data-brand="all"          <!-- Shows all jobs across brands -->
  data-limit="10"
  data-theme="light"
></div>
```

**API Endpoint**:
```
GET /api/jobs?limit=10&page=1                    # All jobs
GET /api/jobs?brand=fsi&limit=10&page=1          # FSI-focused
GET /api/jobs?brand=amaa&limit=10&page=1         # AMAA-focused
```

**Widget Features**:
- Responsive design
- Themeable (light/dark modes)
- Clickthrough to main platform
- Optional filters (location, remote, industry)
- Pagination support

**Embedding Sites**:
- thefivestar.com → FSI widget
- amaaonline.com → AMAA widget
- fsgmedia.com → All jobs widget

---

## 4. Pricing Structure

### 4.1 Employer Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 active job, basic profile, applicant inbox |
| **Standard** | $199-299/job or $249/mo | 5 jobs, AI JD, resume search (limited), featured |
| **Premium** | $499-699/mo | Unlimited jobs, AI ranking, priority support, newsletter |

**Member Discounts**: Automatic based on HubSpot membership status

### 4.2 Candidate Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Profile, resume upload, basic AI review, apply, alerts |
| **Career Plus** | $9-14/mo | AI resume rewrite, cover letters, enhanced recommendations |
| **Career Pro** | $19-29/mo | Full AI overhaul, interview prep, visibility boost |

---

## 5. Security & Compliance (REQ: SEC-001, SEC-005)

### 5.1 Authentication
- Supabase Auth (email/password + OAuth)
- Multi-role system: admin, employer, candidate
- JWT-based API authorization

### 5.2 Row-Level Security (RLS)

**Critical Policies**:
```sql
-- Employers can only access their own jobs
CREATE POLICY employer_jobs ON jobs
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM company_users 
      WHERE company_id = jobs.company_id
    )
  );

-- Candidates can only access their own applications
CREATE POLICY candidate_applications ON applications
  FOR ALL USING (auth.uid() = candidate_id);

-- Admin full access
CREATE POLICY admin_access ON jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 5.3 Data Protection
- PII encrypted at rest
- Signed URLs for resume downloads
- GDPR/CCPA compliant data deletion
- No sensitive data in client-side storage

### 5.4 Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| AI endpoints | 10 req/min per user |
| HubSpot sync | Queued with deduplication |
| Public search | Cached, throttled |

---

## 6. Development Roadmap

### V0 - Foundation (Weeks 1-3)
**Goal**: Build brand-agnostic core platform infrastructure

- [ ] Supabase database schema (brand as tag, not partition)
- [ ] RLS policies (employer/candidate isolation, NOT brand isolation)
- [ ] Authentication and role management (admin/employer/candidate)
- [ ] Basic job CRUD operations (no brand filtering yet)
- [ ] Employer/candidate account setup
- [ ] Initial HubSpot sync configuration
- [ ] Stripe test environment setup
- [ ] **Design system foundations (neutral/agnostic theme)**
- [ ] Core routing structure at jobs.fsgmedia.com

**Critical V0 Principle**: Everything built at this stage is brand-agnostic.

### V1 - Public Launch (Weeks 4-8)
**Goal**: Complete main platform + add brand context layers

**Part A: Complete Main Platform (jobs.fsgmedia.com)**
- [ ] Full job search with advanced filters (all jobs visible)
- [ ] Employer portal (post, edit, view applicants)
- [ ] Candidate portal (profile, resume, alerts)
- [ ] AI job description generator
- [ ] AI resume builder
- [ ] AI job recommendations (vector search)
- [ ] Member pricing rules implementation
- [ ] Basic employer analytics
- [ ] Admin portal v1 (CRUD + flags)

**Part B: Brand Context Layers (/fsi, /amaa)**
- [ ] Brand context wrapper component
- [ ] FSI theme configuration (colors, logo, fonts)
- [ ] AM&AA theme configuration
- [ ] Brand-specific default filters
- [ ] Brand-specific marketing content (hero, featured companies)
- [ ] Brand navigation customization
- [ ] WordPress embedding widget (with brand parameter)
- [ ] Cross-brand toggle UI (allow users to see all jobs)

**Testing**:
- [ ] Verify all features work identically in main platform and brand contexts
- [ ] Test cross-brand job discovery
- [ ] Validate theme switching

### V2 - Enhanced Platform (Weeks 9-12)
- [ ] Resume database for employers
- [ ] AI applicant ranking
- [ ] Full employer analytics dashboard
- [ ] AI job quality monitoring
- [ ] HubSpot bidirectional sync
- [ ] Job scraping engine for lead generation
- [ ] Company profile override approval queue
- [ ] Embedding optimization

### V3 - ATS Layer (Weeks 13-16)
- [ ] Employer applicant pipeline
- [ ] Candidate stage tracking (Applied → Offer)
- [ ] Messaging threads
- [ ] Interview scheduling
- [ ] Evaluations and scoring
- [ ] Candidate premium tiers (Plus, Pro)
- [ ] Advanced resume optimizer
- [ ] AI interview prep simulations

### V4 - Private Label (Weeks 17-20)
- [ ] Custom domain support (jobs.partnerdomain.com)
- [ ] Theme override system
- [ ] Partner portal configuration
- [ ] Shared job network logic
- [ ] Revenue sharing model
- [ ] Partner analytics dashboard

---

## 7. Success Metrics

### 7.1 Employer KPIs
- Number of registered employers
- Job postings per month
- Subscription renewal rate
- Average applicant match score
- Employer NPS

### 7.2 Candidate KPIs
- Candidate signups
- Resume upload rate
- Activation rate (resume + alerts)
- Applications per candidate
- Premium conversion rate

### 7.3 Platform KPIs
- Total job views
- Total applications
- Traffic by brand (FSI vs AM&AA)
- Vector search accuracy
- AI usage statistics

### 7.4 Revenue KPIs
- Monthly Recurring Revenue (MRR)
- Employer vs candidate revenue ratio
- Average revenue per employer
- Member discount utilization
- AI cost per transaction

### 7.5 Technical KPIs
- HubSpot sync success rate (target: >99%)
- AI response latency (target: <3s)
- Search query performance (target: <500ms)
- Uptime (target: 99.9%)

---

## 8. Technical Risks & Mitigations

### Risk 1: AI Cost Overruns
**Severity**: High  
**Mitigation**:
- Implement caching layer for common requests
- Set usage quotas per pricing tier
- Monitor and alert on anomalous usage
- Use cheaper models for non-critical features

### Risk 2: HubSpot Data Conflicts
**Severity**: Medium  
**Mitigation**:
- Implement conflict resolution UI
- Queue sync operations with retry logic
- Maintain audit log of all syncs
- Admin approval for sensitive overrides

### Risk 3: Vector Search Performance
**Severity**: Medium  
**Mitigation**:
- Index optimization on embeddings
- Materialized views for common queries
- Pagination limits
- Background reindexing during off-peak

### Risk 4: Multi-Tenant Data Leakage
**Severity**: Critical  
**Mitigation**:
- Comprehensive RLS testing
- Automated security scans
- Regular penetration testing
- Code review for all data access queries

### Risk 5: Stripe Webhook Reliability
**Severity**: Medium  
**Mitigation**:
- Idempotent webhook handlers
- Signature verification
- Retry logic with exponential backoff
- Manual reconciliation tools

---

## 9. Open Questions & Decisions Needed

1. **Confidential Listings**: Should employers be able to post anonymous job listings?
   - **Recommendation**: Yes, but require premium tier + admin approval

2. **Resume Visibility**: Should candidates control which employers see their resume?
   - **Recommendation**: V3 feature - "Private mode" toggle

3. **Event Integration**: Should FSI/AM&AA event attendees get job recommendations?
   - **Recommendation**: Yes, via Swoogo integration in V4

4. **Mobile App**: Native mobile app or PWA?
   - **Recommendation**: PWA first, native app in V5

5. **Salary Transparency**: Required, optional, or hidden?
   - **Recommendation**: Optional in V1, explore transparency in V2

---

## 10. API Specifications

### 10.1 Core Endpoints

#### Jobs API
```typescript
GET    /api/jobs                    // List jobs with filters
GET    /api/jobs/:id                // Get job details
POST   /api/jobs                    // Create job (employer)
PUT    /api/jobs/:id                // Update job (employer)
DELETE /api/jobs/:id                // Delete job (employer)
POST   /api/jobs/:id/apply          // Apply to job (candidate)
GET    /api/jobs/:id/similar        // Get similar jobs (vector)
POST   /api/jobs/generate-jd        // AI job description
```

#### Companies API
```typescript
GET    /api/companies/:id           // Get company profile
PUT    /api/companies/:id           // Update company
POST   /api/companies/sync-hubspot  // Trigger HubSpot sync
GET    /api/companies/:id/jobs      // List company jobs
```

#### Candidates API
```typescript
GET    /api/candidates/me           // Get current candidate
PUT    /api/candidates/me           // Update profile
POST   /api/candidates/resume       // Upload resume
POST   /api/candidates/ai-resume    // AI resume builder
GET    /api/candidates/applications // List applications
POST   /api/candidates/alerts       // Create job alert
```

#### Admin API
```typescript
GET    /api/admin/analytics         // Platform analytics
GET    /api/admin/pending-approvals // Company overrides queue
POST   /api/admin/jobs/:id/flag     // Flag job for review
GET    /api/admin/scraping-jobs     // Scraping queue status
POST   /api/admin/sync-hubspot      // Force HubSpot sync
```

### 10.2 Webhook Endpoints
```typescript
POST   /api/webhooks/stripe         // Stripe events
POST   /api/webhooks/hubspot        // HubSpot events
```

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Database functions and triggers
- API endpoint handlers
- Business logic (pricing, matching)
- AI prompt generation

### 11.2 Integration Tests
- HubSpot sync workflows
- Stripe payment flows
- Email notification delivery
- Vector search accuracy

### 11.3 E2E Tests
- Employer job posting flow
- Candidate application flow
- Admin approval workflows
- Multi-brand routing

### 11.4 Security Tests
- RLS policy validation
- Authentication bypass attempts
- XSS and injection testing
- Rate limiting effectiveness

### 11.5 Performance Tests
- Job search query benchmarks
- Vector search latency
- Concurrent user simulations
- Database connection pooling

---

## 12. Deployment Strategy

### 12.1 Environment Setup
- **Development**: Local Supabase instance
- **Staging**: Supabase staging project
- **Production**: Supabase production with backups

### 12.2 CI/CD Pipeline
```yaml
Pipeline:
  1. Code push to GitHub
  2. Automated tests run
  3. Build frontend assets
  4. Deploy Supabase migrations
  5. Deploy Edge Functions
  6. Deploy frontend to Vercel/Netlify
  7. Smoke tests
  8. Production deployment
```

### 12.3 Rollback Plan
- Database migration rollback scripts
- Frontend version rollback (Vercel)
- Feature flags for gradual rollouts

---

## 13. Documentation Requirements

### 13.1 Technical Documentation
- [ ] Database schema documentation
- [ ] API documentation (OpenAPI spec)
- [ ] RLS policy documentation
- [ ] Deployment runbooks

### 13.2 User Documentation
- [ ] Employer onboarding guide
- [ ] Candidate user guide
- [ ] Admin manual
- [ ] API integration guide (for partners)

### 13.3 Developer Documentation
- [ ] Local setup guide
- [ ] Contributing guidelines
- [ ] Code style guide
- [ ] Testing procedures

---

## Appendix A: Database Schema Overview

### Core Tables

```sql
-- Associations (Brands)
CREATE TABLE associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  theme JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  hubspot_id TEXT UNIQUE,
  association_id UUID REFERENCES associations(id),
  website TEXT,
  description TEXT,
  industry TEXT,
  size TEXT,
  location JSONB,
  membership_status TEXT,
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ,
  pending_overrides JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT,
  location JSONB,
  profession TEXT,
  industry TEXT,
  job_type TEXT,
  experience_level TEXT,
  salary_range JSONB,
  status TEXT DEFAULT 'active',
  tier TEXT DEFAULT 'free',
  embedding VECTOR(1536),
  views INTEGER DEFAULT 0,
  applies INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  resume_url TEXT,
  profile_data JSONB,
  embedding VECTOR(1536),
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  status TEXT DEFAULT 'applied',
  cover_letter TEXT,
  ai_match_score FLOAT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Appendix B: AI Prompts Reference

### Job Description Generator
```typescript
const JD_SYSTEM_PROMPT = `You are an expert job description writer for the financial services industry.
Create compelling, ATS-optimized job descriptions that attract top talent.
Focus on clarity, inclusivity, and specific requirements.`;

const JD_USER_PROMPT = (data) => `
Create a professional job description for:
- Title: ${data.title}
- Company: ${data.company}
- Industry: ${data.industry}
- Requirements: ${data.requirements}

Include: Overview, Responsibilities, Qualifications, Benefits
`;
```

### Resume Builder
```typescript
const RESUME_SYSTEM_PROMPT = `You are a professional resume consultant.
Rewrite resumes to be ATS-friendly, achievement-focused, and impactful.
Maintain truthfulness while optimizing presentation.`;
```

### Applicant Ranking
```typescript
const RANKING_SYSTEM_PROMPT = `You are an expert recruiter.
Evaluate candidate fit based on resume vs job requirements.
Provide a match score (0-100) and key insights.`;
```

---

## Approval & Sign-off

**Senior Development Review**: ✅ **APPROVED**

**Reviewer**: Senior Development Team  
**Date**: 2025-12-10  
**Status**: Ready for Implementation

**Key Recommendations**:
1. Prioritize RLS policy testing before launch
2. Implement AI cost monitoring from Day 1
3. Start with V0 foundation - do not skip
4. Use feature flags for gradual V1 rollout
5. Monitor HubSpot sync reliability closely

**Next Steps**:
1. Create detailed database schema DDL
2. Set up development environment
3. Begin V0 implementation
4. Schedule sprint planning session

---

**Document End**
