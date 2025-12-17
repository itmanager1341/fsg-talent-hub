# FSG Talent Hub – DEV PLAN (V1)

**Version:** 1.5
**Last Updated:** 2025-12-16
**Status:** ✅ Complete
**Authors:** Development Team

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-13 | Dev Team | Initial V1 integrations proposal |
| 1.1 | 2025-12-14 | Dev Team | Added implementation details |
| 1.2 | 2025-12-15 | Dev Team | Updated with completion status, PRD alignment |
| 1.3 | 2025-12-15 | Dev Team | Stripe price IDs configured, billing UI in progress |
| 1.4 | 2025-12-15 | Dev Team | Billing pages complete, dashboard links added, ready for E2E testing |
| 1.5 | 2025-12-16 | Dev Team | AI Usage Dashboard complete, admin portal UX improvements, V1 COMPLETE |

---

## Overview

V1 extends the V0 brand-agnostic core with external integrations:

| Integration | Purpose | Status |
|-------------|---------|--------|
| **AI (OpenRouter)** | JD generator, future embeddings | ✅ Complete |
| **HubSpot** | One-way company sync from CRM | ✅ Complete |
| **Stripe** | Subscription billing + tier enforcement | ✅ Complete (Price IDs configured) |

---

## V1 Implementation Status

### Database Migrations

| Migration | Name | Status | Tables Created |
|-----------|------|--------|----------------|
| 20251215000304 | `ai_usage_tracking` | ✅ Applied | `ai_usage_logs`, `ai_rate_limits`, `ai_jd_cache` |
| 20251215000334 | `hubspot_sync_v2` | ✅ Applied | `hubspot_sync_logs`, added `hubspot_sync_status` enum |
| 20251215000403 | `stripe_billing` | ✅ Applied | `subscriptions`, `stripe_webhook_events`, `stripe_prices` |

### Edge Functions

| Function | Version | Status | Purpose |
|----------|---------|--------|---------|
| `generate-jd` | v6 | ✅ ACTIVE | AI job description generator |
| `hubspot-sync` | v7 | ✅ ACTIVE | One-way CRM sync (admin auth added) |
| `stripe-webhook` | v6 | ✅ ACTIVE | Subscription lifecycle handler |
| `create-checkout` | v6 | ✅ ACTIVE | Stripe Checkout session creator |

### UI Components

| Component | Location | Status |
|-----------|----------|--------|
| AI JD Generator button | `src/app/employers/jobs/_components/JobForm.tsx` | ✅ Complete |
| Admin HubSpot sync page | `src/app/admin/hubspot/page.tsx` | ✅ Complete |
| HubSpot sync button | `src/app/admin/hubspot/HubSpotSyncButton.tsx` | ✅ Complete |
| Billing UI (Employers) | `src/app/employers/billing/page.tsx` | ✅ Complete |
| Billing UI (Candidates) | `src/app/account/candidate/billing/page.tsx` | ✅ Complete |
| AI Usage Dashboard | `src/app/admin/ai-usage/page.tsx` | ✅ Complete |
| Admin Layout (shared) | `src/app/admin/layout.tsx` | ✅ Complete |
| Admin Sidebar | `src/components/admin/AdminSidebar.tsx` | ✅ Complete |
| Mobile Admin Nav | `src/components/admin/MobileAdminNav.tsx` | ✅ Complete |
| StatCard Component | `src/components/admin/StatCard.tsx` | ✅ Complete |

### Environment Configuration

| Secret | Location | Status |
|--------|----------|--------|
| `OPENROUTER_API_KEY` | Supabase Edge Function Secrets | ✅ Configured |
| `HUBSPOT_PRIVATE_APP_TOKEN` | Supabase Edge Function Secrets | ✅ Configured |
| `STRIPE_SECRET_KEY` | Supabase Edge Function Secrets | ✅ Configured |
| `STRIPE_WEBHOOK_SECRET` | Supabase Edge Function Secrets | ✅ Configured |
| `stripe_prices` table | Database | ✅ Configured with real Stripe price IDs |

---

## V1 Completion Checklist

### Core Integrations (Complete)

- [x] AI usage tracking schema (rate limits, caching, cost tracking)
- [x] HubSpot sync schema (sync logs, status tracking)
- [x] Stripe billing schema (subscriptions, webhook events, prices)
- [x] `generate-jd` Edge Function with rate limiting and caching
- [x] `hubspot-sync` Edge Function with pagination and error handling
- [x] `stripe-webhook` Edge Function with signature verification and idempotency
- [x] `create-checkout` Edge Function with customer creation
- [x] AI generator button in job form UI
- [x] Admin HubSpot manual sync page

### Outstanding V1 Items

- [x] Update `stripe_prices` table with real Stripe price IDs
- [x] Employer billing page (`/employers/billing`)
- [x] Candidate billing page (`/account/candidate/billing`)
- [x] Dashboard billing links added to employer and candidate dashboards
- [x] Admin AI usage dashboard (`/admin/ai-usage`)
- [x] Admin portal UX improvements (shared layout, sidebar, mobile nav)

### Deferred to V2

- [ ] Configure monitoring/alerts (Sentry, Datadog, or Supabase alerts)
- [ ] End-to-end testing of billing flow (requires Stripe CLI)

---

## PRD Alignment Analysis

### V1 Scope (per PRD Section 6)

| PRD V1 Requirement | Status | Notes |
|--------------------|--------|-------|
| Full job search with advanced filters | ✅ V0 | Completed in V0 |
| Employer portal (post, edit, view applicants) | ✅ V0 | Completed in V0 |
| Candidate portal (profile, resume, alerts) | ✅ V0 | Completed in V0 |
| AI job description generator | ✅ V1 | `generate-jd` Edge Function |
| AI resume builder | ❌ V2 | Deferred to V2 |
| AI job recommendations (vector search) | ❌ V2 | Requires pgvector setup |
| Member pricing rules implementation | ❌ V2 | Stripe infrastructure ready |
| Basic employer analytics | ⚠️ Partial | View/apply counts exist, no dashboard |
| Admin portal v1 (CRUD + flags) | ✅ V0 | Companies, candidates, settings |
| Brand context wrapper component | ❌ V2 | No `/fsi`, `/amaa` routes yet |
| FSI/AMAA theme configuration | ❌ V2 | Theme system not implemented |
| WordPress embedding widget | ❌ V2 | No widget API |

### What V1 Delivers

1. **AI Integration**: Employers can generate job descriptions with a single click
2. **HubSpot Sync**: Admin can manually sync companies from CRM
3. **Stripe Infrastructure**: Webhook handling, checkout sessions, tier sync triggers

### What Remains for V2

Per PRD Section 6 "V2 - Enhanced Platform":

| Feature | PRD Reference | Priority |
|---------|---------------|----------|
| Resume database for employers | V2 | High |
| AI applicant ranking | V2 / REQ: AI-001 | High |
| Full employer analytics dashboard | V2 | Medium |
| AI job quality monitoring | V2 | Medium |
| HubSpot bidirectional sync | V2 | Medium |
| Job scraping engine for lead generation | V2 | Low |
| Company profile override approval queue | V2 | Medium |
| AI resume builder | V1 (deferred) | High |
| Vector search (pgvector) | V1 (deferred) | High |
| Brand context layers (`/fsi`, `/amaa`) | V1 Part B (deferred) | High |
| WordPress embedding widget | V1 Part B (deferred) | Medium |

---

## Architecture Reference

### Database Tables (V1 Additions)

```
V1 Tables:
├── ai_usage_logs       (0 rows) - Track AI API usage and costs
├── ai_rate_limits      (4 rows) - Tier-based rate limits
├── ai_jd_cache         (0 rows) - 7-day cache for generated JDs
├── hubspot_sync_logs   (0 rows) - Sync history and debugging
├── subscriptions       (0 rows) - Stripe subscription records
├── stripe_webhook_events (0 rows) - Idempotency + webhook audit
└── stripe_prices       (4 rows) - Price ID → tier mapping

V1 Schema Additions:
├── companies.hubspot_sync_status (enum)
├── companies.hubspot_sync_error (text)
└── sync_subscription_tier() trigger function
```

### Edge Function Architecture

```
supabase/functions/
├── generate-jd/         # AI JD generation
│   ├── Auth: User JWT
│   ├── Rate Limit: By company tier
│   ├── Cache: 7-day TTL
│   └── Cost: Logged to ai_usage_logs
│
├── hubspot-sync/        # CRM sync
│   ├── Auth: Admin JWT or CRON_SECRET
│   ├── Pagination: 100 companies per page
│   └── Logging: hubspot_sync_logs
│
├── stripe-webhook/      # Subscription events
│   ├── Auth: Stripe signature verification
│   ├── Idempotency: stripe_webhook_events
│   └── Trigger: sync_subscription_tier()
│
└── create-checkout/     # Checkout sessions
    ├── Auth: User JWT
    ├── Customer: Create or retrieve
    └── Metadata: company_id or candidate_id
```

---

## Testing Checklist

### AI Integration
- [ ] Create job → fill title → click "Generate with AI"
- [ ] Verify rate limit enforcement (10/day for free tier)
- [ ] Verify caching (same inputs return cached result)
- [ ] Check `ai_usage_logs` for cost tracking

### HubSpot Sync
- [ ] Navigate to `/admin/hubspot` as admin
- [ ] Click "Sync Now" button
- [ ] Verify companies created with `is_verified=false`
- [ ] Check `hubspot_sync_logs` for sync history

### Stripe Billing
- [x] Update `stripe_prices` with real Stripe price IDs
- [ ] Trigger test webhook via Stripe CLI
- [ ] Verify `stripe_webhook_events` logs event
- [ ] Verify `subscriptions` table updated
- [ ] Verify company/candidate `tier` updated via trigger

### E2E Testing (Billing Flow)
- [ ] Setup Stripe CLI webhook forwarding (Requires: `stripe listen --forward-to https://apeunjsunohisnlrawfg.supabase.co/functions/v1/stripe-webhook`)
- [ ] Test employer billing flow (navigate to `/employers/billing`, click upgrade, complete checkout)
- [ ] Test candidate billing flow (navigate to `/account/candidate/billing`, click upgrade, complete checkout)
- [x] Verify dashboard links navigate correctly (Employer: `/employers/dashboard` → "Billing & Subscription" link; Candidate: `/account/candidate` → "Upgrade" quick action)
- [ ] Verify webhook events received and processed (Requires Stripe CLI)
- [ ] Verify database updates (subscriptions, stripe_webhook_events, tier updates) (Requires Stripe CLI + test checkout)

**E2E Testing Status:**
- ✅ Billing pages implemented and accessible
- ✅ Dashboard links verified in code
- ✅ Checkout buttons configured correctly
- ⚠️ Full E2E flow requires Stripe CLI installation for webhook testing
- ⚠️ Test checkout completion requires Stripe test account setup

---

## Security Considerations

1. **AI**: Rate limits enforced at Edge Function level + DB constraints
2. **HubSpot**: One-way sync only (read from HubSpot, never write back)
3. **Stripe**: Webhook signature verification, idempotency via event log
4. **Secrets**: All API keys stored as Supabase Edge Function secrets

---

## Monitoring & Alerts (Recommended)

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| AI cost/day | `ai_usage_logs` | > $50 |
| AI error rate | Edge Function logs | > 5% |
| HubSpot sync failures | `hubspot_sync_logs` | Any `failed` status |
| Stripe webhook failures | `stripe_webhook_events` | > 3 `failed` in 1hr |
| Subscription churn | `subscriptions` | > 10% month-over-month |

---

## Next Steps

### V1 Complete ✅

All V1 features have been implemented:

1. ✅ AI Integration (JD generator with rate limiting, caching, cost tracking)
2. ✅ HubSpot Sync (one-way company import with admin controls)
3. ✅ Stripe Billing (webhooks, checkout sessions, tier sync)
4. ✅ Billing UI (employer and candidate pages)
5. ✅ AI Usage Dashboard (real-time monitoring)
6. ✅ Admin Portal UX (shared layout, sidebar navigation)

### Pre-Production Testing (Recommended)

1. Test AI generation end-to-end
2. Test HubSpot sync with real CRM data
3. Test Stripe webhook flow with Stripe CLI
4. Configure monitoring/alerts

### V2 Planning

See `docs/DEV_PLAN_v2.md` for:
1. AI resume builder
2. Vector search with pgvector
3. Brand context layers (`/fsi`, `/amaa`)
4. Resume database for employers
5. AI applicant ranking

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/01_PRD_Job_Board_Platform.md` | Full product requirements |
| `docs/02_ARCHITECTURE_CLARIFICATION.md` | System architecture |
| `docs/03_TECHNICAL_REVIEW_Job_Board.md` | Technical specifications |
| `docs/04_DB_Schema_Draft.md` | Database schema reference |
| `docs/DEV_PLAN.md` | V0 implementation guide |

---

## Appendix: SQL Reference

### AI Rate Limits (Seeded)

```sql
SELECT * FROM ai_rate_limits;

-- tier        | requests_per_day | tokens_per_day
-- free        | 10               | 10000
-- starter     | 50               | 50000
-- professional| 200              | 200000
-- enterprise  | 1000             | 1000000
```

### Stripe Prices (Configured)

```sql
SELECT stripe_price_id, tier, billing_type, amount_cents FROM stripe_prices;

-- stripe_price_id                         | tier         | billing_type | amount_cents
-- price_1SehwWKExaRkZdM7bvdOym3X          | premium      | candidate    | 1900
-- price_1SehusKExaRkZdM7jnyfclx0          | starter      | employer     | 9900
-- price_1SehvQKExaRkZdM75EWCufyy          | professional | employer     | 29900
-- price_1SehvsKExaRkZdM7QG3nEhn3          | enterprise   | employer     | 99900
```

---

**Document End**
