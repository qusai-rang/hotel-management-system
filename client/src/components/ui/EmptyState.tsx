import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface EmptyStateProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'children'> {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/** Dashed placeholder box (matches the "Add Internal Note" / "Assign Staff" empty patterns). */
export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('border border-dashed border-outline-variant/50 rounded-xl p-10 text-center', className)}>
      <span className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center mx-auto mb-4">
        <Icon name={icon} />
      </span>
      <h4 className="font-headline-sm text-headline-sm text-primary mb-1">{title}</h4>
      {description && <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">{description}</p>}
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-fixed/30 text-on-primary font-label-md text-label-md hover:bg-secondary-fixed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          <Icon name="add" className="text-base" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
