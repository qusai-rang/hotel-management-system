import { cn } from '@/utils/cn';

interface PhotoGalleryProps {
  /** First image is the large hero; the next two fill the right-hand column. */
  images: Array<{ src: string; alt: string }>;
  className?: string;
}

/** room_details gallery block: 3/4 hero + stacked detail column. */
export function PhotoGallery({ images, className }: PhotoGalleryProps) {
  const [hero, ...thumbs] = images;
  if (!hero) return null;

  return (
    <div className={cn('bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm', className)}>
      <div className="grid grid-cols-4 gap-2 h-[400px]">
        <div className="col-span-4 md:col-span-3 rounded-DEFAULT overflow-hidden relative group">
          <img
            src={hero.src}
            alt={hero.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="hidden md:flex flex-col gap-2 col-span-1 h-full">
          {thumbs.slice(0, 2).map((img) => (
            <img key={img.src} src={img.src} alt={img.alt} className="w-full h-1/2 object-cover rounded-DEFAULT" />
          ))}
        </div>
      </div>
    </div>
  );
}
