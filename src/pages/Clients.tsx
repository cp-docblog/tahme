import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import styles from './Clients.module.css';

// Platform icons as inline SVGs for better visual consistency
const SnapchatIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.032.51-.01.172-.017.344-.014.513.003.112.009.224.021.336.004.026.015.044.017.05.108.299.464.573.812.637l.015.001c.272.043.469.076.619.098.13.014.227.023.297.023.193 0 .399-.038.569-.088l.09-.027c.063-.018.127-.036.151-.041.194-.037.403-.062.62-.062.306 0 .621.05.819.17.159.098.309.243.289.55-.007.106-.046.203-.086.299-.089.214-.225.413-.355.591l-.015.02c-.042.055-.084.106-.126.156-.035.041-.068.08-.1.118l-.062.075c-.146.188-.36.47-.549.812-.206.379-.374.837-.374 1.347 0 .128.008.256.027.382.066.47.288.801.563 1.059.246.231.544.397.813.521.222.102.42.173.582.228l.038.015a10.53 10.53 0 01.42.17c.091.037.177.075.257.115.082.04.161.082.228.128.178.117.297.267.297.553 0 .216-.139.368-.285.48-.35.264-.867.44-1.44.538-.104.019-.197.037-.282.053l-.069.014c-.069.014-.136.027-.21.042-.128.029-.256.065-.379.119l-.003.001c-.171.073-.343.254-.531.488-.258.312-.579.701-1.068 1.045-.498.35-1.159.661-2.091.661-.101 0-.207-.006-.319-.016l-.01-.001c-.085-.009-.177-.019-.278-.024a7.125 7.125 0 00-.283-.008c-.298 0-.621.024-.978.103-.292.063-.597.172-.907.369-.27.174-.532.425-.816.81l-.027.04c-.177.253-.378.539-.666.811l-.002.001a3.86 3.86 0 01-2.581.99c-.878 0-1.779-.324-2.584-.992-.287-.271-.488-.557-.665-.81l-.027-.04c-.284-.385-.546-.636-.816-.81-.31-.197-.615-.306-.907-.369a4.73 4.73 0 00-.978-.103 7.1 7.1 0 00-.283.008c-.101.005-.193.015-.278.024l-.01.001c-.112.01-.218.016-.319.016-.932 0-1.593-.311-2.091-.661-.489-.344-.81-.733-1.068-1.045-.188-.234-.36-.415-.531-.488l-.003-.001a1.593 1.593 0 00-.379-.119c-.074-.015-.141-.028-.21-.042l-.069-.014c-.085-.016-.178-.034-.282-.053-.573-.098-1.09-.274-1.44-.538-.146-.112-.285-.264-.285-.48 0-.286.119-.436.297-.553a1.62 1.62 0 01.228-.128c.08-.04.166-.078.257-.115.134-.054.273-.109.42-.17l.038-.015c.162-.055.36-.126.582-.228.269-.124.567-.29.813-.521.275-.258.497-.589.563-1.059a1.94 1.94 0 00.027-.382c0-.51-.168-.968-.374-1.347a4.127 4.127 0 00-.549-.812l-.062-.075a5.6 5.6 0 01-.1-.118c-.042-.05-.084-.101-.126-.156l-.015-.02a3.63 3.63 0 01-.355-.591c-.04-.096-.079-.193-.086-.299-.02-.307.13-.452.289-.55.198-.12.513-.17.819-.17.217 0 .426.025.62.062.024.005.088.023.151.041l.09.027c.17.05.376.088.569.088.07 0 .166-.009.296-.023.15-.022.347-.055.619-.098l.015-.001c.348-.064.704-.338.812-.637.002-.006.013-.024.017-.05.012-.112.018-.224.021-.336.003-.169-.004-.341-.014-.513-.01-.165-.02-.33-.032-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z" />
    </svg>
);

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const SNAPCHAT_OAUTH_URL = 'https://accounts.snapchat.com/login/oauth2/authorize?client_id=887c761d-506d-4e30-ab21-30a4d9b647b2&redirect_uri=https%3A%2F%2Faibackend.cp-devcode.com%2Fwebhook%2Fsnapchat-auth&response_type=code&scope=snapchat-marketing-api';

interface Client {
    id: string;
    name: string;
    clickup_folder: string | null;
    contact_name: string | null;
    contact_email: string | null;
    created_at: string;
}

export const Clients: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, clickup_folder, contact_name, contact_email, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.clients}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('clients.title')}</h1>
                    <p className={styles.subtitle}>{t('clients.subtitle')}</p>
                </div>
                <Button onClick={() => navigate('/clients/new')}>
                    <Plus size={18} style={{ marginInlineEnd: '0.5rem' }} />
                    {t('clients.addClient')}
                </Button>
            </div>

            {/* Integrations Section */}
            <section className={styles.integrationsSection}>
                <div className={styles.sectionHeader}>
                    <Link2 size={24} />
                    <h2 className={styles.sectionTitle}>{t('clients.integrations.title')}</h2>
                </div>
                <div className={styles.integrationsGrid}>
                    {/* Snapchat Integration - Available */}
                    <Card className={`${styles.integrationCard} ${styles.available}`}>
                        <div className={styles.integrationHeader}>
                            <div className={`${styles.integrationIcon} ${styles.snapchat}`}>
                                <SnapchatIcon />
                            </div>
                            <div className={styles.integrationInfo}>
                                <h3 className={styles.integrationName}>Snapchat</h3>
                                <span className={`${styles.integrationBadge} ${styles.availableBadge}`}>
                                    {t('clients.integrations.available')}
                                </span>
                            </div>
                        </div>
                        <p className={styles.integrationDescription}>
                            {t('clients.integrations.snapchatDescription')}
                        </p>
                        <Button
                            className={styles.connectButton}
                            onClick={() => window.location.href = SNAPCHAT_OAUTH_URL}
                        >
                            {t('clients.integrations.connect')}
                        </Button>
                    </Card>

                    {/* TikTok Integration - Coming Soon */}
                    <Card className={`${styles.integrationCard} ${styles.comingSoon}`}>
                        <div className={styles.integrationHeader}>
                            <div className={`${styles.integrationIcon} ${styles.tiktok}`}>
                                <TikTokIcon />
                            </div>
                            <div className={styles.integrationInfo}>
                                <h3 className={styles.integrationName}>TikTok</h3>
                                <span className={`${styles.integrationBadge} ${styles.comingSoonBadge}`}>
                                    {t('clients.integrations.comingSoon')}
                                </span>
                            </div>
                        </div>
                        <p className={styles.integrationDescription}>
                            {t('clients.integrations.tiktokDescription')}
                        </p>
                        <Button className={styles.connectButton} disabled>
                            {t('clients.integrations.connect')}
                        </Button>
                    </Card>

                    {/* Facebook Integration - Coming Soon */}
                    <Card className={`${styles.integrationCard} ${styles.comingSoon}`}>
                        <div className={styles.integrationHeader}>
                            <div className={`${styles.integrationIcon} ${styles.facebook}`}>
                                <FacebookIcon />
                            </div>
                            <div className={styles.integrationInfo}>
                                <h3 className={styles.integrationName}>Facebook</h3>
                                <span className={`${styles.integrationBadge} ${styles.comingSoonBadge}`}>
                                    {t('clients.integrations.comingSoon')}
                                </span>
                            </div>
                        </div>
                        <p className={styles.integrationDescription}>
                            {t('clients.integrations.facebookDescription')}
                        </p>
                        <Button className={styles.connectButton} disabled>
                            {t('clients.integrations.connect')}
                        </Button>
                    </Card>
                </div>
            </section>

            {loading ? (
                <div className={styles.loading}>{t('common.loading')}</div>
            ) : clients.length === 0 ? (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Building2 size={48} /></div>
                    <h3 className={styles.emptyTitle}>{t('clients.title')}</h3>
                    <p className={styles.emptyText}>{t('clients.addClient')}</p>
                    <Button onClick={() => navigate('/clients/new')}>{t('clients.addClient')}</Button>
                </Card>
            ) : (
                <div className={styles.clientsGrid}>
                    {clients.map((client) => (
                        <Card key={client.id} className={styles.clientCard} hover>
                            <div className={styles.clientHeader}>
                                <div className={styles.clientIcon}><Building2 size={24} /></div>
                                <h3 className={styles.clientName}>{client.name}</h3>
                            </div>
                            <div className={styles.clientDetails}>
                                {client.contact_name && (
                                    <div className={styles.detail}>
                                        <span className={styles.detailLabel}>{t('clients.table.contact')}:</span>
                                        <span className={styles.detailValue}>{client.contact_name}</span>
                                    </div>
                                )}
                                {client.contact_email && (
                                    <div className={styles.detail}>
                                        <span className={styles.detailLabel}>{t('users.table.email')}:</span>
                                        <span className={styles.detailValue}>{client.contact_email}</span>
                                    </div>
                                )}
                                {client.clickup_folder && (
                                    <div className={styles.detail}>
                                        <span className={styles.detailLabel}>ClickUp:</span>
                                        <span className={styles.detailValue}>{client.clickup_folder}</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.clientFooter}>
                                <span className={styles.clientDate}>
                                    {new Date(client.created_at).toLocaleDateString()}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/clients/edit/${client.id}`)}
                                >
                                    {t('common.edit')}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
