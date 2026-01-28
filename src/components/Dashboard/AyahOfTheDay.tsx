import React, { useState, useEffect } from 'react';
import { BookOpen, X, Eye } from 'lucide-react';
import { Card } from '../UI/Card';
import { surahAyahCounts } from '../../data/quranStats';
import styles from './AyahOfTheDay.module.css';
import { useTranslation } from 'react-i18next';

interface AyahData {
    arabic1: string;
    surahName: string;
    surahNo: number;
    ayahNo: number;
}

export const AyahOfTheDay: React.FC = () => {
    const [ayah, setAyah] = useState<AyahData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState(false); // Default hidden
    const { t } = useTranslation();

    useEffect(() => {
        // Load visibility state
        const savedVisibility = localStorage.getItem('ayahOfTheDayVisible');
        if (savedVisibility === 'true') {
            setIsVisible(true);
        }
        fetchRandomAyah();
    }, []);

    const toggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        const newState = !isVisible;
        setIsVisible(newState);
        localStorage.setItem('ayahOfTheDayVisible', String(newState));
    };

    const fetchRandomAyah = async () => {
        try {
            // Generate random Surah (1-114)
            const randomSurah = Math.floor(Math.random() * 114) + 1;

            // Get max Ayah for this Surah
            const maxAyah = surahAyahCounts[randomSurah - 1];

            // Generate random Ayah (1-maxAyah)
            const randomAyah = Math.floor(Math.random() * maxAyah) + 1;

            const response = await fetch(`https://quranapi.pages.dev/api/${randomSurah}/${randomAyah}.json`);

            if (!response.ok) {
                throw new Error('Failed to fetch ayah');
            }

            const data = await response.json();
            setAyah({
                arabic1: data.arabic1,
                surahName: data.surahName, // English name for reference
                surahNo: data.surahNo,
                ayahNo: data.ayahNo
            });
        } catch (err) {
            console.error('Error fetching ayah:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (error) return null; // Hide on error

    if (!isVisible) {
        return (
            <Card className={`${styles.ayahCard} ${styles.hiddenState}`} onClick={toggleVisibility} hover>
                <div className={styles.showContent}>
                    <Eye size={20} />
                    <span>Show Ayah of the Day</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className={styles.ayahCard} hover>
            <button
                className={styles.closeButton}
                onClick={toggleVisibility}
                title="Hide Ayah of the Day"
            >
                <X size={16} />
            </button>

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Loading Verse...</span>
                </div>
            ) : ayah ? (
                <>
                    <div className={styles.decoration}>
                        <BookOpen size={48} />
                    </div>
                    <div className={styles.content}>
                        <div className={styles.arabicText}>
                            {ayah.arabic1}
                        </div>
                        <div className={styles.reference}>
                            {ayah.surahName} {ayah.surahNo}:{ayah.ayahNo}
                        </div>
                    </div>
                </>
            ) : null}
        </Card>
    );
};
