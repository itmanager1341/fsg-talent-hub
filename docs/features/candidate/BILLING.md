# Candidate Billing & Subscription

## Overview
The billing page allows candidates to view their current subscription tier, upgrade to premium features, and manage their subscription. Premium features include advanced AI resume optimization and enhanced job recommendations.

## Access
- **Who**: Candidates (authenticated)
- **Location**: `/account/candidate/billing`
- **Requirements**: 
  - User must be authenticated
  - User must have a candidate profile

## Current Features

### Current Plan Display
- Shows current subscription tier (Free or Premium)
- Displays renewal date (if subscribed)
- Shows current plan price
- Status indicator

### Pricing Plans
Two tiers available:

#### Free Tier
- Create your profile
- Upload resume
- Apply to unlimited jobs
- Save jobs for later
- Basic job alerts

#### Premium Tier
- Everything in Free, plus:
- AI resume review & suggestions
- AI cover letter generator
- Enhanced job recommendations
- Priority application visibility
- Advanced job alerts
- Application tracking insights

### Subscription Management
- View current subscription status
- Upgrade to Premium via Stripe Checkout
- Success/cancel messages after checkout
- Subscription renewal information

### Checkout Flow
- Stripe-powered secure checkout
- One-click upgrade to Premium
- Automatic subscription activation
- Redirect back to billing page with status

## How It Works

1. **Page Load**
   - Fetches current candidate tier from database
   - Loads available pricing plans from `stripe_prices` table
   - Checks for active subscription
   - Displays current plan and available upgrades

2. **Upgrade Process**
   - User clicks "Upgrade" on Premium plan
   - Redirects to Stripe Checkout
   - User completes payment
   - Stripe webhook updates subscription
   - User redirected back with success message
   - Tier updated in candidate record

3. **Subscription Status**
   - Checks `subscriptions` table for active subscription
   - Displays renewal date if active
   - Shows "No active subscription" for free tier

4. **Tier Features**
   - Features are enforced at application level
   - Premium features check `candidate.tier === 'premium'`
   - Free tier has access to basic features only

## Technical Details

- **Key components**: 
  - `src/app/account/candidate/billing/page.tsx` - Billing page
  - `src/app/account/candidate/billing/CheckoutButton.tsx` - Stripe checkout integration
- **Server actions**: None (Stripe handles payment flow)
- **Database tables**: 
  - `candidates` - Stores tier information
  - `subscriptions` - Tracks Stripe subscriptions
  - `stripe_prices` - Available pricing plans
- **External services**: 
  - Stripe Checkout - Payment processing
  - Stripe Webhooks - Subscription updates

## User Roles & Permissions

- **Candidate (Free Tier)**: 
  - Can view billing page
  - Can upgrade to Premium
  - Limited feature access
- **Candidate (Premium Tier)**: 
  - Can view billing page
  - Can see subscription details
  - Full feature access
  - Can cancel subscription (via Stripe Customer Portal - future)
- **Employers**: Cannot access candidate billing
- **Admins**: Can view subscription data for analytics

## FAQ Items

**Q: Can I cancel my Premium subscription?**
A: Yes, you can cancel at any time. You'll continue to have access until the end of your billing period. Cancellation can be done through the Stripe Customer Portal (coming soon) or by contacting support.

**Q: What payment methods do you accept?**
A: We accept all major credit cards through Stripe's secure payment platform.

**Q: Will I lose my data if I cancel Premium?**
A: No, your profile, applications, and saved jobs remain. You'll lose access to Premium features like AI resume optimization, but your data is preserved.

**Q: How do I know if my upgrade was successful?**
A: After completing checkout, you'll be redirected back to the billing page with a success message. Your tier will update immediately, and Premium features will be available.

**Q: Can I get a refund?**
A: Refund policies are handled through Stripe. Contact support@fsgmedia.com for refund requests.

**Q: What happens when my subscription renews?**
A: Your subscription automatically renews at the end of each billing period. You'll be charged the same amount, and your Premium access continues uninterrupted.

**Q: Do you offer annual plans?**
A: Currently, only monthly Premium subscriptions are available. Annual plans may be added in the future.

## Related Features

- [Resume Builder](./RESUME.md) - Premium AI features
- [Job Recommendations](./RECOMMENDATIONS.md) - Enhanced recommendations for Premium
- [Dashboard](./DASHBOARD.md) - Quick access to upgrade

## Future Enhancements

- [ ] Stripe Customer Portal integration (manage subscription, update payment method)
- [ ] Annual billing option (discount)
- [ ] Trial period for Premium features
- [ ] Usage-based pricing for AI features
- [ ] Gift subscriptions
- [ ] Corporate/team plans
- [ ] Payment method management
- [ ] Invoice history
- [ ] Prorated upgrades/downgrades

