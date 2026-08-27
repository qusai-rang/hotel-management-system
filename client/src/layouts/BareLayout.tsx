import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@/components/ui';
import { cn } from '@/utils/cn';

interface BareLayoutProps {
  title: string;
  subtitle?: string;
  /** History back arrow on the left (add_edit_room pattern). */
  showBack?: boolean;
  /** Close (X) button on the far right. */
  onClose?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Simplified sticky header shell for focused task screens
 * (wizard, add/edit room, check-out) — no sidebar.
 */
export function BareLayout({ title, subtitle, showBack = true, onClose, actions, children, className }: BareLayoutProps) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-surface-container-lowest h-header-height border-b border-outline-variant flex items-center px-gutter md:px-container-padding sticky top-0 z-40">
        {showBack && (
          <IconButton icon="arrow_back" label="Go back" onClick={() => navigate(-1)} className="mr-2 md:mr-4 hover:text-secondary" />
        )}
        <div className="min-w-0">
          <div className="font-headline-sm text-headline-sm text-primary truncate">{title}</div>
          {subtitle && <div className="font-label-md text-label-md text-on-surface-variant">{subtitle}</div>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {actions}
          {onClose && <IconButton icon="close" label="Close" onClick={onClose} />}
        </div>
      </header>
      <main className={cn('flex-1 w-full p-4 md:p-container-padding mx-auto', className)}>{children}</main>
    </div>
  );
}
