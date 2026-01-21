import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0'

interface InsightsParams {
    ad_account_id: string
    access_token: string
    level?: 'campaign' | 'adset' | 'ad'
    start_date?: string  // YYYY-MM-DD
    end_date?: string    // YYYY-MM-DD
    campaign_id?: string  // Filter by specific campaign
    adset_id?: string     // Filter by specific ad set
    granularity?: 'TOTAL' | 'DAY' | 'HOUR'  // Time breakdown
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const params: InsightsParams = await req.json()
        const { ad_account_id, access_token, level = 'campaign', start_date, end_date, campaign_id, adset_id, granularity = 'TOTAL' } = params

        if (!ad_account_id || !access_token) {
            return new Response(
                JSON.stringify({ error: 'Missing ad_account_id or access_token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Build fields for insights request - include IDs for mapping stats back
        // Add date_start and date_stop for time series data
        const baseFields = 'campaign_id,adset_id,ad_id,spend,impressions,clicks,cpc,cpm,reach,actions,action_values,conversions,cost_per_action_type'
        const fields = granularity !== 'TOTAL' ? `${baseFields},date_start,date_stop` : baseFields

        // Determine the endpoint based on filtering
        let endpoint: string
        if (adset_id && level === 'ad') {
            // Fetch insights for a specific ad set's ads
            endpoint = `${FB_GRAPH_API}/${adset_id}/insights`
        } else if (campaign_id && level === 'adset') {
            // Fetch insights for a specific campaign's ad sets
            endpoint = `${FB_GRAPH_API}/${campaign_id}/insights`
        } else {
            // Fetch insights at account level
            endpoint = `${FB_GRAPH_API}/act_${ad_account_id}/insights`
        }

        let url = `${endpoint}?fields=${fields}&level=${level}&access_token=${access_token}`

        if (start_date && end_date) {
            url += `&time_range={"since":"${start_date}","until":"${end_date}"}`
        } else {
            // Default to last 30 days
            url += `&date_preset=last_30d`
        }

        // Add time_increment for granularity
        if (granularity === 'DAY') {
            url += `&time_increment=1`  // 1 day increment
        } else if (granularity === 'HOUR') {
            // Facebook doesn't support true hourly in Insights API
            // Use daily as fallback (HOUR will show daily data on FB)
            url += `&time_increment=1`
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

        // Helper function to parse insight stats
        const parseInsightStats = (insight: any) => {
            const actions = insight.actions || []
            const actionValues = insight.action_values || []
            const purchaseAction = actions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase')
            const purchaseValue = actionValues.find((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase')

            return {
                spend: parseFloat(insight.spend || 0) * 1000000,  // Convert to micro for Snapchat compat
                impressions: parseInt(insight.impressions || 0),
                clicks: parseInt(insight.clicks || 0),
                reach: parseInt(insight.reach || 0),
                cpc: parseFloat(insight.cpc || 0),
                cpm: parseFloat(insight.cpm || 0),
                conversion_purchases: purchaseAction ? parseInt(purchaseAction.value || 0) : 0,
                conversion_purchases_value: purchaseValue ? parseFloat(purchaseValue.value || 0) * 1000000 : 0,
            }
        }

        // Handle time series vs total response
        if (granularity !== 'TOTAL') {
            // Time series response - group by date and aggregate across all ads
            const timeseriesMap = new Map<string, any>()

            for (const insight of (data.data || [])) {
                const dateKey = insight.date_start || insight.date_stop
                if (!dateKey) continue

                const stats = parseInsightStats(insight)

                if (timeseriesMap.has(dateKey)) {
                    // Aggregate stats for this date
                    const existing = timeseriesMap.get(dateKey)
                    existing.stats.spend += stats.spend
                    existing.stats.impressions += stats.impressions
                    existing.stats.clicks += stats.clicks
                    existing.stats.reach += stats.reach
                    existing.stats.conversion_purchases += stats.conversion_purchases
                    existing.stats.conversion_purchases_value += stats.conversion_purchases_value
                } else {
                    timeseriesMap.set(dateKey, {
                        start_time: dateKey,
                        stats: { ...stats }
                    })
                }
            }

            // Sort by date and convert to array
            const timeseries = Array.from(timeseriesMap.values())
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

            // Return in Snapchat-compatible timeseries format
            return new Response(
                JSON.stringify([{
                    timeseries_stats: [{
                        timeseries_stat: {
                            timeseries: timeseries
                        }
                    }]
                }]),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // TOTAL granularity - aggregate stats by entity (existing logic)
        const insights = (data.data || []).map((insight: any) => {
            let entityId: string
            if (level === 'ad') {
                entityId = insight.ad_id
            } else if (level === 'adset') {
                entityId = insight.adset_id
            } else {
                entityId = insight.campaign_id
            }

            return {
                id: entityId,
                stats: parseInsightStats(insight)
            }
        })

        // Return in Snapchat-compatible format
        return new Response(
            JSON.stringify([{
                total_stats: [{
                    total_stat: {
                        breakdown_stats: {
                            [level]: insights
                        }
                    }
                }]
            }]),
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
