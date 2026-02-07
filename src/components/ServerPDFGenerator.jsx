import { useState } from 'react';

/**
 * ServerPDFGenerator - Server-side PDF generation
 * 
 * ✅ OPTIMIZED: Uses server-side function (jspdf NOT in client bundle)
 * 
 * This component makes an API call to the server-side function instead
 * of bundling jspdf in the client. Saves ~300KB from the initial bundle.
 * 
 * @example
 * import ServerPDFGenerator from './ServerPDFGenerator';
 * 
 * function AuditReport({ auditData }) {
 *   return (
 *     <div>
 *       <ServerPDFGenerator 
 *         endpoint="/api/generateAuditPDF"
 *         data={auditData}
 *         filename="audit-report.pdf"
 *       />
 *     </div>
 *   );
 * }
 */
export default function ServerPDFGenerator({ 
  endpoint = '/api/generateAuditPDF',
  data,
  filename = 'document.pdf',
  buttonText = 'Download PDF',
  className = ''
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className={`
          px-4 py-2 bg-green-600 text-white rounded-lg 
          hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed 
          transition-colors flex items-center gap-2
          ${className}
        `}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {buttonText}
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
