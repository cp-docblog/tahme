import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0'

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { ad_account_id, campaign_id, access_token } = await req.json()

        if (!ad_account_id || !access_token) {
            return new Response(
                JSON.stringify({ error: 'Missing ad_account_id or access_token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch ad sets from Facebook Graph API
        const fields = 'id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,targeting,bid_amount,created_time'
        let url = `${FB_GRAPH_API}/act_${ad_account_id}/adsets?fields=${fields}&access_token=${access_token}`

        // Filter by campaign if provided
        if (campaign_id) {
            url += `&filtering=[{"field":"campaign.id","operator":"EQUAL","value":"${campaign_id}"}]`
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.error) {
            console.error('Facebook API error:', data.error)
            return new Response(
                JSON.stringify({ error: data.error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Transform to match expected format (similar to Snapchat's adsquads)
        const adsets = (data.data || []).map((adset: any) => ({
            adsquad: {  // Using adsquad key for frontend compatibility
                id: adset.id,
                name: adset.name,
                status: adset.status,
                campaign_id: adset.campaign_id,
                daily_budget_micro: adset.daily_budget ? parseInt(adset.daily_budget) * 1000000 : null,
                lifetime_budget_micro: adset.lifetime_budget ? parseInt(adset.lifetime_budget) * 1000000 : null,
                optimization_goal: adset.optimization_goal,
                bid_micro: adset.bid_amount ? parseInt(adset.bid_amount) * 1000000 : null,
                targeting: adset.targeting,
                created_time: adset.created_time,
            }
        }))

        return new Response(
            JSON.stringify([{ adsquads: adsets }]),
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
