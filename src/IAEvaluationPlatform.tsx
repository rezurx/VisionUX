import React, { useState } from 'react';
import { Plus, Users, Download, FileText, TreePine, Layers, Clock, Target, Settings, Play, Trash2, Save, X, Link, BarChart3, Filter, Search, Grid, List, Zap } from 'lucide-react';
import { 
  Study, 
  StudyStatus, 
  ResearchMethodType, 
  MethodCategory,
  MethodComplexity,
  RESEARCH_METHOD_METADATA,
  MethodSpecificConfig,
  ResearchMethodMeta,
  CardSortingConfig,
  TreeTestingConfig,
  SurveyConfig
} from './types';
import { generateCSV } from './utils';
import ParticipantLanding from './components/participant/ParticipantLanding';
import ParticipantComplete from './components/participant/ParticipantComplete';
import ParticipantCardSort from './components/participant/ParticipantCardSort';
import ParticipantTreeTest from './components/participant/ParticipantTreeTest';
import ParticipantVideoAnalysis from './components/participant/ParticipantVideoAnalysis';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import CSVUpload from './components/study/CSVUpload';
import { AccessibilityAuditCreator, AccessibilityDashboard } from './components/accessibility';
import SurveyBuilder from './components/survey/SurveyBuilder';
import ParticipantSurvey from './components/participant/ParticipantSurvey';
import SurveyAnalytics from './components/analytics/SurveyAnalytics';
import DesignSystemMetrics from './components/analytics/DesignSystemMetrics';
import PerformanceTestRunner from './components/test/PerformanceTestRunner';
import { VideoStudyCreator } from './components/video';

const IAEvaluationPlatform = () => {
  // Check if we're in participant mode via URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialParticipantMode = urlParams.has('participant');
  const studyId = urlParams.get('study');
  
  const [participantMode, setParticipantMode] = useState(initialParticipantMode);
  const [currentView, setCurrentView] = useState(initialParticipantMode ? 'participant-landing' : 'dashboard');
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [participantStudy, setParticipantStudy] = useState<Study | null>(null);
  const [participantId, setParticipantId] = useState<string>('');
  const [participantStartTime, setParticipantStartTime] = useState<number>(0);
  
  // Enhanced study management state
  const [studyFilters, setStudyFilters] = useState<{
    category: MethodCategory | 'all';
    complexity: MethodComplexity | 'all';
    status: StudyStatus | 'all';
    searchTerm: string;
  }>({
    category: 'all',
    complexity: 'all', 
    status: 'all',
    searchTerm: ''
  });
  const [studyViewMode, setStudyViewMode] = useState<'grid' | 'list'>('list');
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  
  // Load studies from localStorage or use defaults
  const getInitialStudies = (): Study[] => {
    try {
      const saved = localStorage.getItem('ia-evaluator-studies');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading studies from localStorage:', error);
    }
    
    // Enhanced default studies with comprehensive metadata
    return [
    {
      id: 1,
      name: 'E-commerce Navigation Study',
      type: 'card-sorting' as const,
      status: 'active' as const,
      participants: 15,
      completion: 73,
      created: '2025-01-15',
      updated: '2025-01-15',
      methodMeta: RESEARCH_METHOD_METADATA['card-sorting'],
      configuration: { 
        maxParticipants: 50,
        minParticipants: 15,
        recruitmentStrategy: 'open',
        collectDemographics: true,
        consentRequired: true
      },
      methodConfig: {
        methodType: 'card-sorting',
        version: '1.0',
        sortType: 'closed',
        allowCustomCategories: false,
        shuffleCards: true,
        showCardNumbers: false,
        allowUncategorized: true,
        cardDisplayMode: 'text'
      } as CardSortingConfig,
      settings: { 
        theme: 'default',
        showProgress: true,
        allowPause: true,
        allowBacktrack: false,
        shuffleOrder: false,
        autoSave: true,
        saveInterval: 30,
        defaultExportFormat: 'csv'
      },
      metadata: { 
        version: '2.0.0',
        tags: ['navigation', 'ecommerce', 'information-architecture'],
        createdBy: 'demo',
        viewCount: 45,
        startCount: 23,
        completionRate: 0.73,
        averageDuration: 1500000
      },
      cards: [
        { id: 1, text: 'Product Reviews', metadata: { complexity: 'low', category: 'content' } },
        { id: 2, text: 'Shipping Info', metadata: { complexity: 'medium', category: 'service' } },
        { id: 3, text: 'Return Policy', metadata: { complexity: 'medium', category: 'policy' } },
        { id: 4, text: 'Size Guide', metadata: { complexity: 'low', category: 'content' } }
      ],
      categories: [
        { id: 1, name: 'Shopping', description: 'Product-related content' },
        { id: 2, name: 'Support', description: 'Customer service content' },
        { id: 3, name: 'Account', description: 'User account management' }
      ]
    },
    {
      id: 2,
      name: 'Corporate Intranet Tree Test',
      type: 'tree-testing' as const,
      status: 'completed' as const,
      participants: 24,
      completion: 100,
      created: '2025-01-10',
      updated: '2025-01-15',
      methodMeta: RESEARCH_METHOD_METADATA['tree-testing'],
      configuration: { 
        maxParticipants: 30,
        minParticipants: 10,
        recruitmentStrategy: 'invite-only',
        estimatedDuration: 15,
        collectDemographics: true
      },
      methodConfig: {
        methodType: 'tree-testing',
        version: '1.0',
        showBreadcrumbs: true,
        allowBacktracking: true,
        showSearchFunctionality: false,
        maxDepthLevels: 4,
        taskSuccessCriteria: {
          correctPath: ['Departments', 'HR', 'Policies'],
          timeLimit: 300
        }
      } as TreeTestingConfig,
      settings: { 
        theme: 'default',
        showProgress: true,
        allowPause: false,
        allowBacktrack: true,
        shuffleOrder: false,
        autoSave: true,
        saveInterval: 15
      },
      metadata: { 
        version: '2.0.0',
        tags: ['tree-testing', 'intranet', 'findability'],
        createdBy: 'demo',
        completionRate: 1.0,
        averageDuration: 900000,
        dataQualityScore: 0.95
      },
      treeStructure: [
        { id: 1, name: 'Home', children: [], metadata: { depth: 0, isLeaf: true } },
        { id: 2, name: 'Departments', children: [
          { id: 3, name: 'HR', children: [
            { id: 5, name: 'Policies', children: [], metadata: { depth: 2, isLeaf: true } }
          ], metadata: { depth: 1, isLeaf: false } },
          { id: 4, name: 'IT', children: [], metadata: { depth: 1, isLeaf: true } }
        ], metadata: { depth: 0, isLeaf: false }}
      ],
      task: 'Find the employee handbook'
    }
    ];
  };

  const [studies, setStudies] = useState<Study[]>(getInitialStudies());

  // Save studies to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('ia-evaluator-studies', JSON.stringify(studies));
    } catch (error) {
      console.error('Error saving studies to localStorage:', error);
    }
  }, [studies]);

  // Utility functions for enhanced study management
  const getFilteredStudies = () => {
    return studies.filter(study => {
      // Category filter
      if (studyFilters.category !== 'all' && study.methodMeta.category !== studyFilters.category) {
        return false;
      }
      
      // Complexity filter  
      if (studyFilters.complexity !== 'all' && study.methodMeta.complexity !== studyFilters.complexity) {
        return false;
      }
      
      // Status filter
      if (studyFilters.status !== 'all' && study.status !== studyFilters.status) {
        return false;
      }
      
      // Search term filter
      if (studyFilters.searchTerm && !study.name.toLowerCase().includes(studyFilters.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  const getMethodIcon = (methodType: ResearchMethodType) => {
    const iconMap = {
      'card-sorting': Layers,
      'tree-testing': TreePine,
      'survey': FileText,
      'accessibility-audit': Target,
      'design-system-review': Grid,
      'video-analysis': Play,
      'user-interview': Users,
      'usability-testing': Settings,
      'first-click-testing': Target,
      'five-second-test': Clock,
      'prototype-testing': Play,
      'a-b-testing': BarChart3,
      'moderated-testing': Users,
      'unmoderated-testing': Settings,
      'cognitive-walkthrough': Target,
      'heuristic-evaluation': Settings,
      'diary-study': FileText,
      'click-stream-analysis': BarChart3
    };
    return iconMap[methodType] || Settings;
  };

  const getMethodColor = (category: MethodCategory) => {
    const colorMap = {
      'information-architecture': 'blue',
      'usability-testing': 'green', 
      'user-research': 'purple',
      'accessibility': 'orange',
      'analytics': 'red',
      'design-validation': 'indigo'
    };
    return colorMap[category] || 'gray';
  };

  const createDefaultMethodConfig = (methodType: ResearchMethodType): MethodSpecificConfig => {
    switch (methodType) {
      case 'card-sorting':
        return {
          methodType: 'card-sorting',
          version: '1.0',
          sortType: 'open',
          allowCustomCategories: true,
          shuffleCards: true,
          showCardNumbers: false,
          allowUncategorized: true,
          cardDisplayMode: 'text'
        } as CardSortingConfig;
        
      case 'tree-testing':
        return {
          methodType: 'tree-testing',
          version: '1.0',
          showBreadcrumbs: true,
          allowBacktracking: true,
          showSearchFunctionality: false,
          taskSuccessCriteria: {}
        } as TreeTestingConfig;
        
      case 'survey':
        return {
          methodType: 'survey',
          version: '1.0',
          allowPartialCompletion: true,
          showProgressIndicator: true,
          randomizeQuestionOrder: false,
          randomizeOptionOrder: false,
          validationSettings: {
            requireAllRequired: true,
            allowSkipValidation: false
          },
          completionSettings: {
            showSummaryPage: true,
            allowReview: true,
            allowEdit: false
          }
        } as SurveyConfig;
        
      case 'video-analysis':
        return {
          methodType: 'video-analysis',
          version: '1.0',
          analysisTypes: ['screen-recording'],
          recordingSettings: {
            recordScreen: true,
            recordCamera: false,
            recordAudio: true,
            quality: 'high'
          },
          aiProcessing: {
            enabled: false,
            features: [],
            confidenceThreshold: 0.8
          },
          privacySettings: {
            blurFaces: false,
            maskPII: false,
            retentionPeriod: 90
          }
        } as any; // VideoAnalysisConfig
        
      case 'design-system-review':
        return {
          methodType: 'design-system-review',
          version: '1.0',
          reviewScope: ['components', 'tokens', 'patterns'],
          evaluationCriteria: {
            usability: true,
            consistency: true,
            accessibility: true,
            performance: false,
            documentation: true
          },
          componentCategories: ['atoms', 'molecules', 'organisms'],
          includeBrandCompliance: false,
          generateRecommendations: true
        } as any;
        
      default:
        return {
          methodType,
          version: '1.0'
        } as any;
    }
  };

  // Enhanced result state management for multi-method platform
  const [studyResults, setStudyResults] = useState<any>({
    'P001-demo': {
      participantId: 'P001-demo',
      studyId: 1,
      studyType: 'card-sorting',
      startTime: Date.now() - 300000,
      completionTime: Date.now() - 120000,
      totalDuration: 180000,
      cardSortResults: [
        {
          categoryId: 1,
          categoryName: 'Shopping',
          cards: [
            { id: 1, text: 'Product Reviews' },
            { id: 4, text: 'Size Guide' }
          ]
        },
        {
          categoryId: 2,
          categoryName: 'Support',
          cards: [
            { id: 2, text: 'Shipping Info' },
            { id: 3, text: 'Return Policy' }
          ]
        },
        {
          categoryId: 3,
          categoryName: 'Account',
          cards: []
        }
      ]
    },
    'P002-demo': {
      participantId: 'P002-demo',
      studyId: 1,
      studyType: 'card-sorting',
      startTime: Date.now() - 400000,
      completionTime: Date.now() - 250000,
      totalDuration: 150000,
      cardSortResults: [
        {
          categoryId: 1,
          categoryName: 'Shopping',
          cards: [
            { id: 1, text: 'Product Reviews' },
            { id: 2, text: 'Shipping Info' },
            { id: 4, text: 'Size Guide' }
          ]
        },
        {
          categoryId: 2,
          categoryName: 'Support',
          cards: [
            { id: 3, text: 'Return Policy' }
          ]
        },
        {
          categoryId: 3,
          categoryName: 'Account',
          cards: []
        }
      ]
    },
    'P003-demo': {
      participantId: 'P003-demo',
      studyId: 1,
      studyType: 'card-sorting',
      startTime: Date.now() - 500000,
      completionTime: Date.now() - 380000,
      totalDuration: 120000,
      cardSortResults: [
        {
          categoryId: 1,
          categoryName: 'Shopping',
          cards: [
            { id: 4, text: 'Size Guide' }
          ]
        },
        {
          categoryId: 2,
          categoryName: 'Support',
          cards: [
            { id: 2, text: 'Shipping Info' },
            { id: 3, text: 'Return Policy' }
          ]
        },
        {
          categoryId: 3,
          categoryName: 'Account',
          cards: [
            { id: 1, text: 'Product Reviews' }
          ]
        }
      ]
    },
    'P004-demo': {
      participantId: 'P004-demo',
      studyId: 1,
      studyType: 'card-sorting',
      startTime: Date.now() - 600000,
      completionTime: Date.now() - 450000,
      totalDuration: 150000,
      cardSortResults: [
        {
          categoryId: 1,
          categoryName: 'Shopping',
          cards: [
            { id: 1, text: 'Product Reviews' },
            { id: 4, text: 'Size Guide' }
          ]
        },
        {
          categoryId: 2,
          categoryName: 'Support',
          cards: [
            { id: 3, text: 'Return Policy' }
          ]
        },
        {
          categoryId: 3,
          categoryName: 'Account',
          cards: [
            { id: 2, text: 'Shipping Info' }
          ]
        }
      ]
    },
    'P005-demo': {
      participantId: 'P005-demo',
      studyId: 1,
      studyType: 'card-sorting',
      startTime: Date.now() - 700000,
      completionTime: Date.now() - 520000,
      totalDuration: 180000,
      cardSortResults: [
        {
          categoryId: 1,
          categoryName: 'Shopping',
          cards: [
            { id: 1, text: 'Product Reviews' },
            { id: 2, text: 'Shipping Info' },
            { id: 4, text: 'Size Guide' }
          ]
        },
        {
          categoryId: 2,
          categoryName: 'Support',
          cards: [
            { id: 3, text: 'Return Policy' }
          ]
        },
        {
          categoryId: 3,
          categoryName: 'Account',
          cards: []
        }
      ]
    }
  });

  // Additional result state for multi-method research platform
  const [surveyResults, setSurveyResults] = useState<any[]>([]);
  const [accessibilityResults, setAccessibilityResults] = useState<any[]>([]);
  const [designSystemResults, setDesignSystemResults] = useState<any[]>([]);

  const exportAllData = () => {
    if (Object.keys(studyResults).length === 0) {
      const sampleData = [
        {
          participantId: 'P001',
          studyId: 'sample-study',
          studyType: 'card-sorting',
          startTime: new Date(Date.now() - 86400000).toISOString(),
          completionTime: new Date().toISOString(),
          duration_seconds: 420
        },
        {
          participantId: 'P002', 
          studyId: 'sample-study-2',
          studyType: 'tree-testing',
          startTime: new Date(Date.now() - 172800000).toISOString(),
          completionTime: new Date(Date.now() - 172800000 + 300000).toISOString(),
          duration_seconds: 300
        }
      ];
      
      generateCSV(sampleData, 'sample_participants_data.csv');
      alert('Sample data exported! Complete some demo studies to generate real data.');
      return;
    }

    const allParticipants = Object.values(studyResults).map((result: any) => ({
      participantId: result.participantId,
      studyId: result.studyId,
      studyType: result.studyType,
      startTime: new Date(result.startTime).toISOString(),
      completionTime: new Date(result.completionTime).toISOString(),
      duration_seconds: Math.round((result.totalDuration || result.duration) / 1000)
    }));

    // Export comprehensive multi-method data
    const exportData = {
      participants: allParticipants,
      surveys: surveyResults,
      accessibility: accessibilityResults,
      designSystem: designSystemResults,
      metadata: {
        exportDate: new Date().toISOString(),
        totalParticipants: allParticipants.length,
        methodTypes: [...new Set(allParticipants.map(p => p.studyType))],
        exportVersion: '2.0.0'
      }
    };

    // Generate CSV for participants (backward compatibility)
    generateCSV(allParticipants, 'all_participants_summary.csv');
    
    // Generate JSON for comprehensive data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vision_ux_comprehensive_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Complete multi-method dataset exported! (CSV + JSON)');
  };

  const exportStudyData = (study: any) => {
    const studyInfo = [{
      studyId: study.id,
      studyName: study.name,
      studyType: study.type,
      status: study.status,
      participants: study.participants,
      completion: study.completion,
      created: study.created
    }];
    generateCSV(studyInfo, study.name.replace(/[^a-zA-Z0-9]/g, '_') + '_study_info.csv');
    alert('Study information exported!');
  };

  const deleteStudy = (studyId: number) => {
    if (confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      setStudies(prev => prev.filter(study => study.id !== studyId));
      alert('Study deleted successfully.');
    }
  };

  const toggleStudyStatus = (studyId: number) => {
    setStudies(prev => prev.map(study => {
      if (study.id === studyId) {
        const newStatus = study.status === 'draft' ? 'active' : 
                         study.status === 'active' ? 'completed' : 'draft';
        return { ...study, status: newStatus };
      }
      return study;
    }));
  };

  const openStudySettings = (study: any) => {
    setSelectedStudy(study);
    setCurrentView('study-settings');
  };
  
  const generateParticipantLink = (study: any) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const participantUrl = `${baseUrl}?participant=true&study=${study.id}`;
    
    navigator.clipboard.writeText(participantUrl).then(() => {
      alert(`Participant link copied to clipboard!\n\nLink: ${participantUrl}\n\nAccess Code: ${study.id}`);
    }).catch(() => {
      alert(`Participant Link:\n\n${participantUrl}\n\nAccess Code: ${study.id}\n\nPlease copy this link manually.`);
    });
  };

  // Navigation with mobile responsive design
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const Navigation = () => (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">IA Evaluator</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          <div className="flex space-x-6">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'dashboard' 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label="Go to Dashboard"
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('studies')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'studies' 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label="Go to Studies"
            >
              Studies
            </button>
            <button 
              onClick={() => setCurrentView('participants')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'participants' 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label="Go to Participants"
            >
              Participants
            </button>
            <button 
              onClick={() => setCurrentView('analytics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'analytics' 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label="Go to Analytics"
            >
              Analytics
            </button>
            <button 
              onClick={() => setCurrentView('performance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'performance' 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label="Go to Performance Testing"
            >
              Performance
            </button>
            <div className="border-l border-gray-200 pl-6 ml-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider mr-4 font-medium">Demo</span>
              <button 
                onClick={() => setCurrentView('card-demo')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'card-demo' 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-label="Try Card Sort Demo"
              >
                Card Sort
              </button>
              <button 
                onClick={() => setCurrentView('tree-demo')}
                className={`px-4 py-2 rounded-md text-sm font-medium ml-2 transition-all duration-200 ${
                  currentView === 'tree-demo' 
                    ? 'bg-blue-100 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-label="Try Tree Test Demo"
              >
                Tree Test
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button 
              onClick={() => setShowMethodSelector(!showMethodSelector)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2 transition-all duration-200 font-medium shadow-sm"
              aria-label="Create New Study"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Study</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showMethodSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setCurrentView('create-study');
                      setShowMethodSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Custom Study (All Methods)</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setCurrentView('create-accessibility-audit');
                      setShowMethodSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 group"
                  >
                    <Target className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Accessibility Audit</div>
                      <div className="text-xs text-gray-500">WCAG compliance testing</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('accessibility-dashboard');
                      setShowMethodSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded flex items-center space-x-2 group"
                  >
                    <BarChart3 className="w-4 h-4 text-green-500 group-hover:text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">Accessibility Dashboard</div>
                      <div className="text-xs text-gray-500">View audit results & analytics</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('design-system-analytics');
                      setShowMethodSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded flex items-center space-x-2 group"
                  >
                    <Layers className="w-4 h-4 text-purple-500 group-hover:text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Design System Analytics</div>
                      <div className="text-xs text-gray-500">Component adoption & usage metrics</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('survey-builder');
                      setShowMethodSelector(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded flex items-center space-x-2 group"
                  >
                    <FileText className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600" />
                    <div>
                      <div className="font-medium text-gray-900">Survey Builder</div>
                      <div className="text-xs text-gray-500">Create advanced surveys with logic</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('video-study-creator');
                      setShowMethodSelector(false);
                      setSelectedStudy(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 rounded flex items-center space-x-2 group"
                  >
                    <Play className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900">Video Analysis Study</div>
                      <div className="text-xs text-gray-500">Create professional video research studies</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            aria-label="Open mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
          <div className="space-y-2">
            <button 
              onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'dashboard' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => { setCurrentView('studies'); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'studies' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Studies
            </button>
            <button 
              onClick={() => { setCurrentView('participants'); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'participants' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Participants
            </button>
            <button 
              onClick={() => { setCurrentView('analytics'); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'analytics' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Analytics
            </button>
            <button 
              onClick={() => { setCurrentView('performance'); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                currentView === 'performance' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Performance
            </button>
            <div className="border-t border-gray-200 my-4 pt-4">
              <p className="px-4 text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Demo</p>
              <button 
                onClick={() => { setCurrentView('card-demo'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'card-demo' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Card Sort Demo
              </button>
              <button 
                onClick={() => { setCurrentView('tree-demo'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentView === 'tree-demo' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Tree Test Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-0">IA Evaluation Dashboard</h1>
        <p className="text-gray-600 text-sm">Welcome to your research platform</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Studies</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Participants</p>
              <p className="text-2xl font-bold text-gray-900">127</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion</p>
              <p className="text-2xl font-bold text-gray-900">84%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">12m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Studies</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {studies.map(study => (
              <div key={study.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    {study.type === 'card-sorting' ? <Layers className="w-5 h-5 text-blue-600" /> : <TreePine className="w-5 h-5 text-green-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{study.name}</h3>
                    <p className="text-sm text-gray-500">{study.participants} participants</p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto ${
                  study.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : study.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {study.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Advanced Analytics Available
        </h3>
        <div className="space-y-3 text-sm text-green-700">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium">Similarity Matrix:</span>
              <p className="text-green-600">Interactive heatmap showing card relationship patterns and co-occurrence data</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium">Dendrogram:</span>
              <p className="text-green-600">Hierarchical clustering visualization showing card relationships with D3.js</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <span className="font-medium">Rainbow Chart:</span>
              <p className="text-green-600">Category usage frequency analysis with interactive tooltips</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200">
            <button 
              onClick={() => setCurrentView('analytics')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2 text-sm font-medium transition-all duration-200 shadow-sm"
              aria-label="View Analytics Dashboard"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Analytics Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const StudiesList = () => {
    const filteredStudies = getFilteredStudies();
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Studies</h1>
            <p className="text-gray-600 mt-1">{filteredStudies.length} of {studies.length} studies</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setStudyViewMode(studyViewMode === 'list' ? 'grid' : 'list')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title={`Switch to ${studyViewMode === 'list' ? 'grid' : 'list'} view`}
            >
              {studyViewMode === 'list' ? <Grid className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
            <button 
              onClick={exportAllData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2 font-medium transition-all duration-200 shadow-sm"
              aria-label="Export all study data"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search studies..."
                  value={studyFilters.searchTerm}
                  onChange={(e) => setStudyFilters(prev => ({...prev, searchTerm: e.target.value}))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Category Filter */}
              <select
                value={studyFilters.category}
                onChange={(e) => setStudyFilters(prev => ({...prev, category: e.target.value as any}))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="information-architecture">Information Architecture</option>
                <option value="usability-testing">Usability Testing</option>
                <option value="user-research">User Research</option>
                <option value="accessibility">Accessibility</option>
                <option value="analytics">Analytics</option>
                <option value="design-validation">Design Validation</option>
              </select>

              {/* Status Filter */}
              <select
                value={studyFilters.status}
                onChange={(e) => setStudyFilters(prev => ({...prev, status: e.target.value as any}))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>

              {/* Complexity Filter */}
              <select
                value={studyFilters.complexity}
                onChange={(e) => setStudyFilters(prev => ({...prev, complexity: e.target.value as any}))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Complexity</option>
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setStudyFilters({
                category: 'all',
                complexity: 'all',
                status: 'all', 
                searchTerm: ''
              })}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Studies List/Grid */}
        {studyViewMode === 'list' ? (
          /* Desktop Table View */
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Study</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudies.map((study) => {
                  const IconComponent = getMethodIcon(study.type);
                  const methodColor = getMethodColor(study.methodMeta.category);
                  
                  return (
                    <tr key={study.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`p-2 bg-${methodColor}-100 rounded-lg mr-3 flex-shrink-0`}>
                            <IconComponent className={`w-4 h-4 text-${methodColor}-600`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{study.name}</div>
                            <div className="text-sm text-gray-500">{study.metadata.tags?.join(', ')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 capitalize">{study.type.replace('-', ' ')}</div>
                          <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                            study.methodMeta.complexity === 'simple' ? 'bg-green-100 text-green-700' :
                            study.methodMeta.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            study.methodMeta.complexity === 'complex' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {study.methodMeta.complexity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {study.methodMeta.category.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          study.status === 'active' ? 'bg-green-100 text-green-800' : 
                          study.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          study.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                          study.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {study.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900 mr-2">{study.participants}/{study.configuration.maxParticipants || 'unlimited'}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-20">
                            <div 
                              className={`bg-${methodColor}-600 h-2 rounded-full`}
                              style={{width: `${Math.min(100, (study.participants / (study.configuration.maxParticipants || study.participants)) * 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => openStudySettings(study)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-150"
                            title="Configure Study"
                            aria-label="Configure study settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          {study.type === 'survey' && (
                            <button
                              onClick={() => {
                                setSelectedStudy(study);
                                setCurrentView('survey-builder');
                              }}
                              className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-md transition-colors duration-150"
                              title="Edit Survey Questions"
                              aria-label="Edit survey questions"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          {study.type === 'video-analysis' && (
                            <button
                              onClick={() => {
                                setSelectedStudy(study);
                                setCurrentView('video-study-creator');
                              }}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-150"
                              title="Edit Video Study"
                              aria-label="Edit video study"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {study.status === 'active' && (
                            <button 
                              onClick={() => generateParticipantLink(study)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors duration-150"
                              title="Get Participant Link"
                              aria-label="Get participant link"
                            >
                              <Link className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => toggleStudyStatus(study.id)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors duration-150"
                            title={study.status === 'draft' ? 'Launch Study' : study.status === 'active' ? 'Complete Study' : 'Reopen Study'}
                            aria-label={study.status === 'draft' ? 'Launch study' : study.status === 'active' ? 'Complete study' : 'Reopen study'}
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => exportStudyData(study)}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-md transition-colors duration-150"
                            title="Export Study Data"
                            aria-label="Export study data"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {study.type === 'survey' && study.participants > 0 && (
                            <button
                              onClick={() => {
                                setSelectedStudy(study);
                                setCurrentView('survey-analytics');
                              }}
                              className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors duration-150"
                              title="View Survey Analytics"
                              aria-label="View survey analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteStudy(study.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-150"
                            title="Delete Study"
                            aria-label="Delete study"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStudies.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No studies match your current filters.</p>
                <button
                  onClick={() => setStudyFilters({category: 'all', complexity: 'all', status: 'all', searchTerm: ''})}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudies.map((study) => {
              const IconComponent = getMethodIcon(study.type);
              const methodColor = getMethodColor(study.methodMeta.category);
              
              return (
                <div key={study.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-${methodColor}-100 rounded-lg`}>
                      <IconComponent className={`w-6 h-6 text-${methodColor}-600`} />
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      study.status === 'active' ? 'bg-green-100 text-green-800' : 
                      study.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      study.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                      study.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {study.status}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{study.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 capitalize">{study.type.replace('-', ' ')}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="font-medium">{study.participants}/{study.configuration.maxParticipants || '∞'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Est. Duration:</span>
                      <span className="font-medium">{study.methodMeta.estimatedDuration.average}min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${methodColor}-600 h-2 rounded-full`}
                        style={{width: `${Math.min(100, (study.participants / (study.configuration.maxParticipants || study.participants || 1)) * 100)}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => openStudySettings(study)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      {study.type === 'survey' && (
                        <button
                          onClick={() => {
                            setSelectedStudy(study);
                            setCurrentView('survey-builder');
                          }}
                          className="p-2 text-gray-400 hover:text-orange-600 rounded-md"
                          title="Edit Survey"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {study.type === 'video-analysis' && (
                        <button
                          onClick={() => {
                            setSelectedStudy(study);
                            setCurrentView('video-study-creator');
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-md"
                          title="Edit Video Study"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {study.status === 'active' && (
                        <button 
                          onClick={() => generateParticipantLink(study)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                          title="Share"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => exportStudyData(study)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                        title="Export"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {study.type === 'survey' && study.participants > 0 && (
                        <button
                          onClick={() => {
                            setSelectedStudy(study);
                            setCurrentView('survey-analytics');
                          }}
                          className="p-2 text-gray-400 hover:text-emerald-600 rounded-md"
                          title="Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => toggleStudyStatus(study.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        study.status === 'draft' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        study.status === 'active' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                        'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {study.status === 'draft' ? 'Launch' : study.status === 'active' ? 'Complete' : 'Reopen'}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filteredStudies.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>No studies match your current filters.</p>
                <button
                  onClick={() => setStudyFilters({category: 'all', complexity: 'all', status: 'all', searchTerm: ''})}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {studies.map((study) => (
          <div key={study.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  {study.type === 'card-sorting' ? <Layers className="w-5 h-5 text-blue-600" /> : <TreePine className="w-5 h-5 text-green-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{study.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{study.type.replace('-', ' ')}</p>
                </div>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                study.status === 'active' ? 'bg-green-100 text-green-800' : 
                study.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {study.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{study.participants} participants</span>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => openStudySettings(study)}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-150"
                  title="Configure Study"
                  aria-label="Configure study settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {study.status === 'active' && (
                  <button 
                    onClick={() => generateParticipantLink(study)}
                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors duration-150"
                    title="Get Participant Link"
                    aria-label="Get participant link"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => toggleStudyStatus(study.id)}
                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors duration-150"
                  title={study.status === 'draft' ? 'Launch Study' : study.status === 'active' ? 'Complete Study' : 'Reopen Study'}
                  aria-label={study.status === 'draft' ? 'Launch study' : study.status === 'active' ? 'Complete study' : 'Reopen study'}
                >
                  <Play className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => exportStudyData(study)}
                  className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-md transition-colors duration-150"
                  title="Export Study Data"
                  aria-label="Export study data"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteStudy(study.id)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-150"
                  title="Delete Study"
                  aria-label="Delete study"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  };

  const ParticipantsView = () => {
    const handleInviteParticipants = () => {
      try {
        console.log('Starting invite process...');
        const emailInput = prompt('Enter participant email addresses (separated by commas):');
        console.log('User input:', emailInput);
        
        if (emailInput && emailInput.trim() !== '') {
          const emailList = emailInput.split(',').map(email => email.trim()).filter(email => email.length > 0);
          console.log('Processed email list:', emailList);
          
          if (emailList.length > 0) {
            const currentUrl = window.location.href;
            const participantLink = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'demo=true';
            
            const message = 'Invitation Details:\n\n' + 
                           'Participants to invite: ' + emailList.length + '\n' +
                           'Email addresses:\n' + emailList.join('\n') + '\n\n' +
                           'Participant link: ' + participantLink + '\n\n' +
                           '(In production, emails would be sent automatically)';
            
            alert(message);
            
            // Update participant counts
            setStudies(prevStudies => {
              return prevStudies.map(study => {
                if (study.status === 'active') {
                  return { ...study, participants: study.participants + emailList.length };
                }
                return study;
              });
            });
            
            console.log('Participants successfully updated');
          } else {
            alert('Please enter valid email addresses.');
          }
        } else {
          console.log('No email addresses entered');
        }
        }
      catch (error) {
        console.error('Error in invite process:', error);
        alert('There was an error processing the invitation. Please try again.');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Participants</h1>
            <p className="text-gray-600 mt-1">Manage participant invitations and track study sessions</p>
          </div>
          <button 
            onClick={handleInviteParticipants}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2 font-medium transition-all duration-200 shadow-sm"
            aria-label="Invite new participants"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Participants</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
            <p className="text-sm text-gray-600 mt-1">View participant activity and completion status</p>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Participant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Study</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-700">P1</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">p001@example.com</div>
                        <div className="text-xs text-gray-500">Participant #001</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">E-commerce Navigation Study</div>
                    <div className="text-xs text-gray-500">Card Sorting</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">14m 32s</div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden p-4">
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-700">P1</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">p001@example.com</div>
                      <div className="text-xs text-gray-500">Participant #001</div>
                    </div>
                  </div>
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Study:</div>
                    <div className="font-medium text-gray-900">E-commerce Navigation</div>
                    <div className="text-xs text-gray-500">Card Sorting</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Duration:</div>
                    <div className="font-medium text-gray-900">14m 32s</div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CreateStudy = () => {
    const [studyName, setStudyName] = useState('');
    const [studyType, setStudyType] = useState<ResearchMethodType>('card-sorting');
    const [selectedCategory, setSelectedCategory] = useState<MethodCategory>('information-architecture');
    const [showMethodDetails, setShowMethodDetails] = useState<ResearchMethodType | null>(null);

    const handleCreateStudy = () => {
      try {
        console.log('Creating study with name:', studyName, 'and type:', studyType);
        
        const methodMeta = RESEARCH_METHOD_METADATA[studyType];
        const currentDate = new Date().toISOString();
        
        const newStudy: Study = {
          id: Date.now(),
          name: studyName || 'Untitled Study',
          type: studyType,
          status: 'draft',
          participants: 0,
          completion: 0,
          created: currentDate,
          updated: currentDate,
          methodMeta,
          methodConfig: createDefaultMethodConfig(studyType),
          configuration: {
            maxParticipants: methodMeta.participantRequirements.recommendedParticipants,
            minParticipants: methodMeta.participantRequirements.minParticipants,
            recruitmentStrategy: 'open',
            allowAnonymous: true,
            collectDemographics: false,
            consentRequired: false,
            estimatedDuration: methodMeta.estimatedDuration.average
          },
          settings: {
            theme: 'default',
            showProgress: true,
            allowPause: true,
            allowBacktrack: false,
            shuffleOrder: false,
            autoSave: true,
            saveInterval: 30,
            defaultExportFormat: 'json'
          },
          metadata: {
            version: '2.0.0',
            tags: [studyType, methodMeta.category],
            createdBy: 'user'
          },
          // Initialize method-specific data based on type
          ...(studyType === 'card-sorting' && {
            cards: [
              { id: Date.now() + 1, text: 'Sample Card 1' },
              { id: Date.now() + 2, text: 'Sample Card 2' },
              { id: Date.now() + 3, text: 'Sample Card 3' }
            ],
            categories: [
              { id: Date.now() + 100, name: 'Category A' },
              { id: Date.now() + 101, name: 'Category B' }
            ]
          }),
          ...(studyType === 'tree-testing' && {
            treeStructure: [
              { id: 1, name: 'Home', children: [] }
            ],
            task: 'Find the information'
          }),
          ...(studyType === 'survey' && {
            surveyQuestions: [
              {
                id: 'q1',
                type: 'text',
                question: 'What is your main goal when visiting this website?',
                required: true
              }
            ]
          }),
          ...(studyType === 'video-analysis' && {
            videoFiles: [],
            videoSettings: {
              autoPlay: false,
              showControls: true,
              allowSeek: true,
              allowSpeedChange: true,
              allowFullscreen: true,
              enableTimestamping: true,
              requiredWatchPercentage: 80,
              allowRewatch: true,
              maxRewatchCount: 3,
              enableAnnotations: true,
              annotationTypes: ['timestamp-comment', 'usability-issue', 'emotion-rating'],
              requireAnnotations: false,
              minAnnotations: 0,
              trackViewingBehavior: true,
              detectSkipping: true,
              minimumViewingTime: 30,
              showProgressBar: true,
              showTimestamp: true,
              pauseOnAnnotation: false
            }
          })
        };
        
        setStudies(prevStudies => [...prevStudies, newStudy]);
        
        // Reset form
        setStudyName('');
        setStudyType('card-sorting');
        setSelectedCategory('information-architecture');
        
        // Navigate to studies
        setCurrentView('studies');
        
        alert(`Study "${newStudy.name}" created successfully!`);
        console.log('Study created successfully:', newStudy);
      } catch (error) {
        console.error('Error creating study:', error);
        alert('There was an error creating the study. Please try again.');
      }
    };

    // Get methods by category
    const getMethodsByCategory = (category: MethodCategory): ResearchMethodType[] => {
      return Object.values(RESEARCH_METHOD_METADATA)
        .filter(meta => meta.category === category)
        .map(meta => meta.type);
    };

    const categories: MethodCategory[] = [
      'information-architecture',
      'usability-testing', 
      'user-research',
      'accessibility',
      'analytics',
      'design-validation'
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Study</h1>
            <p className="text-gray-600 mt-1">Set up a new research study for your participants</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-all duration-200"
              aria-label="Cancel and return to dashboard"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateStudy}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-sm"
              aria-label="Create new study"
            >
              Create Study
            </button>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={(e) => { e.preventDefault(); handleCreateStudy(); }} className="space-y-8">
            <div>
              <label htmlFor="study-name" className="block text-sm font-semibold text-gray-800 mb-3">
                Study Name *
              </label>
              <input
                id="study-name"
                type="text"
                value={studyName}
                onChange={(e) => setStudyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., E-commerce Navigation Study"
                required
                aria-describedby="study-name-help"
              />
              <p id="study-name-help" className="text-sm text-gray-600 mt-2">
                Choose a descriptive name that helps you identify this study later
              </p>
            </div>
            
            <fieldset>
              <legend className="block text-sm font-semibold text-gray-800 mb-4">
                Research Method *
              </legend>
              
              {/* Category Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose a Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category);
                        // Auto-select first method in category
                        const methodsInCategory = getMethodsByCategory(category);
                        if (methodsInCategory.length > 0) {
                          setStudyType(methodsInCategory[0]);
                        }
                      }}
                      className={`p-3 text-sm rounded-lg border transition-all ${
                        selectedCategory === category
                          ? `border-${getMethodColor(category)}-500 bg-${getMethodColor(category)}-50 text-${getMethodColor(category)}-700`
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Selector */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getMethodsByCategory(selectedCategory).map((methodType) => {
                    const methodMeta = RESEARCH_METHOD_METADATA[methodType];
                    const IconComponent = getMethodIcon(methodType);
                    const isSelected = studyType === methodType;
                    
                    return (
                      <label 
                        key={methodType}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected
                            ? `border-${getMethodColor(methodMeta.category)}-500 bg-${getMethodColor(methodMeta.category)}-50 ring-2 ring-${getMethodColor(methodMeta.category)}-500 ring-opacity-20`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="study-type"
                          value={methodType}
                          checked={isSelected}
                          onChange={() => setStudyType(methodType)}
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? `bg-${getMethodColor(methodMeta.category)}-200` : 'bg-gray-100'
                          }`}>
                            <IconComponent className={`w-5 h-5 ${
                              isSelected ? `text-${getMethodColor(methodMeta.category)}-700` : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                              {methodType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                              <span className={`px-2 py-1 rounded ${
                                methodMeta.complexity === 'simple' ? 'bg-green-100 text-green-700' :
                                methodMeta.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                methodMeta.complexity === 'complex' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {methodMeta.complexity}
                              </span>
                              <span>{methodMeta.estimatedDuration.average}min</span>
                              <span>{methodMeta.participantRequirements.recommendedParticipants} participants</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowMethodDetails(showMethodDetails === methodType ? null : methodType);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {showMethodDetails === methodType ? 'Hide details' : 'Show details'}
                            </button>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className={`w-5 h-5 bg-${getMethodColor(methodMeta.category)}-600 rounded-full flex items-center justify-center`}>
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                        
                        {showMethodDetails === methodType && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-600 space-y-2">
                              <div>
                                <strong>Data Types:</strong> {methodMeta.dataTypes.join(', ')}
                              </div>
                              <div>
                                <strong>Compatible Methods:</strong> {methodMeta.compatibleMethods.slice(0, 3).join(', ')}
                                {methodMeta.compatibleMethods.length > 3 && '...'}
                              </div>
                              <div>
                                <strong>Prerequisites:</strong> {methodMeta.prerequisites.join(', ')}
                              </div>
                            </div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    );
  };

  const StudySettings = () => {
    if (!selectedStudy) return null;

    const [editedStudy, setEditedStudy] = useState<Study>(selectedStudy);
    const [showCSVUpload, setShowCSVUpload] = useState(false);

    const handleSave = () => {
      setStudies(prev => prev.map(study => 
        study.id === selectedStudy.id ? editedStudy : study
      ));
      alert('Study settings saved!');
      setCurrentView('studies');
    };

    const addCard = () => {
      const newCard = {
        id: Date.now(),
        text: 'New Card'
      };
      setEditedStudy(prev => ({
        ...prev,
        cards: [...(prev.cards || []), newCard]
      }));
    };

    const handleCSVImport = (importedCards: { id: number; text: string }[], replaceAll = false) => {
      if (replaceAll) {
        setEditedStudy(prev => ({
          ...prev,
          cards: importedCards
        }));
        alert(`Successfully replaced all cards with ${importedCards.length} new cards!`);
      } else {
        setEditedStudy(prev => ({
          ...prev,
          cards: [...(prev.cards || []), ...importedCards]
        }));
        alert(`Successfully imported ${importedCards.length} cards!`);
      }
      setShowCSVUpload(false);
    };

    const removeCard = (cardId: number) => {
      setEditedStudy(prev => ({
        ...prev,
        cards: prev.cards?.filter(card => card.id !== cardId) || []
      }));
    };

    const updateCard = (cardId: number, text: string) => {
      setEditedStudy(prev => ({
        ...prev,
        cards: prev.cards?.map(card => 
          card.id === cardId ? { ...card, text } : card
        ) || []
      }));
    };

    const addCategory = () => {
      const newCategory = {
        id: Date.now(),
        name: 'New Category'
      };
      setEditedStudy(prev => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory]
      }));
    };

    const removeCategory = (categoryId: number) => {
      setEditedStudy(prev => ({
        ...prev,
        categories: prev.categories?.filter(cat => cat.id !== categoryId) || []
      }));
    };

    const updateCategory = (categoryId: number, name: string) => {
      setEditedStudy(prev => ({
        ...prev,
        categories: prev.categories?.map(cat => 
          cat.id === categoryId ? { ...cat, name } : cat
        ) || []
      }));
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Study Settings: {editedStudy.name}</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentView('studies')}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4 inline mr-2" />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Save Settings
            </button>
          </div>
        </div>

        {/* Basic Settings */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Study Name</label>
              <input
                type="text"
                value={editedStudy.name}
                onChange={(e) => setEditedStudy(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={editedStudy.status}
                onChange={(e) => setEditedStudy(prev => ({ ...prev, status: e.target.value as StudyStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card Sorting Settings */}
        {editedStudy.type === 'card-sorting' && (
          <>
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cards</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCSVUpload(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Import CSV
                  </button>
                  <button
                    onClick={addCard}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Card
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {editedStudy.cards?.map((card) => (
                  <div key={card.id} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={card.text}
                      onChange={(e) => updateCard(card.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeCard(card.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Categories</h3>
                <button
                  onClick={addCategory}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Category
                </button>
              </div>
              <div className="space-y-2">
                {editedStudy.categories?.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeCategory(category.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tree Testing Settings */}
        {editedStudy.type === 'tree-testing' && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Tree Testing Task</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Description</label>
              <input
                type="text"
                value={editedStudy.task || ''}
                onChange={(e) => setEditedStudy(prev => ({ ...prev, task: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Find the employee handbook"
              />
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                📝 Tree structure editing will be available in the next update. For now, use the demo structure.
              </p>
            </div>
          </div>
        )}

        {/* CSV Upload Modal */}
        {showCSVUpload && (
          <CSVUpload
            onCardsImported={handleCSVImport}
            onClose={() => setShowCSVUpload(false)}
            existingCardsCount={editedStudy.cards?.length || 0}
          />
        )}
      </div>
    );
  };

  const CardSortDemo = () => {
    const [cards] = useState<{id: number, text: string}[]>([
      { id: 1, text: 'Product Reviews' },
      { id: 2, text: 'Shipping Info' },
      { id: 3, text: 'Return Policy' },
      { id: 4, text: 'Size Guide' }
    ]);
    
    const [categories, setCategories] = useState<{id: number, name: string, cards: any[]}[]>([
      { id: 1, name: 'Shopping', cards: [] },
      { id: 2, name: 'Support', cards: [] },
      { id: 3, name: 'Account', cards: [] }
    ]);
    
    const [draggedCard, setDraggedCard] = useState<any>(null);
    const [unsortedCards, setUnsortedCards] = useState(cards);

    const handleDragStart = (_e: React.DragEvent, card: any) => {
      setDraggedCard(card);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, categoryId: number) => {
      e.preventDefault();
      if (draggedCard) {
        setUnsortedCards(prev => prev.filter(card => card.id !== draggedCard.id));
        setCategories(prev => prev.map(cat => ({
          ...cat,
          cards: cat.cards.filter(card => card.id !== draggedCard.id)
        })));
        
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, cards: [...cat.cards, draggedCard] }
            : cat
        ));
        
        setDraggedCard(null);
      }
    };

    const completeStudy = () => {
      const results = {
        participantId: 'P' + Date.now(),
        studyId: 'demo-card-sort',
        studyType: 'card-sorting',
        startTime: Date.now(),
        completionTime: Date.now(),
        totalDuration: 60000
      };
      
      setStudyResults((prev: any) => ({
        ...prev,
        [results.participantId]: results
      }));
      
      alert('Study completed! Data saved for export.');
      setCurrentView('dashboard');
    };
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Card Sorting Demo</h1>
          <p className="text-gray-600">Drag cards into categories</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="font-medium mb-4">Cards to Sort</h3>
          <div className="grid grid-cols-2 gap-3">
            {unsortedCards.map(card => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, card)}
                className="p-3 bg-blue-50 border border-blue-200 rounded cursor-move hover:bg-blue-100"
              >
                {card.text}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {categories.map(category => (
            <div
              key={category.id}
              className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-32"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
            >
              <h4 className="font-medium mb-2">{category.name}</h4>
              <div className="space-y-2">
                {category.cards.map(card => (
                  <div key={card.id} className="p-2 bg-gray-50 border rounded text-sm">
                    {card.text}
                  </div>
                ))}
              </div>
              {category.cards.length === 0 && (
                <div className="text-gray-400 text-sm">Drop cards here</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button 
            onClick={completeStudy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Complete Study
          </button>
        </div>
      </div>
    );
  };

  const TreeTestDemo = () => {
    const [selectedPath, setSelectedPath] = useState<string[]>([]);
    
    const selectNode = (nodeName: string) => {
      setSelectedPath([...selectedPath, nodeName]);
    };

    const completeStudy = () => {
      const results = {
        participantId: 'P' + Date.now(),
        studyId: 'demo-tree-test',
        studyType: 'tree-testing',
        startTime: Date.now(),
        completionTime: Date.now(),
        totalDuration: 45000
      };
      
      setStudyResults((prev: any) => ({
        ...prev,
        [results.participantId]: results
      }));
      
      alert('Tree test completed! Data saved for export.');
      setCurrentView('dashboard');
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Tree Testing Demo</h1>
          <p className="text-gray-600">Find: "Return Policy Information"</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="font-medium mb-4">Website Structure</h3>
            <div className="space-y-2">
              <div className="cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => selectNode('Home')}>
                📄 Home
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => selectNode('Products')}>
                📦 Products
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => selectNode('Customer Service')}>
                🎧 Customer Service
                <div className="ml-4 mt-2 space-y-1">
                  <div className="cursor-pointer hover:bg-gray-50 p-1 rounded text-sm" onClick={() => selectNode('Returns')}>
                    🔄 Returns & Exchanges
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-1 rounded text-sm" onClick={() => selectNode('Contact')}>
                    📞 Contact Us
                  </div>
                </div>
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => selectNode('Account')}>
                👤 Account
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="font-medium mb-4">Your Path</h3>
            {selectedPath.length > 0 ? (
              <div className="space-y-2">
                {selectedPath.map((node, index) => (
                  <div key={index} className="text-sm">
                    {index + 1}. {node}
                  </div>
                ))}
                <button 
                  onClick={completeStudy}
                  className="mt-4 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Found It!
                </button>
              </div>
            ) : (
              <p className="text-gray-500 italic">Click on items to navigate...</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Participant Components
  const ParticipantStudy = () => {
    if (!participantStudy) return (
      <ParticipantLanding
        studies={studies}
        studyId={studyId}
        participantStudy={participantStudy}
        setParticipantStudy={setParticipantStudy}
        setParticipantId={setParticipantId}
        setParticipantStartTime={setParticipantStartTime}
        setCurrentView={setCurrentView}
      />
    );

    if (participantStudy.type === 'card-sorting') {
      return (
        <ParticipantCardSort
          participantStudy={participantStudy}
          participantId={participantId}
          participantStartTime={participantStartTime}
          setStudyResults={setStudyResults}
          setStudies={setStudies}
          setCurrentView={setCurrentView}
        />
      );
    } else if (participantStudy.type === 'tree-testing') {
      return (
        <ParticipantTreeTest
          participantStudy={participantStudy}
          participantId={participantId}
          participantStartTime={participantStartTime}
          setStudyResults={setStudyResults}
          setStudies={setStudies}
          setCurrentView={setCurrentView}
        />
      );
    } else if (participantStudy.type === 'survey') {
      return (
        <ParticipantSurvey
          studyId={participantStudy.id}
          participantId={participantId}
          questions={participantStudy.surveyQuestions || []}
          config={participantStudy.methodConfig as SurveyConfig}
          title={participantStudy.name}
          description={participantStudy.description}
          estimatedDuration={(participantStudy.methodMeta?.estimatedDuration?.average || 15)}
          onComplete={(responses) => {
            // Save survey responses
            const newResults = {
              ...studyResults,
              [participantStudy.id]: [
                ...(studyResults[participantStudy.id] || []),
                {
                  participantId,
                  studyId: participantStudy.id,
                  startTime: participantStartTime,
                  endTime: Date.now(),
                  duration: Date.now() - participantStartTime,
                  results: {
                    responses: responses,
                    completionTime: Date.now() - participantStartTime,
                    participantData: {
                      id: participantId,
                      status: 'completed'
                    }
                  }
                }
              ]
            };
            
            setStudyResults(newResults);
            localStorage.setItem('ia-evaluator-results', JSON.stringify(newResults));
            
            // Update study completion stats
            const updatedStudies = studies.map(study => {
              if (study.id === participantStudy.id) {
                const totalParticipants = (newResults[participantStudy.id] || []).length;
                return {
                  ...study,
                  participants: totalParticipants,
                  completion: Math.round((totalParticipants / (study.configuration.maxParticipants || totalParticipants)) * 100)
                };
              }
              return study;
            });
            
            setStudies(updatedStudies);
            localStorage.setItem('ia-evaluator-studies', JSON.stringify(updatedStudies));
            
            // Navigate to completion
            setCurrentView('participant-complete');
          }}
          onPartialSave={(responses) => {
            // Save partial responses for later continuation
            sessionStorage.setItem(`survey-progress-${participantStudy.id}-${participantId}`, JSON.stringify(responses));
          }}
        />
      );
    } else if (participantStudy.type === 'video-analysis') {
      return (
        <ParticipantVideoAnalysis
          study={participantStudy}
          participantId={participantId}
          onComplete={(results) => {
            // Save video analysis results
            const newResults = {
              ...studyResults,
              [participantStudy.id]: [
                ...(studyResults[participantStudy.id] || []),
                {
                  participantId,
                  studyId: participantStudy.id,
                  startTime: participantStartTime,
                  endTime: Date.now(),
                  duration: Date.now() - participantStartTime,
                  results: results
                }
              ]
            };
            
            setStudyResults(newResults);
            localStorage.setItem('ia-evaluator-results', JSON.stringify(newResults));
            
            // Update study completion stats
            const updatedStudies = studies.map(study => {
              if (study.id === participantStudy.id) {
                const totalParticipants = (newResults[participantStudy.id] || []).length;
                return {
                  ...study,
                  participants: totalParticipants,
                  completion: Math.round((totalParticipants / (study.configuration.maxParticipants || totalParticipants)) * 100)
                };
              }
              return study;
            });
            
            setStudies(updatedStudies);
            localStorage.setItem('ia-evaluator-studies', JSON.stringify(updatedStudies));
            
            // Navigate to completion
            setCurrentView('participant-complete');
          }}
          onProgress={(progress) => {
            console.log('Video analysis progress:', progress);
          }}
        />
      );
    }
    
    return <div>Unsupported study type</div>;
  };

  const renderView = () => {
    // Participant mode views
    if (participantMode) {
      switch (currentView) {
        case 'participant-landing':
          return (
            <ParticipantLanding
              studies={studies}
              studyId={studyId}
              participantStudy={participantStudy}
              setParticipantStudy={setParticipantStudy}
              setParticipantId={setParticipantId}
              setParticipantStartTime={setParticipantStartTime}
              setCurrentView={setCurrentView}
            />
          );
        case 'participant-study':
          return <ParticipantStudy />;
        case 'participant-complete':
          return (
            <ParticipantComplete
              participantStudy={participantStudy}
              participantId={participantId}
              participantStartTime={participantStartTime}
              setParticipantMode={setParticipantMode}
              setCurrentView={setCurrentView}
              setParticipantStudy={setParticipantStudy}
              setParticipantId={setParticipantId}
              setParticipantStartTime={setParticipantStartTime}
            />
          );
        default:
          return (
            <ParticipantLanding
              studies={studies}
              studyId={studyId}
              participantStudy={participantStudy}
              setParticipantStudy={setParticipantStudy}
              setParticipantId={setParticipantId}
              setParticipantStartTime={setParticipantStartTime}
              setCurrentView={setCurrentView}
            />
          );
      }
    }
    
    // Admin mode views
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'studies':
        return <StudiesList />;
      case 'participants':
        return <ParticipantsView />;
      case 'analytics':
        try {
          return (
            <AnalyticsDashboard 
              studies={studies} 
              studyResults={studyResults}
              surveyResults={surveyResults}
              accessibilityResults={accessibilityResults}
              designSystemResults={designSystemResults}
              enableMultiMethod={true}
            />
          );
        } catch (error) {
          console.error('Error rendering Analytics Dashboard:', error);
          return (
            <div className="h-full bg-white p-8">
              <div className="text-center">
                <h1 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-red-800 font-medium mb-2">Error Loading Analytics</p>
                  <p className="text-red-600 text-sm">Unable to load analytics dashboard. Please try refreshing the page.</p>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          );
        }
        break;
      case 'performance':
        return (
          <div className="h-full bg-gray-50">
            <div className="bg-white shadow-sm p-4 border-b border-gray-200">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-xl font-semibold">Performance Testing - Phase 1 Validation</h1>
                <p className="text-gray-600 text-sm mt-1">Comprehensive performance testing for production readiness</p>
              </div>
            </div>
            <div className="max-w-6xl mx-auto p-6">
              <PerformanceTestRunner 
                autoRun={false}
                onTestComplete={(report) => {
                  console.log('Performance test completed:', report);
                  // Optional: Save report or trigger additional actions
                }}
              />
            </div>
          </div>
        );
      case 'create-study':
        return <CreateStudy />;
      case 'study-settings':
        return <StudySettings />;
      case 'video-study-creator':
        return (
          <VideoStudyCreator
            existingStudy={selectedStudy}
            onSave={(study) => {
              if (selectedStudy) {
                // Update existing study
                const updatedStudies = studies.map(s => 
                  s.id === selectedStudy.id ? { ...selectedStudy, ...study } : s
                );
                setStudies(updatedStudies);
              } else {
                // Create new study
                const newStudy = {
                  ...study,
                  id: Date.now(),
                  participants: 0,
                  completion: 0,
                  created: new Date().toISOString().split('T')[0],
                  updated: new Date().toISOString().split('T')[0]
                } as Study;
                setStudies(prev => [...prev, newStudy]);
              }
              setCurrentView('studies');
              setSelectedStudy(null);
            }}
            onCancel={() => {
              setCurrentView('studies');
              setSelectedStudy(null);
            }}
            className="min-h-screen bg-gray-50 p-6"
          />
        );
      case 'survey-builder':
        return (
          <SurveyBuilder
            studyId={selectedStudy?.id}
            initialQuestions={selectedStudy?.surveyQuestions || []}
            initialConfig={selectedStudy?.methodConfig as SurveyConfig}
            onSave={(questions, config) => {
              if (selectedStudy) {
                const updatedStudies = studies.map(study =>
                  study.id === selectedStudy.id
                    ? { ...study, surveyQuestions: questions, methodConfig: config }
                    : study
                );
                setStudies(updatedStudies);
                localStorage.setItem('ia-evaluator-studies', JSON.stringify(updatedStudies));
              }
              setCurrentView('studies');
            }}
            onPreview={(questions, config) => {
              // Store preview data and navigate to preview
              sessionStorage.setItem('survey-preview', JSON.stringify({ questions, config, study: selectedStudy }));
              setCurrentView('survey-preview');
            }}
          />
        );
      case 'survey-preview':
        const previewData = JSON.parse(sessionStorage.getItem('survey-preview') || '{}');
        return (
          <div className="h-full bg-gray-50">
            <div className="bg-white shadow-sm p-4 border-b border-gray-200">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <h1 className="text-xl font-semibold">Survey Preview</h1>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('survey-preview');
                    setCurrentView('survey-builder');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Builder
                </button>
              </div>
            </div>
            <div className="max-w-6xl mx-auto">
              <ParticipantSurvey
                studyId={previewData.study?.id || 0}
                participantId="preview-user"
                questions={previewData.questions || []}
                config={previewData.config || {}}
                title={previewData.study?.name || 'Survey Preview'}
                description={previewData.study?.description}
                onComplete={() => {
                  alert('Survey preview completed! (No data saved)');
                  setCurrentView('survey-builder');
                }}
              />
            </div>
          </div>
        );
      case 'survey-analytics':
        return (
          <div className="h-full bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">Survey Analytics</h1>
                  <p className="text-gray-600">
                    {selectedStudy?.name || 'Survey Results'}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('studies')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Studies
                </button>
              </div>
            </div>
            <div className="p-6 max-w-6xl mx-auto">
              <SurveyAnalytics
                surveyResults={studyResults[selectedStudy?.id] || []}
                questions={selectedStudy?.surveyQuestions || []}
                interactive={true}
              />
            </div>
          </div>
        );
      case 'card-demo':
        return <CardSortDemo />;
      case 'tree-demo':
        return <TreeTestDemo />;
      case 'create-accessibility-audit':
        return (
          <AccessibilityAuditCreator 
            onStudyCreate={(study) => {
              const newStudies = [...studies, study];
              setStudies(newStudies);
              localStorage.setItem('ia-evaluator-studies', JSON.stringify(newStudies));
              setCurrentView('studies');
            }}
            onCancel={() => setCurrentView('studies')}
          />
        );
      case 'accessibility-dashboard':
        return (
          <AccessibilityDashboard 
            studyId={selectedStudy?.id}
            studyType="accessibility-audit"
            enableAllFeatures={true}
          />
        );
      case 'design-system-analytics':
        return (
          <div className="h-full bg-white p-8">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">Design System Analytics</h1>
              <p className="text-gray-600">Component usage tracking and adoption metrics coming soon!</p>
              <button
                onClick={() => setCurrentView('studies')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Studies
              </button>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Don't show navigation in participant mode
  if (participantMode) {
    return renderView();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6" role="main">
        {renderView()}
      </main>
    </div>
  );
};

export default IAEvaluationPlatform;