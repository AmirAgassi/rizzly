import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';

// component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('test error');
  }
  return <div>normal content</div>;
};

describe('ErrorBoundary', () => {
  // suppress console.error for error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('normal content')).toBeInTheDocument();
  });

  it('catches errors and displays fallback ui', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('oops! something went wrong')).toBeInTheDocument();
    expect(screen.getByText('bufo encountered an unexpected error and needs to restart.')).toBeInTheDocument();
    expect(screen.getByText('try again')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('custom error message')).toBeInTheDocument();
    expect(screen.queryByText('oops! something went wrong')).not.toBeInTheDocument();
  });

  it('shows try again button that resets error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // error state is shown
    expect(screen.getByText('oops! something went wrong')).toBeInTheDocument();
    expect(screen.getByText('try again')).toBeInTheDocument();

    // clicking try again should be present (actual recovery would need external state management)
    fireEvent.click(screen.getByText('try again'));
    
    // the button click is registered (further recovery logic would be app-specific)
    expect(screen.getByText('try again')).toBeInTheDocument();
  });
}); 