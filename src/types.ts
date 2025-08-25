// TypeScript interfaces for the Vision UX Research Suite

// =============================================================================
// CORE ARCHITECTURE TYPES
// =============================================================================

// Enhanced research method types for comprehensive multi-method platform
export type ResearchMethodType = 
  | 'card-sorting'
  | 'tree-testing' 
  | 'survey'
  | 'accessibility-audit'
  | 'design-system-review'
  | 'video-analysis'
  | 'user-interview'
  | 'usability-testing'
  | 'first-click-testing'
  | 'five-second-test'
  | 'prototype-testing'
  | 'a-b-testing'
  | 'moderated-testing'
  | 'unmoderated-testing'
  | 'your-new-method'
  | 'cognitive-walkthrough'
  | 'heuristic-evaluation'
  | 'diary-study'
  | 'click-stream-analysis';

// Method category types for grouping and navigation
export type MethodCategory = 
  | 'information-architecture'
  | 'usability-testing'
  | 'user-research'
  | 'accessibility'
  | 'analytics'
  | 'design-validation';

// Method complexity levels for participant screening and time estimation
export type MethodComplexity = 'simple' | 'moderate' | 'complex' | 'expert';

// Enhanced method metadata for better categorization and discovery
export interface ResearchMethodMeta {
  type: ResearchMethodType;
  category: MethodCategory;
  complexity: MethodComplexity;
  estimatedDuration: {
    min: number; // in minutes
    max: number;
    average: number;
  };
  participantRequirements: {
    minParticipants: number;
    maxParticipants: number;
    recommendedParticipants: number;
    skillLevel?: 'any' | 'basic' | 'intermediate' | 'expert';
  };
  dataTypes: string[]; // Types of data this method produces
  compatibleMethods: ResearchMethodType[]; // Methods that work well together
  prerequisites: string[]; // What needs to be in place before running
}

export type StudyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type ParticipantStatus = 'invited' | 'started' | 'in-progress' | 'completed' | 'dropped-out';

// Enhanced Study interface with comprehensive multi-method support
export interface Study {
  id: number;
  name: string;
  description?: string;
  type: ResearchMethodType;
  status: StudyStatus;
  participants: number;
  completion: number;
  created: string;
  updated: string;
  
  // Enhanced method metadata
  methodMeta: ResearchMethodMeta;
  
  // Study configuration
  configuration: StudyConfiguration;
  
  // Method-specific data (backward compatibility maintained)
  cards?: Card[];
  categories?: Category[];
  treeStructure?: TreeNode[];
  task?: string;
  surveyQuestions?: SurveyQuestion[];
  accessibilityGuidelines?: AccessibilityGuideline[];
  designSystemComponents?: DesignSystemComponent[];
  
  // Video analysis specific data
  videoFiles?: VideoFile[];
  videoSettings?: VideoStudySettings;
  
  // Enhanced method-specific configurations
  methodConfig: MethodSpecificConfig;
  
  // Advanced features
  settings: StudySettings;
  metadata: StudyMetadata;
  
  // Multi-method support
  linkedStudies?: number[]; // For cross-method analysis
  workflows?: StudyWorkflow[]; // For complex research workflows
  parentStudyId?: number; // For studies that are part of a larger research program
  childStudyIds?: number[]; // For sequential or parallel sub-studies
  
  // Research program integration
  researchProgram?: {
    programId: string;
    phase: number;
    objectives: string[];
    hypotheses: string[];
    successCriteria: string[];
  };
}

// Union type for method-specific configurations
export type MethodSpecificConfig = 
  | CardSortingConfig
  | TreeTestingConfig
  | SurveyConfig
  | AccessibilityAuditConfig
  | DesignSystemReviewConfig
  | VideoAnalysisConfig
  | UsabilityTestingConfig
  | FirstClickTestingConfig
  | FiveSecondTestConfig
  | PrototypeTestingConfig
  | ABTestingConfig
  | ModeratedTestingConfig
  | UnmoderatedTestingConfig
  | CognitiveWalkthroughConfig
  | HeuristicEvaluationConfig
  | DiaryStudyConfig
  | ClickStreamAnalysisConfig;

// Comprehensive study configuration
export interface StudyConfiguration {
  // Participant management
  maxParticipants?: number;
  minParticipants?: number;
  recruitmentStrategy?: 'open' | 'invite-only' | 'scheduled';
  
  // Access control
  requiresCode?: boolean;
  accessCode?: string;
  allowAnonymous?: boolean;
  
  // Timing
  estimatedDuration?: number; // in minutes
  deadline?: string;
  timezone?: string;
  
  // Data collection
  collectDemographics?: boolean;
  customFields?: CustomField[];
  consentRequired?: boolean;
  consentText?: string;
  
  // Quality control
  validationRules?: ValidationRule[];
  screeningQuestions?: ScreeningQuestion[];
  attentionChecks?: boolean;
}

// Study settings for behavior and appearance
export interface StudySettings {
  // UI/UX customization
  theme?: 'default' | 'light' | 'dark' | 'custom';
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logo?: string;
  
  // Participant experience
  showProgress?: boolean;
  allowPause?: boolean;
  allowBacktrack?: boolean;
  shuffleOrder?: boolean;
  
  // Data collection preferences
  autoSave?: boolean;
  saveInterval?: number; // in seconds
  captureScreenSize?: boolean;
  captureUserAgent?: boolean;
  captureTimestamps?: boolean;
  
  // Notifications
  emailNotifications?: boolean;
  slackIntegration?: {
    enabled: boolean;
    webhook?: string;
    channel?: string;
  };
  
  // Export preferences
  defaultExportFormat?: 'json' | 'csv' | 'xlsx';
  includeMetadataInExport?: boolean;
}

// Study metadata for tracking and analytics
export interface StudyMetadata {
  createdBy?: string;
  lastModifiedBy?: string;
  version: string;
  tags?: string[];
  
  // Analytics
  viewCount?: number;
  startCount?: number;
  completionRate?: number;
  averageDuration?: number;
  
  // Quality metrics
  dataQualityScore?: number;
  reliabilityScore?: number;
  validityIndicators?: string[];
  
  // Research context
  hypothesis?: string;
  researchQuestions?: string[];
  successCriteria?: string[];
  stakeholders?: string[];
}

// =============================================================================
// STUDY WORKFLOW AND AUTOMATION TYPES
// =============================================================================

export interface StudyWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  conditions?: WorkflowCondition[];
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'study' | 'delay' | 'email' | 'webhook' | 'decision';
  studyId?: number;
  delay?: number; // in hours
  emailTemplate?: string;
  webhookUrl?: string;
  condition?: WorkflowCondition;
  nextStepId?: string;
}

export interface WorkflowCondition {
  type: 'completion_rate' | 'participant_count' | 'time_elapsed' | 'custom';
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  value: number | string;
  customLogic?: string;
}

// =============================================================================
// CONFIGURATION AND VALIDATION TYPES
// =============================================================================

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'url' | 'select' | 'multiselect' | 'checkbox' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select/multiselect
  validation?: ValidationRule;
  order: number;
}

export interface ValidationRule {
  id: string;
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: number | string;
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: 'yes_no' | 'multiple_choice' | 'range' | 'text';
  options?: string[];
  range?: { min: number; max: number };
  acceptableAnswers: any[];
  eliminatesParticipant: boolean;
}

// =============================================================================
// METHOD-SPECIFIC CONFIGURATION TYPES
// =============================================================================

// Base interface for all method configurations
export interface BaseMethodConfig {
  methodType: ResearchMethodType;
  version: string;
  customInstructions?: string;
  practiceMode?: boolean;
}

// Card Sorting Configuration
export interface CardSortingConfig extends BaseMethodConfig {
  methodType: 'card-sorting';
  sortType: 'open' | 'closed' | 'hybrid';
  allowCustomCategories: boolean;
  maxCardsPerCategory?: number;
  minCardsPerCategory?: number;
  shuffleCards: boolean;
  showCardNumbers: boolean;
  allowUncategorized: boolean;
  cardDisplayMode: 'text' | 'image' | 'text-and-image';
  categoryLimits?: {
    min: number;
    max: number;
  };
}

// Tree Testing Configuration
export interface TreeTestingConfig extends BaseMethodConfig {
  methodType: 'tree-testing';
  showBreadcrumbs: boolean;
  allowBacktracking: boolean;
  showSearchFunctionality: boolean;
  maxDepthLevels?: number;
  taskSuccessCriteria: {
    correctPath?: string[];
    acceptableAlternatives?: string[][];
    timeLimit?: number; // in seconds
  };
  hints?: {
    enabled: boolean;
    delayBeforeShowing?: number; // in seconds
    maxHints?: number;
  };
}

// Survey Configuration
export interface SurveyConfig extends BaseMethodConfig {
  methodType: 'survey';
  allowPartialCompletion: boolean;
  showProgressIndicator: boolean;
  randomizeQuestionOrder: boolean;
  randomizeOptionOrder: boolean;
  branchingLogic?: BranchingRule[];
  validationSettings: {
    requireAllRequired: boolean;
    allowSkipValidation: boolean;
    customValidators?: ValidationRule[];
  };
  completionSettings: {
    showSummaryPage: boolean;
    allowReview: boolean;
    allowEdit: boolean;
  };
}

// Accessibility Audit Configuration
export interface AccessibilityAuditConfig extends BaseMethodConfig {
  methodType: 'accessibility-audit';
  wcagVersion: '2.0' | '2.1' | '2.2';
  complianceLevel: 'A' | 'AA' | 'AAA';
  assistiveTechnologies: string[];
  testingScope: {
    includePages: string[];
    excludePages: string[];
    includeCriteria: string[];
    excludeCriteria: string[];
  };
  evaluationMethods: ('automated' | 'manual' | 'user-testing')[];
  reportingOptions: {
    includeScreenshots: boolean;
    includeCodeSnippets: boolean;
    includeSeverityLevels: boolean;
    includeRecommendations: boolean;
  };
}

// Design System Review Configuration
export interface DesignSystemReviewConfig extends BaseMethodConfig {
  methodType: 'design-system-review';
  reviewScope: ('components' | 'tokens' | 'patterns' | 'guidelines' | 'documentation')[];
  evaluationCriteria: {
    usability: boolean;
    consistency: boolean;
    accessibility: boolean;
    maintainability: boolean;
    performance: boolean;
  };
  stakeholderGroups: ('designers' | 'developers' | 'product-managers' | 'content-creators')[];
  reviewFormat: 'structured-interview' | 'survey' | 'workshop' | 'audit';
}

// Video Analysis Configuration
export interface VideoAnalysisConfig extends BaseMethodConfig {
  methodType: 'video-analysis';
  analysisTypes: ('gaze-tracking' | 'facial-expression' | 'gesture-recognition' | 'screen-recording')[];
  recordingSettings: {
    recordScreen: boolean;
    recordCamera: boolean;
    recordAudio: boolean;
    quality: 'low' | 'medium' | 'high';
  };
  aiProcessing: {
    enabled: boolean;
    features: string[];
    confidenceThreshold: number;
  };
  privacySettings: {
    blurFaces: boolean;
    maskPII: boolean;
    retentionPeriod: number; // in days
  };
}

// Usability Testing Configuration  
export interface UsabilityTestingConfig extends BaseMethodConfig {
  methodType: 'usability-testing';
  testingFormat: 'in-person' | 'remote-moderated' | 'remote-unmoderated';
  taskStructure: {
    allowFreeExploration: boolean;
    taskOrderingStrategy: 'fixed' | 'randomized' | 'adaptive';
  };
  dataCollection: {
    recordThinkAloud: boolean;
    captureScreenshots: boolean;
    trackMouseMovements: boolean;
    measureTaskCompletion: boolean;
    measureUserSatisfaction: boolean;
  };
  supportOptions: {
    allowHelp: boolean;
    moderatorIntervention: 'never' | 'on-request' | 'proactive';
  };
}

// First Click Testing Configuration
export interface FirstClickTestingConfig extends BaseMethodConfig {
  methodType: 'first-click-testing';
  visualFormat: 'static-image' | 'interactive-prototype' | 'live-website';
  clickTargets: {
    predefinedAreas?: ClickArea[];
    allowFreeClick: boolean;
    highlightClickableAreas: boolean;
  };
  successCriteria: {
    correctAreas: ClickArea[];
    toleranceRadius?: number; // in pixels
    timeLimit?: number; // in seconds
  };
}

// Five Second Test Configuration
export interface FiveSecondTestConfig extends BaseMethodConfig {
  methodType: 'five-second-test';
  exposureTime: number; // in seconds, typically 5
  imageFormat: 'static-image' | 'webpage-screenshot' | 'prototype-screenshot';
  followUpQuestions: {
    recallQuestions: string[];
    comprehensionQuestions: string[];
    impressionQuestions: string[];
  };
  anonymousMode: boolean;
}

// Prototype Testing Configuration
export interface PrototypeTestingConfig extends BaseMethodConfig {
  methodType: 'prototype-testing';
  prototypeType: 'low-fidelity' | 'high-fidelity' | 'interactive' | 'coded';
  interactionLevel: 'view-only' | 'limited-interaction' | 'full-interaction';
  feedbackCollection: {
    allowAnnotations: boolean;
    collectRatings: boolean;
    enableComments: boolean;
    useStandardQuestions: boolean;
    customQuestions?: string[];
  };
  versionComparison: {
    enabled: boolean;
    versions?: PrototypeVersion[];
    comparisonMethod: 'side-by-side' | 'sequential' | 'a-b-test';
  };
}

// A/B Testing Configuration
export interface ABTestingConfig extends BaseMethodConfig {
  methodType: 'a-b-testing';
  variants: TestVariant[];
  trafficSplitting: {
    strategy: 'equal' | 'weighted' | 'adaptive';
    weights?: number[]; // must sum to 1.0
  };
  successMetrics: {
    primary: SuccessMetric;
    secondary?: SuccessMetric[];
  };
  testSettings: {
    minimumSampleSize: number;
    confidenceLevel: 0.90 | 0.95 | 0.99;
    statisticalPower: number;
    expectedEffect: number;
  };
  automationRules: {
    autoStop: boolean;
    stopCriteria?: StopCriteria;
    emailAlerts: boolean;
  };
}

// Moderated Testing Configuration
export interface ModeratedTestingConfig extends BaseMethodConfig {
  methodType: 'moderated-testing';
  sessionFormat: 'individual' | 'group' | 'paired';
  moderatorGuidelines: {
    script?: string;
    keyQuestions: string[];
    probingQuestions: string[];
    interventionTriggers: string[];
  };
  recordingSettings: {
    recordSession: boolean;
    recordScreen: boolean;
    liveStreaming: boolean;
    observerAccess: boolean;
  };
  sessionStructure: {
    warmUpDuration: number; // in minutes
    mainTaskDuration: number;
    debriefDuration: number;
    totalDuration: number;
  };
}

// Unmoderated Testing Configuration  
export interface UnmoderatedTestingConfig extends BaseMethodConfig {
  methodType: 'unmoderated-testing';
  selfGuidedInstructions: {
    detailedInstructions: string;
    videoInstructions?: string;
    checkpoints: string[];
  };
  dataCapture: {
    automaticScreenRecording: boolean;
    clickTracking: boolean;
    formAnalytics: boolean;
    errorLogging: boolean;
  };
  qualityAssurance: {
    attentionChecks: boolean;
    timeValidation: boolean;
    responseQualityFilters: boolean;
  };
}

// Cognitive Walkthrough Configuration
export interface CognitiveWalkthroughConfig extends BaseMethodConfig {
  methodType: 'cognitive-walkthrough';
  userPersona: {
    expertise: 'novice' | 'intermediate' | 'expert';
    goals: string[];
    context: string;
  };
  evaluationFramework: {
    actionSequence: CognitiveAction[];
    evaluationQuestions: CognitiveQuestion[];
  };
  expertReviewers: {
    required: boolean;
    minReviewers: number;
    expertiseAreas: string[];
  };
}

// Heuristic Evaluation Configuration
export interface HeuristicEvaluationConfig extends BaseMethodConfig {
  methodType: 'heuristic-evaluation';
  heuristicSet: 'nielsen' | 'norman' | 'gerhardt-powals' | 'shneiderman' | 'custom';
  customHeuristics?: Heuristic[];
  severityScale: {
    levels: number; // typically 0-4
    descriptions: string[];
  };
  evaluatorRequirements: {
    minEvaluators: number;
    maxEvaluators: number;
    expertiseRequired: boolean;
    independentEvaluation: boolean;
  };
  consolidationProcess: {
    allowDiscussion: boolean;
    consensusRequired: boolean;
    prioritizationMethod: 'voting' | 'ranking' | 'scoring';
  };
}

// Diary Study Configuration
export interface DiaryStudyConfig extends BaseMethodConfig {
  methodType: 'diary-study';
  studyDuration: {
    lengthInDays: number;
    entriesPerDay: number;
    flexibleSchedule: boolean;
  };
  entryFormat: {
    allowText: boolean;
    allowPhotos: boolean;
    allowAudio: boolean;
    allowVideo: boolean;
    structuredPrompts: boolean;
  };
  reminders: {
    enabled: boolean;
    frequency: 'daily' | 'twice-daily' | 'custom';
    customSchedule?: string[];
    reminderMethod: 'email' | 'sms' | 'push' | 'all';
  };
  privacyControls: {
    allowAnonymousEntries: boolean;
    dataRetentionPeriod: number; // in days
    participantDataControl: boolean;
  };
}

// Click Stream Analysis Configuration
export interface ClickStreamAnalysisConfig extends BaseMethodConfig {
  methodType: 'click-stream-analysis';
  trackingScope: {
    pages: string[];
    excludePages: string[];
    trackSubdomains: boolean;
  };
  eventTracking: {
    clicks: boolean;
    scrolling: boolean;
    formInteractions: boolean;
    pageViews: boolean;
    timeOnPage: boolean;
    exitPoints: boolean;
  };
  dataProcessing: {
    sessionTimeoutMinutes: number;
    excludeBots: boolean;
    anonymizeIPs: boolean;
    sessionReplay: boolean;
  };
  analysisSettings: {
    pathAnalysis: boolean;
    funnelAnalysis: boolean;
    heatmapGeneration: boolean;
    conversionTracking: boolean;
  };
}

// =============================================================================
// SUPPORTING TYPES FOR METHOD CONFIGURATIONS
// =============================================================================

// Supporting types for Survey Configuration
export interface BranchingRule {
  id: string;
  condition: {
    questionId: string;
    operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
    value: any;
  };
  action: {
    type: 'skip-to' | 'show' | 'hide' | 'end-survey';
    targetId: string;
  };
}

// Supporting types for First Click Testing
export interface ClickArea {
  id: string;
  label: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isCorrect: boolean;
}

// Supporting types for Prototype Testing
export interface PrototypeVersion {
  id: string;
  name: string;
  url: string;
  description: string;
  version: string;
}

// Supporting types for A/B Testing
export interface TestVariant {
  id: string;
  name: string;
  description: string;
  url: string;
  changes: string[];
}

export interface SuccessMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'performance' | 'satisfaction';
  measurement: 'rate' | 'count' | 'duration' | 'score';
  targetValue: number;
  improvementThreshold: number;
}

export interface StopCriteria {
  confidenceReached: boolean;
  maxDuration: number; // in days
  maxParticipants: number;
  significantResult: boolean;
  riskThreshold: number;
}

// Supporting types for Cognitive Walkthrough
export interface CognitiveAction {
  id: string;
  description: string;
  expectedOutcome: string;
  evaluationCriteria: string[];
}

export interface CognitiveQuestion {
  id: string;
  category: 'goal-formation' | 'action-planning' | 'action-execution' | 'outcome-evaluation';
  question: string;
  expectedAnswer: string;
}

// Supporting types for Heuristic Evaluation
export interface Heuristic {
  id: string;
  title: string;
  description: string;
  category: string;
  evaluationCriteria: string[];
}

// =============================================================================
// ENHANCED RESEARCH METHOD METADATA DEFINITIONS
// =============================================================================

// Pre-defined metadata for each research method type
export const RESEARCH_METHOD_METADATA: Record<ResearchMethodType, ResearchMethodMeta> = {
  'card-sorting': {
    type: 'card-sorting',
    category: 'information-architecture',
    complexity: 'simple',
    estimatedDuration: { min: 15, max: 45, average: 25 },
    participantRequirements: { 
      minParticipants: 15, 
      maxParticipants: 50, 
      recommendedParticipants: 30,
      skillLevel: 'any' 
    },
    dataTypes: ['categorical-relationships', 'mental-models', 'similarity-matrix'],
    compatibleMethods: ['tree-testing', 'survey', 'first-click-testing'],
    prerequisites: ['defined-content-items', 'target-audience']
  },
  'tree-testing': {
    type: 'tree-testing',
    category: 'information-architecture',
    complexity: 'moderate',
    estimatedDuration: { min: 10, max: 30, average: 15 },
    participantRequirements: { 
      minParticipants: 10, 
      maxParticipants: 30, 
      recommendedParticipants: 20,
      skillLevel: 'any' 
    },
    dataTypes: ['navigation-paths', 'success-rates', 'time-to-find'],
    compatibleMethods: ['card-sorting', 'first-click-testing', 'usability-testing'],
    prerequisites: ['information-hierarchy', 'specific-tasks']
  },
  'survey': {
    type: 'survey',
    category: 'user-research',
    complexity: 'moderate',
    estimatedDuration: { min: 5, max: 60, average: 15 },
    participantRequirements: { 
      minParticipants: 30, 
      maxParticipants: 1000, 
      recommendedParticipants: 100,
      skillLevel: 'any' 
    },
    dataTypes: ['quantitative-responses', 'qualitative-feedback', 'demographics'],
    compatibleMethods: ['usability-testing', 'card-sorting', 'diary-study'],
    prerequisites: ['research-questions', 'target-audience']
  },
  'accessibility-audit': {
    type: 'accessibility-audit',
    category: 'accessibility',
    complexity: 'expert',
    estimatedDuration: { min: 60, max: 480, average: 180 },
    participantRequirements: { 
      minParticipants: 3, 
      maxParticipants: 15, 
      recommendedParticipants: 5,
      skillLevel: 'expert' 
    },
    dataTypes: ['compliance-scores', 'barrier-identification', 'recommendations'],
    compatibleMethods: ['usability-testing', 'heuristic-evaluation'],
    prerequisites: ['accessibility-guidelines', 'technical-access']
  },
  'design-system-review': {
    type: 'design-system-review',
    category: 'design-validation',
    complexity: 'expert',
    estimatedDuration: { min: 90, max: 300, average: 180 },
    participantRequirements: { 
      minParticipants: 5, 
      maxParticipants: 20, 
      recommendedParticipants: 10,
      skillLevel: 'intermediate' 
    },
    dataTypes: ['usability-scores', 'consistency-metrics', 'adoption-data'],
    compatibleMethods: ['survey', 'prototype-testing', 'usability-testing'],
    prerequisites: ['design-system', 'stakeholder-access']
  },
  'video-analysis': {
    type: 'video-analysis',
    category: 'analytics',
    complexity: 'complex',
    estimatedDuration: { min: 30, max: 120, average: 60 },
    participantRequirements: { 
      minParticipants: 10, 
      maxParticipants: 50, 
      recommendedParticipants: 20,
      skillLevel: 'any' 
    },
    dataTypes: ['behavioral-patterns', 'attention-data', 'interaction-sequences'],
    compatibleMethods: ['usability-testing', 'prototype-testing'],
    prerequisites: ['recording-capability', 'privacy-consent']
  },
  'user-interview': {
    type: 'user-interview',
    category: 'user-research',
    complexity: 'moderate',
    estimatedDuration: { min: 30, max: 90, average: 60 },
    participantRequirements: { 
      minParticipants: 5, 
      maxParticipants: 20, 
      recommendedParticipants: 8,
      skillLevel: 'any' 
    },
    dataTypes: ['qualitative-insights', 'user-needs', 'behavioral-patterns'],
    compatibleMethods: ['diary-study', 'survey', 'usability-testing'],
    prerequisites: ['interview-guide', 'recruitment-criteria']
  },
  'usability-testing': {
    type: 'usability-testing',
    category: 'usability-testing',
    complexity: 'moderate',
    estimatedDuration: { min: 30, max: 90, average: 60 },
    participantRequirements: { 
      minParticipants: 5, 
      maxParticipants: 15, 
      recommendedParticipants: 8,
      skillLevel: 'any' 
    },
    dataTypes: ['task-completion', 'error-rates', 'satisfaction-scores', 'behavioral-observations'],
    compatibleMethods: ['survey', 'video-analysis', 'prototype-testing'],
    prerequisites: ['testable-interface', 'task-scenarios']
  },
  'first-click-testing': {
    type: 'first-click-testing',
    category: 'usability-testing',
    complexity: 'simple',
    estimatedDuration: { min: 5, max: 15, average: 8 },
    participantRequirements: { 
      minParticipants: 20, 
      maxParticipants: 100, 
      recommendedParticipants: 30,
      skillLevel: 'any' 
    },
    dataTypes: ['click-coordinates', 'success-rates', 'time-to-click'],
    compatibleMethods: ['tree-testing', 'usability-testing', 'five-second-test'],
    prerequisites: ['interface-mockup', 'clear-tasks']
  },
  'five-second-test': {
    type: 'five-second-test',
    category: 'design-validation',
    complexity: 'simple',
    estimatedDuration: { min: 3, max: 10, average: 5 },
    participantRequirements: { 
      minParticipants: 15, 
      maxParticipants: 50, 
      recommendedParticipants: 25,
      skillLevel: 'any' 
    },
    dataTypes: ['first-impressions', 'recall-accuracy', 'comprehension-scores'],
    compatibleMethods: ['first-click-testing', 'survey', 'prototype-testing'],
    prerequisites: ['design-mockup', 'testing-questions']
  },
  'prototype-testing': {
    type: 'prototype-testing',
    category: 'design-validation',
    complexity: 'moderate',
    estimatedDuration: { min: 20, max: 60, average: 40 },
    participantRequirements: { 
      minParticipants: 8, 
      maxParticipants: 25, 
      recommendedParticipants: 12,
      skillLevel: 'any' 
    },
    dataTypes: ['interaction-feedback', 'usability-scores', 'design-preferences'],
    compatibleMethods: ['usability-testing', 'survey', 'five-second-test'],
    prerequisites: ['working-prototype', 'feedback-framework']
  },
  'a-b-testing': {
    type: 'a-b-testing',
    category: 'analytics',
    complexity: 'complex',
    estimatedDuration: { min: 1440, max: 14400, average: 7200 }, // in minutes (1 day to 10 days)
    participantRequirements: { 
      minParticipants: 100, 
      maxParticipants: 10000, 
      recommendedParticipants: 1000,
      skillLevel: 'any' 
    },
    dataTypes: ['conversion-rates', 'statistical-significance', 'behavioral-metrics'],
    compatibleMethods: ['click-stream-analysis', 'survey', 'usability-testing'],
    prerequisites: ['multiple-variants', 'tracking-infrastructure', 'success-metrics']
  },
  'moderated-testing': {
    type: 'moderated-testing',
    category: 'usability-testing',
    complexity: 'moderate',
    estimatedDuration: { min: 45, max: 120, average: 75 },
    participantRequirements: { 
      minParticipants: 5, 
      maxParticipants: 12, 
      recommendedParticipants: 8,
      skillLevel: 'any' 
    },
    dataTypes: ['qualitative-feedback', 'task-performance', 'behavioral-observations'],
    compatibleMethods: ['survey', 'video-analysis', 'unmoderated-testing'],
    prerequisites: ['moderator-training', 'testing-environment', 'session-plan']
  },
  'unmoderated-testing': {
    type: 'unmoderated-testing',
    category: 'usability-testing',
    complexity: 'simple',
    estimatedDuration: { min: 20, max: 60, average: 35 },
    participantRequirements: { 
      minParticipants: 10, 
      maxParticipants: 50, 
      recommendedParticipants: 20,
      skillLevel: 'any' 
    },
    dataTypes: ['task-completion', 'error-logs', 'interaction-data'],
    compatibleMethods: ['moderated-testing', 'survey', 'click-stream-analysis'],
    prerequisites: ['automated-instructions', 'tracking-setup']
  },
  'cognitive-walkthrough': {
    type: 'cognitive-walkthrough',
    category: 'usability-testing',
    complexity: 'expert',
    estimatedDuration: { min: 90, max: 240, average: 150 },
    participantRequirements: { 
      minParticipants: 3, 
      maxParticipants: 8, 
      recommendedParticipants: 5,
      skillLevel: 'expert' 
    },
    dataTypes: ['cognitive-barriers', 'interaction-gaps', 'usability-issues'],
    compatibleMethods: ['heuristic-evaluation', 'usability-testing'],
    prerequisites: ['interface-specification', 'user-goals', 'expert-evaluators']
  },
  'heuristic-evaluation': {
    type: 'heuristic-evaluation',
    category: 'usability-testing',
    complexity: 'expert',
    estimatedDuration: { min: 60, max: 180, average: 120 },
    participantRequirements: { 
      minParticipants: 3, 
      maxParticipants: 10, 
      recommendedParticipants: 5,
      skillLevel: 'expert' 
    },
    dataTypes: ['heuristic-violations', 'severity-ratings', 'improvement-recommendations'],
    compatibleMethods: ['cognitive-walkthrough', 'usability-testing', 'accessibility-audit'],
    prerequisites: ['heuristic-set', 'interface-access', 'expert-evaluators']
  },
  'diary-study': {
    type: 'diary-study',
    category: 'user-research',
    complexity: 'complex',
    estimatedDuration: { min: 10080, max: 43200, average: 20160 }, // in minutes (1 week to 1 month)
    participantRequirements: { 
      minParticipants: 8, 
      maxParticipants: 30, 
      recommendedParticipants: 15,
      skillLevel: 'any' 
    },
    dataTypes: ['longitudinal-behavior', 'contextual-insights', 'usage-patterns'],
    compatibleMethods: ['user-interview', 'survey', 'click-stream-analysis'],
    prerequisites: ['diary-platform', 'participant-commitment', 'reminder-system']
  },
  'click-stream-analysis': {
    type: 'click-stream-analysis',
    category: 'analytics',
    complexity: 'complex',
    estimatedDuration: { min: 1440, max: 43200, average: 10080 }, // in minutes (1 day to 1 month)
    participantRequirements: { 
      minParticipants: 100, 
      maxParticipants: 100000, 
      recommendedParticipants: 1000,
      skillLevel: 'any' 
    },
    dataTypes: ['navigation-patterns', 'conversion-funnels', 'user-journeys'],
    compatibleMethods: ['a-b-testing', 'usability-testing', 'diary-study'],
    prerequisites: ['analytics-tracking', 'sufficient-traffic', 'data-privacy-compliance']
  },
  'your-new-method': {
    type: 'your-new-method',
    category: 'user-research',
    complexity: 'moderate',
    estimatedDuration: { min: 30, max: 90, average: 60 },
    participantRequirements: { 
      minParticipants: 5, 
      maxParticipants: 20, 
      recommendedParticipants: 10,
      skillLevel: 'any' 
    },
    dataTypes: ['custom-data', 'user-feedback'],
    compatibleMethods: ['survey', 'user-interview'],
    prerequisites: ['method-definition', 'participant-instructions']
  }
};

// =============================================================================
// METHOD-SPECIFIC ENHANCED TYPES
// =============================================================================

export interface Card {
  id: number;
  text: string;
  metadata?: {
    complexity?: 'low' | 'medium' | 'high';
    category?: string;
    priority?: number;
    tags?: string[];
  };
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

export interface TreeNode {
  id: number;
  name: string;
  children: TreeNode[];
  metadata?: {
    depth?: number;
    isLeaf?: boolean;
    path?: string[];
  };
}

export interface StudyResult {
  participantId: string;
  studyId: number;
  startTime: number;
  endTime: number;
  duration: number;
  results: any; // Method-specific results (backward compatibility)
  metadata?: {
    userAgent?: string;
    screenSize?: { width: number; height: number };
    device?: 'desktop' | 'tablet' | 'mobile';
    ipAddress?: string;
    sessionId?: string;
    timezone?: string;
    language?: string;
  };
  
  // Enhanced result data
  participantData?: ParticipantData;
  qualityMetrics?: DataQualityMetrics;
  behaviorMetrics?: ParticipantBehaviorMetrics;
  customResponses?: Record<string, any>;
}

// =============================================================================
// COMPREHENSIVE PARTICIPANT AND RESULT TYPES
// =============================================================================

export interface ParticipantData {
  id: string;
  anonymousId?: string;
  email?: string;
  demographics?: Demographics;
  screeningResponses?: Record<string, any>;
  customFieldResponses?: Record<string, any>;
  consentTimestamp?: number;
  status: ParticipantStatus;
  
  // Participation history
  studyHistory?: ParticipantStudyHistory[];
  totalStudiesCompleted?: number;
  averageCompletionTime?: number;
  reliabilityScore?: number;
}

export interface Demographics {
  age?: number;
  ageRange?: string;
  gender?: string;
  occupation?: string;
  industry?: string;
  experience?: string;
  education?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  techSavviness?: 'low' | 'medium' | 'high';
}

export interface ParticipantStudyHistory {
  studyId: number;
  studyType: ResearchMethodType;
  completedAt: number;
  duration: number;
  qualityScore?: number;
}

export interface DataQualityMetrics {
  completeness: number; // 0-1 scale
  consistency: number; // 0-1 scale
  validity: number; // 0-1 scale
  reliability: number; // 0-1 scale
  
  flags: QualityFlag[];
  overallScore: number;
  recommendations: string[];
}

export interface QualityFlag {
  type: 'warning' | 'error' | 'info';
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  affectedData?: string[];
}

export interface ParticipantBehaviorMetrics {
  totalInteractions: number;
  averageTimePerInteraction: number;
  hesitationCount: number;
  backtrackCount: number;
  idleTime: number;
  focusLossCount: number;
  
  // Interaction patterns
  interactionSequence: InteractionEvent[];
  engagementScore: number;
  frustrationIndicators: string[];
}

export interface InteractionEvent {
  timestamp: number;
  type: 'click' | 'drag' | 'scroll' | 'hover' | 'focus' | 'blur' | 'keypress';
  target?: string;
  coordinates?: { x: number; y: number };
  duration?: number;
  value?: any;
}

// Survey Research Types
export interface SurveyQuestion {
  id: string;
  type: 'multiple-choice' | 'rating-scale' | 'text' | 'boolean' | 'ranking';
  question: string;
  required: boolean;
  options?: SurveyOption[];
  scale?: { min: number; max: number; labels?: string[] };
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface SurveyOption {
  id: string;
  text: string;
  value: any;
}

export interface SurveyResponse {
  participantId: string;
  studyId: number;
  questionId: string;
  response: any;
  responseTime: number;
  timestamp: number;
}

export interface SurveyResult {
  participantId: string;
  studyId: number;
  responses: SurveyResponse[];
  completionTime: number;
  demographics?: {
    age?: number;
    gender?: string;
    experience?: string;
    role?: string;
  };
  // Nested results property to match usage in SurveyAnalytics
  results?: {
    responses?: SurveyResponse[];
    completionTime?: number;
  };
}

// Accessibility Audit Types
export interface AccessibilityGuideline {
  id: string;
  principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
  level: 'A' | 'AA' | 'AAA';
  title: string;
  description: string;
  successCriteria: string[];
  testingMethods: string[];
}

export interface AccessibilityResult {
  participantId: string;
  studyId: number;
  evaluations: AccessibilityEvaluation[];
  overallScore: number;
  completionTime: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  assistiveTechnology?: string;
}

export interface AccessibilityEvaluation {
  guidelineId: string;
  status: 'pass' | 'fail' | 'not-applicable' | 'needs-review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  findings: string[];
  recommendations: string[];
  evidence?: {
    screenshots?: string[];
    codeSnippets?: string[];
    userQuotes?: string[];
  };
}

// Design System Types
export interface DesignSystemComponent {
  id: string;
  name: string;
  category: 'atoms' | 'molecules' | 'organisms' | 'templates' | 'pages';
  description: string;
  status: 'stable' | 'beta' | 'deprecated' | 'planned';
  usage: {
    frequency: number;
    contexts: string[];
    variations: ComponentVariation[];
  };
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA';
    keyboardSupport: boolean;
    screenReaderSupport: boolean;
    highContrastSupport: boolean;
  };
}

export interface ComponentVariation {
  id: string;
  name: string;
  properties: Record<string, any>;
  usageCount: number;
}

export interface DesignSystemResult {
  participantId: string;
  studyId: number;
  componentEvaluations: ComponentEvaluation[];
  overallSatisfaction: number;
  adoptionMetrics: {
    componentsUsed: string[];
    customImplementations: number;
    timeToImplement: number;
  };
}

export interface ComponentEvaluation {
  componentId: string;
  usability: number;
  consistency: number;
  documentation: number;
  accessibility: number;
  feedback: string;
  improvementSuggestions: string[];
}

// Video Analysis Types (AI-powered) - Simplified for Sprint 1.1
// Full AI analysis will be implemented in later sprints

export interface AttentionPoint {
  timestamp: number;
  x: number;
  y: number;
  duration: number;
  confidence: number;
}

export interface InteractionPattern {
  type: 'click' | 'scroll' | 'hover' | 'type' | 'gesture';
  timestamp: number;
  coordinates: { x: number; y: number };
  element?: string;
  success: boolean;
}

export interface EmotionData {
  timestamp: number;
  emotions: {
    positive: number;
    negative: number;
    neutral: number;
    confusion: number;
    frustration: number;
  };
  confidence: number;
}

export interface UsabilityMetric {
  metric: 'task-completion' | 'error-rate' | 'efficiency' | 'satisfaction';
  value: number;
  benchmark?: number;
  trend: 'improving' | 'declining' | 'stable';
}

// Cross-Method Analysis Types
export interface CrossMethodAnalysis {
  studyIds: number[];
  correlations: MethodCorrelation[];
  patterns: CrossMethodPattern[];
  insights: {
    convergentFindings: string[];
    divergentFindings: string[];
    recommendations: string[];
  };
  confidence: number;
}

export interface MethodCorrelation {
  method1: string;
  method2: string;
  correlation: number;
  significance: number;
  sharedParticipants: number;
}

export interface CrossMethodPattern {
  patternType: 'behavioral' | 'preference' | 'performance' | 'satisfaction';
  description: string;
  supportingMethods: string[];
  strength: 'weak' | 'moderate' | 'strong';
  implications: string[];
}

// Performance and Analytics Types
export interface AnalyticsMetadata {
  datasetSize: number;
  processingTime: number;
  optimizationLevel: 'none' | 'basic' | 'advanced';
  cacheStatus: 'hit' | 'miss' | 'partial';
  visualizationComplexity: 'low' | 'medium' | 'high';
}

export interface DataValidationResult {
  isValid: boolean;
  completeness: number;
  consistency: number;
  outliers: number;
  missingData: string[];
  qualityScore: number;
}

// Export Utilities Types
export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'svg' | 'png';
  includeMetadata: boolean;
  includeVisualizations: boolean;
  filterByMethod?: string[];
  dateRange?: { start: Date; end: Date };
  aggregationLevel?: 'participant' | 'study' | 'method';
}

export interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  downloadUrl?: string;
  error?: string;
}

// =============================================================================
// API AND DATA LAYER ARCHITECTURE
// =============================================================================

// API Response structures
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: number;
    requestId: string;
    version: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  stack?: string; // Only in development
}

// Data persistence and synchronization
export interface DataSyncConfig {
  enableSync: boolean;
  syncInterval: number; // in milliseconds
  conflictResolution: 'client-wins' | 'server-wins' | 'manual';
  offlineSupport: boolean;
  compressionEnabled: boolean;
}

export interface DataStore {
  type: 'localStorage' | 'indexedDB' | 'remote' | 'hybrid';
  config: DataStoreConfig;
  encryption?: {
    enabled: boolean;
    algorithm: string;
    keyId: string;
  };
}

export interface DataStoreConfig {
  maxSize?: number; // in MB
  retentionDays?: number;
  autoCleanup?: boolean;
  backupEnabled?: boolean;
  migrationVersion?: string;
}

// Migration and versioning
export interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  steps: MigrationStep[];
  rollbackSteps: MigrationStep[];
  dryRun?: boolean;
}

export interface MigrationStep {
  id: string;
  description: string;
  type: 'data-transform' | 'schema-change' | 'index-creation' | 'cleanup';
  execute: (data: any) => Promise<any>;
  rollback?: (data: any) => Promise<any>;
  validation?: (data: any) => boolean;
}

// =============================================================================
// PLUGIN AND EXTENSIBILITY ARCHITECTURE
// =============================================================================

export interface ResearchMethodPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Plugin capabilities
  methodType: ResearchMethodType;
  supportedFeatures: string[];
  dependencies?: string[];
  
  // Plugin lifecycle hooks
  initialize?: () => Promise<void>;
  cleanup?: () => Promise<void>;
  
  // Component providers
  studyConfigComponent?: React.ComponentType<any>;
  participantComponent?: React.ComponentType<any>;
  resultsComponent?: React.ComponentType<any>;
  analyticsComponent?: React.ComponentType<any>;
  
  // Data handlers
  validateStudyConfig?: (config: any) => ValidationResult;
  processResults?: (results: any) => ProcessedResults;
  generateAnalytics?: (results: any[]) => AnalyticsData;
  
  // Export handlers
  exportFormats?: ExportFormat[];
  customExporter?: (data: any, format: string) => Promise<ExportResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ProcessedResults {
  rawData: any;
  processedData: any;
  qualityMetrics: DataQualityMetrics;
  insights: string[];
}

export interface AnalyticsData {
  summary: any;
  charts: ChartConfig[];
  tables: TableConfig[];
  insights: AnalyticsInsight[];
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'tree' | 'network' | 'histogram';
  title: string;
  data: any;
  options?: any;
}

export interface TableConfig {
  id: string;
  title: string;
  columns: TableColumn[];
  data: any[];
  options?: {
    sortable?: boolean;
    filterable?: boolean;
    exportable?: boolean;
  };
}

export interface TableColumn {
  key: string;
  title: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: any) => string;
}

export interface AnalyticsInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  confidence: number;
  recommendations?: string[];
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
  options?: any;
}

// =============================================================================
// APPLICATION CONFIGURATION TYPES
// =============================================================================

export interface AppConfig {
  // Application metadata
  version: string;
  buildDate: string;
  environment: 'development' | 'staging' | 'production';
  
  // Feature flags
  features: FeatureFlags;
  
  // Data layer configuration
  dataStore: DataStore;
  syncConfig: DataSyncConfig;
  
  // API configuration
  apiEndpoint?: string;
  apiKey?: string;
  rateLimiting?: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  
  // UI/UX configuration
  theme: ThemeConfig;
  accessibility: AccessibilityConfig;
  
  // Analytics and monitoring
  analytics?: {
    enabled: boolean;
    trackingId?: string;
    customEvents?: boolean;
  };
  
  // Security settings
  security: SecurityConfig;
}

export interface FeatureFlags {
  multiMethodStudies: boolean;
  realTimeCollaboration: boolean;
  videoAnalysis: boolean;
  aiInsights: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhookIntegration: boolean;
  ssoAuthentication: boolean;
  dataExportScheduling: boolean;
  participantScreening: boolean;
  customFields: boolean;
  workflowAutomation: boolean;
  qualityValidation: boolean;
  crossMethodAnalysis: boolean;
}

export interface ThemeConfig {
  defaultTheme: 'light' | 'dark' | 'auto';
  customThemes?: Record<string, any>;
  allowUserCustomization: boolean;
}

export interface AccessibilityConfig {
  enforceWCAG: boolean;
  level: 'A' | 'AA' | 'AAA';
  features: {
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
    reducedMotion: boolean;
    fontSize: boolean;
  };
}

export interface SecurityConfig {
  dataEncryption: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  requireStrongPasswords: boolean;
  twoFactorAuth: boolean;
  auditLogging: boolean;
}

// =============================================================================
// VIDEO ANALYSIS SPECIFIC TYPES
// =============================================================================

export interface VideoFile {
  id: string;
  name: string;
  originalName: string;
  size: number; // in bytes
  duration: number; // in seconds
  format: string; // e.g., 'mp4', 'webm', 'avi'
  resolution: VideoResolution;
  frameRate: number;
  uploadedAt: number; // timestamp
  url: string; // local URL for uploaded file
  thumbnail?: string; // thumbnail image URL
  metadata: VideoFileMetadata;
  processingStatus: 'uploading' | 'processing' | 'ready' | 'error';
  processingError?: string;
}

export interface VideoResolution {
  width: number;
  height: number;
  quality: 'low' | 'medium' | 'high' | 'hd' | '4k';
}

export interface VideoFileMetadata {
  codec?: string;
  bitrate?: number;
  hasAudio: boolean;
  hasSubtitles: boolean;
  chapters?: VideoChapter[];
  tags?: string[];
  description?: string;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  description?: string;
}

export interface VideoStudySettings {
  // Playback settings
  autoPlay: boolean;
  showControls: boolean;
  allowSeek: boolean;
  allowSpeedChange: boolean;
  allowFullscreen: boolean;
  
  // Analysis settings  
  enableTimestamping: boolean;
  requiredWatchPercentage: number; // 0-100, percentage that must be watched
  allowRewatch: boolean;
  maxRewatchCount?: number;
  
  // Annotation settings
  enableAnnotations: boolean;
  annotationTypes: VideoAnnotationType[];
  requireAnnotations: boolean;
  minAnnotations?: number;
  
  // Quality control
  trackViewingBehavior: boolean;
  detectSkipping: boolean;
  minimumViewingTime?: number; // in seconds
  
  // Participant experience
  showProgressBar: boolean;
  showTimestamp: boolean;
  pauseOnAnnotation: boolean;
}

export type VideoAnnotationType = 
  | 'timestamp-comment'
  | 'region-highlight' 
  | 'emotion-rating'
  | 'usability-issue'
  | 'comprehension-note'
  | 'suggestion';

export interface VideoAnnotation {
  id: string;
  participantId: string;
  timestamp: number; // in seconds
  type: VideoAnnotationType;
  content: string;
  coordinates?: { x: number; y: number; width?: number; height?: number }; // for region highlights
  rating?: number; // for emotion ratings or severity scores
  tags?: string[];
  createdAt: number; // timestamp
}

export interface VideoPlaybackEvent {
  id: string;
  participantId: string;
  eventType: 'play' | 'pause' | 'seek' | 'speed-change' | 'fullscreen-toggle' | 'volume-change';
  timestamp: number; // video timestamp in seconds
  eventTimestamp: number; // real timestamp when event occurred
  previousValue?: any; // for speed/volume changes
  newValue?: any; // for speed/volume changes
  seekFrom?: number; // for seek events
  seekTo?: number; // for seek events
}

export interface VideoAnalysisResult {
  participantId: string;
  studyId: number;
  videoId: string;
  
  // Viewing behavior
  totalWatchTime: number; // actual time spent watching
  completionPercentage: number; // 0-100
  rewatchCount: number;
  averagePlaybackSpeed: number;
  
  // Interaction data
  playbackEvents: VideoPlaybackEvent[];
  annotations: VideoAnnotation[];
  
  // Engagement metrics
  engagementScore: number; // 0-100
  attentionSpans: AttentionSpan[];
  distractionEvents: DistractionEvent[];
  
  // Quality indicators
  skipEvents: SkipEvent[];
  qualityFlags: VideoQualityFlag[];
  
  // Completion data
  startTime: number;
  endTime: number;
  totalSessionTime: number;
  
  // Video metadata - Sprint 1.1 basic implementation
  videoMetadata: {
    duration: number;
    resolution: string; // Simplified for compatibility
    frameRate: number;
  };
}

export interface AttentionSpan {
  startTime: number;
  endTime: number;
  duration: number;
  engagementLevel: 'low' | 'medium' | 'high';
  indicators: string[]; // what suggested this attention level
}

export interface DistractionEvent {
  timestamp: number;
  type: 'tab-switch' | 'window-blur' | 'long-pause' | 'rapid-seeking';
  duration?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface SkipEvent {
  fromTimestamp: number;
  toTimestamp: number;
  skippedDuration: number;
  reason?: 'manual-seek' | 'auto-skip' | 'error-recovery';
}

export interface VideoQualityFlag {
  type: 'insufficient-watch-time' | 'excessive-rewatching' | 'suspicious-behavior' | 'technical-issues';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedTimeRange?: { start: number; end: number };
}