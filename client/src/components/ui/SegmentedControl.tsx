import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

/** Pill toggle used for room status filters and the grid/list view switch. */
export function SegmentedControl({ options, value, onChange, ariaLabel, className }: SegmentedControlProps) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('bg-surface-container-low border border-outline-variant rounded p-1 flex items-center gap-1', className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-DEFAULT font-label-md text-label-md flex items-center gap-1.5 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              selected ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary',
            )}
          >
            {o.icon && <Icon name={o.icon} fill={selected} className="text-base" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
