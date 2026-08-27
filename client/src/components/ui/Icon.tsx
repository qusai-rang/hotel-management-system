import { cn } from '@/utils/cn';

interface IconProps {
  name: string;
  fill?: boolean;
  className?: string;
}

export function Icon({ name, fill = false, className }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('material-symbols-outlined', fill && 'icon-fill', className)}>
      {name}
    </span>
  );
}
