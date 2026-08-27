import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui/Icon';
import type { ManagementGuest, CleaningProgress, ManagementRoomStatus } from '@/features/rooms/managementData';

/**
 * reference/room_management_grid_view card (lines 267-380).
 * Deliberately separate from RoomCard (dashboard merge) and the hand-drawn
 * Screen 6 card — this design uses a bare headline-md number, occupancy pill,
 * guest-photo row / ready note / cleaning progress body and a right-aligned
 * text-button footer.
 */
export interface RoomManagementCardProps {
  number: string;
  typeLabel: string;
  status: ManagementRoomStatus;
  capacityLabel: string;
  rate: string;
  guest?: ManagementGuest;
  readyNote?: string;
  cleaning?: CleaningProgress;
  secondaryActionLabel: string;
  avatarUrl?: string;
  onDetails?: () => void;
  onSecondaryAction?: () => void;
}

const accentBarClass: Record<ManagementRoomStatus, string> = {
  occupied: 'bg-secondary-container',
  available: 'bg-[#10b981]',
  cleaning: 'bg-[#3b82f6]',
};

const pillClass: Record<ManagementRoomStatus, string> = {
  occupied: 'bg-secondary-container/20 text-on-secondary-container border-secondary-container/30',
  available: 'bg-[#10b981]/10 text-[#065f46] border-[#10b981]/20',
  cleaning: 'bg-[#3b82f6]/10 text-[#1e40af] border-[#3b82f6]/20',
};

const pillLabel: Record<ManagementRoomStatus, string> = {
  occupied: 'Occupied',
  available: 'Available',
  cleaning: 'Cleaning',
};

export function RoomManagementCard({
  number,
  typeLabel,
  status,
  capacityLabel,
  rate,
  guest,
  readyNote,
  cleaning,
  secondaryActionLabel,
  avatarUrl,
  onDetails,
}: Omit<RoomManagementCardProps, 'onSecondaryAction'>) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-ambient hover:shadow-md transition-shadow relative flex flex-col h-full">
      {/* Status Accent Bar */}
      <div aria-hidden="true" className={cn('absolute left-0 top-0 bottom-0 w-1.5', accentBarClass[status])} />

      <div className="p-5 pl-7 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-background">{number}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{typeLabel}</p>
          </div>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full font-label-md text-label-md border',
              status === 'cleaning' && 'flex items-center gap-1',
              pillClass[status],
            )}
          >
            {status === 'cleaning' && <Icon name="cleaning_services" className="text-[14px]" />}
            {pillLabel[status]}
          </span>
        </div>

        <div
          className={cn(
            'space-y-3 mb-6',
            /* Available keeps its centered placeholder vertically balanced */
            status === 'available' && 'flex-1 flex flex-col justify-center min-h-[56px]',
          )}
        >
          {guest ? (
            <div className="flex items-center gap-3">
              {avatarUrl && (
                <img alt={guest.name} src={avatarUrl} className="w-8 h-8 rounded-full object-cover" />
              )}
              <div>
                <p className="font-label-lg text-label-lg text-on-background">{guest.name}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">{guest.note}</p>
              </div>
            </div>
          ) : null}

          {typeof readyNote === 'string' && (
            <p className="font-body-sm text-body-sm text-on-surface-variant italic text-center">{readyNote}</p>
          )}

          {cleaning ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-full bg-surface-container-high rounded-full h-2">
                  <div className={cn('bg-[#3b82f6] h-2 rounded-full')} style={{ width: `${cleaning.percent}%` }} />
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant">{cleaning.percent}%</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">{cleaning.estimate}</p>
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 border-t border-outline-variant/50">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Capacity</p>
            <p className="font-body-md text-body-md text-on-background flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[16px]">group</span> {capacityLabel}
            </p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Rate</p>
            <p className="font-body-md text-body-md text-on-background mt-1">{rate}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface px-5 pl-7 py-3 border-t border-outline-variant flex justify-end gap-3">
        <button
          type="button"
          onClick={onDetails}
          className="font-label-lg text-label-lg text-secondary hover:text-secondary-fixed-dim transition-colors cursor-pointer focus-visible:outline-none"
        >
          Details
        </button>
        <button
          type="button"
          title="Opens once its destination screen is implemented"
          className="font-label-lg text-label-lg text-primary hover:text-primary-fixed-dim transition-colors cursor-pointer focus-visible:outline-none"
        >
          {secondaryActionLabel}
        </button>
      </div>
    </div>
  );
}
