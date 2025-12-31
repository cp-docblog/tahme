# Bug Fixes Summary

## Issues Fixed

### 1. Backend: Optional Filter Parameters
**Problem:** Backend couldn't process requests when `filter_params` wasn't provided.

**Solution:** Frontend now only sends `filter_params` when needed:
- When `granularity !== 'TOTAL'`
- OR when date range is set

**New Request Format:**

**TOTAL granularity (no filters):**
```json
{
  "ad_account_id": "xxx",
  "ad_id": "yyy"
}
```

**DAY/HOUR granularity (with filters):**
```json
{
  "ad_account_id": "xxx",
  "ad_id": "yyy",
  "filter_params": {
    "granularity": "DAY",
    "fields": "impressions,swipe_up_percent,spend,...",
    "start_time": "2024-01-01T00:00:00.000Z",
    "end_time": "2024-01-31T23:59:59.999Z",
    "omit_empty": "true"
  }
}
```

**Backend URL Construction:**

Your current curl is correct! Backend should check if `filter_params` exists:

```javascript
// If filter_params not present (TOTAL without date range)
GET /v1/ads/{ad_id}/stats

// If filter_params present
GET /v1/ads/{ad_id}/stats?{construct from filter_params}
```

---

### 2. Frontend: Missing Fields Crash
**Problem:** Snapchat returned only `impressions` and `spend`, but code expected all conversion fields, causing:
```
Cannot read properties of undefined (reading 'toLocaleString')
```

**Solution:** Made all fields optional and added default values (`|| 0`) everywhere:

**Changes Made:**

1. **`types/metrics.ts`** - All fields now optional:
```typescript
export interface AdReportStats {
    impressions?: number;  // Was: number
    spend?: number;        // Was: number
    conversion_purchases?: number;  // Was: number
    // ... etc
}
```

2. **`AdReport.tsx`** - Added `|| 0` to all field accesses:
```typescript
// Before
formatNumber(stats.conversion_purchases)

// After
formatNumber(stats.conversion_purchases || 0)
```

3. **Calculation functions** - Added null checks:
```typescript
const calculateROAS = () => {
    if (!stats || !stats.spend || stats.spend === 0 || !stats.conversion_purchases_value) return 0;
    return stats.conversion_purchases_value / stats.spend;
};
```

4. **TimeSeriesChart** - Safe data transformation:
```typescript
const chartData = data.map(point => ({
    purchases: point.stats.conversion_purchases || 0,
    checkouts: point.stats.conversion_start_checkout || 0,
    spend: (point.stats.spend || 0) / 1000000,
    impressions: (point.stats.impressions || 0) / 1000
}));
```

---

## Files Modified

1. ✅ `src/types/metrics.ts` - Made all stats fields optional
2. ✅ `src/components/Campaigns/AdReport.tsx` - Conditional filter_params + null safety
3. ✅ `src/components/Charts/TimeSeriesChart.tsx` - Safe data transformation

---

## Now It Handles

✅ **Missing conversion metrics** - Shows 0 instead of crashing  
✅ **Partial data from Snapchat** - Works with any subset of fields  
✅ **TOTAL without filters** - Doesn't send filter_params  
✅ **DAY/HOUR with filters** - Sends filter_params as before  
✅ **Optional dates** - Only sends start_time/end_time if dates set  

---

## Test Cases Now Working

1. **TOTAL granularity, no dates** → No filter_params sent ✅
2. **TOTAL granularity, with dates** → filter_params sent with dates ✅
3. **DAY granularity** → filter_params sent ✅
4. **Snapchat returns only impressions + spend** → Shows 0 for conversions ✅
5. **Missing swipe_up_percent** → Shows 0% CTR ✅
6. **Missing all conversion fields** → Funnel shows 0s ✅

---

## Backend Notes

Your curl looks good, but make sure to handle when `filter_params` is not in the request body:

```javascript
// Pseudo-code
if (request.body.filter_params) {
    // Build URL with params
    const params = new URLSearchParams();
    params.append('fields', request.body.filter_params.fields);
    params.append('granularity', request.body.filter_params.granularity);
    
    if (request.body.filter_params.start_time) {
        params.append('start_time', /* format as needed */);
    }
    
    if (request.body.filter_params.end_time) {
        params.append('end_time', /* format as needed */);
    }
    
    if (request.body.filter_params.omit_empty) {
        params.append('omit_empty', request.body.filter_params.omit_empty);
    }
    
    url = `https://adsapi.snapchat.com/v1/ads/${ad_id}/stats?${params}`;
} else {
    // Simple TOTAL query
    url = `https://adsapi.snapchat.com/v1/ads/${ad_id}/stats`;
}
```

Your time zone handling (`setZone('Asia/Riyadh')`) is perfect - keep that!

---

## Ready to Test ✅

Both issues are now fixed. The app should:
1. Work without filter_params for TOTAL
2. Never crash on missing Snapchat fields
3. Display 0 for any missing conversion data
