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
import styles from './AdSquadsList.module.css';

interface AdSquad {
    id: string;
    name: string;
    status: string;
    campaign_id: string;
    targeting?: any;
    daily_budget_micro?: number;
    bid_micro?: number;
    optimization_goal?: string;
    delivery_status?: string[];
    [key: string]: any;
}

interface AdSquadsListProps {
    adAccountId: string;
    campaignId: string;
    onSelectAdSquad: (adsquad: AdSquad) => void;
}

export const AdSquadsList: React.FC<AdSquadsListProps> = ({
    adAccountId,
    campaignId,
    onSelectAdSquad
}) => {
    const { t, i18n } = useTranslation();
    const [adsquads, setAdSquads] = useState<AdSquad[]>([]);
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
        fetchAdSquads();
        fetchPerformanceStats();
    }, [campaignId, dateRange.start, dateRange.end]);

    const fetchAdSquads = async () => {
        setLoading(true);
        setError(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            const response = await fetch(`${webhookUrl}/fetch-snap-adsquads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ad_account_id: adAccountId,
                    campaign_id: campaignId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch ad squads');
            }

            const data = await response.json();

            // Parse the actual API response structure
            const adsquadsList: AdSquad[] = [];
            if (data && Array.isArray(data) && data[0]?.adsquads) {
                data[0].adsquads.forEach((item: any) => {
                    if (item.adsquad) {
                        adsquadsList.push(item.adsquad);
                    }
                });
            }

            setAdSquads(adsquadsList);
        } catch (err) {
            console.error('Error fetching ad squads:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformanceStats = async () => {
        try {
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
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const thirtyDaysAgo = new Date(yesterday);
                thirtyDaysAgo.setDate(yesterday.getDate() - 29); // 30 days total

                startDate = thirtyDaysAgo;
                endDate = yesterday;
            }

            const params: string[] = [];
            params.push('fields=spend,impressions,conversion_purchases,conversion_purchases_value');
            params.push('breakdown=adsquad');
            params.push(`start_time=${formatSnapchatDate(startDate, false)}`);
            params.push(`end_time=${formatSnapchatDate(endDate, true)}`);
            params.push('granularity=TOTAL');
            params.push('swipe_up_attribution_window=7_DAY');
            params.push('view_attribution_window=NONE');
            params.push('omit_empty=true');

            const queryString = params.join('&');

            // Call the new snap-insights edge function
            const { data, error: fnError } = await supabase.functions.invoke('snap-insights', {
                body: {
                    accountId: adAccountId,
                    queryString: queryString
                }
            });

            if (fnError) return;

            // Parse stats by ad squad ID from breakdown_stats
            const statsMap = new Map<string, any>();
            if (data && Array.isArray(data) && data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.adsquad) {
                const adsquads = data[0].total_stats[0].total_stat.breakdown_stats.adsquad;
                adsquads.forEach((item: any) => {
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

            const adsquadsData = adsquads.map(adsquad => ({
                id: adsquad.id,
                name: adsquad.name,
                status: adsquad.status,
                optimization_goal: adsquad.optimization_goal,
                stats: performanceStats.get(adsquad.id) || {
                    spend: 0,
                    impressions: 0,
                    conversion_purchases: 0,
                    conversion_purchases_value: 0
                }
            }));

            const payload = {
                type: 'adsquads',
                language: i18n.language,
                data: adsquadsData,
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

    // Filter ad squads based on active tab
    const activeAdSquads = adsquads.filter(a => a.status === 'ACTIVE');
    const pausedAdSquads = adsquads.filter(a => a.status === 'PAUSED' || a.status !== 'ACTIVE');

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

    // Sort ad squads by selected metric
    const sortAdSquads = (list: AdSquad[], metric: SortMetric, descending = true): AdSquad[] => {
        return [...list].sort((a, b) => {
            const aVal = getMetricValue(performanceStats.get(a.id), metric);
            const bVal = getMetricValue(performanceStats.get(b.id), metric);
            return descending ? bVal - aVal : aVal - bVal;
        });
    };

    // Apply filter to ad squads
    const applyFilter = (list: AdSquad[]): AdSquad[] => {
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

    // Calculate top performing ad squads (sorted by selected metric)
    const topPerformers = useMemo(() => {
        return sortAdSquads(adsquads.filter(a => {
            const stats = performanceStats.get(a.id);
            return stats && stats.spend > 0;
        }), sortBy);
    }, [adsquads, performanceStats, sortBy]);

    const topPerformer = topPerformers[0] || null;

    // Get ad squads to display based on active tab
    let displayAdSquads: AdSquad[] = [];
    if (activeTab === 'active') {
        displayAdSquads = applyFilter(sortAdSquads(activeAdSquads, sortBy));
    } else if (activeTab === 'top') {
        displayAdSquads = topPerformers;
    } else if (activeTab === 'paused') {
        displayAdSquads = applyFilter(sortAdSquads(pausedAdSquads, sortBy));
    }

    // Create tabs
    const tabs: Tab[] = [
        {
            id: 'active',
            label: t('campaigns.adSquadTabs.active'),
            count: activeAdSquads.length
        },
        {
            id: 'top',
            label: t('campaigns.adSquadTabs.topPerforming'),
            count: topPerformer ? 1 : 0
        },
        {
            id: 'paused',
            label: t('campaigns.adSquadTabs.paused'),
            count: pausedAdSquads.length
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

        if (adsquads.length === 0) {
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

                {displayAdSquads.length === 0 ? (
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
                        {displayAdSquads.map((adsquad) => {
                            const isTopPerformer = activeTab === 'top' && adsquad.id === topPerformer?.id;
                            const stats = performanceStats.get(adsquad.id);
                            const roas = isTopPerformer && stats && stats.spend > 0
                                ? stats.conversion_purchases_value / stats.spend
                                : null;

                            return (
                                <Card
                                    key={adsquad.id}
                                    className={`${styles.adsquadCard} ${isTopPerformer ? styles.topPerformerCard : ''}`}
                                    hover
                                    onClick={() => onSelectAdSquad(adsquad)}
                                >
                                    {isTopPerformer && (
                                        <div className={styles.topPerformerBadge}>
                                            <Award size={16} />
                                            <span>{t('campaigns.topPerformer')}</span>
                                        </div>
                                    )}

                                    <div className={styles.adsquadHeader}>
                                        <h3 className={styles.adsquadName}>{adsquad.name}</h3>
                                        <span
                                            className={`${styles.statusBadge} ${adsquad.status === 'ACTIVE' ? styles.active :
                                                adsquad.status === 'PAUSED' ? styles.paused :
                                                    styles.inactive
                                                }`}
                                        >
                                            {adsquad.status === 'PAUSED' ? 'PAUSED' : adsquad.status}
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

                                    <div className={styles.adsquadFooter}>
                                        <span className={styles.adsquadId}>ID: {adsquad.id.substring(0, 8)}...</span>
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
                        <div className={styles.statValue}>{adsquads.length}</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <DollarSign size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.activeAdSquads')}</div>
                        <div className={styles.statValue}>
                            {adsquads.filter(a => a.status === 'ACTIVE').length}
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
                    disabled={adsquads.length === 0 || loading}
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
