import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export interface DataColumn<T> {
  id: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Array<DataColumn<T>>;
  data: T[];
  rowKey: (row: T) => string;
  density?: 'comfortable' | 'compact';
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: ReadonlySet<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: () => void;
  stickyHeader?: boolean;
  maxHeight?: string;
  /** Extra trailing column (e.g. row actions). Consumer controls reveal styling. */
  actions?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

const cellPadding = {
  comfortable: 'px-6 py-4',
  compact: 'px-4 py-3',
} as const;

export function DataTable<T>({
  columns,
  data,
  rowKey,
  density = 'comfortable',
  onRowClick,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
  stickyHeader,
  maxHeight,
  actions,
  emptyState,
  className,
}: DataTableProps<T>) {
  const pad = cellPadding[density];
  const allSelected = Boolean(selectable && selectedIds && data.length > 0 && data.every((r) => selectedIds.has(rowKey(r))));

  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={cn('bg-surface-container-lowest border border-outline-variant/30 rounded-xl custom-shadow-card overflow-hidden', className)}>
      <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full text-left border-collapse min-w-max md:min-w-0">
          <thead className={cn('border-b border-outline-variant/50', stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-surface-bright">
              {selectable && (
                <th className={cn(pad, 'w-12')}>
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    onChange={() => onToggleAll?.()}
                    className="w-4 h-4 cursor-pointer accent-secondary"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    pad,
                    'font-label-md text-label-md uppercase tracking-wider text-primary font-medium',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th className={cn(pad, 'text-right')} aria-label="Actions" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 font-body-sm text-body-sm text-on-surface-variant">
            {data.map((row) => {
              const id = rowKey(row);
              const isSelected = selectable && selectedIds?.has(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'group transition-colors hover:bg-surface-bright/50',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-secondary-fixed/20',
                  )}
                >
                  {selectable && (
                    <td className={pad} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${id}`}
                        checked={isSelected ?? false}
                        onChange={() => onToggleRow?.(id)}
                        className="w-4 h-4 cursor-pointer accent-secondary"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        pad,
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.cellClassName,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className={cn(pad, 'text-right whitespace-nowrap')} onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!stickyHeader && data.length === 0 && (
        <div className="px-6 py-10 text-center font-body-sm text-body-sm text-on-surface-variant">No records found.</div>
      )}
    </div>
  );
}

/** Hover-reveal row action button exactly as seen in dashboard/enhanced_reservations tables. */
interface RowActionButtonProps {
  icon: string;
  label: string;
  revealOnHover?: boolean;
  onClick?: () => void;
}

export function RowActionButton({ icon, label, revealOnHover = true, onClick }: RowActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
        revealOnHover && 'opacity-0 group-hover:opacity-100 transition-opacity',
      )}
    >
      <Icon name={icon} className="text-base" />
    </button>
  );
}
