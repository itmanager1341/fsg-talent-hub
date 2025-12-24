# Employer Billing & Subscription

## Overview
The billing page allows employers to view their current subscription tier, upgrade their plan, and manage their subscription. Different tiers unlock different features and job posting limits.

## Access
- **Who**: Employers (authenticated)
- **Location**: `/employers/billing`
- **Requirements**: 
  - User must be authenticated employer
  - Company must be set up

## Current Features

### Current Plan Display
- Shows current subscription tier
- Displays subscription status (active, canceled, etc.)
- Shows renewal date (if subscribed)
- Current plan price

### Pricing Tiers
Four tiers available:

#### Free Tier
- 1 active job posting
- Basic company profile
- View applications
- Email notifications
- **Price**: $0/month

#### Starter Tier
- 5 active job postings
- Enhanced company profile
- AI job description generator (50/day)
- View applications
- Email notifications
- Basic analytics
- Resume search (limited)
- **Price**: Varies (set in Stripe)

#### Professional Tier
- 25 active job postings
- Premium company profile
- AI job description generator (200/day)
- Featured job listings
- Advanced analytics
- Priority support
- Resume search (full access)
- AI applicant ranking
- **Price**: Varies (set in Stripe)

#### Enterprise Tier
- Unlimited job postings
- Premium company profile
- AI job description generator (1000/day)
- Featured job listings
- Full analytics dashboard
- Dedicated support
- Full resume database access
- AI applicant ranking
- API access
- **Price**: Varies (set in Stripe)

### Subscription Management
- View current subscription details
- Upgrade to higher tier
- See renewal information
- Success/cancel messages after checkout

### Checkout Flow
- Stripe-powered secure checkout
- One-click upgrade
- Automatic subscription activation
- Redirect back to billing page with status
- Subscription linked to company (not individual user)

## How It Works

1. **Page Load**
   - Fetches current company tier
   - Loads available pricing plans from `stripe_prices` table
   - Checks for active subscription
   - Displays current plan and upgrade options

2. **Upgrade Process**
   - User selects tier and clicks upgrade
   - Redirects to Stripe Checkout
   - User completes payment
   - Stripe webhook updates subscription
   - Company tier updated in database
   - User redirected back with success message
   - New features immediately available

3. **Subscription Status**
   - Checks `subscriptions` table for active subscription
   - Links subscription to company (not user)
   - Displays renewal date if active
   - Shows "No active subscription" for free tier

4. **Tier Features**
   - Features enforced at application level
   - Tier checked before allowing actions
   - Job limits enforced (can't post beyond tier limit)
   - AI rate limits enforced per tier

5. **Downgrade Handling**
   - Downgrades require contacting support
   - Prevents accidental loss of features
   - May require closing excess jobs before downgrade

## Technical Details

- **Key components**: 
  - `src/app/employers/billing/page.tsx` - Billing page
  - `src/app/employers/billing/CheckoutButton.tsx` - Stripe checkout integration
- **Server actions**: None (Stripe handles payment flow)
- **Database tables**: 
  - `companies` - Stores tier information
  - `subscriptions` - Tracks Stripe subscriptions (linked to company)
  - `stripe_prices` - Available pricing plans
- **External services**: 
  - Stripe Checkout - Payment processing
  - Stripe Webhooks - Subscription updates

## User Roles & Permissions

- **Employer (Owner)**: 
  - Can view billing page
  - Can upgrade subscription
  - Can see subscription details
- **Employer (Billing role)**: 
  - Can manage billing (future feature)
- **Employer (Recruiter/Viewer)**: 
  - Can view current tier
  - Cannot upgrade (owner/billing only)
- **Admins**: Can view all subscription data

## FAQ Items

**Q: Can I cancel my subscription?**
A: Yes, you can cancel at any time. Contact support or use the Stripe Customer Portal (coming soon). You'll continue to have access until the end of your billing period.

**Q: What happens if I downgrade?**
A: You'll need to ensure you don't exceed the limits of your new tier (e.g., close excess jobs). Contact support to downgrade. You'll lose access to premium features immediately upon downgrade.

**Q: Can I upgrade mid-month?**
A: Yes, you can upgrade at any time. Your new tier and features are available immediately. Billing is prorated (handled by Stripe).

**Q: What payment methods do you accept?**
A: We accept all major credit cards through Stripe's secure payment platform.

**Q: Do you offer annual plans?**
A: Currently, only monthly subscriptions are available. Annual plans may be added in the future with discounts.

**Q: What happens to my jobs if I cancel?**
A: Your jobs remain active until you manually close them or they expire. You'll lose access to premium features, but basic job management continues.

**Q: Can I get a refund?**
A: Refund policies are handled through Stripe. Contact support@fsgmedia.com for refund requests. Refunds are typically prorated.

**Q: How do I update my payment method?**
A: Payment method updates can be done through the Stripe Customer Portal (coming soon) or by contacting support.

## Related Features

- [Dashboard](./DASHBOARD.md) - See current tier and limits
- [Job Posting](./JOB_POSTING.md) - Tier affects job limits
- [AI Features](./AI_FEATURES.md) - Tier affects AI access
- [Candidate Search](./CANDIDATE_SEARCH.md) - Requires Starter+ tier

## Future Enhancements

- [ ] Stripe Customer Portal integration
- [ ] Annual billing option (discount)
- [ ] Usage-based pricing add-ons
- [ ] Team/seat-based pricing
- [ ] Invoice history and downloads
- [ ] Payment method management
- [ ] Prorated upgrades/downgrades
- [ ] Trial periods for new features
- [ ] Corporate/enterprise custom pricing
- [ ] Billing analytics and reports

