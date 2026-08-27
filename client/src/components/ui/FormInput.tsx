import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface FormLabelProps {
  htmlFor?: string;
  uppercase?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormLabel({ htmlFor, uppercase, className, children }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block font-label-md text-label-md text-on-surface-variant mb-2', uppercase && 'uppercase tracking-wider', className)}
    >
      {children}
    </label>
  );
}

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  /** Material Symbols glyph rendered inside the field (e.g. `mail`). */
  leadingIcon?: string;
  /** Text prefix inside the field, e.g. `$` for price inputs. */
  prefixText?: string;
  suffix?: ReactNode;
  error?: string;
  hint?: string;
  /**
   * `default` = filled pill focus ring (login screen).
   * `ghost` = transparent bg + gold `.form-input-focus` glow (add/edit room form).
   */
  variant?: 'default' | 'ghost';
}

const inputBase =
  'w-full h-[40px] rounded border font-body-md text-body-md transition-all outline-none disabled:opacity-50';

const variantClasses = {
  default:
    'bg-surface border border-outline-variant text-on-surface placeholder:text-outline focus:border-secondary focus:ring-2 focus:ring-secondary/20',
  ghost: 'bg-transparent border border-outline-variant/50 text-on-background placeholder:text-outline form-input-focus',
} as const;

export function FormInput({
  label,
  leadingIcon,
  prefixText,
  suffix,
  error,
  hint,
  variant = 'default',
  id,
  className,
  ...rest
}: FormInputProps) {
  return (
    <div>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none material-symbols-outlined">
            {leadingIcon}
          </span>
        )}
        {prefixText && (
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            {prefixText}
          </span>
        )}
        <input
          id={id}
          className={cn(
            inputBase,
            variantClasses[variant],
            (leadingIcon || prefixText) && 'pl-10',
            prefixText && 'pl-8',
            suffix && 'pr-10',
            error && 'border-error',
            className,
          )}
          {...rest}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">{suffix}</div>}
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
