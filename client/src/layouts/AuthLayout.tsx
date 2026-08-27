import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import authLobby from '@/assets/img/auth-lobby.jpg';

interface AuthLayoutProps {
  children: ReactNode;
  /** Defaults to the localized login lobby photograph. */
  backgroundImage?: string;
  className?: string;
}

/** Full-bleed photographic backdrop with navy scrim — login screen shell. */
export function AuthLayout({ children, backgroundImage = authLobby, className }: AuthLayoutProps) {
  return (
    <div className={cn('relative min-h-screen', className)}>
      <img src={backgroundImage} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-gutter py-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
