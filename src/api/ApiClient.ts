// =============================================================================
// VISION UX RESEARCH SUITE - API CLIENT ABSTRACTION LAYER
// =============================================================================

import { 
  Study, 
  StudyResult, 
  ParticipantData, 
  APIResponse, 
  CrossMethodAnalysis,
  ExportOptions,
  ExportResult 
} from '../types';
import { configManager } from '../config';
import { dataManager } from '../data/DataManager';

/**
 * HTTP request methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request configuration
 */
interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

/**
 * API Client class providing abstracted access to both local and remote data
 */
export class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private defaultHeaders: Record<string, string>;
  private isOnline: boolean = navigator.onLine;
  private requestQueue: QueuedRequest[] = [];

  constructor() {
    const config = configManager.getConfig();
    this.baseUrl = config.apiEndpoint || '';
    this.apiKey = config.apiKey;
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': `VisionUX-Suite/${config.version}`,
      'X-Client-Version': config.version
    };

    if (this.apiKey) {
      this.defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Setup online/offline detection
    this.setupNetworkDetection();
  }

  // =============================================================================
  // STUDY MANAGEMENT API
  // =============================================================================

  /**
   * Create a new study
   */
  async createStudy(study: Omit<Study, 'id'>): Promise<APIResponse<Study>> {
    const studyWithId = {
      ...study,
      id: Date.now(), // Generate temporary ID for offline mode
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    } as Study;

    if (this.isBackendAvailable()) {
      return this.makeRequest<Study>('/api/studies', {
        method: 'POST',
        body: studyWithId
      });
    } else {
      // Use local data manager
      return await dataManager.saveStudy(studyWithId);
    }
  }

  /**
   * Get study by ID
   */
  async getStudy(studyId: number): Promise<APIResponse<Study>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest<Study>(`/api/studies/${studyId}`, {
        method: 'GET',
        cache: true
      });
    } else {
      return await dataManager.loadStudy(studyId);
    }
  }

  /**
   * Update existing study
   */
  async updateStudy(studyId: number, updates: Partial<Study>): Promise<APIResponse<Study>> {
    const updatedStudy = {
      ...updates,
      id: studyId,
      updated: new Date().toISOString()
    } as Study;

    if (this.isBackendAvailable()) {
      return this.makeRequest<Study>(`/api/studies/${studyId}`, {
        method: 'PUT',
        body: updatedStudy
      });
    } else {
      return await dataManager.saveStudy(updatedStudy);
    }
  }

  /**
   * Delete study
   */
  async deleteStudy(studyId: number): Promise<APIResponse<boolean>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest<boolean>(`/api/studies/${studyId}`, {
        method: 'DELETE'
      });
    } else {
      return await dataManager.deleteStudy(studyId);
    }
  }

  /**
   * List all studies with optional filtering
   */
  async listStudies(filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<Study[]>> {
    if (this.isBackendAvailable()) {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const url = `/api/studies${queryParams.toString() ? `?${queryParams}` : ''}`;
      return this.makeRequest<Study[]>(url, { method: 'GET', cache: true });
    } else {
      const response = await dataManager.listStudies();
      
      // Apply client-side filtering if needed
      if (response.success && response.data && filters) {
        let filteredStudies = response.data;
        
        if (filters.type) {
          filteredStudies = filteredStudies.filter(s => s.type === filters.type);
        }
        
        if (filters.status) {
          filteredStudies = filteredStudies.filter(s => s.status === filters.status);
        }
        
        if (filters.offset) {
          filteredStudies = filteredStudies.slice(filters.offset);
        }
        
        if (filters.limit) {
          filteredStudies = filteredStudies.slice(0, filters.limit);
        }
        
        return {
          ...response,
          data: filteredStudies
        };
      }
      
      return response;
    }
  }

  // =============================================================================
  // STUDY RESULTS API
  // =============================================================================

  /**
   * Submit study results
   */
  async submitStudyResult(result: StudyResult): Promise<APIResponse<StudyResult>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest<StudyResult>('/api/results', {
        method: 'POST',
        body: result
      });
    } else {
      return await dataManager.saveStudyResult(result);
    }
  }

  /**
   * Get study results
   */
  async getStudyResults(studyId: number, options?: {
    includeMetrics?: boolean;
    participantId?: string;
    limit?: number;
  }): Promise<APIResponse<StudyResult[]>> {
    if (this.isBackendAvailable()) {
      const queryParams = new URLSearchParams({ studyId: studyId.toString() });
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      return this.makeRequest<StudyResult[]>(`/api/results?${queryParams}`, {
        method: 'GET',
        cache: true
      });
    } else {
      // Load from local storage (simplified implementation)
      // In a full implementation, this would search through all stored results
      return {
        success: true,
        data: [], // TODO: Implement local result querying
        metadata: {
          timestamp: Date.now(),
          requestId: this.generateRequestId(),
          version: configManager.get('version')
        }
      };
    }
  }

  // =============================================================================
  // PARTICIPANT MANAGEMENT API
  // =============================================================================

  /**
   * Register new participant
   */
  async registerParticipant(participant: ParticipantData): Promise<APIResponse<ParticipantData>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest<ParticipantData>('/api/participants', {
        method: 'POST',
        body: participant
      });
    } else {
      return await dataManager.saveParticipantData(participant);
    }
  }

  /**
   * Update participant data
   */
  async updateParticipant(participantId: string, updates: Partial<ParticipantData>): Promise<APIResponse<ParticipantData>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest<ParticipantData>(`/api/participants/${participantId}`, {
        method: 'PATCH',
        body: updates
      });
    } else {
      // Load existing data and merge updates
      const existingData = localStorage.getItem(`vision_ux_participant_${participantId}`);
      if (existingData) {
        const participant = { ...JSON.parse(existingData), ...updates };
        return await dataManager.saveParticipantData(participant);
      } else {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Participant ${participantId} not found`
          }
        };
      }
    }
  }

  // =============================================================================
  // ANALYTICS AND EXPORT API
  // =============================================================================

  /**
   * Generate comprehensive cross-method analysis
   */
  async generateCrossMethodAnalysis(studyIds: number[]): Promise<APIResponse<CrossMethodAnalysis>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest<CrossMethodAnalysis>('/api/analytics/cross-method', {
        method: 'POST',
        body: { studyIds }
      });
    } else {
      // Enhanced local implementation using DataManager
      try {
        const studies: any[] = [];
        for (const studyId of studyIds) {
          const studyResponse = await dataManager.loadStudy(studyId);
          if (studyResponse.success && studyResponse.data) {
            studies.push(studyResponse.data);
          }
        }

        const analysis = (await import('../data/DataManager')).DataValidator.generateCrossMethodInsights(studies);
        
        return {
          success: true,
          data: analysis,
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
            code: 'ANALYSIS_ERROR',
            message: (error as Error).message || 'Failed to generate cross-method analysis'
          }
        };
      }
    }
  }

  /**
   * Generate method-specific analytics
   */
  async generateMethodAnalytics(
    studyId: number, 
    analysisType: 'basic' | 'advanced' | 'comparative'
  ): Promise<APIResponse<any>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest(`/api/studies/${studyId}/analytics`, {
        method: 'POST',
        body: { analysisType }
      });
    } else {
      try {
        const studyResponse = await dataManager.loadStudy(studyId);
        if (!studyResponse.success || !studyResponse.data) {
          throw new Error('Study not found');
        }

        const study = studyResponse.data;
        
        // Generate analytics based on method type
        const analytics = await this.generateLocalAnalytics(study, analysisType);
        
        return {
          success: true,
          data: analytics,
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
            code: 'ANALYTICS_ERROR',
            message: (error as Error).message || 'Failed to generate analytics'
          }
        };
      }
    }
  }

  /**
   * Validate cross-method compatibility
   */
  async validateMethodCompatibility(studyIds: number[]): Promise<APIResponse<any>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest('/api/analytics/compatibility', {
        method: 'POST',
        body: { studyIds }
      });
    } else {
      try {
        const studies: any[] = [];
        for (const studyId of studyIds) {
          const studyResponse = await dataManager.loadStudy(studyId);
          if (studyResponse.success && studyResponse.data) {
            studies.push(studyResponse.data);
          }
        }

        const validation = (await import('../data/DataManager')).DataValidator.validateCrossMethodCompatibility(studies);
        
        return {
          success: true,
          data: validation,
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
            code: 'VALIDATION_ERROR',
            message: (error as Error).message || 'Failed to validate method compatibility'
          }
        };
      }
    }
  }

  /**
   * Get research method recommendations based on goals
   */
  async getMethodRecommendations(goals: {
    objectives: string[];
    constraints: {
      timeline: number; // in days
      budget: 'low' | 'medium' | 'high';
      participants: number;
      expertise: 'beginner' | 'intermediate' | 'expert';
    };
    context: string;
  }): Promise<APIResponse<{
    recommended: Array<{
      methodType: any;
      rationale: string;
      priority: number;
      estimatedCost: string;
      estimatedTime: number;
    }>;
    alternatives: Array<{
      methodType: any;
      rationale: string;
      tradeoffs: string[];
    }>;
  }>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest('/api/analytics/recommendations', {
        method: 'POST',
        body: goals
      });
    } else {
      // Local recommendation engine
      try {
        const recommendations = await this.generateLocalRecommendations(goals);
        
        return {
          success: true,
          data: recommendations,
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
            code: 'RECOMMENDATION_ERROR',
            message: (error as Error).message || 'Failed to generate recommendations'
          }
        };
      }
    }
  }

  /**
   * Generate local analytics for a study
   */
  private async generateLocalAnalytics(study: any, analysisType: string): Promise<any> {
    const { RESEARCH_METHOD_METADATA } = await import('../types');
    const methodMeta = RESEARCH_METHOD_METADATA[study.type];
    
    const analytics = {
      studyId: study.id,
      methodType: study.type,
      analysisType,
      summary: {
        totalParticipants: study.participants,
        completionRate: study.completion / 100,
        averageDuration: methodMeta.estimatedDuration.average,
        status: study.status
      },
      insights: [] as any[],
      recommendations: [] as string[]
    };

    // Method-specific analytics
    switch (study.type) {
      case 'card-sorting':
        analytics.insights.push({
          type: 'info',
          title: 'Card Sorting Analysis',
          description: `${study.cards?.length || 0} cards organized by ${study.participants} participants`,
          confidence: 0.8
        });
        break;

      case 'tree-testing':
        analytics.insights.push({
          type: 'info',
          title: 'Navigation Analysis',
          description: `Tree structure with ${study.treeStructure?.length || 0} top-level items tested`,
          confidence: 0.8
        });
        break;

      case 'survey':
        analytics.insights.push({
          type: 'info',
          title: 'Survey Response Analysis',
          description: `${study.surveyQuestions?.length || 0} questions with ${study.participants} responses`,
          confidence: 0.9
        });
        break;
    }

    // Generate recommendations based on method and results
    if (study.participants < methodMeta.participantRequirements.recommendedParticipants) {
      analytics.recommendations.push(`Consider collecting data from ${methodMeta.participantRequirements.recommendedParticipants - study.participants} more participants for more reliable insights`);
    }

    if (study.status === 'completed' && methodMeta.compatibleMethods.length > 0) {
      analytics.recommendations.push(`Consider follow-up studies using ${methodMeta.compatibleMethods.slice(0, 2).join(' or ')} to validate findings`);
    }

    return analytics;
  }

  /**
   * Generate local method recommendations
   */
  private async generateLocalRecommendations(goals: any): Promise<any> {
    const { RESEARCH_METHOD_METADATA } = await import('../types');
    
    const recommended: any[] = [];
    const alternatives: any[] = [];

    // Analyze goals and constraints to recommend methods
    const isQuickTimeline = goals.constraints.timeline < 14; // Less than 2 weeks
    const isLowBudget = goals.constraints.budget === 'low';
    const hasLimitedParticipants = goals.constraints.participants < 20;
    
    // Information Architecture objectives
    if (goals.objectives.some((obj: string) => obj.toLowerCase().includes('navigation') || obj.toLowerCase().includes('organization'))) {
      if (!isQuickTimeline && !hasLimitedParticipants) {
        recommended.push({
          methodType: 'card-sorting',
          rationale: 'Excellent for understanding mental models and information organization',
          priority: 1,
          estimatedCost: isLowBudget ? 'low' : 'medium',
          estimatedTime: 7
        });
      }
      
      recommended.push({
        methodType: 'tree-testing',
        rationale: 'Fast way to validate navigation structure and findability',
        priority: isQuickTimeline ? 1 : 2,
        estimatedCost: 'low',
        estimatedTime: 3
      });
    }

    // Usability objectives
    if (goals.objectives.some((obj: string) => obj.toLowerCase().includes('usability') || obj.toLowerCase().includes('user experience'))) {
      recommended.push({
        methodType: 'usability-testing',
        rationale: 'Direct observation of user interactions and pain points',
        priority: 1,
        estimatedCost: goals.constraints.budget === 'high' ? 'medium' : 'low',
        estimatedTime: isQuickTimeline ? 5 : 10
      });

      if (isQuickTimeline) {
        alternatives.push({
          methodType: 'five-second-test',
          rationale: 'Quick first impressions and immediate usability feedback',
          tradeoffs: ['Limited depth of insights', 'No task-based testing']
        });
      }
    }

    // Research objectives
    if (goals.objectives.some((obj: string) => obj.toLowerCase().includes('research') || obj.toLowerCase().includes('insights'))) {
      if (!isQuickTimeline) {
        recommended.push({
          methodType: 'survey',
          rationale: 'Comprehensive data collection from large user base',
          priority: 2,
          estimatedCost: 'low',
          estimatedTime: 14
        });
      }

      alternatives.push({
        methodType: 'user-interview',
        rationale: 'Deep qualitative insights but requires more time per participant',
        tradeoffs: ['Time intensive', 'Smaller sample size', 'Rich qualitative data']
      });
    }

    return { recommended, alternatives };
  }

  /**
   * Export study data
   */
  async exportStudyData(studyId: number, options: ExportOptions): Promise<APIResponse<ExportResult>> {
    if (this.isBackendAvailable()) {
      return this.makeRequest<ExportResult>(`/api/studies/${studyId}/export`, {
        method: 'POST',
        body: options
      });
    } else {
      // Use local export functionality (assuming it exists in utils)
      try {
        const study = await this.getStudy(studyId);
        if (!study.success || !study.data) {
          throw new Error('Study not found');
        }

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${study.data.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${options.format}`;

        return {
          success: true,
          data: {
            success: true,
            filename,
            size: 0, // Would be calculated during export
            downloadUrl: 'blob://local-export' // Placeholder for local export
          },
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
            code: 'EXPORT_ERROR',
            message: (error as Error).message || 'Export failed'
          }
        };
      }
    }
  }

  // =============================================================================
  // COLLABORATION AND REAL-TIME FEATURES (Future)
  // =============================================================================

  /**
   * Setup real-time collaboration (WebSocket connection)
   */
  async setupCollaboration(_studyId: number): Promise<APIResponse<{ connectionId: string }>> {
    if (!configManager.isFeatureEnabled('realTimeCollaboration')) {
      return {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Real-time collaboration is not enabled'
        }
      };
    }

    // TODO: Implement WebSocket connection for real-time collaboration
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Real-time collaboration not yet implemented'
      }
    };
  }

  // =============================================================================
  // UTILITY AND HELPER METHODS
  // =============================================================================

  /**
   * Check if backend API is available
   */
  private isBackendAvailable(): boolean {
    return this.isOnline && !!this.baseUrl && configManager.isFeatureEnabled('apiAccess');
  }

  /**
   * Make HTTP request with error handling and retries
   */
  private async makeRequest<T>(
    endpoint: string, 
    config: RequestConfig
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestId = this.generateRequestId();
    
    const requestConfig: RequestInit = {
      method: config.method,
      headers: {
        ...this.defaultHeaders,
        ...config.headers,
        'X-Request-ID': requestId
      },
      signal: AbortSignal.timeout(config.timeout || 30000)
    };

    if (config.body && config.method !== 'GET') {
      requestConfig.body = JSON.stringify(config.body);
    }

    // Handle offline requests
    if (!this.isOnline) {
      this.queueRequest(url, config);
      return {
        success: false,
        error: {
          code: 'OFFLINE',
          message: 'Request queued for when connection is restored'
        }
      };
    }

    let lastError: Error | undefined;
    const maxRetries = config.retries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: {
              code: errorData.code || `HTTP_${response.status}`,
              message: errorData.message || response.statusText,
              details: errorData
            }
          };
        }

        const data = await response.json();
        
        return {
          success: true,
          data,
          metadata: {
            timestamp: Date.now(),
            requestId,
            version: configManager.get('version')
          }
        };

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort errors
        if ((error as Error).name === 'AbortError') {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Request failed after retries',
        details: lastError
      }
    };
  }

  /**
   * Setup network detection for offline/online handling
   */
  private setupNetworkDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Queue request for offline processing
   */
  private queueRequest(url: string, config: RequestConfig): void {
    this.requestQueue.push({
      id: this.generateRequestId(),
      url,
      config,
      timestamp: Date.now()
    });

    // Limit queue size
    if (this.requestQueue.length > 100) {
      this.requestQueue = this.requestQueue.slice(-100);
    }
  }

  /**
   * Process queued requests when back online
   */
  private async processQueuedRequests(): Promise<void> {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const queuedRequest of queue) {
      // Skip requests older than 1 hour
      if (Date.now() - queuedRequest.timestamp > 3600000) {
        continue;
      }

      try {
        await this.makeRequest(queuedRequest.url.replace(this.baseUrl, ''), queuedRequest.config);
      } catch (error) {
        console.warn('Failed to process queued request:', error);
      }
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    features: string[];
  }> {
    if (!this.isBackendAvailable()) {
      return {
        status: 'down',
        features: ['local-storage', 'offline-mode']
      };
    }

    try {
      const start = Date.now();
      await this.makeRequest('/api/health', { method: 'GET', timeout: 5000 });
      const latency = Date.now() - start;

      return {
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency,
        features: ['api-access', 'real-time-sync', 'cloud-storage']
      };
    } catch (error) {
      return {
        status: 'down',
        features: ['local-storage', 'offline-mode']
      };
    }
  }
}

/**
 * Queued request structure for offline handling
 */
interface QueuedRequest {
  id: string;
  url: string;
  config: RequestConfig;
  timestamp: number;
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export type-safe API methods as a service layer
export const StudyService = {
  create: (study: Omit<Study, 'id'>) => apiClient.createStudy(study),
  get: (id: number) => apiClient.getStudy(id),
  update: (id: number, updates: Partial<Study>) => apiClient.updateStudy(id, updates),
  delete: (id: number) => apiClient.deleteStudy(id),
  list: (filters?: any) => apiClient.listStudies(filters),
};

export const ResultService = {
  submit: (result: StudyResult) => apiClient.submitStudyResult(result),
  getForStudy: (studyId: number, options?: any) => apiClient.getStudyResults(studyId, options),
};

export const ParticipantService = {
  register: (participant: ParticipantData) => apiClient.registerParticipant(participant),
  update: (id: string, updates: Partial<ParticipantData>) => apiClient.updateParticipant(id, updates),
};

export const AnalyticsService = {
  crossMethod: (studyIds: number[]) => apiClient.generateCrossMethodAnalysis(studyIds),
  methodAnalytics: (studyId: number, analysisType: 'basic' | 'advanced' | 'comparative') => 
    apiClient.generateMethodAnalytics(studyId, analysisType),
  validateCompatibility: (studyIds: number[]) => apiClient.validateMethodCompatibility(studyIds),
  getRecommendations: (goals: any) => apiClient.getMethodRecommendations(goals),
  export: (studyId: number, options: ExportOptions) => apiClient.exportStudyData(studyId, options),
};

export default apiClient;