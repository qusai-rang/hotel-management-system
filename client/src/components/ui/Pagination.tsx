import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageWindow(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: Array<number | 'ellipsis'> = [1];
  if (page > 3) pages.push('ellipsis');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p += 1) {
    pages.push(p);
  }
  if (page < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  className,
}: PaginationProps) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const navBtn =
    'p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40';
  const pageBase =
    'w-8 h-8 flex items-center justify-center rounded-full font-label-md text-label-md cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40';
  const pageActive = 'bg-secondary-container text-on-secondary-container font-semibold';
  const pageIdle = 'text-on-surface-variant hover:bg-surface-variant';

  return (
    <div
      className={cn(
        'px-4 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-lowest border-t border-outline-variant',
        className,
      )}
    >
      <p className="text-body-sm text-body-sm text-on-surface-variant">
        Showing <span className="font-medium">{from}</span>-<span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </p>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button type="button" className={navBtn} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <Icon name="chevron_left" />
        </button>
        {pageWindow(page, totalPages).map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`e-${idx}`} className="w-6 text-center text-body-sm text-on-surface-variant select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
              className={cn(pageBase, p === page ? pageActive : pageIdle)}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={navBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <Icon name="chevron_right" />
        </button>
      </nav>
    </div>
  );
}
