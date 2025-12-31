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
        // Initialize Supabase client with service role
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Verify user authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'No authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if force refresh is requested from body
        const requestBody = await req.json().catch(() => ({}))
        const forceRefresh = requestBody.refresh === true

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const { data: cached, error: cacheError } = await supabase
                .from('dashboard_cache')
                .select('data, updated_at')
                .eq('user_id', user.id)
                .single()

            if (!cacheError && cached) {
                const cacheAge = Date.now() - new Date(cached.updated_at).getTime()
                const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

                if (cacheAge < CACHE_DURATION) {
                    console.log('Returning cached dashboard data')
                    return new Response(
                        JSON.stringify(cached.data),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }
            }
        }

        console.log('Fetching fresh dashboard data')

        // Fetch all active clients
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*')

        if (clientsError) {
            throw new Error(`Failed to fetch clients: ${clientsError.message}`)
        }

        if (!clients || clients.length === 0) {
            const emptyData = {
                quickStats: {
                    totalClients: 0,
                    totalCampaigns: 0,
                    totalSpend: 0,
                    totalRevenue: 0,
                    averageRoas: 0
                },
                clients: [],
                insights: {
                    whatsWorking: [],
                    whatsNotWorking: []
                }
            }

            return new Response(
                JSON.stringify(emptyData),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch campaign data for each client from your backend
        const backendUrl = Deno.env.get('BACKEND_WEBHOOK_URL')
        if (!backendUrl) {
            throw new Error('BACKEND_WEBHOOK_URL not configured')
        }

        const clientsWithMetrics = await Promise.all(
            clients.map(async (client) => {
                const clientName = client.name || `Client-${client.id}` // Fallback if name is null

                try {
                    // Pre-check: Don't fetch if there is no ad account ID
                    if (!client.snapchat_ad_account_id) {
                        console.log(`Skipping ${clientName}: No snapchat_ad_account_id found.`)
                        return getEmptyClientMetrics(client)
                    }

                    const response = await fetch(`${backendUrl}/fetch-snap-campaigns`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ad_account_id: client.snapchat_ad_account_id
                        })
                    })

                    if (!response.ok) {
                        console.error(`Failed to fetch campaigns for ${clientName}: ${response.status}`)
                        return getEmptyClientMetrics(client)
                    }

                    // --- FIX STARTS HERE ---
                    const rawText = await response.text()
                    let campaigns = []

                    // Only parse if we have content
                    if (rawText && rawText.trim().length > 0) {
                        try {
                            const parsedData = JSON.parse(rawText)
                            // Ensure the response is actually an array before looping
                            if (Array.isArray(parsedData)) {
                                campaigns = parsedData
                            } else {
                                console.warn(`Expected array for ${clientName}, but got:`, typeof parsedData)
                                // Optional: Handle if your API returns { data: [...] } structure
                                // campaigns = parsedData.data || [] 
                            }
                        } catch (parseError) {
                            console.error(`JSON Syntax Error for ${clientName}. Raw response:`, rawText)
                            // We caught the error, so we default to [] and don't crash the function
                        }
                    }
                    // --- FIX ENDS HERE ---

                    // Aggregate metrics
                    let totalSpend = 0
                    let totalRevenue = 0
                    let activeCampaigns = 0

                    campaigns.forEach((c: any) => {
                        totalSpend += parseFloat(c.lifetime_spend || 0)
                        totalRevenue += parseFloat(c.conversion_purchases_value || 0)
                        if (c.status === 'ACTIVE') {
                            activeCampaigns++
                        }
                    })

                    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0

                    // Find top performing campaign
                    const topCampaign = campaigns
                        .filter((c: any) => {
                            const cSpend = parseFloat(c.lifetime_spend || 0)
                            const cRevenue = parseFloat(c.conversion_purchases_value || 0)
                            return cSpend > 0 && cRevenue > 0
                        })
                        .sort((a: any, b: any) => {
                            const roasA = parseFloat(a.conversion_purchases_value) / parseFloat(a.lifetime_spend)
                            const roasB = parseFloat(b.conversion_purchases_value) / parseFloat(b.lifetime_spend)
                            return roasB - roasA
                        })[0]

                    return {
                        id: client.id,
                        name: clientName,
                        campaignCount: activeCampaigns,
                        spend: totalSpend,
                        revenue: totalRevenue,
                        roas: roas,
                        topCampaign: topCampaign ? {
                            id: topCampaign.id,
                            name: topCampaign.name,
                            roas: parseFloat(topCampaign.conversion_purchases_value) / parseFloat(topCampaign.lifetime_spend)
                        } : undefined
                    }
                } catch (error) {
                    console.error(`Error fetching data for client ${clientName}:`, error)
                    return getEmptyClientMetrics(client)
                }
            })
        )
        // Calculate overall quick stats
        const quickStats = {
            totalClients: clients.length,
            totalCampaigns: clientsWithMetrics.reduce((sum, c) => sum + c.campaignCount, 0),
            totalSpend: clientsWithMetrics.reduce((sum, c) => sum + c.spend, 0),
            totalRevenue: clientsWithMetrics.reduce((sum, c) => sum + c.revenue, 0),
            averageRoas: calculateWeightedAverageRoas(clientsWithMetrics)
        }

        // Generate insights
        const insights = generateInsights(clientsWithMetrics)

        const dashboardData = {
            quickStats,
            clients: clientsWithMetrics,
            insights
        }

        // Cache the result
        await supabase
            .from('dashboard_cache')
            .upsert({
                user_id: user.id,
                data: dashboardData
            })

        return new Response(
            JSON.stringify(dashboardData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Dashboard function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

function getEmptyClientMetrics(client: any) {
    return {
        id: client.id,
        name: client.name,
        campaignCount: 0,
        spend: 0,
        revenue: 0,
        roas: 0
    }
}

function calculateWeightedAverageRoas(clients: any[]) {
    const totalSpend = clients.reduce((sum, c) => sum + c.spend, 0)
    if (totalSpend === 0) return 0

    const weightedSum = clients.reduce((sum, c) => {
        return sum + (c.roas * c.spend)
    }, 0)

    return weightedSum / totalSpend
}

function generateInsights(clients: any[]) {
    const whatsWorking: any[] = []
    const whatsNotWorking: any[] = []

    clients.forEach(client => {
        // High performers
        if (client.roas >= 2.5 && client.spend > 0) {
            whatsWorking.push({
                type: 'high_performer',
                client: client.name,
                campaign: client.topCampaign?.name,
                metric: 'ROAS',
                value: client.roas,
                message: `${client.name} achieving strong ${client.roas.toFixed(1)} ROAS`
            })
        }

        // Underperformers
        if (client.roas < 1.5 && client.spend > 1000) {
            whatsNotWorking.push({
                type: 'underperformer',
                client: client.name,
                metric: 'ROAS',
                value: client.roas,
                message: `${client.name} below target with ${client.roas.toFixed(1)} ROAS`,
                recommendation: 'Review campaign settings and creative performance'
            })
        }

        // Scale opportunities
        if (client.roas > 2.0 && client.spend > 5000) {
            whatsWorking.push({
                type: 'scale_opportunity',
                client: client.name,
                metric: 'Spend Efficiency',
                value: client.spend,
                message: `${client.name} efficiently scaling with SAR ${client.spend.toLocaleString()} spend`
            })
        }
    })

    return { whatsWorking, whatsNotWorking }
}
