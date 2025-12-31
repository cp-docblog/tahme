import React, { useState, useEffect } from 'react';
import { Select, SelectOption } from '../UI/Select';
import { useTranslation } from 'react-i18next';
import styles from './AdAccountSelector.module.css';

interface AdAccount {
    id: string;
    name: string;
    status: string;
}

interface AdAccountSelectorProps {
    value?: string;
    onChange: (accountId: string, accountName: string) => void;
    label?: string;
    required?: boolean;
}

export const AdAccountSelector: React.FC<AdAccountSelectorProps> = ({
    value,
    onChange,
    label,
    required = false,
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<AdAccount[]>([]);

    useEffect(() => {
        fetchAdAccounts();
    }, []);

    const fetchAdAccounts = async () => {
        setLoading(true);
        setError(null);

        try {
            const webhookUrl = process.env.REACT_APP_BACKEND_WEBHOOK;
            if (!webhookUrl) {
                throw new Error('Backend webhook URL not configured');
            }

            const response = await fetch(`${webhookUrl}/tash-list-ad-accounts`);

            if (!response.ok) {
                throw new Error('Failed to fetch ad accounts');
            }

            const data = await response.json();

            // Parse the response structure
            const adAccounts: AdAccount[] = [];

            if (data && Array.isArray(data)) {
                data.forEach((item: any) => {
                    if (item.adaccounts && Array.isArray(item.adaccounts)) {
                        item.adaccounts.forEach((accItem: any) => {
                            if (accItem.adaccount) {
                                adAccounts.push({
                                    id: accItem.adaccount.id,
                                    name: accItem.adaccount.name,
                                    status: accItem.adaccount.status || 'UNKNOWN',
                                });
                            }
                        });
                    }
                });
            }

            setAccounts(adAccounts);
        } catch (err) {
            console.error('Error fetching ad accounts:', err);
            setError('Failed to load ad accounts');
        } finally {
            setLoading(false);
        }
    };

    const options: SelectOption[] = accounts.map((account) => ({
        value: account.id,
        label: account.name,
        badge: (
            <span
                className={`${styles.statusBadge} ${account.status === 'ACTIVE' ? styles.active : styles.inactive
                    }`}
            >
                {account.status === 'ACTIVE' ? '●' : '○'}
            </span>
        ),
    }));

    const handleChange = (accountId: string) => {
        const selectedAccount = accounts.find((acc) => acc.id === accountId);
        if (selectedAccount) {
            onChange(accountId, selectedAccount.name);
        }
    };

    return (
        <div className={styles.adAccountSelector}>
            <Select
                label={label || t('newClient.fields.adAccount')}
                options={options}
                value={value}
                onChange={handleChange}
                loading={loading}
                placeholder={loading ? t('common.loading') : t('newClient.selectAdAccount')}
                required={required}
            />
            {error && <span className={styles.error}>{error}</span>}
            <div className={styles.legend}>
                <span className={styles.legendItem}>
                    <span className={`${styles.statusBadge} ${styles.active}`}>●</span>
                    {t('newClient.adAccountStatus.active')}
                </span>
                <span className={styles.legendItem}>
                    <span className={`${styles.statusBadge} ${styles.inactive}`}>○</span>
                    {t('newClient.adAccountStatus.inactive')}
                </span>
            </div>
        </div>
    );
};
