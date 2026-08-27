import { cn } from '@/utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'gold'
  | 'goldSoft'
  | 'outline'
  | 'outlinePrimary'
  | 'danger'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container shadow-sm hover:-translate-y-[1px] active:translate-y-0',
  gold: 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container',
  goldSoft: 'bg-secondary-fixed text-on-secondary-fixed-variant hover:bg-secondary-fixed-dim shadow-sm',
  outline:
    'bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container transition-colors',
  outlinePrimary:
    'bg-surface-container-lowest border border-primary text-primary shadow-sm hover:-translate-y-[1px] active:translate-y-0 transition-transform',
  danger:
    'bg-surface-container-lowest border border-error/30 text-error hover:bg-error-container/30 transition-colors',
  ghost: 'text-secondary hover:text-secondary-fixed-dim hover:underline transition-colors',
};

export const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 font-label-md text-label-md',
  md: 'h-10 px-4 py-2 font-label-lg text-label-lg',
  lg: 'h-12 px-6 font-label-lg text-label-lg rounded-lg',
};

export const baseClass =
  'inline-flex items-center justify-center gap-2 rounded font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40';

/** Class-string helper for styling non-button elements (e.g. react-router NavLink) like a Button. */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(baseClass, variantClasses[variant], sizeClasses[size], className);
}
