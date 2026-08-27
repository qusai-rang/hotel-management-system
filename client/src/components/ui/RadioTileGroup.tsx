import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export interface RadioTileOption {
  value: string;
  label: string;
  description?: string;
  /** Card variant only: small trailing price/summary text. */
  priceNote?: string;
  /** Card variant only: Material Symbols glyphs shown in the footer. */
  icons?: string[];
  /** Tile variant only: the single large glyph. */
  icon?: string;
}

interface RadioTileGroupProps {
  name: string;
  options: RadioTileOption[];
  value: string;
  onChange: (value: string) => void;
  /**
   * `card` = large selectable room-type cards (create_reservation).
   * `tile` = compact centered payment tiles (create_reservation, check_out).
   */
  variant?: 'card' | 'tile';
  className?: string;
}

export function RadioTileGroup({ name, options, value, onChange, variant = 'card', className }: RadioTileGroupProps) {
  if (variant === 'tile') {
    return (
      <div role="radiogroup" className={cn('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center cursor-pointer transition-all',
                selected
                  ? 'border-secondary bg-secondary-fixed/20 text-on-secondary-fixed'
                  : 'border-outline-variant text-on-surface-variant hover:border-outline hover:text-primary',
              )}
            >
              <input type="radio" name={name} value={o.value} checked={selected} onChange={() => onChange(o.value)} className="sr-only" />
              {o.icon && <Icon name={o.icon} className="text-[28px] mb-1" fill={selected} />}
              <span className="font-label-md text-label-md">{o.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div role="radiogroup" className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              'flex flex-col p-4 rounded-lg cursor-pointer transition-all',
              selected
                ? 'border-2 border-secondary bg-surface-container-low shadow-sm'
                : 'border border-outline-variant bg-surface-container-lowest opacity-80 hover:opacity-100 hover:border-outline hover:shadow-sm',
            )}
          >
            <input type="radio" name={name} value={o.value} checked={selected} onChange={() => onChange(o.value)} className="sr-only" />
            <div className="flex justify-between items-start mb-2">
              <span className="font-headline-sm text-headline-sm font-semibold text-primary">{o.label}</span>
              <Icon
                name={selected ? 'check_circle' : 'circle'}
                fill={selected}
                className={selected ? 'text-xl text-secondary' : 'text-xl text-outline-variant'}
              />
            </div>
            {o.description && <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex-1">{o.description}</p>}
            {(o.icons || o.priceNote) && (
              <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(o.icons ?? []).map((ic) => (
                    <span key={ic} className="w-6 h-6 rounded-full bg-primary-fixed-dim/50 text-primary flex items-center justify-center">
                      <Icon name={ic} className="text-sm" />
                    </span>
                  ))}
                </div>
                {o.priceNote && <span className="font-label-lg text-label-lg font-semibold text-primary">{o.priceNote}</span>}
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}
