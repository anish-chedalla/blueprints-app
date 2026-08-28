import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { authenticateRequest } from "../_shared/security.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SyncScope = 'arizona' | 'national' | 'both';

interface GrantAPIRequest {
  rows: number;
  startRecordNum?: number;
  keyword?: string;
  oppStatuses: string;
  fundingCategories?: string;
  fundingInstruments?: string;
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

  const payload = await response.json();
  if (payload?.errorcode !== 0 || !payload?.data) {
    throw new Error(payload?.msg || 'Grants.gov returned an invalid response');
  }

  // Grants.gov wraps search results in a top-level `data` object.
  return payload.data;
}

function parseApiDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}T12:00:00.000Z`;
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

    const authentication = await authenticateRequest(req, supabase);
    if (!authentication.user) {
      return new Response(JSON.stringify({ error: authentication.error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (authentication.user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Administrator access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    let recordsFailed = 0;
    const grants = [];

    // Fetch Arizona grants
    if (scope === 'arizona' || scope === 'both') {
      console.log('Fetching Arizona-specific grants...');
      const azRequestBody: GrantAPIRequest = {
        rows: 500,
        startRecordNum: 0,
        keyword: 'Arizona',
        oppStatuses: 'posted|forecasted',
        fundingInstruments: 'G',
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
        startRecordNum: 0,
        oppStatuses: 'posted|forecasted',
        eligibilities: '23|99',
        fundingInstruments: 'G',
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

    const grantRows = [];
    for (const grant of grants) {
      if (!grant.id) {
        recordsFailed++;
        continue;
      }
      const oppStatus = (grant.oppStatus === 'posted' || grant.oppStatus === 'forecasted') ? 'OPEN' : 'CLOSED';
      const { min_amount, max_amount } = parseGrantAmount(grant);
      const industry_tags = parseIndustryTags(grant);
      const demographics = parseDemographics(grant);

      const grantData = {
        source_id: `grants-gov:${grant.id}`,
        type: 'GRANT' as const,
        level: 'NATIONAL' as const,
        name: grant.title || 'Untitled Grant',
        sponsor: grant.agency || grant.agencyName || 'Unknown Agency',
        state: grant.scopeState,
        url: `https://www.grants.gov/search-results-detail/${grant.id}`,
        description: grant.description || grant.synopsis || 'See Grants.gov for full opportunity details.',
        industry_tags,
        demographics,
        min_amount,
        max_amount,
        deadline: parseApiDate(grant.closeDate),
        rolling: false,
        status: oppStatus as 'OPEN' | 'CLOSED',
      };

      grantRows.push(grantData);
    }

    // Upsert bounded batches instead of making two serial database calls for
    // every opportunity, which can exceed an Edge Function execution window.
    for (let index = 0; index < grantRows.length; index += 100) {
      const batch = grantRows.slice(index, index + 100);
      const { error: upsertError } = await supabase
        .from('programs')
        .upsert(batch, { onConflict: 'source_id' });

      if (upsertError) {
        recordsFailed += batch.length;
        console.error('Error upserting grant batch:', upsertError);
      } else {
        recordsAffected += batch.length;
      }
    }

    console.log(`Successfully processed ${recordsAffected} grants`);

    // Log sync metadata
    const { error: metadataError } = await supabase
      .from('sync_metadata')
      .insert([{
        sync_type: 'grants',
        records_synced: recordsAffected,
        status: recordsFailed > 0 ? 'partial' : 'success',
        error_message: recordsFailed > 0 ? `${recordsFailed} records failed to sync` : null,
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
        success: recordsFailed === 0,
        recordsSynced: recordsAffected,
        recordsFailed,
        lastSynced: syncData?.last_synced,
        message: recordsFailed === 0
          ? `Successfully synced ${recordsAffected} grants (scope: ${scope})`
          : `Synced ${recordsAffected} grants; ${recordsFailed} failed (scope: ${scope})`,
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
