import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/utils/cn';
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useCheckoutSession,
  useCheckoutPayment,
  useCheckoutComplete,
} from '@/hooks/useFeatureData';
import type { CheckoutPaymentPayload } from '@/services/checkoutApi';

type PaymentMethod = 'card' | 'cash' | 'online';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; iconName: string }[] = [
  { key: 'card', label: 'Card', iconName: 'credit_card' },
  { key: 'cash', label: 'Cash', iconName: 'payments' },
  { key: 'online', label: 'Online', iconName: 'language' },
];

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservationId') ?? '';

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [amountStr, setAmountStr] = useState('');
  const [generateInvoice, setGenerateInvoice] = useState(true);

  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
    error: sessionErr,
    refetch: refetchSession,
  } = useCheckoutSession(reservationId);

  const paymentMutation = useCheckoutPayment();
  const completeMutation = useCheckoutComplete();

  if (!reservationId) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md flex items-center justify-center">
        <EmptyState title="No reservation specified." />
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md">
        <header className="fixed top-0 left-0 w-full h-header-height bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-gutter z-40">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate('/reservations')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors group cursor-pointer focus-visible:outline-none"
            >
              <Icon name="arrow_back" className="text-on-surface-variant group-hover:text-primary transition-colors" />
            </button>
            <div className="flex items-baseline gap-3">
              <h1 className="font-headline-md text-headline-md font-bold text-primary">LuxeStay Pro</h1>
              <span className="text-on-surface-variant opacity-50 hidden sm:inline-block">|</span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant font-medium hidden sm:inline-block">
                Check-out Workflow
              </span>
            </div>
          </div>
        </header>
        <main className="pt-[calc(theme(spacing.header-height)+theme(spacing.container-padding))] px-gutter md:px-container-padding pb-container-padding max-w-7xl mx-auto">
          <LoadingState message="Loading checkout session..." />
        </main>
      </div>
    );
  }

  if (sessionError) {
    const status = sessionErr && typeof sessionErr === 'object' && 'status' in sessionErr
      ? (sessionErr as { status: number }).status
      : null;
    const msg = status === 404
      ? 'Reservation not found.'
      : status === 401 || status === 403
        ? 'You do not have permission to check out this reservation.'
        : sessionErr?.message ?? 'Failed to load checkout session.';

    return (
      <div className="min-h-screen bg-background text-on-background font-body-md">
        <header className="fixed top-0 left-0 w-full h-header-height bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-gutter z-40">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate('/reservations')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors group cursor-pointer focus-visible:outline-none"
            >
              <Icon name="arrow_back" className="text-on-surface-variant group-hover:text-primary transition-colors" />
            </button>
            <div className="flex items-baseline gap-3">
              <h1 className="font-headline-md text-headline-md font-bold text-primary">LuxeStay Pro</h1>
              <span className="text-on-surface-variant opacity-50 hidden sm:inline-block">|</span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant font-medium hidden sm:inline-block">
                Check-out Workflow
              </span>
            </div>
          </div>
        </header>
        <main className="pt-[calc(theme(spacing.header-height)+theme(spacing.container-padding))] px-gutter md:px-container-padding pb-container-padding max-w-7xl mx-auto">
          <ErrorState message={msg} onRetry={() => refetchSession()} retryLabel="Retry" />
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md">
        <header className="fixed top-0 left-0 w-full h-header-height bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-gutter z-40">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate('/reservations')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors group cursor-pointer focus-visible:outline-none"
            >
              <Icon name="arrow_back" className="text-on-surface-variant group-hover:text-primary transition-colors" />
            </button>
            <div className="flex items-baseline gap-3">
              <h1 className="font-headline-md text-headline-md font-bold text-primary">LuxeStay Pro</h1>
              <span className="text-on-surface-variant opacity-50 hidden sm:inline-block">|</span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant font-medium hidden sm:inline-block">
                Check-out Workflow
              </span>
            </div>
          </div>
        </header>
        <main className="pt-[calc(theme(spacing.header-height)+theme(spacing.container-padding))] px-gutter md:px-container-padding pb-container-padding max-w-7xl mx-auto">
          <EmptyState title="No checkout session available for this reservation." />
        </main>
      </div>
    );
  }

  const roomNumber = session.room?.number ?? '—';
  const guestName = session.guest?.name ?? 'Guest';
  const statusLabel =
    session.reservation.status === 'checked_in' ? 'Pending Settlement'
    : session.reservation.status === 'confirmed' ? 'Ready for Check-in'
    : session.reservation.status;

  const folio = session.folio;
  const balanceCents = folio?.computed.balanceCents ?? 0;
  const subtotalCents = folio?.computed.subtotalCents ?? 0;
  const taxCents = folio?.computed.taxCents ?? 0;
  const discountCents = folio?.computed.discountTotalCents ?? 0;
  const totalCents = folio?.computed.totalCents ?? 0;
  const paidCents = folio?.computed.paidCents ?? 0;
  const taxRatePct = folio ? (folio.taxRateBps / 100).toFixed(0) : '12';

  const lineItems = folio?.charges ?? [];
  const discounts = folio?.discounts ?? [];

  const collectedAmount = amountStr === ''
    ? balanceCents
    : Math.round(parseFloat(amountStr) * 100);

  const isPaid = balanceCents <= 0;
  const isAlreadyCheckedOut = session.reservation.status === 'checked_out';
  const canCollectPayment = !isPaid && !isAlreadyCheckedOut && collectedAmount > 0 && !paymentMutation.isPending && !completeMutation.isPending;
  const canCompleteCheckout = !paymentMutation.isPending && !completeMutation.isPending && !isAlreadyCheckedOut;

  const handleCollectPayment = () => {
    const payload: CheckoutPaymentPayload = { amountCents: collectedAmount, method };
    paymentMutation.mutate(
      { reservationId, payload },
      {
        onSuccess: () => {
          setAmountStr('');
          refetchSession();
        },
      },
    );
  };

  const handleConfirmCheckout = () => {
    completeMutation.mutate(reservationId, {
      onSuccess: (result) => {
        if (result.invoiceNumber) {
          navigate(`/billing/invoices/${result.invoiceNumber}`, { replace: true });
        } else {
          navigate('/reservations', { replace: true });
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      {/* Transactional header */}
      <header className="fixed top-0 left-0 w-full h-header-height bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-gutter z-40">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate('/reservations')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors group cursor-pointer focus-visible:outline-none"
          >
            <Icon name="arrow_back" className="text-on-surface-variant group-hover:text-primary transition-colors" />
          </button>
          <div className="flex items-baseline gap-3">
            <h1 className="font-headline-md text-headline-md font-bold text-primary">LuxeStay Pro</h1>
            <span className="text-on-surface-variant opacity-50 hidden sm:inline-block">|</span>
            <span className="font-headline-sm text-headline-sm text-on-surface-variant font-medium hidden sm:inline-block">
              Check-out Workflow
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2" title="Need Help?">
            <span className="material-symbols-outlined text-outline">help</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Need Help?</span>
          </div>
        </div>
      </header>

      <main className="pt-[calc(theme(spacing.header-height)+theme(spacing.container-padding))] px-gutter md:px-container-padding pb-container-padding max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-1">Check-out Procedure</p>
            <h2 className="font-headline-lg text-headline-lg text-primary md:hidden">{roomNumber}</h2>
            <h2 className="font-headline-lg text-headline-lg text-primary hidden md:block">
              Check-out: Room {roomNumber} - {guestName}
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full border border-secondary/20">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Error banner for mutations */}
        {(paymentMutation.isError || completeMutation.isError) && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-2">
            <Icon name="error" className="text-[20px]" />
            {paymentMutation.error?.message ?? completeMutation.error?.message ?? 'An error occurred.'}
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Summary (Stay & Payment) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/20 rounded-bl-full -mr-16 -mt-16 blur-2xl z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Icon name="receipt_long" className="text-primary" />
                  <h3 className="font-headline-sm text-headline-sm text-primary">Stay Summary</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 pb-2 border-b border-outline-variant/50 font-label-md text-label-md text-on-surface-variant uppercase">
                    <div className="col-span-6 md:col-span-8">Description</div>
                    <div className="col-span-2 text-right hidden md:block">Qty</div>
                    <div className="col-span-6 md:col-span-2 text-right">Amount</div>
                  </div>
                  {lineItems.map((item, idx) => (
                    <div
                      key={`${item.description}-${idx}`}
                      className="grid grid-cols-12 gap-4 items-center group hover:bg-surface/50 p-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div className="col-span-6 md:col-span-8">
                        <p className="font-body-md text-body-md text-on-surface font-medium">{item.description}</p>
                        {item.department && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{item.department}</p>
                        )}
                      </div>
                      <div className="col-span-2 text-right hidden md:block font-body-md text-body-md text-on-surface-variant">
                        {item.quantity}
                      </div>
                      <div className="col-span-6 md:col-span-2 text-right font-body-md text-body-md text-on-surface">
                        {usd(item.totalCents)}
                      </div>
                    </div>
                  ))}
                  {lineItems.length === 0 && (
                    <p className="text-on-surface-variant font-body-sm text-body-sm py-4">No charges recorded.</p>
                  )}
                </div>
                {/* Subtotals */}
                <div className="mt-6 pt-4 border-t border-outline-variant space-y-2">
                  <div className="flex justify-between items-center font-body-md text-body-md text-on-surface-variant">
                    <span>Subtotal</span>
                    <span>{usd(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between items-center font-body-md text-body-md text-on-surface-variant">
                    <span>Taxes ({taxRatePct}%)</span>
                    <span>{usd(taxCents)}</span>
                  </div>
                  {discounts.map((d, idx) => (
                    <div key={`disc-${idx}`} className="flex justify-between items-center font-body-md text-body-md text-secondary">
                      <span>{d.label}</span>
                      <span>-{usd(d.amountCents)}</span>
                    </div>
                  ))}
                  {discounts.length === 0 && discountCents > 0 && (
                    <div className="flex justify-between items-center font-body-md text-body-md text-secondary">
                      <span>Discount</span>
                      <span>-{usd(discountCents)}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Payment Summary Totals */}
            <section className="glass-panel rounded-xl p-6 bg-surface-container-low border-none shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/30">
                <div className="pt-4 sm:pt-0 sm:pr-4 flex flex-col items-center sm:items-start">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase mb-1">Total Amount</span>
                  <span className="font-headline-md text-headline-md text-on-surface">{usd(totalCents)}</span>
                </div>
                <div className="pt-4 sm:pt-0 sm:px-4 flex flex-col items-center sm:items-start">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase mb-1">Already Paid</span>
                  <span className="font-headline-md text-headline-md text-on-surface-variant/80">
                    {usd(paidCents)}
                  </span>
                </div>
                <div className="pt-4 sm:pt-0 sm:pl-4 flex flex-col items-center sm:items-end">
                  <span className="font-label-md text-label-md text-secondary uppercase mb-1 font-bold">
                    Remaining Balance
                  </span>
                  <span className={cn(
                    'font-display-lg text-display-lg',
                    balanceCents > 0 ? 'text-primary' : 'text-secondary',
                  )}>
                    {usd(balanceCents)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Action Area */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Payment Processing */}
            <section className="glass-panel rounded-xl p-6 bg-white border border-outline-variant shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Icon name="credit_card" className="text-primary" />
                <h3 className="font-headline-sm text-headline-sm text-primary">Process Payment</h3>
              </div>

              {isPaid ? (
                <div className="flex items-center gap-2 p-4 bg-secondary/10 rounded-lg mb-6">
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                  <span className="font-body-md text-body-md text-secondary font-medium">
                    Balance is fully settled.
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {PAYMENT_METHODS.map((pm) => (
                      <label key={pm.key} className="cursor-pointer">
                        <input
                          type="radio"
                          name="payment_method"
                          className="peer sr-only"
                          checked={method === pm.key}
                          onChange={() => setMethod(pm.key)}
                        />
                        <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-outline-variant peer-checked:border-secondary peer-checked:bg-secondary-fixed/20 peer-checked:text-on-secondary-fixed transition-all hover:bg-surface">
                          <Icon name={pm.iconName} className="mb-1" />
                          <span className="font-label-md text-label-md">{pm.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {method === 'card' && (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Card on File</label>
                        <div className="flex items-center justify-between p-3 border border-outline-variant rounded-lg bg-surface-bright">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-6 bg-primary rounded flex items-center justify-center text-white text-[10px] font-bold">
                              CARD
                            </div>
                            <span className="font-body-md text-body-md text-on-surface">On file</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                      Amount to Collect
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-md text-body-md text-on-surface-variant">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label="Amount to collect"
                        value={amountStr === '' ? (balanceCents / 100).toFixed(2) : amountStr}
                        onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-full h-10 pl-8 pr-3 border border-outline-variant rounded-lg focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-body-md text-body-md text-on-surface transition-shadow outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {!isPaid && (
                <button
                  type="button"
                  onClick={handleCollectPayment}
                  disabled={!canCollectPayment}
                  className="w-full h-10 mt-6 bg-surface-container-high border border-outline text-on-surface font-label-lg text-label-lg rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <Icon name={paymentMutation.isSuccess ? 'check_circle' : 'contactless'} className="text-[20px]" />
                  {paymentMutation.isPending ? 'Collecting...' : paymentMutation.isSuccess ? 'Payment Collected' : 'Collect Payment'}
                </button>
              )}

              {paymentMutation.isSuccess && (
                <p className="mt-3 font-body-sm text-body-sm text-emerald-700">
                  Payment collected successfully.
                </p>
              )}

              {/* Generate Invoice row */}
              {generateInvoice && session.reservation.status === 'checked_out' && (
                <div
                  className="flex items-center justify-between p-4 bg-surface rounded-lg border border-outline-variant cursor-pointer mt-4"
                  onClick={() => navigate('/billing')}
                >
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">Generate Invoice</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Email folio to guest automatically
                    </p>
                  </div>
                  <label
                    className="relative inline-flex items-center cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={generateInvoice}
                      onChange={(e) => setGenerateInvoice(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                </div>
              )}
            </section>

            {/* Final Action */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={!canCompleteCheckout}
                className={cn(
                  'w-full py-4 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
                  canCompleteCheckout && 'hover:bg-primary-container',
                  (completeMutation.isPending || isAlreadyCheckedOut) && 'opacity-80',
                )}
              >
                <Icon name={completeMutation.isSuccess ? 'check_circle' : 'how_to_reg'} />
                {completeMutation.isPending
                  ? 'Completing...'
                  : completeMutation.isSuccess
                    ? 'Check-out Confirmed'
                    : 'Confirm Check-out'}
              </button>
              {completeMutation.isPending ? (
                <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-3">
                  Completing check-out, please wait...
                </p>
              ) : completeMutation.isSuccess ? (
                <p className="text-center font-body-sm text-body-sm text-emerald-700 mt-3">
                  Check-out confirmed. Redirecting...
                </p>
              ) : (
                <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-3">
                  Room will be marked as &quot;Dirty - Requires Cleaning&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
