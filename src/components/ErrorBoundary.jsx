import React from 'react';
import { devError } from '../utils/logger';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Logs error information and displays a fallback UI
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    devError('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-l-4 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.458 20H3a2 2 0 01-2-2V6a2 2 0 012-2h3.879a1 1 0 00-.122.49l-.5 5a1 1 0 00.861 1.97h1.612a1 1 0 01.978 1.207l-.5 5a1 1 0 01-.978.793H6.458z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              An unexpected error occurred while rendering this part of the application. Our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-xs text-gray-500">
                <summary className="cursor-pointer font-semibold mb-2">Error Details (Development Only)</summary>
                <pre className="overflow-auto max-h-40 bg-gray-100 p-2 rounded border border-gray-300">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition font-semibold text-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition font-semibold text-sm"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
