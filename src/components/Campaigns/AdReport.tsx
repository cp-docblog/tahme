import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, CreditCard, Target, Eye, Sparkles, Play, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { DateRangePicker } from '../UI/DateRangePicker';
import { GranularitySelector } from '../UI/GranularitySelector';
import { TimeSeriesChart } from '../Charts/TimeSeriesChart';
import { ConversionFunnel } from '../Charts/ConversionFunnel';
import { AIReportModal } from './AIReportModal';
import { DateRange } from '../../types/dateRange';
import { Granularity, AdReportStats, TimeseriesDataPoint, AdReportResponse } from '../../types/metrics';
import styles from './AdReport.module.css';

interface AdReportProps {
    adId: string;
    adName: string;
    adAccountId: string;
}

export const AdReport: React.FC<AdReportProps> = ({ adId, adName, adAccountId }) => {
    const { t, i18n } = useTranslation();

    // State
    const [granularity, setGranularity] = useState<Granularity>('TOTAL');
    const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
    const [stats, setStats] = useState<AdReportStats | null>(null);
    const [timeseriesData, setTimeseriesData] = useState<TimeseriesDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // AI Modal State
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiOutput, setAIOutput] = useState<string | null>(null);
    const [aiLoading, setAILoading] = useState(false);
    const [aiError, setAIError] = useState<string | null>(null);

    // Media Preview State - stores { link: string, isVideo: boolean }
    const [mediaPreview, setMediaPreview] = useState<{ link: string; isVideo: boolean } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mediaLoading, setMediaLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastFetchedAdIdRef = useRef<string | null>(null);

    // Fetch report data when dependencies change
    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adId, granularity, dateRange.start, dateRange.end]);

    // Fetch media preview only when adId changes - separate from report to avoid duplicate fetches
    useEffect(() => {
        // Skip if already fetched for this adId
        if (lastFetchedAdIdRef.current === adId) return;

        const abortController = new AbortController();
        fetchMediaPreview(abortController.signal);

        return () => abortController.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adId]);

    const fetchMediaPreview = async (signal?: AbortSignal) => {
        setMediaLoading(true);
        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) return;

            const response = await fetch(`${webhookUrl}/tash-snap-media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ad_id: adId }),
                signal
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0 && data[0].link) {
                    if (!signal?.aborted) {
                        const link = data[0].link;
                        // Detect if it's an image based on URL pattern
                        const isVideo = !link.includes('image_preview');
                        setMediaPreview({ link, isVideo });
                        lastFetchedAdIdRef.current = adId;
                    }
                }
            }
        } catch (err) {
            // Ignore abort errors - they're expected when dependencies change
            if (err instanceof Error && err.name === 'AbortError') return;
            console.error('Error fetching media preview:', err);
        } finally {
            if (!signal?.aborted) {
                setMediaLoading(false);
            }
        }
    };

    const handlePlayClick = () => {
        setIsPlaying(true);
        // Start playback after state update
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.play();
            }
        }, 100);
    };

    const handleAnalyzeMedia = async () => {
        setIsAIModalOpen(true);
        setAILoading(true);
        setAIError(null);
        setAIOutput(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            const response = await fetch(`${webhookUrl}/tash-snap-media-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: adId,
                    language: i18n.language
                })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze media');
            }

            const data = await response.json();

            // Response is an array with content.parts[0].text
            if (Array.isArray(data) && data.length > 0 && data[0]?.content?.parts?.[0]?.text) {
                setAIOutput(data[0].content.parts[0].text);
            } else {
                throw new Error('No analysis received');
            }
        } catch (err) {
            console.error('Error analyzing media:', err);
            setAIError(t('reports.aiError'));
        } finally {
            setAILoading(false);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            // Build request body
            const requestBody: any = {
                ad_account_id: adAccountId,
                ad_id: adId
            };

            // Build complete URL query string for Snapchat API
            const buildQueryString = (): string => {
                const params: string[] = [];

                // Always include fields
                const fields = [
                    'impressions',
                    'swipe_up_percent',
                    'spend',
                    'conversion_purchases',
                    'conversion_purchases_value',
                    'conversion_start_checkout',
                    'conversion_add_billing'
                ].join(',');
                params.push(`fields=${fields}`);

                // Format date for Snapchat: Asia/Riyadh timezone, ISO format
                const formatSnapchatDate = (date: Date, isEndDate: boolean = false, granularity: Granularity = 'TOTAL'): string => {
                    // Get date in Asia/Riyadh timezone (UTC+3)
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');

                    let isoString: string;

                    if (isEndDate) {
                        // Snapchat API requirement: end time MUST be at the beginning of an hour
                        // This applies to ALL granularities (TOTAL, DAY, HOUR)
                        // Solution: Add 1 day and use 00:00:00
                        const nextDay = new Date(date);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const nextYear = nextDay.getFullYear();
                        const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
                        const nextDayNum = String(nextDay.getDate()).padStart(2, '0');

                        isoString = `${nextYear}-${nextMonth}-${nextDayNum}T00:00:00+03:00`;
                    } else {
                        // Start times always use beginning of day
                        isoString = `${year}-${month}-${day}T00:00:00+03:00`;
                    }

                    // URL encode the + sign
                    return isoString.replace('+', '%2B');
                };

                // Handle start_time and end_time
                let startDate: Date;
                let endDate: Date;

                if (dateRange.start && dateRange.end) {
                    // User selected date range
                    startDate = dateRange.start;
                    endDate = dateRange.end;
                } else {
                    // Default: Last 30 days
                    const today = new Date();
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(today.getDate() - 30);

                    startDate = thirtyDaysAgo;
                    endDate = today;
                }

                // Validate and adjust for HOURLY granularity constraint (max 7 days)
                if (granularity === 'HOUR') {
                    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Important: Since we add +1 day to end_time, we need to limit to 6 days
                    // to ensure the final query span (after adding 1 day) doesn't exceed 7 days
                    if (daysDiff > 6) {
                        console.warn(`⚠️ HOURLY granularity limited to 7 days by Snapchat API. Truncating range from ${daysDiff} days to 6 days (7 days after end_time adjustment).`);
                        // Adjust start date to be 6 days before end date
                        startDate = new Date(endDate);
                        startDate.setDate(startDate.getDate() - 6);
                    }
                }

                const startTime = formatSnapchatDate(startDate, false, granularity);
                const endTime = formatSnapchatDate(endDate, true, granularity);

                params.push(`start_time=${startTime}`);
                params.push(`end_time=${endTime}`);

                // Granularity
                params.push(`granularity=${granularity}`);

                // Attribution windows - swipe_up (click) only
                params.push(`swipe_up_attribution_window=7_DAY`);
                params.push(`view_attribution_window=NONE`);

                // Omit empty (always true for cleaner data)
                params.push(`omit_empty=true`);

                return params.join('&');
            };

            // Add query string to request
            requestBody.query_string = buildQueryString();

            const response = await fetch(`${webhookUrl}/fetch-snap-ad-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch ad report');
            }

            const data: AdReportResponse[] = await response.json();

            // Parse the response based on granularity
            if (granularity === 'TOTAL') {
                if (data && Array.isArray(data) && data[0]?.total_stats?.[0]?.total_stat?.stats) {
                    setStats(data[0].total_stats[0].total_stat.stats);
                    setTimeseriesData([]);
                }
            } else {
                // DAY or HOUR granularity
                if (data && Array.isArray(data) && data[0]?.timeseries_stats?.[0]?.timeseries_stat?.timeseries) {
                    const timeseries = data[0].timeseries_stats[0].timeseries_stat.timeseries;
                    setTimeseriesData(timeseries);

                    // Calculate aggregate stats for metric cards
                    const aggregateStats = timeseries.reduce((acc, point) => {
                        return {
                            impressions: acc.impressions + (point.stats.impressions || 0),
                            swipe_up_percent: acc.swipe_up_percent + (point.stats.swipe_up_percent || 0),
                            spend: acc.spend + (point.stats.spend || 0),
                            conversion_purchases: acc.conversion_purchases + (point.stats.conversion_purchases || 0),
                            conversion_purchases_value: acc.conversion_purchases_value + (point.stats.conversion_purchases_value || 0),
                            conversion_start_checkout: acc.conversion_start_checkout + (point.stats.conversion_start_checkout || 0),
                            conversion_add_billing: acc.conversion_add_billing + (point.stats.conversion_add_billing || 0)
                        };
                    }, {
                        impressions: 0,
                        swipe_up_percent: 0,
                        spend: 0,
                        conversion_purchases: 0,
                        conversion_purchases_value: 0,
                        conversion_start_checkout: 0,
                        conversion_add_billing: 0
                    });

                    // Average swipe_up_percent
                    aggregateStats.swipe_up_percent = aggregateStats.swipe_up_percent / timeseries.length;

                    setStats(aggregateStats);
                }
            }
        } catch (err) {
            console.error('Error fetching ad report:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (microAmount: number) => {
        return `$${(microAmount / 1000000).toFixed(2)}`;
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString();
    };

    const formatPercentage = (decimal: number) => {
        return `${(decimal * 100).toFixed(2)}%`;
    };

    const calculateROAS = () => {
        if (!stats || !stats.spend || stats.spend === 0 || !stats.conversion_purchases_value) return 0;
        return stats.conversion_purchases_value / stats.spend;
    };

    const calculateCPP = () => {
        if (!stats || !stats.spend || !stats.conversion_purchases || stats.conversion_purchases === 0) return 0;
        return stats.spend / stats.conversion_purchases;
    };

    const calculateCPM = () => {
        if (!stats || !stats.impressions || stats.impressions === 0 || !stats.spend) return 0;
        return (stats.spend / stats.impressions) * 1000;
    };

    const calculateCTR = () => {
        if (!stats || !stats.swipe_up_percent) return 0;
        return stats.swipe_up_percent;
    };

    const handleAskAI = async () => {
        if (!stats) return;

        setIsAIModalOpen(true);
        setAILoading(true);
        setAIError(null);
        setAIOutput(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            // Prepare ad data for AI analysis
            const adData = {
                ad_id: adId,
                ad_name: adName,
                ad_account_id: adAccountId,
                language: i18n.language, // Send user's chosen language (ar or en)
                stats: {
                    impressions: stats.impressions || 0,
                    spend: stats.spend || 0,
                    swipe_up_percent: stats.swipe_up_percent || 0,
                    conversion_purchases: stats.conversion_purchases || 0,
                    conversion_purchases_value: stats.conversion_purchases_value || 0,
                    conversion_start_checkout: stats.conversion_start_checkout || 0,
                    conversion_add_billing: stats.conversion_add_billing || 0,
                    roas: calculateROAS(),
                    cpp: calculateCPP(),
                    cpm: calculateCPM(),
                    ctr: calculateCTR()
                },
                date_range: {
                    start: dateRange.start?.toISOString() || null,
                    end: dateRange.end?.toISOString() || null
                },
                granularity
            };

            const response = await fetch(`${webhookUrl}/tash-ai-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adData),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI analysis');
            }

            const data = await response.json();

            // Backend returns an array: [{ "output": "the output"}]
            if (Array.isArray(data) && data.length > 0 && data[0].output) {
                setAIOutput(data[0].output);
            } else if (data.output) {
                // Fallback for non-array response
                setAIOutput(data.output);
            } else {
                throw new Error('No output received from AI');
            }
        } catch (err) {
            console.error('Error getting AI analysis:', err);
            setAIError(t('reports.aiError'));
        } finally {
            setAILoading(false);
        }
    };


    const roas = calculateROAS();
    const cpp = calculateCPP();
    const cpm = calculateCPM();
    const ctr = calculateCTR();

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

        if (error || !stats) {
            return (
                <div className={styles.errorState}>
                    <p>{error || t('reports.noData')}</p>
                </div>
            );
        }

        return (
            <>
                {/* Key Metrics Cards */}
                <div className={styles.metricsGrid}>
                    <Card className={styles.metricCard}>
                        <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <ShoppingCart size={24} style={{ color: 'var(--color-success)' }} />
                        </div>
                        <div className={styles.metricContent}>
                            <div className={styles.metricLabel}>{t('reports.purchases')}</div>
                            <div className={styles.metricValue}>{formatNumber(stats.conversion_purchases || 0)}</div>
                            <div className={styles.metricSubtext}>
                                {formatCurrency(stats.conversion_purchases_value || 0)}
                            </div>
                        </div>
                    </Card>

                    <Card className={styles.metricCard}>
                        <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(0, 195, 251, 0.1)' }}>
                            <TrendingUp size={24} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <div className={styles.metricContent}>
                            <div className={styles.metricLabel}>{t('reports.roas')}</div>
                            <div className={styles.metricValue}>{roas.toFixed(2)}x</div>
                            <div className={styles.metricSubtext}>{t('reports.returnOnAdSpend')}</div>
                        </div>
                    </Card>

                    <Card className={styles.metricCard}>
                        <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                            <DollarSign size={24} style={{ color: 'var(--color-warning)' }} />
                        </div>
                        <div className={styles.metricContent}>
                            <div className={styles.metricLabel}>{t('reports.costPerPurchase')}</div>
                            <div className={styles.metricValue}>{formatCurrency(cpp)}</div>
                            <div className={styles.metricSubtext}>{t('reports.averageCPP')}</div>
                        </div>
                    </Card>

                    <Card className={styles.metricCard}>
                        <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                            <Eye size={24} style={{ color: '#8b5cf6' }} />
                        </div>
                        <div className={styles.metricContent}>
                            <div className={styles.metricLabel}>{t('reports.impressions')}</div>
                            <div className={styles.metricValue}>{formatNumber(stats.impressions || 0)}</div>
                            <div className={styles.metricSubtext}>
                                {t('reports.ctr')}: {formatPercentage(ctr)}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Media Preview Section */}
                <Card className={styles.mediaSection}>
                    <h3 className={styles.sectionTitle}>{t('campaigns.mediaPreview')}</h3>
                    <div className={styles.mediaContainer}>
                        {mediaLoading ? (
                            <div className={styles.mediaSkeleton}>
                                <div className={styles.skeletonPulse}></div>
                            </div>
                        ) : mediaPreview ? (
                            mediaPreview.isVideo ? (
                                <div
                                    className={`${styles.mediaPlayer} ${isPlaying ? styles.playing : ''}`}
                                    onClick={!isPlaying ? handlePlayClick : undefined}
                                >
                                    <video
                                        ref={videoRef}
                                        src={mediaPreview.link}
                                        controls={isPlaying}
                                        muted={!isPlaying}
                                        preload="metadata"
                                        className={styles.videoElement}
                                    />
                                    {!isPlaying && (
                                        <div className={styles.playOverlay}>
                                            <div className={styles.playButton}>
                                                <Play size={48} />
                                            </div>
                                            <span className={styles.clickToPlay}>{t('campaigns.clickToPlay')}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.mediaPlayer}>
                                    <img
                                        src={mediaPreview.link}
                                        alt={adName}
                                        className={styles.videoElement}
                                    />
                                </div>
                            )
                        ) : (
                            <div className={styles.mediaPlaceholder}>
                                <Eye size={48} />
                                <span>{t('reports.noData')}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Time Series Chart - Only show for DAY/HOUR */}
                {granularity !== 'TOTAL' && timeseriesData.length > 0 && (
                    <Card className={styles.section}>
                        <h3 className={styles.sectionTitle}>{t('reports.charts.trend')}</h3>
                        <TimeSeriesChart data={timeseriesData} granularity={granularity} />
                    </Card>
                )}

                {/* Conversion Funnel - Enhanced */}
                <Card className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('reports.conversionFunnel')}</h3>
                    <ConversionFunnel
                        impressions={stats.impressions || 0}
                        checkouts={stats.conversion_start_checkout || 0}
                        billingAdded={stats.conversion_add_billing || 0}
                        purchases={stats.conversion_purchases || 0}
                    />
                </Card>

                {/* Detailed Metrics Table */}
                <Card className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('reports.detailedMetrics')}</h3>
                    <div className={styles.metricsTable}>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.totalSpend')}</div>
                            <div className={styles.tableValue}>{formatCurrency(stats.spend || 0)}</div>
                        </div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.impressions')}</div>
                            <div className={styles.tableValue}>{formatNumber(stats.impressions || 0)}</div>
                        </div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.cpm')}</div>
                            <div className={styles.tableValue}>{formatCurrency(cpm)}</div>
                        </div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.ctr')}</div>
                            <div className={styles.tableValue}>{formatPercentage(ctr)}</div>
                        </div>
                        <div className={styles.tableDivider}></div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.checkoutsInitiated')}</div>
                            <div className={styles.tableValue}>{formatNumber(stats.conversion_start_checkout || 0)}</div>
                        </div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.paymentInfoAdded')}</div>
                            <div className={styles.tableValue}>{formatNumber(stats.conversion_add_billing || 0)}</div>
                        </div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.purchases')}</div>
                            <div className={styles.tableValue}>{formatNumber(stats.conversion_purchases || 0)}</div>
                        </div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.purchaseValue')}</div>
                            <div className={styles.tableValue}>{formatCurrency(stats.conversion_purchases_value || 0)}</div>
                        </div>
                        <div className={styles.tableDivider}></div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.costPerPurchase')}</div>
                            <div className={styles.tableValue}>{formatCurrency(cpp)}</div>
                        </div>
                        <div className={styles.tableRow}>
                            <div className={styles.tableLabel}>{t('reports.roas')}</div>
                            <div className={styles.tableValue}>{roas.toFixed(2)}x</div>
                        </div>
                    </div>
                </Card>
            </>
        );
    };

    return (
        <div className={styles.adReport}>
            <div className={styles.reportHeader}>
                <div>
                    <h2 className={styles.adName}>{adName}</h2>
                    <p className={styles.adId}>Ad ID: {adId}</p>
                </div>

                {/* Controls Row - ALWAYS rendered to preserve DateRangePicker state */}
                <div className={styles.controls}>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                    <GranularitySelector value={granularity} onChange={setGranularity} />
                    <Button
                        variant="primary"
                        onClick={handleAskAI}
                        disabled={!stats || loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Sparkles size={18} />
                        {t('reports.askAI')}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleAnalyzeMedia}
                        disabled={!mediaPreview || loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Film size={18} />
                        {t('reports.analyzeMedia')}
                    </Button>
                </div>
            </div>

            {renderContent()}

            {/* AI Report Modal */}
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
