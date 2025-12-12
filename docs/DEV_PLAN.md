# FSG Talent Hub – DEV PLAN (V0)

This file is the **implementation guide** for V0 of the FSG Talent Hub.
Architecture, product scope, and schema are defined in:

* `docs/01_PRD_Job_Board_Platform.md`
* `docs/02_ARCHITECTURE_CLARIFICATION.md`
* `docs/03_TECHNICAL_REVIEW_Job_Board.md`
* `docs/04_DB_Schema_Draft.md`

V0 = **brand-agnostic core at `jobs.fsgmedia.com`**.
No /fsi or /amaa special casing yet beyond config stubs.

---

## Current State

The following are already implemented:

| Component | Status | Location |
|-----------|--------|----------|
| Database schema | ✅ Complete | `supabase/migrations/001_create_mvp_tables.sql` |
| Supabase browser client | ✅ Complete | `src/lib/supabaseClient.ts` |
| Design tokens | ✅ Complete | `src/design/tokens.ts` |
| UI components (Button, Card) | ✅ Started | `src/components/ui/` |
| Package dependencies | ✅ Complete | `package.json` |

---

## Phase 1 – Auth & Supabase SSR

### 1.1 Server-Side Supabase Client

Add SSR-compatible client for Server Components and Route Handlers:

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### 1.2 Auth Middleware

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 1.3 Auth Configuration

Use Supabase Auth with email/password (magic link optional for V1):

* **Sign up flow**: Create auth user → redirect to role selection
* **Role derivation**:
  * Employer = has row in `company_users` table
  * Candidate = has row in `candidates` table
  * New users choose role on first sign-in

---

## Phase 2 – Routes (App Router)

All routes are brand-agnostic for V0.

### 2.1 Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `app/page.tsx` | Hero + quick links (Find Jobs, For Employers, Sign In) |
| `/jobs` | `app/jobs/page.tsx` | Job search with filters |
| `/jobs/[id]` | `app/jobs/[id]/page.tsx` | Job detail + apply button |
| `/employers` | `app/employers/page.tsx` | Employer marketing page |
| `/signin` | `app/signin/page.tsx` | Auth (sign in / sign up) |

### 2.2 Protected Routes (Auth Required)

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/account` | `app/account/page.tsx` | Any auth user | Role-based redirect |
| `/account/candidate` | `app/account/candidate/page.tsx` | Candidate | Candidate dashboard |
| `/account/candidate/profile` | `app/account/candidate/profile/page.tsx` | Candidate | Edit profile |
| `/employers/dashboard` | `app/employers/dashboard/page.tsx` | Employer | Company dashboard |
| `/employers/jobs/new` | `app/employers/jobs/new/page.tsx` | Employer | Post new job |
| `/employers/jobs/[id]/edit` | `app/employers/jobs/[id]/edit/page.tsx` | Employer | Edit job |

### 2.3 Route Protection Pattern

```typescript
// src/lib/auth/requireAuth.ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  return user;
}

export async function requireEmployer() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('*, company:companies(*)')
    .eq('user_id', user.id)
    .single();

  if (!companyUser) {
    redirect('/account?setup=employer');
  }

  return { user, companyUser };
}

export async function requireCandidate() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!candidate) {
    redirect('/account?setup=candidate');
  }

  return { user, candidate };
}
```

---

## Phase 3 – Minimum Data Flows

### 3.1 Candidate Flow

1. **Sign up** → Auth user created
2. **Role selection** → Create `candidates` row
3. **Profile completion**:
   * Basic info (name, location, headline)
   * Resume upload to Supabase Storage
   * Job preferences
4. **Job discovery**:
   * Browse `/jobs` with filters
   * View job details
   * Save jobs (`saved_jobs` table)
5. **Apply**:
   * Create `applications` row
   * Optional cover letter
   * Track status in dashboard

### 3.2 Employer Flow

1. **Sign up** → Auth user created
2. **Company setup**:
   * Create `companies` row (name, slug, basic info)
   * Create `company_users` row with `role: 'owner'`
3. **Job posting**:
   * Create `jobs` row with `status: 'draft'`
   * Fill required fields (title, description)
   * Publish → `status: 'active'`
4. **Applications**:
   * View applicants for each job
   * Update application status
   * View candidate profiles

### 3.3 Data Operations (V0 Scope)

```typescript
// src/lib/data/jobs.ts
export async function getActiveJobs(filters?: JobFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('jobs')
    .select(`
      *,
      company:companies(id, name, slug, logo_url)
    `)
    .eq('status', 'active')
    .order('published_at', { ascending: false });

  if (filters?.keyword) {
    query = query.textSearch('title', filters.keyword);
  }
  if (filters?.location) {
    query = query.eq('location_state', filters.location);
  }
  if (filters?.workSetting) {
    query = query.eq('work_setting', filters.workSetting);
  }
  if (filters?.jobType) {
    query = query.eq('job_type', filters.jobType);
  }

  return query;
}
```

---

## Phase 4 – UI Shell & Design System

### 4.1 Shared Layout

```
┌─────────────────────────────────────────────────┐
│  Header                                          │
│  ┌─────────────────────────────────────────────┐│
│  │ Logo   Nav: Jobs | Employers | Sign In      ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│                                                  │
│  Page Content                                    │
│                                                  │
├─────────────────────────────────────────────────┤
│  Footer                                          │
│  © 2025 FSG Media · Links                       │
└─────────────────────────────────────────────────┘
```

### 4.2 Header Component

```typescript
// src/components/layout/Header.tsx
export function Header({ user }: { user?: User }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            FSG Talent Hub
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/jobs">Find Jobs</Link>
            <Link href="/employers">For Employers</Link>
            {user ? (
              <Link href="/account">Account</Link>
            ) : (
              <Link href="/signin">Sign In</Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
```

### 4.3 Design System (Existing Tokens)

Extend existing `src/design/tokens.ts`:

```typescript
// Already defined:
// colors: background, surface, border, textPrimary, textSecondary, accent

// Add for V0:
export const colors = {
  // ...existing
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
};

export const components = {
  input: {
    base: 'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
  },
  card: {
    base: 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
  },
};
```

### 4.4 Required UI Components (V0)

| Component | Location | Purpose |
|-----------|----------|---------|
| Button | ✅ Exists | Primary, secondary, outline variants |
| Card | ✅ Exists | Content containers |
| Input | `src/components/ui/Input.tsx` | Form text inputs |
| Select | `src/components/ui/Select.tsx` | Dropdowns |
| JobCard | `src/components/jobs/JobCard.tsx` | Job listing item |
| JobFilters | `src/components/jobs/JobFilters.tsx` | Search filters |
| Header | `src/components/layout/Header.tsx` | Global nav |
| Footer | `src/components/layout/Footer.tsx` | Global footer |

---

## Phase 5 – Integration Stubs (V0)

### 5.1 HubSpot (Stub Only)

The schema includes HubSpot fields. For V0:
* Fields exist: `companies.hubspot_id`, `companies.sync_status`
* No active sync in V0
* Manual company creation only

### 5.2 AI (Stub Only)

The schema reserves embedding columns:
* `jobs.embedding` (commented out in V0)
* `candidates.embedding` (commented out in V0)
* No AI features in V0

### 5.3 Stripe (Stub Only)

The schema includes Stripe fields:
* `companies.stripe_customer_id`
* `candidates.stripe_customer_id`
* All users on `tier: 'free'` in V0
* Billing implementation in V1

---

## Phase 6 – Storage Setup

### 6.1 Supabase Storage Buckets

Create via Supabase Dashboard or SQL:

```sql
-- Resume storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);
```

### 6.2 Storage Policies

```sql
-- Candidates can upload/read own resumes
CREATE POLICY "Candidates own resumes"
ON storage.objects FOR ALL
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Company team can manage logos
CREATE POLICY "Company logos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');
```

---

## Implementation Checklist

### Week 1: Foundation

- [ ] Set up SSR Supabase client (`src/lib/supabase/server.ts`)
- [ ] Add auth middleware (`src/middleware.ts`)
- [ ] Create auth helpers (`src/lib/auth/`)
- [ ] Build Header/Footer components
- [ ] Create shared layout (`app/layout.tsx`)
- [ ] Implement `/signin` page

### Week 2: Public Pages

- [ ] Build `/` homepage with hero
- [ ] Create `/jobs` listing page with filters
- [ ] Create `/jobs/[id]` detail page
- [ ] Build `/employers` marketing page
- [ ] Add Input, Select UI components
- [ ] Create JobCard, JobFilters components

### Week 3: Candidate Flow

- [ ] Create `/account` role router
- [ ] Build candidate profile setup flow
- [ ] Create candidate dashboard
- [ ] Implement resume upload
- [ ] Add job save functionality
- [ ] Build apply flow

### Week 4: Employer Flow

- [ ] Build company setup flow
- [ ] Create employer dashboard
- [ ] Implement job creation form
- [ ] Add job edit functionality
- [ ] Build applications viewer
- [ ] Test RLS policies end-to-end

---

## What NOT To Do in V0

* ❌ Do NOT create brand-specific routes (no `/fsi/jobs`, `/amaa/jobs` yet)
* ❌ Do NOT duplicate components per brand
* ❌ Do NOT build a full ATS; just basic applications list for employers
* ❌ Do NOT block V0 on HubSpot sync, AI features, or white-label network
* ❌ Do NOT implement Stripe billing (all users are free tier)

---

## V0 Goal

A fully functional, brand-agnostic job board at `jobs.fsgmedia.com` with:

* ✅ Public job search and detail pages
* ✅ Candidate profile creation + resume upload + apply
* ✅ Employer company setup + post jobs + view applications
* ✅ Supabase Auth with role-based access
* ✅ RLS-protected data access

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | SSR Supabase client |
| `src/middleware.ts` | Auth session refresh |
| `src/lib/auth/requireAuth.ts` | Route protection helpers |
| `src/lib/data/jobs.ts` | Job data operations |
| `src/lib/data/candidates.ts` | Candidate data operations |
| `src/lib/data/companies.ts` | Company data operations |
| `src/components/layout/Header.tsx` | Global header |
| `src/components/layout/Footer.tsx` | Global footer |
| `src/components/ui/Input.tsx` | Form input |
| `src/components/ui/Select.tsx` | Form select |
| `src/components/jobs/JobCard.tsx` | Job listing card |
| `src/components/jobs/JobFilters.tsx` | Search filters |
| `app/signin/page.tsx` | Auth page |
| `app/jobs/page.tsx` | Job search |
| `app/jobs/[id]/page.tsx` | Job detail |
| `app/employers/page.tsx` | Employer marketing |
| `app/employers/dashboard/page.tsx` | Employer dashboard |
| `app/employers/jobs/new/page.tsx` | Create job |
| `app/account/page.tsx` | Account router |
| `app/account/candidate/page.tsx` | Candidate dashboard |

### Modify

| File | Changes |
|------|---------|
| `src/design/tokens.ts` | Add success/warning/error colors, component styles |
| `app/layout.tsx` | Add Header/Footer, auth context |
| `app/page.tsx` | Replace with homepage content |

---

## Reference Documents

* Architecture: `docs/02_ARCHITECTURE_CLARIFICATION.md`
* Full PRD: `docs/01_PRD_Job_Board_Platform.md`
* Technical Review: `docs/03_TECHNICAL_REVIEW_Job_Board.md`
* Schema: `docs/04_DB_Schema_Draft.md` / `supabase/migrations/001_create_mvp_tables.sql`
