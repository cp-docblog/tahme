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
        const { advertiser_id, adgroup_id, ad_ids } = await req.json()

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

        // Fetch ads from TikTok API - using valid fields from API documentation
        const fields = JSON.stringify([
            'ad_id', 'ad_name', 'adgroup_id', 'campaign_id',
            'operation_status', 'secondary_status',
            'landing_page_url', 'display_name', 'ad_text', 'image_mode'
        ])

        let url = `${TT_API_BASE}/ad/get/?advertiser_id=${advertiser_id}&fields=${encodeURIComponent(fields)}&page_size=1000`

        // Filter by ad group or specific ad IDs
        const filters: any = {}
        if (adgroup_id) {
            filters.adgroup_ids = [adgroup_id]
        }
        if (ad_ids && ad_ids.length > 0) {
            filters.ad_ids = ad_ids
        }

        console.log(`[tt-ads] Fetching for advertiser: ${advertiser_id}, filters: ${JSON.stringify(filters)}`)

        if (Object.keys(filters).length > 0) {
            url += `&filtering=${encodeURIComponent(JSON.stringify(filters))}`
        }

        console.log(`[tt-ads] URL: ${url}`)


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

        // Transform to match expected format (similar to Snapchat ads)
        const ads = (data.data?.list || []).map((ad: any) => {
            // Derive review_status from secondary_status since API doesn't return it directly
            let reviewStatus = 'APPROVED'
            const secStatus = (ad.secondary_status || '').toUpperCase()

            if (secStatus.includes('REVIEW') || secStatus.includes('AUDIT')) {
                reviewStatus = 'PENDING_REVIEW'
            } else if (secStatus.includes('DENIED') || secStatus.includes('REJECTED') || secStatus.includes('DISAPPROVED')) {
                reviewStatus = 'REJECTED'
            }

            return {
                ad: {
                    id: ad.ad_id,
                    name: ad.ad_name,
                    adgroup_id: ad.adgroup_id,
                    campaign_id: ad.campaign_id,
                    status: ad.operation_status,
                    review_status: reviewStatus,
                    secondary_status: ad.secondary_status,
                    display_name: ad.display_name,
                    ad_text: ad.ad_text,
                    image_mode: ad.image_mode,
                    landing_page_url: ad.landing_page_url,
                }
            }
        })

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
