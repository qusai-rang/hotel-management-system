import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ProgressMeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max?: number;
  barClass?: string;
  trackClass?: string;
  'aria-label'?: string;
}

/** Thin rounded progress track (housekeeping staff schedule / room cleaning progress). */
export function ProgressMeter({ value, max = 100, barClass = 'bg-secondary', trackClass = 'bg-surface-variant', className, ...rest }: ProgressMeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full h-1.5 rounded-full overflow-hidden', trackClass, className)}
      {...rest}
    >
      <div className={cn('h-full rounded-full transition-all duration-500', barClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}
