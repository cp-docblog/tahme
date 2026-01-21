import React from 'react';
import { Video, MessageSquare, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI/Card';
import styles from './PlatformCards.module.css';

interface PlatformCardsProps {
    onSelectPlatform: (platform: 'snapchat' | 'tiktok' | 'facebook') => void;
    clientName: string;
}

export const PlatformCards: React.FC<PlatformCardsProps> = ({ onSelectPlatform, clientName }) => {
    const { t } = useTranslation();

    const platforms = [
        {
            id: 'snapchat' as const,
            name: 'Snapchat',
            icon: MessageSquare,
            color: '#FFFC00',
            available: true,
        },
        {
            id: 'tiktok' as const,
            name: 'TikTok',
            icon: Video,
            color: '#000000',
            available: false,
        },
        {
            id: 'facebook' as const,
            name: 'Facebook',
            icon: Share2,
            color: '#1877F2',
            available: true,
        },
    ];

    return (
        <div className={styles.platformCards}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('campaigns.selectPlatform')}</h2>
                <p className={styles.subtitle}>{clientName}</p>
            </div>
            <div className={styles.grid}>
                {platforms.map((platform) => (
                    <Card
                        key={platform.id}
                        className={`${styles.platformCard} ${!platform.available ? styles.comingSoon : ''}`}
                        hover={platform.available}
                        onClick={() => platform.available && onSelectPlatform(platform.id)}
                        data-coming-soon-text={!platform.available ? t('newClient.comingSoon') : undefined}
                    >
                        <div className={styles.iconWrapper} style={{ backgroundColor: `${platform.color}15` }}>
                            <platform.icon size={32} style={{ color: platform.color }} />
                        </div>
                        <h3 className={styles.platformName}>{platform.name}</h3>
                    </Card>
                ))}
            </div>
        </div>
    );
};
