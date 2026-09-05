import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-container-lowest">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
              <Icon name="error_outline" className="text-[32px]" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-4">
              Something went wrong
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-2">
              An unexpected error occurred while rendering this screen.
            </p>
            {this.state.message && (
              <p className="font-body-sm text-body-sm text-error/80 mb-6 break-words">
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded hover:-translate-y-0.5 transition-transform shadow-sm"
            >
              <Icon name="refresh" className="text-[18px]" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
