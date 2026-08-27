import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface StatKpiCardProps {
  /**
   * `trend` = dashboard KPI (label + icon chip, display value, trend caption).
   * `edge` = housekeeping edge-accented counter.
   * `darkAction` = dashboard dark navy action card.
   * `decorative` = billing circle-decorated card.
   */
  variant?: 'trend' | 'edge' | 'darkAction' | 'decorative';
  label: string;
  value: string | number;
  /** Small suffix next to the value (edge variant), e.g. "Rooms". */
  unit?: string;
  icon?: string;
  iconFill?: boolean;
  /** Trend/decorative caption line, e.g. "+2.5% vs last month". */
  caption?: ReactNode;
  /** Classes for the icon chip background/text (trend/edge variants). */
  iconChipClass?: string;
  /** Edge variant: accent bar color class. */
  edgeClass?: string;
  /** darkAction variant: trailing action button. */
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

export function StatKpiCard({
  variant = 'trend',
  label,
  value,
  unit,
  icon,
  iconFill,
  caption,
  iconChipClass = 'bg-primary-fixed text-primary',
  edgeClass = 'bg-secondary',
  actionLabel,
  onActionClick,
  className,
}: StatKpiCardProps) {
  if (variant === 'darkAction') {
    return (
      <div className={cn('bg-primary text-on-primary p-6 rounded-xl shadow-level-1 flex flex-col justify-between relative overflow-hidden', className)}>
        <div>
          <div className="flex justify-between items-start">
            <p className="font-label-lg text-label-lg text-secondary-fixed">{label}</p>
            {icon && <Icon name={icon} className="text-on-primary opacity-70" fill={iconFill} />}
          </div>
          <p className="font-display-lg text-display-lg mt-4 leading-none">{value}</p>
        </div>
        {actionLabel && (
          <button
            type="button"
            onClick={onActionClick}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-container-highest text-on-surface hover:bg-outline-variant transition-colors font-label-lg text-label-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            {actionLabel}
            <Icon name="chevron_right" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'edge') {
    return (
      <div className={cn('surface-card p-4 flex flex-col justify-between relative overflow-hidden group', className)}>
        <div aria-hidden="true" className={cn('absolute left-0 top-0 bottom-0 w-1', edgeClass)} />
        <div className="flex justify-between items-start mb-2">
          <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">{label}</p>
          {icon && (
            <span className={cn('p-1.5 rounded-full', iconChipClass)}>
              <Icon name={icon} fill={iconFill} className="text-base" />
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="font-display-lg text-display-lg text-primary leading-none">{value}</p>
          {unit && <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{unit}</span>}
        </div>
      </div>
    );
  }

  if (variant === 'decorative') {
    return (
      <div className={cn('surface-card p-5 flex justify-between items-start relative overflow-hidden group', className)}>
        <div className="space-y-2 z-10">
          {icon && (
            <div className={cn('p-2 rounded w-fit', iconChipClass)}>
              <Icon name={icon} fill={iconFill} />
            </div>
          )}
          <p className="font-headline-lg text-headline-lg text-primary">{value}</p>
          <p className="text-body-sm text-body-sm text-on-surface-variant">{caption ?? label}</p>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container-high rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"
        />
      </div>
    );
  }

  return (
    <div className={cn('surface-card p-6 flex flex-col justify-between', className)}>
      <div className="flex justify-between items-start mb-4">
        <p className="font-label-lg text-label-lg text-on-surface-variant">{label}</p>
        {icon && (
          <span className={cn('p-2 rounded', iconChipClass)}>
            <Icon name={icon} fill={iconFill} className="text-xl" />
          </span>
        )}
      </div>
      <div>
        <p className="font-display-lg text-display-lg text-primary leading-none mb-1">{value}</p>
        {caption && (
          <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">{caption}</p>
        )}
      </div>
    </div>
  );
}
