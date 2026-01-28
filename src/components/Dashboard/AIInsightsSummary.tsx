import { Sparkles, TrendingUp, AlertCircle, Lightbulb, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '../UI/Skeleton';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI/Card';
import type { AISummary } from '../../types/dashboard';
import styles from './AIInsightsSummary.module.css';

interface AIInsightsSummaryProps {
    summary: AISummary;
    loading?: boolean;
}

export const AIInsightsSummary: React.FC<AIInsightsSummaryProps> = ({ summary, loading }) => {
    const { t } = useTranslation();
    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'positive':
                return TrendingUp;
            case 'negative':
                return AlertCircle;
            default:
                return Lightbulb;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return styles.priorityHigh;
            case 'medium':
                return styles.priorityMedium;
            default:
                return styles.priorityLow;
        }
    };

    const getSentimentIcon = () => {
        switch (summary.sentiment) {
            case 'optimistic':
                return <ArrowUpRight className={styles.sentimentUp} />;
            case 'concerning':
                return <ArrowDownRight className={styles.sentimentDown} />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Card className={styles.container}>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                        <Skeleton width={40} height={40} borderRadius={12} />
                        <Skeleton width={200} height={32} />
                    </div>
                    <Skeleton width="100%" height={80} style={{ marginBottom: '24px' }} />
                    <Skeleton width="100%" height={120} borderRadius={12} />
                </div>
            </Card>
        );
    }

    return (
        <Card className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Sparkles size={24} className={styles.aiIcon} />
                    <h2 className={styles.title}>{t('dashboard.aiSummary.title')}</h2>
                </div>
                {getSentimentIcon()}
            </div>

            <p className={styles.summary}>{summary.summary}</p>

            {/* Key Insights */}
            {summary.keyInsights && summary.keyInsights.length > 0 && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('dashboard.aiSummary.keyInsights')}</h3>
                    <div className={styles.insights}>
                        {summary.keyInsights.map((insight, index) => {
                            const Icon = getInsightIcon(insight.type);
                            return (
                                <div
                                    key={index}
                                    className={`${styles.insight} ${styles[insight.type]}`}
                                >
                                    <Icon size={20} className={styles.insightIcon} />
                                    <div className={styles.insightContent}>
                                        <div className={styles.insightTitle}>{insight.title}</div>
                                        <p className={styles.insightDescription}>{insight.description}</p>
                                        {insight.actionable && (
                                            <p className={styles.actionable}>
                                                💡 {insight.actionable}
                                            </p>
                                        )}
                                    </div>
                                    {insight.impact && (
                                        <span className={`${styles.impactBadge} ${styles[`impact${insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)}`]}`}>
                                            {insight.impact}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {summary.recommendations && summary.recommendations.length > 0 && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('dashboard.aiSummary.recommendedActions')}</h3>
                    <div className={styles.recommendations}>
                        {summary.recommendations.map((rec, index) => (
                            <div key={index} className={styles.recommendation}>
                                <div className={styles.recHeader}>
                                    <span className={`${styles.priority} ${getPriorityColor(rec.priority)}`}>
                                        {rec.priority.toUpperCase()}
                                    </span>
                                    <span className={styles.recAction}>{rec.action}</span>
                                </div>
                                <p className={styles.recReason}>{rec.reason}</p>
                                {rec.client && (
                                    <span className={styles.recClient}>{t('dashboard.clientPerformance.table.client')}: {rec.client}</span>
                                )}
                                {(rec.estimatedImpact || rec.estimatedSavings) && (
                                    <div className={styles.recImpact}>
                                        {rec.estimatedImpact && (
                                            <span className={styles.impactText}>
                                                📈 {rec.estimatedImpact}
                                            </span>
                                        )}
                                        {rec.estimatedSavings && (
                                            <span className={styles.impactText}>
                                                💰 {t('dashboard.aiSummary.save')} {rec.estimatedSavings}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Confidence */}
            <div className={styles.footer}>
                <span className={styles.confidence}>
                    {t('dashboard.aiSummary.confidence')}: {(summary.confidenceScore * 100).toFixed(0)}%
                </span>
            </div>
        </Card>
    );
};
