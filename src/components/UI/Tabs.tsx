import React from 'react';
import styles from './Tabs.module.css';

export interface Tab {
    id: string;
    label: string;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsList}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <span className={styles.tabLabel}>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className={styles.tabCount}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
