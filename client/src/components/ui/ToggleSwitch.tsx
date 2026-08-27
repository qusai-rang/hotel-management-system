import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ToggleSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** Exact toggle treatment from check_out_luxestay_pro (gold when on). */
export function ToggleSwitch({ label, className, ...rest }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" aria-label={label} className="sr-only peer" {...rest} />
      <div
        className={cn(
          "relative w-11 h-6 bg-outline-variant rounded-full peer-checked:bg-secondary cursor-pointer transition-colors",
          "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-all peer-checked:after:translate-x-5",
          className,
        )}
      />
    </label>
  );
}
