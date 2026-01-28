import { CheckCircle2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI/Card';
import type { DashboardInsights } from '../../types/dashboard';
import styles from './PerformanceInsights.module.css';

interface PerformanceInsightsProps {
    insights: DashboardInsights;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({ insights }) => {
    const { t } = useTranslation();
    const getIcon = (type: string) => {
        switch (type) {
            case 'high_performer':
                return TrendingUp;
            case 'scale_opportunity':
                return DollarSign;
            default:
                return CheckCircle2;
        }
    };

    return (
        <div className={styles.container}>
            {/* What's Working */}
            <Card className={styles.card}>
                <div className={styles.header}>
                    <CheckCircle2 size={24} className={styles.successIcon} />
                    <h3 className={styles.title}>{t('dashboard.performanceInsights.whatsWorking')}</h3>
                </div>
                <div className={styles.insightsList}>
                    {insights.whatsWorking.length === 0 ? (
                        <div className={styles.empty}>{t('dashboard.performanceInsights.emptyWorking')}</div>
                    ) : (
                        insights.whatsWorking.map((insight, index) => {
                            const Icon = getIcon(insight.type);
                            return (
                                <div key={index} className={styles.insight}>
                                    <Icon size={20} className={styles.insightIcon} />
                                    <div className={styles.insightContent}>
                                        <p className={styles.insightMessage}>
                                            {t(`dashboard.performanceInsights.messages.${insight.type}`, {
                                                client: insight.client,
                                                channel: insight.campaign ? t(`campaigns.platforms.${insight.campaign.toLowerCase()}`) : '',
                                                roas: insight.value.toFixed(2)
                                            })}
                                        </p>
                                    </div>
                                    <div className={styles.metricBadge}>
                                        <span className={styles.metricValue}>{insight.value.toFixed(2)}</span>
                                        <span className={styles.metricLabel}>{t(`sorting.${insight.metric.toLowerCase()}`) || insight.metric}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* What's Not Working */}
            <Card className={styles.card}>
                <div className={styles.header}>
                    <AlertTriangle size={24} className={styles.warningIcon} />
                    <h3 className={styles.title}>{t('dashboard.performanceInsights.needsAttention')}</h3>
                </div>
                <div className={styles.insightsList}>
                    {insights.whatsNotWorking.length === 0 ? (
                        <div className={styles.empty}>{t('dashboard.performanceInsights.emptyNeedsAttention')}</div>
                    ) : (
                        insights.whatsNotWorking.map((insight, index) => (
                            <div key={index} className={`${styles.insight} ${styles.warning}`}>
                                <AlertTriangle size={20} className={styles.insightIcon} />
                                <div className={styles.insightContent}>
                                    <p className={styles.insightMessage}>
                                        {t(`dashboard.performanceInsights.messages.${insight.type}`, {
                                            client: insight.client,
                                            channel: insight.campaign ? t(`campaigns.platforms.${insight.campaign.toLowerCase()}`) : '',
                                            roas: insight.value.toFixed(2)
                                        })}
                                    </p>
                                    {insight.recommendation && (
                                        <p className={styles.recommendation}>
                                            💡 {insight.recommendation}
                                        </p>
                                    )}
                                </div>
                                <div className={`${styles.metricBadge} ${styles.warningBadge}`}>
                                    <span className={styles.metricValue}>{insight.value.toFixed(2)}</span>
                                    <span className={styles.metricLabel}>{t(`sorting.${insight.metric.toLowerCase()}`) || insight.metric}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};
