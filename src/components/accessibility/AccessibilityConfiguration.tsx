import React, { useState, useEffect } from 'react';
import { Settings, Shield, Users, Clock, AlertCircle, CheckCircle2, Save, Eye, RefreshCw } from 'lucide-react';
import { AccessibilityAuditConfig, AccessibilityGuideline } from '../../types';
import { AccessibilityUtils } from '../../utils/accessibility';

interface AccessibilityConfigurationProps {
  studyId: number;
  initialConfig?: Partial<AccessibilityAuditConfig>;
  onConfigUpdate?: (config: AccessibilityAuditConfig) => void;
  onConfigSave?: (config: AccessibilityAuditConfig) => void;
  showPreview?: boolean;
  enableAdvancedOptions?: boolean;
}

interface ConfigPreview {
  estimatedScanTime: string;
  totalGuidelines: number;
  selectedGuidelines: number;
  complexityScore: 'low' | 'medium' | 'high';
  recommendedParticipants: number;
}

interface AssistiveTechnologyProfile {
  id: string;
  name: string;
  type: 'screen-reader' | 'voice-control' | 'eye-tracking' | 'switch-navigation' | 'magnification';
  description: string;
  isCommon: boolean;
}

const AccessibilityConfiguration: React.FC<AccessibilityConfigurationProps> = ({
  studyId,
  initialConfig = {},
  onConfigUpdate,
  onConfigSave,
  showPreview = true,
  enableAdvancedOptions = false
}) => {
  const [config, setConfig] = useState<AccessibilityAuditConfig>({
    methodType: 'accessibility-audit',
    version: '1.0',
    wcagVersion: '2.1',
    complianceLevel: 'AA',
    assistiveTechnologies: ['screen-reader', 'keyboard-only'],
    testingScope: {
      includePages: ['*'],
      excludePages: [],
      includeCriteria: [],
      excludeCriteria: []
    },
    evaluationMethods: ['automated', 'manual'],
    reportingOptions: {
      includeScreenshots: true,
      includeCodeSnippets: true,
      includeSeverityLevels: true,
      includeRecommendations: true
    },
    ...initialConfig
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'scope' | 'methods' | 'reporting' | 'advanced'>('basic');
  const [configPreview, setConfigPreview] = useState<ConfigPreview | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Available assistive technologies
  const assistiveTechnologies: AssistiveTechnologyProfile[] = [
    {
      id: 'screen-reader',
      name: 'Screen Reader',
      type: 'screen-reader',
      description: 'NVDA, JAWS, VoiceOver, TalkBack',
      isCommon: true
    },
    {
      id: 'keyboard-only',
      name: 'Keyboard Only Navigation',
      type: 'switch-navigation',
      description: 'Users who cannot use a mouse',
      isCommon: true
    },
    {
      id: 'voice-control',
      name: 'Voice Control',
      type: 'voice-control',
      description: 'Dragon NaturallySpeaking, Voice Control',
      isCommon: false
    },
    {
      id: 'eye-tracking',
      name: 'Eye Tracking',
      type: 'eye-tracking',
      description: 'Tobii Eye Tracker, PCEye',
      isCommon: false
    },
    {
      id: 'magnification',
      name: 'Screen Magnification',
      type: 'magnification',
      description: 'ZoomText, MAGic, built-in magnifiers',
      isCommon: true
    },
    {
      id: 'switch-navigation',
      name: 'Switch Navigation',
      type: 'switch-navigation',
      description: 'Single or multiple switch input devices',
      isCommon: false
    }
  ];

  // WCAG guidelines for scope selection
  const wcagGuidelines = Object.values(AccessibilityUtils.guidelines);
  const guidelinesByPrinciple = wcagGuidelines.reduce((acc, guideline) => {
    if (!acc[guideline.principle]) {
      acc[guideline.principle] = [];
    }
    acc[guideline.principle].push(guideline);
    return acc;
  }, {} as Record<string, AccessibilityGuideline[]>);

  useEffect(() => {
    generatePreview();
    validateConfiguration();
  }, [config]);

  useEffect(() => {
    onConfigUpdate?.(config);
    setHasUnsavedChanges(true);
  }, [config, onConfigUpdate]);

  const generatePreview = () => {
    const allGuidelines = wcagGuidelines.filter(g => 
      config.complianceLevel === 'AAA' ? true :
      config.complianceLevel === 'AA' ? g.level === 'A' || g.level === 'AA' :
      g.level === 'A'
    );

    const selectedGuidelines = config.testingScope.includeCriteria.length > 0
      ? allGuidelines.filter(g => config.testingScope.includeCriteria.includes(g.id))
      : allGuidelines.filter(g => !config.testingScope.excludeCriteria.includes(g.id));

    const complexityFactors = [
      config.evaluationMethods.includes('manual') ? 2 : 1,
      config.assistiveTechnologies.length > 2 ? 1.5 : 1,
      selectedGuidelines.length > 20 ? 1.5 : 1,
      config.testingScope.includePages.length > 5 ? 1.3 : 1
    ];

    const baseTime = selectedGuidelines.length * 2; // 2 minutes per guideline
    const estimatedTime = complexityFactors.reduce((time, factor) => time * factor, baseTime);
    
    const complexity: 'low' | 'medium' | 'high' = 
      estimatedTime < 60 ? 'low' :
      estimatedTime < 180 ? 'medium' : 'high';

    const recommendedParticipants = Math.max(
      3,
      Math.min(15, Math.ceil(selectedGuidelines.length / 10) + config.assistiveTechnologies.length)
    );

    setConfigPreview({
      estimatedScanTime: estimatedTime < 60 
        ? `${Math.ceil(estimatedTime)} minutes`
        : `${(estimatedTime / 60).toFixed(1)} hours`,
      totalGuidelines: allGuidelines.length,
      selectedGuidelines: selectedGuidelines.length,
      complexityScore: complexity,
      recommendedParticipants
    });
  };

  const validateConfiguration = () => {
    const errors: string[] = [];

    if (config.assistiveTechnologies.length === 0) {
      errors.push('At least one assistive technology must be selected');
    }

    if (config.evaluationMethods.length === 0) {
      errors.push('At least one evaluation method must be selected');
    }

    if (config.testingScope.includePages.length === 0) {
      errors.push('At least one page must be included in the testing scope');
    }

    if (config.testingScope.includeCriteria.length === 0 && config.testingScope.excludeCriteria.length === wcagGuidelines.length) {
      errors.push('At least one WCAG criterion must be included');
    }

    setValidationErrors(errors);
  };

  const updateConfig = (updates: Partial<AccessibilityAuditConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateTestingScope = (updates: Partial<AccessibilityAuditConfig['testingScope']>) => {
    setConfig(prev => ({
      ...prev,
      testingScope: { ...prev.testingScope, ...updates }
    }));
  };

  const updateReportingOptions = (updates: Partial<AccessibilityAuditConfig['reportingOptions']>) => {
    setConfig(prev => ({
      ...prev,
      reportingOptions: { ...prev.reportingOptions, ...updates }
    }));
  };

  const toggleCriterion = (guidelineId: string, include: boolean) => {
    if (include) {
      const newInclude = [...config.testingScope.includeCriteria, guidelineId];
      const newExclude = config.testingScope.excludeCriteria.filter(id => id !== guidelineId);
      updateTestingScope({ includeCriteria: newInclude, excludeCriteria: newExclude });
    } else {
      const newExclude = [...config.testingScope.excludeCriteria, guidelineId];
      const newInclude = config.testingScope.includeCriteria.filter(id => id !== guidelineId);
      updateTestingScope({ includeCriteria: newInclude, excludeCriteria: newExclude });
    }
  };

  const handleSave = () => {
    if (validationErrors.length === 0) {
      onConfigSave?.(config);
      setHasUnsavedChanges(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const isGuidelineIncluded = (guidelineId: string): boolean => {
    if (config.testingScope.includeCriteria.length > 0) {
      return config.testingScope.includeCriteria.includes(guidelineId);
    }
    return !config.testingScope.excludeCriteria.includes(guidelineId);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Accessibility Audit Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure WCAG compliance testing for Study #{studyId}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {showPreview && (
              <button
                onClick={generatePreview}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={validationErrors.length > 0}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                validationErrors.length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Save className="w-4 h-4 mr-1" />
              Save Configuration
            </button>
          </div>
        </div>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Configuration Issues</h3>
                <ul className="mt-1 text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">You have unsaved changes</span>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-4">
          {[
            { key: 'basic' as const, label: 'Basic Settings', icon: Settings },
            { key: 'scope' as const, label: 'Testing Scope', icon: Shield },
            { key: 'methods' as const, label: 'Evaluation Methods', icon: Users },
            { key: 'reporting' as const, label: 'Reporting Options', icon: Settings },
            ...(enableAdvancedOptions ? [{ key: 'advanced' as const, label: 'Advanced', icon: Settings }] : [])
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex">
        {/* Main Configuration */}
        <div className="flex-1 p-4">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WCAG Version
                  </label>
                  <select
                    value={config.wcagVersion}
                    onChange={(e) => updateConfig({ wcagVersion: e.target.value as '2.0' | '2.1' | '2.2' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2.0">WCAG 2.0</option>
                    <option value="2.1">WCAG 2.1</option>
                    <option value="2.2">WCAG 2.2</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compliance Level
                  </label>
                  <select
                    value={config.complianceLevel}
                    onChange={(e) => updateConfig({ complianceLevel: e.target.value as 'A' | 'AA' | 'AAA' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A">Level A (Essential)</option>
                    <option value="AA">Level AA (Standard)</option>
                    <option value="AAA">Level AAA (Enhanced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assistive Technologies to Test
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assistiveTechnologies.map(tech => (
                    <div key={tech.id} className="relative">
                      <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        config.assistiveTechnologies.includes(tech.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={config.assistiveTechnologies.includes(tech.id)}
                          onChange={(e) => {
                            const newTechs = e.target.checked
                              ? [...config.assistiveTechnologies, tech.id]
                              : config.assistiveTechnologies.filter(t => t !== tech.id);
                            updateConfig({ assistiveTechnologies: newTechs });
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{tech.name}</span>
                            {tech.isCommon && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Common
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{tech.description}</p>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Testing Scope Tab */}
          {activeTab === 'scope' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pages to Include (one per line, * for all)
                </label>
                <textarea
                  value={config.testingScope.includePages.join('\n')}
                  onChange={(e) => updateTestingScope({ 
                    includePages: e.target.value.split('\n').filter(p => p.trim()) 
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="*&#10;/home&#10;/products&#10;/contact"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pages to Exclude (one per line)
                </label>
                <textarea
                  value={config.testingScope.excludePages.join('\n')}
                  onChange={(e) => updateTestingScope({ 
                    excludePages: e.target.value.split('\n').filter(p => p.trim()) 
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/admin&#10;/test&#10;/debug"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">WCAG Guidelines Selection</h3>
                <div className="space-y-4">
                  {Object.entries(guidelinesByPrinciple).map(([principle, guidelines]) => (
                    <div key={principle} className="border rounded-lg">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 capitalize">{principle} Principle</h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                guidelines.forEach(g => toggleCriterion(g.id, true));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Select All
                            </button>
                            <span className="text-gray-400">|</span>
                            <button
                              onClick={() => {
                                guidelines.forEach(g => toggleCriterion(g.id, false));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                        {guidelines.map(guideline => {
                          const isIncluded = isGuidelineIncluded(guideline.id);
                          const isAvailable = config.complianceLevel === 'AAA' ? true :
                            config.complianceLevel === 'AA' ? guideline.level === 'A' || guideline.level === 'AA' :
                            guideline.level === 'A';

                          return (
                            <label
                              key={guideline.id}
                              className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                                !isAvailable 
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isIncluded
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isIncluded && isAvailable}
                                disabled={!isAvailable}
                                onChange={(e) => toggleCriterion(guideline.id, e.target.checked)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{guideline.id}</span>
                                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                                    guideline.level === 'A' ? 'bg-green-100 text-green-800' :
                                    guideline.level === 'AA' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {guideline.level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{guideline.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{guideline.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Methods Tab */}
          {activeTab === 'methods' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Evaluation Methods
                </label>
                <div className="space-y-3">
                  {[
                    {
                      id: 'automated',
                      name: 'Automated Testing',
                      description: 'Use axe-core and other automated tools to scan for issues',
                      recommended: true
                    },
                    {
                      id: 'manual',
                      name: 'Manual Testing',
                      description: 'Expert evaluation by accessibility specialists',
                      recommended: true
                    },
                    {
                      id: 'user-testing',
                      name: 'User Testing',
                      description: 'Testing with actual users who use assistive technologies',
                      recommended: false
                    }
                  ].map(method => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        config.evaluationMethods.includes(method.id as any)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={config.evaluationMethods.includes(method.id as any)}
                        onChange={(e) => {
                          const newMethods = e.target.checked
                            ? [...config.evaluationMethods, method.id as any]
                            : config.evaluationMethods.filter(m => m !== method.id);
                          updateConfig({ evaluationMethods: newMethods });
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{method.name}</span>
                          {method.recommended && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reporting Options Tab */}
          {activeTab === 'reporting' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Report Content
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'includeScreenshots', label: 'Include Screenshots', description: 'Visual evidence of accessibility issues' },
                    { key: 'includeCodeSnippets', label: 'Include Code Snippets', description: 'HTML/CSS code examples showing issues' },
                    { key: 'includeSeverityLevels', label: 'Include Severity Levels', description: 'Categorize issues by impact level' },
                    { key: 'includeRecommendations', label: 'Include Recommendations', description: 'Detailed guidance for fixing issues' }
                  ].map(option => (
                    <label key={option.key} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={config.reportingOptions[option.key as keyof typeof config.reportingOptions] as boolean}
                        onChange={(e) => updateReportingOptions({
                          [option.key]: e.target.checked
                        })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{option.label}</span>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && enableAdvancedOptions && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={config.customInstructions || ''}
                  onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional instructions for evaluators..."
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.practiceMode || false}
                    onChange={(e) => updateConfig({ practiceMode: e.target.checked })}
                  />
                  <span className="font-medium text-gray-900">Practice Mode</span>
                </label>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Enable practice mode for training purposes (results won't be saved)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && configPreview && (
          <div className="w-80 border-l bg-gray-50 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Preview</h3>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-3">
                <h4 className="font-medium text-gray-900 mb-2">Audit Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">WCAG Level:</span>
                    <span className="font-medium">{config.complianceLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guidelines:</span>
                    <span className="font-medium">{configPreview.selectedGuidelines}/{configPreview.totalGuidelines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="font-medium">{configPreview.estimatedScanTime}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-3">
                <h4 className="font-medium text-gray-900 mb-2">Complexity Analysis</h4>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getComplexityColor(configPreview.complexityScore)}`}>
                  <span className="font-medium capitalize">{configPreview.complexityScore}</span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Recommended: {configPreview.recommendedParticipants} participants</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>Per participant: ~{Math.ceil(parseInt(configPreview.estimatedScanTime) / configPreview.recommendedParticipants)} min</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-3">
                <h4 className="font-medium text-gray-900 mb-2">Assistive Technologies</h4>
                <div className="space-y-1">
                  {config.assistiveTechnologies.map(techId => {
                    const tech = assistiveTechnologies.find(t => t.id === techId);
                    return tech ? (
                      <div key={techId} className="text-sm text-gray-700">
                        • {tech.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-3">
                <h4 className="font-medium text-gray-900 mb-2">Evaluation Methods</h4>
                <div className="space-y-1">
                  {config.evaluationMethods.map(method => (
                    <div key={method} className="text-sm text-gray-700 capitalize">
                      • {method.replace('-', ' ')}
                    </div>
                  ))}
                </div>
              </div>

              {validationErrors.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Configuration Valid</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Ready to start accessibility audit
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Configuration Issues</span>
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    {validationErrors.length} issue{validationErrors.length !== 1 ? 's' : ''} need to be resolved
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityConfiguration;