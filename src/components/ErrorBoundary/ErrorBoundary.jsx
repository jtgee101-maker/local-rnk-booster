import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

/**
 * 200X Builder - Enhanced Error Boundary
 * Comprehensive error handling with recovery options
 * 
 * @version 3.0.0
 * @status ENHANCED
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log to error tracking service
    this.logError(error, errorInfo, errorId);
  }

  logError = async (error, errorInfo, errorId) => {
    try {
      // Send to server-side error logging
      await fetch('/api/logError', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          severity: 'error',
          errorType: 'react_boundary'
        })
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { errorId } = this.state;
      
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          style={{ 
            background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <div 
            className="max-w-lg w-full rounded-2xl p-8 animate-scale-in"
            style={{
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            {/* Error Icon */}
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: 'var(--status-error)' }} />
            </div>

            {/* Title */}
            <h1 
              className="text-2xl font-bold text-center mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Something went wrong
            </h1>

            {/* Description */}
            <p 
              className="text-center mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              We've encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>

            {/* Error ID for support */}
            {errorId && (
              <div 
                className="rounded-lg p-3 mb-6 text-center"
                style={{ 
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  Error Reference: 
                </span>
                <code 
                  className="ml-2 px-2 py-1 rounded font-mono"
                  style={{ 
                    background: 'var(--bg-secondary)',
                    color: 'var(--brand-primary)',
                    fontSize: 'var(--text-sm)'
                  }}
                >
                  {errorId}
                </code>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all focus-ring"
                style={{ 
                  background: 'var(--brand-primary)',
                  color: 'var(--text-inverse)'
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleGoBack}
                  className="py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all focus-ring"
                  style={{ 
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all focus-ring"
                  style={{ 
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)'
                  }}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>
            </div>

            {/* Support Link */}
            <p 
              className="text-center mt-6 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Need help?{' '}
              <a 
                href="mailto:support@localrank.ai" 
                className="underline hover:no-underline transition-all"
                style={{ color: 'var(--brand-primary)' }}
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
