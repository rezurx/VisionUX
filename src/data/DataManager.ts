// =============================================================================
// VISION UX RESEARCH SUITE - DATA LAYER ARCHITECTURE
// =============================================================================

import { 
  Study, 
  StudyResult, 
  ParticipantData,
  DataQualityMetrics,
  DataStore,
  MigrationPlan,
  MigrationStep,
  APIResponse,
  ValidationResult,
  ResearchMethodType,
  RESEARCH_METHOD_METADATA,
  MethodSpecificConfig,
  CrossMethodAnalysis,
  MethodCategory,
  MethodComplexity
} from '../types';
import { configManager } from '../config';

/**
 * Data validation utilities
 */
export class DataValidator {
  /**
   * Validate study data structure and completeness
   */
  static validateStudy(study: Study): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Required fields validation
    if (!study.id) errors.push({ field: 'id', message: 'Study ID is required', code: 'REQUIRED_FIELD' });
    if (!study.name?.trim()) errors.push({ field: 'name', message: 'Study name is required', code: 'REQUIRED_FIELD' });
    if (!study.type) errors.push({ field: 'type', message: 'Study type is required', code: 'REQUIRED_FIELD' });

    // Enhanced method-specific validation
    const methodValidation = this.validateMethodSpecificData(study);
    errors.push(...methodValidation.errors);
    warnings.push(...methodValidation.warnings);

    // Method metadata validation
    if (!study.methodMeta) {
      errors.push({ field: 'methodMeta', message: 'Method metadata is required', code: 'REQUIRED_FIELD' });
    } else {
      if (study.methodMeta.type !== study.type) {
        errors.push({ field: 'methodMeta.type', message: 'Method metadata type must match study type', code: 'INVALID_VALUE' });
      }
    }

    // Method configuration validation
    if (!study.methodConfig) {
      errors.push({ field: 'methodConfig', message: 'Method-specific configuration is required', code: 'REQUIRED_FIELD' });
    } else {
      if (study.methodConfig.methodType !== study.type) {
        errors.push({ field: 'methodConfig.methodType', message: 'Method config type must match study type', code: 'INVALID_VALUE' });
      }
    }

    // Configuration validation
    if (study.configuration) {
      if (study.configuration.maxParticipants && study.configuration.maxParticipants < 1) {
        errors.push({ field: 'configuration.maxParticipants', message: 'Maximum participants must be at least 1', code: 'INVALID_VALUE' });
      }
      if (study.configuration.estimatedDuration && study.configuration.estimatedDuration < 1) {
        errors.push({ field: 'configuration.estimatedDuration', message: 'Estimated duration must be at least 1 minute', code: 'INVALID_VALUE' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate study results for quality and completeness
   */
  static validateStudyResult(result: StudyResult): DataQualityMetrics {
    const flags: any[] = [];
    let completeness = 1.0;
    let consistency = 1.0;
    let validity = 1.0;
    let reliability = 1.0;

    // Completeness checks
    if (!result.participantId) {
      flags.push({ type: 'error', code: 'MISSING_PARTICIPANT_ID', message: 'Participant ID is missing', severity: 'high' });
      completeness -= 0.3;
    }
    
    if (!result.results || Object.keys(result.results).length === 0) {
      flags.push({ type: 'error', code: 'EMPTY_RESULTS', message: 'Study results are empty', severity: 'high' });
      completeness -= 0.5;
    }

    if (!result.endTime || result.endTime <= result.startTime) {
      flags.push({ type: 'warning', code: 'INVALID_TIMING', message: 'Invalid timing data', severity: 'medium' });
      consistency -= 0.2;
    }

    // Duration validation
    const duration = result.endTime - result.startTime;
    if (duration < 10000) { // Less than 10 seconds
      flags.push({ type: 'warning', code: 'SUSPICIOUSLY_FAST', message: 'Completion time is suspiciously fast', severity: 'medium' });
      validity -= 0.3;
    } else if (duration > 3600000) { // More than 1 hour
      flags.push({ type: 'info', code: 'LONG_COMPLETION_TIME', message: 'Completion time is unusually long', severity: 'low' });
      reliability -= 0.1;
    }

    // Calculate overall quality score
    const overallScore = Math.max(0, (completeness + consistency + validity + reliability) / 4);

    // Generate recommendations
    const recommendations: string[] = [];
    if (completeness < 0.8) recommendations.push('Ensure all required fields are captured');
    if (consistency < 0.8) recommendations.push('Review data collection timing and validation');
    if (validity < 0.8) recommendations.push('Consider implementing attention checks');
    if (reliability < 0.8) recommendations.push('Review study design for potential improvements');

    return {
      completeness,
      consistency,
      validity,
      reliability,
      flags,
      overallScore,
      recommendations
    };
  }

  /**
   * Validate participant data
   */
  static validateParticipantData(participant: ParticipantData): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!participant.id) {
      errors.push({ field: 'id', message: 'Participant ID is required', code: 'REQUIRED_FIELD' });
    }

    if (participant.email && !this.isValidEmail(participant.email)) {
      errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
    }

    if (participant.demographics?.age && (participant.demographics.age < 13 || participant.demographics.age > 120)) {
      warnings.push({ field: 'demographics.age', message: 'Age seems unusual', suggestion: 'Verify age is correct' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Enhanced method-specific validation
   */
  private static validateMethodSpecificData(study: Study): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    switch (study.type) {
      case 'card-sorting':
        if (!study.cards || study.cards.length === 0) {
          warnings.push({ field: 'cards', message: 'Card sorting study should have cards defined', suggestion: 'Add cards to the study configuration' });
        } else {
          if (study.cards.length < 5) {
            warnings.push({ field: 'cards', message: 'Consider adding more cards for meaningful insights', suggestion: 'Minimum 10-15 cards recommended' });
          }
          if (study.cards.length > 100) {
            warnings.push({ field: 'cards', message: 'Too many cards may overwhelm participants', suggestion: 'Consider reducing to 50-80 cards' });
          }
        }

        const config = study.methodConfig as any;
        if (config?.sortType === 'closed' && (!study.categories || study.categories.length === 0)) {
          errors.push({ field: 'categories', message: 'Closed card sorting requires predefined categories', code: 'REQUIRED_FIELD' });
        }
        break;

      case 'tree-testing':
        if (!study.treeStructure || study.treeStructure.length === 0) {
          errors.push({ field: 'treeStructure', message: 'Tree testing study must have a tree structure', code: 'REQUIRED_FIELD' });
        } else {
          const maxDepth = this.calculateTreeDepth(study.treeStructure);
          if (maxDepth > 7) {
            warnings.push({ field: 'treeStructure', message: 'Tree structure may be too deep', suggestion: 'Consider limiting to 5-7 levels maximum' });
          }
        }
        if (!study.task?.trim()) {
          warnings.push({ field: 'task', message: 'Tree testing study should have a task defined', suggestion: 'Define what participants should find' });
        }
        break;

      case 'survey':
        if (!study.surveyQuestions || study.surveyQuestions.length === 0) {
          errors.push({ field: 'surveyQuestions', message: 'Survey must have at least one question', code: 'REQUIRED_FIELD' });
        } else {
          const requiredCount = study.surveyQuestions.filter(q => q.required).length;
          if (requiredCount === 0) {
            warnings.push({ field: 'surveyQuestions', message: 'Consider making at least one question required', suggestion: 'Required questions improve data quality' });
          }
          if (study.surveyQuestions.length > 50) {
            warnings.push({ field: 'surveyQuestions', message: 'Long surveys may have lower completion rates', suggestion: 'Consider reducing to 20-30 questions' });
          }
        }
        break;

      case 'accessibility-audit':
        if (!study.accessibilityGuidelines || study.accessibilityGuidelines.length === 0) {
          warnings.push({ field: 'accessibilityGuidelines', message: 'Accessibility audit should specify guidelines to test against', suggestion: 'Add WCAG or other accessibility standards' });
        }
        break;

      case 'design-system-review':
        if (!study.designSystemComponents || study.designSystemComponents.length === 0) {
          warnings.push({ field: 'designSystemComponents', message: 'Design system review should specify components to evaluate', suggestion: 'Add components from your design system' });
        }
        break;

      case 'usability-testing':
      case 'moderated-testing':
      case 'unmoderated-testing':
        // Common validation for usability testing methods
        if (!study.configuration.estimatedDuration || study.configuration.estimatedDuration < 15) {
          warnings.push({ field: 'configuration.estimatedDuration', message: 'Usability tests typically need 15+ minutes', suggestion: 'Consider allowing more time for meaningful insights' });
        }
        break;

      case 'a-b-testing':
        // A/B testing should have multiple variants defined in methodConfig
        const abConfig = study.methodConfig as any;
        if (!abConfig?.variants || abConfig.variants.length < 2) {
          errors.push({ field: 'methodConfig.variants', message: 'A/B testing requires at least 2 variants', code: 'REQUIRED_FIELD' });
        }
        break;

      case 'diary-study':
        // Diary studies need longer duration
        if (study.configuration.estimatedDuration && study.configuration.estimatedDuration < 10080) { // 1 week
          warnings.push({ field: 'configuration.estimatedDuration', message: 'Diary studies typically run for weeks or months', suggestion: 'Consider extending duration for longitudinal insights' });
        }
        break;

      case 'heuristic-evaluation':
      case 'cognitive-walkthrough':
        // Expert evaluation methods need fewer participants but higher expertise
        if (study.configuration.maxParticipants > 10) {
          warnings.push({ field: 'configuration.maxParticipants', message: 'Expert evaluation methods typically use 3-8 evaluators', suggestion: 'Reduce participant count and focus on expertise' });
        }
        break;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Calculate maximum depth of tree structure
   */
  private static calculateTreeDepth(tree: any[], depth = 0): number {
    let maxDepth = depth;
    for (const node of tree) {
      if (node.children && node.children.length > 0) {
        maxDepth = Math.max(maxDepth, this.calculateTreeDepth(node.children, depth + 1));
      }
    }
    return maxDepth;
  }

  /**
   * Cross-method compatibility validation
   */
  static validateCrossMethodCompatibility(studies: Study[]): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (studies.length < 2) {
      return { isValid: true, errors, warnings };
    }

    // Check if methods are compatible for cross-analysis
    const methodTypes = studies.map(s => s.type);
    const categories = studies.map(s => s.methodMeta.category);
    
    // Check for complementary method combinations
    const hasIA = categories.includes('information-architecture');
    const hasUsability = categories.includes('usability-testing');
    const hasResearch = categories.includes('user-research');

    if (hasIA && hasUsability) {
      warnings.push({ 
        field: 'methodCombination', 
        message: 'Great combination: IA and usability methods complement each other well', 
        suggestion: 'Consider running IA studies first to inform usability testing scenarios' 
      });
    }

    // Check participant overlap concerns
    const totalParticipants = studies.reduce((sum, study) => sum + study.participants, 0);
    const uniqueComplexities = [...new Set(studies.map(s => s.methodMeta.complexity))];
    
    if (uniqueComplexities.length > 2) {
      warnings.push({
        field: 'complexity',
        message: 'Studies have varying complexity levels',
        suggestion: 'Consider participant screening to ensure appropriate expertise levels'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Generate cross-method correlation insights
   */
  static generateCrossMethodInsights(studies: Study[]): CrossMethodAnalysis {
    const studyIds = studies.map(s => s.id);
    const correlations: any[] = [];
    const patterns: any[] = [];
    
    // Analyze method combinations
    const methodCombination = studies.map(s => s.type).sort().join(' + ');
    const categories = [...new Set(studies.map(s => s.methodMeta.category))];
    
    // Generate insights based on method combinations
    const insights = {
      convergentFindings: [] as string[],
      divergentFindings: [] as string[],
      recommendations: [] as string[]
    };

    if (categories.includes('information-architecture') && categories.includes('usability-testing')) {
      insights.convergentFindings.push('Information architecture and usability findings can validate navigation design decisions');
      insights.recommendations.push('Compare card sorting categories with navigation success rates from usability testing');
    }

    if (categories.includes('user-research') && categories.length > 1) {
      insights.recommendations.push('Use qualitative research insights to interpret quantitative usability metrics');
    }

    // Calculate confidence based on method diversity and complementarity
    let confidence = 0.3; // Base confidence
    if (categories.length > 1) confidence += 0.3; // Multiple categories
    if (studies.length >= 3) confidence += 0.2; // Multiple studies
    if (studies.some(s => s.participants >= 15)) confidence += 0.2; // Good sample size

    return {
      studyIds,
      correlations,
      patterns,
      insights,
      confidence: Math.min(1.0, confidence)
    };
  }

  /**
   * Email validation utility
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Data persistence manager with multiple storage backends
 */
export class DataPersistenceManager {
  private storageBackend: StorageBackend;
  private compressionEnabled: boolean;

  constructor() {
    const config = configManager.getConfig();
    this.compressionEnabled = config.syncConfig.compressionEnabled;
    
    // Initialize storage backend based on configuration
    switch (config.dataStore.type) {
      case 'localStorage':
        this.storageBackend = new LocalStorageBackend();
        break;
      case 'indexedDB':
        this.storageBackend = new IndexedDBBackend();
        break;
      case 'remote':
        this.storageBackend = new RemoteStorageBackend(config.apiEndpoint || '');
        break;
      case 'hybrid':
        this.storageBackend = new HybridStorageBackend();
        break;
      default:
        this.storageBackend = new LocalStorageBackend();
    }
  }

  /**
   * Save study data with validation
   */
  async saveStudy(study: Study): Promise<APIResponse<Study>> {
    try {
      // Validate before saving
      const validation = DataValidator.validateStudy(study);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Study validation failed',
            details: validation.errors
          }
        };
      }

      // Add timestamps
      const studyToSave = {
        ...study,
        updated: new Date().toISOString()
      };

      // Compress if enabled
      const dataToSave = this.compressionEnabled ? 
        this.compressData(studyToSave) : 
        studyToSave;

      await this.storageBackend.save(`study_${study.id}`, dataToSave);

      return {
        success: true,
        data: studyToSave,
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: configManager.get('version')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAVE_ERROR',
          message: error.message || 'Failed to save study',
          details: error
        }
      };
    }
  }

  /**
   * Load study data with validation
   */
  async loadStudy(studyId: number): Promise<APIResponse<Study>> {
    try {
      const rawData = await this.storageBackend.load(`study_${studyId}`);
      if (!rawData) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Study ${studyId} not found`
          }
        };
      }

      // Decompress if needed
      const data = this.compressionEnabled ? 
        this.decompressData(rawData) : 
        rawData;

      // Validate loaded data
      const validation = DataValidator.validateStudy(data);
      if (!validation.isValid) {
        console.warn('Loaded study has validation issues:', validation.errors);
      }

      return {
        success: true,
        data,
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: configManager.get('version')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOAD_ERROR',
          message: error.message || 'Failed to load study',
          details: error
        }
      };
    }
  }

  /**
   * Save study results with quality validation
   */
  async saveStudyResult(result: StudyResult): Promise<APIResponse<StudyResult>> {
    try {
      // Validate and calculate quality metrics
      const qualityMetrics = DataValidator.validateStudyResult(result);
      
      const resultToSave = {
        ...result,
        qualityMetrics,
        timestamp: Date.now()
      };

      const dataToSave = this.compressionEnabled ? 
        this.compressData(resultToSave) : 
        resultToSave;

      await this.storageBackend.save(`result_${result.participantId}`, dataToSave);

      // Update participant data if available
      if (result.participantData) {
        await this.saveParticipantData(result.participantData);
      }

      return {
        success: true,
        data: resultToSave,
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: configManager.get('version')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAVE_ERROR',
          message: error.message || 'Failed to save study result',
          details: error
        }
      };
    }
  }

  /**
   * Save participant data with validation
   */
  async saveParticipantData(participant: ParticipantData): Promise<APIResponse<ParticipantData>> {
    try {
      const validation = DataValidator.validateParticipantData(participant);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Participant validation failed',
            details: validation.errors
          }
        };
      }

      const dataToSave = this.compressionEnabled ? 
        this.compressData(participant) : 
        participant;

      await this.storageBackend.save(`participant_${participant.id}`, dataToSave);

      return {
        success: true,
        data: participant,
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: configManager.get('version')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAVE_ERROR',
          message: error.message || 'Failed to save participant data',
          details: error
        }
      };
    }
  }

  /**
   * List all studies with metadata
   */
  async listStudies(): Promise<APIResponse<Study[]>> {
    try {
      const keys = await this.storageBackend.listKeys();
      const studyKeys = keys.filter(key => key.startsWith('study_'));
      
      const studies: Study[] = [];
      for (const key of studyKeys) {
        const rawData = await this.storageBackend.load(key);
        if (rawData) {
          const data = this.compressionEnabled ? 
            this.decompressData(rawData) : 
            rawData;
          studies.push(data);
        }
      }

      // Sort by creation date (newest first)
      studies.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      return {
        success: true,
        data: studies,
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: configManager.get('version')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: error.message || 'Failed to list studies',
          details: error
        }
      };
    }
  }

  /**
   * Delete study and associated data
   */
  async deleteStudy(studyId: number): Promise<APIResponse<boolean>> {
    try {
      await this.storageBackend.delete(`study_${studyId}`);
      
      // Also delete associated results
      const keys = await this.storageBackend.listKeys();
      const resultKeys = keys.filter(key => key.startsWith('result_'));
      
      for (const key of resultKeys) {
        const result = await this.storageBackend.load(key);
        if (result && result.studyId === studyId) {
          await this.storageBackend.delete(key);
        }
      }

      return {
        success: true,
        data: true,
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: configManager.get('version')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to delete study',
          details: error
        }
      };
    }
  }

  /**
   * Get storage statistics and health metrics
   */
  async getStorageStats(): Promise<any> {
    try {
      const keys = await this.storageBackend.listKeys();
      const stats = {
        totalItems: keys.length,
        studies: keys.filter(k => k.startsWith('study_')).length,
        results: keys.filter(k => k.startsWith('result_')).length,
        participants: keys.filter(k => k.startsWith('participant_')).length,
        storageSize: 0, // Will be calculated by backend
        lastCleanup: localStorage.getItem('last_cleanup') || 'Never',
        health: 'Good' as 'Good' | 'Warning' | 'Critical'
      };

      // Calculate estimated storage size
      let totalSize = 0;
      for (const key of keys.slice(0, 10)) { // Sample first 10 items
        const data = await this.storageBackend.load(key);
        if (data) {
          totalSize += JSON.stringify(data).length;
        }
      }
      stats.storageSize = Math.round((totalSize * keys.length) / (1024 * 1024)); // MB

      // Determine health status
      if (stats.storageSize > 40) { // > 40MB
        stats.health = 'Warning';
      }
      if (stats.storageSize > 80) { // > 80MB
        stats.health = 'Critical';
      }

      return stats;
    } catch (error) {
      return {
        error: error.message,
        health: 'Critical'
      };
    }
  }

  /**
   * Cleanup old and invalid data
   */
  async cleanup(): Promise<{ itemsRemoved: number; spaceFreed: number }> {
    const config = configManager.getConfig();
    const retentionDays = config.dataStore.config.retentionDays || 365;
    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    let itemsRemoved = 0;
    let spaceFreed = 0;

    try {
      const keys = await this.storageBackend.listKeys();
      
      for (const key of keys) {
        const data = await this.storageBackend.load(key);
        
        if (data) {
          let shouldDelete = false;
          const dataSize = JSON.stringify(data).length;

          // Check age-based cleanup
          if (data.created && new Date(data.created).getTime() < cutoffDate) {
            shouldDelete = true;
          }

          // Check validity
          if (key.startsWith('study_')) {
            const validation = DataValidator.validateStudy(data);
            if (!validation.isValid && validation.errors.some(e => e.code === 'CRITICAL')) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            await this.storageBackend.delete(key);
            itemsRemoved++;
            spaceFreed += dataSize;
          }
        }
      }

      // Update cleanup timestamp
      localStorage.setItem('last_cleanup', new Date().toISOString());

      return { itemsRemoved, spaceFreed: Math.round(spaceFreed / 1024) }; // KB
    } catch (error) {
      console.error('Cleanup failed:', error);
      return { itemsRemoved: 0, spaceFreed: 0 };
    }
  }

  // Utility methods
  private compressData(data: any): string {
    // Simple JSON compression (in production, use a real compression library)
    return JSON.stringify(data);
  }

  private decompressData(data: string): any {
    return JSON.parse(data);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Storage backend interface
 */
interface StorageBackend {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}

/**
 * LocalStorage implementation
 */
class LocalStorageBackend implements StorageBackend {
  async save(key: string, data: any): Promise<void> {
    localStorage.setItem(`vision_ux_${key}`, JSON.stringify(data));
  }

  async load(key: string): Promise<any> {
    const item = localStorage.getItem(`vision_ux_${key}`);
    return item ? JSON.parse(item) : null;
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(`vision_ux_${key}`);
  }

  async listKeys(): Promise<string[]> {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vision_ux_')) {
        keys.push(key.substring(10)); // Remove 'vision_ux_' prefix
      }
    }
    return keys;
  }
}

/**
 * IndexedDB implementation (for future use)
 */
class IndexedDBBackend implements StorageBackend {
  async save(key: string, data: any): Promise<void> {
    // TODO: Implement IndexedDB storage
    throw new Error('IndexedDB backend not yet implemented');
  }

  async load(key: string): Promise<any> {
    // TODO: Implement IndexedDB retrieval
    throw new Error('IndexedDB backend not yet implemented');
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement IndexedDB deletion
    throw new Error('IndexedDB backend not yet implemented');
  }

  async listKeys(): Promise<string[]> {
    // TODO: Implement IndexedDB key listing
    throw new Error('IndexedDB backend not yet implemented');
  }
}

/**
 * Remote storage implementation (for future backend integration)
 */
class RemoteStorageBackend implements StorageBackend {
  constructor(private apiEndpoint: string) {}

  async save(key: string, data: any): Promise<void> {
    // TODO: Implement remote API calls
    throw new Error('Remote storage backend not yet implemented');
  }

  async load(key: string): Promise<any> {
    // TODO: Implement remote API calls
    throw new Error('Remote storage backend not yet implemented');
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement remote API calls
    throw new Error('Remote storage backend not yet implemented');
  }

  async listKeys(): Promise<string[]> {
    // TODO: Implement remote API calls
    throw new Error('Remote storage backend not yet implemented');
  }
}

/**
 * Hybrid storage (local + remote synchronization)
 */
class HybridStorageBackend implements StorageBackend {
  private localStorage = new LocalStorageBackend();

  async save(key: string, data: any): Promise<void> {
    // Save locally first
    await this.localStorage.save(key, data);
    
    // TODO: Queue for remote sync
    // await this.queueForSync(key, data);
  }

  async load(key: string): Promise<any> {
    // Load from local storage
    return await this.localStorage.load(key);
  }

  async delete(key: string): Promise<void> {
    // Delete locally
    await this.localStorage.delete(key);
    
    // TODO: Queue deletion for remote sync
  }

  async listKeys(): Promise<string[]> {
    return await this.localStorage.listKeys();
  }
}

// Export singleton instance
export const dataManager = new DataPersistenceManager();