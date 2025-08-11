import React, { useState, useEffect } from 'react';
import { Shield, Settings, Users, Clock, Target, AlertCircle, CheckCircle2, Plus, X, Calendar, Bell, Zap } from 'lucide-react';
import { AccessibilityAuditConfig, Study, ResearchMethodMeta, RESEARCH_METHOD_METADATA } from '../../types';
import { AccessibilityScheduleConfig, NotificationConfig, RetryPolicy } from '../../utils/accessibility';

interface AccessibilityAuditCreatorProps {
  onStudyCreate: (study: Study) => void;
  onCancel: () => void;
  initialStudyData?: Partial<Study>;
  editMode?: boolean;
}

const AccessibilityAuditCreator: React.FC<AccessibilityAuditCreatorProps> = ({
  onStudyCreate,
  onCancel,
  initialStudyData,
  editMode = false
}) => {
  const [studyName, setStudyName] = useState(initialStudyData?.name || '');
  const [studyDescription, setStudyDescription] = useState(initialStudyData?.description || '');
  
  // Accessibility audit configuration
  const [auditConfig, setAuditConfig] = useState<AccessibilityAuditConfig>({
    methodType: 'accessibility-audit',
    version: '1.0',
    wcagVersion: '2.1',
    complianceLevel: 'AA',
    assistiveTechnologies: ['screen-reader', 'keyboard-navigation'],
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
    }
  });

  // Study configuration
  const [maxParticipants, setMaxParticipants] = useState(initialStudyData?.configuration?.maxParticipants || 5);
  const [minParticipants, setMinParticipants] = useState(initialStudyData?.configuration?.minParticipants || 3);
  const [requiresCode, setRequiresCode] = useState(initialStudyData?.configuration?.requiresCode || false);
  const [accessCode, setAccessCode] = useState(initialStudyData?.configuration?.accessCode || '');
  const [collectDemographics, setCollectDemographics] = useState(initialStudyData?.configuration?.collectDemographics || true);

  // Advanced scheduling configuration
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<AccessibilityScheduleConfig>({
    type: 'interval',
    schedule: 3600000, // 1 hour default
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enabled: false,
    conditions: [],
    notifications: [],
    retryPolicy: {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      initialDelay: 5000,
      maxDelay: 60000,
      retryConditions: ['network-error', 'timeout']
    }
  });

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const methodMeta: ResearchMethodMeta = RESEARCH_METHOD_METADATA['accessibility-audit'];

  useEffect(() => {
    // Request notification permission if scheduling is enabled
    if (enableScheduling && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enableScheduling]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!studyName.trim()) {
      newErrors.studyName = 'Study name is required';
    }

    if (minParticipants < methodMeta.participantRequirements.minParticipants) {
      newErrors.minParticipants = `Minimum ${methodMeta.participantRequirements.minParticipants} participants required for accessibility audits`;
    }

    if (maxParticipants > methodMeta.participantRequirements.maxParticipants) {
      newErrors.maxParticipants = `Maximum ${methodMeta.participantRequirements.maxParticipants} participants recommended`;
    }

    if (minParticipants > maxParticipants) {
      newErrors.maxParticipants = 'Maximum participants must be greater than minimum';
    }

    if (requiresCode && !accessCode.trim()) {
      newErrors.accessCode = 'Access code is required when code protection is enabled';
    }

    if (auditConfig.testingScope.includePages.length === 0) {
      newErrors.testingScope = 'At least one page pattern must be included in testing scope';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateStudy = () => {
    if (!validateForm()) {
      return;
    }

    const newStudy: Study = {
      id: initialStudyData?.id || Date.now(),
      name: studyName,
      description: studyDescription,
      type: 'accessibility-audit',
      status: 'draft',
      participants: 0,
      completion: 0,
      created: initialStudyData?.created || new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      methodMeta,
      configuration: {
        maxParticipants,
        minParticipants,
        requiresCode,
        accessCode: requiresCode ? accessCode : undefined,
        allowAnonymous: !collectDemographics,
        collectDemographics,
        consentRequired: true,
        estimatedDuration: methodMeta.estimatedDuration.average,
        recruitmentStrategy: 'invite-only'
      },
      methodConfig: auditConfig,
      settings: {
        theme: 'default',
        showProgress: true,
        allowPause: true,
        allowBacktrack: false,
        shuffleOrder: false,
        autoSave: true,
        saveInterval: 30,
        defaultExportFormat: 'json',
        emailNotifications: enableScheduling,
        includeMetadataInExport: true
      },
      metadata: {
        version: '1.0',
        tags: ['accessibility', 'wcag', auditConfig.wcagVersion, auditConfig.complianceLevel],
        hypothesis: 'Identify and prioritize accessibility barriers for users with disabilities',
        researchQuestions: [
          'What are the most critical accessibility issues?',
          'Which WCAG principles are most violated?',
          'What is the current compliance level?',
          'How can accessibility be improved?'
        ],
        successCriteria: [
          'Complete WCAG compliance assessment',
          'Prioritized list of accessibility issues',
          'Actionable remediation recommendations',
          'Compliance certification report'
        ]
      },
      // Add scheduling configuration if enabled
      ...(enableScheduling && {
        accessibilitySchedule: scheduleConfig
      })
    };

    onStudyCreate(newStudy);
  };

  const handleScheduleConfigChange = (updates: Partial<AccessibilityScheduleConfig>) => {
    setScheduleConfig(prev => ({ ...prev, ...updates }));
  };

  const addNotification = () => {
    const newNotification: NotificationConfig = {
      type: 'browser',
      target: '',
      events: ['scan-complete', 'issues-found'],
      template: 'default'
    };
    
    setScheduleConfig(prev => ({
      ...prev,
      notifications: [...(prev.notifications || []), newNotification]
    }));
  };

  const removeNotification = (index: number) => {
    setScheduleConfig(prev => ({
      ...prev,
      notifications: prev.notifications?.filter((_, i) => i !== index) || []
    }));
  };

  const updateNotification = (index: number, updates: Partial<NotificationConfig>) => {
    setScheduleConfig(prev => ({
      ...prev,
      notifications: prev.notifications?.map((notif, i) => 
        i === index ? { ...notif, ...updates } : notif
      ) || []
    }));
  };

  const renderBasicConfiguration = () => (
    <div className="space-y-6">
      {/* Study Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Study Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Study Name *
            </label>
            <input
              type="text"
              value={studyName}
              onChange={(e) => setStudyName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.studyName ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Enter study name..."
            />
            {errors.studyName && <p className="text-sm text-red-600 mt-1">{errors.studyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={studyDescription}
              onChange={(e) => setStudyDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the accessibility audit objectives..."
            />
          </div>
        </div>
      </div>

      {/* Participant Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Participant Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Participants *
            </label>
            <input
              type="number"
              value={minParticipants}
              onChange={(e) => setMinParticipants(parseInt(e.target.value))}
              min={methodMeta.participantRequirements.minParticipants}
              max={methodMeta.participantRequirements.maxParticipants}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.minParticipants ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.minParticipants && <p className="text-sm text-red-600 mt-1">{errors.minParticipants}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Participants *
            </label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              min={methodMeta.participantRequirements.minParticipants}
              max={methodMeta.participantRequirements.maxParticipants}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maxParticipants ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.maxParticipants && <p className="text-sm text-red-600 mt-1">{errors.maxParticipants}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requiresCode}
              onChange={(e) => setRequiresCode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Require access code</span>
          </label>

          {requiresCode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Code *
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.accessCode ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Enter access code..."
              />
              {errors.accessCode && <p className="text-sm text-red-600 mt-1">{errors.accessCode}</p>}
            </div>
          )}

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={collectDemographics}
              onChange={(e) => setCollectDemographics(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Collect participant demographics</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAccessibilityConfiguration = () => (
    <div className="space-y-6">
      {/* WCAG Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">WCAG Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WCAG Version
            </label>
            <select
              value={auditConfig.wcagVersion}
              onChange={(e) => setAuditConfig(prev => ({ ...prev, wcagVersion: e.target.value as '2.0' | '2.1' | '2.2' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2.0">WCAG 2.0</option>
              <option value="2.1">WCAG 2.1 (Recommended)</option>
              <option value="2.2">WCAG 2.2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compliance Level
            </label>
            <select
              value={auditConfig.complianceLevel}
              onChange={(e) => setAuditConfig(prev => ({ ...prev, complianceLevel: e.target.value as 'A' | 'AA' | 'AAA' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">Level A (Essential)</option>
              <option value="AA">Level AA (Standard)</option>
              <option value="AAA">Level AAA (Enhanced)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Testing Scope */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Testing Scope</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Include Pages (URL patterns) *
            </label>
            <textarea
              value={auditConfig.testingScope.includePages.join('\n')}
              onChange={(e) => setAuditConfig(prev => ({
                ...prev,
                testingScope: {
                  ...prev.testingScope,
                  includePages: e.target.value.split('\n').filter(line => line.trim())
                }
              }))}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.testingScope ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Enter URL patterns (one per line)&#10;Examples:&#10;*&#10;/dashboard*&#10;/products/*"
            />
            {errors.testingScope && <p className="text-sm text-red-600 mt-1">{errors.testingScope}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exclude Pages (URL patterns)
            </label>
            <textarea
              value={auditConfig.testingScope.excludePages.join('\n')}
              onChange={(e) => setAuditConfig(prev => ({
                ...prev,
                testingScope: {
                  ...prev.testingScope,
                  excludePages: e.target.value.split('\n').filter(line => line.trim())
                }
              }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter URL patterns to exclude (one per line)"
            />
          </div>
        </div>
      </div>

      {/* Evaluation Methods */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluation Methods</h3>
        <div className="space-y-3">
          {[
            { value: 'automated', label: 'Automated Testing (axe-core)', description: 'Fast, consistent automated accessibility scanning' },
            { value: 'manual', label: 'Manual Testing', description: 'Expert human evaluation of accessibility barriers' },
            { value: 'user-testing', label: 'User Testing', description: 'Testing with users who have disabilities' }
          ].map(method => (
            <label key={method.value} className="flex items-start">
              <input
                type="checkbox"
                checked={auditConfig.evaluationMethods.includes(method.value as any)}
                onChange={(e) => {
                  const methods = auditConfig.evaluationMethods;
                  setAuditConfig(prev => ({
                    ...prev,
                    evaluationMethods: e.target.checked
                      ? [...methods, method.value as any]
                      : methods.filter(m => m !== method.value)
                  }));
                }}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{method.label}</div>
                <div className="text-sm text-gray-500">{method.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Assistive Technologies */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assistive Technologies</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            'screen-reader',
            'keyboard-navigation',
            'voice-control',
            'magnification',
            'switch-navigation',
            'eye-tracking'
          ].map(tech => (
            <label key={tech} className="flex items-center">
              <input
                type="checkbox"
                checked={auditConfig.assistiveTechnologies.includes(tech)}
                onChange={(e) => {
                  const technologies = auditConfig.assistiveTechnologies;
                  setAuditConfig(prev => ({
                    ...prev,
                    assistiveTechnologies: e.target.checked
                      ? [...technologies, tech]
                      : technologies.filter(t => t !== tech)
                  }));
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {tech.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSchedulingConfiguration = () => (
    <div className="space-y-6">
      {/* Enable Scheduling */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={enableScheduling}
            onChange={(e) => setEnableScheduling(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm font-medium text-gray-900">Enable Automated Scanning</span>
        </label>
        <p className="text-sm text-gray-500 mt-1">
          Automatically run accessibility scans on a schedule to monitor compliance over time
        </p>
      </div>

      {enableScheduling && (
        <>
          {/* Schedule Type */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'interval', label: 'Interval', description: 'Run every X minutes/hours', icon: Clock },
                    { value: 'cron', label: 'Scheduled', description: 'Run at specific times', icon: Calendar },
                    { value: 'event-driven', label: 'Event-Driven', description: 'Trigger on page changes', icon: Zap }
                  ].map(type => (
                    <label key={type.value} className={`flex items-center p-3 border rounded-lg cursor-pointer ${scheduleConfig.type === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="scheduleType"
                        value={type.value}
                        checked={scheduleConfig.type === type.value}
                        onChange={(e) => handleScheduleConfigChange({ type: e.target.value as any })}
                        className="sr-only"
                      />
                      <type.icon className="w-5 h-5 text-gray-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule Configuration based on type */}
              {scheduleConfig.type === 'interval' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={Math.floor((scheduleConfig.schedule as number) / 60000)}
                    onChange={(e) => handleScheduleConfigChange({ schedule: parseInt(e.target.value) * 60000 })}
                    min={5}
                    max={1440}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum 5 minutes, maximum 24 hours (1440 minutes)</p>
                </div>
              )}

              {scheduleConfig.type === 'cron' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    value={typeof scheduleConfig.schedule === 'string' ? scheduleConfig.schedule : '09:00'}
                    onChange={(e) => handleScheduleConfigChange({ schedule: `0 ${e.target.value.split(':').join(' ')} * * *` })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Daily scan at the specified time</p>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <button
                type="button"
                onClick={addNotification}
                className="inline-flex items-center px-3 py-1 text-sm border border-blue-300 text-blue-700 bg-blue-50 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Notification
              </button>
            </div>

            {scheduleConfig.notifications?.map((notification, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Notification {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeNotification(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={notification.type}
                      onChange={(e) => updateNotification(index, { type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="browser">Browser Notification</option>
                      <option value="email">Email</option>
                      <option value="webhook">Webhook</option>
                      <option value="slack">Slack</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {notification.type === 'email' ? 'Email Address' :
                       notification.type === 'webhook' ? 'Webhook URL' :
                       notification.type === 'slack' ? 'Slack Webhook URL' : 'Target'}
                    </label>
                    <input
                      type={notification.type === 'email' ? 'email' : 'text'}
                      value={notification.target}
                      onChange={(e) => updateNotification(index, { target: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        notification.type === 'email' ? 'user@example.com' :
                        notification.type === 'webhook' ? 'https://api.example.com/webhook' :
                        notification.type === 'slack' ? 'https://hooks.slack.com/...' : 
                        'Browser notifications don\'t need a target'
                      }
                      disabled={notification.type === 'browser'}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trigger Events
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['scan-complete', 'issues-found', 'compliance-change', 'error'].map(event => (
                      <label key={event} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notification.events.includes(event as any)}
                          onChange={(e) => {
                            const events = notification.events;
                            updateNotification(index, {
                              events: e.target.checked
                                ? [...events, event as any]
                                : events.filter(ev => ev !== event)
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {event.replace('-', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-6 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No notifications configured</p>
                <p className="text-xs">Add notifications to stay informed about scan results</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? 'Edit' : 'Create'} Accessibility Audit
              </h1>
              <p className="text-sm text-gray-600">
                Configure a comprehensive WCAG compliance evaluation study
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              methodMeta.complexity === 'expert' ? 'bg-red-100 text-red-800' :
              methodMeta.complexity === 'complex' ? 'bg-orange-100 text-orange-800' :
              methodMeta.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {methodMeta.complexity} level
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {methodMeta.estimatedDuration.average} min avg
            </span>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            {[
              { step: 1, title: 'Basic Setup', icon: Settings },
              { step: 2, title: 'Accessibility Config', icon: Shield },
              { step: 3, title: 'Scheduling', icon: Clock }
            ].map(({ step, title, icon: Icon }) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                  currentStep === step
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {currentStep === 1 && renderBasicConfiguration()}
        {currentStep === 2 && renderAccessibilityConfiguration()}
        {currentStep === 3 && renderSchedulingConfiguration()}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleCreateStudy}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {editMode ? 'Update Study' : 'Create Study'}
            </button>
          </div>
        </div>
      </div>

      {/* Study Overview */}
      {studyName && (
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Participants:</span>
              <span className="font-medium">{minParticipants}-{maxParticipants}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">WCAG Level:</span>
              <span className="font-medium">{auditConfig.complianceLevel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{methodMeta.estimatedDuration.average} min avg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityAuditCreator;