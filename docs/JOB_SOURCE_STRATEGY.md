# Job Source Strategy & Legal Compliance

## Indeed Publisher API Requirements

### ✅ YES - You Need a Populated Website

**Indeed requires:**
- Fully functional and populated website
- Website review during approval process
- Written approval before API access
- Demonstration of how you'll use job listings

### Application Timeline
1. **Build your website** with initial content
2. **Populate with jobs** from other sources (Jooble, Adzuna, RSS)
3. **Get some traffic/content** to show it's operational
4. **Apply for Publisher API** with site details
5. **Wait for approval** (can take several weeks)
6. **Get Publisher ID** after approval

### Recommendation
**Don't apply yet** - build and populate your site first using other sources, then apply once you have content and traffic.

---

## Jooble API - Can You Display Their Jobs?

### ✅ YES - Jooble Allows Display

**Jooble API is designed for:**
- Integrating job listings into your website ✅
- Displaying jobs on your job board ✅
- Showing job details and descriptions ✅
- Linking to original job postings ✅

### Terms & Requirements
- **Free API access** - no cost
- **Attribution** - may require "Powered by Jooble" or similar (check current terms)
- **Redirect links** - jobs link back to original sources via Jooble
- **Rate limits** - reasonable limits for free tier

### What You Can Do
1. ✅ Fetch jobs from Jooble API
2. ✅ Display them on your website
3. ✅ Show full job descriptions
4. ✅ Link to original postings (via Jooble redirect URLs)
5. ✅ Import them into your database
6. ✅ Show them in search results

### Attribution Requirements
When displaying Jooble jobs, you should:
- Link back to original job posting (via Jooble redirect URL)
- Consider adding "via Jooble" or "Powered by Jooble" attribution
- Check Jooble's current terms for specific requirements

### How Our System Handles This

Our implementation:
- Stores `external_url` field pointing to original posting
- Tracks `source_id` to identify Jooble jobs
- Links go back to original job postings
- Can add attribution in UI if needed

---

## Adzuna API - Can You Display Their Jobs?

### ✅ YES - Adzuna Allows Display

**Adzuna API is designed for:**
- Integrating job listings into your website ✅
- Displaying jobs on your job board ✅
- Showing job details and descriptions ✅
- Linking to original job postings ✅

### Terms & Requirements
- **Free tier**: 10,000 requests/month
- **Attribution**: May require attribution (check current terms)
- **Redirect links**: Jobs link back to original sources
- **Rate limits**: 10,000/month free tier

### What You Can Do
Same as Jooble - fetch, display, import, and show jobs from Adzuna.

---

## Recommended Strategy

### Phase 1: Populate Site (Now)
1. **Set up Jooble API** (free, immediate access)
   - Get API key from [Jooble API](https://jooble.org/api/about)
   - Create source in admin portal
   - Start syncing jobs

2. **Set up Adzuna API** (free, immediate access)
   - Get API keys from [Adzuna Developer Portal](https://developer.adzuna.com/)
   - Create source in admin portal
   - Start syncing jobs

3. **Add RSS Feeds**
   - Company career page feeds
   - Industry job board feeds
   - Use Feed Discovery tool

### Phase 2: Build Content & Traffic
- Import jobs from external sources
- Match jobs to companies
- Build up job listings
- Get initial traffic
- Show site is operational

### Phase 3: Apply for Indeed Publisher API
- Once site is populated
- After you have some traffic
- Include site details in application
- Explain how you'll use listings

### Phase 4: Add Indeed (After Approval)
- Implement Publisher API integration
- Add as additional source
- Continue using Jooble/Adzuna as primary sources

---

## How External Jobs Become Visible

### Current Flow

1. **Sync** → Jobs fetched from Jooble/Adzuna/RSS
2. **Store** → Jobs saved to `external_jobs` table
3. **Match** → System tries to match companies
4. **Review** → Admin reviews in `/admin/job-sources/imports`
5. **Import** → Admin approves → Jobs moved to `jobs` table
6. **Display** → Jobs appear on `/jobs` page

### Important Note

**External jobs are NOT displayed until imported:**
- Jobs in `external_jobs` table are not shown on public site
- Only jobs in `jobs` table are displayed
- Admin must approve/import external jobs first
- This ensures quality control

### To Display Jooble/Adzuna Jobs:

1. Sync jobs from source
2. Review in import queue
3. Approve jobs for import
4. Jobs then appear on `/jobs` page
5. Users can view and apply

---

## Legal Compliance Checklist

### For Jooble/Adzuna Jobs:
- [x] API allows display (confirmed)
- [ ] Check current attribution requirements
- [x] Link back to original postings (via redirect URLs)
- [x] Store source information
- [ ] Add attribution in UI if required

### For RSS Feeds:
- [ ] Verify feed is public and intended for aggregation
- [ ] Check source website's terms of service
- [x] Link back to original postings
- [ ] Provide proper attribution

### For Indeed (Future):
- [ ] Wait until site is populated
- [ ] Apply for Publisher API
- [ ] Get written approval
- [ ] Follow Indeed's terms

---

## Next Steps

### Immediate Actions:
1. ✅ Set up Jooble API source
2. ✅ Set up Adzuna API source  
3. ✅ Start syncing jobs
4. ✅ Review and import jobs
5. ✅ Populate your site

### Short-term:
- Add RSS feeds from company career pages
- Build up job listings
- Get initial traffic

### Medium-term:
- Apply for Indeed Publisher API
- Implement Publisher API integration
- Add Indeed as additional source

---

## Questions to Verify

Before going live with Jooble/Adzuna:

1. **Check Jooble's current terms:**
   - Visit [Jooble API Terms](https://jooble.org/api/about)
   - Verify attribution requirements
   - Confirm display rights

2. **Check Adzuna's current terms:**
   - Visit [Adzuna Developer Portal](https://developer.adzuna.com/)
   - Review API terms of service
   - Verify attribution requirements

3. **Add attribution if needed:**
   - Update JobCard component to show source
   - Add "via Jooble" or "via Adzuna" text
   - Ensure compliance with terms

---

## Summary

**Indeed Publisher API:**
- ❌ Don't apply yet - need populated website first
- ✅ Use Jooble/Adzuna to populate site
- ✅ Apply after site has content and traffic

**Jooble API:**
- ✅ Yes, you can display their job listings
- ✅ Free API access available
- ✅ Good for populating your site now
- ⚠️ Check attribution requirements

**Adzuna API:**
- ✅ Yes, you can display their job listings
- ✅ Free tier available (10K/month)
- ✅ Good for populating your site now
- ⚠️ Check attribution requirements

**Best Strategy:**
1. Use Jooble/Adzuna now to populate site
2. Build content and traffic
3. Apply for Indeed Publisher API later
4. Add Indeed as additional source after approval

