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

        // Fetch TikTok app_id from creds table
        const { data: appIdData, error: appIdError } = await supabase
            .from('creds')
            .select('cred')
            .eq('cred_name', 'tiktok_app_id')
            .single()

        if (appIdError || !appIdData?.cred) {
            return new Response(
                JSON.stringify({ error: 'TikTok app_id not found in creds' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const app_id = appIdData.cred

        // Fetch TikTok secret from creds table
        const { data: secretData, error: secretError } = await supabase
            .from('creds')
            .select('cred')
            .eq('cred_name', 'tiktok_secret')
            .single()

        if (secretError || !secretData?.cred) {
            return new Response(
                JSON.stringify({ error: 'TikTok secret not found in creds' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const secret = secretData.cred

        // Fetch advertisers the user manages
        const url = `${TT_API_BASE}/oauth2/advertiser/get/?app_id=${app_id}&secret=${secret}`

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

        // Return list of advertisers
        const advertisers = (data.data?.list || []).map((adv: any) => ({
            advertiser_id: adv.advertiser_id,
            advertiser_name: adv.advertiser_name
        }))

        return new Response(
            JSON.stringify({ advertisers }),
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
