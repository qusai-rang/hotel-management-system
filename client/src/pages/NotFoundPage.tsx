import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-container-lowest">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold text-primary/10 mb-4">404</div>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Page Not Found</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded hover:-translate-y-0.5 transition-transform shadow-sm"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}