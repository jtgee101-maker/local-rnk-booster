import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to ErrorLog entity
    base44.entities.ErrorLog.create({
      error_type: 'system_error',
      severity: 'critical',
      message: error.toString(),
      stack_trace: error.stack || errorInfo.componentStack,
      metadata: {
        component_stack: errorInfo.componentStack,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      }
    }).catch(err => console.error('Failed to log error:', err));
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900/50 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-3">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-400 mb-6">
              We've been notified and are working on it. Try refreshing the page.
            </p>

            <Button
              onClick={this.handleReload}
              className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] font-semibold w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                  Error Details (dev only)
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-gray-950 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;