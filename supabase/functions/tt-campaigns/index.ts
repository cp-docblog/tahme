import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TT_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3'

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { advertiser_id } = await req.json()

        if (!advertiser_id) {
            return new Response(
                JSON.stringify({ error: 'Missing advertiser_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch TikTok access token from creds table
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: credData, error: credError } = await supabase
            .from('creds')
            .select('cred')
            .eq('cred_name', 'tiktok_access_token')
            .single()

        if (credError || !credData?.cred) {
            return new Response(
                JSON.stringify({ error: 'TikTok access token not found in creds' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const access_token = credData.cred

        // Fetch campaigns from TikTok API
        const fields = JSON.stringify([
            'campaign_id', 'campaign_name', 'objective_type',
            'budget', 'budget_mode', 'operation_status', 'create_time'
        ])

        const url = `${TT_API_BASE}/campaign/get/?advertiser_id=${advertiser_id}&fields=${encodeURIComponent(fields)}&page_size=1000`

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Access-Token': access_token,
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()

        if (data.code !== 0) {
            console.error('TikTok API error:', data)
            return new Response(
                JSON.stringify({ error: data.message || 'TikTok API error' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Transform to match expected format (similar to Snapchat/Facebook response)
        const campaigns = (data.data?.list || []).map((campaign: any) => ({
            campaign: {
                id: campaign.campaign_id,
                name: campaign.campaign_name,
                status: campaign.operation_status,
                objective: campaign.objective_type,
                budget_micro: campaign.budget ? parseFloat(campaign.budget) * 1000000 : null,
                budget_mode: campaign.budget_mode,
                created_time: campaign.create_time,
            }
        }))

        return new Response(
            JSON.stringify([{ campaigns }]),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

