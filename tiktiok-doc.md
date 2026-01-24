3.2 TikTok Discovery (Finding Clients)

Endpoint: https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/

    Header: Access-Token: {{AGENCY_TOKEN}}

    Logic: Returns a list of advertiser_ids the user manages. Iterate through this list to sync each client.   

3.3 TikTok Data Retrieval

Base URL: https://business-api.tiktok.com/open_api/v1.3/

A. Campaigns

    GET /campaign/get/

    Params: advertiser_id, page_size=1000, fields=["campaign_id", "campaign_name", "objective_type", "budget", "operation_status"].

B. Ad Groups

    GET /adgroup/get/

    Params: advertiser_id, fields=["adgroup_id", "adgroup_name", "campaign_id", "external_action", "operation_status"].

C. Ads

    GET /ad/get/

    Params: advertiser_id, fields=["ad_id", "ad_name", "adgroup_id", "creatives", "status"].

3.4 TikTok Asset Extraction (The Video)

TikTok video URLs are ephemeral (signed). You must download them immediately.

    Standard Ads: Parse creatives.video_url from the /ad/get/ response. Download and upload to your SaaS storage (S3/GCS).   

Spark Ads: If the ad uses an organic post, the video_url might be missing or expire quickly.

    Extract tiktok_item_id from the creative.

    Call https://open.tiktokapis.com/v2/video/query/ with the item ID to get a fresh video_url.   

        Action: Download the binary content and cache it.

3.5 TikTok Reporting

Endpoint: /report/integrated/get/

    Dimensions: ["ad_id", "stat_time_day"]

    Metrics: ["spend", "impressions", "clicks", "conversion", "cost_per_conversion", "video_play_actions", "video_watched_6s"]