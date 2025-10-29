import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SyncScope = 'arizona' | 'national' | 'both';

interface GrantAPIRequest {
  rows: number;
  keyword?: string;
  oppStatuses: string;
  fundingCategories?: string;
  agencies?: string;
  eligibilities?: string;
}

async function fetchGrantsFromAPI(requestBody: GrantAPIRequest) {
  const apiUrl = 'https://api.grants.gov/v1/api/search2';
  
  console.log('Calling Grants.gov API with body:', requestBody);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Grants.gov API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function parseGrantAmount(oppHit: any): { min_amount: number | null, max_amount: number | null } {
  let min_amount = null;
  let max_amount = null;

  // Try to parse award floor and ceiling
  if (oppHit.awardFloor && !isNaN(parseFloat(oppHit.awardFloor))) {
    min_amount = Math.round(parseFloat(oppHit.awardFloor));
  }
  if (oppHit.awardCeiling && !isNaN(parseFloat(oppHit.awardCeiling))) {
    max_amount = Math.round(parseFloat(oppHit.awardCeiling));
  }

  // Try to parse estimated funding
  if (!max_amount && oppHit.estimatedFunding && !isNaN(parseFloat(oppHit.estimatedFunding))) {
    max_amount = Math.round(parseFloat(oppHit.estimatedFunding));
  }

  return { min_amount, max_amount };
}

function parseIndustryTags(oppHit: any): string[] {
  const tags: string[] = [];
  
  if (oppHit.fundingCategories) {
    const categories = Array.isArray(oppHit.fundingCategories) 
      ? oppHit.fundingCategories 
      : [oppHit.fundingCategories];
    tags.push(...categories.filter((cat: string) => cat && cat.trim()));
  }

  if (oppHit.category) {
    const category = Array.isArray(oppHit.category) 
      ? oppHit.category 
      : [oppHit.category];
    tags.push(...category.filter((cat: string) => cat && cat.trim()));
  }

  // Remove duplicates
  return [...new Set(tags)];
}

function parseDemographics(oppHit: any): string[] {
  const demographics: string[] = [];
  
  if (oppHit.eligibilities) {
    const eligibilities = Array.isArray(oppHit.eligibilities)
      ? oppHit.eligibilities
      : [oppHit.eligibilities];
    demographics.push(...eligibilities.filter((elig: string) => elig && elig.trim()));
  }

  return demographics;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for scope parameter
    let scope: SyncScope = 'both';
    try {
      const body = await req.json();
      if (body.scope && ['arizona', 'national', 'both'].includes(body.scope)) {
        scope = body.scope;
      }
    } catch {
      // If no body or invalid JSON, use default scope
    }

    console.log(`Starting federal grant sync from Grants.gov API... Scope: ${scope}`);

    let recordsAffected = 0;
    const grants = [];

    // Fetch Arizona grants
    if (scope === 'arizona' || scope === 'both') {
      console.log('Fetching Arizona-specific grants...');
      const azRequestBody: GrantAPIRequest = {
        rows: 500,
        keyword: 'Arizona',
        oppStatuses: 'posted|forecasted',
      };

      const azData = await fetchGrantsFromAPI(azRequestBody);
      console.log(`Received ${azData.oppHits?.length || 0} Arizona grants from API`);

      if (azData.oppHits && Array.isArray(azData.oppHits)) {
        for (const oppHit of azData.oppHits) {
          grants.push({ ...oppHit, scopeState: 'AZ' });
        }
      }
    }

    // Fetch National grants
    if (scope === 'national' || scope === 'both') {
      console.log('Fetching nationally available grants...');
      const nationalRequestBody: GrantAPIRequest = {
        rows: 500,
        oppStatuses: 'posted|forecasted',
        eligibilities: '25',
      };

      const nationalData = await fetchGrantsFromAPI(nationalRequestBody);
      console.log(`Received ${nationalData.oppHits?.length || 0} national grants from API`);

      if (nationalData.oppHits && Array.isArray(nationalData.oppHits)) {
        for (const oppHit of nationalData.oppHits) {
          // Check if not already in AZ grants by oppId
          const existsInAZ = grants.some(g => g.id === oppHit.id);
          if (!existsInAZ) {
            grants.push({ ...oppHit, scopeState: null });
          }
        }
      }
    }

    console.log(`Processing ${grants.length} total grants...`);

    // Process each grant opportunity
    for (const grant of grants) {
      const oppStatus = (grant.oppStatus === 'posted' || grant.oppStatus === 'forecasted') ? 'OPEN' : 'CLOSED';
      const { min_amount, max_amount } = parseGrantAmount(grant);
      const industry_tags = parseIndustryTags(grant);
      const demographics = parseDemographics(grant);

      const grantData = {
        type: 'GRANT' as const,
        level: 'FEDERAL' as const,
        name: grant.title || 'Untitled Grant',
        sponsor: grant.agencyName || 'Unknown Agency',
        state: grant.scopeState,
        url: `https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.id}`,
        description: grant.description || grant.synopsis || null,
        industry_tags,
        demographics,
        min_amount,
        max_amount,
        deadline: grant.closeDate ? new Date(grant.closeDate).toISOString() : null,
        rolling: false,
        status: oppStatus as 'OPEN' | 'CLOSED',
      };

      // Check if program already exists by URL
      const { data: existingProgram } = await supabase
        .from('programs')
        .select('id')
        .eq('url', grantData.url)
        .maybeSingle();

      if (existingProgram) {
        // Update existing program
        const { error: updateError } = await supabase
          .from('programs')
          .update(grantData)
          .eq('id', existingProgram.id);

        if (updateError) {
          console.error('Error updating grant:', updateError);
        } else {
          recordsAffected++;
        }
      } else {
        // Insert new program
        const { error: insertError } = await supabase
          .from('programs')
          .insert([grantData]);

        if (insertError) {
          console.error('Error inserting grant:', insertError);
        } else {
          recordsAffected++;
        }
      }
    }

    console.log(`Successfully processed ${recordsAffected} grants`);

    // Log sync metadata
    const { error: metadataError } = await supabase
      .from('sync_metadata')
      .insert([{
        sync_type: 'grants',
        records_synced: recordsAffected,
        status: 'success',
      }]);

    if (metadataError) {
      console.error('Failed to log sync metadata:', metadataError);
    }

    // Get the latest sync timestamp
    const { data: syncData } = await supabase
      .from('sync_metadata')
      .select('last_synced, records_synced')
      .eq('sync_type', 'grants')
      .order('last_synced', { ascending: false })
      .limit(1)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        recordsSynced: recordsAffected,
        lastSynced: syncData?.last_synced,
        message: `Successfully synced ${recordsAffected} grants (scope: ${scope})`,
        scope,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing grants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Log error to sync_metadata
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('sync_metadata')
        .insert([{
          sync_type: 'grants',
          records_synced: 0,
          status: 'error',
          error_message: errorMessage,
        }]);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
