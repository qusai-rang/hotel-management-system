import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { FormLabel } from './FormInput';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function FormTextarea({ label, error, hint, id, className, rows = 4, ...rest }: FormTextareaProps) {
  return (
    <div>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      <textarea
        id={id}
        rows={rows}
        className={cn(
          'w-full rounded border border-outline-variant/50 bg-transparent px-3 py-2 font-body-md text-body-md text-on-background placeholder:text-outline form-input-focus transition-all outline-none min-h-[120px] resize-y',
          error && 'border-error',
          className,
        )}
        {...rest}
      />
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
