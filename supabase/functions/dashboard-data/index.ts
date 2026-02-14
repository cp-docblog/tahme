import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Verify auth
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Check for force refresh
        const requestBody = await req.json().catch(() => ({}))
        const forceRefresh = requestBody.refresh === true
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

        // Check cache
        if (!forceRefresh) {
            const { data: cached } = await supabase
                .from('dashboard_cache')
                .select('data, updated_at')
                .eq('user_id', user.id)
                .single()

            if (cached && (Date.now() - new Date(cached.updated_at).getTime() < CACHE_DURATION)) {
                return new Response(JSON.stringify(cached.data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        }

        // Fetch clients
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*')

        if (clientsError) throw new Error(`Failed to fetch clients: ${clientsError.message}`)
        if (!clients || clients.length === 0) return emptyResponse()

        const backendUrl = Deno.env.get('BACKEND_WEBHOOK_URL')
        const functionUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1'
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        // Fetch data for all clients concurrently
        const clientPromises = clients.map(async (client) => {
            const results = await Promise.allSettled([
                fetchSnapchat(client, backendUrl),
                fetchTikTok(client, functionUrl, serviceKey),
                fetchFacebook(client, functionUrl, serviceKey),
                fetchTopAdTikTok(client, functionUrl, serviceKey),
                fetchTopAdFacebook(client, functionUrl, serviceKey),
                fetchTopAdSnapchat(client, functionUrl, serviceKey)
            ])

            const snap = results[0].status === 'fulfilled' ? results[0].value : null
            const tiktok = results[1].status === 'fulfilled' ? results[1].value : null
            const fb = results[2].status === 'fulfilled' ? results[2].value : null
            const topAdTikTok = results[3].status === 'fulfilled' ? results[3].value : null
            const topAdFb = results[4].status === 'fulfilled' ? results[4].value : null
            const topAdSnapchat = results[5].status === 'fulfilled' ? results[5].value : null

            return blendMetrics(client, snap, tiktok, fb, topAdTikTok, topAdFb, topAdSnapchat)
        })

        const clientsWithMetrics = await Promise.all(clientPromises)

        // Insights & Stats
        const quickStats = calculateQuickStats(clientsWithMetrics)
        const insights = generateInsights(clientsWithMetrics)

        const dashboardData = {
            quickStats,
            clients: clientsWithMetrics,
            insights
        }

        // Cache result
        await supabase
            .from('dashboard_cache')
            .upsert({ user_id: user.id, data: dashboardData })

        return new Response(JSON.stringify(dashboardData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

// --- Fetchers ---

// TikTok API has a 365-day limit, so we need to fetch in chunks
function getYearlyDateRanges(): Array<{ start_date: string, end_date: string }> {
    const ranges: Array<{ start_date: string, end_date: string }> = []
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1) // Yesterday

    // Start from 2020-01-01
    let currentStart = new Date('2020-01-01')

    while (currentStart < endDate) {
        // Each chunk is 365 days max
        const chunkEnd = new Date(currentStart)
        chunkEnd.setDate(chunkEnd.getDate() + 364) // 365 days total

        const actualEnd = chunkEnd < endDate ? chunkEnd : endDate

        ranges.push({
            start_date: currentStart.toISOString().split('T')[0],
            end_date: actualEnd.toISOString().split('T')[0]
        })

        // Move to next chunk
        currentStart = new Date(actualEnd)
        currentStart.setDate(currentStart.getDate() + 1)
    }

    return ranges
}

// For Facebook which has a 37-month limit
function getLifetimeRange() {
    const end = new Date()
    end.setDate(end.getDate() - 1) // Yesterday

    // Facebook has a 37-month limit, so use 36 months to be safe
    const start = new Date()
    start.setMonth(start.getMonth() - 36)

    return {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
    }
}

async function fetchSnapchat(client: any, backendUrl: string) {
    if (!client.snapchat_ad_account_id) return null
    try {
        const res = await fetch(`${backendUrl}/fetch-snap-campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad_account_id: client.snapchat_ad_account_id })
        })
        if (!res.ok) return null
        const campaigns = await res.json()

        let spend = 0, revenue = 0
        if (Array.isArray(campaigns)) {
            campaigns.forEach((c: any) => {
                spend += parseFloat(c.lifetime_spend || 0)
                revenue += parseFloat(c.conversion_purchases_value || 0)
            })
        }
        return { spend, revenue, campaigns: Array.isArray(campaigns) ? campaigns : [] }
    } catch { return null }
}

async function fetchTikTok(client: any, baseUrl: string, key: string) {
    if (!client.tiktok_advertiser_id) return null
    try {
        const dateRanges = getYearlyDateRanges()
        const EXCHANGE_RATE_SAR_TO_USD = 1 / 3.75

        let totalSpend = 0, totalRevenue = 0
        const allCampaigns: any[] = []

        // Fetch data for each year chunk and aggregate
        for (const { start_date, end_date } of dateRanges) {
            const res = await fetch(`${baseUrl}/tt-insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    advertiser_id: client.tiktok_advertiser_id,
                    level: 'campaign',
                    granularity: 'TOTAL',
                    start_date,
                    end_date
                })
            })

            if (!res.ok) continue // Skip failed chunks

            const data = await res.json()
            const rows = data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.campaign || []

            rows.forEach((r: any) => {
                // Convert Spend from SAR to USD
                const spendSAR = r.stats.spend
                const spendUSD = spendSAR * EXCHANGE_RATE_SAR_TO_USD
                totalSpend += spendUSD

                // Revenue Calculation & Conversion
                let valSAR = 0
                if (r.stats.roas) {
                    valSAR = r.stats.roas * spendSAR
                } else {
                    valSAR = (r.stats.conversion_purchases_value || 0) * 1000000
                }

                const valUSD = valSAR * EXCHANGE_RATE_SAR_TO_USD
                totalRevenue += valUSD

                // Update row stats for downstream usage
                r.stats.spend = spendUSD
                r.stats.conversion_purchases_value = valUSD / 1000000
            })

            allCampaigns.push(...rows)
        }

        return { spend: totalSpend, revenue: totalRevenue, campaigns: allCampaigns }
    } catch { return null }
}

async function fetchFacebook(client: any, baseUrl: string, key: string) {
    if (!client.facebook_ad_account_id || !client.facebook_access_token) return null
    try {
        const { start_date, end_date } = getLifetimeRange()
        const res = await fetch(`${baseUrl}/fb-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                ad_account_id: client.facebook_ad_account_id,
                access_token: client.facebook_access_token,
                level: 'campaign',
                granularity: 'TOTAL',
                start_date,
                end_date
            })
        })
        if (!res.ok) return null
        const data = await res.json()
        const rows = data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.campaign || []

        let spend = 0, revenue = 0
        rows.forEach((r: any) => {
            spend += r.stats.spend
            revenue += r.stats.conversion_purchases_value
        })
        return { spend, revenue, campaigns: rows }
    } catch { return null }
}

// --- Fetchers ---

async function fetchTopAdTikTok(client: any, baseUrl: string, key: string) {
    if (!client.tiktok_advertiser_id) return null
    try {
        console.log(`[TT] Fetching Top Ad ID for ${client.name} (${client.tiktok_advertiser_id})`)
        const res = await fetch(`${baseUrl}/tt-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                advertiser_id: client.tiktok_advertiser_id,
                level: 'ad',
                granularity: 'TOTAL',
                page_size: 1,
                order_field: 'spend',
                order_type: 'DESC'
            })
        })
        if (!res.ok) {
            console.error(`[TT] Insights fetch failed: ${res.status} ${await res.text()}`)
            return null
        }
        const data = await res.json()
        const rows = data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.ad || []

        console.log(`[TT] Found ${rows.length} ads. Top ID: ${rows[0]?.id}`)

        if (rows.length > 0) {
            const ad = rows[0]

            // Step 2: Fetch Ad Name using tt-ads
            try {
                console.log(`[TT] Calling tt-ads for ID: ${ad.id}`)
                const nameRes = await fetch(`${baseUrl}/tt-ads`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        advertiser_id: client.tiktok_advertiser_id,
                        ad_ids: [ad.id]
                    })
                })

                let adName = 'Unknown Ad'
                if (nameRes.ok) {
                    const nameData = await nameRes.json()
                    console.log(`[TT] tt-ads response: ${JSON.stringify(nameData)}`)
                    const adDetail = nameData[0]?.ads?.[0]?.ad
                    if (adDetail) {
                        adName = adDetail.name
                        console.log(`[TT] Resolved Name: ${adName}`)
                    }
                } else {
                    console.error(`[TT] tt-ads call failed: ${nameRes.status}`)
                }

                // Convert Top Ad metrics from SAR to USD
                const EXCHANGE_RATE_SAR_TO_USD = 1 / 3.75
                const spendUSD = ad.stats.spend * EXCHANGE_RATE_SAR_TO_USD
                const revenueUSD = ad.stats.conversion_purchases_value * EXCHANGE_RATE_SAR_TO_USD

                return {
                    name: adName,
                    spend: spendUSD,
                    revenue: revenueUSD,
                    roas: ad.stats.roas || (ad.stats.spend > 0 ? ad.stats.conversion_purchases_value / ad.stats.spend : 0)
                }
            } catch (nameErr) {
                console.error('[TT] Name fetch error:', nameErr)
                return {
                    name: 'Unknown Ad',
                    spend: ad.stats.spend,
                    revenue: ad.stats.conversion_purchases_value,
                    roas: ad.stats.roas || (ad.stats.spend > 0 ? ad.stats.conversion_purchases_value / ad.stats.spend : 0)
                }
            }
        }
        return null
    } catch (e) {
        console.error('[TT] Error:', e)
        return null
    }
}

async function fetchTopAdFacebook(client: any, baseUrl: string, key: string) {
    if (!client.facebook_ad_account_id || !client.facebook_access_token) return null
    try {
        console.log(`[FB] Fetching Top Ad for ${client.name} (${client.facebook_ad_account_id})`)
        const res = await fetch(`${baseUrl}/fb-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                ad_account_id: client.facebook_ad_account_id,
                access_token: client.facebook_access_token,
                level: 'ad',
                granularity: 'TOTAL',
                limit: 50 // Fetch enough to find the top one
            })
        })
        if (!res.ok) {
            console.error(`[FB] Fetch failed: ${res.status} ${await res.text()}`)
            return null
        }
        const data = await res.json()
        const rows = data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.ad || []

        console.log(`[FB] Found ${rows.length} ads. Sorting...`)

        if (rows.length > 0) {
            // Sort in-memory by spend desc
            rows.sort((a: any, b: any) => b.stats.spend - a.stats.spend)

            const ad = rows[0]
            console.log(`[FB] Top Ad: ${ad.name} ($${ad.stats.spend})`)
            return {
                name: ad.name,
                spend: ad.stats.spend,
                revenue: ad.stats.conversion_purchases_value
            }
        }
        return null
    } catch (e) {
        console.error('[FB] Error:', e)
        return null
    }
}

async function fetchTopAdSnapchat(client: any, baseUrl: string, key: string) {
    if (!client.snapchat_ad_account_id) return null
    try {
        console.log(`[Snap] Fetching Top Ad for ${client.name} (${client.snapchat_ad_account_id})`)

        // Build query string for ad-level breakdown, sorted by spend
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const thirtyDaysAgo = new Date(yesterday)
        thirtyDaysAgo.setDate(yesterday.getDate() - 29)

        const formatSnapDate = (date: Date, isEnd: boolean = false): string => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            let d = date
            if (isEnd) {
                d = new Date(date)
                d.setDate(d.getDate() + 1)
            }
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const dy = String(d.getDate()).padStart(2, '0')
            return `${y}-${m}-${dy}T00:00:00%2B03:00`
        }

        const params = [
            'fields=spend,impressions,conversion_purchases,conversion_purchases_value',
            'breakdown=ad',
            `start_time=${formatSnapDate(thirtyDaysAgo, false)}`,
            `end_time=${formatSnapDate(yesterday, true)}`,
            'granularity=TOTAL',
            'swipe_up_attribution_window=7_DAY',
            'view_attribution_window=NONE',
            'omit_empty=true'
        ]
        const queryString = params.join('&')

        const res = await fetch(`${baseUrl}/snap-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                accountId: client.snapchat_ad_account_id,
                queryString: queryString
            })
        })

        if (!res.ok) {
            console.error(`[Snap] Fetch failed: ${res.status} ${await res.text()}`)
            return null
        }

        const data = await res.json()
        const rows = data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.ad || []

        console.log(`[Snap] Found ${rows.length} ads. Sorting...`)

        if (rows.length > 0) {
            // Sort in-memory by spend desc
            rows.sort((a: any, b: any) => b.stats.spend - a.stats.spend)

            const ad = rows[0]
            console.log(`[Snap] Top Ad ID: ${ad.id} ($${(ad.stats.spend / 1000000).toFixed(2)})`)

            // Fetch ad name from Snapchat API
            let adName = `Ad ${ad.id.substring(0, 8)}...`
            try {
                // Fetch Snapchat access token from creds table
                const supabaseUrl = Deno.env.get('SUPABASE_URL')!
                const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
                const supabase = createClient(supabaseUrl, supabaseKey)

                const { data: credData } = await supabase
                    .from('creds')
                    .select('cred')
                    .eq('cred_name', 'snap_at')
                    .single()

                if (credData?.cred) {
                    const adRes = await fetch(`https://adsapi.snapchat.com/v1/ads/${ad.id}`, {
                        headers: {
                            'Authorization': `Bearer ${credData.cred}`,
                            'Content-Type': 'application/json'
                        }
                    })
                    if (adRes.ok) {
                        const adData = await adRes.json()
                        adName = adData?.ads?.[0]?.ad?.name || adName
                        console.log(`[Snap] Resolved Ad Name: ${adName}`)
                    }
                }
            } catch (nameErr) {
                console.error('[Snap] Failed to fetch ad name:', nameErr)
            }

            return {
                name: adName,
                spend: ad.stats.spend,
                revenue: ad.stats.conversion_purchases_value
            }
        }
        return null
    } catch (e) {
        console.error('[Snap] Error:', e)
        return null
    }
}

// --- Helpers ---

function blendMetrics(client: any, snap: any, tiktok: any, fb: any, topAdTikTok: any, topAdFb: any, topAdSnapchat: any) {
    const totalSpend = (snap?.spend || 0) + (tiktok?.spend || 0) + (fb?.spend || 0)
    const totalRevenue = (snap?.revenue || 0) + (tiktok?.revenue || 0) + (fb?.revenue || 0)
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0

    // Determine Platforms
    const activePlatforms = []
    const platformRoas = []

    // Normalize Micros to Standard Units (Divide by 1,000,000)
    const normalize = (val: number) => (val || 0) / 1000000

    if (snap) {
        activePlatforms.push('snapchat')
        platformRoas.push({ name: 'Snapchat', roas: calcRoas(snap.revenue, snap.spend), spend: normalize(snap.spend) })
    }
    if (tiktok) {
        activePlatforms.push('tiktok')
        platformRoas.push({ name: 'TikTok', roas: calcRoas(tiktok.revenue, tiktok.spend), spend: normalize(tiktok.spend) })
    }
    if (fb) {
        activePlatforms.push('facebook')
        platformRoas.push({ name: 'Facebook', roas: calcRoas(fb.revenue, fb.spend), spend: normalize(fb.spend) })
    }

    // Best Platform Logic
    // Must have at least 15% of total spend to be considered "Best" to avoid low-volume skewed stats
    const SIGNIFICANT_SPEND_THRESHOLD = 0.15
    const totalSpendNormalized = normalize(totalSpend)

    // Sort by ROAS desc
    const sortedByRoas = platformRoas.sort((a, b) => b.roas - a.roas)

    // Find first one that meets threshold
    let bestPlatform = sortedByRoas.find(p => p.spend > (totalSpendNormalized * SIGNIFICANT_SPEND_THRESHOLD)) || null

    // Fallback: If no one meets threshold (e.g. split heavily or very low spend), just take the absolute winner
    if (!bestPlatform && sortedByRoas.length > 0) {
        bestPlatform = sortedByRoas[0]
    }

    // Process Top Ads (Normalize)
    const topAds = {
        tiktok: topAdTikTok ? {
            name: topAdTikTok.name,
            spend: normalize(topAdTikTok.spend),
            roas: topAdTikTok.roas // Use the robust ROAS from the fetcher
        } : null,
        facebook: topAdFb ? {
            name: topAdFb.name,
            spend: normalize(topAdFb.spend),
            roas: calcRoas(topAdFb.revenue, topAdFb.spend)
        } : null,
        snapchat: topAdSnapchat ? {
            name: topAdSnapchat.name,
            spend: normalize(topAdSnapchat.spend),
            roas: calcRoas(topAdSnapchat.revenue, topAdSnapchat.spend)
        } : null
    }

    return {
        id: client.id,
        name: client.name,
        spend: normalize(totalSpend),
        revenue: normalize(totalRevenue),
        roas,
        activePlatforms,
        bestPlatform,
        topAds,
        breakdown: { snap, tiktok, fb }
    }
}

function calcRoas(rev: number, spend: number) {
    return spend > 0 ? rev / spend : 0
}

function calculateQuickStats(clients: any[]) {
    const totalSpend = clients.reduce((sum, c) => sum + c.spend, 0)
    const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0)
    return {
        totalClients: clients.length,
        totalCampaigns: clients.reduce((sum, c) => {
            const snap = c.breakdown.snap?.campaigns?.length || 0
            const tiktok = c.breakdown.tiktok?.campaigns?.length || 0
            const fb = c.breakdown.fb?.campaigns?.length || 0
            return sum + snap + tiktok + fb
        }, 0),
        totalSpend,
        totalRevenue,
        averageRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0
    }
}

function generateInsights(clients: any[]) {
    const whatsWorking: any[] = []
    const whatsNotWorking: any[] = []

    clients.forEach(client => {
        // Helper to check channel performance
        const checkChannel = (name: string, data: any) => {
            if (!data) return

            const spend = (data.spend || 0) / 1000000 // Normalize micro to standard
            const revenue = (data.revenue || 0) / 1000000 // Normalize micro to standard (if needed, or assume data.revenue is micro)
            // Wait, previous code used `client.spend` which was already normalized in `blendMetrics`.
            // But `client.breakdown` (snap, tiktok, fb) has raw values or what?
            // Let's verify `blendMetrics` structure.
            // `blendMetrics` consumes the raw fetch results. `fetchSnapchat` et al return sum of micro amounts?
            // `fetchSnapchat`: `spend += parseFloat(c.lifetime_spend || 0)`. Usually micros? Yes.
            // So `data` here (from client.breakdown) is in micros.

            const normSpend = spend // actually spend variable above is already normalized? No, (spend/1000000)
            const roas = calcRoas(data.revenue, data.spend)

            // Needs Attention: ROAS < 1.5 & Spend > $500
            if (roas < 1.5 && normSpend > 500) {
                whatsNotWorking.push({
                    type: 'underperformer',
                    client: client.name,
                    campaign: name,
                    metric: 'ROAS',
                    value: roas,
                    message: `${client.name} (${name}): Low ROAS (${roas.toFixed(2)}) with significant spend.`
                })
            }

            // High Performer: ROAS > 2.0 & Spend > $500
            if (roas > 2.0 && normSpend > 500) {
                whatsWorking.push({
                    type: 'high_performer',
                    client: client.name,
                    campaign: name,
                    metric: 'ROAS',
                    value: roas,
                    message: `${client.name} (${name}): Strong performance with ${roas.toFixed(2)} ROAS.`
                })
            }
        }

        checkChannel('Snapchat', client.breakdown.snap)
        checkChannel('TikTok', client.breakdown.tiktok)
        checkChannel('Facebook', client.breakdown.fb)
    })

    return { whatsWorking, whatsNotWorking }
}

function emptyResponse() {
    return new Response(JSON.stringify({ quickStats: {}, clients: [], insights: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
}
