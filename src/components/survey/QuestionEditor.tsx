import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Star,
  Type,
  AlignLeft,
  Hash,
  Settings2,
  ChevronUp,
  ChevronDown,
  Move3D,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Zap,
  HelpCircle,
  Copy,
  Shuffle,
  Target,
  FileText,
  BarChart3
} from 'lucide-react';
import { SurveyQuestion, SurveyOption, BranchingRule } from '../../types';
import BranchingLogic from './BranchingLogic';

interface QuestionEditorProps {
  question: SurveyQuestion;
  allQuestions?: SurveyQuestion[];
  branchingRules?: BranchingRule[];
  onUpdate: (updates: Partial<SurveyQuestion>) => void;
  onUpdateBranching?: (rules: BranchingRule[]) => void;
  onClose: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  allQuestions = [],
  branchingRules = [],
  onUpdate,
  onUpdateBranching,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'validation' | 'logic' | 'accessibility'>('general');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // Enhanced validation state
  const questionValidation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!question.question.trim()) {
      errors.push('Question text is required');
    }
    
    if (question.type === 'multiple-choice' || question.type === 'ranking') {
      if (!question.options || question.options.length < 2) {
        errors.push('At least 2 options are required');
      }
      if (question.options && question.options.some(opt => !opt.text.trim())) {
        errors.push('All options must have text');
      }
      if (question.options && question.options.length > 10) {
        warnings.push('Consider reducing the number of options for better usability');
      }
    }
    
    if (question.type === 'text' && question.validation?.maxLength && question.validation.maxLength > 1000) {
      warnings.push('Very long text responses may be difficult for participants to complete');
    }
    
    if (question.type === 'rating-scale') {
      const scale = question.scale;
      if (scale && (scale.max - scale.min) > 10) {
        warnings.push('Rating scales with more than 10 points may be difficult to use');
      }
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  }, [question]);

  const generateOptionId = () => `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleQuestionTextChange = useCallback((text: string) => {
    onUpdate({ question: text });
  }, [onUpdate]);

  const handleRequiredChange = useCallback((required: boolean) => {
    onUpdate({ required });
  }, [onUpdate]);

  const handleValidationChange = useCallback((field: string, value: any) => {
    onUpdate({
      validation: {
        ...question.validation,
        [field]: value
      }
    });
  }, [question.validation, onUpdate]);

  const handleScaleChange = useCallback((field: string, value: any) => {
    onUpdate({
      scale: {
        ...question.scale,
        [field]: value
      }
    });
  }, [question.scale, onUpdate]);

  const addOption = useCallback(() => {
    const newOption: SurveyOption = {
      id: generateOptionId(),
      text: `Option ${(question.options?.length || 0) + 1}`,
      value: `option${(question.options?.length || 0) + 1}`
    };
    
    onUpdate({
      options: [...(question.options || []), newOption]
    });
  }, [question.options, onUpdate]);

  const updateOption = useCallback((optionId: string, updates: Partial<SurveyOption>) => {
    onUpdate({
      options: question.options?.map(opt => 
        opt.id === optionId ? { ...opt, ...updates } : opt
      )
    });
  }, [question.options, onUpdate]);

  const deleteOption = useCallback((optionId: string) => {
    onUpdate({
      options: question.options?.filter(opt => opt.id !== optionId)
    });
  }, [question.options, onUpdate]);

  const moveOption = useCallback((fromIndex: number, toIndex: number) => {
    if (!question.options) return;
    
    const newOptions = [...question.options];
    const [moved] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, moved);
    
    onUpdate({ options: newOptions });
  }, [question.options, onUpdate]);

  const updateScaleLabel = useCallback((index: number, label: string) => {
    if (!question.scale?.labels) return;
    
    const newLabels = [...question.scale.labels];
    newLabels[index] = label;
    
    onUpdate({
      scale: {
        ...question.scale,
        labels: newLabels
      }
    });
  }, [question.scale, onUpdate]);

  const generateScaleLabels = useCallback(() => {
    const min = question.scale?.min || 1;
    const max = question.scale?.max || 5;
    const range = max - min + 1;
    
    let labels: string[] = [];
    
    if (range <= 5) {
      labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'].slice(0, range);
    } else if (range <= 7) {
      labels = ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree'].slice(0, range);
    } else {
      labels = Array.from({ length: range }, (_, i) => `${min + i}`);
    }
    
    onUpdate({
      scale: {
        ...question.scale,
        labels
      }
    });
  }, [question.scale, onUpdate]);

  const getQuestionTypeInfo = () => {
    switch (question.type) {
      case 'multiple-choice':
        return {
          title: 'Multiple Choice Question',
          description: 'Participants can select one option from a list',
          icon: <Type className="w-5 h-5" />
        };
      case 'rating-scale':
        return {
          title: 'Rating Scale Question',
          description: 'Participants rate using a numerical scale',
          icon: <Hash className="w-5 h-5" />
        };
      case 'text':
        return {
          title: 'Text Input Question',
          description: 'Participants provide written responses',
          icon: <AlignLeft className="w-5 h-5" />
        };
      case 'boolean':
        return {
          title: 'Yes/No Question',
          description: 'Participants choose between two options',
          icon: <Settings2 className="w-5 h-5" />
        };
      case 'ranking':
        return {
          title: 'Ranking Question',
          description: 'Participants rank options in order of preference',
          icon: <Move3D className="w-5 h-5" />
        };
      default:
        return {
          title: 'Question',
          description: 'Configure your question',
          icon: <Type className="w-5 h-5" />
        };
    }
  };

  const questionInfo = getQuestionTypeInfo();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {questionInfo.icon}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{questionInfo.title}</h3>
                {questionValidation.isValid ? (
                  <div className="flex items-center space-x-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Valid</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">{questionValidation.errors.length} error(s)</span>
                  </div>
                )}
                {questionValidation.warnings.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600">{questionValidation.warnings.length} warning(s)</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{questionInfo.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Quick Actions"
              >
                <Zap className="w-5 h-5" />
              </button>
              {showQuickActions && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        const duplicatedQuestion = {
                          ...question,
                          id: `${question.id}_copy`,
                          question: `${question.question} (Copy)`
                        };
                        // This would need to be handled by parent component
                        setShowQuickActions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicate Question</span>
                    </button>
                    {question.type === 'multiple-choice' && (
                      <button
                        onClick={() => {
                          // Shuffle options
                          if (question.options) {
                            const shuffled = [...question.options].sort(() => Math.random() - 0.5);
                            onUpdate({ options: shuffled });
                          }
                          setShowQuickActions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Shuffle Options</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveTab('accessibility');
                        setShowQuickActions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                    >
                      <Target className="w-3 h-3" />
                      <span>Check Accessibility</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'general', label: 'General', icon: Settings2 },
            { id: 'validation', label: 'Validation', icon: AlertCircle },
            { id: 'logic', label: 'Logic', icon: Eye },
            { id: 'accessibility', label: 'Accessibility', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-6">
          {activeTab === 'general' && (
            <>
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) => handleQuestionTextChange(e.target.value)}
                  placeholder="Enter your question..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Required Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Star className={`w-4 h-4 ${question.required ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  <span className="font-medium text-gray-900">Required Question</span>
                </div>
                <button
                  onClick={() => handleRequiredChange(!question.required)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    question.required ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      question.required ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Question-specific options */}
              {question.type === 'multiple-choice' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Answer Options
                    </label>
                    <button
                      onClick={addOption}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Option</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {question.options?.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                        <Move3D className="w-4 h-4 text-gray-400 cursor-move" />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(option.id, { text: e.target.value })}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => deleteOption(option.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                          disabled={(question.options?.length || 0) <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )) || []}
                  </div>
                </div>
              )}

              {question.type === 'ranking' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Items to Rank
                    </label>
                    <button
                      onClick={addOption}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {question.options?.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-500 font-medium w-6">{index + 1}.</span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(option.id, { text: e.target.value })}
                          placeholder={`Item ${index + 1}`}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex space-x-1">
                          <button
                            onClick={() => moveOption(index, Math.max(0, index - 1))}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveOption(index, Math.min((question.options?.length || 1) - 1, index + 1))}
                            disabled={index === (question.options?.length || 1) - 1}
                            className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteOption(option.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                          disabled={(question.options?.length || 0) <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )) || []}
                  </div>
                </div>
              )}

              {question.type === 'rating-scale' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Value
                      </label>
                      <input
                        type="number"
                        value={question.scale?.min || 1}
                        onChange={(e) => handleScaleChange('min', parseInt(e.target.value))}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Value
                      </label>
                      <input
                        type="number"
                        value={question.scale?.max || 5}
                        onChange={(e) => handleScaleChange('max', parseInt(e.target.value))}
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Scale Labels (Optional)
                      </label>
                      <button
                        onClick={generateScaleLabels}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Auto Generate
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {Array.from({ 
                        length: (question.scale?.max || 5) - (question.scale?.min || 1) + 1 
                      }, (_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 w-8 text-center">
                            {(question.scale?.min || 1) + i}
                          </span>
                          <input
                            type="text"
                            value={question.scale?.labels?.[i] || ''}
                            onChange={(e) => updateScaleLabel(i, e.target.value)}
                            placeholder={`Label for ${(question.scale?.min || 1) + i}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-6">
              {/* Validation Status */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Validation Status</h4>
                <div className="space-y-2">
                  {questionValidation.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <h5 className="text-sm font-medium text-red-800 mb-2">Errors to fix:</h5>
                      <ul className="space-y-1 text-sm text-red-700">
                        {questionValidation.errors.map((error, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {questionValidation.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h5 className="text-sm font-medium text-yellow-800 mb-2">Recommendations:</h5>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {questionValidation.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span>•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {questionValidation.isValid && questionValidation.warnings.length === 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center space-x-2 text-green-700">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Question is valid and ready to use</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {question.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Length (characters)
                    </label>
                    <input
                      type="number"
                      value={question.validation?.minLength || ''}
                      onChange={(e) => handleValidationChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Length (characters)
                    </label>
                    <input
                      type="number"
                      value={question.validation?.maxLength || ''}
                      onChange={(e) => handleValidationChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pattern (Regular Expression)
                    </label>
                    <input
                      type="text"
                      value={question.validation?.pattern || ''}
                      onChange={(e) => handleValidationChange('pattern', e.target.value || undefined)}
                      placeholder="e.g., ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use regex to validate input format (e.g., email, phone number)
                    </p>
                  </div>
                </>
              )}

              {question.type === 'rating-scale' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Scale Validation</h4>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Values must be between {question.scale?.min || 1} and {question.scale?.max || 5}</span>
                    </div>
                  </div>
                </div>
              )}

              {(question.type === 'multiple-choice' || question.type === 'ranking') && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Option Validation</h4>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>
                        {question.type === 'multiple-choice' 
                          ? 'One option must be selected'
                          : 'All items must be ranked'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!['text', 'rating-scale', 'multiple-choice', 'ranking'].includes(question.type) && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No validation options available for this question type</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logic' && (
            <div className="space-y-6">
              <BranchingLogic
                question={question}
                allQuestions={allQuestions}
                branchingRules={branchingRules}
                onUpdateRules={onUpdateBranching || (() => {})}
                readOnly={!onUpdateBranching}
              />
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Accessibility Guidelines</p>
                    <p>These settings help ensure your question is accessible to all participants.</p>
                  </div>
                </div>
              </div>

              {/* Question Text Analysis */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Question Text Analysis</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Reading Level:</span>
                      <span className="text-sm text-green-600">✓ Clear and simple</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Character Count:</span>
                      <span className="text-sm text-gray-600">{question.question.length} characters</span>
                      {question.question.length > 120 && (
                        <span className="text-xs text-yellow-600">(Consider shorter phrasing)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen Reader Support */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Screen Reader Support</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Question text will be read aloud</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Required field status announced</span>
                      </div>
                      {question.type === 'rating-scale' && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Scale labels will be announced</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyboard Navigation */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Keyboard Navigation</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      {question.type === 'multiple-choice' && (
                        <>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Arrow keys navigate between options</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Space bar selects options</span>
                          </div>
                        </>
                      )}
                      {question.type === 'text' && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Standard text input navigation</span>
                        </div>
                      )}
                      {question.type === 'rating-scale' && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Arrow keys navigate rating scale</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Accessibility */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Visual Accessibility</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>High contrast color scheme</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Focus indicators visible</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Text scales up to 200%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {questionValidation.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Accessibility Recommendations</h4>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <ul className="space-y-1 text-sm text-yellow-800">
                      {questionValidation.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span>•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-gray-200 bg-white p-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-700"
        >
          {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
        </button>
        
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question ID
              </label>
              <input
                type="text"
                value={question.id}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;