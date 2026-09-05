import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { LoadingState, ErrorState } from '@/components/ui';
import { useReservations, useRoomTypes } from '@/hooks/useFeatureData';
import type { ReservationListItem } from '@/types/api';

type PaymentTag = 'fully-paid' | 'deposit-paid' | 'unpaid';

const BOOKING_STATUS_OPTIONS = [
  'All Statuses',
  'Confirmed',
  'Pending',
  'Checked In',
  'Checked Out',
  'Cancelled',
] as const;

const ROOM_TYPE_OPTIONS = ['All Room Types'] as const;

const PAYMENT_STATUS_OPTIONS = ['All Payments', 'Fully Paid', 'Partial / Deposit', 'Unpaid'] as const;

const statusPills: Record<string, { cls: string; label: string }> = {
  confirmed: { cls: 'bg-[#ecfdf5] text-[#065f46]', label: 'Confirmed' },
  pending: { cls: 'bg-[#fef3c7] text-[#92400e]', label: 'Pending' },
  cancelled: { cls: 'bg-[#fce7f3] text-[#9d174d]', label: 'Cancelled' },
  checked_in: { cls: 'bg-[#eff4ff] text-[#1e40af] border border-[#bfdbfe]', label: 'Checked In' },
  checked_out: { cls: 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]', label: 'Checked Out' },
};

const paymentChips: Record<PaymentTag, { cls: string; label: string }> = {
  'fully-paid': { cls: 'bg-surface-container-low text-primary border border-primary-fixed-dim', label: 'Fully Paid' },
  'deposit-paid': { cls: 'bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim', label: 'Deposit Paid' },
  unpaid: { cls: 'bg-error-container text-on-error-container border border-error/20', label: 'Unpaid' },
};

const statusLabelToApi: Record<string, string> = {
  Confirmed: 'confirmed',
  Pending: 'pending',
  'Checked In': 'checked_in',
  'Checked Out': 'checked_out',
  Cancelled: 'cancelled',
};

function formatDateDisplay(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatDatesRange(checkIn: string, checkOut: string): string {
  return `${formatDateDisplay(checkIn)} - ${formatDateDisplay(checkOut)}`;
}

function formatCurrencyCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function derivePaymentTag(reservation: ReservationListItem): PaymentTag {
  const total = reservation.totalCents + Math.round(reservation.totalCents * 0.12);
  if (reservation.depositCents <= 0) return 'unpaid';
  if (reservation.depositCents >= total) return 'fully-paid';
  return 'deposit-paid';
}

function toReservationRow(r: ReservationListItem): {
  id: string;
  code: string;
  guest: string;
  initials: string;
  avatarTone: 'navy' | 'slate';
  roomType: string;
  room: string;
  dates: string;
  nights: number;
  status: string;
  amount: string;
  amountStruck: boolean;
  payment: PaymentTag;
  checkInDate: string;
  checkOutDate: string;
} {
  const guestName = r.guest?.fullName ?? 'Unknown Guest';
  const initials = r.guest?.initials ?? guestName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return {
    id: r.id,
    code: r.code,
    guest: guestName,
    initials,
    avatarTone: r.status === 'confirmed' ? 'navy' : 'slate',
    roomType: r.roomType?.name ?? '—',
    room: r.room ? `Room ${r.room.number}` : 'Unassigned',
    dates: formatDatesRange(r.checkInDate, r.checkOutDate),
    nights: r.nights,
    status: r.status,
    amount: formatCurrencyCents(r.totalCents),
    amountStruck: r.status === 'cancelled',
    payment: derivePaymentTag(r),
    checkInDate: r.checkInDate,
    checkOutDate: r.checkOutDate,
  };
}

function pageItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set<number>([1, current - 1, current, current + 1, total]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | 'ellipsis'> = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - (pages[i - 1] as number) > 1) out.push('ellipsis');
    out.push(p);
  });
  return out;
}

export default function ReservationsPage() {
  const navigate = useNavigate();

  const [pageSize] = useState(20);

  const tableRef = useRef<HTMLDivElement>(null);

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [bookingStatus, setBookingStatus] = useState<string>(BOOKING_STATUS_OPTIONS[0]);
  const [paymentStatus, setPaymentStatus] = useState<string>(PAYMENT_STATUS_OPTIONS[0]);
  const [roomType, setRoomType] = useState<string>(ROOM_TYPE_OPTIONS[0]);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: reservationsResponse, isLoading, isError, refetch } = useReservations({ pageSize: 500 });
  const { data: roomTypes } = useRoomTypes();

  const allRows = useMemo(() => {
    return (reservationsResponse?.items ?? []).map(toReservationRow);
  }, [reservationsResponse]);

  const filtered = useMemo(() => {
    const paymentKey: PaymentTag | undefined =
      paymentStatus === 'Fully Paid' ? 'fully-paid' :
      paymentStatus === 'Partial / Deposit' ? 'deposit-paid' :
      paymentStatus === 'Unpaid' ? 'unpaid' : undefined;
    const statusKey = statusLabelToApi[bookingStatus];
    const q = query.trim().toLowerCase();
    const roomTypeActive = roomType !== ROOM_TYPE_OPTIONS[0];

    return allRows.filter((r) => {
      if (statusKey && r.status !== statusKey) return false;
      if (paymentKey && r.payment !== paymentKey) return false;
      if (roomTypeActive && r.roomType !== roomType) return false;
      if (q) {
        const haystack = `${r.guest} ${r.code} ${r.roomType} ${r.room}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allRows, bookingStatus, paymentStatus, roomType, query]);

  const todayISO = new Date().toISOString().split('T')[0];

  const arrivals = useMemo(() => {
    return allRows.filter((r) => {
      if (r.status !== 'pending' && r.status !== 'confirmed') return false;
      return r.checkInDate.split('T')[0] === todayISO;
    });
  }, [allRows, todayISO]);

  const departures = useMemo(() => {
    return allRows.filter((r) => {
      if (r.status !== 'checked_in' && r.status !== 'checked_out') return false;
      return r.checkOutDate.split('T')[0] === todayISO;
    });
  }, [allRows, todayISO]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(currentPage, totalPages);
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const allVisibleSelected = pagedRows.length > 0 && pagedRows.every((r) => selected.has(r.id));

  function toggleAllVisible() {
    setSelected(allVisibleSelected ? new Set() : new Set(pagedRows.map((r) => r.id)));
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const header = ['ID', 'Guest', 'Room Type', 'Room', 'Dates', 'Nights', 'Status', 'Amount', 'Payment'];
    const lines = filtered.map((r) =>
      [r.code, r.guest, r.roomType, r.room, r.dates, r.nights, statusPills[r.status]?.label ?? r.status, r.amount, paymentChips[r.payment].label]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reservations-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const filterControlClass =
    'w-full pl-3 pr-10 py-2 border border-[#E2E8F0] rounded font-body-sm text-body-sm input-luxe text-primary bg-surface-bright appearance-none cursor-pointer';
  const filterInputClass =
    'w-full pl-10 pr-3 py-2 border border-[#E2E8F0] rounded font-body-sm text-body-sm input-luxe text-primary bg-surface-bright';
  const filterLabelClass = 'block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider';

  if (isLoading) return <LoadingState message="Loading reservations…" />;
  if (isError) return <ErrorState message="Failed to load reservations. Please try again." onRetry={() => refetch()} retryLabel="Retry" />;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary mb-1">Reservations Desk</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Manage daily operations, track arrivals, and process bookings quickly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface text-primary border border-outline-variant rounded font-label-lg text-label-lg hover-shift transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="download" className="text-[18px]" />
            Export
          </button>
          <button
            type="button"
            onClick={() => navigate('/reservations/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded font-label-lg text-label-lg hover-shift transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="flash_on" className="text-[18px]" />
            Quick Booking
          </button>
        </div>
      </div>

      {/* Dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today's Arrivals */}
        <div className="bg-surface-container-lowest rounded-lg surface-depth-1 p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
              <Icon name="flight_land" className="text-secondary" />
              Today's Arrivals
            </h3>
            <span className="bg-surface-container-high text-primary font-bold px-2 py-1 rounded text-sm">{arrivals.length}</span>
          </div>
          <div className="space-y-3">
            {arrivals.length === 0 && (
              <p className="text-on-surface-variant text-sm text-center py-2">No arrivals today</p>
            )}
            {arrivals.map((a, idx) => (
              <div
                key={a.id}
                className={idx < arrivals.length - 1 ? 'flex justify-between items-center border-b border-outline-variant pb-2' : 'flex justify-between items-center'}
              >
                <div>
                  <p className="font-semibold text-primary text-sm">{a.guest}</p>
                  <p className="text-xs text-on-surface-variant">{a.roomType} • {a.nights} nights</p>
                </div>
                <button
                  type="button"
                  aria-label={`Open ${a.guest}`}
                  title="Open reservation"
                  onClick={() => navigate(`/reservations/${a.id}`)}
                  className="text-secondary hover:bg-surface-variant p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <Icon name="check_circle" />
                </button>
              </div>
            ))}
          </div>
          {arrivals.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBookingStatus('Confirmed');
                setQuery('');
                setRoomType(ROOM_TYPE_OPTIONS[0]);
                setPaymentStatus(PAYMENT_STATUS_OPTIONS[0]);
                setCurrentPage(1);
                scrollToTable();
              }}
              className="block text-center text-sm font-semibold text-secondary mt-4 hover:underline cursor-pointer"
            >
              View All Arrivals
            </button>
          )}
        </div>

        {/* Today's Departures */}
        <div className="bg-surface-container-lowest rounded-lg surface-depth-1 p-5 border-l-4 border-l-secondary-container">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
              <Icon name="flight_takeoff" className="text-outline" />
              Today's Departures
            </h3>
            <span className="bg-surface-container-high text-primary font-bold px-2 py-1 rounded text-sm">{departures.length}</span>
          </div>
          <div className="space-y-3">
            {departures.length === 0 && (
              <p className="text-on-surface-variant text-sm text-center py-2">No departures today</p>
            )}
            {departures.map((d, idx) => (
              <div
                key={d.id}
                className={idx < departures.length - 1 ? 'flex justify-between items-center border-b border-outline-variant pb-2' : 'flex justify-between items-center'}
              >
                <div>
                  <p className="font-semibold text-primary text-sm">{d.guest}</p>
                  <p className="text-xs text-on-surface-variant">{d.room} • {d.roomType}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Open folio for ${d.guest}`}
                  title="Open folio"
                  onClick={() => navigate('/billing')}
                  className="text-primary hover:bg-surface-variant p-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <Icon name="receipt_long" />
                </button>
              </div>
            ))}
          </div>
          {departures.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBookingStatus('Checked In');
                setQuery('');
                setRoomType(ROOM_TYPE_OPTIONS[0]);
                setPaymentStatus(PAYMENT_STATUS_OPTIONS[0]);
                setCurrentPage(1);
                scrollToTable();
              }}
              className="block text-center text-sm font-semibold text-secondary mt-4 hover:underline cursor-pointer"
            >
              View All Departures
            </button>
          )}
        </div>

        {/* Current Availability */}
        <div className="bg-primary text-on-primary rounded-lg surface-depth-1 p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-4">
              <Icon name="hotel" fill className="text-secondary" />
              Current Availability
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(roomTypes ?? []).slice(0, 4).map((rt) => (
                <div key={rt.code} className="bg-inverse-surface p-3 rounded">
                  <p className="text-xs text-on-primary-container uppercase tracking-wider mb-1">{rt.name}</p>
                  <p className="font-display-lg text-2xl font-bold">
                    {rt.totalRooms}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline/30 flex justify-between items-center text-sm">
            <span className="text-on-primary-container">Total Room Types: {(roomTypes ?? []).length}</span>
            <span className="text-on-primary-container">Total Rooms: {(roomTypes ?? []).reduce((s, rt) => s + rt.totalRooms, 0)}</span>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-surface-container-lowest rounded-lg surface-depth-1 p-4 mb-6 flex flex-col xl:flex-row gap-4 items-end">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {/* Room type */}
          <div>
            <label htmlFor="filter-room-type" className={filterLabelClass}>
              Room Type
            </label>
            <div className="relative">
              <select
                id="filter-room-type"
                value={roomType}
                onChange={(e) => {
                  setRoomType(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
                className={filterControlClass}
              >
                {ROOM_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
                {(roomTypes ?? []).map((rt) => (
                  <option key={rt.id} value={rt.name}>{rt.name}</option>
                ))}
              </select>
              <Icon name="expand_more" className="absolute right-3 top-2.5 text-outline pointer-events-none text-[20px]" />
            </div>
          </div>

          {/* Booking status */}
          <div>
            <label htmlFor="filter-status" className={filterLabelClass}>
              Booking Status
            </label>
            <div className="relative">
              <select
                id="filter-status"
                value={bookingStatus}
                onChange={(e) => {
                  setBookingStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
                className={filterControlClass}
              >
                {BOOKING_STATUS_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <Icon name="expand_more" className="absolute right-3 top-2.5 text-outline pointer-events-none text-[20px]" />
            </div>
          </div>

          {/* Payment status */}
          <div>
            <label htmlFor="filter-payment" className={filterLabelClass}>
              Payment Status
            </label>
            <div className="relative">
              <select
                id="filter-payment"
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
                className={filterControlClass}
              >
                {PAYMENT_STATUS_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <Icon name="expand_more" className="absolute right-3 top-2.5 text-outline pointer-events-none text-[20px]" />
            </div>
          </div>
        </div>

        {/* Table search */}
        <div className="w-full lg:w-72 relative mt-4 xl:mt-0">
          <Icon name="search" className="absolute left-3 top-2.5 text-outline text-[20px]" />
          <input
            type="text"
            placeholder="Search guests or ID..."
            aria-label="Search guests or ID"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={filterInputClass}
          />
        </div>
      </div>

      {/* Data table */}
      <div ref={tableRef} className="bg-surface-container-lowest rounded-lg surface-depth-1 overflow-hidden scroll-mt-24">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    aria-label="Select all visible reservations"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase tracking-wider font-semibold cursor-pointer group">
                  Guest / ID
                </th>
                <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">Room Type / #</th>
                <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">Dates</th>
                <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">Status</th>
                <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">Payment</th>
                <th className="py-3 px-4 font-label-md text-label-md text-primary uppercase tracking-wider w-12" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-[#E2E8F0]">
              {pagedRows.map((row) => {
                const pill = statusPills[row.status] ?? { cls: 'bg-gray-100 text-gray-700', label: row.status };
                const chip = paymentChips[row.payment];
                return (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/reservations/${row.id}`)}
                    className="hover:bg-surface-bright transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.code}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            row.avatarTone === 'navy'
                              ? 'w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-label-lg font-bold shrink-0'
                              : 'w-8 h-8 rounded-full bg-surface-dim text-on-surface flex items-center justify-center font-label-lg font-bold shrink-0'
                          }
                        >
                          {row.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-primary">{row.guest}</div>
                          <div className="text-on-surface-variant text-xs font-mono">{row.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-primary">{row.roomType}</div>
                      <div className="text-on-surface-variant">{row.room}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-primary">{row.dates}</div>
                      <div className="text-on-surface-variant text-xs">{row.nights} nights</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pill.cls}`}>
                        {pill.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className={row.amountStruck ? 'font-medium text-on-surface-variant line-through' : 'font-medium text-primary'}>
                        {row.amount}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${chip.cls}`}>{chip.label}</span>
                    </td>
                    <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label={`Actions for ${row.code}`}
                        onClick={() => navigate(`/reservations/${row.id}`)}
                        className="text-outline hover:text-primary p-1 cursor-pointer focus-visible:outline-none"
                      >
                        <Icon name="more_vert" className="text-[20px]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-on-surface-variant">
                    No reservations match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#E2E8F0] bg-surface-container-lowest flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-on-surface-variant font-body-sm">
                Showing <span className="font-medium text-primary">{start}</span> to{' '}
                <span className="font-medium text-primary">{end}</span> of{' '}
                <span className="font-medium text-primary">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setCurrentPage(page - 1)}
                  aria-label="Previous page"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#E2E8F0] bg-surface-container-lowest text-sm font-medium text-outline hover:bg-surface-bright disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {pageItems(page, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`e-${idx}`}
                      className="relative inline-flex items-center px-4 py-2 border border-[#E2E8F0] bg-surface-container-lowest text-sm font-medium text-on-surface-variant select-none"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      aria-current={item === page ? 'page' : undefined}
                      onClick={() => setCurrentPage(item)}
                      className={
                        item === page
                          ? 'relative inline-flex items-center px-4 py-2 border border-[#E2E8F0] bg-secondary-container text-on-secondary-container text-sm font-medium z-10 cursor-pointer focus-visible:outline-none'
                          : 'relative inline-flex items-center px-4 py-2 border border-[#E2E8F0] bg-surface-container-lowest text-sm font-medium text-on-surface-variant hover:bg-surface-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setCurrentPage(page + 1)}
                  aria-label="Next page"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#E2E8F0] bg-surface-container-lowest text-sm font-medium text-outline hover:bg-surface-bright disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
