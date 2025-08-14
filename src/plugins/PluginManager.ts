// =============================================================================
// VISION UX RESEARCH SUITE - PLUGIN ARCHITECTURE
// =============================================================================

import React from 'react';
import { 
  ResearchMethodPlugin, 
  ResearchMethodType,
  ValidationResult,
  ProcessedResults,
  AnalyticsData,
  ExportFormat,
  ExportResult 
} from '../types';
import { configManager } from '../config';

/**
 * Plugin Manager class for handling research method plugins
 */
export class PluginManager {
  private plugins: Map<ResearchMethodType, ResearchMethodPlugin> = new Map();
  private pluginHooks: Map<string, Function[]> = new Map();
  private loadedPlugins: Set<string> = new Set();

  constructor() {
    this.initializeCorePlugins();
  }

  /**
   * Register a plugin for a specific research method
   */
  async registerPlugin(plugin: ResearchMethodPlugin): Promise<void> {
    // Validate plugin structure
    if (!this.isValidPlugin(plugin)) {
      throw new Error(`Invalid plugin structure for ${plugin.id}`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      const missingDeps = plugin.dependencies.filter(dep => !this.loadedPlugins.has(dep));
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
    }

    try {
      // Initialize plugin if it has an initialization function
      if (plugin.initialize) {
        await plugin.initialize();
      }

      // Register the plugin
      this.plugins.set(plugin.methodType, plugin);
      this.loadedPlugins.add(plugin.id);

      console.log(`Plugin '${plugin.name}' (${plugin.id}) registered successfully`);
    } catch (error) {
      throw new Error(`Failed to register plugin ${plugin.id}: ${(error as Error).message}`);
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(methodType: ResearchMethodType): Promise<void> {
    const plugin = this.plugins.get(methodType);
    if (!plugin) {
      throw new Error(`No plugin found for method type: ${methodType}`);
    }

    try {
      // Run cleanup if available
      if (plugin.cleanup) {
        await plugin.cleanup();
      }

      this.plugins.delete(methodType);
      this.loadedPlugins.delete(plugin.id);

      console.log(`Plugin '${plugin.name}' unregistered successfully`);
    } catch (error) {
      console.error(`Error unregistering plugin ${plugin.id}:`, error);
      throw error;
    }
  }

  /**
   * Get plugin for a specific research method
   */
  getPlugin(methodType: ResearchMethodType): ResearchMethodPlugin | null {
    return this.plugins.get(methodType) || null;
  }

  /**
   * Check if a plugin is available for a research method
   */
  hasPlugin(methodType: ResearchMethodType): boolean {
    return this.plugins.has(methodType);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): ResearchMethodPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get supported research method types
   */
  getSupportedMethods(): ResearchMethodType[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get study configuration component for a method
   */
  getStudyConfigComponent(methodType: ResearchMethodType): React.ComponentType<any> | null {
    const plugin = this.getPlugin(methodType);
    return plugin?.studyConfigComponent || null;
  }

  /**
   * Get participant component for a method
   */
  getParticipantComponent(methodType: ResearchMethodType): React.ComponentType<any> | null {
    const plugin = this.getPlugin(methodType);
    return plugin?.participantComponent || null;
  }

  /**
   * Get results component for a method
   */
  getResultsComponent(methodType: ResearchMethodType): React.ComponentType<any> | null {
    const plugin = this.getPlugin(methodType);
    return plugin?.resultsComponent || null;
  }

  /**
   * Get analytics component for a method
   */
  getAnalyticsComponent(methodType: ResearchMethodType): React.ComponentType<any> | null {
    const plugin = this.getPlugin(methodType);
    return plugin?.analyticsComponent || null;
  }

  /**
   * Validate study configuration using plugin validator
   */
  async validateStudyConfig(methodType: ResearchMethodType, config: any): Promise<ValidationResult> {
    const plugin = this.getPlugin(methodType);
    
    if (!plugin) {
      return {
        isValid: false,
        errors: [{ field: 'methodType', message: `No plugin available for ${methodType}`, code: 'NO_PLUGIN' }],
        warnings: []
      };
    }

    if (plugin.validateStudyConfig) {
      return await plugin.validateStudyConfig(config);
    }

    // Default validation (basic structure check)
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Process study results using plugin processor
   */
  async processResults(methodType: ResearchMethodType, results: any): Promise<ProcessedResults> {
    const plugin = this.getPlugin(methodType);
    
    if (!plugin) {
      throw new Error(`No plugin available for ${methodType}`);
    }

    if (plugin.processResults) {
      return await plugin.processResults(results);
    }

    // Default processing (pass through)
    return {
      rawData: results,
      processedData: results,
      qualityMetrics: {
        completeness: 1,
        consistency: 1,
        validity: 1,
        reliability: 1,
        flags: [],
        overallScore: 1,
        recommendations: []
      },
      insights: []
    };
  }

  /**
   * Generate analytics for a method
   */
  async generateAnalytics(methodType: ResearchMethodType, results: any[]): Promise<AnalyticsData> {
    const plugin = this.getPlugin(methodType);
    
    if (!plugin) {
      throw new Error(`No plugin available for ${methodType}`);
    }

    if (plugin.generateAnalytics) {
      return await plugin.generateAnalytics(results);
    }

    // Default analytics (basic summary)
    return {
      summary: {
        totalParticipants: results.length,
        methodType,
        lastUpdated: new Date().toISOString()
      },
      charts: [],
      tables: [],
      insights: [{
        type: 'info',
        title: 'Basic Analytics',
        description: 'Advanced analytics not available for this method',
        confidence: 0
      }]
    };
  }

  /**
   * Get available export formats for a method
   */
  getExportFormats(methodType: ResearchMethodType): ExportFormat[] {
    const plugin = this.getPlugin(methodType);
    
    if (!plugin || !plugin.exportFormats) {
      // Default export formats
      return [
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
          description: 'Comma-separated values'
        }
      ];
    }

    return plugin.exportFormats;
  }

  /**
   * Export data using plugin-specific exporter
   */
  async exportData(
    methodType: ResearchMethodType, 
    data: any, 
    format: string
  ): Promise<ExportResult> {
    const plugin = this.getPlugin(methodType);
    
    if (plugin?.customExporter) {
      return await plugin.customExporter(data, format);
    }

    // Default export implementation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${methodType}_export_${timestamp}.${format}`;

    try {
      let exportedData: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          exportedData = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          break;
        case 'csv':
          exportedData = this.convertToCSV(data);
          mimeType = 'text/csv';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Create blob and download URL
      const blob = new Blob([exportedData], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      return {
        success: true,
        filename,
        size: blob.size,
        downloadUrl
      };
    } catch (error) {
      return {
        success: false,
        filename,
        size: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Register a hook for plugin events
   */
  registerHook(eventName: string, callback: Function): void {
    if (!this.pluginHooks.has(eventName)) {
      this.pluginHooks.set(eventName, []);
    }
    this.pluginHooks.get(eventName)!.push(callback);
  }

  /**
   * Execute hooks for an event
   */
  executeHooks(eventName: string, ...args: any[]): void {
    const hooks = this.pluginHooks.get(eventName);
    if (hooks) {
      hooks.forEach(hook => {
        try {
          hook(...args);
        } catch (error) {
          console.error(`Hook execution failed for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Initialize core plugins (card sorting, tree testing, etc.)
   */
  private async initializeCorePlugins(): Promise<void> {
    // Card Sorting Plugin
    await this.registerPlugin(createCardSortingPlugin());
    
    // Tree Testing Plugin  
    await this.registerPlugin(createTreeTestingPlugin());

    // Survey Plugin
    if (configManager.isFeatureEnabled('multiMethodStudies')) {
      await this.registerPlugin(createSurveyPlugin());
    }

    // Additional plugins can be loaded based on feature flags
    if (configManager.isFeatureEnabled('advancedAnalytics')) {
      // await this.registerPlugin(createAccessibilityPlugin());
    }
  }

  /**
   * Validate plugin structure
   */
  private isValidPlugin(plugin: ResearchMethodPlugin): boolean {
    return !!(
      plugin.id &&
      plugin.name &&
      plugin.version &&
      plugin.methodType &&
      plugin.supportedFeatures &&
      Array.isArray(plugin.supportedFeatures)
    );
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

// =============================================================================
// CORE PLUGIN IMPLEMENTATIONS
// =============================================================================

/**
 * Create Card Sorting Plugin
 */
function createCardSortingPlugin(): ResearchMethodPlugin {
  return {
    id: 'card-sorting-core',
    name: 'Card Sorting',
    version: '1.0.0',
    description: 'Core card sorting research method',
    author: 'Vision UX Team',
    methodType: 'card-sorting',
    supportedFeatures: ['drag-drop', 'categories', 'validation', 'analytics'],
    
    validateStudyConfig: (config: any): ValidationResult => {
      const errors: any[] = [];
      const warnings: any[] = [];

      if (!config.cards || config.cards.length === 0) {
        errors.push({ 
          field: 'cards', 
          message: 'Card sorting requires at least one card', 
          code: 'MISSING_CARDS' 
        });
      }

      if (!config.categories || config.categories.length === 0) {
        warnings.push({
          field: 'categories',
          message: 'Pre-defined categories not set - using open card sort',
          suggestion: 'Add categories for closed card sorting'
        });
      }

      return { isValid: errors.length === 0, errors, warnings };
    },

    processResults: (results: any): ProcessedResults => {
      // Basic card sorting result processing
      return {
        rawData: results,
        processedData: {
          ...results,
          processed: true,
          timestamp: Date.now()
        },
        qualityMetrics: {
          completeness: 1,
          consistency: 1,
          validity: 1,
          reliability: 1,
          flags: [],
          overallScore: 1,
          recommendations: []
        },
        insights: ['Card sorting completed successfully']
      };
    },

    generateAnalytics: (results: any[]): AnalyticsData => {
      return {
        summary: {
          totalParticipants: results.length,
          method: 'card-sorting',
          completionRate: 1
        },
        charts: [
          {
            id: 'similarity-matrix',
            type: 'heatmap',
            title: 'Card Similarity Matrix',
            data: [], // Would contain processed similarity data
            options: {}
          }
        ],
        tables: [
          {
            id: 'results-summary',
            title: 'Results Summary',
            columns: [
              { key: 'participant', title: 'Participant', type: 'text' },
              { key: 'completionTime', title: 'Completion Time', type: 'number' },
              { key: 'cardsSorted', title: 'Cards Sorted', type: 'number' }
            ],
            data: results.map(r => ({
              participant: r.participantId,
              completionTime: r.duration,
              cardsSorted: r.results?.length || 0
            }))
          }
        ],
        insights: [
          {
            type: 'info',
            title: 'Card Sorting Analysis',
            description: `Analysis complete for ${results.length} participants`,
            confidence: 0.9
          }
        ]
      };
    },

    exportFormats: [
      {
        id: 'json',
        name: 'JSON',
        extension: 'json',
        mimeType: 'application/json',
        description: 'Raw card sorting data'
      },
      {
        id: 'csv',
        name: 'CSV',
        extension: 'csv',
        mimeType: 'text/csv',
        description: 'Card sorting results in tabular format'
      },
      {
        id: 'similarity-csv',
        name: 'Similarity Matrix CSV',
        extension: 'csv',
        mimeType: 'text/csv',
        description: 'Card similarity matrix data'
      }
    ]
  };
}

/**
 * Create Tree Testing Plugin
 */
function createTreeTestingPlugin(): ResearchMethodPlugin {
  return {
    id: 'tree-testing-core',
    name: 'Tree Testing',
    version: '1.0.0',
    description: 'Core tree testing research method',
    author: 'Vision UX Team',
    methodType: 'tree-testing',
    supportedFeatures: ['navigation', 'path-tracking', 'success-metrics'],

    validateStudyConfig: (config: any): ValidationResult => {
      const errors: any[] = [];
      const warnings: any[] = [];

      if (!config.treeStructure || config.treeStructure.length === 0) {
        errors.push({
          field: 'treeStructure',
          message: 'Tree testing requires a tree structure',
          code: 'MISSING_TREE'
        });
      }

      if (!config.task) {
        warnings.push({
          field: 'task',
          message: 'No task defined',
          suggestion: 'Define what participants should find'
        });
      }

      return { isValid: errors.length === 0, errors, warnings };
    },

    processResults: (results: any): ProcessedResults => {
      return {
        rawData: results,
        processedData: {
          ...results,
          pathLength: results.path?.length || 0,
          success: results.success || false,
          processed: true
        },
        qualityMetrics: {
          completeness: 1,
          consistency: 1,
          validity: 1,
          reliability: 1,
          flags: [],
          overallScore: 1,
          recommendations: []
        },
        insights: [`Tree test ${results.success ? 'successful' : 'unsuccessful'}`]
      };
    },

    generateAnalytics: (results: any[]): AnalyticsData => {
      const successRate = results.filter(r => r.success).length / results.length;
      
      return {
        summary: {
          totalParticipants: results.length,
          method: 'tree-testing',
          successRate,
          averagePathLength: results.reduce((sum, r) => sum + (r.path?.length || 0), 0) / results.length
        },
        charts: [
          {
            id: 'success-rate',
            type: 'pie',
            title: 'Task Success Rate',
            data: {
              successful: results.filter(r => r.success).length,
              unsuccessful: results.filter(r => !r.success).length
            },
            options: {}
          }
        ],
        tables: [
          {
            id: 'path-analysis',
            title: 'Path Analysis',
            columns: [
              { key: 'participant', title: 'Participant', type: 'text' },
              { key: 'pathLength', title: 'Path Length', type: 'number' },
              { key: 'success', title: 'Success', type: 'boolean' },
              { key: 'duration', title: 'Duration (ms)', type: 'number' }
            ],
            data: results.map(r => ({
              participant: r.participantId,
              pathLength: r.path?.length || 0,
              success: r.success || false,
              duration: r.duration || 0
            }))
          }
        ],
        insights: [
          {
            type: successRate > 0.8 ? 'success' : 'warning',
            title: 'Navigation Performance',
            description: `${Math.round(successRate * 100)}% task success rate`,
            confidence: 0.9,
            recommendations: successRate < 0.8 ? ['Consider simplifying navigation structure'] : []
          }
        ]
      };
    },

    exportFormats: [
      {
        id: 'json',
        name: 'JSON',
        extension: 'json',
        mimeType: 'application/json',
        description: 'Raw tree testing data'
      },
      {
        id: 'csv',
        name: 'CSV',
        extension: 'csv',
        mimeType: 'text/csv',
        description: 'Tree testing results in tabular format'
      },
      {
        id: 'path-csv',
        name: 'Path Analysis CSV',
        extension: 'csv',
        mimeType: 'text/csv',
        description: 'Detailed path analysis data'
      }
    ]
  };
}

/**
 * Create Survey Plugin (basic implementation)
 */
function createSurveyPlugin(): ResearchMethodPlugin {
  return {
    id: 'survey-core',
    name: 'Survey',
    version: '1.0.0',
    description: 'Core survey research method',
    author: 'Vision UX Team',
    methodType: 'survey',
    supportedFeatures: ['multiple-choice', 'rating-scales', 'text-input', 'validation'],

    validateStudyConfig: (config: any): ValidationResult => {
      const errors: any[] = [];
      const warnings: any[] = [];

      if (!config.questions || config.questions.length === 0) {
        errors.push({
          field: 'questions',
          message: 'Survey requires at least one question',
          code: 'MISSING_QUESTIONS'
        });
      }

      return { isValid: errors.length === 0, errors, warnings };
    },

    generateAnalytics: (results: any[]): AnalyticsData => {
      return {
        summary: {
          totalResponses: results.length,
          method: 'survey',
          completionRate: 1
        },
        charts: [],
        tables: [
          {
            id: 'survey-responses',
            title: 'Survey Responses',
            columns: [
              { key: 'participant', title: 'Participant', type: 'text' },
              { key: 'responses', title: 'Responses', type: 'text' }
            ],
            data: results.map(r => ({
              participant: r.participantId,
              responses: JSON.stringify(r.responses)
            }))
          }
        ],
        insights: [
          {
            type: 'info',
            title: 'Survey Complete',
            description: `Collected ${results.length} survey responses`,
            confidence: 1
          }
        ]
      };
    }
  };
}

// Export singleton instance
export const pluginManager = new PluginManager();

export default pluginManager;