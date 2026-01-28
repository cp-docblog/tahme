import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI/Card';
import { Skeleton } from '../UI/Skeleton';
import { RoasBadge } from './RoasBadge';
import type { ClientPerformanceData } from '../../types/dashboard';
import styles from './ClientPerformanceTable.module.css';

interface ClientPerformanceTableProps {
    clients: ClientPerformanceData[];
    loading?: boolean;
}

export const ClientPerformanceTable: React.FC<ClientPerformanceTableProps> = ({
    clients,
    loading = false
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [expandedClient, setExpandedClient] = React.useState<string | null>(null);

    const handleClientClick = (clientId: string) => {
        navigate(`/campaigns?client=${clientId}`);
    };

    const toggleExpand = (e: React.MouseEvent, clientId: string) => {
        e.stopPropagation();
        setExpandedClient(expandedClient === clientId ? null : clientId);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // ... (keep helper formatCurrency if needed or just use consistent one)

    if (loading) {
        return (
            <Card>
                <div className={styles.tableContainer}>
                    <div style={{ padding: '24px' }}>
                        <Skeleton height={32} width="100%" style={{ marginBottom: '24px' }} />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton
                                key={i}
                                height={64}
                                width="100%"
                                borderRadius={12}
                                style={{ marginBottom: '12px' }}
                            />
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    if (!clients || clients.length === 0) {
        return (
            <Card>
                <div className={styles.empty}>{t('dashboard.clientPerformance.noClients')}</div>
            </Card>
        );
    }

    const getBestPlatformLabel = (platform: string) => {
        switch (platform?.toLowerCase()) {
            case 'snapchat': return t('campaigns.platforms.snapchat');
            case 'tiktok': return t('campaigns.platforms.tiktok');
            case 'facebook': return t('campaigns.platforms.facebook');
            default: return platform;
        }
    };

    const renderPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'tiktok':
                return (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                    </svg>
                );
            case 'facebook':
                return (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                );
            case 'snapchat':
                return (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.032.51-.01.172-.017.344-.014.513.003.112.009.224.021.336.004.026.015.044.017.05.108.299.464.573.812.637l.015.001c.272.043.469.076.619.098.13.014.227.023.297.023.193 0 .399-.032.569-.088l.09-.027c.063-.018.127-.036.151-.041.194-.037.403-.062.62-.062.306 0 .621.05.819.17.159.098.309.243.289.55-.007.106-.046.203-.086.299-.089.214-.225.413-.355.591l-.015.02c-.042.055-.084.106-.126.156-.035.041-.068.08-.1.118l-.062.075c-.146.188-.36.47-.549.812-.206.379-.374.837-.374 1.347 0 .128.008.256.027.382.066.47.288.801.563 1.059.246.231.544.397.813.521.222.102.42.173.582.228l.038.015a10.53 10.53 0 01.42.17c.091.037.177.075.257.115.082.04.161.082.228.128.178.117.297.267.297.553 0 .216-.139.368-.285.48-.35.264-.867.44-1.44.538-.104.019-.197.037-.282.053l-.069.014c-.069.014-.136.027-.21.042-.128.029-.256.065-.379.119l-.003.001c-.171.073-.343.254-.531.488-.258.312-.579.701-1.068 1.045-.498.35-1.159.661-2.091.661-.101 0-.207-.006-.319-.016l-.01-.001c-.085-.009-.177-.019-.278-.024a7.125 7.125 0 00-.283-.008c-.298 0-.621.024-.978.103-.292.063-.597.172-.907.369-.27.174-.532.425-.816.81l-.027.04c-.177.253-.378.539-.666.811l-.002.001a3.86 3.86 0 01-2.581.99c-.878 0-1.779-.324-2.584-.992-.287-.271-.488-.557-.665-.81l-.027-.04c-.284-.385-.546-.636-.816-.81-.31-.197-.615-.306-.907-.369a4.73 4.73 0 00-.978-.103 7.1 7.1 0 00-.283.008c-.101.005-.193.015-.278.024l-.01.001c-.112.01-.218.016-.319.016-.932 0-1.593-.311-2.091-.661-.489-.344-.81-.733-1.068-1.045-.188-.234-.36-.415-.531-.488l-.003-.001a1.593 1.593 0 00-.379-.119c-.074-.015-.141-.028-.21-.042l-.069-.014c-.085-.016-.178-.034-.282-.053-.573-.098-1.09-.274-1.44-.538-.146-.112-.285-.264-.285-.48 0-.286.119-.436.297-.553a1.62 1.62 0 01.228-.128c.08-.04.166-.078.257-.115.134-.054.273-.109.42-.17l.038-.015c.162-.055.36-.126.582-.228.269-.124.567-.29.813-.521.275-.258.497-.589.563-1.059a1.94 1.94 0 00.027-.382c0-.51-.168-.968-.374-1.347a4.127 4.127 0 00-.549-.812l-.062-.075a5.6 5.6 0 01-.1-.118c-.042-.05-.084-.101-.126-.156l-.015-.02a3.63 3.63 0 01-.355-.591c-.04-.096-.079-.193-.086-.299-.02-.307.13-.452.289-.55.198-.12.513-.17.819-.17.217 0 .426.025.62.062.024.005.088.023.151.041l.09.027c.17.05.376.088.569.088.07 0 .166-.009.296-.023.15-.022.347-.055.619-.098l.015-.001c.348-.064.704-.338.812-.637.002-.006.013-.024.017-.05.012-.112.018-.224.021-.336.003-.169-.004-.341-.014-.513-.01-.165-.02-.33-.032-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z" />
                    </svg>
                );
            default: return null;
        }
    }

    return (
        <Card>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>{t('dashboard.clientPerformance.table.client')}</th>
                            <th className={styles.centered}>{t('dashboard.clientPerformance.table.platforms')}</th>
                            <th>{t('dashboard.clientPerformance.table.spend')}</th>
                            <th>{t('dashboard.clientPerformance.table.revenue')}</th>
                            <th className={styles.centered}>{t('dashboard.clientPerformance.table.roas')}</th>
                            <th>{t('dashboard.clientPerformance.table.bestChannel')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => (
                            <React.Fragment key={client.id}>
                                <tr
                                    onClick={() => handleClientClick(client.id)}
                                    className={styles.row}
                                >
                                    <td onClick={(e) => toggleExpand(e, client.id)}>
                                        <button className={styles.expandButton}>
                                            {expandedClient === client.id ?
                                                <ArrowRight size={16} style={{ transform: 'rotate(90deg)' }} /> :
                                                <ArrowRight size={16} />
                                            }
                                        </button>
                                    </td>
                                    <td>
                                        <div className={styles.clientCell}>
                                            <span className={styles.clientName}>{client.name}</span>
                                            {client.topCampaign && (
                                                <span className={styles.topCampaign}>
                                                    {t('dashboard.clientPerformance.table.top')} {client.topCampaign.name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={styles.centered}>
                                        <div className={styles.platforms}>
                                            <div className={`${styles.platformIcon} ${styles.snapchat} ${client.activePlatforms?.includes('snapchat') ? styles.active : ''}`}>
                                                {renderPlatformIcon('snapchat')}
                                            </div>
                                            <div className={`${styles.platformIcon} ${styles.tiktok} ${client.activePlatforms?.includes('tiktok') ? styles.active : ''}`}>
                                                {renderPlatformIcon('tiktok')}
                                            </div>
                                            <div className={`${styles.platformIcon} ${styles.facebook} ${client.activePlatforms?.includes('facebook') ? styles.active : ''}`}>
                                                {renderPlatformIcon('facebook')}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.number}>{formatCurrency(client.spend)}</td>
                                    <td className={styles.number}>{formatCurrency(client.revenue)}</td>
                                    <td className={styles.centered}>
                                        <RoasBadge value={client.roas} />
                                    </td>
                                    <td>
                                        {client.bestPlatform ? (
                                            <span className={`${styles.bestPlatformBadge} ${styles[client.bestPlatform.name.toLowerCase()]}`}>
                                                {getBestPlatformLabel(client.bestPlatform.name)} ({client.bestPlatform.roas.toFixed(1)})
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>-</span>
                                        )}
                                    </td>
                                    <td className={styles.action}>
                                        <button className={styles.viewButton}>
                                            <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                                {expandedClient === client.id && (
                                    <tr className={styles.expandedRow}>
                                        <td colSpan={8}>
                                            <div className={styles.topAdsContainer}>
                                                <div className={styles.topAdsTitle}>{t('dashboard.clientPerformance.table.topCreative')}</div>
                                                <div className={styles.topAdsGrid}>
                                                    {['tiktok', 'facebook', 'snapchat'].map(platform => {
                                                        const ad = client.topAds?.[platform as keyof typeof client.topAds];
                                                        if (!ad) return null;

                                                        return (
                                                            <div key={platform} className={styles.topAdCard}>
                                                                <div className={styles.platformHeader}>
                                                                    <span className={`${styles.platformIcon} ${styles[platform]} ${styles.active}`} style={{ width: '16px', height: '16px', opacity: 1 }}>
                                                                        {renderPlatformIcon(platform)}
                                                                    </span>
                                                                    {getBestPlatformLabel(platform)}
                                                                </div>
                                                                <div className={styles.adName} title={ad.name}>{ad.name}</div>
                                                                <div className={styles.adMetrics}>
                                                                    <div className={styles.metricItem}>
                                                                        <span className={styles.metricLabel}>{t('dashboard.clientPerformance.table.spend')}</span>
                                                                        <span className={styles.metricValue}>{formatCurrency(ad.spend)}</span>
                                                                    </div>
                                                                    <div className={styles.metricItem}>
                                                                        <span className={styles.metricLabel}>{t('dashboard.clientPerformance.table.roas')}</span>
                                                                        <RoasBadge value={ad.roas} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {!client.topAds?.tiktok && !client.topAds?.facebook && !client.topAds?.snapchat && (
                                                        <div style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
                                                            {t('dashboard.clientPerformance.table.noCreative')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
