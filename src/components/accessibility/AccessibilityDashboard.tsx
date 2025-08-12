import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Settings, FileText, AlertTriangle, TrendingUp, Play, Eye, Users, Clock, Target, Zap, BarChart3, Calendar, Filter, Download } from 'lucide-react';
import AccessibilityScanner from './AccessibilityScanner';
import AccessibilityIssueDetector from './AccessibilityIssueDetector';
import AccessibilityReporting from './AccessibilityReporting';
import AccessibilityConfiguration from './AccessibilityConfiguration';
import AccessibilityScorecard from '../analytics/AccessibilityScorecard';
import { AccessibilityUtils, AccessibilityComplianceReport } from '../../utils/accessibility';
import { WCAGComplianceFramework, createWCAGFramework } from '../../utils/wcagCompliance';
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
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, all
  const [complianceTarget, setComplianceTarget] = useState<'A' | 'AA' | 'AAA'>('AA');
  const [wcagFramework, setWcagFramework] = useState(() => createWCAGFramework('2.1', 'AA'));
  const [selectedFilters, setSelectedFilters] = useState({
    severity: 'all',
    principle: 'all',
    status: 'all'
  });
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [complianceHistory, setComplianceHistory] = useState<any[]>([]);

  // Get WCAG guidelines for the dashboard
  const wcagGuidelines = Object.values(AccessibilityUtils.guidelines);
  
  // Advanced analytics calculations
  const advancedMetrics = useMemo(() => {
    if (accessibilityResults.length === 0) return null;
    
    const allEvaluations = accessibilityResults.flatMap(r => r.evaluations);
    const violations = allEvaluations.filter(e => e.status === 'fail');
    
    // WCAG Principle breakdown
    const principleBreakdown = {
      perceivable: violations.filter(v => wcagGuidelines.find(g => g.id === v.guidelineId)?.principle === 'perceivable').length,
      operable: violations.filter(v => wcagGuidelines.find(g => g.id === v.guidelineId)?.principle === 'operable').length,
      understandable: violations.filter(v => wcagGuidelines.find(g => g.id === v.guidelineId)?.principle === 'understandable').length,
      robust: violations.filter(v => wcagGuidelines.find(g => g.id === v.guidelineId)?.principle === 'robust').length
    };
    
    // Trend analysis
    const scoreHistory = accessibilityResults.map(r => r.overallScore);
    const trend = scoreHistory.length > 1 ? 
      (scoreHistory[0] - scoreHistory[scoreHistory.length - 1]) / scoreHistory[scoreHistory.length - 1] * 100 : 0;
    
    // Compliance level assessment
    const currentCompliance = wcagFramework.assessComplianceLevel(accessibilityResults);
    
    // Issue distribution by severity
    const severityDistribution = {
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length
    };
    
    return {
      principleBreakdown,
      trend,
      currentCompliance,
      severityDistribution,
      complianceGaps: wcagFramework.generateComplianceGaps(accessibilityResults, complianceTarget).length,
      improvementPotential: Math.max(0, 100 - dashboardStats.averageScore)
    };
  }, [accessibilityResults, wcagGuidelines, wcagFramework, complianceTarget, dashboardStats.averageScore]);

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

            {/* Advanced Analytics Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="time-range" className="text-sm font-medium text-gray-700">Time Range:</label>
                  <select 
                    id="time-range"
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="compliance-target" className="text-sm font-medium text-gray-700">Target:</label>
                  <select 
                    id="compliance-target"
                    value={complianceTarget} 
                    onChange={(e) => {
                      const target = e.target.value as 'A' | 'AA' | 'AAA';
                      setComplianceTarget(target);
                      setWcagFramework(createWCAGFramework('2.1', target));
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A">WCAG A</option>
                    <option value="AA">WCAG AA</option>
                    <option value="AAA">WCAG AAA</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showAdvancedAnalytics ? 'border-blue-300 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Advanced Analytics
              </button>
            </div>

            {/* Advanced Metrics Grid */}
            {showAdvancedAnalytics && advancedMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Compliance</span>
                  </div>
                  <div className="text-xl font-bold text-blue-900">{advancedMetrics.currentCompliance}</div>
                  <div className="text-xs text-blue-600">Current Level</div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Trend</span>
                  </div>
                  <div className={`text-xl font-bold ${
                    advancedMetrics.trend > 0 ? 'text-green-900' : advancedMetrics.trend < 0 ? 'text-red-900' : 'text-gray-900'
                  }`}>
                    {advancedMetrics.trend > 0 ? '+' : ''}{advancedMetrics.trend.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-600">Score Change</div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Gaps</span>
                  </div>
                  <div className="text-xl font-bold text-orange-900">{advancedMetrics.complianceGaps}</div>
                  <div className="text-xs text-orange-600">To Target</div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Potential</span>
                  </div>
                  <div className="text-xl font-bold text-purple-900">{advancedMetrics.improvementPotential.toFixed(1)}%</div>
                  <div className="text-xs text-purple-600">Improvement</div>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Critical</span>
                  </div>
                  <div className="text-xl font-bold text-red-900">{advancedMetrics.severityDistribution.critical}</div>
                  <div className="text-xs text-red-600">Issues</div>
                </div>
                
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Impact</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {Math.round((advancedMetrics.severityDistribution.critical + advancedMetrics.severityDistribution.high) * 2.5)}%
                  </div>
                  <div className="text-xs text-gray-600">Users Affected</div>
                </div>
              </div>
            )}

            {/* WCAG Principle Breakdown */}
            {showAdvancedAnalytics && advancedMetrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    WCAG Principle Analysis
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(advancedMetrics.principleBreakdown).map(([principle, count]) => {
                      const total = Object.values(advancedMetrics.principleBreakdown).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={principle} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              principle === 'perceivable' ? 'bg-blue-500' :
                              principle === 'operable' ? 'bg-green-500' :
                              principle === 'understandable' ? 'bg-yellow-500' : 'bg-purple-500'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-700 capitalize">{principle}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  principle === 'perceivable' ? 'bg-blue-500' :
                                  principle === 'operable' ? 'bg-green-500' :
                                  principle === 'understandable' ? 'bg-yellow-500' : 'bg-purple-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Issue Severity Distribution
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(advancedMetrics.severityDistribution).map(([severity, count]) => {
                      const total = Object.values(advancedMetrics.severityDistribution).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={severity} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              severity === 'critical' ? 'bg-red-500' :
                              severity === 'high' ? 'bg-orange-500' :
                              severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-700 capitalize">{severity}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  severity === 'critical' ? 'bg-red-500' :
                                  severity === 'high' ? 'bg-orange-500' :
                                  severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
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