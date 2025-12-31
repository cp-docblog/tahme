# AI Metrics & Response Format Specification

## Backend API Endpoints

### 1. Dashboard Data Endpoint

**Endpoint**: `GET /api/dashboard-data`

**Query Parameters**:
- `user_id`: Current user ID (from JWT)
- `date_range`: `last_7_days`, `last_30_days`, `this_month` (default: `last_30_days`)

**Response Format**:
```json
{
  "quickStats": {
    "totalClients": 12,
    "totalCampaigns": 45,
    "totalSpend": 125430.50,
    "totalRevenue": 301032.00,
    "averageRoas": 2.4
  },
  "clients": [
    {
      "id": "client_123",
      "name": "ABC Company",
      "campaignCount": 5,
      "spend": 12500.00,
      "revenue": 31250.00,
      "roas": 2.5,
      "topCampaign": {
        "id": "camp_456",
        "name": "Summer Sale",
        "roas": 3.2
      }
    }
  ],
  "insights": {
    "whatsWorking": [
      {
        "type": "high_roas_campaign",
        "client": "ABC Company",
        "campaign": "Summer Sale",
        "metric": "ROAS",
        "value": 3.2,
        "message": "Campaign 'Summer Sale' for ABC Company achieving 3.2 ROAS"
      }
    ],
    "whatsNotWorking": [
      {
        "type": "low_roas_campaign",
        "client": "XYZ Ltd",
        "campaign": "Winter Promo",
        "metric": "ROAS",
        "value": 1.2,
        "message": "Campaign 'Winter Promo' for XYZ Ltd below 1.5 ROAS target",
        "recommendation": "Consider pausing or optimizing ad creatives"
      }
    ]
  }
}
```

### 2. AI Summary Endpoint

**Endpoint**: `POST /api/ai-summary`

**Request Body** - Metrics Payload:
```json
{
  "dateRange": {
    "start": "2025-12-01",
    "end": "2025-12-15",
    "period": "last_30_days"
  },
  "overallMetrics": {
    "totalSpend": 125430.50,
    "totalRevenue": 301032.00,
    "totalImpressions": 5234567,
    "totalConversions": 450,
    "averageRoas": 2.4,
    "averageCtr": 1.8,
    "averageCpm": 23.95
  },
  "clientPerformance": [
    {
      "clientId": "client_123",
      "clientName": "ABC Company",
      "campaigns": 5,
      "spend": 12500.00,
      "revenue": 31250.00,
      "roas": 2.5,
      "impressions": 450000,
      "conversions": 45,
      "ctr": 2.1,
      "topCampaign": {
        "name": "Summer Sale",
        "roas": 3.2,
        "spend": 5000.00
      },
      "worstCampaign": {
        "name": "Product Launch",
        "roas": 1.8,
        "spend": 2500.00
      }
    }
  ],
  "trends": {
    "spendTrend": 12.5,  // % change vs previous period
    "revenueTrend": 24.3,
    "roasTrend": 8.2,
    "conversionTrend": 15.7
  },
  "topPerformers": {
    "byRoas": [
      {
        "clientName": "ABC Company",
        "campaignName": "Summer Sale",
        "roas": 3.2,
        "spend": 5000.00,
        "revenue": 16000.00
      }
    ],
    "byRevenue": [
      {
        "clientName": "XYZ Ltd",
        "campaignName": "Black Friday",
        "revenue": 45000.00,
        "roas": 2.8
      }
    ]
  },
  "underperformers": [
    {
      "clientName": "DEF Corp",
      "campaignName": "Q4 Campaign",
      "roas": 1.2,
      "spend": 8000.00,
      "issue": "low_roas"
    }
  ]
}
```

**Response Format** - AI Summary:
```json
{
  "summary": "Your campaigns are performing well overall with a 2.4 ROAS across 12 clients. Revenue is up 24% compared to last month, driven primarily by ABC Company's 'Summer Sale' campaign. However, 3 campaigns need attention due to ROAS below 1.5.",
  
  "keyInsights": [
    {
      "type": "positive",
      "icon": "trending_up",
      "title": "Strong Revenue Growth",
      "description": "Revenue increased 24.3% vs last period, outpacing spend growth of 12.5%",
      "impact": "high"
    },
    {
      "type": "positive",
      "icon": "trophy",
      "title": "ABC Company Leading",
      "description": "ABC Company's 'Summer Sale' achieving 3.2 ROAS with SAR 16,000 in revenue",
      "actionable": "Consider scaling budget for this campaign"
    },
    {
      "type": "negative",
      "icon": "alert_triangle",
      "title": "3 Campaigns Underperforming",
      "description": "DEF Corp's 'Q4 Campaign' and 2 others below 1.5 ROAS target",
      "actionable": "Review ad creatives and audience targeting"
    }
  ],
  
  "recommendations": [
    {
      "priority": "high",
      "action": "Scale 'Summer Sale' campaign",
      "reason": "Consistent 3.2 ROAS indicates room for growth",
      "client": "ABC Company",
      "estimatedImpact": "+SAR 5,000 revenue with SAR 2,000 additional spend"
    },
    {
      "priority": "high",
      "action": "Pause or optimize 'Q4 Campaign'",
      "reason": "1.2 ROAS means losing money on each conversion",
      "client": "DEF Corp",
      "estimatedSavings": "SAR 3,200/month"
    },
    {
      "priority": "medium",
      "action": "Test new ad creatives for low CTR campaigns",
      "reason": "Average CTR of 1.2% below platform benchmark of 1.8%",
      "affectedCampaigns": 5
    }
  ],
  
  "sentiment": "optimistic", // "optimistic", "cautious", "concerning"
  "confidenceScore": 0.85 // 0-1, how confident the AI is in its analysis
}
```

## Frontend Integration

### Dashboard Component Data Flow

```typescript
// src/pages/Dashboard.tsx

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await fetch(
    `${backendUrl}/api/dashboard-data?date_range=last_30_days`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};

const fetchAISummary = async (metrics: MetricsPayload): Promise<AISummary> => {
  const response = await fetch(
    `${backendUrl}/api/ai-summary`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metrics)
    }
  );
  return response.json();
};
```

## What's Working / Not Working Logic

### Frontend Calculation (Fallback if backend doesn't provide insights)

```typescript
const calculateInsights = (clients: ClientData[]) => {
  const whatsWorking = [];
  const whatsNotWorking = [];
  
  clients.forEach(client => {
    // What's Working: High ROAS
    if (client.roas >= 2.5) {
      whatsWorking.push({
        type: 'high_performer',
        client: client.name,
        metric: 'ROAS',
        value: client.roas,
        message: `${client.name} achieving strong ${client.roas.toFixed(1)} ROAS`
      });
    }
    
    // What's Not Working: Low ROAS
    if (client.roas < 1.5) {
      whatsNotWorking.push({
        type: 'underperformer',
        client: client.name,
        metric: 'ROAS',
        value: client.roas,
        message: `${client.name} below target with ${client.roas.toFixed(1)} ROAS`,
        recommendation: 'Review campaign settings and creative performance'
      });
    }
    
    // What's Working: High spend with good ROAS
    if (client.spend > 10000 && client.roas > 2.0) {
      whatsWorking.push({
        type: 'scale_opportunity',
        client: client.name,
        metric: 'Spend Efficiency',
        value: client.spend,
        message: `${client.name} efficiently scaling with SAR ${client.spend.toLocaleString()} spend`
      });
    }
  });
  
  return { whatsWorking, whatsNotWorking };
};
```

## AI Prompt Guidance (For Your Backend)

When implementing the AI analysis, consider prompting with:

```
You are a marketing campaign analyst. Analyze the following metrics and provide:

1. A concise summary (2-3 sentences) of overall performance
2. 3-5 key insights (both positive and negative)
3. Specific, actionable recommendations prioritized by potential impact

Focus on:
- ROAS trends and which campaigns are profitable
- Spend efficiency and scaling opportunities
- Underperforming campaigns that need optimization or pausing
- Revenue growth opportunities

Metrics:
{metrics_json}

Provide analysis in JSON format matching the specified schema.
```

## Summary

**You send to backend**:
- Overall metrics (spend, revenue, ROAS, etc.)
- Per-client performance data
- Top/bottom performers
- Trend data

**Backend AI returns**:
- Executive summary (2-3 sentences)
- Key insights (3-5 items with type, description, actionable advice)
- Prioritized recommendations
- Sentiment indicator

**Frontend displays**:
- AI summary at top
- Key insights below
- What's Working (green) / What's Not Working (red) sections
- Actionable recommendations with estimated impact
