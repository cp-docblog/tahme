import React from 'react';
import { useTranslation } from 'react-i18next';
import { DateRange, DateRangePreset, DATE_RANGE_PRESETS } from '../../types/dateRange';
import styles from './DateRangePicker.module.css';

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [isCustomMode, setIsCustomMode] = React.useState(false);

    // Derive the selected preset from the actual date range value
    const getPresetFromDateRange = (range: DateRange): DateRangePreset => {
        // If we're in custom mode, stay in custom
        if (isCustomMode) {
            return 'custom';
        }

        if (!range.start || !range.end) {
            return 'last30days';
        }

        // Check if the current range matches any preset
        for (const preset of DATE_RANGE_PRESETS) {
            if (preset.key === 'custom') continue;

            const presetDates = preset.getDates();
            if (!presetDates.start || !presetDates.end) continue;

            // Compare dates (ignoring time)
            const rangeStart = new Date(range.start).setHours(0, 0, 0, 0);
            const rangeEnd = new Date(range.end).setHours(0, 0, 0, 0);
            const presetStart = new Date(presetDates.start).setHours(0, 0, 0, 0);
            const presetEnd = new Date(presetDates.end).setHours(0, 0, 0, 0);

            if (rangeStart === presetStart && rangeEnd === presetEnd) {
                return preset.key;
            }
        }

        return 'custom';
    };

    const selectedPreset = getPresetFromDateRange(value);

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetKey = e.target.value as DateRangePreset;

        // Track when user switches to custom mode
        if (presetKey === 'custom') {
            setIsCustomMode(true);
            // Keep current dates if they exist, otherwise set to null
            if (!value.start || !value.end) {
                onChange({ start: null, end: null });
            }
            return;
        }

        // User selected a preset, exit custom mode
        setIsCustomMode(false);
        const preset = DATE_RANGE_PRESETS.find(p => p.key === presetKey);
        if (preset) {
            onChange(preset.getDates());
        }
    };

    // Format date for HTML5 input (YYYY-MM-DD)
    const formatDateForInput = (date: Date | null): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Parse date from HTML5 input
    const parseDateFromInput = (dateString: string): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        // Set to start of day
        date.setHours(0, 0, 0, 0);
        return date;
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const startDate = parseDateFromInput(e.target.value);
        onChange({ start: startDate, end: value.end });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const endDate = parseDateFromInput(e.target.value);
        if (endDate) {
            // Set to end of day
            endDate.setHours(23, 59, 59, 999);
        }
        onChange({ start: value.start, end: endDate });
    };

    // Get max date (today) for date inputs
    const maxDate = formatDateForInput(new Date());

    return (
        <div className={styles.container}>
            <label className={styles.label}>{t('reports.dateRange.label')}</label>
            <select
                className={styles.select}
                value={selectedPreset}
                onChange={handlePresetChange}
            >
                {DATE_RANGE_PRESETS.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                        {t(preset.labelKey)}
                    </option>
                ))}
            </select>

            {/* Custom date inputs - show when 'custom' is selected */}
            {selectedPreset === 'custom' && (
                <div className={styles.customDateInputs}>
                    <div className={styles.dateInput}>
                        <label className={styles.dateLabel}>{t('reports.dateRange.startDate')}</label>
                        <input
                            type="date"
                            className={styles.dateInputField}
                            value={formatDateForInput(value.start)}
                            onChange={handleStartDateChange}
                            max={maxDate}
                        />
                    </div>
                    <div className={styles.dateInput}>
                        <label className={styles.dateLabel}>{t('reports.dateRange.endDate')}</label>
                        <input
                            type="date"
                            className={styles.dateInputField}
                            value={formatDateForInput(value.end)}
                            onChange={handleEndDateChange}
                            min={formatDateForInput(value.start)}
                            max={maxDate}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
