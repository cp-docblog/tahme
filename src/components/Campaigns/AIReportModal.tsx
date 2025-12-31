import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './AIReportModal.module.css';

interface AIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    output: string | null;
    loading: boolean;
    error: string | null;
}

export const AIReportModal: React.FC<AIReportModalProps> = ({
    isOpen,
    onClose,
    output,
    loading,
    error
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{t('reports.aiAnalysis')}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    {loading && (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p>{t('common.loading')}</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className={styles.error}>
                            <p>{error}</p>
                        </div>
                    )}

                    {output && !loading && !error && (
                        <div className={styles.markdownContent} dir="auto">
                            <ReactMarkdown>{output}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
