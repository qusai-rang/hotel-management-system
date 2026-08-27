import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Material glyph chip pinned bottom-right (e.g. workspace_premium membership badge). */
  badgeIcon?: string;
  badgeTitle?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-24 h-24 text-2xl',
} as const;

export function Avatar({ src, alt = '', initials, size = 'md', badgeIcon, badgeTitle, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-block shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-semibold select-none',
          sizeClasses[size],
          src ? 'bg-surface-container-highest' : 'bg-primary-fixed-dim text-primary',
          size === 'xl' && 'border-2 border-surface-bright shadow-sm',
        )}
      >
        {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : (initials ?? '')}
      </div>
      {badgeIcon && (
        <span title={badgeTitle} className="absolute bottom-0 right-0 bg-secondary-fixed text-on-secondary-fixed rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-sm">
          <Icon name={badgeIcon} fill className="text-[14px]" />
        </span>
      )}
    </div>
  );
}
