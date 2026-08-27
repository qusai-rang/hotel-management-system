import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import type { SelectOption } from '@/types';

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  variant?: 'form' | 'filter';
}

/** Select with the expand_more caret overlay used across every Stitch form/filter. */
export function FormSelect({ label, options, placeholder, error, hint, variant = 'form', id, className, ...rest }: FormSelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block font-label-md text-label-md text-on-surface-variant mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={cn(
            'appearance-none w-full h-[40px] pl-3 pr-10 rounded border cursor-pointer font-body-md text-body-md transition-all outline-none disabled:opacity-50',
            variant === 'form'
              ? 'bg-transparent border-outline-variant/50 text-on-background form-input-focus'
              : 'bg-surface-bright border-outline-variant text-primary input-luxe font-body-sm text-body-sm h-10',
            error && 'border-error',
            className,
          )}
          {...rest}
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
        <span
          aria-hidden="true"
          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
        >
          expand_more
        </span>
      </div>
      {error ? (
        <p role="alert" className="font-label-md text-label-md text-error mt-1.5">
          {error}
        </p>
      ) : hint ? (
        <p className="font-label-md text-label-md text-on-surface-variant mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}
