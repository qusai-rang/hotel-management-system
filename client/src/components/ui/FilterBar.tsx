import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface FilterBarProps {
  /** `card` = enhanced_reservations surface panel; `panel` = room_management bordered strip. */
  variant?: 'card' | 'panel';
  children: ReactNode;
  /** Trailing content pinned to the end (usually the search field). */
  aside?: ReactNode;
  className?: string;
}

export function FilterBar({ variant = 'card', children, aside, className }: FilterBarProps) {
  return (
    <div
      className={
        variant === 'card'
          ? cn('surface-depth-1 bg-surface-container-lowest rounded-xl p-4 mb-6 flex flex-col xl:flex-row gap-4 items-stretch xl:items-end', className)
          : cn('bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-ambient flex flex-wrap items-end gap-4', className)
      }
    >
      {children}
      {aside && <div className="xl:ml-auto w-full xl:w-auto">{aside}</div>}
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  uppercase?: boolean;
  children: ReactNode;
  className?: string;
}

export function FilterField({ label, uppercase, children, className }: FilterFieldProps) {
  return (
    <div className={cn('min-w-[150px]', className)}>
      <label className={cn('block font-label-md text-label-md text-on-surface-variant mb-1.5', uppercase && 'uppercase tracking-wider')}>
        {label}
      </label>
      {children}
    </div>
  );
}

interface FilterSelectProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

export function FilterSelect({ options, value, defaultValue, onChange, placeholder, ariaLabel, className }: FilterSelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        aria-label={ariaLabel ?? placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        className="appearance-none w-full h-10 pl-3 pr-10 py-2 border border-outline-variant rounded font-body-sm text-body-sm text-primary bg-surface-bright cursor-pointer input-luxe transition-all"
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xl text-on-surface-variant" />
    </div>
  );
}
