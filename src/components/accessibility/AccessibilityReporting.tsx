import React, { useState, useMemo } from 'react';
import { Download, FileText, Filter, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Clock, Users, Target } from 'lucide-react';
import { AccessibilityComplianceReport, AccessibilityUtils } from '../../utils/accessibility';
import { AccessibilityResult, AccessibilityEvaluation, AccessibilityGuideline } from '../../types';

interface AccessibilityReportingProps {
  accessibilityResults: AccessibilityResult[];
  complianceReport?: AccessibilityComplianceReport | null;
  onGenerateReport?: (reportType: ReportType, options: ReportOptions) => void;
  onExportReport?: (format: ExportFormat, reportData: any) => void;
  showRemediationGuidance?: boolean;
  enableScheduledReports?: boolean;
}

type ReportType = 'compliance' | 'detailed-findings' | 'remediation-guide' | 'progress-tracking' | 'executive-summary';
type ExportFormat = 'pdf' | 'html' | 'json' | 'csv' | 'xlsx';

interface ReportOptions {
  includePassedTests: boolean;
  includeScreenshots: boolean;
  includeCodeSnippets: boolean;
  includeRecommendations: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
  severityFilter: string[];
  principleFilter: string[];
  dateRange?: { start: Date; end: Date };
  includeExecutiveSummary: boolean;
  includeTechnicalDetails: boolean;
  customFields?: string[];
}

interface RemediationItem {
  id: string;
  guideline: string;
  principle: string;
  severity: string;
  description: string;
  impact: string;
  solution: string[];
  resources: string[];
  estimatedEffort: 'minutes' | 'hours' | 'days';
  priority: number;
  affectedUsers: string[];
  codeExample?: string;
  testingMethod: string[];
}

const AccessibilityReporting: React.FC<AccessibilityReportingProps> = ({
  accessibilityResults,
  complianceReport,
  onGenerateReport,
  onExportReport,
  showRemediationGuidance = true,
  enableScheduledReports = false
}) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('compliance');
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    includePassedTests: false,
    includeScreenshots: true,
    includeCodeSnippets: true,
    includeRecommendations: true,
    wcagLevel: 'AA',
    severityFilter: ['critical', 'high', 'medium', 'low'],
    principleFilter: ['perceivable', 'operable', 'understandable', 'robust'],
    includeExecutiveSummary: true,
    includeTechnicalDetails: true
  });
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('pdf');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'remediation' | 'trends'>('overview');

  // Generate remediation guidance from accessibility results
  const remediationItems = useMemo((): RemediationItem[] => {
    if (!accessibilityResults.length) return [];

    const items: RemediationItem[] = [];
    const priorityMap = new Map<string, number>();

    accessibilityResults.forEach(result => {
      result.evaluations
        .filter(evaluation => evaluation.status === 'fail')
        .forEach(evaluation => {
          const guideline = AccessibilityUtils.guidelines[evaluation.guidelineId];
          if (!guideline) return;

          const itemId = `${evaluation.guidelineId}-${evaluation.severity}`;
          
          // Calculate priority score
          const severityWeight = getSeverityWeight(evaluation.severity);
          const currentPriority = priorityMap.get(itemId) || 0;
          priorityMap.set(itemId, currentPriority + severityWeight);

          if (!items.find(item => item.id === itemId)) {
            items.push({
              id: itemId,
              guideline: evaluation.guidelineId,
              principle: guideline.principle,
              severity: evaluation.severity,
              description: evaluation.findings[0] || guideline.description,
              impact: getImpactDescription(evaluation.severity, guideline.principle),
              solution: evaluation.recommendations.length > 0 
                ? evaluation.recommendations 
                : getDefaultSolution(evaluation.guidelineId),
              resources: getResourceLinks(evaluation.guidelineId),
              estimatedEffort: getEstimatedEffort(evaluation.severity),
              priority: severityWeight,
              affectedUsers: getAffectedUserGroups(guideline.principle, evaluation.severity),
              codeExample: evaluation.evidence?.codeSnippets?.[0],
              testingMethod: guideline.testingMethods || ['Manual review', 'Automated scanning']
            });
          }
        });
    });

    // Update priorities based on frequency
    items.forEach(item => {
      item.priority = priorityMap.get(item.id) || item.priority;
    });

    return items.sort((a, b) => b.priority - a.priority);
  }, [accessibilityResults]);

  // Calculate report metrics
  const reportMetrics = useMemo(() => {
    if (!complianceReport) return null;

    const totalIssues = complianceReport.overview.failed;
    const criticalIssues = complianceReport.severityBreakdown.critical;
    const highIssues = complianceReport.severityBreakdown.high;
    const mediumIssues = complianceReport.severityBreakdown.medium;
    const lowIssues = complianceReport.severityBreakdown.low;

    return {
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      complianceScore: complianceReport.overview.overallScore,
      complianceLevel: complianceReport.overview.complianceLevel,
      principleBreakdown: complianceReport.principleBreakdown,
      topRecommendations: complianceReport.recommendations.slice(0, 5),
      estimatedRemediationTime: calculateRemediationTime(remediationItems)
    };
  }, [complianceReport, remediationItems]);

  const getSeverityWeight = (severity: string): number => {
    switch (severity) {
      case 'critical': return 10;
      case 'high': return 7;
      case 'medium': return 4;
      case 'low': return 2;
      default: return 1;
    }
  };

  const getImpactDescription = (severity: string, principle: string): string => {
    const severityImpacts = {
      critical: 'Blocks access for users with disabilities',
      high: 'Significantly impairs user experience',
      medium: 'Creates barriers for some users',
      low: 'Minor accessibility concern'
    };

    const principleImpacts = {
      perceivable: 'Content may not be perceivable by all users',
      operable: 'Interface may not be operable by all users',
      understandable: 'Content may be difficult to understand',
      robust: 'Content may not work with assistive technologies'
    };

    return `${severityImpacts[severity as keyof typeof severityImpacts]} - ${principleImpacts[principle as keyof typeof principleImpacts]}`;
  };

  const getDefaultSolution = (guidelineId: string): string[] => {
    const solutions: Record<string, string[]> = {
      'image-alt': [
        'Add meaningful alt text to all images',
        'Use empty alt attributes for decorative images',
        'Provide detailed descriptions for complex images'
      ],
      'color-contrast': [
        'Increase contrast ratio to meet WCAG requirements',
        'Use high contrast color combinations',
        'Test with color contrast analyzers'
      ],
      'label': [
        'Associate form controls with descriptive labels',
        'Use aria-label for controls without visible labels',
        'Ensure label text is meaningful and clear'
      ],
      'keyboard': [
        'Make all interactive elements keyboard accessible',
        'Provide visible focus indicators',
        'Ensure logical tab order'
      ]
    };

    return solutions[guidelineId] || [
      'Review WCAG documentation for specific requirements',
      'Test with assistive technologies',
      'Consult accessibility guidelines'
    ];
  };

  const getResourceLinks = (guidelineId: string): string[] => {
    return [
      `https://www.w3.org/WAI/WCAG21/Understanding/${guidelineId}.html`,
      'https://webaim.org/resources/',
      'https://www.a11yproject.com/',
      'https://developer.mozilla.org/en-US/docs/Web/Accessibility'
    ];
  };

  const getEstimatedEffort = (severity: string): 'minutes' | 'hours' | 'days' => {
    switch (severity) {
      case 'critical': return 'hours';
      case 'high': return 'hours';
      case 'medium': return 'minutes';
      case 'low': return 'minutes';
      default: return 'minutes';
    }
  };

  const getAffectedUserGroups = (principle: string, severity: string): string[] => {
    const userGroups = {
      perceivable: ['Users with visual impairments', 'Users with hearing impairments'],
      operable: ['Users with motor impairments', 'Keyboard-only users'],
      understandable: ['Users with cognitive impairments', 'Users with learning disabilities'],
      robust: ['Screen reader users', 'Users with assistive technologies']
    };

    const severityModifier = severity === 'critical' || severity === 'high' ? 'All' : 'Some';
    return userGroups[principle as keyof typeof userGroups]?.map(group => `${severityModifier} ${group.toLowerCase()}`) || [];
  };

  const calculateRemediationTime = (items: RemediationItem[]): string => {
    const timeEstimates = {
      minutes: 0.5,
      hours: 4,
      days: 32
    };

    const totalHours = items.reduce((total, item) => {
      return total + timeEstimates[item.estimatedEffort];
    }, 0);

    if (totalHours < 8) return `${Math.ceil(totalHours)} hours`;
    return `${Math.ceil(totalHours / 8)} days`;
  };

  const handleGenerateReport = () => {
    onGenerateReport?.(selectedReportType, reportOptions);
  };

  const handleExportReport = () => {
    const reportData = {
      type: selectedReportType,
      options: reportOptions,
      metrics: reportMetrics,
      remediationItems: showRemediationGuidance ? remediationItems : [],
      complianceReport,
      accessibilityResults: reportOptions.includeTechnicalDetails ? accessibilityResults : [],
      generatedAt: new Date().toISOString()
    };

    onExportReport?.(selectedExportFormat, reportData);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceColor = (level: string): string => {
    switch (level) {
      case 'AAA': return 'text-green-700 bg-green-50 border-green-200';
      case 'AA': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'A': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'non-compliant': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (!accessibilityResults.length && !complianceReport) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Data Available</h3>
        <p className="text-gray-600">Complete accessibility scans to generate compliance reports and remediation guidance.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Accessibility Reporting</h2>
            <p className="text-sm text-gray-600 mt-1">
              WCAG compliance reports and remediation guidance
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateReport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FileText className="w-4 h-4 mr-1" />
              Generate
            </button>
            
            <button
              onClick={handleExportReport}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="border-b p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="compliance">Compliance Summary</option>
              <option value="detailed-findings">Detailed Findings</option>
              <option value="remediation-guide">Remediation Guide</option>
              <option value="progress-tracking">Progress Tracking</option>
              <option value="executive-summary">Executive Summary</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export Format
            </label>
            <select
              value={selectedExportFormat}
              onChange={(e) => setSelectedExportFormat(e.target.value as ExportFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF Document</option>
              <option value="html">HTML Report</option>
              <option value="json">JSON Data</option>
              <option value="csv">CSV Spreadsheet</option>
              <option value="xlsx">Excel Workbook</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WCAG Level
            </label>
            <select
              value={reportOptions.wcagLevel}
              onChange={(e) => setReportOptions(prev => ({ 
                ...prev, 
                wcagLevel: e.target.value as 'A' | 'AA' | 'AAA' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">Level A</option>
              <option value="AA">Level AA</option>
              <option value="AAA">Level AAA</option>
            </select>
          </div>
        </div>
        
        {/* Advanced Options Toggle */}
        <div className="mt-4">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>
        
        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="mt-4 p-4 bg-white rounded border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Include in Report
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'includePassedTests', label: 'Passed Tests' },
                    { key: 'includeScreenshots', label: 'Screenshots' },
                    { key: 'includeCodeSnippets', label: 'Code Snippets' },
                    { key: 'includeRecommendations', label: 'Recommendations' },
                    { key: 'includeExecutiveSummary', label: 'Executive Summary' },
                    { key: 'includeTechnicalDetails', label: 'Technical Details' }
                  ].map(option => (
                    <label key={option.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportOptions[option.key as keyof ReportOptions] as boolean}
                        onChange={(e) => setReportOptions(prev => ({
                          ...prev,
                          [option.key]: e.target.checked
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Filter
                </label>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map(severity => (
                    <label key={severity} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportOptions.severityFilter.includes(severity)}
                        onChange={(e) => {
                          const newFilter = e.target.checked
                            ? [...reportOptions.severityFilter, severity]
                            : reportOptions.severityFilter.filter(s => s !== severity);
                          setReportOptions(prev => ({ ...prev, severityFilter: newFilter }));
                        }}
                        className="mr-2"
                      />
                      <span className={`text-sm px-2 py-1 rounded capitalize ${getSeverityColor(severity)}`}>
                        {severity}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Content Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-4">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'details', label: 'Detailed Findings', icon: AlertTriangle },
            { key: 'remediation', label: 'Remediation Guide', icon: Target },
            { key: 'trends', label: 'Trends', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && reportMetrics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {reportMetrics.complianceScore.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-700">Compliance Score</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {reportMetrics.totalIssues}
                </div>
                <div className="text-sm text-red-700">Total Issues</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {reportMetrics.criticalIssues}
                </div>
                <div className="text-sm text-red-700">Critical Issues</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {reportMetrics.estimatedRemediationTime}
                </div>
                <div className="text-sm text-yellow-700">Est. Fix Time</div>
              </div>
            </div>

            {/* Compliance Level */}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getComplianceColor(reportMetrics.complianceLevel)}`}>
                <span className="text-lg font-bold">
                  Current Compliance Level: {reportMetrics.complianceLevel.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Top Recommendations */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Recommendations</h3>
              <div className="space-y-2">
                {reportMetrics.topRecommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm text-blue-800">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Findings Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {accessibilityResults.map((result, resultIndex) => (
              <div key={resultIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    Scan {resultIndex + 1} - Score: {result.overallScore.toFixed(1)}%
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {result.completionTime}ms
                  </div>
                </div>
                
                <div className="space-y-3">
                  {result.evaluations
                    .filter(e => e.status === 'fail')
                    .filter(e => reportOptions.severityFilter.includes(e.severity))
                    .map((evaluation, evalIndex) => (
                      <div key={evalIndex} className={`border rounded p-3 ${getSeverityColor(evaluation.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{evaluation.guidelineId}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(evaluation.severity)}`}>
                            {evaluation.severity.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-2">
                          {evaluation.findings.map((finding, findingIndex) => (
                            <div key={findingIndex} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 text-current flex-shrink-0" />
                              <span>{finding}</span>
                            </div>
                          ))}
                          
                          {reportOptions.includeRecommendations && evaluation.recommendations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                              <div className="font-medium text-xs mb-1">Recommendations:</div>
                              {evaluation.recommendations.slice(0, 2).map((rec, recIndex) => (
                                <div key={recIndex} className="text-xs flex items-start gap-2">
                                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                                  <span>{rec}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Remediation Guide Tab */}
        {activeTab === 'remediation' && showRemediationGuidance && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Remediation Priority Guide</h3>
              <p className="text-sm text-blue-800">
                Issues are prioritized based on severity, frequency, and user impact. 
                Focus on critical and high-priority items first for maximum accessibility improvement.
              </p>
            </div>
            
            {remediationItems.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{item.guideline}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(item.severity)}`}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">Priority #{index + 1}</div>
                    <div className="text-xs text-gray-600">Est. {item.estimatedEffort}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Impact</h4>
                    <p className="text-sm text-gray-700">{item.impact}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.affectedUsers.map((user, userIndex) => (
                        <span key={userIndex} className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                          <Users className="w-3 h-3 mr-1" />
                          {user}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Solution Steps</h4>
                    <ul className="space-y-1">
                      {item.solution.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-4 h-4 rounded-full bg-green-100 text-green-800 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                            {stepIndex + 1}
                          </div>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {item.codeExample && reportOptions.includeCodeSnippets && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Code Example</h4>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        <code>{item.codeExample}</code>
                      </pre>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Testing Methods</h4>
                    <div className="flex flex-wrap gap-1">
                      {item.testingMethod.map((method, methodIndex) => (
                        <span key={methodIndex} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Additional Resources</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.resources.slice(0, 2).map((resource, resourceIndex) => (
                        <a
                          key={resourceIndex}
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Resource {resourceIndex + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Trends Analysis</h3>
              <p className="text-gray-600">
                Historical trend analysis will be available after multiple scans are completed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityReporting;