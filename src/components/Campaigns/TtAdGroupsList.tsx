import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Target, DollarSign, Award, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Card } from '../UI/Card';
import { Tabs, Tab } from '../UI/Tabs';
import { DateRangePicker } from '../UI/DateRangePicker';
import { DateRange } from '../../types/dateRange';
import { AIReportModal } from './AIReportModal';
import { Button } from '../UI/Button';
import { FilterDropdown, SortDropdown, SortMetric, FilterState } from '../UI/FilterDropdown';
import styles from './TtAdGroupsList.module.css';

interface AdGroup {
    id: string;
    name: string;
    status: string;
    campaign_id: string;
    targeting?: any;
    daily_budget_micro?: number;
    bid_micro?: number;
    optimization_goal?: string;
    [key: string]: any;
}

interface TtAdGroupsListProps {
    advertiserId: string;
    campaignId: string;
    onSelectAdGroup: (adgroup: AdGroup) => void;
}

export const TtAdGroupsList: React.FC<TtAdGroupsListProps> = ({
    advertiserId,
    campaignId,
    onSelectAdGroup
}) => {
    const { t, i18n } = useTranslation();
    const [adgroups, setAdGroups] = useState<AdGroup[]>([]);
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
        fetchAdGroups();
        fetchPerformanceStats();
    }, [campaignId, dateRange.start, dateRange.end]);

    const fetchAdGroups = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fnError } = await supabase.functions.invoke('tt-adgroups', {
                body: {
                    advertiser_id: advertiserId,
                    campaign_id: campaignId,
                },
            });

            if (fnError) throw fnError;

            // Parse the response (uses adsquad key for compatibility)
            const adgroupsList: AdGroup[] = [];
            if (data && Array.isArray(data) && data[0]?.adsquads) {
                data[0].adsquads.forEach((item: any) => {
                    if (item.adsquad) {
                        adgroupsList.push(item.adsquad);
                    }
                });
            }

            setAdGroups(adgroupsList);
        } catch (err) {
            console.error('Error fetching TikTok ad sets:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformanceStats = async () => {
        try {
            let startDate: string | undefined;
            let endDate: string | undefined;

            if (dateRange.start && dateRange.end) {
                startDate = dateRange.start.toISOString().split('T')[0];
                endDate = dateRange.end.toISOString().split('T')[0];
            }

            const { data, error: fnError } = await supabase.functions.invoke('tt-insights', {
                body: {
                    advertiser_id: advertiserId,
                    level: 'adgroup',
                    campaign_id: campaignId,
                    start_date: startDate,
                    end_date: endDate,
                },
            });

            if (fnError) return;

            const statsMap = new Map<string, any>();
            if (data && Array.isArray(data) && data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.adgroup) {
                const adgroups = data[0].total_stats[0].total_stat.breakdown_stats.adgroup;
                adgroups.forEach((item: any) => {
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

    const formatBid = (bidMicro?: number) => {
        if (!bidMicro) return null;
        const bid = bidMicro / 1000000;
        return bid >= 1 ? `$${bid.toFixed(0)}` : `$${bid.toFixed(2)}`;
    };

    const handleAskAI = async () => {
        setIsAIModalOpen(true);
        setAILoading(true);
        setAIError(null);
        setAIOutput(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) throw new Error('Backend webhook URL not configured');

            const adgroupsData = adgroups.map(adgroup => ({
                id: adgroup.id,
                name: adgroup.name,
                status: adgroup.status,
                optimization_goal: adgroup.optimization_goal,
                stats: performanceStats.get(adgroup.id) || {
                    spend: 0,
                    impressions: 0,
                    conversion_purchases: 0,
                    conversion_purchases_value: 0
                }
            }));

            const payload = {
                type: 'adgroups',
                language: i18n.language,
                platform: 'tiktok',
                data: adgroupsData,
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

            if (!response.ok) throw new Error('Failed to get AI analysis');

            const data = await response.json();

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

    // Filter ad sets based on active tab
    const activeAdGroups = adgroups.filter(a => a.status === 'ACTIVE' || a.status === 'ENABLE');
    const pausedAdGroups = adgroups.filter(a => a.status === 'PAUSED' || a.status === 'DISABLE' || (a.status !== 'ACTIVE' && a.status !== 'ENABLE'));

    // Helper function to get metric value
    const getMetricValue = (stats: any, metric: SortMetric): number => {
        if (!stats) return 0;
        switch (metric) {
            case 'roas':
                return stats.roas || (stats.spend > 0 ? stats.conversion_purchases_value / stats.spend : 0);
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

    // Sort ad sets by selected metric
    const sortAdGroups = (list: AdGroup[], metric: SortMetric, descending = true): AdGroup[] => {
        return [...list].sort((a, b) => {
            const aVal = getMetricValue(performanceStats.get(a.id), metric);
            const bVal = getMetricValue(performanceStats.get(b.id), metric);
            return descending ? bVal - aVal : aVal - bVal;
        });
    };

    // Apply filter to ad sets
    const applyFilter = (list: AdGroup[]): AdGroup[] => {
        if (!filter || filter.value === null) return list;
        return list.filter(a => {
            const val = getMetricValue(performanceStats.get(a.id), filter.metric);
            switch (filter.operator) {
                case 'gt': return val > filter.value!;
                case 'lt': return val < filter.value!;
                case 'eq': return val === filter.value!;
                default: return true;
            }
        });
    };

    // Calculate top performing ad sets (sorted by selected metric)
    const topPerformers = useMemo(() => {
        return sortAdGroups(adgroups.filter(a => {
            const stats = performanceStats.get(a.id);
            return stats && stats.spend > 0;
        }), sortBy);
    }, [adgroups, performanceStats, sortBy]);

    const topPerformer = topPerformers[0] || null;

    // Get ad sets to display based on active tab
    let displayAdGroups: AdGroup[] = [];
    if (activeTab === 'active') {
        displayAdGroups = applyFilter(sortAdGroups(activeAdGroups, sortBy));
    } else if (activeTab === 'top') {
        displayAdGroups = topPerformers;
    } else if (activeTab === 'paused') {
        displayAdGroups = applyFilter(sortAdGroups(pausedAdGroups, sortBy));
    }

    // Create tabs
    const tabs: Tab[] = [
        {
            id: 'active',
            label: t('campaigns.adSquadTabs.active'),
            count: activeAdGroups.length
        },
        {
            id: 'top',
            label: t('campaigns.adSquadTabs.topPerforming'),
            count: topPerformer ? 1 : 0
        },
        {
            id: 'paused',
            label: t('campaigns.adSquadTabs.paused'),
            count: pausedAdGroups.length
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

        if (adgroups.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <Target size={48} />
                    <p>{t('campaigns.noAdSquads')}</p>
                </div>
            );
        }

        return (
            <>
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as typeof activeTab)} />

                {displayAdGroups.length === 0 ? (
                    <div className={styles.emptyTabState}>
                        <Target size={48} />
                        <p>
                            {activeTab === 'active' && t('campaigns.noActiveAdSquads')}
                            {activeTab === 'top' && t('campaigns.noTopAdSquad')}
                            {activeTab === 'paused' && t('campaigns.noPausedAdSquads')}
                        </p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {displayAdGroups.map((adgroup) => {
                            const isTopPerformer = activeTab === 'top' && adgroup.id === topPerformer?.id;
                            const stats = performanceStats.get(adgroup.id);
                            const roas = isTopPerformer && stats && stats.spend > 0
                                ? (stats.roas || (stats.conversion_purchases_value / stats.spend))
                                : null;

                            return (
                                <Card
                                    key={adgroup.id}
                                    className={`${styles.adsquadCard} ${isTopPerformer ? styles.topPerformerCard : ''}`}
                                    hover
                                    onClick={() => onSelectAdGroup(adgroup)}
                                >
                                    {isTopPerformer && (
                                        <div className={styles.topPerformerBadge}>
                                            <Award size={16} />
                                            <span>{t('campaigns.topPerformer')}</span>
                                        </div>
                                    )}

                                    <div className={styles.adsquadHeader}>
                                        <h3 className={styles.adsquadName}>{adgroup.name}</h3>
                                        <span
                                            className={`${styles.statusBadge} ${(adgroup.status === 'ACTIVE' || adgroup.status === 'ENABLE') ? styles.active :
                                                (adgroup.status === 'PAUSED' || adgroup.status === 'DISABLE') ? styles.paused :
                                                    styles.inactive
                                                }`}
                                        >
                                            {adgroup.status === 'PAUSED' || adgroup.status === 'DISABLE' ? 'PAUSED' : 'ACTIVE'}
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

                                    <div className={styles.adsquadDetails}>
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
                                                    <span className={`${styles.detailValue} ${stats.spend > 0 && (stats.roas || stats.conversion_purchases_value > 0)
                                                        ? (stats.roas || (stats.conversion_purchases_value / stats.spend)) >= 2
                                                            ? styles.roasGood
                                                            : (stats.roas || (stats.conversion_purchases_value / stats.spend)) >= 1
                                                                ? styles.roasOk
                                                                : styles.roasPoor
                                                        : ''
                                                        }`}>
                                                        {stats.spend > 0 && (stats.roas || stats.conversion_purchases_value > 0)
                                                            ? `${(stats.roas || (stats.conversion_purchases_value / stats.spend)).toFixed(2)}x`
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

                                    <div className={styles.adsquadFooter}>
                                        <span className={styles.adsquadId}>ID: {adgroup.id.substring(0, 8)}...</span>
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
        <div className={styles.adsquadsList}>
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <Target size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.totalAdSquads')}</div>
                        <div className={styles.statValue}>{adgroups.length}</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <DollarSign size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.activeAdSquads')}</div>
                        <div className={styles.statValue}>
                            {activeAdGroups.length}
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
                    disabled={adgroups.length === 0 || loading}
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
