import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      business_name = 'Your Business',
      address = 'Address not provided',
      phone = '',
      website = '',
      health_score = 0,
      gmb_rating = 0,
      gmb_reviews_count = 0,
      gmb_photos_count = 0,
      gmb_has_hours = false,
      critical_issues = [],
      analysis = null,
      email = user.email
    } = body;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Set colors
    const primaryColor = [200, 255, 0]; // #c8ff00
    const darkBg = [15, 15, 26]; // Dark background
    const textDark = [30, 30, 40];
    const textLight = [200, 200, 200];

    // Header background
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Logo/Title
    doc.setTextColor(200, 255, 0);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('LocalRank.ai', 20, 25);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Google My Business Audit Report', 20, 32);

    yPosition = 55;

    // Business Info Section
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition, pageWidth - 30, 35, 'F');

    doc.setTextColor(...textDark);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Business Information', 20, yPosition + 7);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Business Name: ${business_name}`, 20, yPosition + 16);
    doc.text(`Address: ${address}`, 20, yPosition + 23);
    doc.text(`Phone: ${phone || 'Not provided'}`, 20, yPosition + 30);
    if (website) {
      doc.text(`Website: ${website}`, 20, yPosition + 37);
    }

    yPosition += 42;

    // Health Score - Large
    doc.setFillColor(200, 255, 0);
    const scoreRadius = 20;
    doc.circle(pageWidth / 2, yPosition + scoreRadius + 5, scoreRadius, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(36);
    doc.setFont(undefined, 'bold');
    doc.text(health_score.toString(), pageWidth / 2, yPosition + scoreRadius + 12, { align: 'center' });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('GMB Health Score', pageWidth / 2, yPosition + scoreRadius + 22, { align: 'center' });

    yPosition += 55;

    // Current Profile Stats
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition, pageWidth - 30, 30, 'F');

    doc.setTextColor(...textDark);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Current Profile Statistics', 20, yPosition + 7);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const statsY = yPosition + 16;
    const colWidth = (pageWidth - 30) / 3;

    // Stat boxes
    [
      { label: 'Rating', value: gmb_rating > 0 ? gmb_rating.toFixed(1) : 'N/A' },
      { label: 'Reviews', value: gmb_reviews_count.toString() },
      { label: 'Photos', value: gmb_photos_count.toString() }
    ].forEach((stat, idx) => {
      const xPos = 20 + idx * colWidth;
      doc.setTextColor(200, 255, 0);
      doc.setFont(undefined, 'bold');
      doc.text(stat.value, xPos, statsY, { maxWidth: colWidth - 5 });
      
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'normal');
      doc.text(stat.label, xPos, statsY + 7, { maxWidth: colWidth - 5 });
    });

    yPosition += 38;

    // Competitive Insights Section (if analysis available)
    if (analysis?.competitiveInsights) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(...textDark);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Competitive Analysis', 20, yPosition);

      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      
      const insights = analysis.competitiveInsights;
      doc.text(`Rating Position: ${insights.ratingPosition}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Review Volume: ${insights.reviewCountPosition}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Visibility Gap: ${100 - insights.visibility}% of potential searches`, 20, yPosition);
      yPosition += 12;
    }

    // Revenue Impact Section
    if (analysis?.revenueImpact) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(255, 240, 240);
      doc.rect(15, yPosition, pageWidth - 30, 25, 'F');

      doc.setTextColor(...textDark);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Monthly Revenue Impact', 20, yPosition + 7);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(200, 0, 0);
      doc.text(`Loss: $${analysis.revenueImpact.currentMonthlyLoss?.toLocaleString() || '0'}/month`, 20, yPosition + 16);
      
      doc.setTextColor(100, 100, 100);
      doc.text(`Annual: $${analysis.revenueImpact.annualRevenueLoss?.toLocaleString() || '0'}`, 20, yPosition + 22);

      yPosition += 30;
    }

    // Critical Issues Section
    if (critical_issues && critical_issues.length > 0) {
      doc.setTextColor(...textDark);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Critical Issues Found', 20, yPosition);

      yPosition += 10;

      critical_issues.slice(0, 5).forEach((issue, idx) => {
        doc.setFillColor(255, 240, 240);
        doc.rect(15, yPosition, pageWidth - 30, 12, 'F');
        
        doc.setTextColor(200, 0, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`${idx + 1}.`, 20, yPosition + 8);
        
        doc.setTextColor(60, 60, 60);
        doc.setFont(undefined, 'normal');
        const wrappedText = doc.splitTextToSize(issue, pageWidth - 50);
        doc.text(wrappedText, 26, yPosition + 8);

        yPosition += 12 + (wrappedText.length - 1) * 3;
      });

      yPosition += 8;
    }

    // Recommendations Section (if analysis available)
    if (analysis?.recommendations?.recommendations && analysis.recommendations.recommendations.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(...textDark);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Top Recommendations', 20, yPosition);

      yPosition += 10;

      analysis.recommendations.recommendations.slice(0, 2).forEach((rec, idx) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFillColor(255, 250, 240);
        doc.rect(15, yPosition, pageWidth - 30, 18, 'F');

        doc.setTextColor(200, 100, 0);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`Priority ${rec.priority}: ${rec.action}`, 20, yPosition + 6);

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Timeline: ${rec.timeline} | Impact: ${rec.impact}`, 20, yPosition + 13);

        yPosition += 22;
      });
    }

    // Next Steps
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(...textDark);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Your Next Steps', 20, yPosition);

    yPosition += 12;

    const nextSteps = [
      '1. Schedule Your Kickoff Call',
      '2. We Review Your Audit Report',
      '3. Custom Optimization Plan Created',
      '4. Implementation Begins (30 Days)',
      '5. See Results in Map Pack Rankings'
    ];

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    nextSteps.forEach((step, idx) => {
      doc.setTextColor(200, 255, 0);
      doc.setFont(undefined, 'bold');
      doc.text(step.substring(0, 1), 20, yPosition);
      
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined, 'normal');
      doc.text(step.substring(2), 26, yPosition);
      
      yPosition += 8;
    });

    yPosition += 10;

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | LocalRank.ai - Lead Independence Analysis`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="GMB-Audit-Report-${business_name.replace(/\s+/g, '-')}-${Date.now()}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});