import { Link, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates';
import { useInvoice } from '@/hooks/useFeatureData';

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Invoice document — reference/invoice_luxestay_pro.
 * The action bar (id="action-bar") and the paper (id="invoice-paper") carry the
 * exact ids the source print stylesheet targets; see index.css @media print.
 */
export default function InvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(invoiceId ?? '');

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl">
        <LoadingState message="Loading invoice..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-4xl">
        <ErrorState
          message={error?.message ?? 'Failed to load invoice.'}
          onRetry={() => refetch()}
          retryLabel="Retry"
        />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="w-full max-w-4xl flex justify-center pt-16">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm p-10 text-center max-w-sm">
          <Icon name="receipt_long" className="text-4xl text-on-surface-variant" />
          <h1 className="font-headline-md text-headline-md text-primary mt-4">Invoice not found</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            No invoice matches <span className="font-semibold">{invoiceId}</span>.
          </p>
          <Link
            to="/billing"
            className="inline-flex items-center gap-2 mt-6 font-label-lg text-label-lg text-primary hover:text-secondary transition-colors"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Back to Billing
          </Link>
        </div>
      </div>
    );
  }

  const hotel = invoice.hotelBlock;
  const taxPct = Math.round(invoice.taxRateBps / 100);

  return (
    <>
      {/* Action bar — hidden when printing via #action-bar */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4" id="action-bar">
        <div className="flex items-center gap-2">
          <Link
            to="/billing"
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
          >
            <Icon name="arrow_back" className="mr-1" />
            <span className="font-label-lg text-label-lg">Back to Billing</span>
          </Link>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            title="Print invoice"
            className="bg-surface-container-lowest border border-primary text-primary px-4 py-2 rounded-DEFAULT font-label-lg text-label-lg flex items-center gap-2 hover:bg-surface-variant transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="print" />
            Print
          </button>
          <button
            type="button"
            title="Download PDF (not implemented in this phase)"
            className="bg-primary text-on-primary px-4 py-2 rounded-DEFAULT font-label-lg text-label-lg flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Icon name="download" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Paper — print stylesheet strips its chrome via #invoice-paper */}
      <div
        className="w-full max-w-4xl bg-surface-container-lowest shadow-sm rounded-lg p-8 sm:p-12 relative overflow-hidden"
        id="invoice-paper"
      >
        {/* Gold edge bar — reference line 231 */}
        <div className="absolute top-0 left-0 w-2 h-full bg-secondary-fixed" />

        {/* Header: hotel block + INVOICE title/meta */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-primary mb-2 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
              >
                hotel_class
              </span>
              {hotel.name}
            </h2>
            <div className="font-body-sm text-body-sm text-on-surface-variant space-y-1">
              {hotel.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <div className="text-right w-full md:w-auto">
            <h1 className="font-display-lg text-display-lg text-primary mb-4 tracking-tight">INVOICE</h1>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-body-sm text-body-sm text-on-surface text-left md:text-right w-full md:w-auto">
              <span className="text-on-surface-variant font-medium">Invoice Number:</span>
              <span className="font-semibold text-primary">{invoice.invoiceNumber}</span>
              <span className="text-on-surface-variant font-medium">Invoice Date:</span>
              <span>{fmtDate(invoice.issueDate)}</span>
              <span className="text-on-surface-variant font-medium">Due Date:</span>
              <span className="font-semibold">{fmtDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-12 border-t border-outline-variant pt-8">
          <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider mb-4">
            Bill To
          </h3>
          <div className="font-body-md text-body-md text-primary">
            <p className="font-bold text-lg mb-1">{invoice.billTo.name}</p>
            {invoice.billTo.addressLines.map((line) => (
              <p key={line} className="text-on-surface-variant">
                {line}
              </p>
            ))}
            {invoice.billTo.email && (
              <p className="text-on-surface-variant mt-2">{invoice.billTo.email}</p>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface text-on-surface-variant font-label-md text-label-md uppercase tracking-wider border-y border-outline-variant">
                <th className="py-3 px-4 font-medium">Description</th>
                <th className="py-3 px-4 font-medium text-center w-24">Qty</th>
                <th className="py-3 px-4 font-medium text-right w-32">Rate</th>
                <th className="py-3 px-4 font-medium text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
              {invoice.lineItems.map((item, idx) => (
                <tr key={`${item.description}-${idx}`} className="hover:bg-surface-bright transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-medium text-primary">{item.description}</p>
                    {item.subDescription && (
                      <p className="text-on-surface-variant mt-1 text-xs">{item.subDescription}</p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">{item.quantity}</td>
                  <td className="py-4 px-4 text-right">{usd(item.unitAmountCents)}</td>
                  <td className="py-4 px-4 text-right font-medium">{usd(item.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes + totals */}
        <div className="flex flex-col md:flex-row justify-between items-end border-t border-outline-variant pt-8">
          <div className="w-full md:w-1/2 mb-8 md:mb-0 text-on-surface-variant font-body-sm text-body-sm pr-8">
            <h4 className="font-label-md text-label-md text-primary uppercase tracking-wider mb-2">
              Payment Notes
            </h4>
            <p>Status: {invoice.status}</p>
          </div>
          <div className="w-full md:w-80 space-y-3 font-body-md text-body-md">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-medium text-primary">{usd(invoice.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Tax ({taxPct}%)</span>
              <span className="font-medium text-primary">{usd(invoice.taxCents)}</span>
            </div>
            {invoice.discountTotalCents > 0 && (
              <div className="flex justify-between text-on-surface-variant">
                <span>Discount</span>
                <span className="font-medium text-secondary">-{usd(invoice.discountTotalCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-headline-sm text-headline-sm font-bold text-primary pt-3 border-t border-outline-variant">
              <span>Total</span>
              <span>{usd(invoice.totalCents)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant pb-3 border-b border-outline-variant">
              <span>Amount Paid</span>
              <span className="font-medium text-primary">{usd(invoice.amountPaidCents)}</span>
            </div>
            <div className="flex justify-between font-headline-sm text-headline-sm font-bold text-error mt-2">
              <span>Balance Due</span>
              <span>{usd(invoice.balanceDueCents)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-on-surface-variant font-body-sm text-body-sm">
          <p>We appreciate your business.</p>
        </div>
      </div>
    </>
  );
}
