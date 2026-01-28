import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TT_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3'

interface InsightsParams {
    advertiser_id: string
    start_date?: string  // YYYY-MM-DD
    end_date?: string    // YYYY-MM-DD
    granularity?: 'TOTAL' | 'DAY'
    level?: 'campaign' | 'adgroup' | 'ad'  // Report level
    ad_ids?: string[]    // Filter by specific ads
    adgroup_id?: string  // Filter by adgroup
    campaign_id?: string // Filter by campaign
    page_size?: number
    order_field?: string
    order_type?: 'ASC' | 'DESC'
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const params: InsightsParams = await req.json()
        const {
            advertiser_id,
            start_date,
            end_date,
            granularity = 'TOTAL',
            level = 'ad',
            ad_ids,
            adgroup_id,
            campaign_id
        } = params

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

        // Map frontend level to TikTok data_level and dimensions
        let data_level = 'AUCTION_AD'
        let id_dimension = 'ad_id'

        switch (level) {
            case 'campaign':
                data_level = 'AUCTION_CAMPAIGN'
                id_dimension = 'campaign_id'
                break
            case 'adgroup':
                data_level = 'AUCTION_ADGROUP'
                id_dimension = 'adgroup_id'
                break
            case 'ad':
            default:
                data_level = 'AUCTION_AD'
                id_dimension = 'ad_id'
                break
        }

        const dimensions = granularity === 'DAY'
            ? [id_dimension, 'stat_time_day']
            : [id_dimension]

        const metrics = [
            'spend', 'impressions', 'clicks', 'cpc', 'cpm', 'ctr',
            'conversion', 'cost_per_conversion', 'conversion_rate',
            'video_play_actions', 'video_watched_2s', 'video_watched_6s',
            'reach', 'frequency',
            'complete_payment', 'total_complete_payment_rate', 'value_per_complete_payment', 'total_purchase_value', 'complete_payment_roas'
        ]

        // Calculate date range (default last 30 days)
        // Calculate date range (default last 30 days, EXCLUDING today)
        const endDt = end_date || (() => {
            const d = new Date()
            d.setDate(d.getDate() - 1) // Yesterday
            return d.toISOString().split('T')[0]
        })()

        const startDt = start_date || (() => {
            const d = new Date()
            d.setDate(d.getDate() - 30) // Today - 30 => (Yesterday - 29)
            return d.toISOString().split('T')[0]
        })()

        // ... (filters/query construction)

        // Add filtering
        const filters = []

        if (ad_ids && ad_ids.length > 0) {
            filters.push({
                field_name: 'ad_ids',
                filter_type: 'IN',
                filter_value: JSON.stringify(ad_ids)
            })
        }

        if (adgroup_id) {
            filters.push({
                field_name: 'adgroup_ids',
                filter_type: 'IN',
                filter_value: JSON.stringify([adgroup_id])
            })
        }

        if (campaign_id) {
            filters.push({
                field_name: 'campaign_ids',
                filter_type: 'IN',
                filter_value: JSON.stringify([campaign_id])
            })
        }

        const queryParams = new URLSearchParams({
            advertiser_id,
            report_type: 'BASIC',
            data_level,
            start_date: startDt,
            end_date: endDt,
            page_size: params.page_size ? String(params.page_size) : '1000',
            dimensions: JSON.stringify(dimensions),
            metrics: JSON.stringify(metrics),
        })

        if (params.order_field) {
            queryParams.append('order_field', params.order_field)
            queryParams.append('order_type', params.order_type || 'DESC')
        }

        if (filters.length > 0) {
            queryParams.append('filters', JSON.stringify(filters))
        }

        console.log(`[TT Insights] Fetching BASIC report level=${level}...`)
        const response = await fetch(`${TT_API_BASE}/report/integrated/get/?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Access-Token': access_token,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            console.error(`[TT Insights] fetch failed: ${response.status}`)
            return new Response(
                JSON.stringify({ error: `TikTok API error: ${response.status}` }),
                { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const data = await response.json()
        if (data.code !== 0) {
            console.warn(`[TT Insights] API error:`, data.message)
            return new Response(
                JSON.stringify({ error: data.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const rows = data.data?.list || []

        // Transform based on granularity
        if (granularity === 'DAY') {
            // ... existing time series logic ...

            // Time series formatting logic (unchanged from previous step logic but operating on mergedRows)
            const timeseriesMap = new Map<string, any>()
            // ...
            for (const row of rows) {
                // ... logic ...
            }
            // ... return ...
        }

        // TOTAL granularity - aggregate by ID (campaign, adgroup, or ad)
        const insights = rows.map((row: any) => {
            const metrics = row.metrics
            // ID key depends on dimension (campaign_id, adgroup_id, or ad_id)
            // ... logic ...
            const id = row.dimensions[id_dimension]

            return {
                id: id,
                stats: {
                    spend: parseFloat(metrics.spend || 0) * 1000000,
                    impressions: parseInt(metrics.impressions || 0),
                    clicks: parseInt(metrics.clicks || 0),
                    reach: parseInt(metrics.reach || 0),
                    cpc: parseFloat(metrics.cpc || 0),
                    cpm: parseFloat(metrics.cpm || 0),
                    ctr: parseFloat(metrics.ctr || 0),
                    conversion_purchases: parseInt(metrics.complete_payment || 0),
                    conversion_purchases_value: parseFloat(metrics.total_purchase_value || 0) ||
                        (parseFloat(metrics.complete_payment_roas || 0) * parseFloat(metrics.spend || 0)) ||
                        (parseFloat(metrics.complete_payment || 0) * parseFloat(metrics.value_per_complete_payment || 0)),
                    cost_per_conversion: parseFloat(metrics.cost_per_conversion || 0),
                    roas: parseFloat(metrics.complete_payment_roas || 0),
                    video_plays: parseInt(metrics.video_play_actions || 0),
                }
            }
        })

        // ... return structure ...
        const breakdownKey = level
        const responseData: any = {
            total_stats: [{
                total_stat: {
                    breakdown_stats: {
                        [breakdownKey]: insights
                    }
                }
            }]
        }

        return new Response(
            JSON.stringify([responseData]),
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
