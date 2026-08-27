import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

/**
 * Every tone maps 1:1 to a pill observed in the Stitch screens.
 * - `dirty` / `maintenance` etc. (dot style) come from rooms_luxestay_pro.
 * - `inProgress` / `dirtyAlert` / `outOfService` / `needsInspection` come from housekeeping_dashboard.
 * - `alert` is the solid red "Occupied" pill from room_details.
 * - `cleaning` is the flat blue pill from room_management_grid_view.
 */
export type StatusTone =
  | 'confirmed'
  | 'checkedIn'
  | 'pending'
  | 'cancelled'
  | 'available'
  | 'occupied'
  | 'dirty'
  | 'maintenance'
  | 'cleaning'
  | 'alert'
  | 'inProgress'
  | 'dirtyAlert'
  | 'outOfService'
  | 'needsInspection'
  | 'paid'
  | 'paymentPending'
  | 'refunded'
  | 'completed'
  | 'pendingArrival'
  | 'checkedInDark'
  | 'platinum'
  | 'neutral';

interface ToneStyle {
  badge: string;
  dot?: string;
}

const tones: Record<StatusTone, ToneStyle> = {
  confirmed: { badge: 'bg-[#ecfdf5] text-[#065f46]' },
  checkedIn: { badge: 'bg-[#eff4ff] text-[#1e40af] border border-[#bfdbfe]' },
  pending: { badge: 'bg-[#fef3c7] text-[#92400e]' },
  cancelled: { badge: 'bg-[#fce7f3] text-[#9d174d]' },
  available: { badge: 'border border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  occupied: { badge: 'border border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  dirty: { badge: 'border border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  maintenance: { badge: 'border border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
  cleaning: { badge: 'bg-[#3b82f6]/10 text-[#1e40af]' },
  alert: { badge: 'bg-red-100 text-red-800' },
  inProgress: { badge: 'bg-secondary-container text-on-secondary-container' },
  dirtyAlert: { badge: 'bg-error-container text-on-error-container' },
  outOfService: { badge: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  needsInspection: { badge: 'bg-primary-fixed text-primary' },
  paid: { badge: 'bg-surface-container-high text-primary' },
  paymentPending: {
    badge: 'border border-secondary-container bg-secondary-container/30 text-on-secondary-container',
  },
  refunded: { badge: 'border border-error-container bg-error-container/30 text-on-error-container' },
  completed: { badge: 'bg-surface-variant text-primary' },
  pendingArrival: { badge: 'bg-secondary-container text-on-secondary-container' },
  checkedInDark: { badge: 'bg-primary text-on-primary' },
  platinum: { badge: 'bg-secondary-fixed/20 text-secondary' },
  neutral: { badge: 'bg-surface-container-high text-primary' },
};

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
  /** Optional leading Material Symbols glyph (e.g. `warning`, `sync`, `build`). */
  icon?: string;
  /** Spin the leading icon (used for the housekeeping "Cleaning" sync glyph). */
  spin?: boolean;
  children: React.ReactNode;
}

export function StatusBadge({ tone, icon, spin, className, children, ...rest }: StatusBadgeProps) {
  const style = tones[tone];
  const bordered = style.badge.includes('border') || Boolean(style.dot);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-label-md text-label-md whitespace-nowrap',
        bordered ? 'px-2.5 py-0.5' : 'px-3 py-1',
        style.badge,
        className,
      )}
      {...rest}
    >
      {style.dot && <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />}
      {icon && <Icon name={icon} fill={!style.dot} className={cn('text-xs', spin && 'animate-spin')} />}
      {children}
    </span>
  );
}
