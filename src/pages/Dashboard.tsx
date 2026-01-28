import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, Megaphone, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ClientPerformanceTable } from '../components/Dashboard/ClientPerformanceTable';
import { PerformanceInsights } from '../components/Dashboard/PerformanceInsights';
import { AIInsightsSummary } from '../components/Dashboard/AIInsightsSummary';
import { AyahOfTheDay } from '../components/Dashboard/AyahOfTheDay';
import type { DashboardData } from '../types/dashboard';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (forceRefresh: boolean = false) => {
        setLoading(true);
        setError(null);

        try {
            // Call Edge Function for dashboard data
            const { data, error } = await supabase.functions.invoke('dashboard-data', {
                body: { refresh: forceRefresh }
            });

            if (error) {
                throw new Error(error.message);
            }

            if (!data) {
                throw new Error('No data returned from server');
            }

            setDashboardData(data);
            setError(null);
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData(true); // Force refresh bypasses cache
        setRefreshing(false);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loading}>{t('dashboard.loading')}</div>
            </div>
        );
    }

    if (error && !dashboardData) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <Button onClick={handleRefresh}>
                        <RefreshCw size={16} style={{ marginInlineEnd: '0.5rem' }} />
                        {t('dashboard.retry')}
                    </Button>
                </div>
            </div>
        );
    }

    if (!dashboardData) return null;

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('dashboard.title')}</h1>
                    <p className={styles.subtitle}>{t('dashboard.subtitle')}</p>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outline"
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? styles.spinning : ''}
                        style={{ marginInlineEnd: '0.5rem' }}
                    />
                    {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
                </Button>
            </div>

            {/* Quick Stats */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.iconClients}`}>
                        <Users size={24} />
                    </div>
                    <div>
                        <div className={styles.statValue}>{dashboardData.quickStats.totalClients}</div>
                        <div className={styles.statLabel}>{t('dashboard.stats.totalClients')}</div>
                    </div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.iconCampaigns}`}>
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <div className={styles.statValue}>{dashboardData.quickStats.totalCampaigns}</div>
                        <div className={styles.statLabel}>{t('dashboard.stats.totalCampaigns')}</div>
                    </div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.iconSpend}`}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div className={styles.statValue}>{formatCurrency(dashboardData.quickStats.totalSpend)}</div>
                        <div className={styles.statLabel}>{t('dashboard.stats.totalSpend')}</div>
                    </div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.iconRevenue}`}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className={styles.statValue}>{formatCurrency(dashboardData.quickStats.totalRevenue)}</div>
                        <div className={styles.statLabel}>{t('dashboard.stats.totalRevenue')}</div>
                    </div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.iconRoas}`}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className={`${styles.statValue} ${styles.roasValue}`}>
                            {dashboardData.quickStats.averageRoas.toFixed(2)}
                        </div>
                        <div className={styles.statLabel}>{t('dashboard.stats.blendedRoas')}</div>
                    </div>
                </Card>
                <AyahOfTheDay />
            </div>

            {/* Client Performance Table - HERO */}
            <div className={styles.tableSection}>
                <h2 className={styles.sectionTitle}>{t('dashboard.clientPerformance.title')}</h2>
                <ClientPerformanceTable
                    clients={dashboardData.clients}
                    loading={loading}
                />
            </div>

            {/* Performance Insights */}
            <PerformanceInsights insights={dashboardData.insights} />

            {/* AI Summary */}
            {dashboardData.aiSummary && (
                <AIInsightsSummary summary={dashboardData.aiSummary} />
            )}
        </div>
    );
};


