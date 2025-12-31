import React from 'react';
import { useTranslation } from 'react-i18next';
import { Granularity } from '../../types/metrics';
import styles from './GranularitySelector.module.css';

interface GranularitySelectorProps {
    value: Granularity;
    onChange: (granularity: Granularity) => void;
}

export const GranularitySelector: React.FC<GranularitySelectorProps> = ({ value, onChange }) => {
    const { t } = useTranslation();

    const options: { value: Granularity; label: string }[] = [
        { value: 'TOTAL', label: t('reports.granularity.total') },
        { value: 'DAY', label: t('reports.granularity.day') },
        { value: 'HOUR', label: t('reports.granularity.hour') }
    ];

    return (
        <div className={styles.container}>
            <label className={styles.label}>{t('reports.granularity.label')}</label>
            <div className={styles.buttonGroup}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        className={`${styles.button} ${value === option.value ? styles.active : ''}`}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
