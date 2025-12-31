# Out-of-Scope Enhancements for Snapchat Measurements

## Overview
This document outlines advanced features and metrics that extend beyond our current conversion funnel focus. These enhancements represent additional value-added features that can be offered to clients as premium upgrades or future iterations of the platform.

---

## Current Scope Limitations
Our platform currently focuses on:
- Basic conversion funnel metrics (impressions → checkout → billing → purchase)
- Performance metrics (ROAS, CPP, CPM, CTR)
- Single ad-level reporting

**This document covers everything beyond this scope.**

---

## Category 1: Advanced Conversion Tracking

### 1.1 Extended Conversion Events
**Metrics:** 40+ additional conversion events available from Snapchat

#### E-Commerce Conversions
```
conversion_add_cart              // Add to Cart events
conversion_add_cart_value        // Value of items added to cart
conversion_view_content          // Product page views
conversion_view_content_value    // Value of viewed content
conversion_save                  // Saved items/wishlists
conversion_save_value            // Value of saved items
conversion_add_to_wishlist       // Wishlist additions
conversion_add_to_wishlist_value // Wishlist value
```

#### User Engagement Conversions
```
conversion_sign_ups              // New user registrations
conversion_sign_ups_value        // Value per sign-up
conversion_searches              // Search queries performed
conversion_searches_value        // Search value
conversion_app_opens             // App launch events
conversion_app_opens_value       // App open value
conversion_page_views            // Web page views
conversion_page_views_value      // Page view value
```

#### Content & Social Conversions
```
conversion_subscribe             // Newsletter/subscription sign-ups
conversion_complete_tutorial     // Tutorial completions
conversion_share                 // Social shares
conversion_invite                // User invitations sent
conversion_login                 // User logins
conversion_rate                  // Ratings/reviews submitted
```

#### Gaming Conversions
```
conversion_level_completes       // Game level completions
conversion_achievement_unlocked  // Achievement unlocks
conversion_spend_credits         // In-game currency spent
custom_event_1 through 5         // Custom game events
```

#### Service Industry Conversions
```
conversion_reserve               // Reservations/bookings
conversion_visit                 // Store/location visits
conversion_start_trial           // Trial starts
conversion_list_view             // List/catalog views
```

**Use Cases:**
- **E-commerce:** Full customer journey tracking
- **SaaS:** Sign-up funnel optimization
- **Gaming:** Player progression tracking
- **Services:** Booking and reservation tracking

---

## Category 2: App Install Tracking

### 2.1 App Installation Metrics
**Available for APP_INSTALL ad types**

```
total_installs                   // Total app installations
android_installs                 // Android-specific installs
ios_installs                     // iOS-specific installs
```

### 2.2 SKAdNetwork Metrics (iOS 14+)
**Comprehensive iOS attribution tracking**

#### Swipe-Based SKAdNetwork Conversions
```
conversion_total_installs_sk_ad_network
conversion_purchases_sk_ad_network
conversion_save_sk_ad_network
conversion_start_checkout_sk_ad_network
// ... 30+ SKAd metrics for swipe attribution
```

#### View-Based SKAdNetwork Conversions
```
conversion_total_installs_sk_ad_network_view
conversion_purchases_sk_ad_network_view
// ... 30+ SKAd metrics for view attribution
```

#### SKAdNetwork Totals
```
conversion_total_installs_sk_ad_network_total
conversion_purchases_sk_ad_network_total
// ... Combined swipe + view metrics
```

**Special Metrics:**
```
conversion_null_sk_ad_network         // Below privacy threshold
unknown_sk_ad_network                 // Unknown conversion values
conversion_assist_install_sk_ad_network // Assisted installs (not last touch)
```

**Use Cases:**
- Mobile app advertisers tracking iOS conversions
- Understanding SKAdNetwork attribution
- Privacy-compliant iOS tracking

---

## Category 3: Video & Engagement Metrics

### 3.1 Video Performance Metrics
```
quartile_1                       // 25% video completion
quartile_2                       // 50% video completion
quartile_3                       // 75% video completion
view_completion                  // 100% video completion
screen_time_millis               // Total view time (milliseconds)
avg_screen_time_millis           // Average view time per impression
video_views                      // 2+ second views or swipe-ups
video_views_time_based           // 2+ second views (no swipe-ups)
video_views_15s                  // 15+ second views or 97% completion
video_views_5s                   // 5+ second views (NEW: available Feb 2025)
engaged_views                    // 5+ second views (NEW: available Feb 2025)
```

### 3.2 Attachment Metrics
**For ads with long-form video or other attachments**

```
attachment_quartile_1            // Attachment 25% completion
attachment_quartile_2            // Attachment 50% completion
attachment_quartile_3            // Attachment 75% completion
attachment_view_completion       // Attachment 100% completion
attachment_video_views           // 10+ second attachment views
attachment_total_view_time_millis // Total attachment time
attachment_avg_view_time_millis  // Average attachment view time
attachment_frequency             // Avg attachment views per user
attachment_uniques               // Unique attachment viewers
```

### 3.3 Story Ad Metrics
```
story_opens                      // Times users opened the story
story_completes                  // Times users viewed full story
position_impressions             // Impressions at specific position
position_screen_time_millis      // View time at position
position_swipe_up_percent        // Swipe rate at position
avg_position_screen_time_millis  // Average position view time
```

**Use Cases:**
- Video ad optimization
- Content engagement analysis
- Story ad performance tracking

---

## Category 4: Unique Reach & Frequency

### 4.1 Reach Metrics
```
uniques                          // Unique users reached
attachment_uniques               // Unique attachment viewers
frequency                        // Average impressions per user
attachment_frequency             // Average attachment views per user
total_reach                      // Estimated total unique reach (Lens ads)
earned_reach                     // Unique users from earned impressions
```

### 4.2 Reach Overlap Reporting
**Analyze audience overlap between campaigns/ad sets/ads**

**Features:**
- Calculate reach overlap between multiple entities
- Venn diagram visualizations
- Unique reach vs overlapping reach
- Optimize audience targeting to reduce overlap

**Available for:**
- Campaigns
- Ad Squads
- Ads

**Report Format:**
- Async reporting (Excel/CSV)
- Shows "Reached by all" metrics
- Individual entity reach
- Overlap calculations

**Use Cases:**
- Frequency cap optimization
- Audience overlap analysis
- Campaign coordination

---

## Category 5: Demographic & Geographic Insights

### 5.1 Demographic Breakdown (DEMO)
**Dimensions:** `report_dimension=age`, `report_dimension=gender`, `report_dimension=age,gender`

**Age Buckets (Post Feb 2025):**
- 13-17
- 18-20
- 21-24
- 25-34
- 35-44 (NEW)
- 45-54 (NEW)
- 55+ (NEW)

**Genders:**
- Male
- Female

**Metrics Available:**
- All delivery metrics (impressions, spend, swipes, etc.)
- All conversion metrics

**Use Cases:**
- Target specific age groups
- Gender-based ad optimization
- Demographic performance analysis

### 5.2 Geographic Breakdown (GEO)
**Dimensions:**
- `report_dimension=country` - ISO country codes
- `report_dimension=region` - US states/provinces
- `report_dimension=dma` - Designated Market Areas (US only)
- `report_dimension=country,os` - Country + Operating System (NEW: Oct 2022)

**Metrics Available:**
- All delivery metrics
- All conversion metrics (except DMA, region, and some country filters)

**Use Cases:**
- Geographic targeting optimization
- Regional performance comparison
- International campaign analysis

### 5.3 Device Insights
**Dimensions:**
- `report_dimension=os` - Operating System (iOS, Android)
- `report_dimension=make` - Device manufacturer (Apple, Samsung, etc.)
- `report_dimension=model` - Specific device model
- `report_dimension=os,country` - OS + Country combination

**Available Insights:**
- Device-specific performance
- OS targeting optimization
- Hardware capability targeting

**Limitations:**
- Make/Model: Delivery metrics only (no conversions)

### 5.4 Interest-Based Insights
**Dimensions:** `report_dimension=lifestyle_category`

**Snapchat Lifestyle Categories (SLC):**
- Interest category IDs
- Interest category names
- User interest segments

**Metrics Available:**
- Delivery metrics only (no conversions)

**Use Cases:**
- Interest-based audience analysis
- Content preference insights
- Lifestyle targeting optimization

---

## Category 6: Advanced Reporting Features

### 6.1 Asynchronous Reporting
**For large-scale data exports**

**Features:**
- Generate reports asynchronously
- CSV or Excel format
- Handle large datasets without timeout
- 24-hour download URL validity

**Use Cases:**
- Bulk campaign reporting
- Historical data analysis
- Large-scale multi-account reports

**Granularity:**
- TOTAL
- DAY
- LIFETIME

### 6.2 Breakdown Reporting
**Multi-entity reporting in single request**

**Breakdown Types:**
```
breakdown=ad                     // All ads
breakdown=adsquad               // All ad squads
breakdown=campaign              // All campaigns (from account level)
```

**Features:**
- Single API call for multiple entities
- Paginated results (up to 200 entities per page)
- Efficient bulk reporting

### 6.3 Position Stats (Story Ads)
**Parameter:** `position_stats=true`

**Track performance by position in story:**
- Impression count per position
- View time per position
- Swipe-up rate per position
- Engagement by position

**Use Cases:**
- Optimize story ad ordering
- Identify best-performing positions
- Story length optimization

---

## Category 7: Custom Conversions

### 7.1 Custom Conversion Tracking
**Create custom conversion events with rules**

**Features:**
- Define custom rules based on event parameters
- Filter by BRAND, EVENT_TAG, or other attributes
- Track specific product categories
- Geographic-specific conversions

**Example Custom Conversions:**
```json
{
  "name": "premium_product_sales",
  "event_type": "PURCHASE",
  "rules": [
    {
      "key": "BRAND",
      "values": ["premium", "luxury"],
      "operator": "CONTAINS"
    }
  ]
}
```

**Reporting:**
```
conversion_[custom_id]           // Custom conversion count
conversion_[custom_id]_value     // Custom conversion value
conversion_[custom_id]_swipe     // Swipe-attributed custom conversions
conversion_[custom_id]_view      // View-attributed custom conversions
```

**Use Cases:**
- Product category performance
- Region-specific conversions
- Premium vs budget product tracking
- Campaign-specific event tracking

---

## Category 8: Multi-Entity & Campaign-Level Reporting

### 8.1 Campaign Stats
**Report aggregated metrics across all ads in a campaign**

**Available:**
- All core metrics
- All conversion metrics
- All video metrics
- Breakdown by Ad Squad or Ad

### 8.2 Ad Squad Stats
**Report aggregated metrics for ad squad**

**Available:**
- All metrics available for campaigns
- Breakdown by Ad

### 8.3 Ad Account Stats
**Account-level overview**

**Available Metric:**
- Spend only (account-level spend tracking)

**Use Cases:**
- Budget monitoring
- Multi-campaign oversight
- Account health dashboard

---

## Category 9: Lead Generation

### 9.1 Lead Gen Metrics
```
native_leads                     // Lead form submissions
```

### 9.2 Lead Gen Reporting
**Async report for lead data extraction**

**Features:**
- Download lead information (names, emails, phones, etc.)
- Custom field data (up to 8 custom questions)
- Consent tracking (up to 2 consent checkboxes)
- Preferred vs non-preferred lead status
- 30-day data retention

**Lead Data Fields:**
- First Name, Last Name
- Phone Number, Email Address
- Address (Line 1, Line 2, City, State, Postal Code)
- Birthday, Job Title, Company Name
- Custom Fields (1-8)
- Consent responses (1-2)

**Use Cases:**
- CRM integration
- Lead nurturing
- Sales pipeline tracking
- Customer acquisition

---

## Category 10: Lenses, Filters & AR

### 10.1 Lens Metrics
```
paid_impressions                 // Paid lens impressions
earned_impressions               // Shared lens impressions
total_impressions                // Paid + earned
play_time_millis                 // Total lens interaction time
shares                           // Times lens shared
saves                            // Times lens saved to Memories
total_reach                      // Unique users reached
earned_reach                     // Unique users from earned impressions
```

### 10.2 Filter Metrics
```
paid_impressions
earned_impressions
shares
saves
earned_reach
```

### 10.3 AD_TO_LENS Metrics
**Special ad type that promotes lenses**

```
paid_impressions
earned_impressions
shares
saves
earned_reach
```

**Use Cases:**
- AR experience tracking
- Viral lens campaigns
- Brand engagement campaigns
- User-generated content tracking

---

## Category 11: Viewability & Brand Safety

### 11.1 Viewability Metrics (MRC Compliant)
**Available from April 1, 2021 onwards**

```
viewable_impressions             // 100% viewable for 1s (display) or 2s (video)
non_viewable_impressions         // Did not meet viewability criteria
viewable_rate                    // Percentage of viewable impressions
measured_impressions             // Total measured for viewability
gross_impressions                // Total delivered (including invalid traffic)
paid_impressions                 // Net of invalid traffic
```

**Granularity:**
- HOUR, DAY, TOTAL, LIFETIME

**Limitations:**
- Not available for Story Ads
- Cannot be broken down by Insights (demographics, geo, etc.)

**Use Cases:**
- Ad quality verification
- Brand safety compliance
- Media quality reporting
- Advertiser transparency

---

## Category 12: Dynamic Product Ads (DPA)

### 12.1 Product-Level Reporting
**Track performance by individual product SKU**

**Features:**
- Product impression tracking
- Product-specific swipes
- Product spend allocation
- Top-K reporting (top 50 products by impressions)
- Full product catalog reports (async)

**Metrics:**
```
product_impressions              // Impressions per product ID
swipes                           // Swipes per product
spend                            // Spend per product
```

**Reporting Types:**

#### Top-K Report (Sync)
- Top 50 products per entity (campaign/ad set/ad)
- Ranked by impression volume
- Regular API response

#### Full Report (Async)
- All products in catalog
- CSV export
- Async processing

**Requirements:**
- Must use 1-day date range
- TOTAL or DAY granularity only
- Start and end time must be specified

**Use Cases:**
- E-commerce product catalog optimization
- Best-selling product identification
- Product performance analysis
- Inventory optimization

---

## Category 13: Advanced Attribution & Conversion Sources

### 13.1 Conversion Source Breakdown
**Parameter:** `conversion_source_types=web,app,offline,total`

**Source Types:**
```
total                            // All conversions
web                              // Snap Pixel (web) conversions
app                              // In-app conversions
offline                          // Offline/in-store conversions
total_off_platform               // Web + app + offline
total_on_platform                // Stores and Profiles (Snapchat-native)
```

**Metrics Available:**
All conversion metrics can be broken down by source:
```
conversion_purchases_web
conversion_purchases_app
conversion_purchases_offline
conversion_purchases_total_on_platform
```

**Use Cases:**
- Omnichannel attribution
- Web vs app performance
- Offline conversion tracking
- Cross-platform optimization

### 13.2 Conversion Timing
**Parameter:** `action_report_time=conversion` or `action_report_time=impression`

**Options:**
- **conversion** (default): Report when user triggered the conversion
- **impression**: Report when ad impression occurred

**Available from:**
- Conversion time: Always available
- Impression time: Available from May 1, 2020

**Use Cases:**
- Time-to-conversion analysis
- Attribution window optimization
- Campaign timing optimization

---

## Category 14: Creative & Media Reporting

### 14.1 Creative-Level Stats
**Report performance by individual creative**

**Available Granularities:**
- DAY
- LIFETIME
- TOTAL (not available)

**Creative Types Supported:**
- SNAP_AD
- APP_INSTALL, WEB_VIEW, DEEP_LINK (snap ads with attachments)
- COLLECTION
- COMPOSITE (story ads)

**Not Supported:**
- PREVIEW creatives
- DPA creatives

**Metrics:**
- All standard delivery metrics
- All conversion metrics
- Video metrics

**Excluded Metrics:**
- Reach/frequency metrics (uniques, frequency, attachment_frequency, etc.)

**Use Cases:**
- Creative performance testing
- A/B creative testing
- Creative fatigue analysis
- Design optimization

### 14.2 Media-Level Stats
**Report performance by media asset (video/image)**

**Available Granularities:**
- DAY
- LIFETIME

**Media Types Supported:**
- IMAGE (top snap)
- VIDEO (top snap)
- LENS_PACKAGE (lens ads)

**Not Supported:**
- Story tile images
- Creative element images

**Metrics:**
- All delivery metrics
- Video metrics
- Spend

**Excluded Metrics:**
- Reach/frequency metrics

**Use Cases:**
- Asset reusability analysis
- Media performance tracking
- Creative library optimization

---

## Category 15: Spend & Budget Tracking

### 15.1 Advanced Spend Metrics
```
spend                            // Total spend (microcurrency)
coupon_used_local                // Coupon spend (account currency)
coupon_used_usd                  // Coupon spend (USD)
```

**Micro-currency Conversion:**
- 1.00 currency unit = 1,000,000 micro-currency

### 15.2 Landing Page Tracking
```
landing_page_views               // Landing page loads after click
```
**Available from:** December 10, 2024

**Use Cases:**
- Conversion funnel extension
- Landing page optimization
- Click-to-page tracking

---

## Category 16: Profile & Social Interactions

### 16.1 Profile Engagement
```
profile_clicks                   // Logo clicks to profile page
```

**Use Cases:**
- Brand awareness campaigns
- Profile traffic generation
- Social engagement tracking

### 16.2 Reminder Ads
```
reminders_set                    // CTA clicks on reminder attachments
```

**Use Cases:**
- Event promotion
- Launch campaigns
- Time-sensitive offers

---

## Category 17: Multi-Campaign Analysis

### 17.1 Cross-Campaign Reporting
**Features:**
- Compare multiple campaigns side-by-side
- Aggregate performance across campaigns
- Budget allocation optimization
- Portfolio-level analytics

### 17.2 Campaign Grouping & Tagging
**Concept:** Group campaigns by strategy/product/region
- Custom tagging system
- Group-level performance
- Hierarchical reporting

---

## Category 18: Predictive Analytics & AI

### 18.1 Performance Prediction
**Concept:** ML-based performance forecasting
- Predicted spend trajectory
- Estimated conversion volume
- ROAS predictions
- Budget recommendations

### 18.2 Anomaly Detection
**Features:**
- Automatic detection of unusual performance
- Spend spike alerts
- Conversion rate drops
- CTR anomalies

### 18.3 Optimization Recommendations
**AI-powered suggestions:**
- Best time to run ads
- Optimal budget allocation
- Audience targeting recommendations
- Creative refresh suggestions

---

## Category 19: Competitive Intelligence

### 19.1 Industry Benchmarks
**Concept:** Compare performance against industry averages
- CPM benchmarks
- CTR averages by industry
- Conversion rate comparisons
- ROAS benchmarks

### 19.2 Share of Voice
**Estimated market share:**
- Impression share in category
- Budget share estimates
- Competitive positioning

---

## Category 20: Advanced Data Management

### 20.1 Data Warehouse Integration
**Features:**
- Direct data pipeline to BigQuery/Snowflake/Redshift
- Automated daily syncs
- Historical data retention
- Custom schema mapping

### 20.2 API Rate Limit Management
**Features:**
- Automatic request batching
- Rate limit monitoring
- Queue management
- Request prioritization

### 20.3 Data Quality & Validation
**Features:**
- Data consistency checks
- Missing data alerts
- Duplicate detection
- Data integrity validation

---

## Implementation Considerations

### Pricing Tiers
**Suggested structure for monetization:**

#### **Tier 1: Current (Included)**
- Basic conversion funnel
- TOTAL granularity
- Single ad reporting

#### **Tier 2: Professional ($X/month)**
- All in-scope enhancements
- DAY/HOUR granularity
- Time series charts
- Advanced filtering
- Categories 1-2 from this document

#### **Tier 3: Business ($XX/month)**
- Everything in Professional
- Demographic & geographic insights (Category 5)
- Video engagement metrics (Category 3)
- Reach & frequency (Category 4)
- Custom conversions (Category 7)
- Multi-entity reporting (Category 8)

#### **Tier 4: Enterprise ($XXX/month)**
- Everything in Business
- Lead generation reporting (Category 9)
- AR/Lens tracking (Category 10)
- DPA product reporting (Category 12)
- Creative/Media reporting (Category 14)
- Viewability metrics (Category 11)
- Full async reporting
- Data warehouse integration (Category 20)
- Predictive analytics (Category 18)

---

## API Complexity Assessment

### Low Complexity (Easy to Implement)
- Extended conversion events (Category 1)
- Video metrics (Category 3)
- Campaign/Ad Squad stats (Category 8)
- Landing page views
- Profile clicks

### Medium Complexity (Moderate Effort)
- Demographic insights (Category 5)
- Geographic insights (Category 5)
- Custom conversions (Category 7)
- Conversion source breakdown (Category 13)
- Creative/Media reporting (Category 14)

### High Complexity (Significant Development)
- Reach overlap reporting (Category 4)
- SKAdNetwork metrics (Category 2)
- Async reporting at scale (Category 6)
- DPA product reporting (Category 12)
- Lead gen reporting (Category 9)
- Data warehouse integration (Category 20)

### Very High Complexity (Advanced Features)
- Predictive analytics (Category 18)
- Anomaly detection (Category 18)
- Competitive intelligence (Category 19)

---

## Business Impact by Category

### High Revenue Potential
1. **Lead Generation** - Direct CRM value
2. **DPA Product Reporting** - E-commerce essential
3. **Demographic Insights** - Targeting optimization
4. **Custom Conversions** - Enterprise feature
5. **Predictive Analytics** - High perceived value

### High User Demand
1. **Extended Conversion Events** - Common request
2. **Video Metrics** - Video advertisers need
3. **Demographic Insights** - Universal need
4. **Reach & Frequency** - Brand advertisers
5. **Geographic Insights** - Regional campaigns

### Differentiation Features
1. **Predictive Analytics** - Unique selling point
2. **Data Warehouse Integration** - Enterprise appeal
3. **Viewability Metrics** - Brand safety
4. **Custom Conversions** - Advanced users
5. **Competitive Intelligence** - Strategic value

---

## Recommended Implementation Roadmap

### Quarter 1: Foundation
- Extended conversion events (Category 1)
- Video engagement metrics (Category 3)
- Campaign/Ad Squad reporting (Category 8)

### Quarter 2: Insights
- Demographic breakdown (Category 5)
- Geographic breakdown (Category 5)
- Device insights (Category 5)
- Conversion source tracking (Category 13)

### Quarter 3: Advanced Features
- Reach & frequency (Category 4)
- Custom conversions (Category 7)
- Creative/Media reporting (Category 14)
- Async reporting (Category 6)

### Quarter 4: Enterprise Features
- Lead generation (Category 9)
- DPA reporting (Category 12)
- SKAdNetwork (Category 2)
- Viewability metrics (Category 11)

### Year 2: Innovation
- Predictive analytics (Category 18)
- Data warehouse integration (Category 20)
- Competitive intelligence (Category 19)
- Advanced AR/Lens tracking (Category 10)

---

## Summary

This document outlines **20 major categories** of enhancements beyond the current scope:

1. ✅ **40+ Extended Conversion Events** - Full customer journey
2. 📱 **App Install & SKAdNetwork Tracking** - Mobile attribution
3. 🎥 **Video & Engagement Metrics** - Content performance
4. 👥 **Unique Reach & Frequency** - Audience insights
5. 🌍 **Demo & Geographic Insights** - Targeting optimization
6. 📊 **Advanced Reporting Features** - Large-scale data
7. 🎯 **Custom Conversions** - Tailored tracking
8. 📈 **Multi-Entity Reporting** - Campaign oversight
9. 📋 **Lead Generation** - CRM integration
10. 🎭 **AR Lenses & Filters** - Engagement tracking
11. 👁️ **Viewability & Brand Safety** - Ad quality
12. 🛍️ **Dynamic Product Ads** - E-commerce optimization
13. 🔄 **Advanced Attribution** - Multi-touch tracking
14. 🎨 **Creative & Media Stats** - Asset performance
15. 💰 **Advanced Spend Tracking** - Budget management
16. 👤 **Profile Engagement** - Social tracking
17. 🔀 **Multi-Campaign Analysis** - Portfolio view
18. 🤖 **Predictive Analytics** - AI-powered insights
19. 🏆 **Competitive Intelligence** - Market positioning
20. 🗄️ **Advanced Data Management** - Enterprise integration

**Total Addressable Market:**
- E-commerce brands
- Mobile app developers
- SaaS companies
- Gaming companies
- Service businesses
- Lead generation businesses
- Brand awareness campaigns
- Enterprise advertisers

All features are supported by Snapchat's existing API and represent genuine value-add opportunities for monetization.
