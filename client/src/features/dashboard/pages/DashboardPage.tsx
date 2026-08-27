import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates';
import { useDashboardSummary } from '@/hooks/useFeatureData';

const metricCardClass =
  'bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-level-1 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300';

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function shortDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' - ' +
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusPill(status: string): { badge: string; label: string } {
  switch (status) {
    case 'pending':
      return { badge: 'bg-secondary-container text-on-secondary-container', label: 'Pending' };
    case 'confirmed':
      return { badge: 'bg-surface-variant text-primary', label: 'Confirmed' };
    case 'checked_in':
      return { badge: 'bg-primary text-on-primary', label: 'Checked In' };
    case 'checked_out':
      return { badge: 'bg-slate-200 text-slate-600', label: 'Checked Out' };
    case 'cancelled':
      return { badge: 'bg-error-container text-on-error-container', label: 'Cancelled' };
    default:
      return { badge: 'bg-slate-100 text-slate-600', label: status };
  }
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function TrendCaption({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 mt-2 text-primary-fixed-dim text-body-sm">
      <Icon name="trending_up" className="text-[16px]" />
      <span>{children}</span>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const { data: summary, isLoading, isError, error, refetch } = useDashboardSummary();

  const rangeBtn = (active: boolean) =>
    active
      ? 'px-3 py-1 bg-surface-container-low text-primary font-label-md rounded border border-outline-variant hover:bg-surface-variant transition cursor-pointer'
      : 'px-3 py-1 bg-surface text-on-surface-variant font-label-md rounded border border-transparent hover:bg-surface-variant transition cursor-pointer';

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (isError) return <ErrorState message={error?.message ?? 'Failed to load dashboard.'} onRetry={() => refetch()} retryLabel="Retry" />;

  const s = summary!;

  const metrics = [
    { label: 'Occupancy', icon: 'pie_chart', value: `${s.occupancy.occupancyRate}%`, trend: `${s.occupancy.occupiedRooms} of ${s.occupancy.totalRooms} rooms` },
    { label: 'Available Rooms', icon: 'meeting_room', value: String(s.occupancy.availableRooms), caption: `Out of ${s.occupancy.totalRooms} total` },
    { label: "Today's Revenue", icon: 'account_balance_wallet', value: usd(s.revenue.todayCapturedCents), trend: `${s.revenue.todayPaymentCount} payment${s.revenue.todayPaymentCount === 1 ? '' : 's'} today` },
  ];

  const quickActions = [
    { label: 'Quick Booking', icon: 'flash_on', chipClass: 'bg-secondary-container text-secondary group-hover:bg-secondary group-hover:text-on-secondary', path: '/reservations/new' },
    { label: 'Housekeeping', icon: 'cleaning_services', chipClass: 'bg-surface-container-high text-primary group-hover:bg-primary group-hover:text-on-primary', path: '/housekeeping' },
    { label: 'Billing', icon: 'receipt_long', chipClass: 'bg-surface-container-high text-primary group-hover:bg-primary group-hover:text-on-primary', path: '/billing' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-2">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Overview</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Today's property performance and critical tasks.
          </p>
        </div>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase">{today}</p>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.label} className={metricCardClass}>
            <div className="flex justify-between items-start">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{m.label}</span>
              <Icon name={m.icon} className="text-secondary" />
            </div>
            <div className="mt-4">
              <span className="font-display-lg text-display-lg text-primary">{m.value}</span>
              {m.trend && <TrendCaption>{m.trend}</TrendCaption>}
              {m.caption && (
                <div className="flex items-center gap-1 mt-2 text-on-surface-variant text-body-sm">
                  <span>{m.caption}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Card 4 — actionable */}
        <div className={metricCardClass + ' bg-primary border-primary-container relative overflow-hidden'}>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-primary to-surface-tint opacity-50 pointer-events-none" />
          <div className="relative z-10 flex justify-between items-start">
            <span className="font-label-md text-label-md text-secondary-fixed uppercase tracking-wider">Pending Check-ins</span>
            <Icon name="luggage" className="text-secondary-fixed" />
          </div>
          <div className="relative z-10 mt-4 flex items-end justify-between">
            <span className="font-display-lg text-display-lg text-on-primary">{s.today.arrivals}</span>
            <button
              type="button"
              onClick={() => navigate('/reservations')}
              className="bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md px-3 py-1.5 rounded-full hover:bg-secondary-fixed-dim transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              View List
            </button>
          </div>
        </div>
      </div>

      {/* Chart & quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy trend — static chart, no historical API */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-level-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-headline-sm text-primary">Occupancy Trend</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRange('7d')} className={rangeBtn(range === '7d')}>7D</button>
              <button type="button" onClick={() => setRange('30d')} className={rangeBtn(range === '30d')}>30D</button>
            </div>
          </div>
          <div className="h-64 w-full relative chart-grid-lines border-l border-b border-outline-variant/30 flex items-end pt-4 mb-6">
            <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-label-md text-on-surface-variant pb-6">
              <span>100%</span><span>75%</span><span>50%</span><span>25%</span>
            </div>
            <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
              <defs>
                <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#775a19" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#775a19" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="chart-line" d="M 0,150 C 100,140 200,80 300,90 C 400,100 500,40 600,50 C 700,60 800,10 900,30 L 1000,20" fill="none" stroke="#775a19" strokeLinecap="round" strokeWidth="3" />
              <path d="M 0,150 C 100,140 200,80 300,90 C 400,100 500,40 600,50 C 700,60 800,10 900,30 L 1000,20 L 1000,200 L 0,200 Z" fill="url(#lineGrad)" opacity="0.5" />
              <circle cx="300" cy="90" fill="#ffffff" r="4" stroke="#775a19" strokeWidth="2" />
              <circle cx="600" cy="50" fill="#ffffff" r="4" stroke="#775a19" strokeWidth="2" />
              <circle cx="900" cy="30" fill="#ffffff" r="4" stroke="#775a19" strokeWidth="2" />
            </svg>
            <div className="absolute -bottom-6 left-0 w-full flex justify-between text-label-md text-on-surface-variant px-4">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-level-1 flex flex-col">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Quick Actions</h3>
          <div className="space-y-3 flex-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="w-full flex items-center justify-between p-4 bg-surface rounded-lg border border-outline-variant hover:border-secondary transition-colors group cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${action.chipClass} flex items-center justify-center transition-colors`}>
                    <Icon name={action.icon} className="text-[18px]" />
                  </div>
                  <span className="font-label-md text-label-md text-primary">{action.label}</span>
                </div>
                <Icon name="arrow_forward" className="text-on-surface-variant group-hover:text-secondary" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-level-1 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-sm text-headline-sm text-primary">Recent Bookings</h3>
          <button
            type="button"
            onClick={() => navigate('/reservations')}
            className="text-secondary font-label-md text-label-md hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            View All <Icon name="chevron_right" className="text-[16px]" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-primary font-label-md text-label-md uppercase tracking-wider border-b border-outline-variant/30">
                <th className="px-6 py-4 font-semibold">Guest Name</th>
                <th className="px-6 py-4 font-semibold">Room Type</th>
                <th className="px-6 py-4 font-semibold">Dates</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface-variant divide-y divide-outline-variant/30">
              {s.recentBookings.length > 0 ? (
                s.recentBookings.map((booking) => {
                  const pill = statusPill(booking.status);
                  return (
                    <tr key={booking.id} className="hover:bg-surface-bright transition-colors">
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-primary-fixed-dim text-primary flex items-center justify-center font-bold shrink-0">
                            {initials(booking.guestName)}
                          </span>
                          <span className="font-medium text-primary">{booking.guestName}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">{booking.roomType}</td>
                      <td className="px-6 py-4">{shortDate(booking.checkInDate)} - {shortDate(booking.checkOutDate)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-[11px] ${pill.badge}`}>
                          {pill.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center font-body-sm text-body-sm text-on-surface-variant">
                    No recent bookings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
