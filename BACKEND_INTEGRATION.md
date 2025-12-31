# Backend Integration - Complete Query String

## New Approach

Frontend now builds the **complete URL query string** and sends it as one piece.

---

## Request Format

```json
{
  "ad_account_id": "xxx",
  "ad_id": "yyy",
  "query_string": "fields=impressions,swipe_up_percent,spend,conversion_purchases,conversion_purchases_value,conversion_start_checkout,conversion_add_billing&start_time=2024-01-01T00:00:00.000%2B03:00&end_time=2024-01-31T00:00:00.000%2B03:00&granularity=DAY&omit_empty=true"
}
```

---

## Backend Implementation

**Super simple - just append the query string!**

```javascript
const { ad_account_id, ad_id, query_string } = request.body;

const url = `https://adsapi.snapchat.com/v1/ads/${ad_id}/stats?${query_string}`;

// Make request to Snapchat with your auth headers
const response = await fetch(url, {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        // ... other headers
    }
});
```

That's it! No URL construction needed on backend.

---

## Date Formatting (Already Handled)

Frontend formats dates following Snapchat's strict rules:

✅ **Timezone:** Asia/Riyadh (UTC+3) hardcoded  
✅ **Format:** `YYYY-MM-DDTHH:mm:ss.SSS+03:00`  
✅ **Time:** Start of day (00:00:00.000)  
✅ **URL Encoding:** `+` → `%2B`

**Example formatted dates:**
- `2024-01-01T00:00:00.000%2B03:00`
- `2024-12-15T00:00:00.000%2B03:00`

---

## Default Date Range

When user doesn't select dates:
- **Start:** 30 days ago from today
- **End:** Today
- Both at start of day in Asia/Riyadh timezone

---

## Complete Query String Breakdown

```
fields=impressions,swipe_up_percent,spend,conversion_purchases,conversion_purchases_value,conversion_start_checkout,conversion_add_billing
&start_time=2024-01-01T00:00:00.000%2B03:00
&end_time=2024-01-31T00:00:00.000%2B03:00
&granularity=TOTAL (or DAY or HOUR)
&swipe_up_attribution_window=7_DAY
&view_attribution_window=7_DAY
&omit_empty=true
```

All parameters **always included**.

### Attribution Windows
- **Swipe-up:** 7 days (conversions within 7 days of swipe attributed)
- **View:** 7 days (conversions within 7 days of view attributed)
- Using **consistent windows** helps create more logical funnel flow
- Snapchat defaults are 28_DAY (swipe) and 1_DAY (view)

---

## Timezone Considerations

### Current Implementation
- **Hardcoded:** Asia/Riyadh (UTC+3)
- Works for accounts in that timezone

### Future Enhancement (if needed)
To support multiple timezones, you could:

1. **Store timezone per account** in your database
2. **Pass it in request:**
```json
{
  "ad_account_id": "xxx",
  "ad_id": "yyy",
  "timezone": "Asia/Riyadh",  // From account settings
  "query_string": "..."
}
```

3. **Or** fetch it from Snapchat org settings on first request and cache it

For now, Asia/Riyadh is hardcoded since it's your primary market.

---

## Example Full URLs

**TOTAL (lifetime):**
```
https://adsapi.snapchat.com/v1/ads/abc123/stats?fields=impressions,swipe_up_percent,spend,conversion_purchases,conversion_purchases_value,conversion_start_checkout,conversion_add_billing&start_time=2015-12-15T00:00:00.000%2B03:00&end_time=2025-12-15T00:00:00.000%2B03:00&granularity=TOTAL&omit_empty=true
```

**DAY (last 7 days):**
```
https://adsapi.snapchat.com/v1/ads/abc123/stats?fields=impressions,swipe_up_percent,spend,conversion_purchases,conversion_purchases_value,conversion_start_checkout,conversion_add_billing&start_time=2025-12-08T00:00:00.000%2B03:00&end_time=2025-12-15T00:00:00.000%2B03:00&granularity=DAY&omit_empty=true
```

**HOUR (today):**
```
https://adsapi.snapchat.com/v1/ads/abc123/stats?fields=impressions,swipe_up_percent,spend,conversion_purchases,conversion_purchases_value,conversion_start_checkout,conversion_add_billing&start_time=2025-12-15T00:00:00.000%2B03:00&end_time=2025-12-15T00:00:00.000%2B03:00&granularity=HOUR&omit_empty=true
```

---

## Testing

**Request body you'll receive:**
```json
{
  "ad_account_id": "your-account-id",
  "ad_id": "your-ad-id",
  "query_string": "fields=impressions,swipe_up_percent,spend,conversion_purchases,conversion_purchases_value,conversion_start_checkout,conversion_add_billing&start_time=2024-12-08T00:00:00.000%2B03:00&end_time=2024-12-15T00:00:00.000%2B03:00&granularity=DAY&omit_empty=true"
}
```

**You construct:**
```
https://adsapi.snapchat.com/v1/ads/your-ad-id/stats?fields=impressions,swipe_up_percent,spend,conversion_purchases,conversion_purchases_value,conversion_start_checkout,conversion_add_billing&start_time=2024-12-08T00:00:00.000%2B03:00&end_time=2024-12-15T00:00:00.000%2B03:00&granularity=DAY&omit_empty=true
```

**That's it!** No date parsing, no URL building - just append!

---

## Benefits

✅ **Simple backend** - Just string concatenation  
✅ **Frontend controls format** - Snapchat-compliant dates  
✅ **No timezone bugs** - Handled in one place  
✅ **Easy debugging** - Full URL visible in request  
✅ **Consistent** - Same format every time
