# Supabase Verification Results (V0)

This document is intended to capture **copy/pasted SQL outputs** from the Supabase SQL editor so we have a permanent audit trail of schema/RLS/storage state while validating V0.

Project: `apeunjsunohisnlrawfg`

## How to use this doc
- Run the “One-shot verification SQL” blocks (provided by the assistant) in Supabase.
- Paste the raw results under the matching headings below.
- Re-run after any SQL patches so we can confirm changes.

## One-shot verification SQL (copy/paste into Supabase SQL editor)

```sql
-- 0) Snapshot metadata
select current_user, version();

-- 1) Public table inventory
select schemaname, tablename
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2) Storage buckets inventory
select id, name, public, created_at
from storage.buckets
order by id;

-- 3) Column sanity (resume-related)
select table_schema, table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'candidates'
  and column_name in ('resume_url', 'resume_filename', 'resume_uploaded_at')
order by column_name;

-- 4) RLS policies for core tables
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in ('companies','candidates','jobs','applications','company_users','user_roles','objects')
order by schemaname, tablename, policyname;

-- 5) Security definer helper functions (expected: is_company_member/is_company_owner/is_admin/can_employer_view_candidate, etc.)
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_company_member','is_company_owner','is_admin','can_employer_view_candidate')
order by p.proname;

-- 6) Data sanity counts
select 'companies' as table_name, count(*)::int as row_count from public.companies
union all select 'company_users', count(*)::int from public.company_users
union all select 'jobs', count(*)::int from public.jobs
union all select 'candidates', count(*)::int from public.candidates
union all select 'applications', count(*)::int from public.applications
union all select 'user_roles', count(*)::int from public.user_roles
order by table_name;

-- 7) Small samples (to confirm fields look right)
select id, name, slug, is_active, is_verified
from public.companies
order by created_at desc
limit 10;

select id, company_id, title, status, published_at
from public.jobs
order by created_at desc
limit 10;

select id, user_id, email, resume_url, resume_filename, is_searchable, is_active
from public.candidates
order by updated_at desc nulls last
limit 10;
```

## One-shot patch SQL (storage + resume backfill)

```sql
-- NOTE: On many Supabase projects, `storage.objects` is owned by `supabase_storage_admin`.
-- If you get: `must be owner of table objects`, you cannot apply storage RLS changes
-- via SQL as `postgres`. In that case, update Storage policies in the Dashboard UI:
-- Storage -> Policies -> storage.objects.
--
-- What to do in UI (definitive):
-- 1) Find policy: "Candidates can read own resumes" (SELECT on bucket_id='resumes')
-- 2) Update its USING expression to:
--    bucket_id = 'resumes'
--    AND (
--      auth.uid()::text = (storage.foldername(name))[1]
--      OR EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.user_id = auth.uid() AND cu.is_active = true)
--      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
--    )
--
-- The rest of this block is still useful for public-table patching + resume_url backfill.

-- Buckets (idempotent)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set name = excluded.name, public = excluded.public;

insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do update set name = excluded.name, public = excluded.public;

-- Policies: resumes bucket
drop policy if exists "resumes_read" on storage.objects;
drop policy if exists "resumes_insert_own" on storage.objects;
drop policy if exists "resumes_update_own" on storage.objects;
drop policy if exists "resumes_delete_own" on storage.objects;

create policy "resumes_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.company_users cu
      where cu.user_id = auth.uid()
        and cu.is_active = true
    )
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
);

create policy "resumes_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "resumes_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
)
with check (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
);

create policy "resumes_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
);

-- Policies: company-logos bucket
drop policy if exists "company_logos_public_read" on storage.objects;
drop policy if exists "company_logos_employer_write" on storage.objects;

create policy "company_logos_public_read"
on storage.objects for select
to public
using (bucket_id = 'company-logos');

create policy "company_logos_employer_write"
on storage.objects for all
to authenticated
using (
  bucket_id = 'company-logos'
  and (
    exists (
      select 1
      from public.company_users cu
      where cu.user_id = auth.uid()
        and cu.is_active = true
    )
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
)
with check (
  bucket_id = 'company-logos'
  and (
    exists (
      select 1
      from public.company_users cu
      where cu.user_id = auth.uid()
        and cu.is_active = true
    )
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
);

-- Backfill: convert historical public URLs stored in candidates.resume_url to storage object names.
update public.candidates
set resume_url = split_part(split_part(resume_url, '/resumes/', 2), '?', 1)
where resume_url ilike 'http%'
  and resume_url like '%/resumes/%';

-- user_roles: allow users to read their own role row (avoids admin check failures).
alter table public.user_roles enable row level security;
drop policy if exists "user_roles_self_read" on public.user_roles;
create policy "user_roles_self_read"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());
```

---

## V0 smoke test checklist (local UI)

Goal: a single, repeatable, end-to-end pass that validates the DEV_PLAN V0 flows.

Prereqs:
- Local dev running at `http://localhost:3000`
- Test users exist:
  - Employer: `employer@test.com` / `employer123`
  - Candidate: `candidate@test.com` / `candidate123`
  - Admin: `it.manager@thefivestar.com` / `Empire1349!`
- Candidate has a resume uploaded (private bucket `resumes`).

### A) Public (logged out)
- Visit `/` → header renders once; “Latest jobs” area loads without errors.
- Visit `/jobs` → list loads; filters usable; click a job opens `/jobs/[id]`.
- Visit `/companies` → list loads; click company opens `/companies/[slug]`; “Open roles” loads.

### B) Employer
- Go to `/signout`
- Sign in employer → should land on `/employers/dashboard`.
- Create a fresh job:
  - Click “Post New Job” → fill required fields → save/publish so status becomes `active`.
  - Confirm job appears on `/jobs` and on `/companies/[slug]` “Open roles”.

### C) Candidate
- Go to `/signout`
- Sign in candidate → go to `/account/candidate/profile`:
  - Click “View” resume → should open via signed URL (network shows `/api/resumes/:candidateId` 200).
- Go to `/jobs` → open the newly created job → Save job → Apply → success page.
- Go to `/account/candidate/applications` → confirm application appears.

### D) Employer review
- Go to `/signout`
- Sign in employer → dashboard → open the new job’s Applications page.
- Confirm:
  - Application card loads with candidate name.
  - Update status (e.g. `screening`) succeeds.
  - “View Resume” opens via signed URL (network shows `/api/resumes/:candidateId` 200).
- Go to `/candidates` and `/candidates/[id]` → “View Resume” works.

### E) Admin
- Go to `/signout`
- Sign in admin → `/admin` loads.
- `/admin/candidates`: toggle `is_searchable` and toggle back (confirm list refreshes).
- `/admin/companies`: toggle `is_verified` and toggle back (confirm list refreshes).

Record outcomes (PASS/FAIL) + any errors in this doc under “Notes / follow-ups”.

## 1) Snapshot metadata

- **Date/time**:
- **Environment**: Supabase (online)
- **Who ran it**:

### Output: `current_user` / `version()`

PASTE HERE

---

## 2) Table inventory

### Output: public tables

PASTE HERE

### Output: storage buckets

PASTE HERE

---

## 3) Row Level Security policies

### Output: policies for core public tables

PASTE HERE

### Output: policies for storage.objects

PASTE HERE

---

## 4) Helper functions (SECURITY DEFINER)

### Output: functions present (admin + company membership helpers)

PASTE HERE

---

## 5) Data sanity counts

### Output: counts by table

PASTE HERE

### Output: sample company/job rows

PASTE HERE

### Output: sample candidate rows (resume fields)

PASTE HERE

---

## 6) Notes / follow-ups

- **V0 smoke test run (local UI)**: 2025-12-14
  - **Created job**: `jobs.id = 7e0a90ee-1d2b-48a2-98bd-d96086eb6a72` (“V0 Smoke Test Role”, status active)
  - **Candidate**: `candidates.id = 8c5bc43d-d113-4168-99d8-8549736b6938` (resume object exists in private `resumes` bucket)
  - **PASS**: Public pages load (`/`, `/jobs`, `/companies`, `/companies/test-employer-co`) and new job appears in listings.
  - **PASS**: Employer can publish job, view application, update status to Screening, and open candidate resume via signed URL.
  - **PASS**: Candidate can open own resume via signed URL, save job, apply, and see application in `/account/candidate/applications`.
  - **PASS**: Admin can toggle candidate search visibility (Hide ↔ Make searchable) and company verification (Verify ↔ Unverify), and toggle back.
  - **Evidence (network)**:
    - Candidate resume view: `GET /api/resumes/8c5bc43d-d113-4168-99d8-8549736b6938` → 200, then signed storage URL → 200
    - Employer resume view: `GET /api/resumes/8c5bc43d-d113-4168-99d8-8549736b6938` → 200, then signed storage URL → 200
  - **Minor**: automated click on “Sign Out” inside candidate dashboard failed once; using `/signout` consistently worked.

