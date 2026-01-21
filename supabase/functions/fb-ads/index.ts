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
        const { ad_account_id, adset_id, access_token } = await req.json()

        if (!ad_account_id || !access_token) {
            return new Response(
                JSON.stringify({ error: 'Missing ad_account_id or access_token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch ads from Facebook Graph API
        const fields = 'id,name,status,adset_id,creative{id,video_id,image_url,thumbnail_url},created_time,effective_status'
        let url = `${FB_GRAPH_API}/act_${ad_account_id}/ads?fields=${fields}&access_token=${access_token}`

        // Filter by ad set if provided
        if (adset_id) {
            url += `&filtering=[{"field":"adset.id","operator":"EQUAL","value":"${adset_id}"}]`
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

        // Transform to match expected format (similar to Snapchat's ads)
        const ads = (data.data || []).map((ad: any) => ({
            ad: {
                id: ad.id,
                name: ad.name,
                status: ad.status,
                review_status: ad.effective_status === 'DISAPPROVED' ? 'REJECTED' :
                    ad.effective_status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'APPROVED',
                ad_squad_id: ad.adset_id,  // Map to Snapchat naming for compatibility
                creative: ad.creative,
                created_time: ad.created_time,
            }
        }))

        return new Response(
            JSON.stringify([{ ads }]),
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
