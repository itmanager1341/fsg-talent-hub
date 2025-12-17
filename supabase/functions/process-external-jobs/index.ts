import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Get pending external jobs
    const { data: pendingJobs, error: fetchError } = await supabaseAdmin
      .from('external_jobs')
      .select('*')
      .eq('status', 'pending')
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch pending jobs: ${fetchError.message}`);
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending jobs to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let matched = 0;
    const errors: string[] = [];

    // Process each job - attempt company matching
    for (const job of pendingJobs) {
      try {
        // Simple company matching logic
        if (job.company_name) {
          // Try exact match
          const { data: exactMatch } = await supabaseAdmin
            .from('companies')
            .select('id')
            .ilike('name', job.company_name.trim())
            .eq('is_active', true)
            .limit(1)
            .single();

          if (exactMatch) {
            await supabaseAdmin
              .from('external_jobs')
              .update({
                matched_company_id: exactMatch.id,
                match_confidence: 1.0,
                match_method: 'exact_name',
                status: 'matched',
              })
              .eq('id', job.id);
            matched++;
          }
        }

        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Job ${job.id}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        matched,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

