# FSG Job Board – Reference Docs

*Last updated: 2025-12-10*

This `/docs` folder contains the **canonical reference** for the FSG Job Board Platform architecture, product requirements, and technical review.

If you are making **any structural decisions** (routing, data modeling, brand handling, HubSpot sync, AI usage, etc.), read or skim these before changing code.

---

## Core Architecture Concept (⚠️ Must Understand)

**jobs.fsgmedia.com is the complete, brand-agnostic platform.**

```text
jobs.fsgmedia.com  = full feature set, neutral theme, all brands
   └── /fsi        = FSI context (theme + default filters)
   └── /amaa       = AMAA context (theme + default filters)
```

* There is **one codebase** and **one platform**.
* FSI and AMAA are **contexts**, not separate apps.
* **Brand is a tag (`association_id`)**, not a separate database or schema.
* Users can **always see cross-brand jobs** if they choose.

### Golden Rules

1. **Single implementation, brand as configuration**

   ```ts
   function JobSearchPage({ brandContext }: { brandContext?: BrandContext }) {
     const defaultFilters = brandContext?.defaultFilters || {};
     const theme = brandContext?.theme || neutralTheme;

     return (
       <Layout theme={theme}>
         <JobSearch
           defaultFilters={defaultFilters}
           allowCrossBrand={true}  // ALWAYS allow cross-brand
         />
       </Layout>
     );
   }
   ```

   ❌ Do **NOT** create `FSIJobSearchPage`, `AMAAJobSearchPage`, or duplicate components per brand.

2. **Brand is a preference, not a wall**

   ```sql
   -- Correct: brand as tag
   CREATE TABLE jobs (
     id UUID PRIMARY KEY,
     association_id UUID REFERENCES associations(id), -- brand tag
     -- ...
   );

   -- Default: ALL active jobs
   SELECT * FROM jobs WHERE status = 'active';

   -- Brand filter: user preference
   SELECT * FROM jobs
   WHERE status = 'active'
     AND association_id = $1;
   ```

3. **Phase 1 (Weeks 1–8): jobs.fsgmedia.com only**

   * Brand-agnostic UX and theming
   * Show **all** jobs by default
   * Implement **complete feature set**
   * Do **not** special-case /fsi or /amaa except in config and routing stubs

4. **Phase 2 (Weeks 8–10): Add brand contexts**

   * Add `brandContext` configs for FSI and AMAA (theme, logo, copy, default filters)
   * Apply styling + marketing content per brand
   * Keep **all logic in shared modules**; contexts only adjust configuration and presentation.

---

## Documents in This Folder

### 1. `PRD_Job_Board_Platform.md`

**What it is:**
Full product requirements for the FSG Job Board Platform.

**Key sections:**

* Architecture overview (single core + brand contexts)
* Database design (brand as tag)
* URL & routing structure
* Role definitions (admin, employer, candidate)
* Feature roadmap (V0–V4; V0 = brand-agnostic core)

**When to read:**

* Planning new features
* Clarifying expected behavior
* Validating that a proposed change matches the product vision

---

### 2. `TECHNICAL_REVIEW_Job_Board.md`

**What it is:**
Senior developer technical review and risk assessment. 

**Key content:**

* Validation of the chosen architecture
* RLS, security, and multi-tenant considerations
* AI cost-control strategies
* HubSpot sync patterns and conflict handling
* Performance, indexing, and monitoring recommendations

**When to read:**

* Designing backend / DB changes
* Implementing AI, HubSpot sync, or vector search
* Investigating performance or scaling issues

---

### 3. `ARCHITECTURE_CLARIFICATION.md`

**What it is:**
Quick-reference guide to avoid architectural mistakes.

**Contains:**

* “Wrong vs Right” examples
* Code patterns to follow / avoid
* Database implications of the multi-brand design
* Week-by-week development workflow
* Success criteria checklist

**When to read:**

* Before creating new pages, routes, or contexts
* Any time you’re tempted to “just duplicate this for FSI/AMAA”
* On-boarding new devs or contractors

---

## How to Work Day-to-Day

1. **Start from `ARCHITECTURE_CLARIFICATION.md`**
   Make sure any new component or route respects the core architecture and brand-as-tag model.

2. **Confirm requirements in `PRD_Job_Board_Platform.md`**
   If something isn’t defined there, either:

   * add it to the PRD, or
   * document it as an open question before coding.

3. **Double-check implementation details against `TECHNICAL_REVIEW_Job_Board.md`**
   Especially for:

   * RLS & security
   * HubSpot/Stripe/OpenRouter integrations
   * Indexing and performance

4. **Never fork the platform by brand**

   * New brand? → Add a config object and theme, not a new app.
   * New feature? → Implement once in the core, expose per brand via config.

---

## Quick Checklist Before Merging

* [ ] Does this change work at `jobs.fsgmedia.com` **without** brand assumptions?
* [ ] Are brand differences handled through **config/theme**, not separate code paths?
* [ ] Do queries default to **all active jobs** unless a filter is explicitly applied?
* [ ] Is there any duplication that smells like “FSI version vs AMAA version”? Refactor.
* [ ] If this touches AI, HubSpot, or DB schema, was `TECHNICAL_REVIEW_Job_Board.md` consulted?

If any answer is “no” or “not sure,” pause and re-read the docs before proceeding.
