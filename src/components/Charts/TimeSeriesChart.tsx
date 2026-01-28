import React from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeseriesDataPoint } from '../../types/metrics';
import styles from './TimeSeriesChart.module.css';

interface TimeSeriesChartProps {
    data: TimeseriesDataPoint[];
    granularity: 'DAY' | 'HOUR';
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, granularity }) => {
    const { t } = useTranslation();

    // Helper functions
    const formatTime = (dateString: string, gran: 'DAY' | 'HOUR'): string => {
        const date = new Date(dateString);
        if (gran === 'DAY') {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    // Transform data
    const chartData = data.map(point => ({
        time: formatTime(point.start_time, granularity),
        purchases: point.stats.conversion_purchases || 0,
        checkouts: point.stats.conversion_start_checkout || 0,
        spend: (point.stats.spend || 0) / 1000000,
        impressions: (point.stats.impressions || 0) / 1000
    }));

    if (chartData.length === 0) {
        return (
            <div className={styles.empty}>
                <p>{t('reports.charts.noData')}</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.glassTooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className={styles.tooltipItem} style={{ color: entry.stroke }}>
                            <span className={styles.tooltipName}>{entry.name}:</span>
                            <span className={styles.tooltipValue}>
                                {entry.dataKey === 'spend' ? `$${Number(entry.value).toFixed(2)}` : Number(entry.value).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCheckouts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="var(--color-text-secondary)"
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="var(--color-text-secondary)"
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area
                        type="monotone"
                        dataKey="purchases"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorPurchases)"
                        strokeWidth={2}
                        name={t('reports.purchases')}
                    />
                    <Area
                        type="monotone"
                        dataKey="checkouts"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorCheckouts)"
                        strokeWidth={2}
                        name={t('reports.checkoutsInitiated')}
                    />
                    <Area
                        type="monotone"
                        dataKey="spend"
                        stroke="#f59e0b"
                        fillOpacity={1}
                        fill="url(#colorSpend)"
                        strokeWidth={2}
                        name={t('reports.totalSpend')}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
