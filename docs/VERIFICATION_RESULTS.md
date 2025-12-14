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

- **Date/time**: 2025-12-14
- **Environment**: Supabase (online)
- **Who ran it**: MCP (server `project-0-fsg-talent-hub-supabase`)

### Output: `current_user` / `version()`

```json
[
  {
    "current_user": "postgres",
    "version": "PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit"
  }
]
```

---

## 2) Table inventory

### Output: public tables

```json
[
  { "schemaname": "public", "tablename": "applications" },
  { "schemaname": "public", "tablename": "associations" },
  { "schemaname": "public", "tablename": "candidates" },
  { "schemaname": "public", "tablename": "companies" },
  { "schemaname": "public", "tablename": "company_users" },
  { "schemaname": "public", "tablename": "job_alerts" },
  { "schemaname": "public", "tablename": "jobs" },
  { "schemaname": "public", "tablename": "saved_jobs" },
  { "schemaname": "public", "tablename": "user_roles" }
]
```

### Output: storage buckets

```json
[
  {
    "id": "company-logos",
    "name": "company-logos",
    "public": true,
    "created_at": "2025-12-12 22:45:44.986126+00"
  },
  {
    "id": "resumes",
    "name": "resumes",
    "public": false,
    "created_at": "2025-12-12 22:45:44.986126+00"
  }
]
```

---

## 3) Row Level Security policies

### Output: policies for core public tables

```json
[
  { "schemaname": "public", "tablename": "applications", "policyname": "Admins can view all applications", "permissive": "PERMISSIVE", "roles": "{authenticated}", "cmd": "SELECT", "qual": "is_admin()", "with_check": null },
  { "schemaname": "public", "tablename": "applications", "policyname": "Candidates can create applications", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "INSERT", "qual": null, "with_check": "(EXISTS ( SELECT 1\\n   FROM candidates\\n  WHERE ((candidates.id = applications.candidate_id) AND (candidates.user_id = auth.uid()))))" },
  { "schemaname": "public", "tablename": "applications", "policyname": "Candidates can update their applications", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "(EXISTS ( SELECT 1\\n   FROM candidates\\n  WHERE ((candidates.id = applications.candidate_id) AND (candidates.user_id = auth.uid()))))", "with_check": null },
  { "schemaname": "public", "tablename": "applications", "policyname": "Candidates can view their applications", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "(EXISTS ( SELECT 1\\n   FROM candidates\\n  WHERE ((candidates.id = applications.candidate_id) AND (candidates.user_id = auth.uid()))))", "with_check": null },
  { "schemaname": "public", "tablename": "applications", "policyname": "Employers can update application status", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "(EXISTS ( SELECT 1\\n   FROM (jobs\\n     JOIN company_users ON ((company_users.company_id = jobs.company_id)))\\n  WHERE ((jobs.id = applications.job_id) AND (company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['owner'::text, 'recruiter'::text])))))", "with_check": null },
  { "schemaname": "public", "tablename": "applications", "policyname": "Employers can view applications for their jobs", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "(EXISTS ( SELECT 1\\n   FROM (jobs\\n     JOIN company_users ON ((company_users.company_id = jobs.company_id)))\\n  WHERE ((jobs.id = applications.job_id) AND (company_users.user_id = auth.uid()))))", "with_check": null },
  { "schemaname": "public", "tablename": "candidates", "policyname": "Admins can read all candidates", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "is_admin()", "with_check": null },
  { "schemaname": "public", "tablename": "candidates", "policyname": "Admins can update candidates", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "is_admin()", "with_check": "is_admin()" },
  { "schemaname": "public", "tablename": "candidates", "policyname": "Admins can view all candidates", "permissive": "PERMISSIVE", "roles": "{authenticated}", "cmd": "SELECT", "qual": "is_admin()", "with_check": null },
  { "schemaname": "public", "tablename": "candidates", "policyname": "Candidates can insert their own profile", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "INSERT", "qual": null, "with_check": "(user_id = auth.uid())" },
  { "schemaname": "public", "tablename": "candidates", "policyname": "Candidates can update their own profile", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "(user_id = auth.uid())", "with_check": null },
  { "schemaname": "public", "tablename": "candidates", "policyname": "Candidates can view their own profile", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "(user_id = auth.uid())", "with_check": null },
  { "schemaname": "public", "tablename": "candidates", "policyname": "Employers can view candidates (feature-flagged)", "permissive": "PERMISSIVE", "roles": "{authenticated}", "cmd": "SELECT", "qual": "((is_active = true) AND employer_can_view_candidate(id))", "with_check": null },
  { "schemaname": "public", "tablename": "companies", "policyname": "Active companies are viewable by everyone", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "(is_active = true)", "with_check": null },
  { "schemaname": "public", "tablename": "companies", "policyname": "Admins can read all companies", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "is_admin()", "with_check": null },
  { "schemaname": "public", "tablename": "companies", "policyname": "Admins can update companies", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "is_admin()", "with_check": "is_admin()" },
  { "schemaname": "public", "tablename": "companies", "policyname": "Admins can view all companies", "permissive": "PERMISSIVE", "roles": "{authenticated}", "cmd": "SELECT", "qual": "is_admin()", "with_check": null },
  { "schemaname": "public", "tablename": "companies", "policyname": "Company team members can update their company", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "(EXISTS ( SELECT 1\\n   FROM company_users\\n  WHERE ((company_users.company_id = companies.id) AND (company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['owner'::text, 'recruiter'::text])))))", "with_check": null },
  { "schemaname": "public", "tablename": "company_users", "policyname": "Admins can view all company users", "permissive": "PERMISSIVE", "roles": "{authenticated}", "cmd": "SELECT", "qual": "is_admin()", "with_check": null },
  { "schemaname": "public", "tablename": "company_users", "policyname": "Owners can manage company team (delete)", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "DELETE", "qual": "is_company_owner(company_id)", "with_check": null },
  { "schemaname": "public", "tablename": "company_users", "policyname": "Owners can manage company team (insert)", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "INSERT", "qual": null, "with_check": "is_company_owner(company_id)" },
  { "schemaname": "public", "tablename": "company_users", "policyname": "Owners can manage company team (update)", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "is_company_owner(company_id)", "with_check": "is_company_owner(company_id)" },
  { "schemaname": "public", "tablename": "company_users", "policyname": "Users can view their company team", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "((user_id = auth.uid()) OR is_company_member(company_id))", "with_check": null },
  { "schemaname": "public", "tablename": "jobs", "policyname": "Active jobs are viewable by everyone", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "(status = 'active'::job_status)", "with_check": null },
  { "schemaname": "public", "tablename": "jobs", "policyname": "Admins can view all jobs", "permissive": "PERMISSIVE", "roles": "{authenticated}", "cmd": "SELECT", "qual": "is_admin()", "with_check": null },
  { "schemaname": "public", "tablename": "jobs", "policyname": "Company team can insert jobs", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "INSERT", "qual": null, "with_check": "(EXISTS ( SELECT 1\\n   FROM company_users\\n  WHERE ((company_users.company_id = jobs.company_id) AND (company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['owner'::text, 'recruiter'::text])))))" },
  { "schemaname": "public", "tablename": "jobs", "policyname": "Company team can update their jobs", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "(EXISTS ( SELECT 1\\n   FROM company_users\\n  WHERE ((company_users.company_id = jobs.company_id) AND (company_users.user_id = auth.uid()) AND (company_users.role = ANY (ARRAY['owner'::text, 'recruiter'::text])))))", "with_check": null },
  { "schemaname": "public", "tablename": "jobs", "policyname": "Company team can view all their jobs", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "is_company_member(company_id)", "with_check": null },
  { "schemaname": "public", "tablename": "jobs", "policyname": "Owners can delete jobs", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "DELETE", "qual": "(EXISTS ( SELECT 1\\n   FROM company_users\\n  WHERE ((company_users.company_id = jobs.company_id) AND (company_users.user_id = auth.uid()) AND (company_users.role = 'owner'::text))))", "with_check": null },
  { "schemaname": "public", "tablename": "user_roles", "policyname": "Users can read own roles", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "(user_id = auth.uid())", "with_check": null },
  { "schemaname": "public", "tablename": "user_roles", "policyname": "user_roles_self_read", "permissive": "PERMISSIVE", "roles": "{authenticated}", "cmd": "SELECT", "qual": "(user_id = auth.uid())", "with_check": null }
]
```

### Output: policies for storage.objects

```json
[
  { "schemaname": "storage", "tablename": "objects", "policyname": "Candidates can delete own resumes", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "DELETE", "qual": "((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))", "with_check": null },
  { "schemaname": "storage", "tablename": "objects", "policyname": "Candidates can read own resumes", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "((bucket_id = 'resumes'::text) AND (((auth.uid())::text = (storage.foldername(name))[1]) OR (EXISTS ( SELECT 1\\n   FROM company_users cu\\n  WHERE ((cu.user_id = auth.uid()) AND (cu.is_active = true)))) OR (EXISTS ( SELECT 1\\n   FROM user_roles ur\\n  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::text))))))", "with_check": null },
  { "schemaname": "storage", "tablename": "objects", "policyname": "Candidates can update own resumes", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))", "with_check": "((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))" },
  { "schemaname": "storage", "tablename": "objects", "policyname": "Candidates can upload own resumes", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "INSERT", "qual": null, "with_check": "((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))" },
  { "schemaname": "storage", "tablename": "objects", "policyname": "Company logos public read", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "SELECT", "qual": "(bucket_id = 'company-logos'::text)", "with_check": null },
  { "schemaname": "storage", "tablename": "objects", "policyname": "Company team can delete logos", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "DELETE", "qual": "((bucket_id = 'company-logos'::text) AND (auth.uid() IN ( SELECT company_users.user_id\\n   FROM company_users\\n  WHERE ((company_users.company_id)::text = (storage.foldername(objects.name))[1]))))", "with_check": null },
  { "schemaname": "storage", "tablename": "objects", "policyname": "Company team can update logos", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "UPDATE", "qual": "((bucket_id = 'company-logos'::text) AND (auth.uid() IN ( SELECT company_users.user_id\\n   FROM company_users\\n  WHERE ((company_users.company_id)::text = (storage.foldername(objects.name))[1]))))", "with_check": "((bucket_id = 'company-logos'::text) AND (auth.uid() IN ( SELECT company_users.user_id\\n   FROM company_users\\n  WHERE ((company_users.company_id)::text = (storage.foldername(objects.name))[1]))))" },
  { "schemaname": "storage", "tablename": "objects", "policyname": "Company team can upload logos", "permissive": "PERMISSIVE", "roles": "{public}", "cmd": "INSERT", "qual": null, "with_check": "((bucket_id = 'company-logos'::text) AND (auth.uid() IN ( SELECT company_users.user_id\\n   FROM company_users\\n  WHERE ((company_users.company_id)::text = (storage.foldername(objects.name))[1]))))" }
]
```

---

## 4) Helper functions (SECURITY DEFINER)

### Output: functions present (admin + company membership helpers)

```json
[
  { "schema": "public", "function_name": "employer_can_browse_all_candidates", "args": "", "security_definer": true },
  { "schema": "public", "function_name": "employer_can_view_candidate", "args": "candidate_id uuid", "security_definer": true },
  { "schema": "public", "function_name": "feature_flags_touch_updated_at", "args": "", "security_definer": false },
  { "schema": "public", "function_name": "get_feature_flag", "args": "flag_key text", "security_definer": true },
  { "schema": "public", "function_name": "is_admin", "args": "", "security_definer": true },
  { "schema": "public", "function_name": "is_company_member", "args": "check_company_id uuid", "security_definer": true },
  { "schema": "public", "function_name": "is_company_owner", "args": "check_company_id uuid", "security_definer": true }
]
```

---

## 5) Data sanity counts

### Output: counts by table

```json
[
  { "table_name": "applications", "row_count": 2 },
  { "table_name": "candidates", "row_count": 1 },
  { "table_name": "companies", "row_count": 1 },
  { "table_name": "company_users", "row_count": 1 },
  { "table_name": "jobs", "row_count": 3 },
  { "table_name": "user_roles", "row_count": 1 }
]
```

### Output: sample company/job rows

```json
{
  "companies": [
    { "id": "7b9cca03-9631-4c1f-9c19-9cf7775429ab", "name": "Test Employer Co", "slug": "test-employer-co", "is_active": true, "is_verified": true }
  ],
  "jobs": [
    { "id": "7e0a90ee-1d2b-48a2-98bd-d96086eb6a72", "company_id": "7b9cca03-9631-4c1f-9c19-9cf7775429ab", "title": "V0 Smoke Test Role", "status": "active", "published_at": "2025-12-14 22:42:52.797+00" },
    { "id": "22a4ca63-f6be-4a69-830c-3c088ec438c7", "company_id": "7b9cca03-9631-4c1f-9c19-9cf7775429ab", "title": "Test Role - Automation QA", "status": "active", "published_at": "2025-12-14 18:44:32.678+00" },
    { "id": "75b9cc05-19c5-42e7-bfce-658a5ea8c995", "company_id": "7b9cca03-9631-4c1f-9c19-9cf7775429ab", "title": "Senior Analyst (Test)", "status": "active", "published_at": "2025-12-14 18:25:23.387367+00" }
  ]
}
```

### Output: sample candidate rows (resume fields)

```json
[
  {
    "id": "8c5bc43d-d113-4168-99d8-8549736b6938",
    "user_id": "ae99f55c-57cb-4322-9f3e-571ba6a945a6",
    "email": "candidate@test.com",
    "resume_url": "ae99f55c-57cb-4322-9f3e-571ba6a945a6/1765751402063.docx",
    "resume_filename": "meghan-hanna-resume-2021.docx",
    "is_searchable": false,
    "is_active": true
  }
]
```

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

- **Employer candidate visibility feature flag (DB/RLS)**: enabled
  - **Flag**: `public.feature_flags.key = 'employer_browse_all_candidates'`
  - **Current value**: `enabled = true`, `config = {"min_company_tier":"free"}`
  - **Behavior**:
    - When enabled: employers can browse **all active candidates**.
    - When disabled: employers can browse **searchable candidates** (`is_searchable=true`) and can always see candidates who **applied to their jobs**.
  - **How to change (SQL)**:
    - Disable browse-all:
      - `update public.feature_flags set enabled = false where key = 'employer_browse_all_candidates';`
    - Require paid tier (standard+):
      - `update public.feature_flags set enabled = true, config = jsonb_set(config, '{min_company_tier}', '\"standard\"') where key = 'employer_browse_all_candidates';`

