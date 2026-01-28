import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SNAP_API_BASE = 'https://adsapi.snapchat.com/v1'

interface InsightsParams {
    accountId: string
    queryString: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const params: InsightsParams = await req.json()
        const { accountId, queryString } = params

        if (!accountId) {
            return new Response(
                JSON.stringify({ error: 'Missing accountId' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch Snapchat access token from creds table
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: credData, error: credError } = await supabase
            .from('creds')
            .select('cred')
            .eq('cred_name', 'snap_at')
            .single()

        if (credError || !credData?.cred) {
            console.error('[Snap Insights] Token fetch error:', credError)
            return new Response(
                JSON.stringify({ error: 'Snapchat access token not found in creds' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const access_token = credData.cred

        // Build the API URL
        const apiUrl = `${SNAP_API_BASE}/adaccounts/${accountId}/stats?${queryString}`
        console.log(`[Snap Insights] Fetching: ${apiUrl}`)

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[Snap Insights] API error: ${response.status} - ${errorText}`)
            return new Response(
                JSON.stringify({ error: `Snapchat API error: ${response.status}`, details: errorText }),
                { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const data = await response.json()
        console.log(`[Snap Insights] Success for account ${accountId}`)

        // Return the raw Snapchat response wrapped in an array (matching previous webhook format)
        return new Response(
            JSON.stringify([data]),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[Snap Insights] Edge function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
