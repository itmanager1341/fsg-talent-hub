# Job Source Legal Review & Terms

## Indeed Publisher API

### Requirements
- ✅ **Operational Website Required**: Indeed requires a fully functional and populated website before approving Publisher API access
- ✅ **Written Approval Required**: Must receive written approval from Indeed before initial use
- ✅ **Website Review**: Indeed reviews your website to ensure it aligns with their standards

### Application Process
1. Build and populate your website first
2. Apply at [Indeed Publisher Program](https://www.indeed.com/publisher)
3. Provide website details and explain how you'll use job listings
4. Wait for approval (can take several weeks)
5. Get Publisher ID after approval

### Recommendation
**Wait until your site is populated** before applying. Indeed will review your site during the approval process.

---

## Jooble API

### Terms & Usage Rights
- ✅ **API Allows Display**: Jooble API is designed for integrating job listings into your website
- ✅ **Free Access**: Jooble offers free API access
- ✅ **Attribution**: Typically requires attribution to Jooble (check their current terms)
- ✅ **Redirect Links**: Jobs link back to original sources via Jooble

### What You Can Do
- Display Jooble job listings on your website
- Integrate their API into your job board
- Show job details and descriptions
- Link to original job postings (via Jooble redirect URLs)

### Requirements
- Check Jooble's current API terms for specific attribution requirements
- Ensure compliance with their usage guidelines
- May require "Powered by Jooble" or similar attribution

### Recommendation
**Jooble is a good option for populating your site** while you wait for Indeed approval. You can:
1. Set up Jooble API now (free, no approval needed)
2. Populate your site with Jooble jobs
3. Apply for Indeed Publisher API once site is populated
4. Add Indeed as an additional source later

---

## Adzuna API

### Terms & Usage Rights
- ✅ **API Allows Display**: Adzuna API is designed for displaying jobs on your site
- ✅ **Free Tier**: 10,000 requests/month free tier
- ✅ **Attribution**: May require attribution (check current terms)
- ✅ **Redirect Links**: Jobs link back to original sources

### What You Can Do
- Display Adzuna job listings on your website
- Integrate their API into your job board
- Show job details and descriptions
- Link to original job postings

### Requirements
- Sign up for free API key at [Adzuna Developer Portal](https://developer.adzuna.com/)
- Check current terms for attribution requirements
- Respect rate limits (10,000/month free tier)

### Recommendation
**Adzuna is another good option** for populating your site. Similar to Jooble:
1. Free API access (just need to sign up)
2. No website approval required
3. Can start using immediately
4. Good for building initial content

---

## Generic RSS Feeds

### Terms & Usage Rights
- ✅ **Public Feeds**: RSS feeds are typically public and can be displayed
- ⚠️ **Check Terms**: Always check the source website's terms of service
- ✅ **Attribution**: Usually requires attribution to original source
- ✅ **Link Back**: Should link back to original job posting

### What You Can Do
- Display jobs from public RSS feeds
- Show job details and descriptions
- Link to original job postings

### Requirements
- Verify RSS feed is public and intended for aggregation
- Check source website's terms of service
- Provide proper attribution
- Link back to original postings

### Recommendation
**RSS feeds are good for company career pages** and industry-specific job boards. Always verify terms before using.

---

## Best Practice Recommendations

### For Populating Your Site Initially

1. **Start with Jooble or Adzuna** (Recommended)
   - Free API access
   - No website approval needed
   - Can start immediately
   - Good coverage of job listings

2. **Add RSS Feeds**
   - Company career page feeds
   - Industry job board feeds
   - Verify terms before using

3. **Apply for Indeed Publisher API**
   - Once your site is populated and functional
   - After you have some traffic/content
   - Include site details in application

### Attribution Requirements

When displaying external jobs, you should:
- ✅ Link back to original job posting
- ✅ Attribute the source (e.g., "via Jooble" or "via Adzuna")
- ✅ Use the `external_url` field to link to original posting
- ✅ Display source information clearly

### Implementation in FSG Talent Hub

Our system already handles this:
- `external_url` field stores link to original posting
- `source_id` tracks which source the job came from
- Jobs can be displayed with proper attribution
- Links go back to original postings

---

## Legal Checklist

Before using any job source:

- [ ] Review source's Terms of Service
- [ ] Check attribution requirements
- [ ] Verify you can display their listings
- [ ] Ensure proper linking back to originals
- [ ] Document source in your system
- [ ] Monitor for terms changes

---

## Next Steps

1. **Immediate**: Set up Jooble or Adzuna API to populate your site
2. **Short-term**: Add RSS feeds from company career pages
3. **Medium-term**: Apply for Indeed Publisher API once site is populated
4. **Ongoing**: Monitor terms and ensure compliance

