import React from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeseriesDataPoint } from '../../types/metrics';
import styles from './TimeSeriesChart.module.css';

interface TimeSeriesChartProps {
    data: TimeseriesDataPoint[];
    granularity: 'DAY' | 'HOUR';
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, granularity }) => {
    const { t } = useTranslation();

    // Define helper functions BEFORE using them
    const formatTime = (dateString: string, gran: 'DAY' | 'HOUR'): string => {
        const date = new Date(dateString);
        if (gran === 'DAY') {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (value: number) => `$${value.toFixed(0)}`;
    const formatNumber = (value: number) => value.toLocaleString();

    // Transform data for recharts
    const chartData = data.map(point => ({
        time: formatTime(point.start_time, granularity),
        purchases: point.stats.conversion_purchases || 0,
        checkouts: point.stats.conversion_start_checkout || 0,
        spend: (point.stats.spend || 0) / 1000000, // Convert microcurrency
        impressions: (point.stats.impressions || 0) / 1000 // Scale down for readability
    }));

    if (chartData.length === 0) {
        return (
            <div className={styles.empty}>
                <p>{t('reports.charts.noData')}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="time"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="purchases"
                        stroke="#10b981"
                        strokeWidth={2}
                        name={t('reports.purchases')}
                        dot={{ fill: '#10b981', r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="checkouts"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name={t('reports.checkoutsInitiated')}
                        dot={{ fill: '#3b82f6', r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="spend"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name={t('reports.totalSpend')}
                        dot={{ fill: '#f59e0b', r: 3 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
