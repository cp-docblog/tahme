import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, FileText, MessageSquare, Video, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { AdAccountSelector } from '../components/Clients/AdAccountSelector';
import styles from './NewClient.module.css';

export const NewClient: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { clientId } = useParams<{ clientId: string }>();
    const isEditMode = !!clientId;
    const [loading, setLoading] = useState(false);
    const [fetchingClient, setFetchingClient] = useState(isEditMode);
    const [formData, setFormData] = useState({
        // Client Info
        name: '',
        clickup_folder: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        // Credentials
        tiktok_username: '',
        tiktok_password: '',
        snapchat_ad_account_id: '',
        snapchat_ad_account_name: '',
        facebook_username: '',
        facebook_password: '',
        facebook_ad_account_id: '',
        facebook_ad_account_name: '',
        facebook_access_token: '',
    });

    useEffect(() => {
        if (isEditMode && clientId) {
            fetchClientData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, isEditMode]);

    const fetchClientData = async () => {
        try {
            setFetchingClient(true);
            const { data, error } = await (supabase as any)
                .from('clients')
                .select('*')
                .eq('id', clientId!)
                .single();

            if (error) throw error;

            if (data) {
                const clientData = data as any;
                setFormData({
                    name: clientData.name || '',
                    clickup_folder: clientData.clickup_folder || '',
                    contact_name: clientData.contact_name || '',
                    contact_email: clientData.contact_email || '',
                    contact_phone: clientData.contact_phone || '',
                    tiktok_username: clientData.tiktok_username || '',
                    tiktok_password: clientData.tiktok_password || '',
                    snapchat_ad_account_id: clientData.snapchat_ad_account_id || '',
                    snapchat_ad_account_name: clientData.snapchat_ad_account_name || '',
                    facebook_username: clientData.facebook_username || '',
                    facebook_password: clientData.facebook_password || '',
                    facebook_ad_account_id: clientData.facebook_ad_account_id || '',
                    facebook_ad_account_name: clientData.facebook_ad_account_name || '',
                    facebook_access_token: clientData.facebook_access_token || '',
                });
            }
        } catch (error) {
            console.error('Error fetching client:', error);
            alert('حدث خطأ أثناء تحميل بيانات العميل');
            navigate('/clients');
        } finally {
            setFetchingClient(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode && clientId) {
                // Update existing client
                const updateData = {
                    name: formData.name,
                    clickup_folder: formData.clickup_folder || null,
                    contact_name: formData.contact_name || null,
                    contact_email: formData.contact_email || null,
                    contact_phone: formData.contact_phone || null,
                    tiktok_username: formData.tiktok_username || null,
                    tiktok_password: formData.tiktok_password || null,
                    snapchat_ad_account_id: formData.snapchat_ad_account_id || null,
                    snapchat_ad_account_name: formData.snapchat_ad_account_name || null,
                    facebook_username: formData.facebook_username || null,
                    facebook_password: formData.facebook_password || null,
                    facebook_ad_account_id: formData.facebook_ad_account_id || null,
                    facebook_ad_account_name: formData.facebook_ad_account_name || null,
                    facebook_access_token: formData.facebook_access_token || null,
                };

                const { error } = await (supabase as any)
                    .from('clients')
                    .update(updateData)
                    .eq('id', clientId);

                if (error) throw error;
            } else {
                // Create new client
                const userResult = await supabase.auth.getUser();
                const insertData = {
                    name: formData.name,
                    clickup_folder: formData.clickup_folder || null,
                    contact_name: formData.contact_name || null,
                    contact_email: formData.contact_email || null,
                    contact_phone: formData.contact_phone || null,
                    tiktok_username: formData.tiktok_username || null,
                    tiktok_password: formData.tiktok_password || null,
                    snapchat_ad_account_id: formData.snapchat_ad_account_id || null,
                    snapchat_ad_account_name: formData.snapchat_ad_account_name || null,
                    facebook_username: formData.facebook_username || null,
                    facebook_password: formData.facebook_password || null,
                    facebook_ad_account_id: formData.facebook_ad_account_id || null,
                    facebook_ad_account_name: formData.facebook_ad_account_name || null,
                    facebook_access_token: formData.facebook_access_token || null,
                    created_by: userResult.data.user?.id || '',
                };

                const { error } = await (supabase as any)
                    .from('clients')
                    .insert(insertData);

                if (error) throw error;
            }

            navigate('/clients');
        } catch (error) {
            console.error('Error saving client:', error);
            alert(isEditMode ? 'حدث خطأ أثناء تحديث العميل' : 'حدث خطأ أثناء إضافة العميل');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (fetchingClient) {
        return (
            <div className={styles.newClient}>
                <div style={{ textAlign: 'center', padding: '48px' }}>
                    <div className={styles.spinner}></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.newClient}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        {isEditMode ? t('clients.actions.edit') + ' ' + formData.name : t('newClient.title')}
                    </h1>
                    <p className={styles.subtitle}>
                        {isEditMode ? t('newClient.subtitle') : t('newClient.subtitle')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/clients')}>
                    <X size={18} style={{ marginInlineEnd: '0.5rem' }} />
                    {t('common.cancel')}
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <FileText size={20} style={{ marginInlineEnd: '0.5rem' }} />
                        {t('newClient.sections.basic')}
                    </h2>
                    <div className={styles.formGrid}>
                        <Input
                            label={t('newClient.fields.clientName') + ' *'}
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                        />
                        <Input
                            label={t('newClient.fields.clickupFolder')}
                            value={formData.clickup_folder}
                            onChange={(e) => handleChange('clickup_folder', e.target.value)}
                        />
                        <Input
                            label={t('newClient.fields.contactName')}
                            value={formData.contact_name}
                            onChange={(e) => handleChange('contact_name', e.target.value)}
                        />
                        <Input
                            label={t('newClient.fields.contactEmail')}
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => handleChange('contact_email', e.target.value)}
                        />
                        <Input
                            label={t('newClient.fields.contactPhone')}
                            type="tel"
                            value={formData.contact_phone}
                            onChange={(e) => handleChange('contact_phone', e.target.value)}
                        />
                    </div>
                </Card>

                <Card className={`${styles.section} ${styles.platformSection} comingSoon`} data-coming-soon-text={t('newClient.comingSoon')}>
                    <h2 className={styles.sectionTitle}>
                        <Video size={20} style={{ marginInlineEnd: '0.5rem' }} />
                        TikTok
                    </h2>
                    <div className={styles.formGrid}>
                        <Input
                            label={t('newClient.fields.tiktokUsername')}
                            value={formData.tiktok_username}
                            onChange={(e) => handleChange('tiktok_username', e.target.value)}
                            disabled
                        />
                        <Input
                            label={t('newClient.fields.tiktokPassword')}
                            type="password"
                            value={formData.tiktok_password}
                            onChange={(e) => handleChange('tiktok_password', e.target.value)}
                            disabled
                        />
                    </div>
                </Card>

                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <MessageSquare size={20} style={{ marginInlineEnd: '0.5rem' }} />
                        Snapchat
                    </h2>
                    <div className={styles.formGrid}>
                        <AdAccountSelector
                            value={formData.snapchat_ad_account_id}
                            onChange={(accountId, accountName) => {
                                setFormData(prev => ({
                                    ...prev,
                                    snapchat_ad_account_id: accountId,
                                    snapchat_ad_account_name: accountName,
                                }));
                            }}
                            label={t('newClient.fields.adAccount')}
                        />
                    </div>
                </Card>

                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Share2 size={20} style={{ marginInlineEnd: '0.5rem' }} />
                        Facebook
                    </h2>
                    <div className={styles.formGrid}>
                        <Input
                            label={t('newClient.fields.facebookAccountId')}
                            value={formData.facebook_ad_account_id}
                            onChange={(e) => handleChange('facebook_ad_account_id', e.target.value)}
                            placeholder="e.g. 123456789012345"
                        />
                        <Input
                            label={t('newClient.fields.facebookAccountName')}
                            value={formData.facebook_ad_account_name}
                            onChange={(e) => handleChange('facebook_ad_account_name', e.target.value)}
                            placeholder="e.g. My Business Ad Account"
                        />
                        <Input
                            label={t('newClient.fields.facebookAccessToken')}
                            value={formData.facebook_access_token}
                            onChange={(e) => handleChange('facebook_access_token', e.target.value)}
                            placeholder="System User Access Token"
                            type="password"
                        />
                    </div>
                </Card>

                <div className={styles.actions}>
                    <Button type="submit" loading={loading} size="lg">
                        <Save size={18} style={{ marginInlineEnd: '0.5rem' }} />
                        {t('newClient.actions.save')}
                    </Button>
                    <Button type="button" variant="outline" size="lg" onClick={() => navigate('/clients')}>
                        {t('newClient.actions.cancel')}
                    </Button>
                </div>
            </form>
        </div>
    );
};
