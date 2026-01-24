import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in component tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h2 className="text-xl font-bold mb-2 text-red-600">Something went wrong</h2>
            <p className="mb-4 text-sm text-gray-700">An unexpected error occurred while rendering the app. See console for details.</p>
            <pre className="text-xs text-gray-600 overflow-auto max-h-60">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
