import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { ClientPerformanceTable } from '../components/Dashboard/ClientPerformanceTable';
import { PerformanceInsights } from '../components/Dashboard/PerformanceInsights';
import { AIInsightsSummary } from '../components/Dashboard/AIInsightsSummary';
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
                <div className={styles.loading}>Loading dashboard data from Snap, TikTok, Facebook...</div>
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
                        Retry
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
                    <p className={styles.subtitle}>Campaign Performance Overview - Lifetime</p>
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
                    {refreshing ? 'جاري التحديث...' : 'تحديث'}
                </Button>
            </div>

            {/* Quick Stats */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statLabel}>Total Clients</div>
                    <div className={styles.statValue}>{dashboardData.quickStats.totalClients}</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statLabel}>Active Campaigns</div>
                    <div className={styles.statValue}>{dashboardData.quickStats.totalCampaigns}</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statLabel}>Total Spend</div>
                    <div className={styles.statValue}>{formatCurrency(dashboardData.quickStats.totalSpend)}</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statLabel}>Total Revenue</div>
                    <div className={styles.statValue}>{formatCurrency(dashboardData.quickStats.totalRevenue)}</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statLabel}>Blended ROAS</div>
                    <div className={`${styles.statValue} ${styles.roasValue}`}>
                        {dashboardData.quickStats.averageRoas.toFixed(2)}
                    </div>
                </Card>
            </div>

            {/* Client Performance Table - HERO */}
            <div className={styles.tableSection}>
                <h2 className={styles.sectionTitle}>Client Performance</h2>
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


