import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { t } = useTranslation();

    const menuItems = [
        { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/users', label: t('nav.users'), icon: Users },
        { path: '/clients', label: t('nav.clients'), icon: Building2 },
        { path: '/campaigns', label: t('nav.campaigns'), icon: TrendingUp },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${!isOpen ? styles.hidden : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${!isOpen ? styles.closed : ''}`}>
                <div className={styles.logo}>
                    <img src="/logo.png" alt={t('app.name')} className={styles.logoImage} />
                    <h2 className={styles.logoText}>{t('app.name')}</h2>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
                                onClick={onClose}
                            >
                                <Icon className={styles.icon} size={20} />
                                <span className={styles.label}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <p className={styles.footerText}>{t('footer.copyright')}</p>
                    <p className={styles.footerSubtext}>
                        {t('footer.createdBy')} <strong>{t('footer.cyiperDevcode')}</strong> {t('footer.for')} {t('footer.tashweesh')}
                    </p>
                </div>
            </aside>
        </>
    );
};
