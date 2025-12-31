import React from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '../UI/Card';
import type { DashboardInsights } from '../../types/dashboard';
import styles from './PerformanceInsights.module.css';

interface PerformanceInsightsProps {
    insights: DashboardInsights;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({ insights }) => {
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
                    <h3 className={styles.title}>What's Working</h3>
                </div>
                <div className={styles.insightsList}>
                    {insights.whatsWorking.length === 0 ? (
                        <div className={styles.empty}>No standout performances yet</div>
                    ) : (
                        insights.whatsWorking.map((insight, index) => {
                            const Icon = getIcon(insight.type);
                            return (
                                <div key={index} className={styles.insight}>
                                    <Icon size={20} className={styles.insightIcon} />
                                    <div className={styles.insightContent}>
                                        <p className={styles.insightMessage}>{insight.message}</p>
                                        <div className={styles.insightMeta}>
                                            <span className={styles.client}>{insight.client}</span>
                                            {insight.campaign && (
                                                <>
                                                    <span className={styles.separator}>•</span>
                                                    <span className={styles.campaign}>{insight.campaign}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.metricBadge}>
                                        <span className={styles.metricValue}>{insight.value.toFixed(2)}</span>
                                        <span className={styles.metricLabel}>{insight.metric}</span>
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
                    <h3 className={styles.title}>Needs Attention</h3>
                </div>
                <div className={styles.insightsList}>
                    {insights.whatsNotWorking.length === 0 ? (
                        <div className={styles.empty}>All campaigns performing well!</div>
                    ) : (
                        insights.whatsNotWorking.map((insight, index) => (
                            <div key={index} className={`${styles.insight} ${styles.warning}`}>
                                <AlertTriangle size={20} className={styles.insightIcon} />
                                <div className={styles.insightContent}>
                                    <p className={styles.insightMessage}>{insight.message}</p>
                                    {insight.recommendation && (
                                        <p className={styles.recommendation}>
                                            💡 {insight.recommendation}
                                        </p>
                                    )}
                                    <div className={styles.insightMeta}>
                                        <span className={styles.client}>{insight.client}</span>
                                        {insight.campaign && (
                                            <>
                                                <span className={styles.separator}>•</span>
                                                <span className={styles.campaign}>{insight.campaign}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className={`${styles.metricBadge} ${styles.warningBadge}`}>
                                    <span className={styles.metricValue}>{insight.value.toFixed(2)}</span>
                                    <span className={styles.metricLabel}>{insight.metric}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};
