import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Settings, Download, AlertCircle, CheckCircle2, Clock, TrendingUp, Shield, Zap, Target, BarChart3, FileText, Calendar } from 'lucide-react';
import { 
  AccessibilityScanner, 
  AccessibilityScanConfig, 
  AccessibilityComplianceReport, 
  AccessibilityScheduleConfig,
  NotificationConfig,
  AccessibilityUtils 
} from '../../utils/accessibility';
import { AccessibilityResult, AccessibilityEvaluation } from '../../types';
import { WCAGComplianceFramework } from '../../utils/wcagCompliance';

interface AccessibilityScannerProps {
  studyId?: number;
  onScanComplete?: (result: AccessibilityResult) => void;
  onConfigChange?: (config: AccessibilityScanConfig) => void;
  autoStart?: boolean;
  initialConfig?: Partial<AccessibilityScanConfig>;
  enableScheduling?: boolean;
  scheduleConfig?: AccessibilityScheduleConfig;
  onScheduleChange?: (schedule: AccessibilityScheduleConfig) => void;
}

const AccessibilityScannerComponent: React.FC<AccessibilityScannerProps> = ({
  studyId,
  onScanComplete,
  onConfigChange,
  autoStart = false,
  initialConfig = {},
  enableScheduling = false,
  scheduleConfig,
  onScheduleChange
}) => {
  const fullInitialConfig: AccessibilityScanConfig = {
    wcagLevel: 'AA',
    timeout: 30000,
    allowFailedFrames: true,
    reporter: 'v2',
    resultTypes: ['violations', 'incomplete', 'passes'],
    ...initialConfig
  };
  const [scanner] = useState(() => new AccessibilityScanner(fullInitialConfig));
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<AccessibilityResult | null>(null);
  const [complianceReport, setComplianceReport] = useState<AccessibilityComplianceReport | null>(null);
  const [config, setConfig] = useState<AccessibilityScanConfig>(fullInitialConfig);
  const [showConfig, setShowConfig] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState(scanner.getMonitoringStatus());
  const [scanHistory, setScanHistory] = useState<AccessibilityResult[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<AccessibilityScheduleConfig | undefined>(scheduleConfig);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [prioritizedRecommendations, setPrioritizedRecommendations] = useState<string[]>([]);
  const [wcagFramework] = useState(() => new WCAGComplianceFramework('2.1', 'AA'));
  const [realTimeIssues, setRealTimeIssues] = useState<AccessibilityEvaluation[]>([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, phase: '' });
  const [performanceMetrics, setPerformanceMetrics] = useState({ 
    scanSpeed: 0, 
    issueDetectionRate: 0, 
    accuracy: 0, 
    coverage: 0 
  });
  
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoStart) {
      handleStartScan();
    }

    // Update monitoring status periodically
    const interval = setInterval(() => {
      const status = scanner.getMonitoringStatus();
      setMonitoringStatus(status);
      setIsMonitoring(status?.isActive || false);
    }, 1000);

    return () => {
      clearInterval(interval);
      scanner.stopMonitoring();
    };
  }, [autoStart]);

  const handleStartScan = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress({ current: 0, total: 100, phase: 'Initializing scan...' });
    
    try {
      // Enhanced scanning with progress tracking
      setScanProgress({ current: 10, total: 100, phase: 'Configuring axe-core...' });
      
      setScanProgress({ current: 30, total: 100, phase: 'Scanning DOM structure...' });
      
      const startTime = performance.now();
      const result = await scanner.scanPage();
      const endTime = performance.now();
      
      result.studyId = studyId || 0;
      
      setScanProgress({ current: 70, total: 100, phase: 'Processing results...' });
      
      // Calculate performance metrics
      const scanDuration = endTime - startTime;
      const issueCount = result.evaluations.filter(e => e.status === 'fail').length;
      const totalElements = document.querySelectorAll('*').length;
      
      setPerformanceMetrics({
        scanSpeed: Math.round(totalElements / (scanDuration / 1000)), // elements per second
        issueDetectionRate: Math.round((issueCount / totalElements) * 100 * 100) / 100,
        accuracy: result.overallScore,
        coverage: Math.round((result.evaluations.length / Object.keys(AccessibilityUtils.guidelines).length) * 100)
      });
      
      setScanProgress({ current: 85, total: 100, phase: 'Generating compliance analysis...' });
      
      setScanResults(result);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 scans
      
      // Generate enhanced compliance report
      const allResults = [result, ...scanHistory];
      const report = scanner.generateComplianceReport(allResults);
      setComplianceReport(report);
      
      // Extract real-time issues for monitoring
      const criticalIssues = result.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical');
      setRealTimeIssues(criticalIssues);
      
      setScanProgress({ current: 100, total: 100, phase: 'Scan complete!' });
      
      onScanComplete?.(result);
    } catch (error) {
      console.error('Accessibility scan failed:', error);
      setScanProgress({ current: 100, total: 100, phase: 'Scan failed - check console for details' });
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress({ current: 0, total: 0, phase: '' });
      }, 2000);
    }
  };

  const handleStartMonitoring = () => {
    const interval = currentSchedule?.type === 'interval' ? (currentSchedule.schedule as number) : 30000;
    scanner.startMonitoring(interval, currentSchedule);
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    scanner.stopMonitoring();
    setIsMonitoring(false);
    setMonitoringStatus(null);
  };

  const handleConfigUpdate = (newConfig: Partial<AccessibilityScanConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  const handleScheduleUpdate = (newSchedule: Partial<AccessibilityScheduleConfig>) => {
    const updatedSchedule = { ...currentSchedule, ...newSchedule } as AccessibilityScheduleConfig;
    setCurrentSchedule(updatedSchedule);
    onScheduleChange?.(updatedSchedule);
  };

  const generatePrioritizedRecommendations = (results: AccessibilityResult[]): string[] => {
    const recommendations = new Map<string, number>();
    
    results.forEach(result => {
      result.evaluations
        .filter(e => e.status === 'fail')
        .forEach(evaluation => {
          evaluation.recommendations.forEach(rec => {
            const severity = evaluation.severity;
            const weight = getSeverityWeight(severity);
            const currentScore = recommendations.get(rec) || 0;
            recommendations.set(rec, currentScore + weight);
          });
        });
    });

    return Array.from(recommendations.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([rec]) => rec);
  };

  const getSeverityWeight = (severity: string): number => {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  };

  // Update recommendations when scan results change
  useEffect(() => {
    if (scanResults) {
      const allResults = [scanResults, ...scanHistory];
      setPrioritizedRecommendations(generatePrioritizedRecommendations(allResults));
    }
  }, [scanResults, scanHistory]);

  const handleDownloadReport = () => {
    if (!complianceReport) return;

    const reportData = {
      ...complianceReport,
      scanHistory: scanHistory.map(result => ({
        timestamp: Date.now(),
        overallScore: result.overallScore,
        violations: result.evaluations.filter(e => e.status === 'fail').length,
        completionTime: result.completionTime
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceColor = (level: string): string => {
    switch (level) {
      case 'AAA': return 'text-green-600 bg-green-50';
      case 'AA': return 'text-blue-600 bg-blue-50';
      case 'A': return 'text-yellow-600 bg-yellow-50';
      case 'non-compliant': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Accessibility Scanner</h2>
            <p className="text-sm text-gray-600 mt-1">
              WCAG {config.wcagLevel} compliance testing with axe-core
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Settings className="w-4 h-4 mr-1" />
              Configure
            </button>
            
            {enableScheduling && (
              <button
                onClick={() => setShowScheduleConfig(!showScheduleConfig)}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  showScheduleConfig 
                    ? 'border-purple-300 text-purple-700 bg-purple-50' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Clock className="w-4 h-4 mr-1" />
                Schedule
              </button>
            )}
            
            {complianceReport && (
              <button
                onClick={handleDownloadReport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download className="w-4 h-4 mr-1" />
                Report
              </button>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {performanceMetrics.scanSpeed > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Speed</span>
              </div>
              <div className="text-sm font-bold text-blue-900">
                {performanceMetrics.scanSpeed.toLocaleString()} el/s
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Detection Rate</span>
              </div>
              <div className="text-sm font-bold text-orange-900">
                {performanceMetrics.issueDetectionRate}%
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Accuracy</span>
              </div>
              <div className="text-sm font-bold text-green-900">
                {performanceMetrics.accuracy.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Coverage</span>
              </div>
              <div className="text-sm font-bold text-purple-900">
                {performanceMetrics.coverage}%
              </div>
            </div>
          </div>
        )}

        {/* Real-time Issues Alert */}
        {realTimeIssues.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {realTimeIssues.length} Critical Issues Detected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {realTimeIssues.slice(0, 4).map((issue, index) => (
                <div key={index} className="text-xs text-red-700 bg-white rounded px-2 py-1 border border-red-100">
                  {issue.guidelineId}: {issue.findings[0]?.substring(0, 50)}...
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitoring Status */}
        {isMonitoring && monitoringStatus && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">
                  Real-time Monitoring Active
                </span>
              </div>
              <div className="text-xs text-green-700">
                Last scan: {new Date(monitoringStatus.lastScanTime).toLocaleTimeString()}
              </div>
            </div>
            
            {monitoringStatus.progressTracking && (
              <div className="mt-2 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-800">
                    {monitoringStatus.progressTracking.totalIssues}
                  </div>
                  <div className="text-xs text-green-600">Total Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-800">
                    {monitoringStatus.progressTracking.resolvedIssues}
                  </div>
                  <div className="text-xs text-blue-600">Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-800">
                    {monitoringStatus.progressTracking.criticalIssues}
                  </div>
                  <div className="text-xs text-red-600">Critical</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold px-2 py-1 rounded ${getComplianceColor(monitoringStatus.progressTracking.complianceLevel)}`}>
                    {monitoringStatus.progressTracking.complianceLevel.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-600">Compliance</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scheduling Configuration Panel */}
      {enableScheduling && showScheduleConfig && (
        <div className="border-b p-4 bg-purple-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Automated Scanning Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Type
              </label>
              <select
                value={currentSchedule?.type || 'interval'}
                onChange={(e) => handleScheduleUpdate({ type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="interval">Interval-based</option>
                <option value="cron">Time-based</option>
                <option value="event-driven">Event-driven</option>
              </select>
            </div>

            {currentSchedule?.type === 'interval' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval (minutes)
                </label>
                <input
                  type="number"
                  value={Math.floor((currentSchedule.schedule as number) / 60000)}
                  onChange={(e) => handleScheduleUpdate({ schedule: parseInt(e.target.value) * 60000 })}
                  min={1}
                  max={1440}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {currentSchedule?.type === 'cron' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily at Time
                </label>
                <input
                  type="time"
                  value={typeof currentSchedule.schedule === 'string' ? '09:00' : '09:00'}
                  onChange={(e) => handleScheduleUpdate({ schedule: `0 ${e.target.value.split(':').join(' ')} * * *` })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={currentSchedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                onChange={(e) => handleScheduleUpdate({ timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="America/New_York"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentSchedule?.enabled || false}
                onChange={(e) => handleScheduleUpdate({ enabled: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable scheduled scanning</span>
            </label>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && (
        <div ref={configRef} className="border-b p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WCAG Level
              </label>
              <select
                value={config.wcagLevel}
                onChange={(e) => handleConfigUpdate({ wcagLevel: e.target.value as 'A' | 'AA' | 'AAA' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Level A</option>
                <option value="AA">Level AA</option>
                <option value="AAA">Level AAA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => handleConfigUpdate({ timeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result Types
              </label>
              <div className="space-y-1">
                {['violations', 'incomplete', 'passes', 'inapplicable'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.resultTypes?.includes(type as any) || false}
                      onChange={(e) => {
                        const currentTypes = config.resultTypes || [];
                        const newTypes = e.target.checked
                          ? [...currentTypes, type as any]
                          : currentTypes.filter(t => t !== type);
                        handleConfigUpdate({ resultTypes: newTypes });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Controls */}
      <div className="p-4 border-b">
        {/* Progress Indicator */}
        {isScanning && scanProgress.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{scanProgress.phase}</span>
              <span className="text-sm text-gray-500">{scanProgress.current}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${scanProgress.current}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isScanning ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Enhanced Scan
              </>
            )}
          </button>
          
          {scanResults && (
            <button
              onClick={() => {
                const complianceLevel = wcagFramework.assessComplianceLevel([scanResults]);
                console.log('WCAG Compliance Level:', complianceLevel);
              }}
              className="inline-flex items-center px-3 py-2 text-sm border border-green-300 text-green-700 bg-green-50 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Shield className="w-4 h-4 mr-1" />
              Check Compliance
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          {isMonitoring ? (
            <button
              onClick={handleStopMonitoring}
              className="inline-flex items-center px-3 py-2 text-sm border border-red-300 text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Pause className="w-4 h-4 mr-1" />
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={handleStartMonitoring}
              className="inline-flex items-center px-3 py-2 text-sm border border-green-300 text-green-700 bg-green-50 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Start Monitoring
            </button>
          )}
          
          {scanResults && (
            <div className="ml-auto flex items-center gap-4 text-sm text-gray-600">
              <span>Score: {scanResults.overallScore.toFixed(1)}%</span>
              <span>Duration: {scanResults.completionTime}ms</span>
              <span>Issues: {scanResults.evaluations.filter(e => e.status === 'fail').length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {scanResults && (
        <div className="p-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {scanResults.evaluations.filter(e => e.status === 'pass').length}
              </div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {scanResults.evaluations.filter(e => e.status === 'fail').length}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {scanResults.evaluations.filter(e => e.status === 'needs-review').length}
              </div>
              <div className="text-sm text-yellow-700">Needs Review</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {scanResults.overallScore.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Overall Score</div>
            </div>
          </div>

          {/* Violations List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Accessibility Issues</h3>
            
            {scanResults.evaluations
              .filter(e => e.status === 'fail')
              .map((evaluation, index) => (
                <div 
                  key={`${evaluation.guidelineId}-${index}`}
                  className={`border rounded-lg p-4 ${getSeverityColor(evaluation.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">
                          {evaluation.guidelineId}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(evaluation.severity)}`}>
                          {evaluation.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {evaluation.findings.map((finding, fIndex) => (
                          <div key={fIndex} className="flex items-start gap-2">
                            <span className="text-gray-500 mt-0.5">•</span>
                            <span>{finding}</span>
                          </div>
                        ))}
                      </div>
                      
                      {evaluation.recommendations.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="font-medium text-sm">Recommendations:</div>
                          {evaluation.recommendations.slice(0, 3).map((rec, rIndex) => (
                            <div key={rIndex} className="text-xs text-gray-700 flex items-start gap-2">
                              <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {scanResults.evaluations.filter(e => e.status === 'fail').length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Accessibility Issues Found</h3>
              <p className="text-gray-600">Great! Your page meets the selected WCAG {config.wcagLevel} criteria.</p>
            </div>
          )}

          {/* Priority Recommendations */}
          {prioritizedRecommendations.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Priority Recommendations
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Top recommendations based on issue severity and frequency across all scans
              </p>
              <ul className="space-y-2">
                {prioritizedRecommendations.slice(0, 5).map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm text-blue-800">{rec}</span>
                  </li>
                ))}
              </ul>
              {prioritizedRecommendations.length > 5 && (
                <p className="text-xs text-blue-600 mt-3">
                  +{prioritizedRecommendations.length - 5} more recommendations available in the full report
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Scans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scanHistory.slice(0, 6).map((result, index) => (
              <div key={index} className="bg-white rounded border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date().toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${result.overallScore >= 90 ? 'bg-green-100 text-green-800' : result.overallScore >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {result.overallScore.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Issues: {result.evaluations.filter(e => e.status === 'fail').length} | 
                  Duration: {result.completionTime}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityScannerComponent;