import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
  HelpCircle,
  Star,
  ArrowUp,
  ArrowDown,
  Move3D,
  Eye,
  Save,
  X
} from 'lucide-react';
import { SurveyQuestion, SurveyResponse, SurveyConfig, BranchingRule } from '../../types';

interface ParticipantSurveyProps {
  studyId: number;
  participantId: string;
  questions: SurveyQuestion[];
  config: SurveyConfig;
  title?: string;
  description?: string;
  estimatedDuration?: number;
  onComplete: (responses: SurveyResponse[]) => void;
  onPartialSave?: (responses: SurveyResponse[]) => void;
  initialResponses?: SurveyResponse[];
}

interface ValidationError {
  questionId: string;
  message: string;
}

interface QuestionResponse {
  questionId: string;
  response: any;
  responseTime: number;
  startTime: number;
}

const ParticipantSurvey: React.FC<ParticipantSurveyProps> = ({
  studyId,
  participantId,
  questions,
  config,
  title = 'Survey',
  description,
  estimatedDuration = 5,
  onComplete,
  onPartialSave,
  initialResponses = []
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, QuestionResponse>>(new Map());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [draggedRankingItem, setDraggedRankingItem] = useState<{ questionId: string; optionId: string; index: number } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  // Initialize responses from saved data
  useEffect(() => {
    if (initialResponses.length > 0) {
      const responseMap = new Map<string, QuestionResponse>();
      initialResponses.forEach(response => {
        responseMap.set(response.questionId, {
          questionId: response.questionId,
          response: response.response,
          responseTime: response.responseTime,
          startTime: response.timestamp - response.responseTime
        });
      });
      setResponses(responseMap);
    }
  }, [initialResponses]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (config.validationSettings.allowSkipValidation && onPartialSave) {
      const interval = setInterval(() => {
        savePartialResponses();
      }, 30000); // Auto-save every 30 seconds

      autoSaveIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [responses, config.validationSettings.allowSkipValidation, onPartialSave]);

  // Track question timing
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const savePartialResponses = useCallback(() => {
    if (!onPartialSave) return;

    const surveyResponses: SurveyResponse[] = Array.from(responses.values()).map(response => ({
      participantId,
      studyId,
      questionId: response.questionId,
      response: response.response,
      responseTime: response.responseTime,
      timestamp: response.startTime + response.responseTime
    }));

    onPartialSave(surveyResponses);
  }, [responses, participantId, studyId, onPartialSave]);

  const validateResponse = useCallback((question: SurveyQuestion, response: any): string | null => {
    if (question.required && (response === null || response === undefined || response === '')) {
      return 'This question is required';
    }

    switch (question.type) {
      case 'text':
        if (typeof response !== 'string') return null;
        
        if (question.validation?.minLength && response.length < question.validation.minLength) {
          return `Response must be at least ${question.validation.minLength} characters`;
        }
        
        if (question.validation?.maxLength && response.length > question.validation.maxLength) {
          return `Response must be no more than ${question.validation.maxLength} characters`;
        }
        
        if (question.validation?.pattern && !new RegExp(question.validation.pattern).test(response)) {
          return 'Response format is invalid';
        }
        break;

      case 'rating-scale':
        if (typeof response !== 'number') return question.required ? 'Please select a rating' : null;
        
        const min = question.scale?.min || 1;
        const max = question.scale?.max || 5;
        
        if (response < min || response > max) {
          return `Rating must be between ${min} and ${max}`;
        }
        break;

      case 'multiple-choice':
        if (!response && question.required) {
          return 'Please select an option';
        }
        break;

      case 'boolean':
        if (typeof response !== 'boolean' && question.required) {
          return 'Please select an answer';
        }
        break;

      case 'ranking':
        if (!Array.isArray(response) && question.required) {
          return 'Please rank all items';
        }
        
        if (Array.isArray(response) && question.options) {
          if (response.length !== question.options.length) {
            return 'Please rank all items';
          }
        }
        break;
    }

    return null;
  }, []);

  const updateResponse = useCallback((questionId: string, response: any) => {
    const responseTime = Date.now() - questionStartTime;
    
    setResponses(prev => {
      const newMap = new Map(prev);
      newMap.set(questionId, {
        questionId,
        response,
        responseTime,
        startTime: questionStartTime
      });
      return newMap;
    });

    // Clear validation errors for this question
    setValidationErrors(prev => prev.filter(error => error.questionId !== questionId));
  }, [questionStartTime]);

  const validateCurrentQuestion = useCallback((): boolean => {
    const currentQuestion = questions[currentQuestionIndex];
    const response = responses.get(currentQuestion.id)?.response;
    const error = validateResponse(currentQuestion, response);

    if (error) {
      setValidationErrors([{ questionId: currentQuestion.id, message: error }]);
      return false;
    }

    setValidationErrors([]);
    return true;
  }, [currentQuestionIndex, questions, responses, validateResponse]);

  // Evaluate branching rules for the current question
  const evaluateBranchingRules = useCallback(() => {
    const currentQuestion = questions[currentQuestionIndex];
    const response = responses.get(currentQuestion.id)?.response;
    
    // Get branching rules for current question
    const branchingRules = config.branchingLogic?.filter(rule => 
      rule.condition.questionId === currentQuestion.id
    ) || [];
    
    // Evaluate rules in order
    for (const rule of branchingRules) {
      if (evaluateCondition(rule.condition, response)) {
        // Apply the action
        if (rule.action.type === 'end-survey') {
          completeWrapper();
          return true;
        } else if (rule.action.type === 'skip-to' && rule.action.targetId) {
          const targetIndex = questions.findIndex(q => q.id === rule.action.targetId);
          if (targetIndex !== -1) {
            setCurrentQuestionIndex(targetIndex);
            return true;
          }
        }
      }
    }
    
    return false; // No rules matched
  }, [currentQuestionIndex, questions, responses, config.branchingLogic]);
  
  // Evaluate a single condition
  const evaluateCondition = useCallback((condition: BranchingRule['condition'], response: any): boolean => {
    if (response === null || response === undefined) {
      return false;
    }
    
    switch (condition.operator) {
      case 'equals':
        return response === condition.value;
      case 'not-equals':
        return response !== condition.value;
      case 'greater-than':
        return Number(response) > Number(condition.value);
      case 'less-than':
        return Number(response) < Number(condition.value);
      case 'contains':
        return String(response).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return false;
    }
  }, []);

  const goToNext = useCallback(() => {
    if (config.validationSettings.requireAllRequired && !validateCurrentQuestion()) {
      return;
    }

    // First check branching rules
    if (evaluateBranchingRules()) {
      return; // Branching rule was applied
    }

    // Default navigation
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Survey completed
      completeWrapper();
    }
  }, [currentQuestionIndex, questions.length, config.validationSettings.requireAllRequired, validateCurrentQuestion, evaluateBranchingRules]);

  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const completeWrapper = useCallback(() => {
    if (config.completionSettings.showSummaryPage && !showSummary) {
      setShowSummary(true);
      return;
    }

    const surveyResponses: SurveyResponse[] = Array.from(responses.values()).map(response => ({
      participantId,
      studyId,
      questionId: response.questionId,
      response: response.response,
      responseTime: response.responseTime,
      timestamp: response.startTime + response.responseTime
    }));

    setIsComplete(true);
    onComplete(surveyResponses);
  }, [config.completionSettings.showSummaryPage, showSummary, responses, participantId, studyId, onComplete]);

  const getProgressPercentage = (): number => {
    if (showSummary) return 100;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const currentResponse = responses.get(question.id)?.response;
    const error = validationErrors.find(e => e.questionId === question.id);

    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-3">
            <textarea
              value={currentResponse || ''}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder="Type your answer here..."
              rows={isMobile ? 4 : 6}
              className={`w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={question.validation?.maxLength}
            />
            {question.validation?.maxLength && (
              <div className="text-right text-sm text-gray-500">
                {(currentResponse || '').length} / {question.validation.maxLength} characters
              </div>
            )}
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentResponse === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${error ? 'border-red-500' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.value}
                  checked={currentResponse === option.value}
                  onChange={() => updateResponse(question.id, option.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case 'rating-scale':
        const scale = question.scale || { min: 1, max: 5 };
        return (
          <div className="space-y-4">
            <div className={`flex justify-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
              {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
                const value = scale.min + i;
                return (
                  <button
                    key={value}
                    onClick={() => updateResponse(question.id, value)}
                    className={`${
                      isMobile ? 'w-full' : 'w-12 h-12'
                    } p-3 border rounded-lg font-medium transition-colors ${
                      currentResponse === value
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    } ${error ? 'border-red-500' : ''}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            
            {scale.labels && scale.labels.length > 0 && (
              <div className={`flex justify-between text-sm text-gray-600 ${
                isMobile ? 'flex-col space-y-1 text-center' : ''
              }`}>
                <span>{scale.labels[0]}</span>
                {scale.labels.length > 2 && !isMobile && (
                  <span className="text-center">{scale.labels[Math.floor(scale.labels.length / 2)]}</span>
                )}
                <span>{scale.labels[scale.labels.length - 1]}</span>
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex space-x-4">
            {[
              { value: true, label: 'Yes', color: 'green' },
              { value: false, label: 'No', color: 'red' }
            ].map(({ value, label, color }) => (
              <button
                key={String(value)}
                onClick={() => updateResponse(question.id, value)}
                className={`flex-1 p-4 border rounded-lg font-medium transition-colors ${
                  currentResponse === value
                    ? `border-${color}-500 bg-${color}-500 text-white`
                    : `border-gray-300 hover:border-${color}-300 hover:bg-${color}-50`
                } ${error ? 'border-red-500' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        );

      case 'ranking':
        const rankingResponse = currentResponse || [];
        const unrankedOptions = question.options?.filter(option => 
          !rankingResponse.find((item: any) => item.id === option.id)
        ) || [];

        return (
          <div className="space-y-4">
            {/* Ranked items */}
            {rankingResponse.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Your Ranking:</h4>
                <div className="space-y-2">
                  {rankingResponse.map((item: any, index: number) => (
                    <div
                      key={item.id}
                      className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.text}</span>
                      </div>
                      <div className="ml-auto flex space-x-1">
                        <button
                          onClick={() => {
                            const newRanking = [...rankingResponse];
                            if (index > 0) {
                              [newRanking[index], newRanking[index - 1]] = [newRanking[index - 1], newRanking[index]];
                              updateResponse(question.id, newRanking);
                            }
                          }}
                          disabled={index === 0}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const newRanking = [...rankingResponse];
                            if (index < newRanking.length - 1) {
                              [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
                              updateResponse(question.id, newRanking);
                            }
                          }}
                          disabled={index === rankingResponse.length - 1}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const newRanking = rankingResponse.filter((_: any, i: number) => i !== index);
                            updateResponse(question.id, newRanking);
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unranked items */}
            {unrankedOptions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {rankingResponse.length > 0 ? 'Remaining Items:' : 'Click to rank items:'}
                </h4>
                <div className="space-y-2">
                  {unrankedOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        const newRanking = [...rankingResponse, option];
                        updateResponse(question.id, newRanking);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Move3D className="w-4 h-4 text-gray-400" />
                        <span>{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Complete!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for taking the time to complete this survey. Your responses have been recorded.
          </p>
          <div className="text-sm text-gray-500">
            <p>Completion time: {Math.round((Date.now() - startTime) / 60000)} minutes</p>
          </div>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg">
            {/* Progress bar */}
            {config.showProgressIndicator && (
              <div className="h-2 bg-gray-200 rounded-t-lg">
                <div 
                  className="h-2 bg-blue-600 rounded-t-lg transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}

            <div className="p-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Responses</h2>
                <p className="text-gray-600">Please review your answers before submitting</p>
              </div>

              <div className="space-y-6 mb-8">
                {questions.map((question, index) => {
                  const response = responses.get(question.id);
                  return (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-medium rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                          <div className="text-gray-700">
                            {response ? (
                              <div>
                                {question.type === 'ranking' && Array.isArray(response.response) ? (
                                  <ol className="list-decimal list-inside space-y-1">
                                    {response.response.map((item: any) => (
                                      <li key={item.id}>{item.text}</li>
                                    ))}
                                  </ol>
                                ) : question.type === 'multiple-choice' ? (
                                  question.options?.find(opt => opt.value === response.response)?.text || response.response
                                ) : question.type === 'boolean' ? (
                                  response.response ? 'Yes' : 'No'
                                ) : (
                                  response.response
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No response</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowSummary(false);
                    setCurrentQuestionIndex(questions.length - 1);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Edit</span>
                </button>
                <button
                  onClick={completeWrapper}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Survey</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600">This survey has no questions configured.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentError = validationErrors.find(e => e.questionId === currentQuestion.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg min-h-screen">
          {/* Progress bar */}
          {config.showProgressIndicator && (
            <div className="h-2 bg-gray-200">
              <div 
                className="h-2 bg-blue-600 transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          )}

          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-gray-600 mt-1">{description}</p>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>~{estimatedDuration} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{currentQuestionIndex + 1} of {questions.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="flex-1 p-6" ref={questionRef}>
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {currentQuestionIndex + 1}
                  </span>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {currentQuestion.question}
                      {currentQuestion.required && (
                        <Star className="inline w-4 h-4 text-red-500 fill-current ml-1" />
                      )}
                    </h2>
                    
                    {currentError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{currentError.message}</span>
                        </div>
                      </div>
                    )}

                    {renderQuestion(currentQuestion)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-4">
                {config.allowPartialCompletion && onPartialSave && (
                  <button
                    onClick={savePartialResponses}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Progress</span>
                  </button>
                )}

                <button
                  onClick={goToNext}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <span>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                  </span>
                  {currentQuestionIndex === questions.length - 1 ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantSurvey;