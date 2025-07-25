import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
  /**
   * Child components
   */
  children: ReactNode;
  
  /**
   * Optional fallback UI to show when an error occurs
   */
  fallback?: ReactNode;
  
  /**
   * Optional callback for when errors occur
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * The error that occurred
   */
  error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child components
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  /**
   * Update state when an error occurs in a child component
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Log the error to an error reporting service
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error state to try rendering again
   */
  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    // If there's an error, show the fallback UI or the default error UI
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We've encountered an error and are working to fix it.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md overflow-auto">
                <p className="font-medium">Error details:</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap">
                  {this.state.error?.toString() || 'Unknown error'}
                </pre>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  onClick={this.handleReset}
                  className="w-full sm:w-auto"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise, render the children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 