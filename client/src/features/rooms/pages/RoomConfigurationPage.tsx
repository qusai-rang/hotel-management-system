import { useMemo, useState } from 'react';
import { Icon, LoadingState, ErrorState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useRoomTypes } from '@/hooks/useFeatureData';
import type { RoomTypeDTO } from '@/types/api';

type ConfigTab = 'room-types' | 'floor-management';

function accentClass(code: string): string {
  if (code.startsWith('STD')) return 'bg-blue-400';
  if (code.startsWith('DLX')) return 'bg-emerald-400';
  if (code.startsWith('EXE')) return 'bg-secondary';
  if (code.startsWith('PRM') || code.startsWith('PRE')) return 'bg-purple-400';
  return 'bg-slate-400';
}

function rowJsx(config: RoomTypeDTO) {
  return (
    <tr key={config.code} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className={cn('w-2 h-8 rounded-full', accentClass(config.code))} />
          <div>
            <p className="font-label-lg text-label-lg">{config.name}</p>
            <p className="text-on-surface-variant text-xs">{config.code}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 font-label-lg text-label-lg">
        ${Math.round(config.basePricePerNightCents / 100)}
        <span className="text-on-surface-variant font-body-sm text-body-sm">/night</span>
      </td>
      <td className="py-4 px-6">{config.totalRooms}</td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-1 text-on-surface-variant" title={`Up to ${config.maxGuests} guests`}>
          {Array.from({ length: config.maxGuests }, (_, index) => (
            <span key={index} aria-hidden="true" className="material-symbols-outlined text-[16px]">
              person
            </span>
          ))}
        </div>
      </td>
      <td className="py-4 px-6 text-right">
        <button
          type="button"
          title="Room type editing arrives with a future screen"
          className="text-on-surface-variant hover:text-secondary p-2 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer focus-visible:outline-none"
        >
          <Icon name="edit" />
        </button>
      </td>
    </tr>
  );
}

export default function RoomConfigurationPage() {
  const [tab, setTab] = useState<ConfigTab>('room-types');
  const [filter, setFilter] = useState('');

  const { data: apiRoomTypes, isLoading, isError, refetch } = useRoomTypes();

  const stats = useMemo(() => {
    if (!apiRoomTypes) return { totalRoomTypes: 0, totalRoomsAcrossTypes: 0 };
    return {
      totalRoomTypes: apiRoomTypes.length,
      totalRoomsAcrossTypes: apiRoomTypes.reduce((sum, rt) => sum + rt.totalRooms, 0),
    };
  }, [apiRoomTypes]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = apiRoomTypes ?? [];
    if (!q) return list;
    return list.filter((config) =>
      [config.name, config.code].some((value) => value.toLowerCase().includes(q)),
    );
  }, [apiRoomTypes, filter]);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">Property Configuration</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage room categorizations and physical floor layouts for Grand Plaza Heights.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant mb-6">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          <button
            type="button"
            aria-current={tab === 'room-types' ? 'page' : undefined}
            onClick={() => setTab('room-types')}
            className={cn(
              'whitespace-nowrap py-4 px-1 border-b-2 font-label-lg text-label-lg cursor-pointer focus-visible:outline-none',
              tab === 'room-types'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-secondary hover:border-outline-variant',
            )}
          >
            Room Types
          </button>
          <button
            type="button"
            aria-current={tab === 'floor-management' ? 'page' : undefined}
            onClick={() => setTab('floor-management')}
            className={cn(
              'whitespace-nowrap py-4 px-1 border-b-2 font-label-lg text-label-lg cursor-pointer focus-visible:outline-none',
              tab === 'floor-management'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-secondary hover:border-outline-variant',
            )}
          >
            Floor Management
          </button>
        </nav>
      </div>

      {tab === 'floor-management' ? (
        <p className="font-body-md text-body-md text-on-surface-variant py-12 text-center">
          Floor management is not part of the current configuration set.
        </p>
      ) : isLoading ? (
        <LoadingState message="Loading room types…" />
      ) : isError ? (
        <ErrorState message="Failed to load room types. Please try again." onRetry={() => refetch()} retryLabel="Retry" />
      ) : (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant focus-within:ring-2 focus-within:ring-secondary-container">
              <Icon name="filter_list" className="text-outline mr-2" />
              <input
                type="text"
                placeholder="Filter room types..."
                aria-label="Filter room types"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-outline w-48 focus:ring-0 p-0"
              />
            </div>
            <button
              type="button"
              title="Room type creation arrives with a future screen"
              className="bg-primary text-on-primary font-label-lg text-label-lg px-4 py-2 rounded hover:-translate-y-px shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <Icon name="add" />
              New Room Type
            </button>
          </div>

          {/* Bento Grid for Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-outline-variant rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <Icon name="category" className="text-secondary" />
                <span className="bg-secondary-container/20 text-on-secondary-container font-label-md text-label-md px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-background">{stats.totalRoomTypes}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Total Room Types</p>
            </div>
            <div className="bg-surface border border-outline-variant rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <Icon name="bed" className="text-secondary" />
                <span className="bg-surface-container-high text-on-surface font-label-md text-label-md px-2 py-1 rounded-full">
                  Capacity
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-background">
                {stats.totalRoomsAcrossTypes}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Total Rooms Across Types</p>
            </div>
            <div className="bg-surface border border-outline-variant rounded-lg p-6 shadow-sm flex flex-col justify-center items-center text-center border-dashed bg-surface-container-lowest">
              <Icon name="auto_awesome" className="text-outline mb-2 text-3xl" />
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Need pricing recommendations?</p>
              <button
                type="button"
                title="Pricing analysis arrives with the backend phase"
                className="text-secondary font-label-md text-label-md hover:underline cursor-pointer focus-visible:outline-none"
              >
                Run Analysis
              </button>
            </div>
          </div>

          {/* Data Table Container */}
          <div className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-6 font-label-md text-label-md text-primary uppercase tracking-wider">
                      Type Name &amp; Code
                    </th>
                    <th className="py-3 px-6 font-label-md text-label-md text-primary uppercase tracking-wider">
                      Base Price
                    </th>
                    <th className="py-3 px-6 font-label-md text-label-md text-primary uppercase tracking-wider">
                      Total Rooms
                    </th>
                    <th className="py-3 px-6 font-label-md text-label-md text-primary uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="py-3 px-6 font-label-md text-label-md text-primary uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-background">{filtered.map((config) => rowJsx(config))}</tbody>
              </table>
              {filtered.length === 0 && (
                <p className="py-8 text-center font-body-md text-body-md text-on-surface-variant">
                  No room types match &ldquo;{filter}&rdquo;.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
