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
        const { ad_account_id, access_token } = await req.json()

        if (!ad_account_id || !access_token) {
            return new Response(
                JSON.stringify({ error: 'Missing ad_account_id or access_token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch campaigns from Facebook Graph API
        const fields = 'id,name,status,objective,daily_budget,lifetime_budget,created_time'
        const url = `${FB_GRAPH_API}/act_${ad_account_id}/campaigns?fields=${fields}&access_token=${access_token}`

        const response = await fetch(url)
        const data = await response.json()

        if (data.error) {
            console.error('Facebook API error:', data.error)
            return new Response(
                JSON.stringify({ error: data.error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Transform to match expected format (similar to Snapchat response)
        const campaigns = (data.data || []).map((campaign: any) => ({
            campaign: {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                objective: campaign.objective,
                daily_budget_micro: campaign.daily_budget ? parseInt(campaign.daily_budget) * 1000000 : null,
                lifetime_budget_micro: campaign.lifetime_budget ? parseInt(campaign.lifetime_budget) * 1000000 : null,
                created_time: campaign.created_time,
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
