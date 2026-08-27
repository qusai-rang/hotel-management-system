import { cn } from '@/utils/cn';

interface TabsProps {
  items: Array<{ key: string; label: string }>;
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

/** Gold underline tab strip (guest_profile / room_configuration pattern). */
export function Tabs({ items, activeKey, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn('flex border-b border-outline-variant bg-surface-bright/50 px-2 overflow-x-auto whitespace-nowrap', className)}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              'px-6 py-4 font-label-lg text-label-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              active ? 'text-primary border-b-2 border-secondary' : 'text-on-surface-variant hover:text-primary transition-colors',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
