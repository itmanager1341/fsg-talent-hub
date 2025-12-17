import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HubSpotCompany {
  properties: {
    name: string;
    domain?: string;
    website?: string;
    industry?: string;
    description?: string;
    numberofemployees?: string;
    city?: string;
    state?: string;
    country?: string;
    hs_lead_status?: string;
  };
}

interface HubSpotContact {
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    jobtitle?: string;
    phone?: string;
  };
}

/**
 * Create company in HubSpot
 */
async function createHubSpotCompany(
  hubspotToken: string,
  companyData: {
    name: string;
    domain?: string;
    website?: string;
    industry?: string;
    description?: string;
  }
): Promise<string> {
  const company: HubSpotCompany = {
    properties: {
      name: companyData.name,
      hs_lead_status: 'NEW',
    },
  };

  if (companyData.domain) {
    company.properties.domain = companyData.domain;
  }
  if (companyData.website) {
    company.properties.website = companyData.website;
  }
  if (companyData.industry) {
    company.properties.industry = companyData.industry;
  }
  if (companyData.description) {
    company.properties.description = companyData.description;
  }

  const response = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(company),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot company creation failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Create contact in HubSpot (optional)
 */
async function createHubSpotContact(
  hubspotToken: string,
  companyId: string,
  contactData: {
    company_name: string;
    email?: string;
    firstname?: string;
    lastname?: string;
  }
): Promise<string | null> {
  // Only create contact if we have email
  if (!contactData.email) {
    return null;
  }

  const contact: HubSpotContact = {
    properties: {
      email: contactData.email,
      company: contactData.company_name,
    },
  };

  if (contactData.firstname) {
    contact.properties.firstname = contactData.firstname;
  }
  if (contactData.lastname) {
    contact.properties.lastname = contactData.lastname;
  }

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      // Contact creation is optional, don't fail if it doesn't work
      console.error('HubSpot contact creation failed:', await response.text());
      return null;
    }

    const result = await response.json();
    
    // Associate contact with company
    await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${result.id}/associations/companies/${companyId}/4`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json',
      },
    });

    return result.id;
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { company_name, company_url, job_count, enrichment_data } = await req.json();

    if (!company_name) {
      return new Response(
        JSON.stringify({ error: 'company_name is required' }),
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

    // Get HubSpot token from environment
    const hubspotToken = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN');
    if (!hubspotToken) {
      return new Response(
        JSON.stringify({ error: 'HubSpot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract domain from URL
    let domain: string | undefined;
    if (company_url) {
      try {
        const url = new URL(company_url);
        domain = url.hostname.replace('www.', '');
      } catch {
        // Invalid URL, skip domain extraction
      }
    }

    // Prepare company data
    const companyData = {
      name: company_name,
      domain,
      website: company_url || undefined,
      industry: (enrichment_data as any)?.industry,
      description: (enrichment_data as any)?.description,
    };

    // Create company in HubSpot
    const companyId = await createHubSpotCompany(hubspotToken, companyData);

    // Create contact (optional - we don't have email yet)
    const contactId = await createHubSpotContact(hubspotToken, companyId, {
      company_name,
    });

    // Add note about job count
    if (job_count > 0) {
      await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: `Found ${job_count} job posting(s) from this company. Potential employer prospect for FSG Talent Hub.`,
            hs_timestamp: new Date().toISOString(),
          },
          associations: [
            {
              to: { id: companyId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }],
            },
          ],
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        company_id: companyId,
        contact_id: contactId,
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

