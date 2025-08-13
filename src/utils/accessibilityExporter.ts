// Enhanced Export System for Accessibility Audit Results
import { AccessibilityResult, AccessibilityEvaluation, Study } from '../types';
import { WCAGComplianceFramework, ComplianceCertification } from './wcagCompliance';
import { CrossMethodAccessibilityAnalysis } from './crossMethodAccessibility';

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf' | 'html' | 'wcag-report' | 'compliance-certificate';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeVisualizations: boolean;
  includeRecommendations: boolean;
  includeEvidence: boolean;
  filterBySeverity: ('critical' | 'high' | 'medium' | 'low')[];
  filterByStatus: ('pass' | 'fail' | 'needs-review' | 'not-applicable')[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  customFields?: string[];
  branding?: {
    companyName: string;
    logo: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
}

export interface ExportResult {
  success: boolean;
  filename: string;
  mimeType: string;
  size: number;
  downloadUrl?: string;
  error?: string;
  metadata: {
    exportedAt: Date;
    recordCount: number;
    format: ExportFormat;
    options: ExportOptions;
  };
}

export class AccessibilityExporter {
  private results: AccessibilityResult[];
  private studies: Study[];
  private complianceReport?: AccessibilityComplianceReport;
  private crossMethodAnalysis?: CrossMethodAccessibilityAnalysis;

  constructor(
    results: AccessibilityResult[],
    studies: Study[] = [],
    complianceReport?: AccessibilityComplianceReport,
    crossMethodAnalysis?: CrossMethodAccessibilityAnalysis
  ) {
    this.results = results;
    this.studies = studies;
    this.complianceReport = complianceReport;
    this.crossMethodAnalysis = crossMethodAnalysis;
  }

  async export(options: ExportOptions): Promise<ExportResult> {
    try {
      const filteredResults = this.filterResults(options);
      
      let exportData: any;
      let mimeType: string;
      let filename: string;

      switch (options.format) {
        case 'json':
          exportData = this.exportJSON(filteredResults, options);
          mimeType = 'application/json';
          filename = `accessibility-audit-${this.getTimestamp()}.json`;
          break;
        case 'csv':
          exportData = this.exportCSV(filteredResults, options);
          mimeType = 'text/csv';
          filename = `accessibility-audit-${this.getTimestamp()}.csv`;
          break;
        case 'xlsx':
          exportData = await this.exportXLSX(filteredResults, options);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `accessibility-audit-${this.getTimestamp()}.xlsx`;
          break;
        case 'pdf':
          exportData = await this.exportPDF(filteredResults, options);
          mimeType = 'application/pdf';
          filename = `accessibility-report-${this.getTimestamp()}.pdf`;
          break;
        case 'html':
          exportData = this.exportHTML(filteredResults, options);
          mimeType = 'text/html';
          filename = `accessibility-report-${this.getTimestamp()}.html`;
          break;
        case 'wcag-report':
          exportData = this.exportWCAGReport(filteredResults, options);
          mimeType = 'application/json';
          filename = `wcag-compliance-report-${this.getTimestamp()}.json`;
          break;
        case 'compliance-certificate':
          exportData = this.exportComplianceCertificate(filteredResults, options);
          mimeType = 'application/pdf';
          filename = `accessibility-certificate-${this.getTimestamp()}.pdf`;
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      const blob = new Blob([exportData], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        filename,
        mimeType,
        size: blob.size,
        downloadUrl,
        metadata: {
          exportedAt: new Date(),
          recordCount: filteredResults.length,
          format: options.format,
          options
        }
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          exportedAt: new Date(),
          recordCount: 0,
          format: options.format,
          options
        }
      };
    }
  }

  private filterResults(options: ExportOptions): AccessibilityResult[] {
    let filtered = [...this.results];

    // Filter by severity
    if (options.filterBySeverity.length > 0) {
      filtered = filtered.map(result => ({
        ...result,
        evaluations: result.evaluations.filter(e => 
          options.filterBySeverity.includes(e.severity as any)
        )
      }));
    }

    // Filter by status
    if (options.filterByStatus.length > 0) {
      filtered = filtered.map(result => ({
        ...result,
        evaluations: result.evaluations.filter(e => 
          options.filterByStatus.includes(e.status as any)
        )
      }));
    }

    // Filter by date range
    if (options.dateRange) {
      filtered = filtered.filter(result => {
        const resultDate = new Date(result.startTime);
        return resultDate >= options.dateRange!.startDate && 
               resultDate <= options.dateRange!.endDate;
      });
    }

    return filtered;
  }

  private exportJSON(results: AccessibilityResult[], options: ExportOptions): string {
    const data = {
      metadata: options.includeMetadata ? {
        exportedAt: new Date().toISOString(),
        totalResults: results.length,
        totalEvaluations: results.reduce((sum, r) => sum + r.evaluations.length, 0),
        complianceOverview: this.complianceReport?.overview,
        exportOptions: options
      } : undefined,
      
      results: results.map(result => ({
        participantId: result.participantId,
        studyId: result.studyId,
        startTime: result.startTime,
        endTime: result.endTime,
        duration: result.duration,
        overallScore: result.overallScore,
        assistiveTechnology: result.assistiveTechnology,
        
        evaluations: result.evaluations.map(evaluation => ({
          guidelineId: evaluation.guidelineId,
          status: evaluation.status,
          severity: evaluation.severity,
          findings: evaluation.findings,
          recommendations: options.includeRecommendations ? evaluation.recommendations : undefined,
          evidence: options.includeEvidence ? evaluation.evidence : undefined
        }))
      })),
      
      complianceReport: options.includeMetadata ? this.complianceReport : undefined,
      crossMethodAnalysis: options.includeMetadata ? this.crossMethodAnalysis : undefined
    };

    return JSON.stringify(data, null, 2);
  }

  private exportCSV(results: AccessibilityResult[], options: ExportOptions): string {
    const headers = [
      'ParticipantId',
      'StudyId',
      'ScanDate',
      'Duration',
      'OverallScore',
      'AssistiveTechnology',
      'GuidelineId',
      'Status',
      'Severity',
      'Finding',
      ...(options.includeRecommendations ? ['Recommendation'] : []),
      ...(options.includeEvidence ? ['EvidenceCount'] : [])
    ];

    const rows: string[] = [headers.join(',')];

    results.forEach(result => {
      result.evaluations.forEach(evaluation => {
        evaluation.findings.forEach(finding => {
          const row = [
            this.csvEscape(result.participantId),
            result.studyId.toString(),
            new Date(result.startTime).toISOString(),
            result.duration.toString(),
            result.overallScore.toFixed(2),
            this.csvEscape(result.assistiveTechnology || ''),
            evaluation.guidelineId,
            evaluation.status,
            evaluation.severity,
            this.csvEscape(finding),
            ...(options.includeRecommendations ? [
              this.csvEscape(evaluation.recommendations.join('; '))
            ] : []),
            ...(options.includeEvidence ? [
              (evaluation.evidence?.screenshots?.length || 0).toString()
            ] : [])
          ];
          rows.push(row.join(','));
        });
      });
    });

    return rows.join('\n');
  }

  private async exportXLSX(results: AccessibilityResult[], options: ExportOptions): Promise<ArrayBuffer> {
    // This would require a library like xlsx or exceljs
    // For now, return CSV content as placeholder
    const csvData = this.exportCSV(results, options);
    const encoder = new TextEncoder();
    return encoder.encode(csvData);
  }

  private async exportPDF(results: AccessibilityResult[], options: ExportOptions): Promise<ArrayBuffer> {
    const htmlContent = this.generatePDFHTML(results, options);
    
    // This would require a PDF generation library like jsPDF or html2pdf
    // For now, return HTML content encoded as placeholder
    const encoder = new TextEncoder();
    return encoder.encode(htmlContent);
  }

  private exportHTML(results: AccessibilityResult[], options: ExportOptions): string {
    const branding = options.branding;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report</title>
    <style>
        ${this.getReportCSS(branding)}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateReportHeader(branding)}
        ${this.generateExecutiveSummary(results)}
        ${this.generateDetailedResults(results, options)}
        ${options.includeRecommendations ? this.generateRecommendations(results) : ''}
        ${this.generateReportFooter()}
    </div>
    
    <script>
        ${this.getReportJavaScript()}
    </script>
</body>
</html>`;
  }

  private exportWCAGReport(results: AccessibilityResult[], options: ExportOptions): string {
    if (!this.complianceReport) {
      const framework = new WCAGComplianceFramework();
      this.complianceReport = framework.generateComplianceGaps(results);
    }

    const data = {
      wcagVersion: '2.1',
      reportType: 'compliance-assessment',
      generatedAt: new Date().toISOString(),
      overview: this.complianceReport.overview,
      principleBreakdown: this.complianceReport.principleBreakdown,
      severityBreakdown: this.complianceReport.severityBreakdown,
      recommendations: this.complianceReport.recommendations,
      detailedFindings: options.includeEvidence ? this.complianceReport.detailedFindings : undefined,
      complianceLevel: this.complianceReport.overview.complianceLevel,
      certificationReady: this.complianceReport.overview.failed === 0
    };

    return JSON.stringify(data, null, 2);
  }

  private exportComplianceCertificate(results: AccessibilityResult[], options: ExportOptions): ArrayBuffer {
    const certificate: ComplianceCertification = {
      id: `cert-${Date.now()}`,
      websiteUrl: this.studies[0]?.name || 'Unknown',
      complianceLevel: this.determineComplianceLevel(results),
      wcagVersion: '2.1',
      certificationDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      auditResults: results,
      complianceScore: this.calculateOverallScore(results),
      criticalIssues: this.countCriticalIssues(results),
      resolvedIssues: results.flatMap(r => r.evaluations.filter(e => e.status === 'pass')),
      pendingIssues: results.flatMap(r => r.evaluations.filter(e => e.status === 'fail')),
      certificationBody: options.branding?.companyName || 'Vision UX Accessibility Audit',
      auditor: 'Automated Accessibility Scanner',
      evidence: {
        screenshots: [],
        testReports: [`Generated ${new Date().toLocaleDateString()}`],
        codeExamples: [],
        userTestingResults: [],
        remediationDocumentation: [],
        thirdPartyValidation: []
      },
      status: this.countCriticalIssues(results) === 0 ? 'approved' : 'rejected'
    };

    const html = this.generateCertificateHTML(certificate, options.branding);
    const encoder = new TextEncoder();
    return encoder.encode(html);
  }

  private generatePDFHTML(results: AccessibilityResult[], options: ExportOptions): string {
    return `
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        .issue { border-left: 4px solid #e74c3c; padding: 10px; margin: 10px 0; }
        .pass { border-left: 4px solid #27ae60; padding: 10px; margin: 10px 0; }
        .severity-critical { background-color: #fdeaea; }
        .severity-high { background-color: #fef5e7; }
        .severity-medium { background-color: #fff3cd; }
        .severity-low { background-color: #e3f2fd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accessibility Audit Report</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <p>Total Results: ${results.length}</p>
    </div>
    
    ${this.generateDetailedResults(results, options)}
</body>
</html>`;
  }

  private generateReportHeader(branding?: ExportOptions['branding']): string {
    return `
<header class="report-header">
    ${branding?.logo ? `<img src="${branding.logo}" alt="${branding.companyName}" class="company-logo">` : ''}
    <h1>Accessibility Audit Report</h1>
    <div class="report-meta">
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        ${branding?.companyName ? `<p>Prepared by: ${branding.companyName}</p>` : ''}
    </div>
</header>`;
  }

  private generateExecutiveSummary(results: AccessibilityResult[]): string {
    const totalIssues = results.reduce((sum, r) => sum + r.evaluations.filter(e => e.status === 'fail').length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
    const criticalIssues = this.countCriticalIssues(results);

    return `
<section class="executive-summary">
    <h2>Executive Summary</h2>
    <div class="summary-metrics">
        <div class="metric">
            <span class="metric-value">${avgScore.toFixed(1)}%</span>
            <span class="metric-label">Average Accessibility Score</span>
        </div>
        <div class="metric">
            <span class="metric-value">${totalIssues}</span>
            <span class="metric-label">Total Issues Found</span>
        </div>
        <div class="metric">
            <span class="metric-value">${criticalIssues}</span>
            <span class="metric-label">Critical Issues</span>
        </div>
    </div>
</section>`;
  }

  private generateDetailedResults(results: AccessibilityResult[], options: ExportOptions): string {
    let html = '<section class="detailed-results"><h2>Detailed Results</h2>';
    
    results.forEach((result, index) => {
      html += `
<div class="result-container">
    <h3>Scan ${index + 1} - Participant ${result.participantId}</h3>
    <div class="result-meta">
        <span>Score: ${result.overallScore.toFixed(1)}%</span>
        <span>Duration: ${result.duration}ms</span>
        ${result.assistiveTechnology ? `<span>Assistive Tech: ${result.assistiveTechnology}</span>` : ''}
    </div>
    
    <div class="evaluations">`;
    
    result.evaluations.forEach(evaluation => {
      const cssClass = evaluation.status === 'pass' ? 'pass' : `issue severity-${evaluation.severity}`;
      html += `
<div class="${cssClass}">
    <h4>${evaluation.guidelineId} - ${evaluation.status.toUpperCase()}</h4>
    <div class="findings">
        ${evaluation.findings.map(finding => `<p>• ${finding}</p>`).join('')}
    </div>
    ${options.includeRecommendations && evaluation.recommendations.length > 0 ? `
    <div class="recommendations">
        <strong>Recommendations:</strong>
        <ul>
            ${evaluation.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>` : ''}
</div>`;
    });
    
    html += '</div></div>';
    });
    
    html += '</section>';
    return html;
  }

  private generateRecommendations(results: AccessibilityResult[]): string {
    const allRecommendations = results.flatMap(r => 
      r.evaluations.flatMap(e => e.recommendations)
    );
    
    const prioritizedRecs = [...new Set(allRecommendations)]
      .slice(0, 10); // Top 10 recommendations

    return `
<section class="recommendations">
    <h2>Priority Recommendations</h2>
    <ol>
        ${prioritizedRecs.map(rec => `<li>${rec}</li>`).join('')}
    </ol>
</section>`;
  }

  private generateReportFooter(): string {
    return `
<footer class="report-footer">
    <p>This report was generated by the Vision UX Accessibility Audit System</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
</footer>`;
  }

  private generateCertificateHTML(certificate: ComplianceCertification, branding?: ExportOptions['branding']): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Accessibility Compliance Certificate</title>
    <style>
        body { font-family: serif; margin: 0; padding: 40px; background: white; }
        .certificate { border: 8px solid #2c3e50; padding: 40px; text-align: center; }
        .title { font-size: 32px; color: #2c3e50; margin-bottom: 30px; }
        .content { font-size: 18px; line-height: 1.6; margin: 20px 0; }
        .score { font-size: 48px; color: #27ae60; font-weight: bold; }
        .compliance-level { font-size: 24px; color: #2c3e50; font-weight: bold; }
        .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature { border-top: 2px solid #333; padding-top: 10px; width: 200px; }
    </style>
</head>
<body>
    <div class="certificate">
        ${branding?.logo ? `<img src="${branding.logo}" alt="Company Logo" style="max-height: 80px; margin-bottom: 20px;">` : ''}
        <h1 class="title">ACCESSIBILITY COMPLIANCE CERTIFICATE</h1>
        
        <div class="content">
            <p>This certifies that</p>
            <h2>${certificate.websiteUrl}</h2>
            <p>has achieved</p>
            <div class="compliance-level">WCAG ${certificate.wcagVersion} Level ${certificate.complianceLevel}</div>
            <p>compliance with an overall score of</p>
            <div class="score">${certificate.complianceScore.toFixed(1)}%</div>
        </div>
        
        <div class="content">
            <p>Certificate ID: ${certificate.id}</p>
            <p>Certification Date: ${certificate.certificationDate.toLocaleDateString()}</p>
            <p>Valid Until: ${certificate.expirationDate.toLocaleDateString()}</p>
        </div>
        
        <div class="signature-area">
            <div class="signature">
                <div>Certified By</div>
                <div>${certificate.certificationBody}</div>
            </div>
            <div class="signature">
                <div>Auditor</div>
                <div>${certificate.auditor}</div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private getReportCSS(branding?: ExportOptions['branding']): string {
    const primaryColor = branding?.colors?.primary || '#2c3e50';
    const secondaryColor = branding?.colors?.secondary || '#3498db';

    return `
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f8f9fa;
        color: #333;
        line-height: 1.6;
    }
    .report-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .report-header {
        border-bottom: 3px solid ${primaryColor};
        padding-bottom: 20px;
        margin-bottom: 30px;
    }
    .report-header h1 {
        color: ${primaryColor};
        margin: 0 0 10px 0;
        font-size: 2.5em;
    }
    .company-logo {
        max-height: 60px;
        margin-bottom: 15px;
    }
    .executive-summary {
        background: linear-gradient(135deg, ${secondaryColor}15, ${primaryColor}15);
        padding: 25px;
        border-radius: 8px;
        margin: 30px 0;
    }
    .summary-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }
    .metric {
        text-align: center;
        padding: 15px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-value {
        display: block;
        font-size: 2.2em;
        font-weight: bold;
        color: ${primaryColor};
        margin-bottom: 5px;
    }
    .metric-label {
        color: #666;
        font-size: 0.9em;
    }
    .result-container {
        margin: 30px 0;
        padding: 25px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #fafafa;
    }
    .result-meta {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        font-size: 0.9em;
        color: #666;
    }
    .result-meta span {
        background: white;
        padding: 5px 10px;
        border-radius: 4px;
        border: 1px solid #ddd;
    }
    .issue, .pass {
        margin: 15px 0;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid;
    }
    .pass {
        border-left-color: #27ae60;
        background-color: #d4edda;
    }
    .severity-critical {
        border-left-color: #dc3545;
        background-color: #f8d7da;
    }
    .severity-high {
        border-left-color: #fd7e14;
        background-color: #fff3cd;
    }
    .severity-medium {
        border-left-color: #ffc107;
        background-color: #fff3cd;
    }
    .severity-low {
        border-left-color: #17a2b8;
        background-color: #d1ecf1;
    }
    .evaluations h4 {
        margin: 0 0 10px 0;
        color: #333;
    }
    .findings p {
        margin: 5px 0;
        color: #555;
    }
    .recommendations {
        margin-top: 15px;
        padding: 15px;
        background: rgba(255,255,255,0.7);
        border-radius: 4px;
    }
    .recommendations ul {
        margin: 10px 0 0 20px;
    }
    .recommendations li {
        margin: 5px 0;
        color: #444;
    }
    .report-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #eee;
        text-align: center;
        color: #666;
        font-size: 0.9em;
    }
    @media (max-width: 768px) {
        .summary-metrics {
            grid-template-columns: 1fr;
        }
        .result-meta {
            flex-direction: column;
            gap: 10px;
        }
    }`;
  }

  private getReportJavaScript(): string {
    return `
    // Add interactive features
    document.querySelectorAll('.issue, .pass').forEach(element => {
        element.addEventListener('click', function() {
            const recommendations = this.querySelector('.recommendations');
            if (recommendations) {
                recommendations.style.display = recommendations.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    // Add print functionality
    function printReport() {
        window.print();
    }

    // Add export functionality (would require additional implementation)
    function exportToPDF() {
        alert('PDF export functionality would be implemented here');
    }`;
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  private getTimestamp(): string {
    return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  }

  private determineComplianceLevel(results: AccessibilityResult[]): 'A' | 'AA' | 'AAA' | 'non-compliant' {
    const framework = new WCAGComplianceFramework();
    return framework.assessComplianceLevel(results);
  }

  private calculateOverallScore(results: AccessibilityResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  }

  private countCriticalIssues(results: AccessibilityResult[]): number {
    return results.reduce((sum, r) => 
      sum + r.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical').length, 0
    );
  }
}

// Export utility functions
export const exportAccessibilityResults = async (
  results: AccessibilityResult[],
  options: ExportOptions,
  studies?: Study[],
  complianceReport?: AccessibilityComplianceReport,
  crossMethodAnalysis?: CrossMethodAccessibilityAnalysis
): Promise<ExportResult> => {
  const exporter = new AccessibilityExporter(results, studies, complianceReport, crossMethodAnalysis);
  return exporter.export(options);
};

export const createDefaultExportOptions = (format: ExportFormat): ExportOptions => ({
  format,
  includeMetadata: true,
  includeVisualizations: format === 'html' || format === 'pdf',
  includeRecommendations: true,
  includeEvidence: format !== 'csv',
  filterBySeverity: ['critical', 'high', 'medium', 'low'],
  filterByStatus: ['fail', 'needs-review', 'pass']
});

export const downloadExportResult = (result: ExportResult): void => {
  if (!result.success || !result.downloadUrl) {
    throw new Error(result.error || 'Export failed');
  }

  const link = document.createElement('a');
  link.href = result.downloadUrl;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the blob URL
  setTimeout(() => {
    URL.revokeObjectURL(result.downloadUrl!);
  }, 1000);
};