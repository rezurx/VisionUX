// =============================================================================
// RESEARCH METHOD TEMPLATE
// =============================================================================
//
// This template provides a starting point for implementing new research methods
// in the Vision UX Research Suite. Follow the integration guide for detailed
// instructions on each component.

import React from 'react';
import { 
  ResearchMethodPlugin,
  ValidationResult,
  ProcessedResults,
  AnalyticsData,
  ExportFormat,
  ExportResult,
  BaseMethodConfig,
  RESEARCH_METHOD_METADATA
} from '../types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Define your method-specific configuration interface
 * This extends BaseMethodConfig and includes all settings specific to your method
 */
export interface YourMethodConfig extends BaseMethodConfig {
  methodType: 'your-new-method'; // Replace with your method name
  
  // Add your method-specific configuration options
  enableFeatureA: boolean;
  customSetting: string;
  numericOption: number;
  selectOption: 'option1' | 'option2' | 'option3';
  
  // Complex configuration objects
  advancedSettings?: {
    timeout: number;
    retries: number;
    validation: boolean;
  };
  
  // Arrays for multiple items
  customItems?: Array<{
    id: string;
    name: string;
    value: any;
  }>;
}

/**
 * Define your method-specific data structures
 * These represent the data that participants will interact with
 */
export interface YourMethodData {
  id: number;
  title: string;
  description: string;
  metadata?: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number;
  };
}

/**
 * Define your method-specific results structure
 * This represents the data collected from participants
 */
export interface YourMethodResults {
  participantId: string;
  studyId: number;
  startTime: number;
  endTime: number;
  completed: boolean;
  
  // Method-specific result data
  responses: Array<{
    itemId: number;
    response: any;
    timestamp: number;
    duration: number;
  }>;
  
  // Performance metrics
  totalTime: number;
  accuracyScore: number;
  completionRate: number;
  
  // Behavioral data
  interactionLog?: Array<{
    action: string;
    target: string;
    timestamp: number;
  }>;
}

// =============================================================================
// REACT COMPONENTS
// =============================================================================

/**
 * Study Configuration Component
 * This component is shown when creating/editing a study of your method type
 */
const YourMethodConfigComponent: React.FC<{
  config: YourMethodConfig;
  onChange: (config: YourMethodConfig) => void;
  onValidate?: (validation: ValidationResult) => void;
}> = ({ config, onChange, onValidate }) => {
  
  const handleSettingChange = (field: keyof YourMethodConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    onChange(newConfig);
    
    // Trigger validation if callback provided
    if (onValidate) {
      const validation = validateYourMethodConfig(newConfig);
      onValidate(validation);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Method Configuration
        </h3>
        
        {/* Enable Feature A */}
        <div className="mb-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.enableFeatureA}
              onChange={(e) => handleSettingChange('enableFeatureA', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable Feature A
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            This feature provides additional functionality for participants.
          </p>
        </div>

        {/* Custom Setting */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Setting
          </label>
          <input
            type="text"
            value={config.customSetting}
            onChange={(e) => handleSettingChange('customSetting', e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter custom setting..."
          />
        </div>

        {/* Numeric Option */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numeric Option
          </label>
          <input
            type="number"
            value={config.numericOption}
            onChange={(e) => handleSettingChange('numericOption', parseInt(e.target.value))}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="1"
            max="100"
          />
        </div>

        {/* Select Option */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Option
          </label>
          <select
            value={config.selectOption}
            onChange={(e) => handleSettingChange('selectOption', e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/**
 * Participant Interface Component
 * This component is shown to participants taking your research method
 */
const YourMethodParticipantComponent: React.FC<{
  study: any; // Study object with your method configuration
  onComplete: (results: YourMethodResults) => void;
  onProgress?: (progress: number) => void;
}> = ({ study, onComplete, onProgress }) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [responses, setResponses] = React.useState<any[]>([]);
  const [startTime] = React.useState(Date.now());

  const handleResponse = (response: any) => {
    const newResponses = [...responses, {
      itemId: currentStep,
      response,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    }];
    setResponses(newResponses);

    // Update progress
    const progress = ((currentStep + 1) / study.yourMethodData.length) * 100;
    onProgress?.(progress);

    // Move to next step or complete
    if (currentStep < study.yourMethodData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the study
      const results: YourMethodResults = {
        participantId: 'participant-id', // This should come from context
        studyId: study.id,
        startTime,
        endTime: Date.now(),
        completed: true,
        responses: newResponses,
        totalTime: Date.now() - startTime,
        accuracyScore: calculateAccuracyScore(newResponses),
        completionRate: 1.0
      };
      onComplete(results);
    }
  };

  const currentItem = study.yourMethodData[currentStep];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Method Study
            </h2>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {study.yourMethodData.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / study.yourMethodData.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentItem?.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {currentItem?.description}
          </p>

          {/* Your method-specific interface goes here */}
          <div className="space-y-4">
            <button
              onClick={() => handleResponse('response-a')}
              className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              Response Option A
            </button>
            <button
              onClick={() => handleResponse('response-b')}
              className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              Response Option B
            </button>
            <button
              onClick={() => handleResponse('response-c')}
              className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              Response Option C
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Results Display Component
 * This component shows the results of your research method
 */
const YourMethodResultsComponent: React.FC<{
  study: any;
  results: YourMethodResults[];
}> = ({ study, results }) => {
  const averageTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
  const averageAccuracy = results.reduce((sum, r) => sum + r.accuracyScore, 0) / results.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Results Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {results.length}
            </div>
            <div className="text-sm text-gray-500">Participants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(averageTime / 1000)}s
            </div>
            <div className="text-sm text-gray-500">Avg Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(averageAccuracy * 100)}%
            </div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {results.filter(r => r.completed).length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Individual Results
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={result.participantId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.participantId || `Participant ${index + 1}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(result.totalTime / 1000)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(result.accuracyScore * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      result.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.completed ? 'Completed' : 'Incomplete'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * Analytics Component
 * This component provides detailed analytics and insights for your method
 */
const YourMethodAnalyticsComponent: React.FC<{
  study: any;
  results: YourMethodResults[];
}> = ({ study, results }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Advanced Analytics
        </h3>
        <p className="text-gray-600">
          Implement your method-specific analytics and visualizations here.
          This could include charts, statistical analysis, and actionable insights.
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate study configuration for your method
 */
const validateYourMethodConfig = (config: YourMethodConfig): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];

  // Validate required fields
  if (!config.customSetting.trim()) {
    errors.push({
      field: 'customSetting',
      message: 'Custom setting is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate numeric ranges
  if (config.numericOption < 1 || config.numericOption > 100) {
    errors.push({
      field: 'numericOption',
      message: 'Numeric option must be between 1 and 100',
      code: 'INVALID_RANGE'
    });
  }

  // Add warnings for best practices
  if (config.numericOption < 10) {
    warnings.push({
      field: 'numericOption',
      message: 'Consider using a higher value for better results',
      suggestion: 'Values above 10 typically provide more reliable data'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Process raw results from participants
 */
const processYourMethodResults = (results: YourMethodResults): ProcessedResults => {
  // Calculate quality metrics
  const completionRate = results.completed ? 1.0 : results.responses.length / 10; // Assuming 10 total items
  const consistencyScore = calculateConsistency(results.responses);
  
  const qualityMetrics = {
    completeness: completionRate,
    consistency: consistencyScore,
    validity: results.accuracyScore,
    reliability: Math.min(consistencyScore, results.accuracyScore),
    flags: [] as any[],
    overallScore: (completionRate + consistencyScore + results.accuracyScore) / 3,
    recommendations: [] as string[]
  };

  // Add quality flags
  if (results.totalTime < 10000) { // Less than 10 seconds
    qualityMetrics.flags.push({
      type: 'warning',
      code: 'FAST_COMPLETION',
      message: 'Participant completed very quickly',
      severity: 'medium'
    });
  }

  if (!results.completed) {
    qualityMetrics.flags.push({
      type: 'error',
      code: 'INCOMPLETE',
      message: 'Participant did not complete the study',
      severity: 'high'
    });
  }

  return {
    rawData: results,
    processedData: {
      ...results,
      processed: true,
      qualityScore: qualityMetrics.overallScore
    },
    qualityMetrics,
    insights: [
      `Participant completed ${results.responses.length} items`,
      `Overall accuracy: ${Math.round(results.accuracyScore * 100)}%`
    ]
  };
};

/**
 * Generate analytics data for multiple results
 */
const generateYourMethodAnalytics = (results: YourMethodResults[]): AnalyticsData => {
  const completedResults = results.filter(r => r.completed);
  const averageTime = completedResults.reduce((sum, r) => sum + r.totalTime, 0) / completedResults.length;
  const averageAccuracy = completedResults.reduce((sum, r) => sum + r.accuracyScore, 0) / completedResults.length;

  return {
    summary: {
      totalParticipants: results.length,
      completedParticipants: completedResults.length,
      averageTime: Math.round(averageTime / 1000), // in seconds
      averageAccuracy: Math.round(averageAccuracy * 100), // as percentage
      completionRate: completedResults.length / results.length
    },
    charts: [
      {
        id: 'completion-times',
        type: 'histogram',
        title: 'Completion Time Distribution',
        data: completedResults.map(r => ({ value: r.totalTime / 1000, label: 'seconds' })),
        options: {
          xAxis: 'Time (seconds)',
          yAxis: 'Number of Participants'
        }
      },
      {
        id: 'accuracy-scores',
        type: 'bar',
        title: 'Accuracy Score Distribution',
        data: completedResults.map((r, i) => ({ 
          label: `P${i + 1}`, 
          value: r.accuracyScore * 100 
        })),
        options: {
          xAxis: 'Participants',
          yAxis: 'Accuracy (%)'
        }
      }
    ],
    tables: [
      {
        id: 'participant-summary',
        title: 'Participant Performance Summary',
        columns: [
          { key: 'participant', title: 'Participant', type: 'text' },
          { key: 'time', title: 'Time (s)', type: 'number' },
          { key: 'accuracy', title: 'Accuracy (%)', type: 'number' },
          { key: 'completed', title: 'Completed', type: 'boolean' }
        ],
        data: results.map((r, i) => ({
          participant: r.participantId || `P${i + 1}`,
          time: Math.round(r.totalTime / 1000),
          accuracy: Math.round(r.accuracyScore * 100),
          completed: r.completed
        }))
      }
    ],
    insights: [
      {
        type: averageAccuracy > 0.8 ? 'success' : 'warning',
        title: 'Performance Analysis',
        description: `Average accuracy is ${Math.round(averageAccuracy * 100)}%`,
        confidence: 0.9,
        recommendations: averageAccuracy < 0.7 ? 
          ['Consider simplifying the task', 'Review instructions for clarity'] : 
          ['Performance is good', 'Consider adding more challenging items']
      },
      {
        type: 'info',
        title: 'Completion Rate',
        description: `${completedResults.length} of ${results.length} participants completed the study`,
        confidence: 1.0
      }
    ]
  };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate accuracy score from responses
 */
const calculateAccuracyScore = (responses: any[]): number => {
  // Implement your method-specific accuracy calculation
  const correctResponses = responses.filter(r => r.response === 'correct').length;
  return responses.length > 0 ? correctResponses / responses.length : 0;
};

/**
 * Calculate consistency score from responses
 */
const calculateConsistency = (responses: any[]): number => {
  // Implement your method-specific consistency calculation
  // This is a placeholder that returns a random score between 0.7 and 1.0
  return 0.7 + (Math.random() * 0.3);
};

// =============================================================================
// PLUGIN DEFINITION
// =============================================================================

/**
 * Create and export your research method plugin
 */
export function createYourMethodPlugin(): ResearchMethodPlugin {
  return {
    id: 'your-method-core',
    name: 'Your Research Method',
    version: '1.0.0',
    description: 'A template for creating new research methods',
    author: 'Your Team',
    methodType: 'your-new-method',
    supportedFeatures: [
      'configuration',
      'participant-interface',
      'results-processing',
      'analytics',
      'export'
    ],
    dependencies: [], // List any plugin dependencies
    
    // React components
    studyConfigComponent: YourMethodConfigComponent,
    participantComponent: YourMethodParticipantComponent,
    resultsComponent: YourMethodResultsComponent,
    analyticsComponent: YourMethodAnalyticsComponent,
    
    // Core functions
    validateStudyConfig: validateYourMethodConfig,
    processResults: processYourMethodResults,
    generateAnalytics: generateYourMethodAnalytics,
    
    // Export formats
    exportFormats: [
      {
        id: 'json',
        name: 'JSON',
        extension: 'json',
        mimeType: 'application/json',
        description: 'Raw data in JSON format'
      },
      {
        id: 'csv',
        name: 'CSV',
        extension: 'csv',
        mimeType: 'text/csv',
        description: 'Tabular data in CSV format'
      }
    ],
    
    // Optional custom exporter
    customExporter: async (data: any, format: string): Promise<ExportResult> => {
      try {
        let exportData: string;
        let mimeType: string;
        
        switch (format) {
          case 'json':
            exportData = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            break;
          case 'csv':
            exportData = convertToCSV(data);
            mimeType = 'text/csv';
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
        
        const blob = new Blob([exportData], { type: mimeType });
        const filename = `your-method-export-${Date.now()}.${format}`;
        
        return {
          success: true,
          filename,
          size: blob.size,
          downloadUrl: URL.createObjectURL(blob)
        };
      } catch (error) {
        return {
          success: false,
          filename: '',
          size: 0,
          error: (error as Error).message
        };
      }
    },
    
    // Optional initialization function
    initialize: async (): Promise<void> => {
      console.log('Your method plugin initialized');
      // Perform any necessary setup
    },
    
    // Optional cleanup function
    cleanup: async (): Promise<void> => {
      console.log('Your method plugin cleaned up');
      // Perform any necessary cleanup
    }
  };
}

/**
 * Simple CSV converter utility
 */
const convertToCSV = (data: any[]): string => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};

// Export the plugin creation function
export default createYourMethodPlugin;