import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Optional left vertical accent bar (e.g. `bg-error` on room_details status card). */
  accent?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
} as const;

export function Card({ padding = 'none', accent, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-container-lowest border border-outline-variant/30 custom-shadow-card rounded-xl',
        paddingClasses[padding],
        className,
      )}
      {...rest}
    >
      {accent && <div aria-hidden="true" className={cn('absolute left-0 top-0 bottom-0 w-1', accent)} />}
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Bordered header strip used by dashboard/enhanced_reservations/housekeeping panels. */
export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'p-4 md:p-6 border-b border-outline-variant flex justify-between items-center gap-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="font-headline-sm text-headline-sm text-primary">{title}</h3>
        {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
