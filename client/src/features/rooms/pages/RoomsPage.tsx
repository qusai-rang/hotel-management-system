import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon, LoadingState, ErrorState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useRooms } from '@/hooks/useFeatureData';
import type { RoomListItem } from '@/types/api';
import { floorOptions, statusFilterLabels, type RoomGridStatus, type RoomRecord, type StatusFilter } from '../data';

/** Accent bar / badge recipes verbatim from reference/rooms_luxestay_pro cards. */
const statusStyles: Record<RoomGridStatus, { bar: string; badge: string; dot: string }> = {
  available: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  occupied: {
    bar: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
  },
  dirty: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  maintenance: {
    bar: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
};

const statusFilterMap: Record<Exclude<StatusFilter, 'All'>, RoomGridStatus> = {
  Available: 'available',
  Occupied: 'occupied',
  Dirty: 'dirty',
};

const statusBadgeLabels: Record<RoomGridStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  dirty: 'Dirty',
  maintenance: 'Maintenance',
};

/** Map backend RoomListItem to the local RoomRecord shape the card JSX expects. */
function mapRoomToRecord(room: RoomListItem): RoomRecord {
  const displayStatus = room.displayStatus as RoomGridStatus;
  return {
    id: room.number,
    typeLabel: room.roomType.name,
    status: displayStatus,
    floor: room.floor as 1 | 2 | 3 | 4,
    capacity: room.capacityAdults,
    beds: { iconName: 'bed', label: room.bedsLabel },
    cleanedNote: room.housekeepingStatus === 'clean' ? 'Clean' : undefined,
    priorityNote: room.priorityNote ?? undefined,
    guest: room.currentGuest
      ? { initials: room.currentGuest.initials, name: room.currentGuest.name, departure: room.currentGuest.departure }
      : undefined,
    pricePerNight: typeof room.rateOverrideCents === 'number' ? Math.round(room.rateOverrideCents / 100) : undefined,
    footerActionLabel: displayStatus === 'maintenance' ? 'View Ticket' : 'Details',
  };
}

export default function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [floorLabel, setFloorLabel] = useState<string>(floorOptions[0].label);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const floorValue = floorOptions.find((o) => o.label === floorLabel)?.value ?? undefined;
  const apiStatus = statusFilter !== 'All' ? statusFilterMap[statusFilter] : undefined;

  const { data: apiRooms, isLoading, isError, refetch } = useRooms({
    ...(floorValue != null ? { floor: floorValue } : {}),
    ...(apiStatus ? { status: apiStatus } : {}),
    ...(query.trim() ? { q: query.trim() } : {}),
  });

  const allRooms = useMemo(() => (apiRooms ?? []).map(mapRoomToRecord), [apiRooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRooms.filter((room) => {
      if (q) {
        const haystack = [room.id, room.typeLabel, room.guest?.name ?? ''].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allRooms, query]);

  function roomCardJsx(room: RoomRecord) {
    const styles = statusStyles[room.status];
    return (
      <div
        key={room.id}
        className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm room-card-hover overflow-hidden flex flex-col relative group"
      >
        {/* Status Accent Bar */}
        <div aria-hidden="true" className={cn('absolute left-0 top-0 bottom-0 w-1.5', styles.bar)} />
        <div className="p-5 pl-6 flex-grow flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex justify-between items-start">
            <div>
              <span className="font-headline-md text-headline-md text-on-surface block leading-none">{room.id}</span>
              <span className="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase mt-1 block">
                {room.typeLabel}
              </span>
            </div>
            {/* Badge */}
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1', styles.badge)}>
              <span aria-hidden="true" className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
              {statusBadgeLabels[room.status]}
            </span>
          </div>

          {/* Details */}
          {room.status === 'occupied' && room.guest ? (
            <div className="bg-surface-container p-3 rounded-lg mt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary font-semibold text-sm">
                  {room.guest.initials}
                </div>
                <div>
                  <div className="font-body-sm text-body-sm text-on-surface font-medium">{room.guest.name}</div>
                  <div className="font-label-md text-label-md text-on-surface-variant">{room.guest.departure}</div>
                </div>
              </div>
            </div>
          ) : null}

          {room.status === 'maintenance' && room.maintenance ? (
            <div className="grid grid-cols-1 gap-y-3 mt-2">
              <div className="flex items-start gap-2 text-on-surface-variant">
                <Icon name="build" className="text-[18px] mt-0.5 text-red-600" />
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium block">{room.maintenance.title}</span>
                  <span className="font-label-md text-label-md">{room.maintenance.reported}</span>
                </div>
              </div>
              <div className="w-full h-px bg-outline-variant my-1" />
              <div className="flex items-center gap-2 text-on-surface-variant">
                <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                  <Icon name="engineering" className="text-[14px]" />
                </div>
                <span className="font-body-sm text-body-sm">{room.maintenance.assignedTo}</span>
              </div>
            </div>
          ) : null}

          {(room.status === 'available' || room.status === 'dirty') && (
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-2">
              {typeof room.capacity === 'number' && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Icon name="person" className="text-[18px]" />
                  <span className="font-body-sm text-body-sm">Capacity: {room.capacity}</span>
                </div>
              )}
              {room.beds && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Icon name={room.beds.iconName} className="text-[18px]" />
                  <span className="font-body-sm text-body-sm">{room.beds.label}</span>
                </div>
              )}
              {room.cleanedNote && (
                <div className="flex items-center gap-2 text-on-surface-variant col-span-2">
                  <Icon name="cleaning_services" className="text-[18px]" />
                  <span className="font-body-sm text-body-sm">{room.cleanedNote}</span>
                </div>
              )}
              {room.priorityNote && (
                <div className="flex items-center gap-2 text-amber-700 col-span-2 font-medium bg-amber-50 p-2 rounded">
                  <Icon name="priority_high" className="text-[18px]" />
                  <span className="font-body-sm text-body-sm">{room.priorityNote}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 pl-6 border-t border-outline-variant bg-surface-bright flex justify-between items-center">
          {room.status === 'available' && typeof room.pricePerNight === 'number' ? (
            <span className="font-label-lg text-label-lg text-on-surface">${room.pricePerNight} / night</span>
          ) : room.status === 'occupied' ? (
            <button
              type="button"
              aria-label={`More actions for room ${room.id}`}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer focus-visible:outline-none"
            >
              <Icon name="more_horiz" />
            </button>
          ) : room.status === 'dirty' ? (
            <button
              type="button"
              className="bg-surface-container-high text-on-surface px-3 py-1.5 rounded text-xs font-medium hover:bg-surface-variant transition-colors border border-outline-variant cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Assign Staff
            </button>
          ) : room.maintenance ? (
            <span className="font-label-md text-label-md text-on-surface-variant">{room.maintenance.estimate}</span>
          ) : null}

          <button
            type="button"
            onClick={() => navigate(`/rooms/${room.id}`)}
            className="text-secondary hover:text-secondary-fixed-dim font-label-md text-label-md uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none"
          >
            {room.footerActionLabel} <Icon name="arrow_forward" className="text-[16px]" />
          </button>
        </div>
      </div>
    );
  }

  const selectClass =
    'h-10 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none cursor-pointer';

  return (
    <>
      {/* Header & Filters Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-4 flex flex-col gap-2">
          <h2 className="font-display-lg text-display-lg text-on-surface m-0 leading-tight">Rooms</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Real-time status and management</p>
        </div>

        {/* Filter Glass Panel */}
        <div className="lg:col-span-8 glass-panel rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Floor Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="rooms-floor" className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Floor
              </label>
              <select
                id="rooms-floor"
                value={floorLabel}
                onChange={(e) => setFloorLabel(e.target.value)}
                className={selectClass}
              >
                {floorOptions.map((option) => (
                  <option key={option.label}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</span>
              <div className="flex bg-surface-container-low rounded p-1 border border-outline-variant">
                {statusFilterLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStatusFilter(label)}
                    aria-pressed={statusFilter === label}
                    className={
                      statusFilter === label
                        ? 'px-3 py-1.5 text-body-sm font-medium bg-surface-container-lowest rounded shadow-sm text-primary cursor-pointer'
                        : 'px-3 py-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer'
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex gap-2 border-l border-outline-variant pl-4">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed="true"
              className="p-2 text-primary bg-surface-container-highest rounded-lg cursor-pointer"
            >
              <Icon name="grid_view" fill />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => navigate('/rooms/manage')}
              title="Opens the Room Management grid"
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
            >
              <Icon name="view_list" />
            </button>
          </div>
        </div>
      </div>

      {/* Room Grid — exact source proportions; list view routes to /rooms/manage */}
      {isLoading ? (
        <LoadingState message="Loading rooms…" />
      ) : isError ? (
        <ErrorState message="Failed to load rooms. Please try again." onRetry={() => refetch()} retryLabel="Retry" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((room) => roomCardJsx(room))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center font-body-md text-body-md text-on-surface-variant">
              No rooms match the current filters.
            </p>
          )}
        </div>
      )}
    </>
  );
}
