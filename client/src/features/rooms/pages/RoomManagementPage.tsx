import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon, LoadingState, ErrorState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { RoomManagementCard } from '@/components/domain/RoomManagementCard';
import { useRooms } from '@/hooks/useFeatureData';
import type { RoomListItem } from '@/types/api';
import {
  mgmtFloorOptions,
  mgmtStatusOptions,
  mgmtTypeOptions,
  type ManagementRoom,
  type ManagementRoomStatus,
} from '../managementData';

const mgmtFloorMap: Record<string, number | undefined> = {
  '1st Floor': 1,
  '2nd Floor': 2,
  '3rd Floor (Executive)': 3,
};

function mgmtStatusLabelToApi(label: string): ManagementRoomStatus | undefined {
  if (label === 'Available') return 'available';
  if (label === 'Occupied') return 'occupied';
  if (label === 'Cleaning') return 'cleaning';
  return undefined;
}

/** Map backend RoomListItem → ManagementRoom for the RoomManagementCard. */
function mapToManagementRoom(room: RoomListItem): ManagementRoom {
  const displayStatus = room.displayStatus as ManagementRoomStatus;
  return {
    id: room.number,
    typeLabel: room.roomType.name,
    status: displayStatus,
    capacityLabel: `${room.capacityAdults} Adult${room.capacityAdults !== 1 ? 's' : ''}`,
    rate: room.rateOverrideCents != null
      ? `$${Math.round(room.rateOverrideCents / 100)}/nt`
      : '$—/nt',
    guest: room.currentGuest
      ? { name: room.currentGuest.name, note: room.currentGuest.departure }
      : undefined,
    readyNote: displayStatus === 'available' ? 'Ready for check-in' : undefined,
    secondaryActionLabel: displayStatus === 'occupied' ? 'Manage' : displayStatus === 'available' ? 'Book' : 'Expedite',
  };
}

export default function RoomManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [floorLabel, setFloorLabel] = useState<string>(mgmtFloorOptions[0]);
  const [typeLabel, setTypeLabel] = useState<string>(mgmtTypeOptions[0]);
  const [statusLabel, setStatusLabel] = useState<string>(mgmtStatusOptions[0]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const apiFloor = floorLabel !== mgmtFloorOptions[0] ? mgmtFloorMap[floorLabel] : undefined;
  const apiStatus = statusLabel !== mgmtStatusOptions[0] ? mgmtStatusLabelToApi(statusLabel) : undefined;

  const { data: apiRooms, isLoading, isError, refetch } = useRooms({
    ...(apiFloor != null ? { floor: apiFloor } : undefined),
    ...(apiStatus != null ? { status: apiStatus } : undefined),
    ...(query.trim() ? { q: query.trim() } : undefined),
  });

  const allRooms = useMemo(() => (apiRooms ?? []).map(mapToManagementRoom), [apiRooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRooms.filter((room) => {
      if (typeLabel !== mgmtTypeOptions[0] && room.typeLabel !== typeLabel) return false;
      if (q) {
        const haystack = [room.id, room.typeLabel, room.guest?.name ?? ''].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allRooms, typeLabel, query]);

  const renderCards = (list: ManagementRoom[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {list.map((room) => (
        <RoomManagementCard
          key={room.id}
          number={room.id}
          typeLabel={room.typeLabel}
          status={room.status}
          capacityLabel={room.capacityLabel}
          rate={room.rate}
          guest={room.guest}
          readyNote={room.readyNote}
          cleaning={room.cleaning}
          secondaryActionLabel={room.secondaryActionLabel}
          onDetails={() => navigate(`/rooms/${room.id}`)}
        />
      ))}
      {list.length === 0 && (
        <p className="col-span-full py-12 text-center font-body-md text-body-md text-on-surface-variant">
          No rooms match the current filters.
        </p>
      )}
    </div>
  );

  const selectClass =
    'w-full h-10 bg-surface border border-outline-variant rounded px-3 text-body-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors cursor-pointer';

  const viewButtonClass = (active: boolean) =>
    cn(
      'px-3 py-1.5 rounded font-label-md text-label-md flex items-center gap-2 cursor-pointer',
      active
        ? 'bg-surface-container-high text-primary'
        : 'text-on-surface-variant hover:text-primary transition-colors',
    );

  return (
    <>
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Room Management</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Monitor and manage all property accommodations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle — reference lines 213-222; list target screen is not built yet */}
          <div className="bg-surface border border-outline-variant rounded-lg p-1 flex">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              className={viewButtonClass(view === 'grid')}
            >
              <Icon name="grid_view" className="text-[18px]" />
              Grid View
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              title="List view arrives with a dedicated screen"
              className={viewButtonClass(view === 'list')}
            >
              <Icon name="view_list" className="text-[18px]" />
              List View
            </button>
          </div>
          {/* Add Room — opens the Add/Edit Room form in create mode */}
          <button
            type="button"
            onClick={() => navigate('/rooms/new')}
            className="h-10 px-4 bg-primary text-on-primary font-label-lg text-label-lg rounded hover:bg-inverse-surface hover:-translate-y-0.5 transition-all shadow-ambient cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            + Add Room
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 mb-8 shadow-ambient flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="mgmt-floor" className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
            Floor
          </label>
          <select
            id="mgmt-floor"
            value={floorLabel}
            onChange={(e) => setFloorLabel(e.target.value)}
            className={selectClass}
          >
            {mgmtFloorOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="mgmt-type" className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
            Room Type
          </label>
          <select
            id="mgmt-type"
            value={typeLabel}
            onChange={(e) => setTypeLabel(e.target.value)}
            className={selectClass}
          >
            {mgmtTypeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="mgmt-status" className="block font-label-md text-label-md text-on-surface-variant mb-1.5">
            Status
          </label>
          <select
            id="mgmt-status"
            value={statusLabel}
            onChange={(e) => setStatusLabel(e.target.value)}
            className={selectClass}
          >
            {mgmtStatusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        {/* More Filters — reference lines 259-262; no additional filters exist in the source */}
        <button
          type="button"
          title="Additional filters arrive with future screens"
          className="h-10 px-4 border border-outline-variant bg-surface text-on-surface font-label-lg text-label-lg rounded hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          <Icon name="filter_list" />
          More Filters
        </button>
      </div>

      {/* Room Grid — grid rendering only; the source ships no list-view layout */}
      {isLoading ? (
        <LoadingState message="Loading rooms…" />
      ) : isError ? (
        <ErrorState message="Failed to load rooms. Please try again." onRetry={() => refetch()} retryLabel="Retry" />
      ) : (
        renderCards(filtered)
      )}
    </>
  );
}
