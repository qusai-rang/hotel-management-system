import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export function LoadingState({ message = 'Loading…', className }: { message?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('py-16 flex flex-col items-center justify-center gap-3', className)}>
      <Icon name="progress_activity" className="text-3xl text-secondary animate-spin" />
      <p className="font-label-md text-label-md text-on-surface-variant">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, retryLabel, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('bg-error-container/30 border border-error-container rounded-xl p-6 flex items-start gap-4', className)}
    >
      <span className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
        <Icon name="report_problem" fill />
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-headline-sm text-headline-sm text-error">{title}</h4>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{message}</p>
        {retryLabel && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded border border-error/40 text-error bg-surface-container-lowest hover:bg-error-container/30 transition-colors font-label-md text-label-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Convenience wrapper for sections that render `loading | error | data`. */
export function AsyncBoundary({
  isLoading,
  isError,
  error,
  children,
  loadingMessage,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  children: ReactNode;
  loadingMessage?: string;
}) {
  if (isLoading) return <LoadingState message={loadingMessage} />;
  if (isError) return <ErrorState message={error?.message ?? 'An unexpected error occurred.'} />;
  return <>{children}</>;
}
