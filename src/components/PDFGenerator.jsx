import { jsPDF } from 'jspdf';
import { useState } from 'react';

/**
 * PDFGenerator - Client-side PDF generation using jspdf
 * 
 * ⚠️ WARNING: This adds ~300KB to the client bundle!
 * 
 * ORIGINAL (CLIENT-SIDE): Direct import adds 300KB to bundle
 * OPTIMIZED (SERVER-SIDE): Move to server function in functions/generateAuditPDF.ts
 * 
 * @deprecated Use server-side generateAuditPDF function instead
 * 
 * @example
 * // ❌ Bad - Client-side adds 300KB to bundle
 * import PDFGenerator from './PDFGenerator';
 * 
 * // ✅ Good - Server-side via API call
 * const response = await fetch('/api/generateAuditPDF', { method: 'POST', body: JSON.stringify(data) });
 */
export default function PDFGenerator({ data, filename = 'document.pdf' }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add content
      doc.setFontSize(20);
      doc.text(data.title || 'Report', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);
      
      // Add data sections
      let yPosition = 70;
      if (data.sections) {
        data.sections.forEach((section) => {
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 255);
          doc.text(section.title, 20, yPosition);
          yPosition += 10;
          
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(section.content, 170);
          doc.text(lines, 20, yPosition);
          yPosition += lines.length * 5 + 10;
        });
      }
      
      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </button>
  );
}
