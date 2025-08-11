// =============================================================================
// VISION UX RESEARCH SUITE - CONFIGURATION MANAGEMENT
// =============================================================================

import { 
  AppConfig, 
  FeatureFlags, 
  ThemeConfig, 
  AccessibilityConfig, 
  SecurityConfig,
  DataStore,
  DataSyncConfig 
} from '../types';

/**
 * Default application configuration
 * This serves as the baseline configuration that can be extended per environment
 */
const DEFAULT_CONFIG: AppConfig = {
  // Application metadata
  version: '2.0.0-alpha',
  buildDate: new Date().toISOString(),
  environment: 'development',

  // Feature flags - Enable/disable functionality for gradual rollout
  features: {
    multiMethodStudies: true,
    realTimeCollaboration: false, // Phase 3
    videoAnalysis: false, // Phase 4
    aiInsights: false, // Phase 4
    advancedAnalytics: true,
    customBranding: true,
    apiAccess: false, // Will be enabled when backend is ready
    webhookIntegration: false,
    ssoAuthentication: false,
    dataExportScheduling: true,
    participantScreening: true,
    customFields: true,
    workflowAutomation: true,
    qualityValidation: true,
    crossMethodAnalysis: true,
  },

  // Data layer configuration
  dataStore: {
    type: 'localStorage', // Will migrate to 'hybrid' then 'remote'
    config: {
      maxSize: 50, // 50MB
      retentionDays: 365,
      autoCleanup: true,
      backupEnabled: true,
      migrationVersion: '2.0.0',
    },
    encryption: {
      enabled: false, // Will enable in production
      algorithm: 'AES-256-GCM',
      keyId: 'vision-ux-key-v1',
    },
  },

  syncConfig: {
    enableSync: false, // Will enable when backend is ready
    syncInterval: 30000, // 30 seconds
    conflictResolution: 'client-wins',
    offlineSupport: true,
    compressionEnabled: true,
  },

  // UI/UX configuration
  theme: {
    defaultTheme: 'light',
    customThemes: {},
    allowUserCustomization: true,
  },

  accessibility: {
    enforceWCAG: true,
    level: 'AA',
    features: {
      highContrast: true,
      screenReader: true,
      keyboardNavigation: true,
      reducedMotion: true,
      fontSize: true,
    },
  },

  // Security settings
  security: {
    dataEncryption: false, // Will enable in production
    sessionTimeout: 1440, // 24 hours
    maxLoginAttempts: 5,
    requireStrongPasswords: true,
    twoFactorAuth: false, // Future enhancement
    auditLogging: true,
  },
};

/**
 * Configuration Manager Class
 * Handles loading, merging, and persisting configuration
 */
class ConfigurationManager {
  private config: AppConfig;
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  constructor() {
    this.config = this.loadConfiguration();
    this.setupConfigurationPersistence();
  }

  /**
   * Load configuration from multiple sources in priority order:
   * 1. Environment variables (highest priority)
   * 2. Local storage (user preferences)
   * 3. Default configuration (fallback)
   */
  private loadConfiguration(): AppConfig {
    const defaultConfig = { ...DEFAULT_CONFIG };
    const storedConfig = this.loadFromStorage();
    const envConfig = this.loadFromEnvironment();

    // Deep merge configurations
    return this.deepMerge(defaultConfig, storedConfig, envConfig);
  }

  /**
   * Load configuration from localStorage
   */
  private loadFromStorage(): Partial<AppConfig> {
    try {
      const stored = localStorage.getItem('vision-ux-config');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load configuration from localStorage:', error);
      return {};
    }
  }

  /**
   * Load configuration from environment variables
   * Useful for production deployments
   */
  private loadFromEnvironment(): Partial<AppConfig> {
    const envConfig: Partial<AppConfig> = {};

    // Check for environment-specific overrides
    if (import.meta.env.VITE_API_ENDPOINT) {
      envConfig.apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
    }

    if (import.meta.env.VITE_API_KEY) {
      envConfig.apiKey = import.meta.env.VITE_API_KEY;
    }

    if (import.meta.env.VITE_ENVIRONMENT) {
      envConfig.environment = import.meta.env.VITE_ENVIRONMENT;
    }

    // Analytics configuration
    if (import.meta.env.VITE_ANALYTICS_ID) {
      envConfig.analytics = {
        enabled: true,
        trackingId: import.meta.env.VITE_ANALYTICS_ID,
        customEvents: true,
      };
    }

    return envConfig;
  }

  /**
   * Deep merge configuration objects
   */
  private deepMerge(...objects: any[]): any {
    const isObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj);
    
    return objects.reduce((result, current) => {
      if (!current) return result;
      
      Object.keys(current).forEach(key => {
        if (isObject(result[key]) && isObject(current[key])) {
          result[key] = this.deepMerge(result[key], current[key]);
        } else {
          result[key] = current[key];
        }
      });
      
      return result;
    }, {});
  }

  /**
   * Setup automatic persistence of configuration changes
   */
  private setupConfigurationPersistence(): void {
    // Persist configuration changes to localStorage
    const persistConfig = () => {
      try {
        const persistableConfig = this.getPersistableConfig();
        localStorage.setItem('vision-ux-config', JSON.stringify(persistableConfig));
      } catch (error) {
        console.warn('Failed to persist configuration:', error);
      }
    };

    // Setup periodic persistence
    setInterval(persistConfig, 10000); // Every 10 seconds

    // Persist on page unload
    window.addEventListener('beforeunload', persistConfig);
  }

  /**
   * Get configuration that should be persisted (excludes environment-specific data)
   */
  private getPersistableConfig(): Partial<AppConfig> {
    const { apiKey, apiEndpoint, analytics, ...persistable } = this.config;
    return persistable;
  }

  /**
   * Get the complete configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get a specific configuration value with type safety
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * Update configuration with reactive notifications
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.notifyListeners(key, value);
  }

  /**
   * Update multiple configuration values
   */
  update(updates: Partial<AppConfig>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key as keyof AppConfig, value);
    });
  }

  /**
   * Get feature flag status
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  /**
   * Enable/disable a feature flag
   */
  setFeature(feature: keyof FeatureFlags, enabled: boolean): void {
    this.config.features[feature] = enabled;
    this.notifyListeners('features', this.config.features);
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe<K extends keyof AppConfig>(
    key: K, 
    callback: (value: AppConfig[K]) => void
  ): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback as any);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback as any);
    };
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    // Notify all listeners
    Object.keys(this.config).forEach(key => {
      this.notifyListeners(key as keyof AppConfig, this.config[key as keyof AppConfig]);
    });
  }

  /**
   * Validate configuration integrity
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Version validation
    if (!this.config.version) {
      errors.push('Configuration version is required');
    }

    // Environment validation
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(this.config.environment)) {
      errors.push(`Invalid environment: ${this.config.environment}`);
    }

    // Data store validation
    if (!this.config.dataStore.type) {
      errors.push('Data store type is required');
    }

    // Security validation for production
    if (this.config.environment === 'production') {
      if (!this.config.security.dataEncryption) {
        errors.push('Data encryption must be enabled in production');
      }
      if (this.config.security.sessionTimeout < 15) {
        errors.push('Session timeout must be at least 15 minutes in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Export configuration for debugging or migration
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = this.deepMerge(DEFAULT_CONFIG, importedConfig);
    } catch (error) {
      throw new Error(`Invalid configuration JSON: ${error.message}`);
    }
  }
}

// Create singleton instance
export const configManager = new ConfigurationManager();

// Export convenience functions
export const getConfig = () => configManager.getConfig();
export const isFeatureEnabled = (feature: keyof FeatureFlags) => configManager.isFeatureEnabled(feature);
export const setFeature = (feature: keyof FeatureFlags, enabled: boolean) => configManager.setFeature(feature, enabled);
export const subscribeToConfig = configManager.subscribe.bind(configManager);

// Export default configuration for testing and documentation
export { DEFAULT_CONFIG };

// Export configuration manager for advanced usage
export default configManager;