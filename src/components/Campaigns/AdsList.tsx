import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Image, Film, CheckCircle, Award, Sparkles, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Card } from '../UI/Card';
import { Tabs, Tab } from '../UI/Tabs';
import { DateRangePicker } from '../UI/DateRangePicker';
import { DateRange } from '../../types/dateRange';
import { AIReportModal } from './AIReportModal';
import { Button } from '../UI/Button';
import { FilterDropdown, SortDropdown, SortMetric, FilterState } from '../UI/FilterDropdown';
import styles from './AdsList.module.css';

interface Ad {
    id: string;
    name: string;
    status?: string;
    review_status?: string;
    delivery_status?: string[];
    ad_squad_id?: string;
    [key: string]: any;
}

interface AdsListProps {
    adAccountId: string;
    adsquadId: string;
    onSelectAd?: (ad: Ad) => void;
}

export const AdsList: React.FC<AdsListProps> = ({ adAccountId, adsquadId, onSelectAd }) => {
    const { t, i18n } = useTranslation();
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'top' | 'paused'>('active');
    const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
    const [performanceStats, setPerformanceStats] = useState<Map<string, any>>(new Map());

    // Sorting and filtering state
    const [sortBy, setSortBy] = useState<SortMetric>('roas');
    const [filter, setFilter] = useState<FilterState | null>(null);

    // Media preview state - stores { link: string, isVideo: boolean }
    const [mediaPreviews, setMediaPreviews] = useState<Map<string, { link: string; isVideo: boolean }>>(new Map());
    const [mediaLoading, setMediaLoading] = useState(false);
    const isFetchingMediaRef = useRef(false);

    // AI Modal state
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiLoading, setAILoading] = useState(false);
    const [aiError, setAIError] = useState<string | null>(null);
    const [aiOutput, setAIOutput] = useState<string | null>(null);


    useEffect(() => {
        setMediaPreviews(new Map());
        isFetchingMediaRef.current = false;
        fetchAds();
        fetchPerformanceStats();
    }, [adsquadId, dateRange.start, dateRange.end]);

    // Fetch media previews when ads change
    useEffect(() => {
        if (ads.length > 0 && !isFetchingMediaRef.current) {
            fetchMediaPreviews(ads);
        }
    }, [ads]);

    const fetchAds = async () => {
        setLoading(true);
        setError(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            const response = await fetch(`${webhookUrl}/fetch-snap-ads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ad_account_id: adAccountId,
                    adsquad_id: adsquadId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch ads');
            }

            const data = await response.json();

            // Parse the actual API response structure
            const adsList: Ad[] = [];
            if (data && Array.isArray(data) && data[0]?.ads) {
                data[0].ads.forEach((item: any) => {
                    if (item.ad) {
                        adsList.push(item.ad);
                    }
                });
            }

            setAds(adsList);
        } catch (err) {
            console.error('Error fetching ads:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchMediaPreviews = async (adsList: Ad[]) => {
        if (adsList.length === 0 || isFetchingMediaRef.current) return;

        isFetchingMediaRef.current = true;
        setMediaLoading(true);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) return;

            // Fetch media for each ad
            const results = await Promise.all(adsList.map(async (ad) => {
                try {
                    const response = await fetch(`${webhookUrl}/tash-snap-media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ad_id: ad.id })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Response is an array with media objects
                        if (Array.isArray(data) && data.length > 0 && data[0].link) {
                            const link = data[0].link;
                            // Detect if it's an image based on URL pattern
                            const isVideo = !link.includes('image_preview');
                            return { id: ad.id, link, isVideo };
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching media for ad ${ad.id}:`, err);
                }
                return null;
            }));

            // Update state with results
            setMediaPreviews(prev => {
                const newMap = new Map(prev);
                results.forEach(result => {
                    if (result) {
                        newMap.set(result.id, { link: result.link, isVideo: result.isVideo });
                    }
                });
                return newMap;
            });
        } catch (err) {
            console.error('Error fetching media previews:', err);
        } finally {
            setMediaLoading(false);
            isFetchingMediaRef.current = false;
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
            params.push('breakdown=ad');
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

            // Parse stats by ad ID from breakdown_stats
            const statsMap = new Map<string, any>();
            if (data && Array.isArray(data) && data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.ad) {
                const ads = data[0].total_stats[0].total_stat.breakdown_stats.ad;
                ads.forEach((item: any) => {
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

    const getReviewBadgeColor = (reviewStatus?: string) => {
        switch (reviewStatus) {
            case 'APPROVED':
                return styles.approved;
            case 'PENDING_REVIEW':
                return styles.pending;
            case 'REJECTED':
                return styles.rejected;
            default:
                return '';
        }
    };

    const handleAskAI = async () => {
        setIsAIModalOpen(true);
        setAILoading(true);
        setAIError(null);
        setAIOutput(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) throw new Error('Backend webhook URL not configured');

            const adsData = ads.map(ad => ({
                id: ad.id,
                name: ad.name,
                status: ad.status,
                review_status: ad.review_status,
                stats: performanceStats.get(ad.id) || {
                    spend: 0,
                    impressions: 0,
                    conversion_purchases: 0,
                    conversion_purchases_value: 0
                }
            }));

            const payload = {
                type: 'ads',
                language: i18n.language,
                data: adsData,
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

    // Filter ads based on active tab
    const activeAds = ads.filter(a => a.status === 'ACTIVE');
    const pausedAds = ads.filter(a => a.status === 'PAUSED' || a.status !== 'ACTIVE');

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

    // Sort ads by selected metric
    const sortAds = (list: Ad[], metric: SortMetric, descending = true): Ad[] => {
        return [...list].sort((a, b) => {
            const aVal = getMetricValue(performanceStats.get(a.id), metric);
            const bVal = getMetricValue(performanceStats.get(b.id), metric);
            return descending ? bVal - aVal : aVal - bVal;
        });
    };

    // Apply filter to ads
    const applyFilter = (list: Ad[]): Ad[] => {
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

    // Calculate top performing ads (sorted by selected metric)
    const topPerformers = useMemo(() => {
        return sortAds(ads.filter(a => {
            const stats = performanceStats.get(a.id);
            return stats && stats.spend > 0;
        }), sortBy);
    }, [ads, performanceStats, sortBy]);

    const topPerformer = topPerformers[0] || null;

    // Get ads to display based on active tab
    let displayAds: Ad[] = [];
    if (activeTab === 'active') {
        displayAds = applyFilter(sortAds(activeAds, sortBy));
    } else if (activeTab === 'top') {
        displayAds = topPerformers;
    } else if (activeTab === 'paused') {
        displayAds = applyFilter(sortAds(pausedAds, sortBy));
    }

    // Create tabs
    const tabs: Tab[] = [
        {
            id: 'active',
            label: t('campaigns.adTabs.active'),
            count: activeAds.length
        },
        {
            id: 'top',
            label: t('campaigns.adTabs.topPerforming'),
            count: topPerformer ? 1 : 0
        },
        {
            id: 'paused',
            label: t('campaigns.adTabs.paused'),
            count: pausedAds.length
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

        if (ads.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <Film size={48} />
                    <p>{t('campaigns.noAds')}</p>
                </div>
            );
        }

        return (
            <>
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as typeof activeTab)} />

                {displayAds.length === 0 ? (
                    <div className={styles.emptyTabState}>
                        <Film size={48} />
                        <p>
                            {activeTab === 'active' && t('campaigns.noActiveAds')}
                            {activeTab === 'top' && t('campaigns.noTopAd')}
                            {activeTab === 'paused' && t('campaigns.noPausedAds')}
                        </p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {displayAds.map((ad) => {
                            const isTopPerformer = activeTab === 'top' && ad.id === topPerformer?.id;
                            const stats = performanceStats.get(ad.id);
                            const roas = isTopPerformer && stats && stats.spend > 0
                                ? stats.conversion_purchases_value / stats.spend
                                : null;

                            return (
                                <Card
                                    key={ad.id}
                                    className={`${styles.adCard} ${isTopPerformer ? styles.topPerformerCard : ''}`}
                                    hover={!!onSelectAd}
                                    onClick={() => onSelectAd && onSelectAd(ad)}
                                >
                                    {isTopPerformer && (
                                        <div className={styles.topPerformerBadge}>
                                            <Award size={16} />
                                            <span>{t('campaigns.topPerformer')}</span>
                                        </div>
                                    )}

                                    {/* Media Preview */}
                                    <div className={styles.mediaPreview}>
                                        {mediaLoading ? (
                                            <div className={styles.mediaSkeleton}>
                                                <div className={styles.skeletonPulse}></div>
                                            </div>
                                        ) : mediaPreviews.has(ad.id) ? (
                                            <div className={styles.mediaThumb}>
                                                {mediaPreviews.get(ad.id)!.isVideo ? (
                                                    <>
                                                        <video
                                                            key={`media-${ad.id}`}
                                                            src={mediaPreviews.get(ad.id)!.link}
                                                            muted
                                                            preload="metadata"
                                                            className={styles.previewVideo}
                                                        />
                                                        <div className={styles.playOverlay}>
                                                            <Play size={24} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <img
                                                        key={`media-${ad.id}`}
                                                        src={mediaPreviews.get(ad.id)!.link}
                                                        alt={ad.name}
                                                        className={styles.previewVideo}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className={styles.mediaPlaceholder}>
                                                <Film size={32} />
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.adHeader}>
                                        <div className={styles.adIcon}>
                                            <Image size={20} />
                                        </div>
                                        <h3 className={styles.adName}>{ad.name}</h3>
                                    </div>

                                    {
                                        isTopPerformer && roas && (
                                            <div className={styles.topPerformerReason}>
                                                <span className={styles.reasonLabel}>{t('campaigns.topPerformerReason')}:</span>
                                                <span className={styles.reasonValue}>
                                                    {t('campaigns.highestRoas')} ({roas.toFixed(2)}x)
                                                </span>
                                            </div>
                                        )
                                    }

                                    <div className={styles.badgeRow}>
                                        {ad.status && (
                                            <span
                                                className={`${styles.statusBadge} ${ad.status === 'ACTIVE' ? styles.active :
                                                    ad.status === 'PAUSED' ? styles.paused :
                                                        styles.inactive
                                                    }`}
                                            >
                                                {ad.status === 'PAUSED' ? 'PAUSED' : ad.status}
                                            </span>
                                        )}
                                        {ad.review_status && (
                                            <span className={`${styles.reviewBadge} ${getReviewBadgeColor(ad.review_status)}`}>
                                                {ad.review_status}
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.adDetails}>
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

                                    <div className={styles.adFooter}>
                                        <span className={styles.adId}>ID: {ad.id.substring(0, 8)}...</span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div >
                )}
            </>
        );
    };

    return (
        <div className={styles.adsList}>
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <Image size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.totalAds')}</div>
                        <div className={styles.statValue}>{ads.length}</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <CheckCircle size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.approved')}</div>
                        <div className={styles.statValue}>
                            {ads.filter(a => a.review_status === 'APPROVED').length}
                        </div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Film size={20} />
                    <div>
                        <div className={styles.statLabel}>{t('campaigns.activeAds')}</div>
                        <div className={styles.statValue}>
                            {ads.filter(a => a.status === 'ACTIVE').length}
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
                    disabled={ads.length === 0 || loading}
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
