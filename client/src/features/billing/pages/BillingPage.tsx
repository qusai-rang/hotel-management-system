import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates';
import { cn } from '@/utils/cn';
import { useBillingTransactions, useBillingMetrics } from '@/hooks/useFeatureData';
import type { BillingTransactionRow } from '@/types/api';

type DateFilter = 'last7' | 'today' | 'month' | 'custom';
type StatusFilter = 'all' | 'captured' | 'pending' | 'refunded' | 'failed';
type DepartmentFilter = 'all' | 'room' | 'restaurant' | 'spa';

const STATUS_PILL: Record<string, string> = {
  captured: 'bg-surface-container-high text-primary',
  pending: 'bg-secondary-container/30 text-on-secondary-container border border-secondary-container',
  refunded: 'bg-error-container/30 text-on-error-container border border-error-container',
  failed: 'bg-error-container/30 text-on-error-container border border-error-container',
};

const DEPT_ICON: Record<string, string> = { room: 'bed', restaurant: 'restaurant', spa: 'spa' };
const DEPT_LABEL: Record<string, string> = { room: 'Room Rate', restaurant: 'Restaurant', spa: 'Spa Service' };
const METHOD_LABEL: Record<string, string> = { card: 'Card', cash: 'Cash', online: 'Online', room_charge: 'Room Charge' };

function usd(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getDateRangeParams(range: DateFilter): { from?: string; to?: string } {
  const now = new Date();
  if (range === 'today') {
    return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString() };
  }
  if (range === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
  }
  if (range === 'last7') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { from: start.toISOString() };
  }
  return {};
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-10 pl-4 pr-10 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
        expand_more
      </span>
    </div>
  );
}

function TransactionRow({ tx }: { tx: BillingTransactionRow }) {
  return (
    <tr className="hover:bg-surface-container-lowest/50 transition-colors group">
      <td className="p-4">
        <div className="font-body-sm text-body-sm text-on-background">{fmtDate(tx.createdAt)}</div>
        <div className="font-label-md text-label-md text-on-surface-variant mt-0.5">{fmtTime(tx.createdAt)}</div>
      </td>
      <td className="p-4">
        <div className="font-body-md text-body-md text-primary font-medium">{tx.guestName}</div>
        <div className="font-label-md text-label-md text-on-surface-variant mt-0.5">Folio {tx.folioNumber}</div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Icon name={DEPT_ICON[tx.department] ?? 'receipt'} className="text-[18px] text-on-surface-variant" />
          <span className="font-body-sm text-body-sm text-on-background">{DEPT_LABEL[tx.department] ?? tx.description}</span>
        </div>
      </td>
      <td className="p-4 text-right font-body-md text-body-md text-on-background font-medium">
        {tx.amountCents < 0 ? '-' : ''}{usd(tx.amountCents)}
      </td>
      <td className="p-4 text-center">
        <span
          className={cn(
            'inline-flex items-center justify-center px-2.5 py-1 rounded-full font-label-md text-label-md',
            STATUS_PILL[tx.status] ?? 'bg-slate-100 text-slate-600',
          )}
        >
          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
        </span>
      </td>
      <td className="p-4 font-body-sm text-body-sm text-on-surface-variant">{METHOD_LABEL[tx.method] ?? tx.method}</td>
      <td className="p-4 text-right">
        <button type="button" title="More actions" className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container opacity-0 group-hover:opacity-100 transition-all cursor-pointer focus-visible:opacity-100 focus-visible:outline-none">
          <Icon name="more_vert" className="text-[20px]" />
        </button>
      </td>
    </tr>
  );
}

export default function BillingPage() {
  const [dateRange, setDateRange] = useState<DateFilter>('last7');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [department, setDepartment] = useState<DepartmentFilter>('all');
  const [page, setPage] = useState(1);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = { page, pageSize: 20 };
    const dates = getDateRangeParams(dateRange);
    if (dates.from) f.from = dates.from;
    if (dates.to) f.to = dates.to;
    if (status !== 'all') f.status = status;
    if (department !== 'all') f.department = department;
    return f;
  }, [dateRange, status, department, page]);

  const { data: txResult, isLoading: txLoading, isError: txError, error: txErr, refetch: refetchTx } = useBillingTransactions(filters);
  const { data: metrics, isLoading: metricsLoading, isError: metricsError, error: metricsErr, refetch: refetchMetrics } = useBillingMetrics();

  const transactions = txResult?.items ?? [];
  const totalTx = txResult?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalTx / pageSize));
  const displayStart = totalTx > 0 ? (page - 1) * pageSize + 1 : 0;
  const displayEnd = Math.min(page * pageSize, totalTx);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background m-0">
            Billing &amp; Payments
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 m-0">
            Manage transactions, invoices, and financial performance.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            title="Export"
            className="h-10 px-4 py-2 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-label-md text-label-md font-medium hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="download" className="text-[18px]" />
            Export
          </button>
          <button
            type="button"
            title="Quick Add Charge"
            className="h-10 px-4 py-2 rounded bg-primary text-on-primary font-label-md text-label-md font-medium hover:bg-primary-container hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="add" className="text-[18px]" />
            Quick Add Charge
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      {metricsError ? (
        <ErrorState
          message={metricsErr?.message ?? 'Failed to load metrics.'}
          onRetry={() => refetchMetrics()}
          retryLabel="Retry"
          className="mb-8"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="hk-surface-card p-6 flex flex-col relative overflow-hidden min-h-[140px]">
                <LoadingState className="py-4" />
              </div>
            ))
          ) : metrics ? (
            <>
              <MetricCard
                label="Total Revenue (MTD)"
                value={usd(metrics.mtdCapturedRevenueCents)}
                subText="MTD captured revenue"
                subTone="positive"
                trendIcon="trending_up"
                chipClass="bg-primary-fixed text-primary"
                chipIcon="account_balance_wallet"
              />
              <MetricCard
                label="Pending Payments"
                value={usd(metrics.pendingOpenBalanceCents)}
                subText="Outstanding balance"
                subTone="muted"
                chipClass="bg-secondary-container text-on-secondary-container"
                chipIcon="pending_actions"
              />
              <MetricCard
                label="Today's Transactions"
                value={String(metrics.todayPaymentCount)}
                subText={`${usd(metrics.todayPaymentValueCents)} processed`}
                subTone="positive"
                chipClass="bg-surface-container-highest text-on-surface"
                chipIcon="receipt_long"
              />
              <MetricCard
                label="Refunds (MTD)"
                value={usd(metrics.mtdRefundsCents)}
                subText="MTD refunds"
                subTone="muted"
                chipClass="bg-error-container text-on-error-container"
                chipIcon="currency_exchange"
              />
            </>
          ) : null}
        </div>
      )}

      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <h3 className="font-headline-sm text-headline-sm text-on-background m-0 w-full md:w-auto">Recent Transactions</h3>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <FilterSelect
            label="Filter by date range"
            value={dateRange}
            onChange={(v) => { setDateRange(v as DateFilter); setPage(1); }}
            options={[
              { value: 'last7', label: 'Last 7 Days' },
              { value: 'today', label: 'Today' },
              { value: 'month', label: 'This Month' },
              { value: 'custom', label: 'Custom Range...' },
            ]}
          />
          <FilterSelect
            label="Filter by status"
            value={status}
            onChange={(v) => { setStatus(v as StatusFilter); setPage(1); }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'captured', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
          <FilterSelect
            label="Filter by department"
            value={department}
            onChange={(v) => { setDepartment(v as DepartmentFilter); setPage(1); }}
            options={[
              { value: 'all', label: 'All Departments' },
              { value: 'room', label: 'Room' },
              { value: 'restaurant', label: 'Restaurant' },
              { value: 'spa', label: 'Spa' },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="hk-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          {txLoading ? (
            <LoadingState message="Loading transactions..." />
          ) : txError ? (
            <ErrorState
              message={txErr?.message ?? 'Failed to load transactions.'}
              onRetry={() => refetchTx()}
              retryLabel="Retry"
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-outline-variant">
                  <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase whitespace-nowrap">Date &amp; Time</th>
                  <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase whitespace-nowrap">Guest / Folio</th>
                  <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase whitespace-nowrap">Type</th>
                  <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase whitespace-nowrap text-right">Amount</th>
                  <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase whitespace-nowrap text-center">Status</th>
                  <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase whitespace-nowrap">Method</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {transactions.length > 0 ? (
                  transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center font-body-sm text-body-sm text-on-surface-variant">
                      No transactions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {!txLoading && !txError && totalTx > 0 && (
          <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Showing {displayStart} to {displayEnd} of {totalTx} entries
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded font-label-md text-label-md cursor-pointer focus-visible:outline-none',
                    page === n
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container',
                  )}
                >
                  {n}
                </button>
              ))}
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
    </>
  );
}

function MetricCard({
  label,
  value,
  subText,
  subTone,
  trendIcon,
  chipClass,
  chipIcon,
}: {
  label: string;
  value: string;
  subText: string;
  subTone: 'positive' | 'muted';
  trendIcon?: string;
  chipClass: string;
  chipIcon: string;
}) {
  return (
    <div className="hk-surface-card p-6 flex flex-col relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container-high rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
      <div className="flex justify-between items-start mb-4 z-10">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{label}</span>
        <div className={cn('p-2 rounded', chipClass)}>
          <Icon name={chipIcon} className="text-[20px]" />
        </div>
      </div>
      <div className="z-10">
        <h3 className="font-headline-lg text-headline-lg text-on-background m-0">{value}</h3>
        <p
          className={cn(
            'font-body-sm text-body-sm mt-1 m-0 flex items-center gap-1',
            subTone === 'positive' ? 'text-secondary' : 'text-on-surface-variant',
          )}
        >
          {trendIcon && <Icon name={trendIcon} className="text-[14px]" />}
          {subText}
        </p>
      </div>
    </div>
  );
}
