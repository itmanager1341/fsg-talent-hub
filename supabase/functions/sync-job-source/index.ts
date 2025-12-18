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

interface RSSFeedItem {
  title: string;
  link: string;
  description?: string;
  guid?: string;
  author?: string;
  pubDate?: string;
}

interface RSSFeed {
  items: RSSFeedItem[];
}

/**
 * Parse generic RSS feed (RSS 2.0 or Atom)
 */
function parseGenericRSS(xmlText: string): RSSFeed {
  const isAtom = xmlText.includes('<feed') && xmlText.includes('xmlns=\'http://www.w3.org/2005/Atom\'');
  
  if (isAtom) {
    return parseAtomFeed(xmlText);
  } else {
    return parseRSS2Feed(xmlText);
  }
}

function parseRSS2Feed(xmlText: string): RSSFeed {
  const items: RSSFeedItem[] = [];
  
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    const title = extractXMLValue(itemXml, 'title') || '';
    const link = extractXMLValue(itemXml, 'link') || '';
    const description = extractXMLValue(itemXml, 'description');
    const guid = extractXMLValue(itemXml, 'guid');
    const author = extractXMLValue(itemXml, 'author') || extractXMLValue(itemXml, 'dc:creator');
    const pubDate = extractXMLValue(itemXml, 'pubDate');
    
    if (title && link) {
      items.push({ title, link, description, guid, author, pubDate });
    }
  }
  
  return { items };
}

function parseAtomFeed(xmlText: string): RSSFeed {
  const items: RSSFeedItem[] = [];
  
  const entryMatches = xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  
  for (const match of entryMatches) {
    const entryXml = match[1];
    const title = extractXMLValue(entryXml, 'title') || '';
    let link = extractXMLValue(entryXml, 'link');
    
    // Atom links can be in href attribute
    if (!link) {
      const linkMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["']/);
      if (linkMatch) {
        link = linkMatch[1];
      }
    }
    
    const description = extractXMLValue(entryXml, 'summary') || extractXMLValue(entryXml, 'content');
    const guid = extractXMLValue(entryXml, 'id');
    const author = extractXMLValue(entryXml, 'author') || extractXMLValue(entryXml, 'name');
    const pubDate = extractXMLValue(entryXml, 'published') || extractXMLValue(entryXml, 'updated');
    
    if (title && link) {
      items.push({ title, link, description, guid, author, pubDate });
    }
  }
  
  return { items };
}

function extractXMLValue(xml: string, tagName: string): string | undefined {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tagName}><!\\[CDATA\\[(.*?)\\]\\]></${tagName}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }
  
  // Handle regular tags
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match) {
    return match[1].trim();
  }
  
  return undefined;
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
        const query = config.search_query || 'mortgage servicing OR M&A advisory';
        const location = config.search_location || '';
        const publisherId = config.publisher_id;
        
        if (publisherId) {
          // Use Indeed Publisher API
          // TODO: Implement Indeed Publisher API integration
          // The API endpoint format is: https://api.indeed.com/ads/apisearch?publisher={publisherId}&q={query}&l={location}
          result.errors.push('Indeed Publisher API integration is not yet implemented. Please use an alternative source (Adzuna, Jooble) or implement the Publisher API.');
        } else {
          // RSS feed endpoint has been discontinued by Indeed (returns 404)
          result.errors.push(
            'Indeed RSS feeds have been discontinued. ' +
            'Please use the Indeed Publisher API instead. ' +
            'Get a Publisher ID from https://www.indeed.com/publisher and add it to your source configuration.'
          );
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
        
        if (!apiKey || apiKey.length < 10) {
          result.errors.push('Jooble API requires a valid api_key in config (key appears to be invalid or too short)');
        } else {
          const dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 7);
          
          console.log(`Fetching Jooble API with key: ${apiKey.substring(0, 4)}...`);
          
          try {
            const joobleResponse = await fetch(`https://jooble.org/api/${apiKey}`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'FSG Talent Hub Job Aggregator',
              },
              body: JSON.stringify({
                keywords: query,
                location: location,
                radius: 25,
                page: 1,
                searchMode: 1,
                datefrom: dateFrom.toISOString().split('T')[0],
              }),
            });
            
            console.log(`Jooble API response status: ${joobleResponse.status}`);
            
            if (joobleResponse.ok) {
              const joobleData = await joobleResponse.json();
              console.log(`Jooble API response keys: ${Object.keys(joobleData).join(', ')}`);
              
              if (joobleData.jobs && Array.isArray(joobleData.jobs)) {
                console.log(`Jooble returned ${joobleData.jobs.length} jobs`);
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
              } else {
                result.errors.push(`Jooble API returned no jobs. Response: ${JSON.stringify(joobleData).substring(0, 200)}`);
              }
            } else {
              const errorText = await joobleResponse.text().catch(() => 'Unable to read error response');
              const errorDetails = errorText.substring(0, 200);
              result.errors.push(
                `Jooble API fetch failed: ${joobleResponse.status} ${joobleResponse.statusText}. ` +
                `Response: ${errorDetails}. ` +
                `Check that your API key is valid at https://jooble.org/api/about`
              );
              console.error(`Jooble API error: ${joobleResponse.status}`, errorDetails);
            }
          } catch (fetchError: any) {
            const errorMsg = fetchError.message || 'Unknown fetch error';
            result.errors.push(`Jooble API fetch exception: ${errorMsg}`);
            console.error('Jooble API fetch exception:', fetchError);
          }
        }
      } else if (source.source_type === 'rss' && config.feed_url) {
        // Generic RSS feed handler
        const feedUrl = config.feed_url;
        
        // Replace placeholders if present (for dynamic feeds)
        let finalFeedUrl = feedUrl;
        if (feedUrl.includes('{query}') || feedUrl.includes('{location}')) {
          const query = config.search_query || '';
          const location = config.search_location || '';
          finalFeedUrl = feedUrl
            .replace('{query}', encodeURIComponent(query))
            .replace('{location}', encodeURIComponent(location));
        }
        
        const rssResponse = await fetch(finalFeedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/',
          },
        });

        if (rssResponse.ok) {
          const xmlText = await rssResponse.text();
          
          // Use generic RSS parser
          const feed = parseGenericRSS(xmlText);
          jobs = feed.items.map((item) => ({
            external_id: item.guid || item.link || crypto.randomUUID(),
            source_url: item.link,
            title: item.title,
            description: item.description || null,
            company_name: item.author || null,
            company_url: null,
            location_city: null,
            location_state: null,
            location_country: 'USA',
            salary_min: null,
            salary_max: null,
            job_type: null,
            work_setting: null,
            experience_level: null,
            raw_data: { ...item, normalized_at: new Date().toISOString() },
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }));
        } else {
          result.errors.push(`RSS feed fetch failed: ${rssResponse.status} ${rssResponse.statusText}`);
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
