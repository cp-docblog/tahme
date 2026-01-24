import React, { useState, useEffect } from 'react';
import { Select, SelectOption } from '../UI/Select';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import styles from './AdAccountSelector.module.css';

interface Advertiser {
    id: string;
    name: string;
}

interface TikTokAdvertiserSelectorProps {
    value?: string;
    onChange: (advertiserId: string, advertiserName: string) => void;
    label?: string;
    required?: boolean;
}

export const TikTokAdvertiserSelector: React.FC<TikTokAdvertiserSelectorProps> = ({
    value,
    onChange,
    label,
    required = false,
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useEffect(() => {
        fetchAdvertisers();
    }, []);

    const fetchAdvertisers = async () => {
        setLoading(true);
        setError(null);

        try {
            // Edge function now fetches token from creds table internally
            const { data, error: fnError } = await supabase.functions.invoke('tt-advertisers', {
                body: {},
            });

            if (fnError) {
                // Check if error is about missing token
                if (fnError.message?.includes('access token not found')) {
                    setHasToken(false);
                    return;
                }
                throw fnError;
            }

            setHasToken(true);

            // Parse the response
            const advertiserList: Advertiser[] = [];
            if (data?.advertisers && Array.isArray(data.advertisers)) {
                data.advertisers.forEach((adv: any) => {
                    if (adv.advertiser_id) {
                        advertiserList.push({
                            id: adv.advertiser_id,
                            name: adv.advertiser_name || `Advertiser ${adv.advertiser_id}`,
                        });
                    }
                });
            }

            setAdvertisers(advertiserList);

            // If there's no error but no advertisers, token might be invalid
            if (advertiserList.length === 0) {
                setError('No advertisers found. Please check TikTok connection.');
            }
        } catch (err: any) {
            console.error('Error fetching TikTok advertisers:', err);
            if (err.message?.includes('access token not found')) {
                setHasToken(false);
            } else {
                setError('Failed to load advertisers');
            }
        } finally {
            setLoading(false);
        }
    };

    const options: SelectOption[] = advertisers.map((advertiser) => ({
        value: advertiser.id,
        label: advertiser.name,
    }));

    const handleChange = (advertiserId: string) => {
        const selected = advertisers.find((adv) => adv.id === advertiserId);
        if (selected) {
            onChange(advertiserId, selected.name);
        }
    };

    // Show message if TikTok not connected
    if (hasToken === false) {
        return (
            <div className={styles.adAccountSelector}>
                <Select
                    label={label || t('newClient.fields.tiktokAdvertiser')}
                    options={[]}
                    value=""
                    onChange={() => { }}
                    disabled
                    placeholder={t('newClient.connectTiktokFirst')}
                    required={required}
                />
                <span className={styles.hint}>{t('newClient.connectTiktokOnIntegrations')}</span>
            </div>
        );
    }

    return (
        <div className={styles.adAccountSelector}>
            <Select
                label={label || t('newClient.fields.tiktokAdvertiser')}
                options={options}
                value={value}
                onChange={handleChange}
                loading={loading}
                placeholder={loading ? t('common.loading') : t('newClient.selectTiktokAdvertiser')}
                required={required}
            />
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
};
