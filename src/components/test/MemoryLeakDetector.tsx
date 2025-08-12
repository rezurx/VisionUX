import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, Database, Clock } from 'lucide-react';

interface MemorySnapshot {
  timestamp: number;
  used: number;
  total: number;
  limit: number;
  heapSizeIncrease: number;
}

interface MemoryLeakDetectorProps {
  isActive?: boolean;
  onLeakDetected?: (leak: MemoryLeak) => void;
  samplingInterval?: number;
  analysisWindow?: number;
}

interface MemoryLeak {
  type: 'gradual_increase' | 'spike' | 'excessive_usage';
  severity: 'low' | 'medium' | 'high';
  description: string;
  memoryGrowth: number;
  timestamp: number;
  recommendations: string[];
}

const MemoryLeakDetector: React.FC<MemoryLeakDetectorProps> = ({
  isActive = true,
  onLeakDetected,
  samplingInterval = 2000,
  analysisWindow = 60000 // 1 minute
}) => {
  const [memorySnapshots, setMemorySnapshots] = useState<MemorySnapshot[]>([]);
  const [detectedLeaks, setDetectedLeaks] = useState<MemoryLeak[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMemory, setCurrentMemory] = useState<MemorySnapshot | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isActive) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isActive, samplingInterval]);

  useEffect(() => {
    if (memorySnapshots.length >= 10) {
      analyzeMemoryPatterns();
    }
  }, [memorySnapshots, analysisWindow]);

  const startMonitoring = () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    setMemorySnapshots([]);
    setDetectedLeaks([]);
    
    intervalRef.current = setInterval(() => {
      const snapshot = captureMemorySnapshot();
      if (snapshot) {
        setCurrentMemory(snapshot);
        setMemorySnapshots(prev => {
          const updated = [...prev, snapshot];
          // Keep only samples within analysis window
          const cutoff = Date.now() - analysisWindow;
          return updated.filter(s => s.timestamp >= cutoff);
        });
      }
    }, samplingInterval);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsMonitoring(false);
  };

  const captureMemorySnapshot = (): MemorySnapshot | null => {
    if (!(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    const timestamp = Date.now();
    
    return {
      timestamp,
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      heapSizeIncrease: 0 // Will be calculated in analysis
    };
  };

  const analyzeMemoryPatterns = () => {
    if (memorySnapshots.length < 10) return;

    const analysis = {
      averageUsage: 0,
      peakUsage: 0,
      growthRate: 0,
      volatility: 0,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      leakSuspicion: 'none' as 'none' | 'low' | 'medium' | 'high'
    };

    // Calculate average usage
    analysis.averageUsage = memorySnapshots.reduce((sum, snapshot) => sum + snapshot.used, 0) / memorySnapshots.length;
    
    // Find peak usage
    analysis.peakUsage = Math.max(...memorySnapshots.map(s => s.used));
    
    // Calculate growth rate (MB per minute)
    const first = memorySnapshots[0];
    const last = memorySnapshots[memorySnapshots.length - 1];
    const timeDiff = (last.timestamp - first.timestamp) / 1000 / 60; // minutes
    const memoryDiff = (last.used - first.used) / (1024 * 1024); // MB
    analysis.growthRate = timeDiff > 0 ? memoryDiff / timeDiff : 0;

    // Calculate volatility (standard deviation)
    const variance = memorySnapshots.reduce((sum, snapshot) => {
      return sum + Math.pow(snapshot.used - analysis.averageUsage, 2);
    }, 0) / memorySnapshots.length;
    analysis.volatility = Math.sqrt(variance);

    // Determine trend
    if (analysis.growthRate > 5) { // More than 5MB/minute growth
      analysis.trend = 'increasing';
    } else if (analysis.growthRate < -2) {
      analysis.trend = 'decreasing';
    } else {
      analysis.trend = 'stable';
    }

    // Assess leak suspicion
    if (analysis.growthRate > 10) {
      analysis.leakSuspicion = 'high';
    } else if (analysis.growthRate > 5) {
      analysis.leakSuspicion = 'medium';
    } else if (analysis.growthRate > 2) {
      analysis.leakSuspicion = 'low';
    }

    setAnalysisResults(analysis);

    // Detect potential leaks
    detectMemoryLeaks(analysis);
  };

  const detectMemoryLeaks = (analysis: any) => {
    const newLeaks: MemoryLeak[] = [];

    // Gradual increase detection
    if (analysis.growthRate > 5 && analysis.trend === 'increasing') {
      const leak: MemoryLeak = {
        type: 'gradual_increase',
        severity: analysis.growthRate > 10 ? 'high' : analysis.growthRate > 7 ? 'medium' : 'low',
        description: `Memory usage increasing by ${analysis.growthRate.toFixed(2)} MB/minute`,
        memoryGrowth: analysis.growthRate,
        timestamp: Date.now(),
        recommendations: [
          'Check for event listeners that are not being removed',
          'Verify D3.js visualizations are properly cleaned up',
          'Look for accumulating data structures in analytics',
          'Review React component unmounting logic'
        ]
      };
      newLeaks.push(leak);
    }

    // Excessive usage detection
    const usagePercentage = (analysis.peakUsage / (500 * 1024 * 1024)) * 100; // Against 500MB limit
    if (usagePercentage > 80) {
      const leak: MemoryLeak = {
        type: 'excessive_usage',
        severity: usagePercentage > 95 ? 'high' : usagePercentage > 90 ? 'medium' : 'low',
        description: `Memory usage at ${usagePercentage.toFixed(1)}% of recommended limit`,
        memoryGrowth: 0,
        timestamp: Date.now(),
        recommendations: [
          'Consider implementing data virtualization for large datasets',
          'Optimize D3.js chart rendering for large similarity matrices',
          'Implement progressive loading for analytics dashboard',
          'Clear unused visualization data after component unmount'
        ]
      };
      newLeaks.push(leak);
    }

    // Memory spike detection
    const recentSpikes = memorySnapshots.slice(-5);
    if (recentSpikes.length === 5) {
      const avgRecent = recentSpikes.reduce((sum, s) => sum + s.used, 0) / 5;
      const avgOverall = analysis.averageUsage;
      const spikeRatio = avgRecent / avgOverall;
      
      if (spikeRatio > 1.5) {
        const leak: MemoryLeak = {
          type: 'spike',
          severity: spikeRatio > 2 ? 'high' : 'medium',
          description: `Memory spike detected: ${((spikeRatio - 1) * 100).toFixed(1)}% above average`,
          memoryGrowth: avgRecent - avgOverall,
          timestamp: Date.now(),
          recommendations: [
            'Check for large data processing operations',
            'Verify similarity matrix calculations are optimized',
            'Review dendrogram clustering algorithm efficiency',
            'Consider batching large export operations'
          ]
        };
        newLeaks.push(leak);
      }
    }

    // Update detected leaks and notify
    if (newLeaks.length > 0) {
      setDetectedLeaks(prev => [...prev, ...newLeaks]);
      newLeaks.forEach(leak => {
        if (onLeakDetected) {
          onLeakDetected(leak);
        }
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLeakTypeIcon = (type: string) => {
    switch (type) {
      case 'gradual_increase': return TrendingUp;
      case 'spike': return Activity;
      case 'excessive_usage': return Database;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Memory Leak Detector</span>
          </div>
          <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-sm ${
            isMonitoring ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span>{isMonitoring ? 'Monitoring' : 'Stopped'}</span>
          </div>
        </div>

        {currentMemory && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Current Usage</div>
              <div className="text-lg font-semibold text-gray-900">{formatBytes(currentMemory.used)}</div>
              <div className="text-xs text-gray-500">
                {((currentMemory.used / (500 * 1024 * 1024)) * 100).toFixed(1)}% of 500MB limit
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Heap</div>
              <div className="text-lg font-semibold text-gray-900">{formatBytes(currentMemory.total)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Heap Limit</div>
              <div className="text-lg font-semibold text-gray-900">{formatBytes(currentMemory.limit)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="bg-white rounded-lg shadow border p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Memory Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average Usage:</span>
                <span className="font-medium">{formatBytes(analysisResults.averageUsage)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Peak Usage:</span>
                <span className="font-medium">{formatBytes(analysisResults.peakUsage)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Growth Rate:</span>
                <span className={`font-medium ${
                  analysisResults.growthRate > 5 ? 'text-red-600' : 
                  analysisResults.growthRate > 2 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {analysisResults.growthRate.toFixed(2)} MB/min
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trend:</span>
                <span className={`font-medium capitalize ${
                  analysisResults.trend === 'increasing' ? 'text-red-600' :
                  analysisResults.trend === 'decreasing' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {analysisResults.trend}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Leak Suspicion:</span>
                <span className={`font-medium capitalize ${
                  analysisResults.leakSuspicion === 'high' ? 'text-red-600' :
                  analysisResults.leakSuspicion === 'medium' ? 'text-yellow-600' :
                  analysisResults.leakSuspicion === 'low' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {analysisResults.leakSuspicion}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Samples:</span>
                <span className="font-medium">{memorySnapshots.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detected Leaks */}
      {detectedLeaks.length > 0 && (
        <div className="bg-white rounded-lg shadow border p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
            Detected Memory Issues ({detectedLeaks.length})
          </h4>
          <div className="space-y-3">
            {detectedLeaks.slice(-3).map((leak, index) => {
              const IconComponent = getLeakTypeIcon(leak.type);
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900 capitalize">
                        {leak.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(leak.severity)}`}>
                        {leak.severity}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(leak.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{leak.description}</p>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Recommendations:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {leak.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clean Status */}
      {isMonitoring && detectedLeaks.length === 0 && memorySnapshots.length >= 10 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">No Memory Leaks Detected</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Memory usage patterns appear normal. Monitoring {memorySnapshots.length} samples over the last {Math.round((Date.now() - memorySnapshots[0]?.timestamp) / 60000)} minutes.
          </p>
        </div>
      )}
    </div>
  );
};

export default MemoryLeakDetector;