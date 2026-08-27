import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates';
import { cn } from '@/utils/cn';
import { useHousekeepingTasks, useHousekeepingStats, useStaffSchedule } from '@/hooks/useFeatureData';
import type { HousekeepingTaskDTO, StaffScheduleEntryDTO } from '@/types/api';

type FloorFilter = 'all' | '1' | '2' | '3' | '4';
type StatusFilter = 'all' | 'dirty' | 'inProgress' | 'needsInspection' | 'done';

const STATUS_PILL: Record<string, { pillClass: string; iconName: string; label: string; spin?: boolean }> = {
  dirty: { pillClass: 'bg-error-container text-on-error-container', iconName: 'warning', label: 'Dirty' },
  cleaning: {
    pillClass: 'bg-secondary-container text-on-secondary-container',
    iconName: 'sync',
    label: 'Cleaning',
    spin: true,
  },
  needs_inspection: {
    pillClass: 'bg-primary-fixed text-primary',
    iconName: 'visibility',
    label: 'Needs Inspection',
  },
  done: {
    pillClass: 'bg-emerald-100 text-emerald-800',
    iconName: 'check_circle',
    label: 'Clean',
  },
};

const ROW_EDGE: Record<string, string> = {
  dirty: 'bg-error',
  cleaning: 'bg-secondary',
  needs_inspection: 'bg-primary-fixed-dim',
  done: 'bg-emerald-600',
};

function labelize(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TaskRow({ task }: { task: HousekeepingTaskDTO }) {
  const status = task.status;
  const pill = STATUS_PILL[status] ?? STATUS_PILL.dirty;
  return (
    <tr className="hover:bg-slate-50 border-b border-slate-100 transition-colors group">
      <td className="py-3 px-4 relative">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${ROW_EDGE[status] ?? 'bg-slate-300'}`}></div>
        <span className="font-headline-sm text-headline-sm text-primary">{task.room?.number ?? '—'}</span>
      </td>
      <td className="py-3 px-4">
        <p className="font-body-sm text-body-sm text-primary">{task.room?.roomTypeName ?? '—'}</p>
        <p className="font-label-md text-label-md text-on-surface-variant">{labelize(task.context)}</p>
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-label-md text-label-md ${pill.pillClass}`}
        >
          <Icon name={pill.iconName} className={cn('text-[14px]', pill.spin && 'animate-spin')} />
          {pill.label}
        </span>
        <p className="font-label-md text-label-md text-on-surface-variant mt-1 text-[10px]">{timeAgo(task.lastActivityAt)}</p>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="font-label-sm text-label-sm text-on-secondary-container">
                {task.assignee.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
          ) : (
            <button
              type="button"
              title="Assign Staff"
              className="font-label-md text-label-md text-secondary border border-secondary px-2 py-1 rounded hover:bg-secondary hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Assign Staff
            </button>
          )}
          {task.assignee && (
            <div>
              <p className="font-body-sm text-body-sm text-primary">{task.assignee.name}</p>
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <button type="button" title="Update Status" className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors cursor-pointer focus-visible:outline-none">
          <Icon name="edit" />
        </button>
        <button type="button" title="Add Note" className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors cursor-pointer focus-visible:outline-none">
          <Icon name="note_add" />
        </button>
        <button type="button" title="Report Issue" className="p-1.5 text-error hover:bg-error-container rounded transition-colors cursor-pointer focus-visible:outline-none">
          <Icon name="report_problem" />
        </button>
      </td>
    </tr>
  );
}

const STAT_CARDS = [
  { key: 'dirtyRooms' as const, label: 'Dirty', edgeBarClass: 'bg-error', chipClass: 'bg-error-container text-on-error-container', iconName: 'warning' },
  { key: 'cleaningTasks' as const, label: 'In Progress', edgeBarClass: 'bg-secondary', chipClass: 'bg-secondary-container text-on-secondary-container', iconName: 'sync' },
  { key: 'cleanRooms' as const, label: 'Inspected (Ready)', edgeBarClass: 'bg-emerald-600', chipClass: 'bg-emerald-100 text-emerald-800', iconName: 'check_circle' },
  { key: 'maintenanceRooms' as const, label: 'Out of Order', edgeBarClass: 'bg-tertiary', chipClass: 'bg-tertiary-fixed text-on-tertiary-fixed', iconName: 'build' },
];

function StaffScheduleCard({ entry }: { entry: StaffScheduleEntryDTO }) {
  const isDelayed = entry.overdueTaskCount > 0;
  const isActive = entry.inProgressTaskCount > 0 && !isDelayed;
  const pct = entry.completionRate;
  const barFill = pct >= 60 ? 'bg-secondary' : 'bg-error';

  return (
    <div className="border border-outline-variant rounded-lg p-3 hover:border-secondary transition-colors cursor-pointer bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <span className="font-label-sm text-label-sm text-on-secondary-container">
              {entry.staff.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-label-lg text-label-lg text-primary">{entry.staff.name}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">
              Floor {entry.floors.join(', ')} • {entry.completedTaskCount}/{entry.assignedTaskCount} Rooms
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-headline-sm text-headline-sm text-primary">{pct}%</span>
        </div>
      </div>
      <div className="w-full bg-surface-variant rounded-full h-1.5 mb-2">
        <div className={`${barFill} h-1.5 rounded-full`} style={{ width: `${pct}%` }}></div>
      </div>
      <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
        <span className={isDelayed ? 'text-error' : undefined}>
          {isDelayed ? 'Delayed' : isActive ? `Active: ${entry.inProgressTaskCount} task${entry.inProgressTaskCount === 1 ? '' : 's'}` : 'Idle'}
        </span>
        <span>{entry.assignedTaskCount} tasks</span>
      </div>
    </div>
  );
}

export default function HousekeepingPage() {
  const [floor, setFloor] = useState<FloorFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const taskFilters = useMemo(() => {
    const f: Record<string, unknown> = { page, pageSize: 20 };
    if (floor !== 'all') f.floor = parseInt(floor, 10);
    if (status !== 'all') {
      if (status === 'inProgress') f.status = 'cleaning';
      else if (status === 'needsInspection') f.status = 'needs_inspection';
      else f.status = status;
    }
    return f;
  }, [floor, status, page]);

  const { data: tasksResult, isLoading: tasksLoading, isError: tasksError, error: tasksErr, refetch: refetchTasks } = useHousekeepingTasks(taskFilters);
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr, refetch: refetchStats } = useHousekeepingStats();
  const { data: schedule, isLoading: scheduleLoading, isError: scheduleError, error: scheduleErr, refetch: refetchSchedule } = useStaffSchedule();

  const tasks = tasksResult?.items ?? [];
  const totalTasks = tasksResult?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const displayStart = totalTasks > 0 ? (page - 1) * pageSize + 1 : 0;
  const displayEnd = Math.min(page * pageSize, totalTasks);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Housekeeping Overview</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Today&apos;s room status and staff assignments.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            title="Print Report"
            className="bg-surface-container-lowest border border-primary text-primary px-4 py-2 rounded font-label-lg text-label-lg flex items-center gap-2 hover:-translate-y-0.5 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="print" className="text-lg" />
            Print Report
          </button>
          <button
            type="button"
            title="New Task"
            className="bg-primary text-on-primary px-4 py-2 rounded font-label-lg text-label-lg flex items-center gap-2 hover:-translate-y-0.5 transition-transform shadow-md hover:shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="add" className="text-lg" />
            New Task
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {statsError ? (
        <ErrorState
          message={statsErr?.message ?? 'Failed to load stats.'}
          onRetry={() => refetchStats()}
          retryLabel="Retry"
          className="mb-8"
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className="hk-surface-card p-4 flex flex-col justify-between relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.edgeBarClass}`}></div>
              <div className="flex justify-between items-start">
                <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">{card.label}</p>
                <div className={`${card.chipClass} p-1.5 rounded-full`}>
                  <Icon name={card.iconName} className={cn('text-xl', card.key === 'cleaningTasks' && 'animate-spin')} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display-lg text-display-lg text-primary">
                  {statsLoading ? '—' : (stats?.[card.key] ?? 0)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">rooms</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Room List */}
        <div className="xl:col-span-2 hk-surface-card flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-headline-sm text-headline-sm text-primary">Priority Rooms</h3>
            <div className="flex gap-2">
              <select
                aria-label="Filter by floor"
                value={floor}
                onChange={(e) => { setFloor(e.target.value as FloorFilter); setPage(1); }}
                className="bg-surface border border-outline-variant rounded font-body-sm text-body-sm px-3 py-1.5 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none cursor-pointer"
              >
                <option value="all">All Floors</option>
                <option value="1">Floor 1</option>
                <option value="2">Floor 2</option>
                <option value="3">Floor 3</option>
                <option value="4">Floor 4</option>
              </select>
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}
                className="bg-surface border border-outline-variant rounded font-body-sm text-body-sm px-3 py-1.5 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="dirty">Status: Dirty</option>
                <option value="inProgress">Status: In Progress</option>
                <option value="needsInspection">Status: Needs Inspection</option>
                <option value="done">Status: Done</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {tasksLoading ? (
              <LoadingState message="Loading tasks…" />
            ) : tasksError ? (
              <ErrorState
                message={tasksErr?.message ?? 'Failed to load tasks.'}
                onRetry={() => refetchTasks()}
                retryLabel="Retry"
              />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase border-b border-outline-variant w-16">
                      Room
                    </th>
                    <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase border-b border-outline-variant">
                      Type
                    </th>
                    <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase border-b border-outline-variant">
                      Status
                    </th>
                    <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase border-b border-outline-variant">
                      Assigned To
                    </th>
                    <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase border-b border-outline-variant text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length > 0 ? (
                    tasks.map((task) => <TaskRow key={task.id} task={task} />)
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center font-body-sm text-body-sm text-on-surface-variant">
                        No rooms match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {!tasksLoading && !tasksError && totalTasks > 0 && (
            <div className="p-3 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Showing {displayStart} to {displayEnd} of {totalTasks} entries
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-50 cursor-pointer focus-visible:outline-none"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-50 cursor-pointer focus-visible:outline-none"
                >
                  <Icon name="chevron_right" className="text-[18px]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar / Staff Schedule */}
        <div className="hk-surface-card flex flex-col min-h-[400px] xl:h-auto">
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-primary">Staff Schedule</h3>
            <Icon name="calendar_today" className="text-on-surface-variant" />
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {scheduleLoading ? (
              <LoadingState message="Loading schedule…" />
            ) : scheduleError ? (
              <ErrorState
                message={scheduleErr?.message ?? 'Failed to load schedule.'}
                onRetry={() => refetchSchedule()}
                retryLabel="Retry"
                className="border-0 bg-transparent p-0"
              />
            ) : (schedule ?? []).length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-6">No staff assigned.</p>
            ) : (
              (schedule ?? []).map((entry) => (
                <StaffScheduleCard key={entry.staff.id} entry={entry} />
              ))
            )}
            <button
              type="button"
              className="w-full py-3 border border-dashed border-outline-variant text-on-surface-variant font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <Icon name="person_add" />
              Assign Additional Staff
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
