import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className={styles.layout}>
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            <div className={styles.content}>
                <Header onMenuToggle={toggleSidebar} />
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    );
};
