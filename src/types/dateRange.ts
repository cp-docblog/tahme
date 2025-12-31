export interface DateRange {
    start: Date | null;
    end: Date | null;
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export interface DateRangePresetConfig {
    key: DateRangePreset;
    labelKey: string;
    getDates: () => DateRange;
}

export const DATE_RANGE_PRESETS: DateRangePresetConfig[] = [
    {
        key: 'today',
        labelKey: 'reports.dateRange.today',
        getDates: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0); // Next day at 00:00:00
            return { start, end };
        }
    },
    {
        key: 'yesterday',
        labelKey: 'reports.dateRange.yesterday',
        getDates: () => {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
            const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            return { start, end };
        }
    },
    {
        key: 'last7days',
        labelKey: 'reports.dateRange.last7Days',
        getDates: () => {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            const start = new Date(yesterday);
            start.setDate(start.getDate() - 6); // 7 days total including yesterday
            start.setHours(0, 0, 0, 0);
            return { start, end };
        }
    },
    {
        key: 'last30days',
        labelKey: 'reports.dateRange.last30Days',
        getDates: () => {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            const start = new Date(yesterday);
            start.setDate(start.getDate() - 29); // 30 days total including yesterday
            start.setHours(0, 0, 0, 0);
            return { start, end };
        }
    },
    {
        key: 'custom',
        labelKey: 'reports.dateRange.custom',
        getDates: () => {
            // Custom will be handled by the DateRangePicker component
            // Return current date range or null
            return { start: null, end: null };
        }
    }
];
