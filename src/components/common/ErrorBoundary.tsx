import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGenericErrorMessage } from '@/lib/security';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging but don't expose sensitive information
    console.error('ErrorBoundary caught an error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Log generic error for monitoring
    console.error('Application error occurred');
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use generic error message that doesn't expose system details
      const errorMessage = getGenericErrorMessage('default');

      return (
        <div className="border-destructive/30 bg-destructive/10 flex min-h-[200px] flex-col items-center justify-center rounded-lg border p-6">
          <AlertTriangle className="text-destructive mb-4 h-12 w-12" />
          <h2 className="text-destructive mb-2 text-lg font-semibold">Something went wrong</h2>
          <p className="text-destructive mb-4 text-center">{errorMessage}</p>
          <Button onClick={this.handleReset} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
