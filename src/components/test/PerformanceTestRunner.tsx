import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, BarChart3, Clock, Database, Zap, CheckCircle2, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { PerformanceTestSuite, PerformanceMetrics, LargeDatasetConfig } from '../../test/performanceTestSuite';

interface PerformanceTestRunnerProps {
  onTestComplete?: (report: string) => void;
  autoRun?: boolean;
}

const PerformanceTestRunner: React.FC<PerformanceTestRunnerProps> = ({
  onTestComplete,
  autoRun = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [dataset, setDataset] = useState<any>(null);
  const [report, setReport] = useState<string>('');
  const [testConfig, setTestConfig] = useState<LargeDatasetConfig>({
    participantCount: 100,
    cardCount: 1000,
    categoryCount: 50,
    surveyResponseCount: 25,
    accessibilityIssueCount: 500,
    designComponentCount: 200
  });
  const [memoryMonitoring, setMemoryMonitoring] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoRun) {
      runPerformanceTests();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRun]);

  const runPerformanceTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setMetrics(null);
    setValidation(null);
    setReport('');
    setMemoryMonitoring([]);
    
    try {
      // Start memory monitoring
      startMemoryMonitoring();
      
      // Phase 1: Generate large dataset
      setCurrentTest('Generating large synthetic dataset...');
      setProgress(10);
      const generatedDataset = PerformanceTestSuite.generateLargeDataset(testConfig);
      setDataset(generatedDataset);
      
      // Phase 2: Run performance tests
      setCurrentTest('Running comprehensive performance tests...');
      setProgress(30);
      
      const testMetrics = await PerformanceTestSuite.runPerformanceTests(generatedDataset);
      setMetrics(testMetrics);
      setProgress(80);
      
      // Phase 3: Validate against benchmarks
      setCurrentTest('Validating performance against benchmarks...');
      setProgress(90);
      
      const validationResults = PerformanceTestSuite.validatePerformance(testMetrics);
      setValidation(validationResults);
      
      // Phase 4: Generate report
      setCurrentTest('Generating performance report...');
      setProgress(95);
      
      const performanceReport = PerformanceTestSuite.generateReport(testMetrics, validationResults, generatedDataset);
      setReport(performanceReport);
      
      if (onTestComplete) {
        onTestComplete(performanceReport);
      }
      
      setCurrentTest('Performance testing completed!');
      setProgress(100);
      
    } catch (error) {
      console.error('Performance testing failed:', error);
      setCurrentTest(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      stopMemoryMonitoring();
      setIsRunning(false);
    }
  };

  const startMemoryMonitoring = () => {
    intervalRef.current = setInterval(() => {
      const memInfo = getMemoryInfo();
      setMemoryMonitoring(prev => [
        ...prev.slice(-20), // Keep last 20 measurements
        {
          timestamp: Date.now(),
          ...memInfo
        }
      ]);
    }, 1000);
  };

  const stopMemoryMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  const getMemoryInfo = () => {
    if ((performance as any).memory) {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Performance Test Suite</h2>
              <p className="text-sm text-gray-600">Comprehensive Phase 1 validation testing</p>
            </div>
          </div>
          <button
            onClick={runPerformanceTests}
            disabled={isRunning}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isRunning ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Performance Tests
              </>
            )}
          </button>
        </div>

        {/* Test Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Participants</label>
            <input
              type="number"
              value={testConfig.participantCount}
              onChange={(e) => setTestConfig(prev => ({ ...prev, participantCount: parseInt(e.target.value) || 100 }))}
              disabled={isRunning}
              className="w-full text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cards</label>
            <input
              type="number"
              value={testConfig.cardCount}
              onChange={(e) => setTestConfig(prev => ({ ...prev, cardCount: parseInt(e.target.value) || 1000 }))}
              disabled={isRunning}
              className="w-full text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Components</label>
            <input
              type="number"
              value={testConfig.designComponentCount}
              onChange={(e) => setTestConfig(prev => ({ ...prev, designComponentCount: parseInt(e.target.value) || 200 }))}
              disabled={isRunning}
              className="w-full text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-gray-900">{currentTest}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-sm text-gray-600 mt-1">{progress.toFixed(0)}%</div>
        </div>
      )}

      {/* Memory Monitoring */}
      {memoryMonitoring.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-gray-900">Real-time Memory Usage</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memoryMonitoring.slice(-1).map((mem, idx) => (
              <div key={idx}>
                <div className="text-sm text-gray-600">Current Usage</div>
                <div className="text-lg font-semibold text-gray-900">{formatBytes(mem.used)}</div>
                <div className="text-xs text-gray-500">
                  {mem.total > 0 && `of ${formatBytes(mem.total)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {metrics && validation && (
        <div className="space-y-4">
          {/* Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-medium text-gray-900">Performance Results</span>
              </div>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                validation.passed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {validation.passed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    All Tests Passed
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Some Tests Failed
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(validation.results).map(([key, result]: [string, any]) => (
                <div key={key} className={`p-4 rounded-lg border ${
                  result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    {result.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTime(result.value)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Benchmark: {formatTime(result.benchmark)} 
                    <span className={`ml-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                      ({(result.ratio * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">Detailed Performance Metrics</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Visualization Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">D3.js Rendering:</span>
                      <span className="font-medium">{formatTime(metrics.d3RenderingTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Similarity Matrix:</span>
                      <span className="font-medium">{formatTime(metrics.similarityMatrixTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dendrogram:</span>
                      <span className="font-medium">{formatTime(metrics.dendrogramTime)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">System Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory Usage:</span>
                      <span className="font-medium">{formatBytes(metrics.memoryUsage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Processing:</span>
                      <span className="font-medium">{formatTime(metrics.dataProcessingTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cross-Method Analysis:</span>
                      <span className="font-medium">{formatTime(metrics.crossMethodAnalysisTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {dataset && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Dataset Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Participants:</span>
                      <div className="font-medium">{testConfig.participantCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Cards:</span>
                      <div className="font-medium">{testConfig.cardCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Records:</span>
                      <div className="font-medium">{dataset.metadata.totalRecords.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Generation Time:</span>
                      <div className="font-medium">{formatTime(dataset.metadata.generationTime)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Download */}
          {report && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Performance Test Report</h4>
                  <p className="text-sm text-gray-600">Complete analysis and recommendations</p>
                </div>
                <button
                  onClick={downloadReport}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceTestRunner;