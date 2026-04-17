import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

const isChunkLoadError = (error: Error): boolean => {
  if (!error) return false;
  const name = error.name ?? '';
  const msg = error.message ?? '';
  return (
    name === 'ChunkLoadError' ||
    /loading chunk/i.test(msg) ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg)
  );
};

/**
 * Route-level error boundary that distinguishes chunk-fetch failures
 * (stale deploy, offline, slow network) from application errors. Chunk
 * errors get a "Reload" button because the dev server / CDN needs to
 * re-issue a fresh manifest.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RouteErrorBoundary caught error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, isChunkError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.isChunkError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="text-muted-foreground mb-4 h-10 w-10" />
          <h2 className="mb-2 text-lg font-semibold">Couldn't load this page</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            We couldn't download the code for this screen. This usually means you're offline, on a
            slow connection, or the app was updated while this tab was open. Reload to get the
            latest version.
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload page
            </Button>
            <Button onClick={this.handleRetry} variant="outline">
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <AlertTriangle className="text-destructive mb-4 h-10 w-10" />
        <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-md text-sm">
          An unexpected error occurred. You can try again, or reload the page if the problem
          persists.
        </p>
        <div className="flex gap-2">
          <Button onClick={this.handleRetry}>Try again</Button>
          <Button onClick={this.handleReload} variant="outline">
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
