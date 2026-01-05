import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Activity, TrendingUp, Award, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI/Card';
import { Tabs, Tab } from '../UI/Tabs';
import { DateRangePicker } from '../UI/DateRangePicker';
import { DateRange } from '../../types/dateRange';
import { AIReportModal } from './AIReportModal';
import { Button } from '../UI/Button';
import { FilterDropdown, SortDropdown, SortMetric, FilterState } from '../UI/FilterDropdown';
import styles from './CampaignsList.module.css';

interface Campaign {
    id: string;
    name: string;
    status: string;
    objective?: string;
    delivery_status?: string[];
    start_time?: string;
    daily_budget_micro?: number;
    [key: string]: any;
}

interface CampaignsListProps {
    clientId: string;
    adAccountId: string;
    onSelectCampaign: (campaign: Campaign) => void;
}

export const CampaignsList: React.FC<CampaignsListProps> = ({
    clientId,
    adAccountId,
    onSelectCampaign
}) => {
    const { t, i18n } = useTranslation();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'top' | 'paused'>('active');
    const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
    const [performanceStats, setPerformanceStats] = useState<Map<string, any>>(new Map());

    // Sorting and filtering state
    const [sortBy, setSortBy] = useState<SortMetric>('roas');
    const [filter, setFilter] = useState<FilterState | null>(null);

    // AI Modal state
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiLoading, setAILoading] = useState(false);
    const [aiError, setAIError] = useState<string | null>(null);
    const [aiOutput, setAIOutput] = useState<string | null>(null);

    useEffect(() => {
        fetchCampaigns();
        fetchPerformanceStats();
    }, [adAccountId, dateRange.start, dateRange.end]);

    const fetchCampaigns = async () => {
        setLoading(true);
        setError(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            const response = await fetch(`${webhookUrl}/fetch-snap-campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ad_account_id: adAccountId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch campaigns');
            }

            const data = await response.json();

            // Parse the actual API response structure
            const campaignsList: Campaign[] = [];
            if (data && Array.isArray(data) && data[0]?.campaigns) {
                data[0].campaigns.forEach((item: any) => {
                    if (item.campaign) {
                        campaignsList.push(item.campaign);
                    }
                });
            }

            setCampaigns(campaignsList);
        } catch (err) {
            console.error('Error fetching campaigns:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformanceStats = async () => {
        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) return;

            // Build query string following AdReport pattern
            const formatSnapchatDate = (date: Date, isEndDate: boolean = false): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');

                let isoString: string;
                if (isEndDate) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextYear = nextDay.getFullYear();
                    const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
                    const nextDayNum = String(nextDay.getDate()).padStart(2, '0');
                    isoString = `${nextYear}-${nextMonth}-${nextDayNum}T00:00:00+03:00`;
                } else {
                    isoString = `${year}-${month}-${day}T00:00:00+03:00`;
                }
                return isoString.replace('+', '%2B');
            };

            let startDate: Date;
            let endDate: Date;

            if (dateRange.start && dateRange.end) {
                startDate = dateRange.start;
                endDate = dateRange.end;
            } else {
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                startDate = thirtyDaysAgo;
                endDate = today;
            }

            const params: string[] = [];
            params.push('fields=spend,impressions,conversion_purchases,conversion_purchases_value');
            params.push('breakdown=campaign');
            params.push(`start_time=${formatSnapchatDate(startDate, false)}`);
            params.push(`end_time=${formatSnapchatDate(endDate, true)}`);
            params.push('granularity=TOTAL');
            params.push('swipe_up_attribution_window=7_DAY');
            params.push('view_attribution_window=NONE');
            params.push('omit_empty=true');

            const queryString = params.join('&');

            // Construct the payload object
            const payload = {
                accountId: adAccountId,
                queryString: queryString
            };

            // Send as POST with body
            const response = await fetch(`${webhookUrl}/tash-snap-account-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) return;

            const data = await response.json();

            // Parse stats by campaign ID from breakdown_stats
            const statsMap = new Map<string, any>();
            if (data && Array.isArray(data) && data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.campaign) {
                const campaigns = data[0].total_stats[0].total_stat.breakdown_stats.campaign;
                campaigns.forEach((item: any) => {
                    if (item?.id && item?.stats) {
                        statsMap.set(item.id, item.stats);
                    }
                });
            }
            setPerformanceStats(statsMap);
        } catch (err) {
            console.error('Error fetching performance stats:', err);
        }
    };

    const formatBudget = (budgetMicro?: number) => {
        if (!budgetMicro) return null;
        return `$${(budgetMicro / 1000000).toFixed(0)}`;
    };

    const getDeliveryStatus = (deliveryStatus?: string[]) => {
        if (!deliveryStatus || deliveryStatus.length === 0) return 'Unknown';
        if (deliveryStatus.includes('VALID')) return 'Active Delivery';
        return 'Not Delivering';
    };

    const handleAskAI = async () => {
        setIsAIModalOpen(true);
        setAILoading(true);
        setAIError(null);
        setAIOutput(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            // Prepare campaigns data with performance stats
            const campaignsData = campaigns.map(campaign => ({
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                objective: campaign.objective,
                stats: performanceStats.get(campaign.id) || {
                    spend: 0,
                    impressions: 0,
                    conversion_purchases: 0,
                    conversion_purchases_value: 0
                }
            }));

            const payload = {
                type: 'campaigns',
                language: i18n.language,
                data: campaignsData,
                dateRange: {
                    start: dateRange.start?.toISOString() || null,
                    end: dateRange.end?.toISOString() || null
                }
            };

            const response = await fetch(`${webhookUrl}/tash-performance-ai-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to get AI analysis');
            }

            const data = await response.json();

            // Backend returns an array: [{ "output": "..." }]
            if (Array.isArray(data) && data.length > 0 && data[0].output) {
                setAIOutput(data[0].output);
            } else if (data.output) {
                setAIOutput(data.output);
            } else if (data.analysis) {
                setAIOutput(data.analysis);
            } else {
                setAIOutput('No analysis provided');
            }
        } catch (err) {
            console.error('Error getting AI analysis:', err);
            setAIError(t('common.error'));
        } finally {
            setAILoading(false);
        }
    };

    // Filter campaigns based on active tab
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
    const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED' || c.status !== 'ACTIVE');

    // Helper function to get metric value
    const getMetricValue = (stats: any, metric: SortMetric): number => {
        if (!stats) return 0;
        switch (metric) {
            case 'roas':
                return stats.spend > 0 ? stats.conversion_purchases_value / stats.spend : 0;
            case 'purchases':
                return stats.conversion_purchases || 0;
            case 'costPerPurchase':
                return stats.conversion_purchases > 0 ? stats.spend / stats.conversion_purchases : 0;
            case 'spend':
                return stats.spend || 0;
            case 'impressions':
                return stats.impressions || 0;
            case 'cpc':
                return stats.impressions > 0 ? stats.spend / stats.impressions : 0;
            default:
                return 0;
        }
    };

    // Sort campaigns by selected metric
    const sortCampaigns = (list: Campaign[], metric: SortMetric, descending = true): Campaign[] => {
        return [...list].sort((a, b) => {
            const aVal = getMetricValue(performanceStats.get(a.id), metric);
            const bVal = getMetricValue(performanceStats.get(b.id), metric);
            return descending ? bVal - aVal : aVal - bVal;
        });
    };

    // Apply filter to campaigns
    const applyFilter = (list: Campaign[]): Campaign[] => {
        if (!filter || filter.value === null) return list;
        return list.filter(c => {
            const val = getMetricValue(performanceStats.get(c.id), filter.metric);
            switch (filter.operator) {
                case 'gt': return val > filter.value!;
                case 'lt': return val < filter.value!;
                case 'eq': return val === filter.value!;
                default: return true;
            }
        });
    };

    // Calculate top performing campaigns (sorted by selected metric)
    const topPerformers = useMemo(() => {
        return sortCampaigns(campaigns.filter(c => {
            const stats = performanceStats.get(c.id);
            return stats && stats.spend > 0;
        }), sortBy);
    }, [campaigns, performanceStats, sortBy]);

    const topPerformer = topPerformers[0] || null;

    // Get campaigns to display based on active tab
    let displayCampaigns: Campaign[] = [];
    if (activeTab === 'active') {
        displayCampaigns = applyFilter(sortCampaigns(activeCampaigns, sortBy));
    } else if (activeTab === 'top') {
        displayCampaigns = topPerformers;
    } else if (activeTab === 'paused') {
        displayCampaigns = applyFilter(sortCampaigns(pausedCampaigns, sortBy));
    }

    // Create tabs
    const tabs: Tab[] = [
        {
            id: 'active',
            label: t('campaigns.tabs.active'),
            count: activeCampaigns.length
        },
        {
            id: 'top',
            label: t('campaigns.tabs.topPerforming'),
            count: topPerformer ? 1 : 0
        },
        {
            id: 'paused',
            label: t('campaigns.tabs.paused'),
            count: pausedCampaigns.length
        }
    ];

    // Render loading, error, or content based on state
    const renderContent = () => {
        if (loading) {
            return (
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>{t('common.loading')}</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className={styles.errorState}>
                    <p>{error}</p>
                </div>
            );
        }

        if (campaigns.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <Activity size={48} />
                    <p>{t('campaigns.noCampaigns')}</p>
                </div>
            );
        }

        return (
            <>
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as typeof activeTab)} />

                {displayCampaigns.length === 0 ? (
                    <div className={styles.emptyTabState}>
                        <Activity size={48} />
                        <p>
                            {activeTab === 'active' && t('campaigns.noActiveCampaigns')}
                            {activeTab === 'top' && t('campaigns.noTopPerformer')}
                            {activeTab === 'paused' && t('campaigns.noPausedCampaigns')}
                        </p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {displayCampaigns.map((campaign) => {
                            const isTopPerformer = activeTab === 'top' && campaign.id === topPerformer?.id;
                            const stats = performanceStats.get(campaign.id);
                            const roas = isTopPerformer && stats && stats.spend > 0
                                ? stats.conversion_purchases_value / stats.spend
                                : null;

                            return (
                                <Card
                                    key={campaign.id}
                                    className={`${styles.campaignCard} ${isTopPerformer ? styles.topPerformerCard : ''}`}
                                    hover
                                    onClick={() => onSelectCampaign(campaign)}
                                >
                                    {isTopPerformer && (
                                        <div className={styles.topPerformerBadge}>
                                            <Award size={16} />
                                            <span>{t('campaigns.topPerformer')}</span>
                                        </div>
                                    )}

                                    <div className={styles.campaignHeader}>
                                        <h3 className={styles.campaignName}>{campaign.name}</h3>
                                        <span
                                            className={`${styles.statusBadge} ${campaign.status === 'ACTIVE' ? styles.active :
                                                campaign.status === 'PAUSED' ? styles.paused :
                                                    styles.inactive
                                                }`}
                                        >
                                            {campaign.status === 'PAUSED' ? 'PAUSED' : campaign.status}
                                        </span>
                                    </div>

                                    {isTopPerformer && roas && (
                                        <div className={styles.topPerformerReason}>
                                            <span className={styles.reasonLabel}>{t('campaigns.topPerformerReason')}:</span>
                                            <span className={styles.reasonValue}>
                                                {t('campaigns.highestRoas')} ({roas.toFixed(2)}x)
                                            </span>
                                        </div>
                                    )}

                                    <div className={styles.campaignDetails}>
                                        {stats ? (
                                            <>
                                                <div className={styles.detail}>
                                                    <span className={styles.detailLabel}>{t('campaigns.spend')}:</span>
                                                    <span className={styles.detailValue}>
                                                        ${((stats.spend || 0) / 1000000).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className={styles.detail}>
                                                    <span className={styles.detailLabel}>{t('campaigns.purchases')}:</span>
                                                    <span className={styles.detailValue}>
                                                        {stats.conversion_purchases || 0}
                                                    </span>
                                                </div>
                                                <div className={styles.detail}>
                                                    <span className={styles.detailLabel}>{t('campaigns.roas')}:</span>
                                                    <span className={`${styles.detailValue} ${stats.spend > 0 && stats.conversion_purchases_value > 0
                                                        ? (stats.conversion_purchases_value / stats.spend) >= 2
                                                            ? styles.roasGood
                                                            : (stats.conversion_purchases_value / stats.spend) >= 1
                                                                ? styles.roasOk
                                                                : styles.roasPoor
                                                        : ''
                                                        }`}>
                                                        {stats.spend > 0 && stats.conversion_purchases_value > 0
                                                            ? `${(stats.conversion_purchases_value / stats.spend).toFixed(2)}x`
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>{t('campaigns.noData')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.campaignFooter}>
                                        <span className={styles.campaignId}>ID: {campaign.id.substring(0, 8)}...</span>
                                        <ChevronRight size={20} className={styles.arrow} />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={styles.campaignsList}>
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <TrendingUp size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.totalCampaigns')}</div>
                        <div className={styles.statValue}>{campaigns.length}</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Activity size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.activeCampaigns')}</div>
                        <div className={styles.statValue}>
                            {activeCampaigns.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters for performance data - ALWAYS rendered to preserve state */}
            <div className={styles.controls}>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                {activeTab === 'top' ? (
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                ) : (
                    <FilterDropdown
                        filter={filter}
                        onFilterChange={setFilter}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />
                )}
                <Button
                    onClick={handleAskAI}
                    variant="secondary"
                    disabled={campaigns.length === 0 || loading}
                >
                    <Sparkles size={18} />
                    {t('reports.askAI')}
                </Button>
            </div>

            {renderContent()}

            <AIReportModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                output={aiOutput}
                loading={aiLoading}
                error={aiError}
            />
        </div>
    );
};

