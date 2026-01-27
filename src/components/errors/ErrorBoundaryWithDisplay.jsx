import React, { useState } from 'react';
import ErrorDisplay from './ErrorDisplay';
import { errorLogger } from '@/components/utils/errorLogger';

export default function ErrorBoundaryWithDisplay({ children }) {
  const [error, setError] = useState(null);
  const [context, setContext] = useState(null);

  React.useEffect(() => {
    const handleError = (event) => {
      const err = event.error || event.message;
      setError(err);
      setContext(`Global error handler - ${event.filename || 'unknown'}`);
      
      // Log to backend
      try {
        errorLogger.systemError(err, {
          type: 'uncaught_error',
          context: context,
          stack: err?.stack
        });
      } catch (e) {
        console.error('Failed to log error:', e);
      }
    };

    const handleUnhandledRejection = (event) => {
      setError(event.reason);
      setContext('Unhandled promise rejection');
      
      try {
        errorLogger.systemError(event.reason, {
          type: 'unhandled_rejection',
          context: 'Unhandled promise rejection'
        });
      } catch (e) {
        console.error('Failed to log error:', e);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [context]);

  return (
    <>
      {children}
      <ErrorDisplay
        error={error}
        onDismiss={() => setError(null)}
        context={context}
      />
    </>
  );
}