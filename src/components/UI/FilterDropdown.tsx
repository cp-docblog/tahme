import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter, ArrowUpDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './FilterDropdown.module.css';

export type SortMetric = 'roas' | 'purchases' | 'costPerPurchase' | 'spend' | 'cpc' | 'impressions';
export type FilterOperator = 'gt' | 'lt' | 'eq';

export interface SortOption {
    value: SortMetric;
    label: string;
}

export interface FilterState {
    metric: SortMetric;
    operator: FilterOperator;
    value: number | null;
}

interface SortDropdownProps {
    value: SortMetric;
    onChange: (value: SortMetric) => void;
    options?: SortOption[];
}

interface FilterDropdownProps {
    filter: FilterState | null;
    onFilterChange: (filter: FilterState | null) => void;
    sortBy: SortMetric;
    onSortChange: (value: SortMetric) => void;
    sortOptions?: SortOption[];
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange, options }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const defaultOptions: SortOption[] = [
        { value: 'roas', label: t('sorting.roas') },
        { value: 'purchases', label: t('sorting.purchases') },
        { value: 'costPerPurchase', label: t('sorting.costPerPurchase') },
        { value: 'spend', label: t('sorting.spend') }
    ];

    const sortOptions = options || defaultOptions;
    const selectedOption = sortOptions.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.sortDropdown} ref={dropdownRef}>
            <button
                className={styles.dropdownTrigger}
                onClick={() => setIsOpen(!isOpen)}
            >
                <ArrowUpDown size={16} />
                <span>{t('sorting.sortBy')}: {selectedOption?.label}</span>
                <ChevronDown size={16} className={isOpen ? styles.rotated : ''} />
            </button>
            {isOpen && (
                <div className={styles.dropdownMenu}>
                    {sortOptions.map(option => (
                        <button
                            key={option.value}
                            className={`${styles.menuItem} ${value === option.value ? styles.active : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
    filter,
    onFilterChange,
    sortBy,
    onSortChange,
    sortOptions
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [localFilter, setLocalFilter] = useState<FilterState>(filter || {
        metric: 'roas',
        operator: 'gt',
        value: null
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const defaultSortOptions: SortOption[] = [
        { value: 'roas', label: t('sorting.roas') },
        { value: 'purchases', label: t('sorting.purchases') },
        { value: 'costPerPurchase', label: t('sorting.costPerPurchase') },
        { value: 'spend', label: t('sorting.spend') },
        { value: 'impressions', label: t('sorting.impressions') }
    ];

    const metricOptions = sortOptions || defaultSortOptions;

    const operatorOptions = [
        { value: 'gt' as FilterOperator, label: t('sorting.greaterThan') },
        { value: 'lt' as FilterOperator, label: t('sorting.lessThan') }
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleApply = () => {
        if (localFilter.value !== null) {
            onFilterChange(localFilter);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        onFilterChange(null);
        setLocalFilter({ metric: 'roas', operator: 'gt', value: null });
        setIsOpen(false);
    };

    const hasActiveFilter = filter !== null && filter.value !== null;

    return (
        <div className={styles.filterContainer}>
            {/* Sort Dropdown */}
            <SortDropdown
                value={sortBy}
                onChange={onSortChange}
                options={metricOptions}
            />

            {/* Filter Dropdown */}
            <div className={styles.filterDropdown} ref={dropdownRef}>
                <button
                    className={`${styles.dropdownTrigger} ${hasActiveFilter ? styles.hasFilter : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Filter size={16} />
                    <span>{t('sorting.filterBy')}</span>
                    {hasActiveFilter && (
                        <span className={styles.filterBadge}>1</span>
                    )}
                    <ChevronDown size={16} className={isOpen ? styles.rotated : ''} />
                </button>

                {isOpen && (
                    <div className={styles.filterMenu}>
                        <div className={styles.filterRow}>
                            <select
                                className={styles.filterSelect}
                                value={localFilter.metric}
                                onChange={(e) => setLocalFilter({ ...localFilter, metric: e.target.value as SortMetric })}
                            >
                                {metricOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterRow}>
                            <select
                                className={styles.filterSelect}
                                value={localFilter.operator}
                                onChange={(e) => setLocalFilter({ ...localFilter, operator: e.target.value as FilterOperator })}
                            >
                                {operatorOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterRow}>
                            <input
                                type="number"
                                className={styles.filterInput}
                                placeholder="0"
                                value={localFilter.value ?? ''}
                                onChange={(e) => setLocalFilter({
                                    ...localFilter,
                                    value: e.target.value ? parseFloat(e.target.value) : null
                                })}
                            />
                        </div>

                        <div className={styles.filterActions}>
                            {hasActiveFilter && (
                                <button className={styles.clearBtn} onClick={handleClear}>
                                    <X size={14} />
                                    {t('sorting.clearFilter')}
                                </button>
                            )}
                            <button className={styles.applyBtn} onClick={handleApply}>
                                {t('sorting.applyFilter')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
