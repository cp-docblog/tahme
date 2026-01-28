// Dashboard data types

export interface DashboardQuickStats {
    totalClients: number;
    totalCampaigns: number;
    totalSpend: number;
    totalRevenue: number;
    averageRoas: number;
}

export interface ClientPerformanceData {
    id: string;
    name: string;
    campaignCount: number;
    spend: number;
    revenue: number;
    roas: number;
    activePlatforms: string[];
    bestPlatform?: {
        name: string;
        roas: number;
        spend: number;
    };
    breakdown?: {
        snap?: any;
        tiktok?: any;
        fb?: any;
    };
    topCampaign?: {
        id: string;
        name: string;
        roas: number;
    };
    topAds?: {
        tiktok?: TopAd;
        facebook?: TopAd;
        snapchat?: TopAd;
    };
}

export interface TopAd {
    name: string;
    spend: number;
    roas: number;
    thumbnail?: string;
}

export interface PerformanceInsight {
    type: 'high_performer' | 'underperformer' | 'scale_opportunity' | 'budget_alert';
    client: string;
    campaign?: string;
    metric: string;
    value: number;
    message: string;
    recommendation?: string;
}

export interface DashboardInsights {
    whatsWorking: PerformanceInsight[];
    whatsNotWorking: PerformanceInsight[];
}

export interface AIKeyInsight {
    type: 'positive' | 'negative' | 'neutral';
    icon: string;
    title: string;
    description: string;
    actionable?: string;
    impact?: 'high' | 'medium' | 'low';
}

export interface AIRecommendation {
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    client?: string;
    estimatedImpact?: string;
    estimatedSavings?: string;
    affectedCampaigns?: number;
}

export interface AISummary {
    summary: string;
    keyInsights: AIKeyInsight[];
    recommendations: AIRecommendation[];
    sentiment: 'optimistic' | 'cautious' | 'concerning';
    confidenceScore: number;
}

export interface DashboardData {
    quickStats: DashboardQuickStats;
    clients: ClientPerformanceData[];
    insights: DashboardInsights;
    aiSummary?: AISummary;
}
