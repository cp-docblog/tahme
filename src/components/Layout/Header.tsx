import React, { useState } from 'react';
import { Sun, Moon, Languages, Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';

interface HeaderProps {
    onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage();
    const { profile, signOut } = useAuth();
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLanguageToggle = () => {
        const newLang = language === 'ar' ? 'en' : 'ar';
        toggleLanguage();
        i18n.changeLanguage(newLang);
    };

    const handleLogout = async () => {
        setShowUserMenu(false);
        await signOut();
        navigate('/login');
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'var(--color-primary)';
            case 'admin':
                return 'var(--color-warning)';
            case 'staff':
                return 'var(--color-success)';
            default:
                return 'var(--color-text-secondary)';
        }
    };

    return (
        <header className={styles.header}>
            {/* Mobile Menu Button */}
            {onMenuToggle && (
                <button
                    className={styles.menuButton}
                    onClick={onMenuToggle}
                    aria-label="Toggle menu"
                >
                    <Menu size={24} />
                </button>
            )}

            <div className={styles.controls}>
                <button
                    className={styles.controlButton}
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <button
                    className={styles.controlButton}
                    onClick={handleLanguageToggle}
                    aria-label="Toggle language"
                    title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                >
                    <Languages size={20} />
                    <span className={styles.langText}>{language === 'ar' ? 'EN' : 'AR'}</span>
                </button>

                {/* User Profile Menu */}
                {profile && (
                    <div className={styles.userMenu}>
                        <button
                            className={styles.userButton}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            aria-label="User menu"
                        >
                            <div className={styles.userAvatar}>
                                {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>
                                    {profile.full_name || profile.email}
                                </span>
                                <span
                                    className={styles.userRole}
                                    style={{ color: getRoleBadgeColor(profile.role) }}
                                >
                                    {t(`users.roles.${profile.role}`)}
                                </span>
                            </div>
                        </button>

                        {showUserMenu && (
                            <>
                                <div
                                    className={styles.menuOverlay}
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className={styles.userDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <div className={styles.dropdownAvatar}>
                                            {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                                        </div>
                                        <div className={styles.dropdownInfo}>
                                            <div className={styles.dropdownName}>
                                                {profile.full_name || 'بدون اسم'}
                                            </div>
                                            <div className={styles.dropdownEmail}>
                                                {profile.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.dropdownDivider} />
                                    <button
                                        className={styles.logoutButton}
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={18} />
                                        <span>تسجيل الخروج</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};
