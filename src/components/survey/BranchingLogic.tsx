import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Settings,
  ArrowRight,
  GitBranch,
  Target,
  AlertCircle,
  Copy,
  CheckCircle,
  XCircle,
  Shuffle,
  Zap,
  Filter
} from 'lucide-react';
import { SurveyQuestion, BranchingRule } from '../../types';

interface BranchingLogicProps {
  question: SurveyQuestion;
  allQuestions: SurveyQuestion[];
  branchingRules?: BranchingRule[];
  onUpdateRules: (rules: BranchingRule[]) => void;
  readOnly?: boolean;
}

interface BranchingRuleUI extends BranchingRule {
  isExpanded?: boolean;
  isValid?: boolean;
  hasWarning?: boolean;
  warningMessage?: string;
}

interface AdvancedCondition {
  type: 'simple' | 'compound' | 'computed';
  conditions?: BranchingRule['condition'][];
  logic?: 'AND' | 'OR';
  computation?: {
    field: string;
    operation: 'sum' | 'average' | 'count' | 'min' | 'max';
    threshold: number;
  };
}

const BranchingLogic: React.FC<BranchingLogicProps> = ({
  question,
  allQuestions,
  branchingRules = [],
  onUpdateRules,
  readOnly = false
}) => {
  const [rules, setRules] = useState<BranchingRuleUI[]>(
    branchingRules.map(rule => ({ ...rule, isExpanded: false, isValid: validateRule(rule) }))
  );
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get questions that come after this question (valid targets)
  const getTargetQuestions = useCallback(() => {
    const currentIndex = allQuestions.findIndex(q => q.id === question.id);
    return allQuestions.slice(currentIndex + 1).map(q => ({
      id: q.id,
      text: q.question || 'Untitled Question',
      type: q.type
    }));
  }, [allQuestions, question.id]);

  // Enhanced operators based on question type
  const getAvailableOperators = useCallback((questionType: string) => {
    const baseOperators = [
      { value: 'equals', label: 'equals', description: 'Exactly matches' },
      { value: 'not-equals', label: 'does not equal', description: 'Does not match' }
    ];

    const numericOperators = [
      { value: 'greater-than', label: 'is greater than', description: 'Numeric comparison' },
      { value: 'less-than', label: 'is less than', description: 'Numeric comparison' },
      { value: 'greater-equal', label: 'is greater than or equal to', description: 'Inclusive comparison' },
      { value: 'less-equal', label: 'is less than or equal to', description: 'Inclusive comparison' },
      { value: 'between', label: 'is between', description: 'Range comparison' }
    ];

    const textOperators = [
      { value: 'contains', label: 'contains', description: 'Text includes substring' },
      { value: 'not-contains', label: 'does not contain', description: 'Text excludes substring' },
      { value: 'starts-with', label: 'starts with', description: 'Text begins with' },
      { value: 'ends-with', label: 'ends with', description: 'Text ends with' },
      { value: 'matches-pattern', label: 'matches pattern', description: 'Regular expression match' }
    ];

    const selectionOperators = [
      { value: 'includes', label: 'includes', description: 'Selection contains option' },
      { value: 'excludes', label: 'excludes', description: 'Selection does not contain option' }
    ];

    switch (questionType) {
      case 'rating-scale':
        return [...baseOperators, ...numericOperators];
      case 'text':
        return [...baseOperators, ...textOperators];
      case 'multiple-choice':
      case 'ranking':
        return [...baseOperators, ...selectionOperators];
      case 'boolean':
        return baseOperators;
      default:
        return baseOperators;
    }
  }, []);

  // Enhanced validation with warnings
  const validateRule = useCallback((rule: BranchingRule): { isValid: boolean; hasWarning?: boolean; warningMessage?: string } => {
    // Check if condition is valid
    if (!rule.condition?.questionId || !rule.condition?.operator || rule.condition?.value === undefined) {
      return { isValid: false };
    }

    // Check if action is valid
    if (!rule.action?.type || (rule.action.type !== 'end-survey' && !rule.action?.targetId)) {
      return { isValid: false };
    }

    // Check for potential infinite loops
    if (rule.action.type === 'skip-to' && rule.action.targetId === rule.condition.questionId) {
      return { 
        isValid: true, 
        hasWarning: true, 
        warningMessage: 'This rule may create a circular reference' 
      };
    }

    // Check for unreachable questions
    const targetIndex = allQuestions.findIndex(q => q.id === rule.action.targetId);
    const currentIndex = allQuestions.findIndex(q => q.id === rule.condition.questionId);
    if (targetIndex <= currentIndex && rule.action.type === 'skip-to') {
      return { 
        isValid: true, 
        hasWarning: true, 
        warningMessage: 'This rule skips backwards, which may confuse participants' 
      };
    }

    return { isValid: true };
  }, [allQuestions]);

  const generateRuleId = () => `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add quick rule templates
  const addRule = useCallback((template?: 'basic' | 'skip-logic' | 'end-survey') => {
    const targetQuestions = getTargetQuestions();
    let newRule: BranchingRuleUI;

    switch (template) {
      case 'skip-logic':
        newRule = {
          id: generateRuleId(),
          condition: {
            questionId: question.id,
            operator: 'equals',
            value: question.type === 'boolean' ? 'Yes' : ''
          },
          action: {
            type: 'skip-to',
            targetId: targetQuestions[Math.min(2, targetQuestions.length - 1)]?.id || ''
          },
          isExpanded: true,
          isValid: false
        };
        break;
      case 'end-survey':
        newRule = {
          id: generateRuleId(),
          condition: {
            questionId: question.id,
            operator: question.type === 'rating-scale' ? 'less-than' : 'equals',
            value: question.type === 'rating-scale' ? '3' : 'No'
          },
          action: {
            type: 'end-survey',
            targetId: ''
          },
          isExpanded: true,
          isValid: false
        };
        break;
      default:
        newRule = {
          id: generateRuleId(),
          condition: {
            questionId: question.id,
            operator: 'equals',
            value: ''
          },
          action: {
            type: 'skip-to',
            targetId: targetQuestions[0]?.id || ''
          },
          isExpanded: true,
          isValid: false
        };
    }

    const validation = validateRule(newRule);
    newRule.isValid = validation.isValid;
    newRule.hasWarning = validation.hasWarning;
    newRule.warningMessage = validation.warningMessage;

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    onUpdateRules(updatedRules);
  }, [rules, question.id, question.type, getTargetQuestions, onUpdateRules, validateRule]);

  const updateRule = useCallback((ruleId: string, updates: Partial<BranchingRule>) => {
    const updatedRules = rules.map(rule => {
      if (rule.id === ruleId) {
        const updatedRule = { ...rule, ...updates };
        const validation = validateRule(updatedRule);
        return {
          ...updatedRule,
          isValid: validation.isValid,
          hasWarning: validation.hasWarning,
          warningMessage: validation.warningMessage
        };
      }
      return rule;
    });
    
    setRules(updatedRules);
    onUpdateRules(updatedRules);
  }, [rules, onUpdateRules]);

  const deleteRule = useCallback((ruleId: string) => {
    const updatedRules = rules.filter(rule => rule.id !== ruleId);
    setRules(updatedRules);
    onUpdateRules(updatedRules);
  }, [rules, onUpdateRules]);

  const toggleRuleExpansion = useCallback((ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isExpanded: !rule.isExpanded } : rule
    ));
  }, []);

  const getOperatorOptions = () => {
    return getAvailableOperators(question.type);
  };

  const getValueInput = (rule: BranchingRuleUI) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <select
            value={rule.condition?.value || ''}
            onChange={(e) => updateRule(rule.id, {
              condition: { ...rule.condition!, value: e.target.value }
            })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={readOnly}
          >
            <option value="">Select option...</option>
            {question.options?.map(option => (
              <option key={option.id} value={option.value}>
                {option.text}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <select
            value={rule.condition?.value || ''}
            onChange={(e) => updateRule(rule.id, {
              condition: { ...rule.condition!, value: e.target.value === 'true' }
            })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={readOnly}
          >
            <option value="">Select answer...</option>
            <option value="true">Yes / True</option>
            <option value="false">No / False</option>
          </select>
        );

      case 'rating-scale':
        const scale = question.scale || { min: 1, max: 5 };
        return (
          <select
            value={rule.condition?.value || ''}
            onChange={(e) => updateRule(rule.id, {
              condition: { ...rule.condition!, value: parseInt(e.target.value) }
            })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={readOnly}
          >
            <option value="">Select rating...</option>
            {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
              const value = scale.min + i;
              const label = question.scale?.labels?.[i] || value.toString();
              return (
                <option key={value} value={value}>
                  {value} - {label}
                </option>
              );
            })}
          </select>
        );

      case 'text':
        return (
          <input
            type="text"
            value={rule.condition?.value || ''}
            onChange={(e) => updateRule(rule.id, {
              condition: { ...rule.condition!, value: e.target.value }
            })}
            placeholder="Enter text to match..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            readOnly={readOnly}
          />
        );

      default:
        return (
          <input
            type="text"
            value={rule.condition?.value || ''}
            onChange={(e) => updateRule(rule.id, {
              condition: { ...rule.condition!, value: e.target.value }
            })}
            placeholder="Enter value..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            readOnly={readOnly}
          />
        );
    }
  };

  const getRuleDescription = (rule: BranchingRuleUI) => {
    const condition = rule.condition;
    const action = rule.action;
    
    if (!condition || !action) return 'Incomplete rule';

    let conditionText = '';
    
    // Format condition
    if (question.type === 'multiple-choice' && question.options) {
      const option = question.options.find(opt => opt.value === condition.value);
      conditionText = `answer ${condition.operator === 'equals' ? 'is' : 'is not'} "${option?.text || condition.value}"`;
    } else if (question.type === 'boolean') {
      conditionText = `answer is ${condition.value ? 'Yes' : 'No'}`;
    } else if (question.type === 'rating-scale') {
      const operatorText = condition.operator === 'equals' ? 'equals' : 
                          condition.operator === 'greater-than' ? 'is greater than' :
                          condition.operator === 'less-than' ? 'is less than' : 'does not equal';
      conditionText = `rating ${operatorText} ${condition.value}`;
    } else {
      const operatorText = condition.operator === 'equals' ? 'equals' : 
                          condition.operator === 'contains' ? 'contains' : 
                          condition.operator === 'greater-than' ? 'is greater than' :
                          condition.operator === 'less-than' ? 'is less than' : 'does not equal';
      conditionText = `answer ${operatorText} "${condition.value}"`;
    }

    // Format action
    let actionText = '';
    if (action.type === 'skip-to') {
      const targetQuestion = allQuestions.find(q => q.id === action.targetId);
      actionText = `skip to "${targetQuestion?.question || 'Unknown question'}"`;
    } else if (action.type === 'show') {
      actionText = 'show next question';
    } else if (action.type === 'hide') {
      actionText = 'hide next question';
    } else if (action.type === 'end-survey') {
      actionText = 'end survey';
    }

    return `If ${conditionText}, then ${actionText}`;
  };

  const targetQuestions = getTargetQuestions();

  if (!question || question.type === 'ranking') {
    return (
      <div className="text-center py-8 text-gray-500">
        <GitBranch className="w-8 h-8 mx-auto mb-2" />
        <p>Branching logic is not available for ranking questions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Enhanced Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Branching Logic</h3>
          {rules.length > 0 && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {rules.filter(r => r.isValid).length} of {rules.length} valid
            </span>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center space-x-2">
            {/* Quick Rule Templates */}
            <div className="relative">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>Templates</span>
              </button>
              {showAdvanced && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { addRule('skip-logic'); setShowAdvanced(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      disabled={targetQuestions.length === 0}
                    >
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-3 h-3" />
                        <div>
                          <div className="font-medium">Skip Logic</div>
                          <div className="text-xs text-gray-500">Skip ahead based on answer</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => { addRule('end-survey'); setShowAdvanced(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-3 h-3" />
                        <div>
                          <div className="font-medium">Early Exit</div>
                          <div className="text-xs text-gray-500">End survey early</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => addRule()}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              disabled={targetQuestions.length === 0}
            >
              <Plus className="w-4 h-4" />
              <span>Add Rule</span>
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <p>Set conditions based on this question's response to control survey flow. Participants will skip to different questions or end the survey early based on their answers.</p>
          </div>
        </div>
      </div>

      {targetQuestions.length === 0 && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">No target questions available. Add more questions after this one to enable branching.</span>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              className={`border rounded-lg ${rule.isValid ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}
            >
              {/* Rule Header */}
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <button
                        onClick={() => toggleRuleExpansion(rule.id)}
                        className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        {rule.isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>Rule {index + 1}</span>
                      </button>
                      {!rule.isValid && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <XCircle className="w-3 h-3" />
                          <span className="text-xs">Incomplete</span>
                        </div>
                      )}
                      {rule.isValid && !rule.hasWarning && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs">Valid</span>
                        </div>
                      )}
                      {rule.hasWarning && (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs">Warning</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{getRuleDescription(rule)}</p>
                    {rule.hasWarning && rule.warningMessage && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <div className="flex items-start space-x-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{rule.warningMessage}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          const duplicatedRule = {
                            ...rule,
                            id: generateRuleId(),
                            isExpanded: false
                          };
                          const updatedRules = [...rules, duplicatedRule];
                          setRules(updatedRules);
                          onUpdateRules(updatedRules);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Duplicate rule"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Rule Configuration */}
              {rule.isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-4">
                    {/* Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">If answer</span>
                        <select
                          value={rule.condition?.operator || ''}
                          onChange={(e) => updateRule(rule.id, {
                            condition: { 
                              ...rule.condition!, 
                              operator: e.target.value as any
                            }
                          })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={readOnly}
                        >
                          {getOperatorOptions().map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {getValueInput(rule)}
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Then</span>
                        <select
                          value={rule.action?.type || ''}
                          onChange={(e) => updateRule(rule.id, {
                            action: { 
                              ...rule.action!, 
                              type: e.target.value as any,
                              targetId: e.target.value === 'end-survey' ? '' : rule.action?.targetId
                            }
                          })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={readOnly}
                        >
                          <option value="skip-to">skip to question</option>
                          <option value="end-survey">end survey</option>
                        </select>
                        {rule.action?.type === 'skip-to' && (
                          <select
                            value={rule.action?.targetId || ''}
                            onChange={(e) => updateRule(rule.id, {
                              action: { ...rule.action!, targetId: e.target.value }
                            })}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={readOnly}
                          >
                            <option value="">Select question...</option>
                            {targetQuestions.map(q => (
                              <option key={q.id} value={q.id}>
                                {q.text}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-8 h-8 mx-auto mb-2" />
          <p>No branching rules configured</p>
          {!readOnly && targetQuestions.length > 0 && (
            <p className="text-sm mt-1">Add rules to control survey flow based on responses</p>
          )}
        </div>
      )}

      {/* Rule Management Actions */}
      {rules.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Rule Management</span>
            {!readOnly && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all branching rules?')) {
                      setRules([]);
                      onUpdateRules([]);
                    }
                  }}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  disabled={rules.length === 0}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Rule Statistics */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{rules.length}</div>
                <div className="text-xs text-gray-600">Total Rules</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {rules.filter(r => r.isValid && !r.hasWarning).length}
                </div>
                <div className="text-xs text-gray-600">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">
                  {rules.filter(r => r.hasWarning).length}
                </div>
                <div className="text-xs text-gray-600">Warnings</div>
              </div>
            </div>
            
            {/* Rule Summary */}
            {rules.filter(r => r.hasWarning).length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Rule Warnings:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {rules.filter(r => r.hasWarning).map((rule, idx) => (
                    <li key={rule.id} className="flex items-start space-x-1">
                      <span>•</span>
                      <span>Rule {rules.indexOf(rule) + 1}: {rule.warningMessage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Help Text */}
      {rules.length === 0 && !readOnly && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Pro Tips for Branching Logic:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use skip logic to reduce survey length based on relevant responses</li>
            <li>• Consider ending surveys early for disqualified participants</li>
            <li>• Test your branching logic with the preview feature</li>
            <li>• Keep rules simple and avoid complex nested conditions</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BranchingLogic;