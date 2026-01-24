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
                fetchFacebook(client, functionUrl, serviceKey)
            ])

            const snap = results[0].status === 'fulfilled' ? results[0].value : null
            const tiktok = results[1].status === 'fulfilled' ? results[1].value : null
            const fb = results[2].status === 'fulfilled' ? results[2].value : null

            return blendMetrics(client, snap, tiktok, fb)
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

function getLifetimeRange() {
    return {
        start_date: '2020-01-01',
        end_date: new Date().toISOString().split('T')[0]
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
        const res = await fetch(`${baseUrl}/tt-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                advertiser_id: client.tiktok_advertiser_id,
                level: 'campaign',
                granularity: 'TOTAL'
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

async function fetchFacebook(client: any, baseUrl: string, key: string) {
    if (!client.facebook_ad_account_id || !client.facebook_access_token) return null
    try {
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
                granularity: 'TOTAL'
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

// --- Helpers ---

function blendMetrics(client: any, snap: any, tiktok: any, fb: any) {
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

    // Best Platform
    const bestPlatform = platformRoas.sort((a, b) => b.roas - a.roas)[0] || null

    return {
        id: client.id,
        name: client.name,
        spend: normalize(totalSpend),
        revenue: normalize(totalRevenue),
        roas,
        activePlatforms,
        bestPlatform,
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
        totalCampaigns: 0, // Simplified for now
        totalSpend,
        totalRevenue,
        averageRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0
    }
}

function generateInsights(clients: any[]) {
    const whatsWorking: any[] = []
    const whatsNotWorking: any[] = []

    clients.forEach(client => {
        // Needs Attention
        if (client.roas < 1.0 && client.spend > 500) { // < 1 ROAS & > 500 USD spend
            whatsNotWorking.push({
                type: 'underperformer',
                client: client.name,
                metric: 'ROAS',
                value: client.roas,
                message: `${client.name} has critical ROAS (${client.roas.toFixed(2)}) with significant spend.`
            })
        }

        // Top Performer
        if (client.roas > 2.0 && client.spend > 500) {
            whatsWorking.push({
                type: 'high_performer',
                client: client.name,
                metric: 'ROAS',
                value: client.roas,
                message: `${client.name} is crushing it with ${client.roas.toFixed(2)} ROAS across all platforms.`
            })
        }
    })

    return { whatsWorking, whatsNotWorking }
}

function emptyResponse() {
    return new Response(JSON.stringify({ quickStats: {}, clients: [], insights: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
}
