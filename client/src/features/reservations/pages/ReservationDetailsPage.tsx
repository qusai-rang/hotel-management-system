import { useNavigate, useParams } from 'react-router-dom';
import { Icon, LoadingState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useReservationDetail } from '@/hooks/useFeatureData';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const statusPills: Record<string, { cls: string; label: string }> = {
  confirmed: { cls: 'bg-[#10b981]/10 text-[#047857] border border-[#10b981]/20', label: 'Confirmed' },
  pending: { cls: 'bg-[#f59e0b]/10 text-[#b45309] border border-[#f59e0b]/20', label: 'Pending' },
  cancelled: { cls: 'bg-[#f43f5e]/10 text-[#be123c] border border-[#f43f5e]/20', label: 'Cancelled' },
  checked_in: { cls: 'bg-[#0ea5e9]/10 text-[#0369a1] border border-[#0ea5e9]/20', label: 'Checked In' },
  checked_out: { cls: 'bg-[#10b981]/10 text-[#065f46] border border-[#10b981]/20', label: 'Checked Out' },
};

const CHECK_IN_NOTE = 'After 3:00 PM';
const CHECK_OUT_NOTE = 'Before 11:00 AM';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const cardBase = 'bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_4px_12px_rgba(0,0,0,0.02)]';
const sectionTitleClass = 'font-headline-sm text-headline-sm text-primary mb-4 flex items-center gap-2';
const fieldLabelClass = 'font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider';

export default function ReservationDetailsPage() {
  const navigate = useNavigate();
  const { reservationId } = useParams<{ reservationId: string }>();
  const { data: detail, isLoading, isError } = useReservationDetail(reservationId ?? '');

  if (isLoading) {
    return <LoadingState message="Loading reservation…" />;
  }

  if (isError || !detail) {
    return (
      <div className="flex justify-center pt-16">
        <div className={`${cardBase} p-10 max-w-md w-full text-center`}>
          <span className="material-symbols-outlined text-outline" style={{ fontSize: 48 }}>
            search_off
          </span>
          <h3 className="font-headline-md text-headline-md text-primary mt-4 mb-2">Reservation not found</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
            No reservation matches <span className="font-mono font-semibold">{reservationId}</span>. It may have been removed or the ID is incorrect.
          </p>
          <button
            type="button"
            onClick={() => navigate('/reservations')}
            className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded font-label-md text-label-md hover:bg-surface hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            Back to Reservations
          </button>
        </div>
      </div>
    );
  }

  const pill = statusPills[detail.status] ?? { cls: 'bg-gray-100 text-gray-700', label: detail.status };
  const guestName = detail.guest?.fullName ?? 'Unknown Guest';
  const guestInitials = initials(guestName);
  const guestMembership = detail.guest?.membershipTier ?? 'standard';
  const membershipLabel = guestMembership.charAt(0).toUpperCase() + guestMembership.slice(1) + ' Member';

  const roomRatePerNight = detail.ratePerNightCents / 100;
  const charges = [
    { label: `Room Rate (${detail.nights} Night${detail.nights === 1 ? '' : 's'} x $${roomRatePerNight})`, amount: detail.subtotalCents / 100 },
    { label: `Taxes & Fees (${Math.round(detail.taxRateBps / 100)}%)`, amount: detail.taxCents / 100 },
  ];

  const backButtonClass =
    'p-2 -ml-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors self-start md:self-auto flex items-center justify-center cursor-pointer focus-visible:outline-none';

  return (
    <div className="flex flex-col gap-6">
      {/* Action Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button type="button" aria-label="Back to reservations" onClick={() => navigate('/reservations')} className={backButtonClass}>
            <Icon name="arrow_back" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary m-0 tracking-tight">
                {detail.code}
              </h2>
              <span className={`px-3 py-1 font-label-md text-label-md rounded-full ${pill.cls}`}>{pill.label}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Created on {formatDate(detail.createdAt)}{detail.createdBy ? ` by ${detail.createdBy}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" aria-label="Back to reservations" onClick={() => navigate('/reservations')} className={backButtonClass}>
            <Icon name="arrow_back" />
          </button>
          {detail.status !== 'checked_out' && detail.status !== 'cancelled' && (
            <button
              type="button"
              className="px-4 py-2 border border-error/30 text-error bg-surface-container-lowest rounded font-label-md text-label-md hover:bg-error-container/30 transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            >
              <Icon name="cancel" className="text-[18px]" />
              Cancel Reservation
            </button>
          )}
          {detail.status === 'confirmed' && (
            <button
              type="button"
              className="px-5 py-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 cursor-pointer active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <Icon name="how_to_reg" className="text-[18px]" />
              Check In
            </button>
          )}
          {detail.status === 'checked_in' && (
            <button
              type="button"
              onClick={() => navigate(`/checkout?reservationId=${detail.id}`)}
              className="px-5 py-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 cursor-pointer active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <Icon name="logout" className="text-[18px]" />
              Check Out
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Guest Info (Bento style) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Guest Profile Card */}
          <div className={`${cardBase} p-6 relative overflow-hidden group`}>
            <div aria-hidden="true" className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <div className="flex flex-col items-center text-center mb-6 hover:opacity-80 transition-opacity">
              <div className="w-20 h-20 rounded-full bg-surface-variant mb-4 border-2 border-surface shadow-sm relative flex items-center justify-center">
                <span
                  className={cn(
                    'font-headline-sm text-headline-sm font-bold',
                    'text-primary',
                  )}
                >
                  {guestInitials}
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{guestName}</h3>
              <div className="flex items-center gap-2 justify-center">
                <Icon name="star" fill className="text-secondary text-[16px]" />
                <span className="font-label-md text-label-md text-secondary-container-dark tracking-wider uppercase">
                  {membershipLabel}
                </span>
              </div>
            </div>
            <hr className="border-outline-variant/20 mb-4" />
            <div className="space-y-4">
              <div>
                <p className={fieldLabelClass}>Contact</p>
                {detail.guest?.email && (
                  <div className="flex items-center gap-3 text-primary mb-2">
                    <Icon name="mail" className="text-outline text-[18px]" />
                    <a className="font-body-sm text-body-sm hover:text-secondary transition-colors" href={`mailto:${detail.guest.email}`}>
                      {detail.guest.email}
                    </a>
                  </div>
                )}
                {detail.guest?.phone && (
                  <div className="flex items-center gap-3 text-primary">
                    <Icon name="call" className="text-outline text-[18px]" />
                    <a className="font-body-sm text-body-sm hover:text-secondary transition-colors" href={`tel:${detail.guest.phone.replace(/[^+\d]/g, '')}`}>
                      {detail.guest.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guest History Card */}
          <div className={`${cardBase} p-6`}>
            <h4 className={sectionTitleClass}>
              <Icon name="history" className="text-outline" />
              Guest History
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-surface p-4 rounded-lg border border-outline-variant/20">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">Total Stays</p>
                <p className="font-headline-md text-headline-md text-primary">—</p>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-outline-variant/20">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1">Cancellations</p>
                <p className="font-headline-md text-headline-md text-primary">—</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-outline-variant/20">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Last Stay</span>
              <span className="font-label-md text-label-md text-primary">—</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Total Lifetime Spend</span>
              <span className="font-label-lg text-label-lg text-secondary">—</span>
            </div>
          </div>
        </div>

        {/* Right Column: Stay Details */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          {/* Room & Dates */}
          <div className={`${cardBase} overflow-hidden flex flex-col sm:flex-row`}>
            <div className="sm:w-2/5 h-48 sm:h-auto bg-surface-container flex items-center justify-center">
              <Icon name="bed" className="text-outline text-4xl" />
            </div>
            <div className="p-6 sm:w-3/5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-md text-headline-md text-primary m-0">
                    {detail.roomType?.name ?? 'Room'}
                  </h3>
                  {detail.room && (
                    <span className="bg-surface-variant text-primary px-2 py-1 rounded text-xs font-bold border border-outline-variant/30">
                      Room {detail.room.number}
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
                  {detail.roomType?.bedLabel ?? ''}{detail.room?.bedsLabel ? ` • ${detail.room.bedsLabel}` : ''}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={fieldLabelClass}>Check In</p>
                    <p className="font-body-lg text-body-lg text-primary font-medium">{formatDate(detail.checkInDate)}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{CHECK_IN_NOTE}</p>
                  </div>
                  <div>
                    <p className={fieldLabelClass}>Check Out</p>
                    <p className="font-body-lg text-body-lg text-primary font-medium">{formatDate(detail.checkOutDate)}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{CHECK_OUT_NOTE}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex gap-4">
                {(detail.roomType?.amenities ?? []).slice(0, 3).map((a) => (
                  <div key={a.label} className="flex items-center gap-1 text-on-surface-variant text-sm">
                    <Icon name={a.iconName} className="text-[16px]" />
                    {a.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2-Col Grid for Payment and Requests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {/* Payment Summary */}
            <div className={`${cardBase} p-6 flex flex-col`}>
              <h4 className={sectionTitleClass}>
                <Icon name="receipt_long" className="text-outline" />
                Payment Summary
              </h4>
              <div className="space-y-3 flex-1">
                {charges.map((charge) => (
                  <div key={charge.label} className="flex justify-between items-center">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{charge.label}</span>
                    <span className="font-body-sm text-body-sm text-primary">{usd.format(charge.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-label-lg text-label-lg text-primary">Total Balance</span>
                  <span className="font-headline-sm text-headline-sm text-primary">{usd.format(detail.totalCents / 100)}</span>
                </div>
                {detail.amountPaidCents > 0 && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-body-sm text-body-sm text-[#047857]">Paid</span>
                    <span className="font-body-sm text-body-sm text-[#047857]">-{usd.format(detail.amountPaidCents / 100)}</span>
                  </div>
                )}
                <div className="bg-secondary/10 p-4 rounded-lg flex justify-between items-center border border-secondary/20">
                  <span className="font-label-lg text-label-lg text-secondary">Outstanding</span>
                  <span className="font-headline-sm text-headline-sm text-secondary">{usd.format(detail.outstandingCents / 100)}</span>
                </div>
              </div>
            </div>

            {/* Special Requests & Notes */}
            <div className={`${cardBase} p-6 flex flex-col`}>
              <h4 className={sectionTitleClass}>
                <Icon name="room_service" className="text-outline" />
                Special Requests
              </h4>
              <div className="space-y-4 flex-1">
                {(detail.specialRequests ?? []).length === 0 && (
                  <p className="text-on-surface-variant text-sm text-center py-4">No special requests</p>
                )}
                {(detail.specialRequests ?? []).map((request) => (
                  <div key={request.title} className="flex items-start gap-3 p-3 bg-surface rounded-lg border border-outline-variant/20">
                    <Icon name={request.iconName ?? 'info'} className="shrink-0 mt-0.5 text-primary" />
                    <div>
                      <p className="font-label-md text-label-md text-primary mb-1">{request.title}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{request.description ?? ''}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 w-full py-2 border border-dashed border-outline-variant text-on-surface-variant rounded hover:bg-surface hover:text-primary transition-colors font-label-md text-label-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                <Icon name="add" className="text-[18px]" />
                Add Internal Note
              </button>
            </div>
          </div>

          {/* Timeline Section */}
          <div className={`${cardBase} p-6`}>
            <h4 className={cn(sectionTitleClass, 'mb-6')}>
              <Icon name="timeline" className="text-outline" />
              Activity Timeline
            </h4>
            <ol className="relative pl-6 border-l-2 border-surface-variant space-y-6 list-none m-0">
              <li className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -left-[31px] w-4 h-4 rounded-full border-2 bg-surface-container-lowest border-secondary"
                />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-1">
                  <p className="font-label-md text-label-md text-primary">Reservation Created</p>
                  <span className="font-label-md text-label-md text-on-surface-variant/70">{formatDate(detail.createdAt)}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Created via {detail.source || 'direct'} booking.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
