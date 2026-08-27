import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TimelineItemData {
  title: string;
  time?: string;
  description?: ReactNode;
  active?: boolean;
}

/** Left-border dot timeline (reservation_details / housekeeping pattern). */
export function Timeline({ items, className }: { items: TimelineItemData[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-6 border-l-2 border-surface-variant pl-6 list-none m-0 p-0', className)}>
      {items.map((item, idx) => (
        <li key={`${item.title}-${idx}`} className="relative">
          <div
            aria-hidden="true"
            className={cn(
              'absolute top-1 -left-[31px] w-4 h-4 rounded-full border-2',
              item.active ? 'bg-surface-container-lowest border-secondary' : 'bg-surface-variant border-surface-container-highest',
            )}
          />
          <div className="flex justify-between items-center gap-4 mb-1 flex-wrap">
            <h4 className={cn('font-label-lg text-label-lg', item.active ? 'text-primary' : 'text-on-surface')}>{item.title}</h4>
            {item.time && <time className="font-body-sm text-body-sm text-on-surface-variant">{item.time}</time>}
          </div>
          {item.description && <p className="font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>}
        </li>
      ))}
    </ol>
  );
}
