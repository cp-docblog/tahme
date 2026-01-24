import React, { useState, useEffect } from 'react';
import { Building2, ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { PlatformCards } from '../components/Campaigns/PlatformCards';
import { CampaignsList } from '../components/Campaigns/CampaignsList';
import { AdSquadsList } from '../components/Campaigns/AdSquadsList';
import { AdsList } from '../components/Campaigns/AdsList';
import { AdReport } from '../components/Campaigns/AdReport';
import { FbCampaignsList } from '../components/Campaigns/FbCampaignsList';
import { FbAdSetsList } from '../components/Campaigns/FbAdSetsList';
import { FbAdsList } from '../components/Campaigns/FbAdsList';
import { FbAdReport } from '../components/Campaigns/FbAdReport';
import { TtCampaignsList } from '../components/Campaigns/TtCampaignsList';
import { TtAdGroupsList } from '../components/Campaigns/TtAdGroupsList';
import { TtAdsList } from '../components/Campaigns/TtAdsList';
import { TtAdReport } from '../components/Campaigns/TtAdReport';
import styles from './Campaigns.module.css';

interface Client {
    id: string;
    name: string;
    snapchat_ad_account_id: string | null;
    snapchat_ad_account_name: string | null;
    facebook_ad_account_id: string | null;
    facebook_ad_account_name: string | null;
    facebook_access_token: string | null;
    tiktok_advertiser_id: string | null;
    tiktok_advertiser_name: string | null;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
}

interface AdSquad {
    id: string;
    name: string;
    status: string;
}

interface Ad {
    id: string;
    name: string;
    status?: string;
    [key: string]: any;
}

type Platform = 'snapchat' | 'tiktok' | 'facebook';

export const Campaigns: React.FC = () => {
    const { t } = useTranslation();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation state
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [selectedAdSquad, setSelectedAdSquad] = useState<AdSquad | null>(null);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, snapchat_ad_account_id, snapchat_ad_account_name, facebook_ad_account_id, facebook_ad_account_name, facebook_access_token, tiktok_advertiser_id, tiktok_advertiser_name')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setSelectedPlatform(null);
        setSelectedCampaign(null);
        setSelectedAdSquad(null);
        setSelectedAd(null);
    };

    const handleSelectPlatform = (platform: Platform) => {
        setSelectedPlatform(platform);
        setSelectedCampaign(null);
        setSelectedAdSquad(null);
        setSelectedAd(null);
    };

    const handleSelectCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setSelectedAdSquad(null);
        setSelectedAd(null);
    };

    const handleSelectAdSquad = (adsquad: AdSquad) => {
        setSelectedAdSquad(adsquad);
        setSelectedAd(null);
    };

    const handleSelectAd = (ad: Ad) => {
        setSelectedAd(ad);
    };

    const handleBack = () => {
        if (selectedAd) {
            setSelectedAd(null);
        } else if (selectedAdSquad) {
            setSelectedAdSquad(null);
        } else if (selectedCampaign) {
            setSelectedCampaign(null);
        } else if (selectedPlatform) {
            setSelectedPlatform(null);
        } else if (selectedClient) {
            setSelectedClient(null);
        }
    };

    const renderBreadcrumb = () => {
        const items = [t('campaigns.title')];

        if (selectedClient) items.push(selectedClient.name);
        if (selectedPlatform) items.push(selectedPlatform);
        if (selectedCampaign) items.push(selectedCampaign.name);
        if (selectedAdSquad) items.push(selectedAdSquad.name);
        if (selectedAd) items.push(selectedAd.name);

        return (
            <div className={styles.breadcrumb}>
                <button onClick={() => {
                    setSelectedClient(null);
                    setSelectedPlatform(null);
                    setSelectedCampaign(null);
                    setSelectedAdSquad(null);
                    setSelectedAd(null);
                }} className={styles.breadcrumbHome}>
                    <Home size={16} />
                </button>
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <ChevronRight size={16} className={styles.breadcrumbSeparator} />
                        <span className={index === items.length - 1 ? styles.breadcrumbActive : styles.breadcrumbItem}>
                            {item}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Determine which view to show
    const showClientsList = !selectedClient;
    const showPlatformCards = selectedClient && !selectedPlatform;

    // Snapchat views
    const showSnapCampaignsList = selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id && !selectedCampaign;
    const showSnapAdSquadsList = selectedCampaign && selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id && !selectedAdSquad;
    const showSnapAdsList = selectedAdSquad && selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id && !selectedAd;
    const showSnapAdReport = selectedAd && selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id;

    // Facebook views
    const showFbCampaignsList = selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id && !selectedCampaign;
    const showFbAdSetsList = selectedCampaign && selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id && !selectedAdSquad;
    const showFbAdsList = selectedAdSquad && selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id && !selectedAd;
    const showFbAdReport = selectedAd && selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id;

    // TikTok views
    const showTtCampaignsList = selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id && !selectedCampaign;
    const showTtAdGroupsList = selectedCampaign && selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id && !selectedAdSquad;
    const showTtAdsList = selectedAdSquad && selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id && !selectedAd;
    const showTtAdReport = selectedAd && selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id;

    return (
        <div className={styles.campaigns}>
            {/* Clients List View */}
            <div style={{ display: showClientsList ? 'block' : 'none' }}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{t('campaigns.title')}</h1>
                        <p className={styles.subtitle}>{t('campaigns.selectClient')}</p>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>{t('common.loading')}</div>
                ) : clients.length === 0 ? (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyIcon}><Building2 size={48} /></div>
                        <h3 className={styles.emptyTitle}>{t('campaigns.noClients')}</h3>
                        <p className={styles.emptyText}>{t('campaigns.addClientFirst')}</p>
                    </Card>
                ) : (
                    <div className={styles.clientsGrid}>
                        {clients.map((client) => (
                            <Card
                                key={client.id}
                                className={styles.clientCard}
                                hover
                                onClick={() => handleSelectClient(client)}
                            >
                                <div className={styles.clientHeader}>
                                    <div className={styles.clientIcon}><Building2 size={24} /></div>
                                    <h3 className={styles.clientName}>{client.name}</h3>
                                </div>
                                <div className={styles.clientFooter}>
                                    {client.snapchat_ad_account_name && (
                                        <span className={styles.adAccountBadge}>
                                            Snapchat: {client.snapchat_ad_account_name}
                                        </span>
                                    )}
                                    {client.facebook_ad_account_name && (
                                        <span className={styles.adAccountBadge}>
                                            Facebook: {client.facebook_ad_account_name}
                                        </span>
                                    )}
                                    {client.tiktok_advertiser_name && (
                                        <span className={styles.adAccountBadge}>
                                            TikTok: {client.tiktok_advertiser_name}
                                        </span>
                                    )}
                                    <ChevronRight size={20} className={styles.arrow} />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Platform Selection View */}
            {selectedClient && (
                <div style={{ display: showPlatformCards ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.selectPlatform')}</h1>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <PlatformCards
                        clientName={selectedClient.name}
                        onSelectPlatform={handleSelectPlatform}
                    />
                </div>
            )}

            {/* Snapchat Campaigns List View */}
            {selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id && (
                <div style={{ display: showSnapCampaignsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.campaignsFor')} {selectedClient.name}</h1>
                            <p className={styles.subtitle}>{selectedPlatform}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <CampaignsList
                        clientId={selectedClient.id}
                        adAccountId={selectedClient.snapchat_ad_account_id}
                        onSelectCampaign={handleSelectCampaign}
                    />
                </div>
            )}

            {/* Facebook Campaigns List View */}
            {selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id && selectedClient?.facebook_access_token && (
                <div style={{ display: showFbCampaignsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.campaignsFor')} {selectedClient.name}</h1>
                            <p className={styles.subtitle}>{selectedPlatform}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <FbCampaignsList
                        clientId={selectedClient.id}
                        adAccountId={selectedClient.facebook_ad_account_id}
                        accessToken={selectedClient.facebook_access_token}
                        onSelectCampaign={handleSelectCampaign}
                    />
                </div>
            )}

            {/* Snapchat Ad Squads List View */}
            {selectedCampaign && selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id && (
                <div style={{ display: showSnapAdSquadsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.adSquadsInCampaign')}</h1>
                            <p className={styles.subtitle}>{selectedCampaign.name}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <AdSquadsList
                        adAccountId={selectedClient.snapchat_ad_account_id}
                        campaignId={selectedCampaign.id}
                        onSelectAdSquad={handleSelectAdSquad}
                    />
                </div>
            )}

            {/* Facebook Ad Sets List View */}
            {selectedCampaign && selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id && selectedClient?.facebook_access_token && (
                <div style={{ display: showFbAdSetsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.adSetsInCampaign')}</h1>
                            <p className={styles.subtitle}>{selectedCampaign.name}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <FbAdSetsList
                        adAccountId={selectedClient.facebook_ad_account_id}
                        accessToken={selectedClient.facebook_access_token}
                        campaignId={selectedCampaign.id}
                        onSelectAdSet={handleSelectAdSquad}
                    />
                </div>
            )}

            {/* Snapchat Ads List View */}
            {selectedAdSquad && selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id && (
                <div style={{ display: showSnapAdsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.adsInAdSquad')}</h1>
                            <p className={styles.subtitle}>{selectedAdSquad.name}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <AdsList
                        adAccountId={selectedClient.snapchat_ad_account_id}
                        adsquadId={selectedAdSquad.id}
                        onSelectAd={handleSelectAd}
                    />
                </div>
            )}

            {/* Facebook Ads List View */}
            {selectedAdSquad && selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id && selectedClient?.facebook_access_token && (
                <div style={{ display: showFbAdsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.adsInAdSet')}</h1>
                            <p className={styles.subtitle}>{selectedAdSquad.name}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <FbAdsList
                        adAccountId={selectedClient.facebook_ad_account_id}
                        accessToken={selectedClient.facebook_access_token}
                        adsetId={selectedAdSquad.id}
                        onSelectAd={handleSelectAd}
                    />
                </div>
            )}

            {/* Snapchat Ad Report View */}
            {selectedAd && selectedPlatform === 'snapchat' && selectedClient?.snapchat_ad_account_id && (
                <div style={{ display: showSnapAdReport ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('reports.adPerformance')}</h1>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <AdReport
                        adId={selectedAd.id}
                        adName={selectedAd.name}
                        adAccountId={selectedClient.snapchat_ad_account_id}
                    />
                </div>
            )}

            {/* Facebook Ad Report View */}
            {selectedAd && selectedPlatform === 'facebook' && selectedClient?.facebook_ad_account_id && selectedClient?.facebook_access_token && (
                <div style={{ display: showFbAdReport ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('reports.adPerformance')}</h1>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <FbAdReport
                        adId={selectedAd.id}
                        adName={selectedAd.name}
                        adAccountId={selectedClient.facebook_ad_account_id}
                        accessToken={selectedClient.facebook_access_token}
                    />
                </div>
            )}

            {/* TikTok Campaigns List View */}
            {selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id && (
                <div style={{ display: showTtCampaignsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.campaignsFor')} {selectedClient.name}</h1>
                            <p className={styles.subtitle}>{selectedPlatform}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <TtCampaignsList
                        clientId={selectedClient.id}
                        advertiserId={selectedClient.tiktok_advertiser_id}
                        onSelectCampaign={handleSelectCampaign}
                    />
                </div>
            )}

            {/* TikTok Ad Groups List View */}
            {selectedCampaign && selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id && (
                <div style={{ display: showTtAdGroupsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.adGroupsInCampaign')}</h1>
                            <p className={styles.subtitle}>{selectedCampaign.name}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <TtAdGroupsList
                        advertiserId={selectedClient.tiktok_advertiser_id}
                        campaignId={selectedCampaign.id}
                        onSelectAdGroup={handleSelectAdSquad}
                    />
                </div>
            )}

            {/* TikTok Ads List View */}
            {selectedAdSquad && selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id && (
                <div style={{ display: showTtAdsList ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('campaigns.adsInAdGroup')}</h1>
                            <p className={styles.subtitle}>{selectedAdSquad.name}</p>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <TtAdsList
                        advertiserId={selectedClient.tiktok_advertiser_id}
                        adgroupId={selectedAdSquad.id}
                        onSelectAd={handleSelectAd}
                    />
                </div>
            )}

            {/* TikTok Ad Report View */}
            {selectedAd && selectedPlatform === 'tiktok' && selectedClient?.tiktok_advertiser_id && (
                <div style={{ display: showTtAdReport ? 'block' : 'none' }}>
                    <div className={styles.header}>
                        <div>
                            {renderBreadcrumb()}
                            <h1 className={styles.title}>{t('reports.adPerformance')}</h1>
                        </div>
                        <Button variant="outline" onClick={handleBack}>
                            {t('common.back')}
                        </Button>
                    </div>
                    <TtAdReport
                        adId={selectedAd.id}
                        adName={selectedAd.name}
                        advertiserId={selectedClient.tiktok_advertiser_id}
                    />
                </div>
            )}
        </div>
    );
};
