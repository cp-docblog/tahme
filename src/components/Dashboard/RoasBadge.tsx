import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from './RoasBadge.module.css';

interface RoasBadgeProps {
    value: number;
    showTrend?: boolean;
}

export const RoasBadge: React.FC<RoasBadgeProps> = ({ value, showTrend = false }) => {
    const getVariant = (roas: number): 'high' | 'medium' | 'low' => {
        if (roas >= 2.5) return 'high';
        if (roas >= 1.5) return 'medium';
        return 'low';
    };

    const variant = getVariant(value);
    const Icon = value >= 1 ? TrendingUp : TrendingDown;

    return (
        <div className={`${styles.badge} ${styles[variant]}`}>
            {showTrend && <Icon size={14} className={styles.icon} />}
            <span className={styles.value}>
                {value.toFixed(2)}
            </span>
        </div>
    );
};
