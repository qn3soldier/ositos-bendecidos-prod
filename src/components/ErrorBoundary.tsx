import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Enterprise-level Error Boundary component
 * Catches JavaScript errors anywhere in child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    // In production, send to error tracking service (e.g., Sentry)
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // This would be your error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    console.error('Logging to error service:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="max-w-md w-full mx-4">
            <div className="bg-zinc-900 border border-red-500/20 rounded-lg p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Something went wrong
              </h2>

              <p className="text-zinc-400 text-center mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6">
                  <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 p-2 bg-black rounded text-xs text-red-400 overflow-auto">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                >
                  Try again
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Go home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;