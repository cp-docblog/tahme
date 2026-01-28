import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, TrendingUp, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { t } = useTranslation();
    const { user, profile, signOut } = useAuth();

    const menuItems = [
        { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/campaigns', label: t('nav.campaigns'), icon: TrendingUp },
        { path: '/users', label: t('nav.users'), icon: Users },
        { path: '/clients', label: t('nav.clients'), icon: Building2 },
    ];

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'U';

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

                {/* User Profile Section */}
                {user && (
                    <div className={styles.userProfile}>
                        <div className={styles.userAvatar}>
                            {userInitials}
                        </div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>
                                {profile?.full_name || user.email}
                            </div>
                            <div className={styles.userRole}>
                                {profile?.role || 'User'}
                            </div>
                        </div>
                        <button
                            className={styles.logoutBtn}
                            onClick={handleLogout}
                            title={t('auth.signOut') || 'Sign Out'}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}

                <div className={styles.footer}>
                    <p className={styles.footerText}>{t('footer.copyright')}</p>
                    <p className={styles.footerSubtext}>
                        {t('footer.createdBy')} <a href="https://www.cp-devcode.com" target="_blank" rel="noopener noreferrer" className={styles.brandName}>{t('footer.cyiperDevcode')}</a>
                    </p>
                </div>
            </aside>
        </>
    );
};
