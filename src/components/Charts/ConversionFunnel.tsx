import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown } from 'lucide-react';
import styles from './ConversionFunnel.module.css';

interface ConversionFunnelProps {
    impressions: number;
    checkouts: number;
    billingAdded: number;
    purchases: number;
}

interface FunnelStage {
    label: string;
    value: number;
    percentage: number;
    conversionRate?: number;
    color: string;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
    impressions,
    checkouts,
    billingAdded,
    purchases
}) => {
    const { t } = useTranslation();

    const calculateConversionRate = (current: number, impressions: number): number => {
        if (impressions === 0) return 0;
        return (current / impressions) * 100;
    };

    const getColor = (rate: number): string => {
        if (rate >= 5) return '#10b981'; // green - 5%+ is good
        if (rate >= 1) return '#f59e0b'; // yellow - 1-5% is medium
        return '#ef4444'; // red - <1% needs attention
    };

    const stages: FunnelStage[] = [
        {
            label: t('reports.impressions'),
            value: impressions,
            percentage: 100,
            color: '#3b82f6'
        },
        {
            label: t('reports.checkoutsInitiated'),
            value: checkouts,
            percentage: (checkouts / impressions) * 100,
            conversionRate: calculateConversionRate(checkouts, impressions),
            color: getColor(calculateConversionRate(checkouts, impressions))
        },
        {
            label: t('reports.paymentInfoAdded'),
            value: billingAdded,
            percentage: (billingAdded / impressions) * 100,
            conversionRate: calculateConversionRate(billingAdded, impressions),
            color: getColor(calculateConversionRate(billingAdded, impressions))
        },
        {
            label: t('reports.purchases'),
            value: purchases,
            percentage: (purchases / impressions) * 100,
            conversionRate: calculateConversionRate(purchases, impressions),
            color: getColor(calculateConversionRate(purchases, impressions))
        }
    ];

    return (
        <div className={styles.container}>
            {stages.map((stage, index) => (
                <div key={stage.label} className={styles.stageWrapper}>
                    <div className={styles.stage}>
                        <div
                            className={styles.bar}
                            style={{
                                width: `${Math.max(stage.percentage, 5)}%`,
                                backgroundColor: stage.color
                            }}
                        >
                            <span className={styles.label}>{stage.label}</span>
                            <span className={styles.value}>{stage.value.toLocaleString()}</span>
                        </div>
                    </div>

                    {stage.conversionRate !== undefined && (
                        <div className={styles.conversion}>
                            <TrendingDown size={14} />
                            <span>{stage.conversionRate.toFixed(1)}%</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
