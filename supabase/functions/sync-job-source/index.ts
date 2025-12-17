import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndeedJob {
  jobkey: string;
  jobtitle: string;
  company: string;
  city?: string;
  state?: string;
  country?: string;
  snippet?: string;
  url: string;
  date: string;
  salary?: string;
}

/**
 * Parse Indeed RSS feed
 */
async function parseIndeedRSS(xmlText: string): Promise<IndeedJob[]> {
  const jobs: IndeedJob[] = [];
  
  // Simple XML parsing - extract items
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const descriptionMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    
    if (!titleMatch || !linkMatch) continue;
    
    const title = titleMatch[1];
    const link = linkMatch[1];
    const description = descriptionMatch ? descriptionMatch[1] : '';
    const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
    
    // Extract job key from URL
    const jobKeyMatch = link.match(/jk=([^&]+)/);
    const jobkey = jobKeyMatch ? jobKeyMatch[1] : crypto.randomUUID();
    
    // Parse title for company (format: "Job Title - Company Name")
    const titleParts = title.split(' - ');
    const jobtitle = titleParts[0] || title;
    const company = titleParts[1] || 'Unknown';
    
    // Extract location from description
    const locationMatch = description.match(/([^,]+),\s*([A-Z]{2})/);
    
    jobs.push({
      jobkey,
      jobtitle,
      company,
      city: locationMatch ? locationMatch[1].trim() : undefined,
      state: locationMatch ? locationMatch[2] : undefined,
      country: 'USA',
      snippet: description,
      url: link,
      date: pubDate,
    });
  }
  
  return jobs;
}

/**
 * Normalize Indeed job to external_jobs format
 */
function normalizeIndeedJob(
  indeedJob: IndeedJob,
  sourceId: string
): Record<string, any> {
  // Parse salary if available
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  
  if (indeedJob.salary) {
    const salaryMatch = indeedJob.salary.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
    if (salaryMatch) {
      salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
      salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
    }
  }

  // Determine work setting
  let workSetting = 'onsite';
  if (!indeedJob.city && !indeedJob.state) {
    workSetting = 'remote';
  } else if (indeedJob.snippet?.toLowerCase().includes('remote')) {
    workSetting = 'remote';
  }

  // Calculate expiration (30 days from posting)
  const postedDate = new Date(indeedJob.date);
  const expiresAt = new Date(postedDate);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    external_id: indeedJob.jobkey,
    source_url: indeedJob.url || `https://www.indeed.com/viewjob?jk=${indeedJob.jobkey}`,
    title: indeedJob.jobtitle.trim(),
    description: indeedJob.snippet || null,
    company_name: indeedJob.company.trim(),
    company_url: null,
    location_city: indeedJob.city || null,
    location_state: indeedJob.state || null,
    location_country: indeedJob.country || 'USA',
    salary_min: salaryMin || null,
    salary_max: salaryMax || null,
    job_type: null,
    work_setting: workSetting,
    experience_level: null,
    raw_data: {
      ...indeedJob,
      normalized_at: new Date().toISOString(),
    },
    expires_at: expiresAt.toISOString(),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sourceId } = await req.json();

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'sourceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get source configuration
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('job_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log entry
    const syncLogId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    await supabaseAdmin.from('job_sync_logs').insert({
      id: syncLogId,
      source_id: sourceId,
      sync_type: 'manual',
      status: 'running',
      started_at: startedAt,
    });

    // Fetch jobs based on source type
    let jobs: any[] = [];
    const result = {
      jobs_found: 0,
      jobs_new: 0,
      jobs_updated: 0,
      jobs_duplicates: 0,
      errors: [] as string[],
    };

    try {
      const config = source.config as Record<string, any>;
      
      if (source.name.includes('indeed')) {
        // Fetch from Indeed RSS (free, no API key required)
        const query = config.search_query || 'mortgage servicing OR M&A advisory';
        const location = config.search_location || '';
        
        const rssUrl = `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&radius=25&limit=25`;
        
        const rssResponse = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FSG Talent Hub Job Aggregator)',
          },
        });

        if (rssResponse.ok) {
          const xmlText = await rssResponse.text();
          const indeedJobs = await parseIndeedRSS(xmlText);
          jobs = indeedJobs.map((job) => normalizeIndeedJob(job, sourceId));
        } else {
          result.errors.push(`Indeed RSS fetch failed: ${rssResponse.status}`);
        }
      } else if (source.name.includes('adzuna')) {
        // Fetch from Adzuna API
        const appId = config.app_id;
        const appKey = config.app_key;
        const query = config.search_query || 'mortgage servicing OR financial services';
        const location = config.search_location || '';
        
        if (!appId || !appKey) {
          result.errors.push('Adzuna API requires app_id and app_key in config');
        } else {
          const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&results_per_page=50&sort_by=date&max_days_old=7`;
          
          const adzunaResponse = await fetch(adzunaUrl);
          
          if (adzunaResponse.ok) {
            const adzunaData = await adzunaResponse.json();
            if (adzunaData.results) {
              jobs = adzunaData.results.map((job: any) => ({
                external_id: job.id || job.adref || crypto.randomUUID(),
                source_url: job.redirect_url,
                title: job.title,
                description: job.description,
                company_name: job.company?.display_name,
                location_city: job.location?.area?.[0] || job.location?.display_name?.split(',')[0],
                location_state: job.location?.display_name?.split(',')[1]?.trim(),
                location_country: 'USA',
                salary_min: job.salary_min || null,
                salary_max: job.salary_max || null,
                job_type: job.contract_type?.toLowerCase().includes('full') ? 'full_time' : null,
                work_setting: job.location?.display_name?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
                raw_data: { ...job, normalized_at: new Date().toISOString() },
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              }));
            }
          } else {
            result.errors.push(`Adzuna API fetch failed: ${adzunaResponse.status}`);
          }
        }
      } else if (source.name.includes('jooble')) {
        // Fetch from Jooble API
        const apiKey = config.api_key;
        const query = config.search_query || 'mortgage servicing OR financial services';
        const location = config.search_location || '';
        
        if (!apiKey) {
          result.errors.push('Jooble API requires api_key in config');
        } else {
          const dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 7);
          
          const joobleResponse = await fetch(`https://jooble.org/api/${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keywords: query,
              location: location,
              radius: 25,
              page: 1,
              searchMode: 1,
              datefrom: dateFrom.toISOString().split('T')[0],
            }),
          });
          
          if (joobleResponse.ok) {
            const joobleData = await joobleResponse.json();
            if (joobleData.jobs) {
              jobs = joobleData.jobs.map((job: any) => {
                const locationParts = job.location?.split(',').map((s: string) => s.trim()) || [];
                return {
                  external_id: job.id,
                  source_url: job.link,
                  title: job.title,
                  description: job.snippet,
                  company_name: job.source,
                  location_city: locationParts[0],
                  location_state: locationParts[1],
                  location_country: locationParts[2] || 'USA',
                  salary_min: null, // Parse from job.salary if needed
                  salary_max: null,
                  job_type: job.type?.toLowerCase().includes('full') ? 'full_time' : null,
                  work_setting: job.location?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
                  raw_data: { ...job, normalized_at: new Date().toISOString() },
                  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                };
              });
            }
          } else {
            result.errors.push(`Jooble API fetch failed: ${joobleResponse.status}`);
          }
        }
      }

      result.jobs_found = jobs.length;

      // Store jobs in external_jobs table
      for (const job of jobs) {
        try {
          // Check for duplicate
          const { data: existing } = await supabaseAdmin
            .from('external_jobs')
            .select('id')
            .eq('source_id', sourceId)
            .eq('external_id', job.external_id)
            .single();

          if (existing) {
            // Update existing
            const { error: updateError } = await supabaseAdmin
              .from('external_jobs')
              .update({
                title: job.title,
                description: job.description,
                company_name: job.company_name,
                location_city: job.location_city,
                location_state: job.location_state,
                salary_min: job.salary_min,
                salary_max: job.salary_max,
                work_setting: job.work_setting,
                raw_data: job.raw_data,
                last_seen_at: new Date().toISOString(),
                expires_at: job.expires_at,
              })
              .eq('id', existing.id);

            if (updateError) {
              result.errors.push(`Update error for ${job.external_id}: ${updateError.message}`);
            } else {
              result.jobs_updated++;
            }
          } else {
            // Insert new
            const { error: insertError } = await supabaseAdmin
              .from('external_jobs')
              .insert({
                source_id: sourceId,
                ...job,
                status: 'pending',
              });

            if (insertError) {
              if (insertError.code === '23505') {
                // Unique constraint violation (duplicate)
                result.jobs_duplicates++;
              } else {
                result.errors.push(`Insert error for ${job.external_id}: ${insertError.message}`);
              }
            } else {
              result.jobs_new++;
            }
          }

          // Attempt company matching for new jobs
          if (!existing && job.company_name) {
            const { data: companyMatch } = await supabaseAdmin
              .from('companies')
              .select('id')
              .ilike('name', job.company_name.trim())
              .eq('is_active', true)
              .limit(1)
              .single();

            if (companyMatch) {
              const { data: newJob } = await supabaseAdmin
                .from('external_jobs')
                .select('id')
                .eq('source_id', sourceId)
                .eq('external_id', job.external_id)
                .single();

              if (newJob) {
                await supabaseAdmin
                  .from('external_jobs')
                  .update({
                    matched_company_id: companyMatch.id,
                    match_confidence: 1.0,
                    match_method: 'exact_name',
                    status: 'matched',
                  })
                  .eq('id', newJob.id);
              }
            }
          }
        } catch (jobError: any) {
          result.errors.push(`Job processing error: ${jobError.message}`);
        }
      }
    } catch (fetchError: any) {
      result.errors.push(`Fetch error: ${fetchError.message}`);
    }

    // Update sync log
    const completedAt = new Date().toISOString();
    const durationSeconds = Math.floor(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );

    await supabaseAdmin
      .from('job_sync_logs')
      .update({
        status: result.errors.length > 0 && result.jobs_found === 0 ? 'failed' : result.errors.length > 0 ? 'partial' : 'success',
        jobs_found: result.jobs_found,
        jobs_new: result.jobs_new,
        jobs_updated: result.jobs_updated,
        jobs_duplicates: result.jobs_duplicates,
        errors: result.errors,
        completed_at: completedAt,
        duration_seconds: durationSeconds,
      })
      .eq('id', syncLogId);

    // Update source last_synced_at
    await supabaseAdmin
      .from('job_sources')
      .update({ last_synced_at: completedAt })
      .eq('id', sourceId);

    return new Response(
      JSON.stringify({
        success: true,
        sync_log_id: syncLogId,
        result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
