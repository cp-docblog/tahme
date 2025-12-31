import React, { SelectHTMLAttributes, ReactNode } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
    value: string;
    label: string;
    badge?: ReactNode;
    icon?: ReactNode;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    error?: string;
    options: SelectOption[];
    onChange?: (value: string, option: SelectOption) => void;
    loading?: boolean;
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    options,
    onChange,
    loading,
    placeholder,
    className = '',
    value,
    ...props
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;
        const selectedOption = options.find(opt => opt.value === selectedValue);
        if (onChange && selectedOption) {
            onChange(selectedValue, selectedOption);
        }
    };

    return (
        <div className={styles.selectWrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.selectContainer}>
                <select
                    className={`${styles.select} ${error ? styles.error : ''} ${className}`}
                    onChange={handleChange}
                    value={value}
                    disabled={loading}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {loading && <div className={styles.loader}></div>}
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
