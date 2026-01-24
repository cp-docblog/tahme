import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Eye, Sparkles, Play, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { DateRangePicker } from '../UI/DateRangePicker';
import { GranularitySelector } from '../UI/GranularitySelector';
import { TimeSeriesChart } from '../Charts/TimeSeriesChart';
import { ConversionFunnel } from '../Charts/ConversionFunnel';
import { AIReportModal } from './AIReportModal';
import { DateRange } from '../../types/dateRange';
import { Granularity, AdReportStats, TimeseriesDataPoint } from '../../types/metrics';
import styles from './FbAdReport.module.css';

interface FbAdReportProps {
    adId: string;
    adName: string;
    adAccountId: string;
    accessToken: string;
}

export const FbAdReport: React.FC<FbAdReportProps> = ({ adId, adName, adAccountId, accessToken }) => {
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

    // Media Preview State - store thumbnail for preview, videoLink for playback
    const [mediaPreview, setMediaPreview] = useState<{ thumbnail: string; videoLink: string | null; isVideo: boolean } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mediaLoading, setMediaLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastFetchedAdIdRef = useRef<string | null>(null);

    // Fetch report data when dependencies change
    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adId, granularity, dateRange.start, dateRange.end, accessToken]);

    // Fetch media preview only when adId changes
    useEffect(() => {
        if (lastFetchedAdIdRef.current === adId) return;

        const abortController = new AbortController();
        fetchMediaPreview();

        return () => abortController.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adId, accessToken]);

    const fetchMediaPreview = async () => {
        setMediaLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('fb-media', {
                body: {
                    ad_id: adId,
                    access_token: accessToken,
                },
            });

            console.log('fb-media response:', { data, error });

            if (!error && data && Array.isArray(data) && data.length > 0) {
                const mediaData = data[0];
                console.log('Media data:', mediaData);

                // Check if link is actually a video URL (not a JPEG/PNG thumbnail)
                const isPlayableVideo = mediaData.is_video &&
                    mediaData.link &&
                    !mediaData.link.includes('.jpg') &&
                    !mediaData.link.includes('.jpeg') &&
                    !mediaData.link.includes('.png');

                // For playable videos: use thumbnail_url for display, link for playback
                // For images: use link (high-res) for display
                const displayImage = isPlayableVideo
                    ? (mediaData.thumbnail_url || mediaData.link)
                    : (mediaData.link || mediaData.thumbnail_url);

                if (displayImage) {
                    setMediaPreview({
                        thumbnail: displayImage,
                        videoLink: isPlayableVideo ? mediaData.link : null,
                        isVideo: mediaData.is_video || false,
                    });
                    lastFetchedAdIdRef.current = adId;
                }
            }
        } catch (err) {
            console.error('Error fetching media preview:', err);
        } finally {
            setMediaLoading(false);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError(null);

        try {
            // Build date range
            let startDate: string | undefined;
            let endDate: string | undefined;

            if (dateRange.start && dateRange.end) {
                let effectiveStart = dateRange.start;
                let effectiveEnd = dateRange.end;

                // Limit HOUR granularity to 7 days max (168 data points)
                if (granularity === 'HOUR') {
                    const daysDiff = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysDiff > 7) {
                        console.warn(`⚠️ HOUR granularity limited to 7 days. Truncating from ${daysDiff} days.`);
                        // Adjust start date to be 7 days before end date
                        effectiveStart = new Date(effectiveEnd);
                        effectiveStart.setDate(effectiveStart.getDate() - 7);
                    }
                }

                startDate = effectiveStart.toISOString().split('T')[0];
                endDate = effectiveEnd.toISOString().split('T')[0];
            }

            const { data, error: fnError } = await supabase.functions.invoke('fb-insights', {
                body: {
                    ad_account_id: adAccountId,
                    access_token: accessToken,
                    level: 'ad',
                    start_date: startDate,
                    end_date: endDate,
                    granularity: granularity,
                },
            });

            if (fnError) throw fnError;

            // Parse the response based on granularity
            if (granularity === 'TOTAL') {
                // TOTAL: Use breakdown_stats format
                if (data && Array.isArray(data) && data[0]?.total_stats?.[0]?.total_stat?.breakdown_stats?.ad) {
                    const adStats = data[0].total_stats[0].total_stat.breakdown_stats.ad;
                    const thisAdStats = adStats.find((item: any) => item.id === adId);

                    if (thisAdStats?.stats) {
                        setStats(thisAdStats.stats);
                    } else {
                        // If no specific ad stats, use first available
                        setStats(adStats[0]?.stats || null);
                    }
                    setTimeseriesData([]);
                }
            } else {
                // DAY or HOUR: Use timeseries_stats format
                if (data && Array.isArray(data) && data[0]?.timeseries_stats?.[0]?.timeseries_stat?.timeseries) {
                    const timeseries = data[0].timeseries_stats[0].timeseries_stat.timeseries;
                    setTimeseriesData(timeseries);

                    // Calculate aggregate stats for metric cards
                    const aggregateStats = timeseries.reduce((acc: any, point: any) => {
                        return {
                            impressions: acc.impressions + (point.stats.impressions || 0),
                            clicks: acc.clicks + (point.stats.clicks || 0),
                            spend: acc.spend + (point.stats.spend || 0),
                            reach: acc.reach + (point.stats.reach || 0),
                            conversion_purchases: acc.conversion_purchases + (point.stats.conversion_purchases || 0),
                            conversion_purchases_value: acc.conversion_purchases_value + (point.stats.conversion_purchases_value || 0),
                        };
                    }, {
                        impressions: 0,
                        clicks: 0,
                        spend: 0,
                        reach: 0,
                        conversion_purchases: 0,
                        conversion_purchases_value: 0,
                    });

                    setStats(aggregateStats);
                } else {
                    setStats(null);
                    setTimeseriesData([]);
                }
            }
        } catch (err) {
            console.error('Error fetching Facebook ad report:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handlePlayClick = () => {
        setIsPlaying(true);
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.play();
            }
        }, 100);
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
        const clicks = (stats as any)?.clicks || 0;
        if (!stats || !stats.impressions || stats.impressions === 0 || !clicks) return 0;
        return clicks / stats.impressions;
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

            const adData = {
                ad_id: adId,
                ad_name: adName,
                ad_account_id: adAccountId,
                platform: 'facebook',
                language: i18n.language,
                stats: {
                    impressions: stats.impressions || 0,
                    spend: stats.spend || 0,
                    clicks: (stats as any).clicks || 0,
                    conversion_purchases: stats.conversion_purchases || 0,
                    conversion_purchases_value: stats.conversion_purchases_value || 0,
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

            if (Array.isArray(data) && data.length > 0 && data[0].output) {
                setAIOutput(data[0].output);
            } else if (data.output) {
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

    const handleAnalyzeMedia = async () => {
        if (!mediaPreview) return;

        setIsAIModalOpen(true);
        setAILoading(true);
        setAIError(null);
        setAIOutput(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            // Get the media URL - prefer video link for videos, otherwise use thumbnail
            const mediaUrl = mediaPreview.videoLink || mediaPreview.thumbnail;

            const response = await fetch(`${webhookUrl}/tash-snap-media-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_id: adId,
                    platform: 'facebook',
                    media_url: mediaUrl,
                    is_video: mediaPreview.isVideo,
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
            } else if (data.output) {
                setAIOutput(data.output);
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

    const roas = calculateROAS();
    const cpp = calculateCPP();
    const cpm = calculateCPM();
    const ctr = calculateCTR();

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

                {/* Time Series Chart - show for DAY/HOUR granularity */}
                {granularity !== 'TOTAL' && timeseriesData.length > 0 && (
                    <Card className={styles.section}>
                        <h3 className={styles.sectionTitle}>{t('reports.charts.trend')}</h3>
                        <TimeSeriesChart data={timeseriesData} granularity={granularity} />
                    </Card>
                )}

                {/* Media Preview Section */}
                <Card className={styles.mediaSection}>
                    <h3 className={styles.sectionTitle}>{t('campaigns.mediaPreview')}</h3>
                    <div className={styles.mediaContainer}>
                        {mediaLoading ? (
                            <div className={styles.mediaSkeleton}>
                                <div className={styles.skeletonPulse}></div>
                            </div>
                        ) : mediaPreview ? (
                            mediaPreview.isVideo && mediaPreview.videoLink ? (
                                // Playable video - show play button and video player
                                <div
                                    className={`${styles.mediaPlayer} ${isPlaying ? styles.playing : ''}`}
                                    onClick={!isPlaying ? handlePlayClick : undefined}
                                >
                                    {isPlaying ? (
                                        <video
                                            ref={videoRef}
                                            src={mediaPreview.videoLink}
                                            controls
                                            autoPlay
                                            className={styles.videoElement}
                                            onError={() => setIsPlaying(false)}
                                        />
                                    ) : (
                                        <>
                                            <img
                                                src={mediaPreview.thumbnail}
                                                alt={adName}
                                                className={styles.videoElement}
                                            />
                                            <div className={styles.playOverlay}>
                                                <div className={styles.playButton}>
                                                    <Play size={48} />
                                                </div>
                                                <span className={styles.clickToPlay}>{t('campaigns.clickToPlay')}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // Image or video without playable source - show as image
                                <div className={styles.mediaPlayer}>
                                    <img
                                        src={mediaPreview.thumbnail}
                                        alt={adName}
                                        className={styles.videoElement}
                                    />
                                    {mediaPreview.isVideo && (
                                        <div className={styles.videoLabel}>
                                            <Film size={16} />
                                            <span>{t('campaigns.videoPreview')}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className={styles.mediaPlaceholder}>
                                <Film size={48} />
                                <span>{t('reports.noData')}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Conversion Funnel */}
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
                            <div className={styles.tableLabel}>{t('reports.clicks')}</div>
                            <div className={styles.tableValue}>{formatNumber((stats as any).clicks || 0)}</div>
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
