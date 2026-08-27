import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import type { StatusTone } from '@/components/ui/StatusBadge';
import type { RoomStatus } from '@/types';

/**
 * Faithful merge of the two Stitch room cards:
 * - rooms_luxestay_pro (glass header strip, meta row, guest box)
 * - room_management_grid_view (accent edge, priority note, cleaning progress)
 */
export interface RoomCardProps {
  number: string;
  type: string;
  status: RoomStatus;
  /** Override the automatic tone mapping if a screen needs a special pill. */
  statusLabel?: string;
  floor?: string;
  capacity?: string;
  rate?: string;
  guestName?: string;
  guestNote?: string;
  guestInitials?: string;
  guestAvatarUrl?: string;
  /** Priority line under the guest box (room_management "Priority Checkout" style). */
  priorityNote?: string;
  className?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onCardClick?: () => void;
}

export function RoomCard({
  number,
  type,
  status,
  statusLabel,
  floor,
  capacity,
  rate,
  guestName,
  guestNote,
  guestInitials,
  guestAvatarUrl,
  priorityNote,
  className,
  children,
  actions,
  onCardClick,
}: RoomCardProps) {
  const accent = roomAccentClass(status);
  return (
    <article
      onClick={onCardClick}
      className={cn(
        'relative flex flex-col h-full bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-ambient hover:shadow-md transition-shadow',
        onCardClick && 'cursor-pointer group',
        className,
      )}
    >
      <div aria-hidden="true" className={cn('absolute top-0 bottom-0 left-0 w-1.5', accent)} />
      <div className="p-5 pl-7 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary leading-none">Room {number}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{type}</p>
          </div>
          <RoomStatusPill status={status} label={statusLabel} />
        </div>

        {(floor || capacity || rate) && (
          <div className="grid grid-cols-3 gap-x-2 gap-y-2 py-3 border-y border-outline-variant/30 mb-4">
            {floor && (
              <div>
                <p className="text-[10px] font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-0.5">Floor</p>
                <p className="font-label-lg text-label-lg text-primary">{floor}</p>
              </div>
            )}
            {capacity && (
              <div>
                <p className="text-[10px] font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-0.5">Guests</p>
                <p className="font-label-lg text-label-lg text-primary">{capacity}</p>
              </div>
            )}
            {rate && (
              <div>
                <p className="text-[10px] font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-0.5">Rate</p>
                <p className="font-label-lg text-label-lg text-secondary font-semibold">{rate}</p>
              </div>
            )}
          </div>
        )}

        {children}

        {guestName && (
          <div className="mt-auto pt-4">
            <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-lg">
              <Avatar src={guestAvatarUrl} initials={guestInitials ?? guestName.slice(0, 1)} size="sm" alt={guestName} />
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-primary truncate">{guestName}</p>
                {guestNote && <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{guestNote}</p>}
              </div>
            </div>
            {priorityNote && (
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                <Icon name="priority_high" fill className="text-sm text-error" />
                {priorityNote}
              </p>
            )}
          </div>
        )}
      </div>

      {actions && (
        <footer className="bg-surface px-5 pl-7 py-3 border-t border-outline-variant flex justify-between items-center gap-2">{actions}</footer>
      )}
    </article>
  );
}

export function RoomStatusPill({ status, label }: { status: RoomStatus; label?: string }) {
  const tone = roomStatusTone(status);
  const iconByTone: Partial<Record<StatusTone, string>> = {
    inProgress: 'sync',
    dirtyAlert: 'warning',
    outOfService: 'build',
    needsInspection: 'visibility',
  };
  const icon = iconByTone[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-md text-label-md whitespace-nowrap shrink-0',
        toneClasses[tone],
      )}
    >
      {icon === 'sync' ? (
        <Icon name="sync" className="text-xs animate-spin" />
      ) : icon ? (
        <Icon name={icon} fill className="text-xs" />
      ) : null}
      {label ?? statusLabelDefault(status)}
    </span>
  );
}

const toneClasses: Record<StatusTone, string> = {
  confirmed: 'bg-[#ecfdf5] text-[#065f46]',
  checkedIn: 'bg-[#eff4ff] text-[#1e40af] border border-[#bfdbfe]',
  pending: 'bg-[#fef3c7] text-[#92400e]',
  cancelled: 'bg-[#fce7f3] text-[#9d174d]',
  available: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  occupied: 'border border-blue-200 bg-blue-50 text-blue-700',
  dirty: 'border border-amber-200 bg-amber-50 text-amber-700',
  maintenance: 'border border-red-200 bg-red-50 text-red-700',
  cleaning: 'bg-[#3b82f6]/10 text-[#1e40af]',
  alert: 'bg-red-100 text-red-800',
  inProgress: 'bg-secondary-container text-on-secondary-container',
  dirtyAlert: 'bg-error-container text-on-error-container',
  outOfService: 'bg-tertiary-fixed text-on-tertiary-fixed',
  needsInspection: 'bg-primary-fixed text-primary',
  paid: 'bg-surface-container-high text-primary',
  paymentPending: 'bg-secondary-container/30 border border-secondary-container text-on-secondary-container',
  refunded: 'bg-error-container/30 border border-error-container text-on-error-container',
  completed: 'bg-surface-variant text-primary',
  pendingArrival: 'bg-secondary-container text-on-secondary-container',
  checkedInDark: 'bg-primary text-on-primary',
  platinum: 'bg-secondary-fixed/20 text-secondary',
  neutral: 'bg-surface-container-high text-primary',
};

function roomStatusTone(status: RoomStatus): StatusTone {
  switch (status) {
    case 'available':
      return 'available';
    case 'occupied':
      return 'occupied';
    case 'dirty':
      return 'dirtyAlert';
    case 'cleaning':
      return 'inProgress';
    case 'needs-inspection':
      return 'needsInspection';
    case 'maintenance':
      return 'outOfService';
  }
}

function roomAccentClass(status: RoomStatus): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-500';
    case 'occupied':
      return 'bg-blue-500';
    case 'dirty':
      return 'bg-amber-500';
    case 'cleaning':
      return 'bg-secondary';
    case 'needs-inspection':
      return 'bg-primary';
    case 'maintenance':
      return 'bg-red-500';
  }
}

function statusLabelDefault(status: RoomStatus): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'occupied':
      return 'Occupied';
    case 'dirty':
      return 'Dirty';
    case 'cleaning':
      return 'Cleaning';
    case 'needs-inspection':
      return 'Needs Inspection';
    case 'maintenance':
      return 'Maintenance';
  }
}
