import React, { Component, ReactNode } from 'react';
import './error-boundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // update state to show fallback ui
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // log error details
    console.error('error boundary caught an error:', error, errorInfo);
    
    // call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // render custom fallback ui if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // default fallback ui
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>oops! something went wrong</h2>
            <p>bufo encountered an unexpected error and needs to restart.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="error-retry-btn"
            >
              try again
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>error details (dev only)</summary>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 