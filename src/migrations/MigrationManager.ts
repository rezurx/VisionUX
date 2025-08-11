// =============================================================================
// VISION UX RESEARCH SUITE - DATABASE MIGRATION UTILITIES
// =============================================================================

import { 
  MigrationPlan, 
  MigrationStep, 
  APIResponse 
} from '../types';
import { configManager } from '../config';
import { DataValidator } from '../data/DataManager';

/**
 * Migration Manager for handling data structure changes and database transitions
 */
export class MigrationManager {
  private currentVersion: string;
  private migrations: Map<string, MigrationPlan> = new Map();

  constructor() {
    this.currentVersion = configManager.get('version');
    this.initializeMigrations();
  }

  /**
   * Initialize all available migrations
   */
  private initializeMigrations(): void {
    // Migration from 1.x localStorage to 2.x structured localStorage
    this.registerMigration(createV1ToV2Migration());
    
    // Migration from localStorage to IndexedDB (future)
    this.registerMigration(createLocalStorageToIndexedDBMigration());
    
    // Migration from local to remote database (future)
    this.registerMigration(createLocalToRemoteMigration());
    
    // Schema migrations for enhanced study structure
    this.registerMigration(createStudySchemaEnhancementMigration());
  }

  /**
   * Register a migration plan
   */
  registerMigration(migration: MigrationPlan): void {
    const key = `${migration.fromVersion}->${migration.toVersion}`;
    this.migrations.set(key, migration);
    console.log(`Registered migration: ${key}`);
  }

  /**
   * Get available migration path from current version to target
   */
  getMigrationPath(targetVersion: string): MigrationPlan[] {
    const path: MigrationPlan[] = [];
    let currentVer = this.currentVersion;

    // Simple linear migration path (can be enhanced for complex version trees)
    while (currentVer !== targetVersion) {
      const nextMigration = this.findNextMigration(currentVer, targetVersion);
      if (!nextMigration) {
        throw new Error(`No migration path found from ${currentVer} to ${targetVersion}`);
      }
      
      path.push(nextMigration);
      currentVer = nextMigration.toVersion;
    }

    return path;
  }

  /**
   * Find next migration in the path to target version
   */
  private findNextMigration(fromVersion: string, targetVersion: string): MigrationPlan | null {
    // Look for direct migration
    const directKey = `${fromVersion}->${targetVersion}`;
    if (this.migrations.has(directKey)) {
      return this.migrations.get(directKey)!;
    }

    // Look for intermediate migrations
    const availableMigrations = Array.from(this.migrations.values())
      .filter(m => m.fromVersion === fromVersion);

    // For simplicity, return the first available migration
    // In a more complex system, this would use graph traversal
    return availableMigrations[0] || null;
  }

  /**
   * Execute migration with rollback capability
   */
  async executeMigration(
    migration: MigrationPlan, 
    dryRun: boolean = false
  ): Promise<APIResponse<{ migratedItems: number; errors: string[] }>> {
    console.log(`${dryRun ? 'DRY RUN: ' : ''}Executing migration: ${migration.fromVersion} -> ${migration.toVersion}`);

    const results = {
      migratedItems: 0,
      errors: [] as string[]
    };

    // Create backup before migration (unless dry run)
    let backupKey: string | null = null;
    if (!dryRun) {
      backupKey = await this.createBackup();
    }

    try {
      for (const step of migration.steps) {
        console.log(`Executing step: ${step.description}`);
        
        try {
          const data = await this.gatherDataForStep(step);
          const migratedData = await step.execute(data);
          
          // Validate migrated data
          if (step.validation && !step.validation(migratedData)) {
            throw new Error(`Validation failed for step: ${step.description}`);
          }

          if (!dryRun) {
            await this.persistMigratedData(step, migratedData);
          }

          results.migratedItems++;
        } catch (error) {
          const errorMsg = `Step '${step.description}' failed: ${(error as Error).message}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);

          // If critical error and not dry run, rollback
          if (!dryRun && step.type !== 'cleanup') {
            await this.rollbackMigration(migration, backupKey!);
            throw new Error(`Migration failed and rolled back: ${errorMsg}`);
          }
        }
      }

      // Update version if migration successful and not dry run
      if (!dryRun && results.errors.length === 0) {
        await this.updateVersion(migration.toVersion);
        console.log(`Migration completed successfully. Updated to version ${migration.toVersion}`);
      }

      return {
        success: true,
        data: results,
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: migration.toVersion
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MIGRATION_FAILED',
          message: (error as Error).message,
          details: results.errors
        }
      };
    }
  }

  /**
   * Rollback migration using backup
   */
  private async rollbackMigration(migration: MigrationPlan, backupKey: string): Promise<void> {
    console.log('Rolling back migration...');
    
    try {
      // Restore from backup
      await this.restoreFromBackup(backupKey);
      
      // Execute rollback steps if available
      if (migration.rollbackSteps) {
        for (const step of migration.rollbackSteps) {
          try {
            const data = await this.gatherDataForStep(step);
            await step.execute(data);
          } catch (error) {
            console.error(`Rollback step failed: ${step.description}`, error);
          }
        }
      }
      
      console.log('Migration rolled back successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Create backup of current data
   */
  private async createBackup(): Promise<string> {
    const backupKey = `migration_backup_${Date.now()}`;
    const allData = await this.gatherAllData();
    
    localStorage.setItem(backupKey, JSON.stringify(allData));
    console.log(`Backup created: ${backupKey}`);
    
    return backupKey;
  }

  /**
   * Restore data from backup
   */
  private async restoreFromBackup(backupKey: string): Promise<void> {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error(`Backup not found: ${backupKey}`);
    }

    const data = JSON.parse(backupData);
    await this.restoreAllData(data);
    
    console.log(`Data restored from backup: ${backupKey}`);
  }

  /**
   * Gather all data from current storage
   */
  private async gatherAllData(): Promise<any> {
    const data: any = {};
    
    // Gather studies
    data.studies = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vision_ux_study_')) {
        const studyData = localStorage.getItem(key);
        if (studyData) {
          data.studies.push({ key, data: JSON.parse(studyData) });
        }
      }
    }

    // Gather results
    data.results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vision_ux_result_')) {
        const resultData = localStorage.getItem(key);
        if (resultData) {
          data.results.push({ key, data: JSON.parse(resultData) });
        }
      }
    }

    // Gather participants
    data.participants = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vision_ux_participant_')) {
        const participantData = localStorage.getItem(key);
        if (participantData) {
          data.participants.push({ key, data: JSON.parse(participantData) });
        }
      }
    }

    // Gather configuration
    const configData = localStorage.getItem('vision-ux-config');
    if (configData) {
      data.config = JSON.parse(configData);
    }

    return data;
  }

  /**
   * Restore all data to storage
   */
  private async restoreAllData(data: any): Promise<void> {
    // Clear current data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vision_ux_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Restore studies
    if (data.studies) {
      data.studies.forEach((item: any) => {
        localStorage.setItem(item.key, JSON.stringify(item.data));
      });
    }

    // Restore results
    if (data.results) {
      data.results.forEach((item: any) => {
        localStorage.setItem(item.key, JSON.stringify(item.data));
      });
    }

    // Restore participants
    if (data.participants) {
      data.participants.forEach((item: any) => {
        localStorage.setItem(item.key, JSON.stringify(item.data));
      });
    }

    // Restore configuration
    if (data.config) {
      localStorage.setItem('vision-ux-config', JSON.stringify(data.config));
    }
  }

  /**
   * Gather data for a specific migration step
   */
  private async gatherDataForStep(step: MigrationStep): Promise<any> {
    switch (step.type) {
      case 'data-transform':
        return await this.gatherAllData();
      case 'schema-change':
        return await this.gatherSchemaData();
      default:
        return {};
    }
  }

  /**
   * Gather schema-related data
   */
  private async gatherSchemaData(): Promise<any> {
    // This would gather schema/structure information
    return {
      version: this.currentVersion,
      timestamp: Date.now()
    };
  }

  /**
   * Persist migrated data
   */
  private async persistMigratedData(step: MigrationStep, data: any): Promise<void> {
    // Implementation depends on step type and target storage
    console.log(`Persisting data for step: ${step.description}`);
    
    // For now, assume localStorage persistence
    if (step.type === 'data-transform' && data.studies) {
      data.studies.forEach((study: any) => {
        localStorage.setItem(study.key, JSON.stringify(study.data));
      });
    }
  }

  /**
   * Update application version
   */
  private async updateVersion(newVersion: string): Promise<void> {
    configManager.set('version', newVersion);
    this.currentVersion = newVersion;
    
    // Update migration version in data store config
    const currentConfig = configManager.getConfig();
    configManager.update({
      dataStore: {
        ...currentConfig.dataStore,
        config: {
          ...currentConfig.dataStore.config,
          migrationVersion: newVersion
        }
      }
    });
  }

  /**
   * Check if migration is needed
   */
  async checkMigrationNeeded(): Promise<{
    needed: boolean;
    fromVersion: string;
    toVersion: string;
    availableMigrations: string[];
  }> {
    const storedVersion = localStorage.getItem('vision_ux_version') || '1.0.0';
    const currentVersion = configManager.get('version');
    
    return {
      needed: storedVersion !== currentVersion,
      fromVersion: storedVersion,
      toVersion: currentVersion,
      availableMigrations: Array.from(this.migrations.keys())
    };
  }

  /**
   * Generate request ID for tracking
   */
  private generateRequestId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('migration_backup_')) {
        const timestamp = parseInt(key.split('_')[2]);
        if (timestamp < cutoffTime) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }

    console.log(`Cleaned up ${cleanedCount} old migration backups`);
    return cleanedCount;
  }
}

// =============================================================================
// MIGRATION PLAN DEFINITIONS
// =============================================================================

/**
 * Migration from v1.x to v2.x (localStorage structure changes)
 */
function createV1ToV2Migration(): MigrationPlan {
  return {
    fromVersion: '1.0.0',
    toVersion: '2.0.0',
    steps: [
      {
        id: 'transform-study-structure',
        description: 'Transform study structure to include new fields',
        type: 'data-transform',
        execute: async (data: any) => {
          // Transform studies to new structure
          if (data.studies) {
            data.studies = data.studies.map((study: any) => ({
              ...study,
              data: {
                ...study.data,
                // Add new required fields for v2.x
                configuration: study.data.configuration || {
                  maxParticipants: 100,
                  allowAnonymous: true,
                  collectDemographics: false
                },
                settings: study.data.settings || {
                  theme: 'default',
                  showProgress: true,
                  autoSave: true,
                  saveInterval: 30
                },
                metadata: study.data.metadata || {
                  version: '2.0.0',
                  tags: [],
                  createdBy: 'system'
                },
                updated: study.data.updated || study.data.created || new Date().toISOString()
              }
            }));
          }
          return data;
        },
        validation: (data: any) => {
          return data.studies?.every((study: any) => 
            study.data.configuration && 
            study.data.settings && 
            study.data.metadata
          ) ?? true;
        }
      },
      {
        id: 'transform-results-structure',
        description: 'Transform results to include quality metrics',
        type: 'data-transform',
        execute: async (data: any) => {
          if (data.results) {
            data.results = data.results.map((result: any) => ({
              ...result,
              data: {
                ...result.data,
                qualityMetrics: DataValidator.validateStudyResult(result.data),
                behaviorMetrics: {
                  totalInteractions: 1,
                  averageTimePerInteraction: result.data.duration || 0,
                  hesitationCount: 0,
                  backtrackCount: 0,
                  idleTime: 0,
                  focusLossCount: 0,
                  interactionSequence: [],
                  engagementScore: 0.8,
                  frustrationIndicators: []
                }
              }
            }));
          }
          return data;
        }
      }
    ],
    rollbackSteps: [
      {
        id: 'rollback-study-structure',
        description: 'Rollback study structure changes',
        type: 'data-transform',
        execute: async (data: any) => {
          if (data.studies) {
            data.studies = data.studies.map((study: any) => ({
              ...study,
              data: {
                id: study.data.id,
                name: study.data.name,
                type: study.data.type,
                status: study.data.status,
                participants: study.data.participants,
                completion: study.data.completion,
                created: study.data.created,
                cards: study.data.cards,
                categories: study.data.categories,
                treeStructure: study.data.treeStructure,
                task: study.data.task
              }
            }));
          }
          return data;
        }
      }
    ]
  };
}

/**
 * Migration from localStorage to IndexedDB
 */
function createLocalStorageToIndexedDBMigration(): MigrationPlan {
  return {
    fromVersion: '2.0.0',
    toVersion: '2.1.0',
    rollbackSteps: [],
    steps: [
      {
        id: 'setup-indexeddb',
        description: 'Setup IndexedDB database and object stores',
        type: 'schema-change',
        execute: async (data: any) => {
          // TODO: Implement IndexedDB setup
          console.log('IndexedDB setup (not yet implemented)');
          return data;
        }
      },
      {
        id: 'migrate-to-indexeddb',
        description: 'Migrate data from localStorage to IndexedDB',
        type: 'data-transform',
        execute: async (data: any) => {
          // TODO: Implement data migration to IndexedDB
          console.log('IndexedDB migration (not yet implemented)');
          return data;
        }
      }
    ]
  };
}

/**
 * Migration from local storage to remote database
 */
function createLocalToRemoteMigration(): MigrationPlan {
  return {
    fromVersion: '2.1.0',
    toVersion: '2.2.0',
    rollbackSteps: [],
    steps: [
      {
        id: 'validate-api-connection',
        description: 'Validate API connection for remote sync',
        type: 'schema-change',
        execute: async (data: any) => {
          // TODO: Validate API connectivity
          const apiEndpoint = configManager.get('apiEndpoint');
          if (!apiEndpoint) {
            throw new Error('API endpoint not configured');
          }
          return data;
        }
      },
      {
        id: 'sync-to-remote',
        description: 'Sync local data to remote database',
        type: 'data-transform',
        execute: async (data: any) => {
          // TODO: Implement remote sync
          console.log('Remote sync (not yet implemented)');
          return data;
        }
      }
    ]
  };
}

/**
 * Schema enhancement migration for advanced study features
 */
function createStudySchemaEnhancementMigration(): MigrationPlan {
  return {
    fromVersion: '2.0.0',
    toVersion: '2.0.1',
    rollbackSteps: [],
    steps: [
      {
        id: 'add-workflow-support',
        description: 'Add workflow support to studies',
        type: 'data-transform',
        execute: async (data: any) => {
          if (data.studies) {
            data.studies = data.studies.map((study: any) => ({
              ...study,
              data: {
                ...study.data,
                workflows: study.data.workflows || [],
                linkedStudies: study.data.linkedStudies || []
              }
            }));
          }
          return data;
        }
      },
      {
        id: 'enhance-participant-data',
        description: 'Enhance participant data structure',
        type: 'data-transform',
        execute: async (data: any) => {
          if (data.participants) {
            data.participants = data.participants.map((participant: any) => ({
              ...participant,
              data: {
                ...participant.data,
                studyHistory: participant.data.studyHistory || [],
                reliabilityScore: participant.data.reliabilityScore || 0.8
              }
            }));
          }
          return data;
        }
      }
    ]
  };
}

// Export singleton instance
export const migrationManager = new MigrationManager();

// Export convenience functions
export const checkMigrationNeeded = () => migrationManager.checkMigrationNeeded();
export const executeMigration = (plan: MigrationPlan, dryRun?: boolean) => 
  migrationManager.executeMigration(plan, dryRun);

export default migrationManager;