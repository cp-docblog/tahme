# In-Scope Enhancements for Snapchat Measurements

## Overview
This document outlines enhancements that can be implemented within our current scope - focusing on the metrics we already use and closely related functionality. These improvements will provide better visualization, filtering, and control over our existing conversion funnel data.

---

## Current Metrics in Use
- **Impressions** (`impressions`)
- **Swipe Up Percent** (`swipe_up_percent`)
- **Spend** (`spend`)
- **Conversion Purchases** (`conversion_purchases`)
- **Conversion Purchase Value** (`conversion_purchases_value`)
- **Conversion Start Checkout** (`conversion_start_checkout`)
- **Conversion Add Billing** (`conversion_add_billing`)

**Calculated Metrics:**
- ROAS (Return on Ad Spend)
- CPP (Cost Per Purchase)
- CPM (Cost Per Mille/Thousand Impressions)
- CTR (Click Through Rate)

---

## 1. Time-Based Filtering & Granularity

### 1.1 Granularity Options
**Enhancement:** Add support for different time granularities
- **TOTAL** - Current implementation (lifetime data)
- **DAY** - Daily breakdown (24-hour periods)
- **HOUR** - Hourly breakdown (60-minute periods)

**Benefits:**
- See performance trends throughout the day
- Identify peak conversion times
- Optimize campaign scheduling

**API Parameters:**
```
granularity=DAY&start_time=2024-10-01T00:00:00&end_time=2024-10-31T00:00:00
```

### 1.2 Date Range Selector
**Enhancement:** Interactive date range picker
- Preset ranges: Today, Yesterday, Last 7 Days, Last 30 Days, Custom
- Calendar widget for custom date selection
- Compare periods (e.g., This Week vs Last Week)

**UI Component:**
- Date range dropdown with visual calendar
- "Compare to previous period" checkbox
- Quick preset buttons

---

## 2. Advanced Filtering

### 2.1 Metric Threshold Filters
**Enhancement:** Filter ads based on performance thresholds
- Minimum/Maximum spend range
- ROAS threshold (e.g., show only ROAS > 2x)
- Minimum purchases
- CPP range filter

**Example Filters:**
```
- Spend: $100 - $1000
- ROAS: > 2.0x
- Purchases: > 10
- CPM: < $50
```

### 2.2 Conversion Funnel Filters
**Enhancement:** Filter by funnel stage performance
- Checkout initiation rate
- Payment addition rate
- Purchase conversion rate
- Drop-off rate between stages

**Use Cases:**
- Find ads with high checkout but low purchases
- Identify payment friction points
- Optimize underperforming funnel stages

### 2.3 Attribution Window Selection
**Enhancement:** Allow users to choose attribution windows

**Swipe Attribution Windows:**
- 1 Day
- 7 Days
- 28 Days (current default)

**View Attribution Windows:**
- None
- 1 Hour
- 3 Hours
- 6 Hours
- 1 Day (current default)
- 7 Days

**API Parameters:**
```
swipe_up_attribution_window=28_DAY
view_attribution_window=1_DAY
```

---

## 3. Enhanced Data Visualization

### 3.1 Time Series Charts
**Enhancement:** Interactive line/area charts for trend analysis

**Chart Types:**
- **Spend Over Time** - Daily/hourly spend tracking
- **Conversions Trend** - Purchases, checkouts, billing additions
- **ROAS Trend** - Track return on ad spend over time
- **Funnel Drop-offs** - Visualize where users leave the funnel

**Features:**
- Zoom in/out on specific time periods
- Hover tooltips with exact values
- Toggle multiple metrics on same chart
- Export chart as image

### 3.2 Funnel Visualization Enhancement
**Current:** Basic horizontal bars showing funnel steps
**Enhancement:** 
- Animated funnel with conversion rates between steps
- Drop-off percentages displayed
- Color coding (green for good conversion, red for high drop-off)
- Click to drill down into specific stage

**Example:**
```
Impressions: 100,000 (100%)
    ↓ [5% conversion rate]
Checkouts: 5,000 (5%)
    ↓ [60% conversion rate]
Payment Info: 3,000 (3%)
    ↓ [80% conversion rate]
Purchases: 2,400 (2.4%)
```

### 3.3 Comparison Charts
**Enhancement:** Side-by-side comparison capabilities
- Compare multiple ads
- Compare time periods
- Compare attribution windows
- Delta indicators (↑ 15% vs previous period)

---

## 4. Breakdown & Segmentation

### 4.1 Conversion Attribution Breakdown
**Enhancement:** Show how conversions are attributed

**Metrics Available:**
- **Total Conversions** (current)
- **Swipe Conversions** - From swipe-up actions
- **View Conversions** - From views (shorter than 5s)
- **Engaged View Conversions** - From engaged views (5s+)

**Implementation:**
```typescript
conversion_purchases              // Total (current)
conversion_purchases_swipe_up     // From swipes
conversion_purchases_view         // From views
conversion_purchases_engaged_view // From engaged views (5s+)
```

**UI Display:**
- Pie chart showing attribution split
- Stacked bar chart for each metric
- Percentage breakdown

### 4.2 Conversion Value Breakdown
**Enhancement:** Add granular value tracking for all conversion events

**Current:** Only `conversion_purchases_value`
**Enhanced:**
```
conversion_start_checkout_value
conversion_add_billing_value
```

**Benefits:**
- Track value at each funnel stage
- Calculate value drop-off
- Identify high-value conversion patterns

---

## 5. Performance Metrics & KPIs

### 5.1 Conversion Rate Metrics
**Enhancement:** Calculate and display conversion rates

**New Calculated Metrics:**
- **Checkout Rate** = (Start Checkout / Impressions) × 100
- **Payment Rate** = (Add Billing / Start Checkout) × 100
- **Purchase Rate** = (Purchases / Add Billing) × 100
- **Overall Conversion Rate** = (Purchases / Impressions) × 100

### 5.2 Efficiency Metrics
**Enhancement:** Additional cost-efficiency calculations

**New Calculated Metrics:**
- **Cost Per Checkout** = Spend / Start Checkout
- **Cost Per Billing Info** = Spend / Add Billing
- **Cost Per Click (CPC)** = Spend / (Impressions × CTR)

---

## 6. Data Export & Reporting

### 6.1 Export Capabilities
**Enhancement:** Allow data export in multiple formats
- **CSV Export** - For Excel/spreadsheet analysis
- **JSON Export** - For custom processing
- **PDF Report** - Formatted report with charts

**Export Options:**
- Current view data
- Filtered results
- Custom date range
- Include/exclude charts

### 6.2 Scheduled Reports
**Enhancement:** Automated report generation
- Daily/Weekly/Monthly reports
- Email delivery
- Custom metric selection
- Automatic insights (e.g., "Top performing ad this week")

---

## 7. Real-time Updates & Refresh

### 7.1 Auto-Refresh
**Enhancement:** Automatic data refreshing
- Refresh every 15 minutes (matches Snapchat's update frequency)
- Manual refresh button
- "Last updated" timestamp
- Loading state for partial updates

### 7.2 Data Finalization Indicator
**Enhancement:** Show data status and reliability

**Snapchat provides:**
- `finalized_data_end_time` - When metrics are finalized (48hrs after day end)
- `conversion_data_processed_end_time` - When conversion data is final

**UI Indicator:**
- Badge showing "Preliminary" vs "Finalized"
- Tooltip explaining 48-hour finalization period
- Warning for data that may still change

---

## 8. Multi-Currency Support

### 8.1 Currency Handling
**Enhancement:** Proper multi-currency display
- Detect ad account currency
- Display in account currency (instead of hardcoded $)
- Support for micro-currency conversion (Snapchat uses micro-cents)

**Current Issue:** Everything shown as `$` USD
**Solution:** Use ad account currency settings

---

## 9. Enhanced Table Views

### 9.1 Sortable & Searchable Tables
**Enhancement:** Interactive data tables
- Sort by any column (spend, ROAS, purchases, etc.)
- Search/filter ads by name or ID
- Column visibility toggle
- Resizable columns

### 9.2 Pagination
**Enhancement:** Handle large data sets efficiently
- Paginated results (20/50/100 per page)
- "Load more" or traditional pagination
- Total results counter

---

## 10. Conversion Funnel Analytics

### 10.1 Funnel Drop-off Analysis
**Enhancement:** Identify weak points in conversion funnel

**Metrics to Display:**
- Impressions → Checkout drop-off rate
- Checkout → Billing drop-off rate
- Billing → Purchase drop-off rate

**Visualization:**
- Sankey diagram showing flow
- Red highlighting for high drop-off stages
- Comparison to account average

### 10.2 Funnel Time Analysis
**Enhancement:** Show how funnel performs over time
- Hourly conversion funnel (using HOUR granularity)
- Daily funnel trends
- Identify best performing time periods

---

## 11. Alerts & Notifications

### 11.1 Performance Alerts
**Enhancement:** Automated alerts for metric thresholds
- ROAS drops below threshold
- Spend exceeds budget
- Purchase rate drops significantly
- Ad performance anomalies

**Implementation:**
- Browser notifications
- Email alerts
- In-app alert center

---

## 12. Omit Empty Records

### 12.1 Clean Data Display
**Enhancement:** Remove zero-data entries
- Use `omit_empty=true` parameter
- Cleaner reports, faster processing
- Focus on active campaigns only

**API Parameter:**
```
omit_empty=true
```

**Benefit:** Removes dates/entities with zero metrics for all fields

---

## Implementation Priority

### Phase 1 (High Priority)
1. Time-based filtering (DAY/HOUR granularity)
2. Date range selector
3. Time series charts
4. Enhanced funnel visualization
5. Conversion attribution breakdown

### Phase 2 (Medium Priority)
6. Metric threshold filters
7. Conversion rate calculations
8. Data export (CSV/PDF)
9. Auto-refresh functionality
10. Sortable tables

### Phase 3 (Lower Priority)
11. Attribution window selection
12. Scheduled reports
13. Performance alerts
14. Multi-currency support
15. Comparison views

---

## API Integration Notes

### Required Endpoint Modifications
Most enhancements can be implemented by modifying the existing `/fetch-snap-ad-report` endpoint to support additional parameters:

```typescript
// Current
{
  ad_account_id: string;
  ad_id: string;
}

// Enhanced
{
  ad_account_id: string;
  ad_id: string;
  granularity?: 'TOTAL' | 'DAY' | 'HOUR';
  start_time?: string; // ISO 8601
  end_time?: string;   // ISO 8601
  swipe_up_attribution_window?: '1_DAY' | '7_DAY' | '28_DAY';
  view_attribution_window?: 'none' | '1_HOUR' | '3_HOUR' | '6_HOUR' | '1_DAY' | '7_DAY';
  omit_empty?: boolean;
}
```

### Additional Fields to Request
```
fields=impressions,
       swipe_up_percent,
       spend,
       conversion_purchases,
       conversion_purchases_value,
       conversion_purchases_swipe_up,
       conversion_purchases_view,
       conversion_purchases_engaged_view,
       conversion_start_checkout,
       conversion_start_checkout_value,
       conversion_start_checkout_swipe_up,
       conversion_start_checkout_view,
       conversion_add_billing,
       conversion_add_billing_value,
       conversion_add_billing_swipe_up,
       conversion_add_billing_view
```

---

## Estimated Impact

### User Experience
- ✅ **30-40% faster** decision making with time series charts
- ✅ **Better insights** with funnel drop-off analysis
- ✅ **More control** with advanced filtering
- ✅ **Clearer attribution** understanding with breakdown views

### Development Effort
- **Frontend:** 2-3 weeks for all Phase 1 features
- **Backend:** 1 week for API parameter extensions
- **Testing:** 1 week for quality assurance

---

## Notes
- All enhancements use existing Snapchat API capabilities
- No additional API costs required
- Maintains current metric focus (conversion funnel)
- Backward compatible with existing implementation
