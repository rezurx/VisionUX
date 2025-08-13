import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Move3d, 
  Eye, 
  Save, 
  Settings, 
  Type, 
  List, 
  BarChart3, 
  ToggleLeft, 
  ArrowUpDown,
  Grid3x3,
  Star,
  ChevronUp,
  ChevronDown,
  Play,
  Palette,
  Layout,
  Timer
} from 'lucide-react';
import { SurveyQuestion, BranchingRule, SurveyConfig } from '../../types';
import QuestionEditor from './QuestionEditor';
import SurveyTemplates from './SurveyTemplates';

interface SurveyBuilderProps {
  studyId?: number;
  initialQuestions?: SurveyQuestion[];
  initialConfig?: SurveyConfig;
  onSave?: (questions: SurveyQuestion[], config: SurveyConfig) => void;
  onPreview?: (questions: SurveyQuestion[], config: SurveyConfig) => void;
  readOnly?: boolean;
}

interface QuestionType {
  type: SurveyQuestion['type'];
  icon: React.ReactNode;
  label: string;
  description: string;
  category: 'basic' | 'advanced' | 'rating';
}

const QUESTION_TYPES: QuestionType[] = [
  {
    type: 'text',
    icon: <Type className="w-5 h-5" />,
    label: 'Text Input',
    description: 'Open-ended text response',
    category: 'basic'
  },
  {
    type: 'multiple-choice',
    icon: <List className="w-5 h-5" />,
    label: 'Multiple Choice',
    description: 'Select one option from many',
    category: 'basic'
  },
  {
    type: 'rating-scale',
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Rating Scale',
    description: 'Numerical rating scale',
    category: 'rating'
  },
  {
    type: 'boolean',
    icon: <ToggleLeft className="w-5 h-5" />,
    label: 'Yes/No',
    description: 'Simple boolean choice',
    category: 'basic'
  },
  {
    type: 'ranking',
    icon: <ArrowUpDown className="w-5 h-5" />,
    label: 'Ranking',
    description: 'Rank items in order of preference',
    category: 'advanced'
  }
];

const DEFAULT_CONFIG: SurveyConfig = {
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
    allowReview: false,
    allowEdit: false
  }
};

const SurveyBuilder: React.FC<SurveyBuilderProps> = ({
  studyId,
  initialQuestions = [],
  initialConfig = DEFAULT_CONFIG,
  onSave,
  onPreview,
  readOnly = false
}) => {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [config, setConfig] = useState<SurveyConfig>(initialConfig);
  const [branchingRules, setBranchingRules] = useState<BranchingRule[]>(initialConfig.branchingLogic || []);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'question' | 'new'; id?: string; questionType?: SurveyQuestion['type'] } | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState<string | null>(null);
  const [surveyTitle, setSurveyTitle] = useState('Untitled Survey');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(5);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const builderRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Track changes for unsaved indicator
  useEffect(() => {
    setIsUnsaved(true);
  }, [questions, config, surveyTitle, surveyDescription]);

  const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createNewQuestion = useCallback((type: SurveyQuestion['type']): SurveyQuestion => {
    const baseQuestion: SurveyQuestion = {
      id: generateQuestionId(),
      type,
      question: '',
      required: false
    };

    switch (type) {
      case 'multiple-choice':
        return {
          ...baseQuestion,
          question: 'Select one option:',
          options: [
            { id: 'opt1', text: 'Option 1', value: 'option1' },
            { id: 'opt2', text: 'Option 2', value: 'option2' }
          ]
        };
      case 'rating-scale':
        return {
          ...baseQuestion,
          question: 'Rate this on a scale:',
          scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] }
        };
      case 'text':
        return {
          ...baseQuestion,
          question: 'Please provide your answer:',
          validation: { maxLength: 500 }
        };
      case 'boolean':
        return {
          ...baseQuestion,
          question: 'Do you agree?'
        };
      case 'ranking':
        return {
          ...baseQuestion,
          question: 'Rank these items in order of preference:',
          options: [
            { id: 'item1', text: 'Item 1', value: 'item1' },
            { id: 'item2', text: 'Item 2', value: 'item2' },
            { id: 'item3', text: 'Item 3', value: 'item3' }
          ]
        };
      default:
        return baseQuestion;
    }
  }, []);

  const addQuestion = useCallback((type: SurveyQuestion['type'], position?: number) => {
    const newQuestion = createNewQuestion(type);
    const insertPosition = position !== undefined ? position : questions.length;
    
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions.splice(insertPosition, 0, newQuestion);
      return newQuestions;
    });
    
    setSelectedQuestionId(newQuestion.id);
  }, [createNewQuestion, questions.length]);

  const updateQuestion = useCallback((id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, []);

  const duplicateQuestion = useCallback((id: string) => {
    const questionToDuplicate = questions.find(q => q.id === id);
    if (!questionToDuplicate) return;

    const duplicatedQuestion = {
      ...questionToDuplicate,
      id: generateQuestionId(),
      question: `${questionToDuplicate.question} (Copy)`
    };

    const originalIndex = questions.findIndex(q => q.id === id);
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions.splice(originalIndex + 1, 0, duplicatedQuestion);
      return newQuestions;
    });
  }, [questions]);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null);
    }
  }, [selectedQuestionId]);

  const moveQuestion = useCallback((fromIndex: number, toIndex: number) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      const [moved] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, moved);
      return newQuestions;
    });
  }, []);

  // Drag and Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: { type: 'question' | 'new'; id?: string; questionType?: SurveyQuestion['type'] }) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dropZone: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropZoneActive(dropZone);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropZoneActive(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropPosition: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.type === 'new' && draggedItem.questionType) {
      addQuestion(draggedItem.questionType, dropPosition);
    } else if (draggedItem.type === 'question' && draggedItem.id) {
      const fromIndex = questions.findIndex(q => q.id === draggedItem.id);
      if (fromIndex !== -1 && fromIndex !== dropPosition) {
        moveQuestion(fromIndex, dropPosition);
      }
    }

    setDraggedItem(null);
    setDropZoneActive(null);
  }, [draggedItem, questions, addQuestion, moveQuestion]);

  const handleSave = useCallback(() => {
    if (onSave) {
      const configWithBranching = {
        ...config,
        branchingLogic: branchingRules
      };
      onSave(questions, configWithBranching);
      setIsUnsaved(false);
    }
  }, [questions, config, branchingRules, onSave]);

  const updateBranchingRules = useCallback((rules: BranchingRule[]) => {
    setBranchingRules(rules);
    setIsUnsaved(true);
  }, []);

  const handleTemplateSelect = useCallback((template: any) => {
    setQuestions(template.questions);
    setConfig({ ...config, ...template.config });
    setSurveyTitle(template.name);
    setSurveyDescription(template.description);
    setEstimatedDuration(template.estimatedTime);
    if (template.config.branchingLogic) {
      setBranchingRules(template.config.branchingLogic);
    }
    setShowTemplates(false);
    setIsUnsaved(true);
  }, [config]);

  const handlePreview = useCallback(() => {
    if (onPreview) {
      onPreview(questions, config);
    } else {
      setShowPreview(true);
    }
  }, [questions, config, onPreview]);

  const getQuestionPreview = (question: SurveyQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option.id} className="flex items-center space-x-2 text-sm">
                <input type="radio" name={`preview-${question.id}`} className="rounded" />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        );
      case 'rating-scale':
        return (
          <div className="flex items-center space-x-2">
            {Array.from({ length: (question.scale?.max || 5) - (question.scale?.min || 1) + 1 }, (_, i) => (
              <button key={i} className="w-8 h-8 border rounded-full text-sm hover:bg-gray-100">
                {(question.scale?.min || 1) + i}
              </button>
            ))}
          </div>
        );
      case 'text':
        return <textarea className="w-full p-2 border rounded resize-none" rows={3} placeholder="Type your answer here..." />;
      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm">
              <input type="radio" name={`preview-${question.id}`} />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input type="radio" name={`preview-${question.id}`} />
              <span>No</span>
            </label>
          </div>
        );
      case 'ranking':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2 p-2 border rounded bg-gray-50">
                <Move3d className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{index + 1}. {option.text}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  if (readOnly && questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">No survey questions configured</p>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Question Type Palette */}
      {!readOnly && (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Types</h3>
            <p className="text-sm text-gray-600">Drag to add questions</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {['basic', 'rating', 'advanced'].map(category => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  {QUESTION_TYPES.filter(type => type.category === category).map(questionType => (
                    <div
                      key={questionType.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { type: 'new', questionType: questionType.type })}
                      className="p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {questionType.icon}
                        <span className="font-medium text-sm">{questionType.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{questionType.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Builder Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none w-full"
                placeholder="Survey Title"
                readOnly={readOnly}
              />
              <textarea
                value={surveyDescription}
                onChange={(e) => setSurveyDescription(e.target.value)}
                className="text-sm text-gray-600 bg-transparent border-none outline-none w-full resize-none mt-1"
                placeholder="Survey description (optional)"
                rows={2}
                readOnly={readOnly}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {isUnsaved && !readOnly && (
                <span className="text-sm text-amber-600 flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                  Unsaved changes
                </span>
              )}
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Timer className="w-4 h-4" />
                <span>Est. {estimatedDuration} min</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <List className="w-4 h-4" />
                <span>{questions.length} questions</span>
              </div>
              {!readOnly && (
                <>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                  >
                    <Layout className="w-4 h-4" />
                    <span>Templates</span>
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handlePreview}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Survey Builder Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Questions List */}
          <div className="flex-1 overflow-y-auto p-6" ref={builderRef}>
            <div className="max-w-3xl mx-auto space-y-4">
              {questions.length === 0 ? (
                <div 
                  ref={dropZoneRef}
                  onDragOver={(e) => handleDragOver(e, 'empty')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 0)}
                  className={`border-2 border-dashed rounded-lg p-12 text-center ${
                    dropZoneActive === 'empty' 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="text-gray-400 mb-4">
                    <Grid3x3 className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-2">No questions yet</p>
                  {!readOnly && (
                    <p className="text-sm text-gray-500">
                      Drag question types from the sidebar to start building your survey
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="group">
                      {/* Drop Zone Above */}
                      {!readOnly && (
                        <div
                          onDragOver={(e) => handleDragOver(e, `above-${index}`)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`h-4 -mb-2 transition-all ${
                            dropZoneActive === `above-${index}` 
                              ? 'bg-blue-200 rounded' 
                              : ''
                          }`}
                        />
                      )}
                      
                      {/* Question Card */}
                      <div
                        draggable={!readOnly}
                        onDragStart={(e) => handleDragStart(e, { type: 'question', id: question.id })}
                        className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${
                          selectedQuestionId === question.id 
                            ? 'border-blue-400 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!readOnly && 'cursor-move'}`}
                        onClick={() => !readOnly && setSelectedQuestionId(question.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">
                                Q{index + 1}
                              </span>
                              <div className="flex items-center space-x-1">
                                {QUESTION_TYPES.find(t => t.type === question.type)?.icon}
                                <span className="text-sm text-gray-600">
                                  {QUESTION_TYPES.find(t => t.type === question.type)?.label}
                                </span>
                              </div>
                              {question.required && (
                                <Star className="w-4 h-4 text-red-500 fill-current" />
                              )}
                            </div>
                            
                            <h4 className="font-medium text-gray-900 mb-3">
                              {question.question || 'Untitled Question'}
                            </h4>
                            
                            {/* Question Preview */}
                            <div className="space-y-2">
                              {getQuestionPreview(question)}
                            </div>
                          </div>

                          {!readOnly && (
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateQuestion(question.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="Duplicate question"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteQuestion(question.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Drop Zone Below */}
                      {!readOnly && index === questions.length - 1 && (
                        <div
                          onDragOver={(e) => handleDragOver(e, `below-${index}`)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index + 1)}
                          className={`h-4 -mt-2 transition-all ${
                            dropZoneActive === `below-${index}` 
                              ? 'bg-blue-200 rounded' 
                              : ''
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Question Editor Sidebar */}
          {selectedQuestion && !readOnly && (
            <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
              <QuestionEditor
                question={selectedQuestion}
                allQuestions={questions}
                branchingRules={branchingRules.filter(rule => rule.condition.questionId === selectedQuestion.id)}
                onUpdate={(updates) => updateQuestion(selectedQuestion.id, updates)}
                onUpdateBranching={updateBranchingRules}
                onClose={() => setSelectedQuestionId(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && !readOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Survey Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  min="1"
                  max="120"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Participant Experience</h4>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.showProgressIndicator}
                    onChange={(e) => setConfig(prev => ({ ...prev, showProgressIndicator: e.target.checked }))}
                  />
                  <span className="text-sm">Show progress indicator</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.allowPartialCompletion}
                    onChange={(e) => setConfig(prev => ({ ...prev, allowPartialCompletion: e.target.checked }))}
                  />
                  <span className="text-sm">Allow partial completion</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.randomizeQuestionOrder}
                    onChange={(e) => setConfig(prev => ({ ...prev, randomizeQuestionOrder: e.target.checked }))}
                  />
                  <span className="text-sm">Randomize question order</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.randomizeOptionOrder}
                    onChange={(e) => setConfig(prev => ({ ...prev, randomizeOptionOrder: e.target.checked }))}
                  />
                  <span className="text-sm">Randomize answer options</span>
                </label>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Completion Settings</h4>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.completionSettings.showSummaryPage}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      completionSettings: {
                        ...prev.completionSettings,
                        showSummaryPage: e.target.checked
                      }
                    }))}
                  />
                  <span className="text-sm">Show summary page on completion</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.completionSettings.allowReview}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      completionSettings: {
                        ...prev.completionSettings,
                        allowReview: e.target.checked
                      }
                    }))}
                  />
                  <span className="text-sm">Allow participants to review answers</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Survey Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{surveyTitle}</h2>
                  {surveyDescription && (
                    <p className="text-gray-600 mb-4">{surveyDescription}</p>
                  )}
                  <p className="text-sm text-gray-500">Estimated time: {estimatedDuration} minutes</p>
                </div>

                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-medium rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-3">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </h4>
                          {getQuestionPreview(question)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {questions.length} questions total
                  </div>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Submit Survey
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Survey Templates Modal */}
      {showTemplates && (
        <SurveyTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default SurveyBuilder;