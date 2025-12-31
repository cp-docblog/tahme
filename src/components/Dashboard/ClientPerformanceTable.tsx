import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '../UI/Card';
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

    const handleClientClick = (clientId: string) => {
        navigate(`/campaigns?client=${clientId}`);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <Card>
                <div className={styles.loading}>Loading client data...</div>
            </Card>
        );
    }

    if (!clients || clients.length === 0) {
        return (
            <Card>
                <div className={styles.empty}>No clients found</div>
            </Card>
        );
    }

    return (
        <Card>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Campaigns</th>
                            <th>Spend</th>
                            <th>Revenue</th>
                            <th>ROAS</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => (
                            <tr
                                key={client.id}
                                onClick={() => handleClientClick(client.id)}
                                className={styles.row}
                            >
                                <td>
                                    <div className={styles.clientCell}>
                                        <span className={styles.clientName}>{client.name}</span>
                                        {client.topCampaign && (
                                            <span className={styles.topCampaign}>
                                                Top: {client.topCampaign.name}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className={styles.centered}>{client.campaignCount}</td>
                                <td className={styles.number}>{formatCurrency(client.spend)}</td>
                                <td className={styles.number}>{formatCurrency(client.revenue)}</td>
                                <td className={styles.centered}>
                                    <RoasBadge value={client.roas} />
                                </td>
                                <td className={styles.action}>
                                    <button className={styles.viewButton}>
                                        <ArrowRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
