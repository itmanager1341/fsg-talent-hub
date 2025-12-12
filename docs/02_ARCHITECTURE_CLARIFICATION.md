# Architecture Clarification - Brand-Agnostic Core Platform

**Date**: 2025-12-10  
**Status**: ✅ Updated Architecture Approach

---

## Key Architectural Change

### ❌ OLD UNDERSTANDING (Incorrect)
Multiple brand-specific platforms that happen to share a database:
- /fsi → FSI-specific platform
- /amaa → AMAA-specific platform  
- Each with their own features

### ✅ NEW UNDERSTANDING (Correct)

**One complete, brand-agnostic platform with brand context layers:**

```
┌─────────────────────────────────────────────────┐
│     jobs.fsgmedia.com (Main Platform)           │
│                                                 │
│  • Complete feature set                        │
│  • Brand-agnostic design                       │
│  • ALL jobs visible                            │
│  • Neutral theming                             │
│  • Cross-brand discovery                       │
│                                                 │
│  This is where ALL development happens         │
└─────────────────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
┌────────────────┐    ┌────────────────┐
│  /fsi Context  │    │  /amaa Context │
│                │    │                │
│  Same platform │    │  Same platform │
│  FSI theme     │    │  AMAA theme    │
│  FSI filters   │    │  AMAA filters  │
│  FSI content   │    │  AMAA content  │
└────────────────┘    └────────────────┘
```

---

## What This Means for Development

### Phase 1: Build Main Platform (Weeks 1-8)
**Location**: jobs.fsgmedia.com

Build the COMPLETE platform with:
- ✅ All features (jobs, employers, candidates, admin, AI)
- ✅ Brand-agnostic UI/UX
- ✅ No brand-specific logic
- ✅ Show ALL jobs by default
- ✅ Neutral design system

**Do NOT worry about FSI or AMAA yet!**

### Phase 2: Add Brand Contexts (Weeks 8-10)
**Locations**: /fsi and /amaa

Create brand context wrappers that:
- ✅ Apply brand themes (colors, logos, fonts)
- ✅ Set default filters (show relevant jobs first)
- ✅ Add brand-specific marketing content
- ✅ Customize navigation
- ✅ But NEVER restrict access to other brands

**This is just configuration, not new development!**

---

## Code Architecture

### Wrong Approach ❌
```typescript
// DON'T DO THIS - Separate implementations per brand

function FSIJobSearchPage() {
  const jobs = await getJobs({ brand: 'fsi', restrictToBrand: true });
  return <FSILayout><FSIJobList jobs={jobs} /></FSILayout>;
}

function AMAAJobSearchPage() {
  const jobs = await getJobs({ brand: 'amaa', restrictToBrand: true });
  return <AMAALayout><AMAAJobList jobs={jobs} /></AMAALayout>;
}
```

### Right Approach ✅
```typescript
// DO THIS - Single implementation with brand context

function JobSearchPage({ brandContext }: { brandContext?: BrandContext }) {
  // Get ALL jobs, optionally filtered by brand preference
  const defaultFilters = brandContext?.defaultFilters || {};
  const jobs = await getJobs({ 
    defaultFilters,
    allowCrossBrand: true  // ALWAYS true!
  });
  
  const theme = brandContext?.theme || neutralTheme;
  
  return (
    <Layout theme={theme}>
      <JobList jobs={jobs} showBrandToggle={true} />
    </Layout>
  );
}

// Usage:
// Route: /jobs
<JobSearchPage brandContext={null} />

// Route: /fsi/jobs  
<JobSearchPage brandContext={fsiBrandContext} />

// Route: /amaa/jobs
<JobSearchPage brandContext={amaaBrandContext} />
```

---

## Database Design Implications

### Brand is a TAG, not a PARTITION

```sql
-- ✅ CORRECT: Brand as optional filter
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  association_id UUID REFERENCES associations(id), -- Brand tag
  title TEXT NOT NULL,
  -- ... other fields
);

-- Query for main platform (all jobs)
SELECT * FROM jobs WHERE status = 'active';

-- Query for brand context (filtered, but not restricted)
SELECT * FROM jobs 
WHERE status = 'active'
  AND association_id = 'fsi-uuid'  -- Applied as default filter only
ORDER BY created_at DESC;

-- User can always clear filters to see ALL jobs
```

```sql
-- ❌ WRONG: Brand as partition/isolation
CREATE TABLE fsi_jobs (...);  -- DON'T DO THIS
CREATE TABLE amaa_jobs (...); -- DON'T DO THIS

-- ❌ WRONG: RLS that restricts by brand
CREATE POLICY brand_isolation ON jobs
  FOR SELECT USING (
    association_id = current_setting('app.brand')::uuid
  );  -- DON'T DO THIS
```

---

## UI/UX Implications

### Main Platform (jobs.fsgmedia.com)
- **Design**: Clean, professional, neutral
- **Colors**: Grayscale with accent colors
- **Jobs Shown**: ALL jobs across all brands
- **Navigation**: 
  - Jobs
  - Companies  
  - For Employers
  - For Candidates
  - About

### FSI Context (jobs.fsgmedia.com/fsi)
- **Design**: Same components, FSI theme applied
- **Colors**: FSI brand colors (#003366, #FF6B35)
- **Jobs Shown**: FSI jobs by default, but user can toggle to "All Jobs"
- **Navigation**:
  - Jobs (FSI-focused)
  - Companies (FSI-focused)
  - For Employers
  - For Candidates
  - About FSI
  - **[Toggle: View All Brands]** ← Important!

### AMAA Context (jobs.fsgmedia.com/amaa)
- **Design**: Same components, AMAA theme applied
- **Colors**: AMAA brand colors
- **Jobs Shown**: AMAA jobs by default, but user can toggle
- **Navigation**: Similar to FSI but AMAA-branded

---

## Configuration Over Code

### Brand Configuration Table
```typescript
interface BrandConfiguration {
  id: string;
  slug: string;
  name: string;
  
  // Theme
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    logo: string;
    font: string;
  };
  
  // Default Filters (preferences, not restrictions!)
  defaultFilters: {
    industries?: string[];
    professions?: string[];
  };
  
  // Marketing Content
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  
  featuredCompanies: string[];
  
  // Custom Domain (for white-label in V4)
  customDomain?: string;
}
```

### Adding a New Brand
To add a new brand (e.g., "ACME Association"):

```sql
-- Step 1: Insert brand configuration
INSERT INTO associations (name, slug, theme, default_filters)
VALUES (
  'ACME Association',
  'acme',
  '{"colors": {"primary": "#FF0000"}, "logo": "..."}',
  '{"industries": ["technology"]}'
);
```

```typescript
// Step 2: Add route (automatic with dynamic routing)
// No code changes needed!

// Step 3: Done! The following routes now work:
// - jobs.fsgmedia.com/acme
// - jobs.fsgmedia.com/acme/jobs
// - jobs.fsgmedia.com/acme/companies
```

---

## Testing Strategy

### Test Once, Works Everywhere

```typescript
describe('Job Search', () => {
  it('should work on main platform', async () => {
    await testJobSearch({ route: '/jobs' });
  });
  
  it('should work in FSI context', async () => {
    await testJobSearch({ route: '/fsi/jobs', expectedTheme: 'fsi' });
  });
  
  it('should work in AMAA context', async () => {
    await testJobSearch({ route: '/amaa/jobs', expectedTheme: 'amaa' });
  });
  
  it('should allow cross-brand discovery', async () => {
    // User on /fsi/jobs can still see AMAA jobs if they toggle
    await navigateTo('/fsi/jobs');
    await clickToggle('Show All Jobs');
    const jobs = await getDisplayedJobs();
    expect(jobs.some(j => j.brand === 'amaa')).toBe(true);
  });
});
```

---

## Benefits of This Approach

### ✅ Development Benefits
1. **Single Codebase**: Write once, works everywhere
2. **Easier Testing**: Test once, confident everywhere
3. **Faster Features**: New features automatically available to all brands
4. **Less Bugs**: No duplicate code to maintain
5. **Easy Scaling**: Add new brands with configuration only

### ✅ User Benefits
1. **Cross-Brand Discovery**: Find jobs across all associations
2. **Consistent UX**: Same interface, familiar patterns
3. **Better Search**: Larger job pool = better matches
4. **Unified Profile**: One account works across all brands

### ✅ Business Benefits
1. **Network Effects**: More jobs = more candidates = more jobs
2. **Lower Costs**: Maintain one platform, not many
3. **Faster GTM**: New brands launch in days, not months
4. **Better Data**: Unified analytics across all brands

---

## Common Misconceptions

### ❌ "Brand context means separate platforms"
**NO!** Brand context is just theming + default filters. It's the same platform.

### ❌ "FSI users shouldn't see AMAA jobs"  
**NO!** FSI users SEE FSI jobs by default, but can toggle to see all. This is a feature, not a bug.

### ❌ "We need separate databases for each brand"
**NO!** Single database, brand is just a tag on the data.

### ❌ "Brand-specific features go in brand routes"
**NO!** All features are brand-agnostic. Brand differences are only theme/filters/content.

---

## Development Workflow

### Week 1-2: Main Platform Setup
```bash
# All work happens at main platform level
cd apps/web
npm run dev
# Open: http://localhost:3000
# Build: Jobs page, Employers portal, Candidates portal
```

### Week 3-6: Main Platform Features
```bash
# Keep building at main platform level
# Don't even think about /fsi or /amaa yet
# Focus: Complete all features brand-agnostically
```

### Week 7-8: Add Brand Contexts
```bash
# NOW we add brand contexts
# Create brand configuration files
# Add theme configurations
# Test that everything still works
# Open: http://localhost:3000/fsi
# Open: http://localhost:3000/amaa
```

---

## Success Criteria

### ✅ We've Done This Right When:
1. A new developer can work on the platform without knowing about brands
2. Adding a new brand takes <1 day
3. All features work identically across all contexts
4. Tests don't need to be duplicated per brand
5. Users can seamlessly move between brands
6. No "if brand === 'fsi'" conditionals in feature code

### ❌ We've Done This Wrong If:
1. Code has brand-specific implementations
2. Features work differently per brand
3. Adding a new brand requires code changes
4. Tests are duplicated per brand
5. Data is isolated per brand
6. Users can't see jobs from other brands

---

## Quick Reference

| Concept | Main Platform | Brand Context |
|---------|--------------|---------------|
| **URL** | jobs.fsgmedia.com | /fsi, /amaa |
| **Purpose** | Complete platform | Themed view |
| **Jobs Shown** | All jobs | Filtered by default |
| **Development** | All features built here | Configuration only |
| **Theme** | Neutral | Brand-specific |
| **Code** | All business logic | Wrapper components |
| **Testing** | Comprehensive | Theme validation |

---

## Final Reminder

**Build brand-agnostic first. Add brand contexts later. They're layers, not separate platforms.**

---

**Document End**
