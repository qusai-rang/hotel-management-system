import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  rounded?: 'full' | 'default';
  wrapperClassName?: string;
}

/** Topbar / filter search pill with leading magnifier. */
export function SearchInput({ value, onChange, rounded = 'full', wrapperClassName, className, ...rest }: SearchInputProps) {
  return (
    <div
      className={cn(
        'relative w-64 focus-within:ring-2 focus-within:ring-secondary-container rounded-full',
        rounded === 'default' && 'rounded-DEFAULT',
        wrapperClassName,
      )}
    >
      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'w-full h-10 pl-10 pr-4 bg-surface rounded-full border border-outline-variant text-body-sm text-on-surface placeholder:text-outline outline-none focus:border-secondary transition-all',
          rounded === 'default' && 'rounded-DEFAULT',
          className,
        )}
        {...rest}
      />
    </div>
  );
}
