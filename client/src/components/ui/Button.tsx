import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';
import { baseClass, sizeClasses, variantClasses } from './buttonStyles';
import type { ButtonSize, ButtonVariant } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: string;
  rightIcon?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseClass, variantClasses[variant], sizeClasses[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {leftIcon ? <Icon name={leftIcon} className="text-[18px]" /> : null}
      {children}
      {rightIcon ? <Icon name={rightIcon} className="text-[18px]" /> : null}
    </button>
  );
}
