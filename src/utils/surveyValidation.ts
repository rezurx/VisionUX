import { SurveyQuestion, SurveyResponse, SurveyConfig, ValidationRule } from '../types';

// Survey validation interfaces
export interface SurveyValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 quality score
}

export interface ValidationError {
  type: 'question' | 'response' | 'config' | 'structure';
  questionId?: string;
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'question' | 'response' | 'config' | 'structure';
  questionId?: string;
  code: string;
  message: string;
  suggestion: string;
}

export interface ResponseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Question validation rules
const QUESTION_VALIDATION_RULES = {
  text: {
    minQuestionLength: 10,
    maxQuestionLength: 200,
    recommendedMaxLength: 500,
    suggestedMinLength: 50
  },
  multipleChoice: {
    minOptions: 2,
    maxOptions: 10,
    recommendedMinOptions: 3,
    recommendedMaxOptions: 5,
    minOptionLength: 1,
    maxOptionLength: 100
  },
  ratingScale: {
    minRange: 2,
    maxRange: 10,
    recommendedMinRange: 3,
    recommendedMaxRange: 7,
    defaultMin: 1,
    defaultMax: 5
  },
  ranking: {
    minItems: 2,
    maxItems: 10,
    recommendedMinItems: 3,
    recommendedMaxItems: 6
  }
};

// Survey structure validation rules
const SURVEY_STRUCTURE_RULES = {
  minQuestions: 1,
  maxQuestions: 50,
  recommendedMinQuestions: 3,
  recommendedMaxQuestions: 25,
  maxEstimatedDuration: 60, // minutes
  recommendedMaxDuration: 20
};

/**
 * Validates an entire survey configuration
 */
export function validateSurvey(
  questions: SurveyQuestion[], 
  config: SurveyConfig,
  surveyTitle?: string,
  estimatedDuration?: number
): SurveyValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate survey structure
  const structureValidation = validateSurveyStructure(questions, surveyTitle, estimatedDuration);
  errors.push(...structureValidation.errors);
  warnings.push(...structureValidation.warnings);

  // Validate configuration
  const configValidation = validateSurveyConfig(config, questions);
  errors.push(...configValidation.errors);
  warnings.push(...configValidation.warnings);

  // Validate each question
  questions.forEach(question => {
    const questionValidation = validateQuestion(question);
    errors.push(...questionValidation.errors);
    warnings.push(...questionValidation.warnings);
  });

  // Calculate quality score
  const score = calculateSurveyQualityScore(questions, config, errors, warnings);

  return {
    isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validates survey structure and metadata
 */
function validateSurveyStructure(
  questions: SurveyQuestion[], 
  title?: string, 
  estimatedDuration?: number
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check question count
  if (questions.length < SURVEY_STRUCTURE_RULES.minQuestions) {
    errors.push({
      type: 'structure',
      code: 'INSUFFICIENT_QUESTIONS',
      message: `Survey must have at least ${SURVEY_STRUCTURE_RULES.minQuestions} question`,
      severity: 'critical',
      suggestion: 'Add more questions to create a meaningful survey'
    });
  }

  if (questions.length > SURVEY_STRUCTURE_RULES.maxQuestions) {
    warnings.push({
      type: 'structure',
      code: 'TOO_MANY_QUESTIONS',
      message: `Survey has ${questions.length} questions, which may lead to participant fatigue`,
      suggestion: 'Consider splitting into multiple shorter surveys or removing less critical questions'
    });
  }

  if (questions.length < SURVEY_STRUCTURE_RULES.recommendedMinQuestions) {
    warnings.push({
      type: 'structure',
      code: 'FEW_QUESTIONS',
      message: 'Survey has relatively few questions',
      suggestion: 'Consider adding more questions for richer insights'
    });
  }

  // Check title
  if (!title || title.trim().length === 0) {
    errors.push({
      type: 'structure',
      code: 'MISSING_TITLE',
      message: 'Survey title is required',
      severity: 'medium',
      suggestion: 'Add a clear, descriptive title'
    });
  } else if (title.length < 5) {
    warnings.push({
      type: 'structure',
      code: 'SHORT_TITLE',
      message: 'Survey title is very short',
      suggestion: 'Use a more descriptive title to help participants understand the purpose'
    });
  }

  // Check estimated duration
  if (estimatedDuration && estimatedDuration > SURVEY_STRUCTURE_RULES.maxEstimatedDuration) {
    warnings.push({
      type: 'structure',
      code: 'LONG_DURATION',
      message: `Estimated duration of ${estimatedDuration} minutes may be too long`,
      suggestion: 'Consider reducing survey length to improve completion rates'
    });
  }

  // Check question flow
  const requiredQuestions = questions.filter(q => q.required);
  if (requiredQuestions.length === questions.length && questions.length > 5) {
    warnings.push({
      type: 'structure',
      code: 'ALL_REQUIRED',
      message: 'All questions are marked as required',
      suggestion: 'Consider making some questions optional to reduce participant burden'
    });
  }

  return { errors, warnings };
}

/**
 * Validates survey configuration
 */
function validateSurveyConfig(
  config: SurveyConfig, 
  questions: SurveyQuestion[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate randomization settings
  if (config.randomizeQuestionOrder && questions.some(q => q.type === 'ranking')) {
    warnings.push({
      type: 'config',
      code: 'RANDOMIZE_WITH_RANKING',
      message: 'Question randomization is enabled with ranking questions',
      suggestion: 'Ranking questions work best in a fixed order'
    });
  }

  // Validate validation settings
  if (!config.validationSettings.requireAllRequired && questions.filter(q => q.required).length > 0) {
    warnings.push({
      type: 'config',
      code: 'OPTIONAL_VALIDATION',
      message: 'Required question validation is disabled',
      suggestion: 'Enable validation to ensure data quality'
    });
  }

  // Check completion settings
  if (!config.completionSettings.showSummaryPage && config.completionSettings.allowEdit) {
    errors.push({
      type: 'config',
      code: 'INVALID_EDIT_CONFIG',
      message: 'Edit mode requires summary page to be enabled',
      severity: 'medium',
      suggestion: 'Enable summary page or disable edit functionality'
    });
  }

  return { errors, warnings };
}

/**
 * Validates individual question
 */
export function validateQuestion(question: SurveyQuestion): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate question text
  if (!question.question || question.question.trim().length === 0) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'EMPTY_QUESTION',
      message: 'Question text is required',
      severity: 'high',
      suggestion: 'Add clear, specific question text'
    });
  } else {
    if (question.question.length < QUESTION_VALIDATION_RULES.text.minQuestionLength) {
      warnings.push({
        type: 'question',
        questionId: question.id,
        code: 'SHORT_QUESTION',
        message: 'Question text is very short',
        suggestion: 'Use more descriptive question text for clarity'
      });
    }

    if (question.question.length > QUESTION_VALIDATION_RULES.text.maxQuestionLength) {
      warnings.push({
        type: 'question',
        questionId: question.id,
        code: 'LONG_QUESTION',
        message: 'Question text is very long',
        suggestion: 'Consider shortening the question for better readability'
      });
    }
  }

  // Validate question-specific requirements
  switch (question.type) {
    case 'multiple-choice':
      const mcValidation = validateMultipleChoiceQuestion(question);
      errors.push(...mcValidation.errors);
      warnings.push(...mcValidation.warnings);
      break;

    case 'rating-scale':
      const rsValidation = validateRatingScaleQuestion(question);
      errors.push(...rsValidation.errors);
      warnings.push(...rsValidation.warnings);
      break;

    case 'text':
      const textValidation = validateTextQuestion(question);
      errors.push(...textValidation.errors);
      warnings.push(...textValidation.warnings);
      break;

    case 'ranking':
      const rankingValidation = validateRankingQuestion(question);
      errors.push(...rankingValidation.errors);
      warnings.push(...rankingValidation.warnings);
      break;
  }

  return { errors, warnings };
}

/**
 * Validates multiple choice question
 */
function validateMultipleChoiceQuestion(question: SurveyQuestion): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!question.options || question.options.length === 0) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'NO_OPTIONS',
      message: 'Multiple choice question must have options',
      severity: 'high',
      suggestion: 'Add at least 2 answer options'
    });
    return { errors, warnings };
  }

  // Check option count
  if (question.options.length < QUESTION_VALIDATION_RULES.multipleChoice.minOptions) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'INSUFFICIENT_OPTIONS',
      message: `Multiple choice question must have at least ${QUESTION_VALIDATION_RULES.multipleChoice.minOptions} options`,
      severity: 'high',
      suggestion: 'Add more answer options'
    });
  }

  if (question.options.length > QUESTION_VALIDATION_RULES.multipleChoice.maxOptions) {
    warnings.push({
      type: 'question',
      questionId: question.id,
      code: 'TOO_MANY_OPTIONS',
      message: 'Too many options may confuse participants',
      suggestion: 'Consider reducing to 5-7 options or using ranking'
    });
  }

  // Check option text
  question.options.forEach((option, index) => {
    if (!option.text || option.text.trim().length === 0) {
      errors.push({
        type: 'question',
        questionId: question.id,
        code: 'EMPTY_OPTION',
        message: `Option ${index + 1} is empty`,
        severity: 'medium',
        suggestion: 'Provide text for all options'
      });
    } else if (option.text.length > QUESTION_VALIDATION_RULES.multipleChoice.maxOptionLength) {
      warnings.push({
        type: 'question',
        questionId: question.id,
        code: 'LONG_OPTION',
        message: `Option ${index + 1} is very long`,
        suggestion: 'Keep options concise for better readability'
      });
    }
  });

  // Check for duplicate options
  const optionTexts = question.options.map(o => o.text.toLowerCase().trim());
  const duplicates = optionTexts.filter((text, index) => optionTexts.indexOf(text) !== index);
  if (duplicates.length > 0) {
    warnings.push({
      type: 'question',
      questionId: question.id,
      code: 'DUPLICATE_OPTIONS',
      message: 'Some options appear to be duplicates',
      suggestion: 'Ensure all options are unique and distinct'
    });
  }

  return { errors, warnings };
}

/**
 * Validates rating scale question
 */
function validateRatingScaleQuestion(question: SurveyQuestion): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!question.scale) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'NO_SCALE',
      message: 'Rating scale question must have scale configuration',
      severity: 'high',
      suggestion: 'Configure the rating scale range'
    });
    return { errors, warnings };
  }

  const { min, max, labels } = question.scale;

  // Validate range
  if (min >= max) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'INVALID_RANGE',
      message: 'Scale minimum must be less than maximum',
      severity: 'high',
      suggestion: 'Set a valid range (e.g., 1-5 or 0-10)'
    });
  }

  const range = max - min + 1;
  if (range < QUESTION_VALIDATION_RULES.ratingScale.minRange) {
    warnings.push({
      type: 'question',
      questionId: question.id,
      code: 'SMALL_RANGE',
      message: 'Rating scale range is very small',
      suggestion: 'Consider using a wider range for more nuanced responses'
    });
  }

  if (range > QUESTION_VALIDATION_RULES.ratingScale.maxRange) {
    warnings.push({
      type: 'question',
      questionId: question.id,
      code: 'LARGE_RANGE',
      message: 'Rating scale range is very large',
      suggestion: 'Consider using a smaller range (5-7 points) for better usability'
    });
  }

  // Validate labels
  if (labels && labels.length !== range) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'LABEL_MISMATCH',
      message: 'Number of labels must match scale range',
      severity: 'medium',
      suggestion: `Provide ${range} labels or remove labels to use numbers only`
    });
  }

  return { errors, warnings };
}

/**
 * Validates text question
 */
function validateTextQuestion(question: SurveyQuestion): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!question.validation) {
    return { errors, warnings };
  }

  const { minLength, maxLength, pattern } = question.validation;

  // Validate length constraints
  if (minLength !== undefined && maxLength !== undefined && minLength >= maxLength) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'INVALID_LENGTH_RANGE',
      message: 'Minimum length must be less than maximum length',
      severity: 'medium',
      suggestion: 'Adjust length constraints'
    });
  }

  if (maxLength !== undefined && maxLength > QUESTION_VALIDATION_RULES.text.recommendedMaxLength) {
    warnings.push({
      type: 'question',
      questionId: question.id,
      code: 'LONG_TEXT_LIMIT',
      message: 'Very high character limit may lead to lengthy responses',
      suggestion: 'Consider if such long responses are necessary'
    });
  }

  // Validate pattern
  if (pattern) {
    try {
      new RegExp(pattern);
    } catch (error) {
      errors.push({
        type: 'question',
        questionId: question.id,
        code: 'INVALID_PATTERN',
        message: 'Regular expression pattern is invalid',
        severity: 'medium',
        suggestion: 'Check the regex syntax'
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validates ranking question
 */
function validateRankingQuestion(question: SurveyQuestion): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!question.options || question.options.length === 0) {
    errors.push({
      type: 'question',
      questionId: question.id,
      code: 'NO_ITEMS',
      message: 'Ranking question must have items to rank',
      severity: 'high',
      suggestion: 'Add items for participants to rank'
    });
    return { errors, warnings };
  }

  // Check item count
  if (question.options.length < QUESTION_VALIDATION_RULES.ranking.minItems) {
    warnings.push({
      type: 'question',
      questionId: question.id,
      code: 'FEW_ITEMS',
      message: 'Ranking with few items may not provide meaningful insights',
      suggestion: 'Add more items to rank'
    });
  }

  if (question.options.length > QUESTION_VALIDATION_RULES.ranking.maxItems) {
    warnings.push({
      type: 'question',
      questionId: question.id,
      code: 'MANY_ITEMS',
      message: 'Too many items to rank may overwhelm participants',
      suggestion: 'Consider reducing to 5-6 items maximum'
    });
  }

  return { errors, warnings };
}

/**
 * Validates participant response to a question
 */
export function validateResponse(question: SurveyQuestion, response: any): ResponseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if required question has response
  if (question.required && (response === null || response === undefined || response === '')) {
    errors.push('This question is required');
    return { isValid: false, errors, warnings };
  }

  // Skip further validation if not required and empty
  if (!question.required && (response === null || response === undefined || response === '')) {
    return { isValid: true, errors, warnings };
  }

  // Type-specific validation
  switch (question.type) {
    case 'text':
      return validateTextResponse(question, response);
    
    case 'multiple-choice':
      return validateMultipleChoiceResponse(question, response);
    
    case 'rating-scale':
      return validateRatingResponse(question, response);
    
    case 'boolean':
      return validateBooleanResponse(question, response);
    
    case 'ranking':
      return validateRankingResponse(question, response);
    
    default:
      return { isValid: true, errors, warnings };
  }
}

/**
 * Validates text response
 */
function validateTextResponse(question: SurveyQuestion, response: any): ResponseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof response !== 'string') {
    errors.push('Response must be text');
    return { isValid: false, errors, warnings };
  }

  if (!question.validation) {
    return { isValid: true, errors, warnings };
  }

  const { minLength, maxLength, pattern } = question.validation;

  // Length validation
  if (minLength !== undefined && response.length < minLength) {
    errors.push(`Response must be at least ${minLength} characters`);
  }

  if (maxLength !== undefined && response.length > maxLength) {
    errors.push(`Response must be no more than ${maxLength} characters`);
  }

  // Pattern validation
  if (pattern && !new RegExp(pattern).test(response)) {
    errors.push('Response format is invalid');
  }

  // Warnings for response quality
  if (response.trim().split(/\s+/).length < 3) {
    warnings.push('Response seems quite brief');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates multiple choice response
 */
function validateMultipleChoiceResponse(question: SurveyQuestion, response: any): ResponseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!question.options) {
    errors.push('Question configuration error');
    return { isValid: false, errors, warnings };
  }

  const validValues = question.options.map(option => option.value);
  if (!validValues.includes(response)) {
    errors.push('Invalid option selected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates rating scale response
 */
function validateRatingResponse(question: SurveyQuestion, response: any): ResponseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof response !== 'number') {
    errors.push('Rating must be a number');
    return { isValid: false, errors, warnings };
  }

  if (!question.scale) {
    errors.push('Question configuration error');
    return { isValid: false, errors, warnings };
  }

  const { min, max } = question.scale;

  if (response < min || response > max) {
    errors.push(`Rating must be between ${min} and ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates boolean response
 */
function validateBooleanResponse(question: SurveyQuestion, response: any): ResponseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof response !== 'boolean') {
    errors.push('Response must be yes or no');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates ranking response
 */
function validateRankingResponse(question: SurveyQuestion, response: any): ResponseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(response)) {
    errors.push('Ranking must be a list');
    return { isValid: false, errors, warnings };
  }

  if (!question.options) {
    errors.push('Question configuration error');
    return { isValid: false, errors, warnings };
  }

  // Check if all items are ranked
  if (response.length !== question.options.length) {
    errors.push('All items must be ranked');
  }

  // Check for valid option IDs
  const validIds = question.options.map(option => option.id);
  const responseIds = response.map((item: any) => item.id);
  
  const invalidIds = responseIds.filter(id => !validIds.includes(id));
  if (invalidIds.length > 0) {
    errors.push('Invalid items in ranking');
  }

  // Check for duplicates
  const uniqueIds = new Set(responseIds);
  if (uniqueIds.size !== responseIds.length) {
    errors.push('Duplicate items in ranking');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculates overall survey quality score
 */
function calculateSurveyQualityScore(
  questions: SurveyQuestion[],
  config: SurveyConfig,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): number {
  let score = 100;

  // Deduct points for errors
  errors.forEach(error => {
    switch (error.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });

  // Deduct points for warnings
  warnings.forEach(() => {
    score -= 2;
  });

  // Bonus points for good practices
  if (questions.length >= SURVEY_STRUCTURE_RULES.recommendedMinQuestions &&
      questions.length <= SURVEY_STRUCTURE_RULES.recommendedMaxQuestions) {
    score += 5;
  }

  if (config.showProgressIndicator) {
    score += 3;
  }

  if (config.completionSettings.showSummaryPage) {
    score += 3;
  }

  // Check question variety
  const questionTypes = new Set(questions.map(q => q.type));
  if (questionTypes.size > 1) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Validates responses across the entire survey for completeness and patterns
 */
export function validateSurveyResponses(
  questions: SurveyQuestion[],
  responses: SurveyResponse[],
  config: SurveyConfig
): SurveyValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check response completeness
  const requiredQuestions = questions.filter(q => q.required);
  const responseQuestionIds = new Set(responses.map(r => r.questionId));

  requiredQuestions.forEach(question => {
    if (!responseQuestionIds.has(question.id)) {
      errors.push({
        type: 'response',
        questionId: question.id,
        code: 'MISSING_REQUIRED_RESPONSE',
        message: 'Missing response for required question',
        severity: 'high',
        suggestion: 'Ensure all required questions are answered'
      });
    }
  });

  // Check response quality patterns
  const responseTimes = responses.map(r => r.responseTime);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  // Flag suspiciously fast responses
  const fastResponses = responses.filter(r => r.responseTime < 1000); // Less than 1 second
  if (fastResponses.length > responses.length * 0.5) {
    warnings.push({
      type: 'response',
      code: 'FAST_RESPONSES',
      message: 'Many responses were completed very quickly',
      suggestion: 'Review responses for quality and consider adding attention checks'
    });
  }

  // Calculate quality score
  const score = calculateSurveyQualityScore(questions, config, errors, warnings);

  return {
    isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Provides validation summary and recommendations
 */
export function getSurveyValidationSummary(validationResult: SurveyValidationResult): {
  summary: string;
  recommendations: string[];
  canPublish: boolean;
} {
  const { isValid, errors, warnings, score } = validationResult;
  
  const criticalErrors = errors.filter(e => e.severity === 'critical').length;
  const highErrors = errors.filter(e => e.severity === 'high').length;
  
  let summary: string;
  if (score >= 90) {
    summary = 'Excellent survey quality';
  } else if (score >= 80) {
    summary = 'Good survey quality';
  } else if (score >= 70) {
    summary = 'Fair survey quality';
  } else if (score >= 60) {
    summary = 'Poor survey quality';
  } else {
    summary = 'Very poor survey quality';
  }

  const recommendations: string[] = [];
  
  // Add top recommendations based on errors and warnings
  if (criticalErrors > 0) {
    recommendations.push('Fix critical errors before publishing');
  }
  
  if (highErrors > 0) {
    recommendations.push('Address high-priority issues for better data quality');
  }
  
  if (warnings.length > 5) {
    recommendations.push('Review and address warnings to improve participant experience');
  }
  
  if (score < 80) {
    recommendations.push('Consider revising survey structure and questions');
  }

  return {
    summary: `${summary} (Score: ${score}/100)`,
    recommendations,
    canPublish: isValid && criticalErrors === 0
  };
}