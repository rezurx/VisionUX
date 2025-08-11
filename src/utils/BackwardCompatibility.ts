// =============================================================================
// VISION UX RESEARCH SUITE - BACKWARD COMPATIBILITY UTILITIES
// =============================================================================

import { Study, StudyResult, StudyConfiguration, StudySettings, StudyMetadata } from '../types';
import { configManager } from '../config';

/**
 * Backward compatibility utilities for seamless migration
 */
export class BackwardCompatibilityManager {
  
  /**
   * Convert legacy study format to new enhanced format
   */
  static convertLegacyStudy(legacyStudy: any): Study {
    const baseStudy: Study = {
      id: legacyStudy.id,
      name: legacyStudy.name,
      description: legacyStudy.description || '',
      type: legacyStudy.type,
      status: legacyStudy.status || 'draft',
      participants: legacyStudy.participants || 0,
      completion: legacyStudy.completion || 0,
      created: legacyStudy.created || new Date().toISOString(),
      updated: legacyStudy.updated || legacyStudy.created || new Date().toISOString(),
      
      // Migrate existing method-specific data
      cards: legacyStudy.cards || [],
      categories: legacyStudy.categories || [],
      treeStructure: legacyStudy.treeStructure || [],
      task: legacyStudy.task || '',
      surveyQuestions: legacyStudy.surveyQuestions || [],
      accessibilityGuidelines: legacyStudy.accessibilityGuidelines || [],
      designSystemComponents: legacyStudy.designSystemComponents || [],
      
      // Create enhanced structure with defaults
      configuration: this.createDefaultConfiguration(legacyStudy),
      settings: this.createDefaultSettings(legacyStudy),
      metadata: this.createDefaultMetadata(legacyStudy),
      
      // Initialize multi-method features
      linkedStudies: legacyStudy.linkedStudies || [],
      workflows: legacyStudy.workflows || []
    };

    return baseStudy;
  }

  /**
   * Create default configuration from legacy study
   */
  private static createDefaultConfiguration(legacyStudy: any): StudyConfiguration {
    return {
      maxParticipants: legacyStudy.maxParticipants || 100,
      minParticipants: legacyStudy.minParticipants || 1,
      recruitmentStrategy: 'open',
      
      requiresCode: !!legacyStudy.accessCode,
      accessCode: legacyStudy.accessCode,
      allowAnonymous: legacyStudy.allowAnonymous ?? true,
      
      estimatedDuration: legacyStudy.estimatedDuration || this.estimateDurationByType(legacyStudy.type),
      deadline: legacyStudy.deadline,
      timezone: legacyStudy.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      collectDemographics: legacyStudy.collectDemographics ?? false,
      customFields: legacyStudy.customFields || [],
      consentRequired: legacyStudy.consentRequired ?? false,
      consentText: legacyStudy.consentText || '',
      
      validationRules: legacyStudy.validationRules || [],
      screeningQuestions: legacyStudy.screeningQuestions || [],
      attentionChecks: legacyStudy.attentionChecks ?? false
    };
  }

  /**
   * Create default settings from legacy study
   */
  private static createDefaultSettings(legacyStudy: any): StudySettings {
    return {
      theme: legacyStudy.theme || 'default',
      brandColors: legacyStudy.brandColors || {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981'
      },
      logo: legacyStudy.logo,
      
      showProgress: legacyStudy.showProgress ?? true,
      allowPause: legacyStudy.allowPause ?? false,
      allowBacktrack: legacyStudy.allowBacktrack ?? false,
      shuffleOrder: legacyStudy.shuffleOrder ?? false,
      
      autoSave: legacyStudy.autoSave ?? true,
      saveInterval: legacyStudy.saveInterval || 30,
      captureScreenSize: legacyStudy.captureScreenSize ?? true,
      captureUserAgent: legacyStudy.captureUserAgent ?? true,
      captureTimestamps: legacyStudy.captureTimestamps ?? true,
      
      emailNotifications: legacyStudy.emailNotifications ?? false,
      slackIntegration: legacyStudy.slackIntegration || {
        enabled: false
      },
      
      defaultExportFormat: legacyStudy.defaultExportFormat || 'csv',
      includeMetadataInExport: legacyStudy.includeMetadataInExport ?? true
    };
  }

  /**
   * Create default metadata from legacy study
   */
  private static createDefaultMetadata(legacyStudy: any): StudyMetadata {
    return {
      createdBy: legacyStudy.createdBy || 'legacy-import',
      lastModifiedBy: legacyStudy.lastModifiedBy || 'system',
      version: configManager.get('version'),
      tags: legacyStudy.tags || [],
      
      viewCount: legacyStudy.viewCount || 0,
      startCount: legacyStudy.startCount || 0,
      completionRate: legacyStudy.completion ? legacyStudy.completion / 100 : 0,
      averageDuration: legacyStudy.averageDuration || 0,
      
      dataQualityScore: legacyStudy.dataQualityScore || 0.8,
      reliabilityScore: legacyStudy.reliabilityScore || 0.8,
      validityIndicators: legacyStudy.validityIndicators || [],
      
      hypothesis: legacyStudy.hypothesis || '',
      researchQuestions: legacyStudy.researchQuestions || [],
      successCriteria: legacyStudy.successCriteria || [],
      stakeholders: legacyStudy.stakeholders || []
    };
  }

  /**
   * Estimate duration based on study type (in minutes)
   */
  private static estimateDurationByType(type: string): number {
    const estimations = {
      'card-sorting': 15,
      'tree-testing': 10,
      'survey': 5,
      'accessibility-audit': 30,
      'design-system-review': 20,
      'video-analysis': 45,
      'user-interview': 60,
      'usability-testing': 30,
      'first-click-testing': 5,
      'five-second-test': 2,
      'prototype-testing': 25
    };
    
    return estimations[type as keyof typeof estimations] || 15;
  }

  /**
   * Convert legacy study result to enhanced format
   */
  static convertLegacyStudyResult(legacyResult: any): StudyResult {
    return {
      participantId: legacyResult.participantId,
      studyId: legacyResult.studyId,
      startTime: legacyResult.startTime,
      endTime: legacyResult.endTime,
      duration: legacyResult.duration || (legacyResult.endTime - legacyResult.startTime),
      results: legacyResult.results,
      
      metadata: {
        ...legacyResult.metadata,
        sessionId: legacyResult.metadata?.sessionId || `session_${Date.now()}`,
        ipAddress: legacyResult.metadata?.ipAddress || 'unknown',
        timezone: legacyResult.metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: legacyResult.metadata?.language || navigator.language
      },
      
      // Add enhanced result data with defaults
      participantData: legacyResult.participantData || {
        id: legacyResult.participantId,
        status: 'completed',
        studyHistory: []
      },
      
      qualityMetrics: legacyResult.qualityMetrics || {
        completeness: 0.9,
        consistency: 0.9,
        validity: 0.9,
        reliability: 0.9,
        flags: [],
        overallScore: 0.9,
        recommendations: []
      },
      
      behaviorMetrics: legacyResult.behaviorMetrics || {
        totalInteractions: 1,
        averageTimePerInteraction: legacyResult.duration || 0,
        hesitationCount: 0,
        backtrackCount: 0,
        idleTime: 0,
        focusLossCount: 0,
        interactionSequence: [],
        engagementScore: 0.8,
        frustrationIndicators: []
      },
      
      customResponses: legacyResult.customResponses || {}
    };
  }

  /**
   * Ensure study data is in current format
   */
  static ensureStudyFormat(studyData: any): Study {
    // Check if already in new format
    if (studyData.configuration && studyData.settings && studyData.metadata) {
      return studyData as Study;
    }
    
    // Convert from legacy format
    return this.convertLegacyStudy(studyData);
  }

  /**
   * Ensure study result is in current format
   */
  static ensureStudyResultFormat(resultData: any): StudyResult {
    // Check if already in new format
    if (resultData.qualityMetrics && resultData.behaviorMetrics) {
      return resultData as StudyResult;
    }
    
    // Convert from legacy format
    return this.convertLegacyStudyResult(resultData);
  }

  /**
   * Get legacy study data for backward compatibility with existing components
   */
  static toLegacyStudyFormat(study: Study): any {
    return {
      id: study.id,
      name: study.name,
      type: study.type,
      status: study.status,
      participants: study.participants,
      completion: study.completion,
      created: study.created,
      cards: study.cards,
      categories: study.categories,
      treeStructure: study.treeStructure,
      task: study.task,
      surveyQuestions: study.surveyQuestions,
      accessibilityGuidelines: study.accessibilityGuidelines,
      designSystemComponents: study.designSystemComponents
    };
  }

  /**
   * Migrate localStorage data to new format if needed
   */
  static async migrateLocalStorageData(): Promise<{ migrated: number; errors: string[] }> {
    const results = {
      migrated: 0,
      errors: [] as string[]
    };

    try {
      // Find all studies in localStorage
      const studiesToMigrate: { key: string; data: any }[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('ia-evaluator-studies') || key?.includes('vision_ux_study_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsedData = JSON.parse(data);
              if (Array.isArray(parsedData)) {
                // Handle array of studies
                parsedData.forEach((study, index) => {
                  studiesToMigrate.push({
                    key: `${key}_${index}`,
                    data: study
                  });
                });
              } else {
                // Handle single study
                studiesToMigrate.push({ key, data: parsedData });
              }
            } catch (error) {
              results.errors.push(`Failed to parse data for key ${key}: ${(error as Error).message}`);
            }
          }
        }
      }

      // Migrate each study
      for (const { key, data } of studiesToMigrate) {
        try {
          const migratedStudy = this.ensureStudyFormat(data);
          const newKey = key.startsWith('vision_ux_') ? key : `vision_ux_study_${migratedStudy.id}`;
          
          localStorage.setItem(newKey, JSON.stringify(migratedStudy));
          results.migrated++;

          // Remove old key if different
          if (newKey !== key) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          results.errors.push(`Failed to migrate study ${key}: ${(error as Error).message}`);
        }
      }

      console.log(`Migrated ${results.migrated} studies to new format`);
      
    } catch (error) {
      results.errors.push(`Migration failed: ${(error as Error).message}`);
    }

    return results;
  }

  /**
   * Check if current data needs migration
   */
  static needsMigration(): boolean {
    // Check for legacy study data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('ia-evaluator-studies')) {
        return true;
      }
    }

    // Check for studies without new structure
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vision_ux_study_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const study = JSON.parse(data);
            if (!study.configuration || !study.settings || !study.metadata) {
              return true;
            }
          } catch (error) {
            // Invalid data needs migration
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get compatibility status
   */
  static getCompatibilityStatus(): {
    version: string;
    needsMigration: boolean;
    legacyDataFound: boolean;
    recommendedActions: string[];
  } {
    const needsMigration = this.needsMigration();
    const legacyDataFound = this.hasLegacyData();
    const recommendedActions: string[] = [];

    if (needsMigration) {
      recommendedActions.push('Run data migration to update to new format');
    }

    if (legacyDataFound) {
      recommendedActions.push('Consider backing up legacy data before migration');
    }

    if (!needsMigration && !legacyDataFound) {
      recommendedActions.push('System is up to date');
    }

    return {
      version: configManager.get('version'),
      needsMigration,
      legacyDataFound,
      recommendedActions
    };
  }

  /**
   * Check if legacy data exists
   */
  private static hasLegacyData(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('ia-evaluator') && !key?.includes('vision_ux_')) {
        return true;
      }
    }
    return false;
  }
}

// Export singleton functions for easy use
export const convertLegacyStudy = BackwardCompatibilityManager.convertLegacyStudy;
export const convertLegacyStudyResult = BackwardCompatibilityManager.convertLegacyStudyResult;
export const ensureStudyFormat = BackwardCompatibilityManager.ensureStudyFormat;
export const ensureStudyResultFormat = BackwardCompatibilityManager.ensureStudyResultFormat;
export const toLegacyStudyFormat = BackwardCompatibilityManager.toLegacyStudyFormat;
export const migrateLocalStorageData = BackwardCompatibilityManager.migrateLocalStorageData;
export const needsMigration = BackwardCompatibilityManager.needsMigration;
export const getCompatibilityStatus = BackwardCompatibilityManager.getCompatibilityStatus;

export default BackwardCompatibilityManager;