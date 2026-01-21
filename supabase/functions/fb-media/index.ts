import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0'

interface MediaParams {
    ad_id?: string           // Single ad ID (backward compatible)
    ad_ids?: string[]        // Multiple ad IDs for batch processing
    access_token: string
}

interface MediaResult {
    ad_id: string
    link: string | null
    thumbnail_url: string | null
    is_video: boolean
    debug?: Record<string, any>
}

// Process a single ad and return its media info
async function processAd(adId: string, accessToken: string, accountId?: string): Promise<MediaResult> {
    const debug: Record<string, any> = {}

    try {
        const adFields = [
            'id',
            'name',
            'account_id',
            'creative{id,name,thumbnail_url,image_url,video_id,object_story_id,object_story_spec,asset_feed_spec,effective_object_story_id}'
        ].join(',')

        const adUrl = `${FB_GRAPH_API}/${adId}?fields=${adFields}&access_token=${accessToken}`
        const adResponse = await fetch(adUrl)
        const adData = await adResponse.json()

        if (adData.error) {
            return { ad_id: adId, link: null, thumbnail_url: null, is_video: false, debug: { error: adData.error.message } }
        }

        const creative = adData.creative
        const adAccountId = adData.account_id || accountId

        if (!creative) {
            return { ad_id: adId, link: null, thumbnail_url: null, is_video: false }
        }

        let mediaUrl: string | null = null
        let thumbnailUrl: string | null = null
        let isVideo = false

        // Strategy 1: Direct image_url
        if (creative.image_url) {
            mediaUrl = creative.image_url
            debug.source = 'creative.image_url'
        }

        // Strategy 2: Video handling
        if (creative.video_id) {
            isVideo = true
            try {
                const videoFields = 'source,picture,thumbnails{uri,height,width}'
                const videoUrl = `${FB_GRAPH_API}/${creative.video_id}?fields=${videoFields}&access_token=${accessToken}`
                const videoResponse = await fetch(videoUrl)
                const videoData = await videoResponse.json()

                if (videoData.source) {
                    mediaUrl = videoData.source
                    debug.source = 'video.source'
                }
                if (videoData.picture) {
                    thumbnailUrl = videoData.picture
                }
                if (videoData.thumbnails?.data?.length) {
                    const sorted = videoData.thumbnails.data.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))
                    if (sorted[0]?.uri) {
                        thumbnailUrl = sorted[0].uri
                    }
                }
            } catch (e) {
                debug.videoError = String(e)
            }
        }

        // Strategy 3: Object Story Spec
        if (creative.object_story_spec) {
            const spec = creative.object_story_spec

            // Video data
            if (spec.video_data) {
                isVideo = true

                if (spec.video_data.video_id && !mediaUrl) {
                    try {
                        const videoFields = 'source,picture,thumbnails{uri,height,width}'
                        const videoUrl = `${FB_GRAPH_API}/${spec.video_data.video_id}?fields=${videoFields}&access_token=${accessToken}`
                        const videoResponse = await fetch(videoUrl)
                        const videoData = await videoResponse.json()

                        if (videoData.source) {
                            mediaUrl = videoData.source
                            debug.source = 'video_data.video_id->source'
                        }
                        if (videoData.picture) {
                            thumbnailUrl = videoData.picture
                        }
                        if (videoData.thumbnails?.data?.length) {
                            const sorted = videoData.thumbnails.data.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))
                            if (sorted[0]?.uri) {
                                thumbnailUrl = sorted[0].uri
                            }
                        }
                    } catch (e) {
                        debug.videoDataError = String(e)
                    }
                }

                if (spec.video_data.image_url && !thumbnailUrl) {
                    thumbnailUrl = spec.video_data.image_url
                }
            }

            // Link data
            if (spec.link_data) {
                if (spec.link_data.image_hash && adAccountId && !mediaUrl) {
                    try {
                        const hashUrl = `${FB_GRAPH_API}/act_${adAccountId}/adimages?hashes=['${spec.link_data.image_hash}']&fields=url&access_token=${accessToken}`
                        const hashRes = await fetch(hashUrl)
                        const hashData = await hashRes.json()

                        if (hashData.data && hashData.data.length > 0 && hashData.data[0].url) {
                            mediaUrl = hashData.data[0].url
                            debug.source = 'adimages.url'
                        }
                    } catch (e) {
                        debug.hashError = String(e)
                    }
                }

                if (spec.link_data.picture && !mediaUrl) {
                    mediaUrl = spec.link_data.picture
                    debug.source = 'link_data.picture'
                }
            }

            // Photo data
            if (spec.photo_data) {
                if (spec.photo_data.url && !mediaUrl) {
                    mediaUrl = spec.photo_data.url
                    debug.source = 'photo_data.url'
                }
            }
        }

        // Strategy 4: Effective Object Story ID
        if (creative.effective_object_story_id) {
            try {
                const storyFields = 'full_picture,picture,attachments{media,media_type,url}'
                const storyUrl = `${FB_GRAPH_API}/${creative.effective_object_story_id}?fields=${storyFields}&access_token=${accessToken}`
                const storyResponse = await fetch(storyUrl)
                const storyData = await storyResponse.json()

                if (storyData.full_picture) {
                    mediaUrl = storyData.full_picture
                    thumbnailUrl = storyData.full_picture
                    debug.source = 'story.full_picture'
                } else if (storyData.picture && !mediaUrl) {
                    mediaUrl = storyData.picture
                    if (!thumbnailUrl) thumbnailUrl = storyData.picture
                    debug.source = 'story.picture'
                }

                if (storyData.attachments?.data?.[0]?.media?.image?.src) {
                    const src = storyData.attachments.data[0].media.image.src
                    if (!src.includes('p64x64')) {
                        mediaUrl = src
                        thumbnailUrl = src
                        debug.source = 'attachment.media.image.src'
                    }
                }
            } catch (e) {
                debug.storyError = String(e)
            }
        }

        // Strategy 5: Asset Feed Spec
        if (creative.asset_feed_spec) {
            const spec = creative.asset_feed_spec

            if (spec.images && spec.images.length > 0) {
                const img = spec.images[0]
                if (img.url && !mediaUrl) {
                    mediaUrl = img.url
                    debug.source = 'asset_feed_spec.images[0].url'
                } else if (img.hash && adAccountId && !mediaUrl) {
                    try {
                        const hashUrl = `${FB_GRAPH_API}/act_${adAccountId}/adimages?hashes=['${img.hash}']&fields=url&access_token=${accessToken}`
                        const hashRes = await fetch(hashUrl)
                        const hashData = await hashRes.json()
                        if (hashData.data?.[0]?.url) {
                            mediaUrl = hashData.data[0].url
                            debug.source = 'asset_feed_spec.images[0].hash->url'
                        }
                    } catch (e) {
                        debug.assetHashError = String(e)
                    }
                }
            }
        }

        // Fallback: Use thumbnail_url from creative
        if (!thumbnailUrl && creative.thumbnail_url) {
            thumbnailUrl = creative.thumbnail_url
            if (!debug.source) debug.source = 'creative.thumbnail_url (fallback)'
        }

        // If still no mediaUrl, use thumbnailUrl
        if (!mediaUrl && thumbnailUrl) {
            mediaUrl = thumbnailUrl
        }

        // URL pattern detection for videos (t15 namespace)
        const finalUrl = mediaUrl || thumbnailUrl
        if (finalUrl && finalUrl.includes('/t15.') && !isVideo) {
            isVideo = true
        }

        return {
            ad_id: adId,
            link: mediaUrl,
            thumbnail_url: thumbnailUrl || mediaUrl,
            is_video: isVideo,
        }
    } catch (e) {
        return { ad_id: adId, link: null, thumbnail_url: null, is_video: false, debug: { error: String(e) } }
    }
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const params: MediaParams = await req.json()
        const { ad_id, ad_ids, access_token } = params

        if (!access_token) {
            return new Response(
                JSON.stringify({ error: 'Missing access_token' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Determine which ad IDs to process
        let idsToProcess: string[] = []
        if (ad_ids && Array.isArray(ad_ids) && ad_ids.length > 0) {
            idsToProcess = ad_ids
        } else if (ad_id) {
            idsToProcess = [ad_id]
        } else {
            return new Response(
                JSON.stringify({ error: 'Missing ad_id or ad_ids' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Process all ads in parallel (limit to 10 concurrent for safety)
        const batchSize = 10
        const results: MediaResult[] = []

        for (let i = 0; i < idsToProcess.length; i += batchSize) {
            const batch = idsToProcess.slice(i, i + batchSize)
            const batchResults = await Promise.all(
                batch.map(id => processAd(id, access_token))
            )
            results.push(...batchResults)
        }

        return new Response(
            JSON.stringify(results),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
