import React, { useState, useEffect } from 'react';
import { Shield, Settings, FileText, AlertTriangle, TrendingUp, Play, Eye } from 'lucide-react';
import AccessibilityScanner from './AccessibilityScanner';
import AccessibilityIssueDetector from './AccessibilityIssueDetector';
import AccessibilityReporting from './AccessibilityReporting';
import AccessibilityConfiguration from './AccessibilityConfiguration';
import AccessibilityScorecard from '../analytics/AccessibilityScorecard';
import { AccessibilityUtils, AccessibilityComplianceReport } from '../../utils/accessibility';
import { AccessibilityResult, AccessibilityAuditConfig, AccessibilityGuideline } from '../../types';

interface AccessibilityDashboardProps {
  studyId?: number;
  studyType?: string;
  onConfigurationChange?: (config: AccessibilityAuditConfig) => void;
  onResultsUpdate?: (results: AccessibilityResult[]) => void;
  initialResults?: AccessibilityResult[];
  enableAllFeatures?: boolean;
}

type DashboardTab = 'overview' | 'scanner' | 'issues' | 'reporting' | 'configuration';

const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({
  studyId = 0,
  studyType = 'accessibility-audit',
  onConfigurationChange,
  onResultsUpdate,
  initialResults = [],
  enableAllFeatures = true
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [accessibilityResults, setAccessibilityResults] = useState<AccessibilityResult[]>(initialResults);
  const [complianceReport, setComplianceReport] = useState<AccessibilityComplianceReport | null>(null);
  const [auditConfig, setAuditConfig] = useState<AccessibilityAuditConfig | null>(null);
  const [scanHistory, setScanHistory] = useState<AccessibilityResult[]>([]);
  const [isInitialSetup, setIsInitialSetup] = useState(initialResults.length === 0);
  const [dashboardStats, setDashboardStats] = useState({
    totalScans: 0,
    averageScore: 0,
    totalIssues: 0,
    criticalIssues: 0,
    lastScanDate: null as Date | null
  });

  // Get WCAG guidelines for the dashboard
  const wcagGuidelines = Object.values(AccessibilityUtils.guidelines);

  useEffect(() => {
    updateDashboardStats();
    if (accessibilityResults.length > 0) {
      generateComplianceReport();
    }
  }, [accessibilityResults]);

  useEffect(() => {
    onResultsUpdate?.(accessibilityResults);
  }, [accessibilityResults, onResultsUpdate]);

  const updateDashboardStats = () => {
    if (accessibilityResults.length === 0) {
      setDashboardStats({
        totalScans: 0,
        averageScore: 0,
        totalIssues: 0,
        criticalIssues: 0,
        lastScanDate: null
      });
      return;
    }

    const totalScans = accessibilityResults.length;
    const averageScore = accessibilityResults.reduce((sum, result) => sum + result.overallScore, 0) / totalScans;
    const totalIssues = accessibilityResults.reduce((sum, result) => 
      sum + result.evaluations.filter(e => e.status === 'fail').length, 0
    );
    const criticalIssues = accessibilityResults.reduce((sum, result) => 
      sum + result.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical').length, 0
    );
    const lastScanDate = new Date(); // Would be from actual result timestamp

    setDashboardStats({
      totalScans,
      averageScore,
      totalIssues,
      criticalIssues,
      lastScanDate
    });
  };

  const generateComplianceReport = async () => {
    try {
      const scanner = AccessibilityUtils.scanner;
      const report = scanner.generateComplianceReport(accessibilityResults);
      setComplianceReport(report);
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
    }
  };

  const handleScanComplete = (result: AccessibilityResult) => {
    const updatedResults = [result, ...accessibilityResults];
    setAccessibilityResults(updatedResults);
    setScanHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 scans
    setIsInitialSetup(false);
  };

  const handleConfigurationSave = (config: AccessibilityAuditConfig) => {
    setAuditConfig(config);
    onConfigurationChange?.(config);
    if (isInitialSetup) {
      setActiveTab('scanner');
    }
  };

  const handleStartQuickScan = async () => {
    try {
      const result = await AccessibilityUtils.quickScan();
      result.studyId = studyId;
      handleScanComplete(result);
    } catch (error) {
      console.error('Quick scan failed:', error);
    }
  };

  const getTabIcon = (tab: DashboardTab) => {
    switch (tab) {
      case 'overview': return TrendingUp;
      case 'scanner': return Play;
      case 'issues': return AlertTriangle;
      case 'reporting': return FileText;
      case 'configuration': return Settings;
      default: return Shield;
    }
  };

  const getStatsColor = (value: number, type: 'score' | 'issues') => {
    if (type === 'score') {
      if (value >= 90) return 'text-green-600';
      if (value >= 75) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value === 0) return 'text-green-600';
      if (value <= 5) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Accessibility & Compliance Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {studyId ? `Study #${studyId}` : 'Comprehensive'} accessibility testing and WCAG compliance monitoring
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartQuickScan}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Play className="w-4 h-4 mr-2" />
              Quick Scan
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Scans</p>
                <p className="text-2xl font-bold text-blue-900">{dashboardStats.totalScans}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Average Score</p>
                <p className={`text-2xl font-bold ${getStatsColor(dashboardStats.averageScore, 'score')}`}>
                  {dashboardStats.averageScore.toFixed(1)}%
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Total Issues</p>
                <p className={`text-2xl font-bold ${getStatsColor(dashboardStats.totalIssues, 'issues')}`}>
                  {dashboardStats.totalIssues}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Critical Issues</p>
                <p className={`text-2xl font-bold ${getStatsColor(dashboardStats.criticalIssues, 'issues')}`}>
                  {dashboardStats.criticalIssues}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-4">
          {[
            { key: 'overview', label: 'Overview', enabled: true },
            { key: 'scanner', label: 'Scanner', enabled: enableAllFeatures },
            { key: 'issues', label: 'Issue Detector', enabled: enableAllFeatures },
            { key: 'reporting', label: 'Reporting', enabled: true },
            { key: 'configuration', label: 'Configuration', enabled: enableAllFeatures }
          ]
            .filter(tab => tab.enabled)
            .map(tab => {
              const IconComponent = getTabIcon(tab.key as DashboardTab);
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as DashboardTab)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                  {tab.key === 'issues' && dashboardStats.totalIssues > 0 && (
                    <span className="ml-1 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      {dashboardStats.totalIssues}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Setup Guide for Initial Setup */}
            {isInitialSetup && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">Get Started with Accessibility Testing</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <h3 className="font-medium text-gray-900">Configure Settings</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Set up your accessibility audit parameters and WCAG compliance level.</p>
                    <button
                      onClick={() => setActiveTab('configuration')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Open Configuration →
                    </button>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <h3 className="font-medium text-gray-900">Run First Scan</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Perform your first accessibility scan to identify issues.</p>
                    <button
                      onClick={handleStartQuickScan}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Start Scanning →
                    </button>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <h3 className="font-medium text-gray-900">Review Results</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Analyze findings and generate compliance reports.</p>
                    <button
                      onClick={() => setActiveTab('reporting')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Reporting →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accessibility Scorecard */}
              <div className="lg:col-span-2">
                <AccessibilityScorecard
                  accessibilityResults={accessibilityResults}
                  guidelines={wcagGuidelines}
                  width={1200}
                  height={600}
                  showTrends={true}
                  enableLiveScanning={true}
                  onScanTriggered={generateComplianceReport}
                  complianceReport={complianceReport}
                  scanHistory={scanHistory}
                />
              </div>
            </div>

            {/* Recent Activity */}
            {scanHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Scan Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scanHistory.slice(0, 6).map((scan, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Scan #{index + 1}</span>
                        <span className={`text-sm font-bold ${getStatsColor(scan.overallScore, 'score')}`}>
                          {scan.overallScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Issues: {scan.evaluations.filter(e => e.status === 'fail').length}</div>
                        <div>Duration: {scan.completionTime}ms</div>
                        <div>Time: {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scanner Tab */}
        {activeTab === 'scanner' && enableAllFeatures && (
          <AccessibilityScanner
            studyId={studyId}
            onScanComplete={handleScanComplete}
            onConfigChange={(config) => setAuditConfig(config as any)}
            autoStart={false}
            initialConfig={auditConfig ? {
              wcagLevel: auditConfig.complianceLevel,
              timeout: 30000
            } : undefined}
          />
        )}

        {/* Issue Detector Tab */}
        {activeTab === 'issues' && enableAllFeatures && (
          <AccessibilityIssueDetector
            autoDetect={true}
            showOverlay={true}
            onIssueSelect={(issue) => {
              console.log('Selected issue:', issue);
            }}
            onIssueResolve={(issueId) => {
              console.log('Resolved issue:', issueId);
            }}
          />
        )}

        {/* Reporting Tab */}
        {activeTab === 'reporting' && (
          <AccessibilityReporting
            accessibilityResults={accessibilityResults}
            complianceReport={complianceReport}
            onGenerateReport={(type, options) => {
              console.log('Generate report:', type, options);
            }}
            onExportReport={(format, data) => {
              console.log('Export report:', format, data);
            }}
            showRemediationGuidance={true}
            enableScheduledReports={enableAllFeatures}
          />
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && enableAllFeatures && (
          <AccessibilityConfiguration
            studyId={studyId}
            initialConfig={auditConfig || undefined}
            onConfigUpdate={(config) => setAuditConfig(config)}
            onConfigSave={handleConfigurationSave}
            showPreview={true}
            enableAdvancedOptions={true}
          />
        )}

        {/* Empty State for Features Not Enabled */}
        {!enableAllFeatures && ['scanner', 'issues', 'configuration'].includes(activeTab) && (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Not Available</h3>
            <p className="text-gray-600">
              This feature is not enabled in the current configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityDashboard;