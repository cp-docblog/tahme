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
        const { advertiser_id, ad_ids, tiktok_item_id } = await req.json()

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

        // If we have a tiktok_item_id (Spark Ad), fetch video from TikTok content API
        if (tiktok_item_id) {
            // For Spark Ads, need to query the video endpoint
            // Note: This requires different API access
            return new Response(
                JSON.stringify({
                    link: null,
                    thumbnail_url: null,
                    is_video: true,
                    is_spark_ad: true,
                    tiktok_item_id: tiktok_item_id,
                    message: 'Spark Ad - video URL requires TikTok Content API'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // For regular ads, fetch the ad details to get media IDs
        if (!advertiser_id || !ad_ids || !Array.isArray(ad_ids) || ad_ids.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Missing advertiser_id or ad_ids array' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Use valid fields to get media IDs
        const fields = JSON.stringify([
            'ad_id', 'image_mode', 'video_id', 'image_ids'
        ])

        // Chunking if necessary (TikTok might have limits, but let's try with all first)
        // Max page size is 1000, filtering handles arrays
        const filtering = JSON.stringify({ ad_ids: ad_ids })
        const url = `${TT_API_BASE}/ad/get/?advertiser_id=${advertiser_id}&fields=${encodeURIComponent(fields)}&filtering=${encodeURIComponent(filtering)}&page_size=1000`

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

        const adsList = data.data?.list || []

        // Collect IDs to fetch
        const videoIds = new Set<string>()
        const imageIds = new Set<string>()

        adsList.forEach((ad: any) => {
            if (ad.video_id) videoIds.add(ad.video_id)
            if (ad.image_ids && Array.isArray(ad.image_ids)) {
                ad.image_ids.forEach((id: string) => imageIds.add(id))
            }
        })

        // Fetch media details
        const mediaMap = new Map<string, any>() // id -> { url, cover }

        // Fetch Videos
        if (videoIds.size > 0) {
            const videoIdsList = Array.from(videoIds)
            const videoUrl = `${TT_API_BASE}/file/video/ad/info/?advertiser_id=${advertiser_id}&video_ids=${JSON.stringify(videoIdsList)}`

            try {
                const vidRes = await fetch(videoUrl, {
                    method: 'GET',
                    headers: { 'Access-Token': access_token, 'Content-Type': 'application/json' }
                })
                const vidData = await vidRes.json()
                if (vidData.code === 0 && vidData.data?.list) {
                    vidData.data.list.forEach((v: any) => {
                        mediaMap.set(v.video_id, {
                            url: v.video_play_url || v.preview_url,
                            cover: v.video_cover_url
                        })
                    })
                }
            } catch (e) {
                console.error('Error fetching videos:', e)
            }
        }

        // Fetch Images
        if (imageIds.size > 0) {
            const imageIdsList = Array.from(imageIds)
            const imageUrl = `${TT_API_BASE}/file/image/ad/info/?advertiser_id=${advertiser_id}&image_ids=${JSON.stringify(imageIdsList)}`

            try {
                const imgRes = await fetch(imageUrl, {
                    method: 'GET',
                    headers: { 'Access-Token': access_token, 'Content-Type': 'application/json' }
                })
                const imgData = await imgRes.json()
                if (imgData.code === 0 && imgData.data?.list) {
                    imgData.data.list.forEach((img: any) => {
                        mediaMap.set(img.image_id, {
                            url: img.preview_url || img.image_url,
                            cover: null
                        })
                    })
                }
            } catch (e) {
                console.error('Error fetching images:', e)
            }
        }

        const results = adsList.map((adData: any) => {
            let link = null
            let thumbnail_url = null
            const is_video = !!adData.video_id || adData.image_mode === 'VIDEO'

            if (adData.video_id) {
                const vid = mediaMap.get(adData.video_id)
                if (vid) {
                    link = vid.url
                    thumbnail_url = vid.cover
                }
            } else if (adData.image_ids && adData.image_ids.length > 0) {
                const imgId = adData.image_ids[0]
                const img = mediaMap.get(imgId)
                if (img) {
                    link = img.url
                    thumbnail_url = img.url
                }
            }

            return {
                ad_id: adData.ad_id,
                link,
                thumbnail_url,
                is_video,
                image_ids: adData.image_ids || [],
            }
        })

        return new Response(
            JSON.stringify(results),
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
