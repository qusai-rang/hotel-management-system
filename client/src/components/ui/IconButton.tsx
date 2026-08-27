import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Required accessible label (the icon glyph itself is hidden from AT). */
  label: string;
  fill?: boolean;
  showDot?: boolean;
  className?: string;
}

export function IconButton({ icon, label, fill, showDot, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} fill={fill} />
      {showDot && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface" />
      )}
    </button>
  );
}
