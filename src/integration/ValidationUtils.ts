// =============================================================================
// VALIDATION UTILITIES FOR RESEARCH METHOD INTEGRATION
// =============================================================================

import { 
  ValidationResult, 
  Study, 
  ResearchMethodType,
  RESEARCH_METHOD_METADATA,
  MethodComplexity,
  MethodCategory 
} from '../types';

// =============================================================================
// CONFIGURATION VALIDATION UTILITIES
// =============================================================================

/**
 * Validate basic study configuration requirements
 */
export const validateBasicStudyConfig = (config: any): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];

  // Required fields
  if (!config.name || !config.name.trim()) {
    errors.push({
      field: 'name',
      message: 'Study name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!config.type) {
    errors.push({
      field: 'type',
      message: 'Research method type is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate method type exists
  if (config.type && !RESEARCH_METHOD_METADATA[config.type as ResearchMethodType]) {
    errors.push({
      field: 'type',
      message: `Unknown research method type: ${config.type}`,
      code: 'INVALID_VALUE'
    });
  }

  // Name length validation
  if (config.name && config.name.length < 3) {
    warnings.push({
      field: 'name',
      message: 'Study name is very short',
      suggestion: 'Consider using a more descriptive name'
    });
  }

  if (config.name && config.name.length > 100) {
    warnings.push({
      field: 'name',
      message: 'Study name is very long',
      suggestion: 'Consider shortening the name for better usability'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate participant configuration
 */
export const validateParticipantConfig = (
  config: any, 
  methodType: ResearchMethodType
): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];
  
  const methodMeta = RESEARCH_METHOD_METADATA[methodType];
  if (!methodMeta) {
    errors.push({
      field: 'methodType',
      message: 'Invalid method type for participant validation',
      code: 'INVALID_METHOD'
    });
    return { isValid: false, errors, warnings };
  }

  // Participant count validation
  if (config.minParticipants !== undefined) {
    if (config.minParticipants < 1) {
      errors.push({
        field: 'minParticipants',
        message: 'Minimum participants must be at least 1',
        code: 'INVALID_RANGE'
      });
    }

    if (config.minParticipants < methodMeta.participantRequirements.minParticipants) {
      warnings.push({
        field: 'minParticipants',
        message: `Consider at least ${methodMeta.participantRequirements.minParticipants} participants for this method`,
        suggestion: 'Fewer participants may reduce reliability of findings'
      });
    }
  }

  if (config.maxParticipants !== undefined) {
    if (config.maxParticipants < 1) {
      errors.push({
        field: 'maxParticipants',
        message: 'Maximum participants must be at least 1',
        code: 'INVALID_RANGE'
      });
    }

    if (config.minParticipants && config.maxParticipants < config.minParticipants) {
      errors.push({
        field: 'maxParticipants',
        message: 'Maximum participants cannot be less than minimum',
        code: 'INVALID_RANGE'
      });
    }

    if (config.maxParticipants > methodMeta.participantRequirements.maxParticipants) {
      warnings.push({
        field: 'maxParticipants',
        message: `Consider limiting to ${methodMeta.participantRequirements.maxParticipants} participants for this method`,
        suggestion: 'Too many participants may not provide additional value'
      });
    }
  }

  // Duration validation
  if (config.estimatedDuration !== undefined) {
    if (config.estimatedDuration < 1) {
      errors.push({
        field: 'estimatedDuration',
        message: 'Estimated duration must be at least 1 minute',
        code: 'INVALID_RANGE'
      });
    }

    const { min, max } = methodMeta.estimatedDuration;
    if (config.estimatedDuration < min) {
      warnings.push({
        field: 'estimatedDuration',
        message: `This method typically takes at least ${min} minutes`,
        suggestion: 'Consider allowing more time for quality responses'
      });
    }

    if (config.estimatedDuration > max * 2) {
      warnings.push({
        field: 'estimatedDuration',
        message: `Duration seems unusually long for this method`,
        suggestion: 'Long studies may have higher dropout rates'
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate study timing and scheduling
 */
export const validateStudyTiming = (config: any): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];

  // Start date validation
  if (config.startDate) {
    const startDate = new Date(config.startDate);
    const now = new Date();
    
    if (isNaN(startDate.getTime())) {
      errors.push({
        field: 'startDate',
        message: 'Invalid start date format',
        code: 'INVALID_FORMAT'
      });
    } else if (startDate < now) {
      warnings.push({
        field: 'startDate',
        message: 'Start date is in the past',
        suggestion: 'Consider updating to a future date'
      });
    }
  }

  // End date validation
  if (config.endDate) {
    const endDate = new Date(config.endDate);
    
    if (isNaN(endDate.getTime())) {
      errors.push({
        field: 'endDate',
        message: 'Invalid end date format',
        code: 'INVALID_FORMAT'
      });
    }

    if (config.startDate) {
      const startDate = new Date(config.startDate);
      if (endDate <= startDate) {
        errors.push({
          field: 'endDate',
          message: 'End date must be after start date',
          code: 'INVALID_RANGE'
        });
      }

      // Calculate duration
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (durationDays < 1) {
        warnings.push({
          field: 'endDate',
          message: 'Very short study duration',
          suggestion: 'Consider allowing more time for participant recruitment'
        });
      }

      if (durationDays > 365) {
        warnings.push({
          field: 'endDate',
          message: 'Very long study duration',
          suggestion: 'Long studies may face participant retention challenges'
        });
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// =============================================================================
// DATA STRUCTURE VALIDATION
// =============================================================================

/**
 * Validate array-based data (cards, questions, etc.)
 */
export const validateArrayData = (
  data: any[], 
  dataType: string, 
  minItems = 1, 
  maxItems?: number
): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];

  // Check if array exists
  if (!Array.isArray(data)) {
    errors.push({
      field: dataType,
      message: `${dataType} must be an array`,
      code: 'INVALID_TYPE'
    });
    return { isValid: false, errors, warnings };
  }

  // Check minimum items
  if (data.length < minItems) {
    errors.push({
      field: dataType,
      message: `${dataType} must have at least ${minItems} item(s)`,
      code: 'INSUFFICIENT_ITEMS'
    });
  }

  // Check maximum items
  if (maxItems && data.length > maxItems) {
    errors.push({
      field: dataType,
      message: `${dataType} cannot have more than ${maxItems} items`,
      code: 'TOO_MANY_ITEMS'
    });
  }

  // Validate individual items
  data.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push({
        field: `${dataType}[${index}]`,
        message: `${dataType} item must be an object`,
        code: 'INVALID_ITEM_TYPE'
      });
    } else {
      // Check for required properties
      if (!item.id) {
        errors.push({
          field: `${dataType}[${index}].id`,
          message: 'Item must have an ID',
          code: 'MISSING_ID'
        });
      }

      if (dataType === 'cards' && !item.text?.trim()) {
        errors.push({
          field: `${dataType}[${index}].text`,
          message: 'Card must have text content',
          code: 'MISSING_TEXT'
        });
      }

      if (dataType === 'categories' && !item.name?.trim()) {
        errors.push({
          field: `${dataType}[${index}].name`,
          message: 'Category must have a name',
          code: 'MISSING_NAME'
        });
      }
    }
  });

  // Check for duplicate IDs
  const ids = data.map(item => item?.id).filter(id => id !== undefined);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push({
      field: dataType,
      message: `${dataType} cannot have duplicate IDs`,
      code: 'DUPLICATE_IDS'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate tree structure for tree testing
 */
export const validateTreeStructure = (tree: any[]): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];

  if (!Array.isArray(tree)) {
    errors.push({
      field: 'treeStructure',
      message: 'Tree structure must be an array',
      code: 'INVALID_TYPE'
    });
    return { isValid: false, errors, warnings };
  }

  if (tree.length === 0) {
    errors.push({
      field: 'treeStructure',
      message: 'Tree structure cannot be empty',
      code: 'EMPTY_TREE'
    });
    return { isValid: false, errors, warnings };
  }

  // Validate tree depth and structure
  const validateNode = (node: any, path: string, depth: number): void => {
    if (!node || typeof node !== 'object') {
      errors.push({
        field: path,
        message: 'Tree node must be an object',
        code: 'INVALID_NODE'
      });
      return;
    }

    if (!node.id) {
      errors.push({
        field: `${path}.id`,
        message: 'Tree node must have an ID',
        code: 'MISSING_ID'
      });
    }

    if (!node.name?.trim()) {
      errors.push({
        field: `${path}.name`,
        message: 'Tree node must have a name',
        code: 'MISSING_NAME'
      });
    }

    // Check depth
    if (depth > 7) {
      warnings.push({
        field: path,
        message: 'Tree structure may be too deep',
        suggestion: 'Consider limiting to 5-7 levels for better usability'
      });
    }

    // Validate children recursively
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any, index: number) => {
        validateNode(child, `${path}.children[${index}]`, depth + 1);
      });
    }
  };

  tree.forEach((node, index) => {
    validateNode(node, `treeStructure[${index}]`, 0);
  });

  return { isValid: errors.length === 0, errors, warnings };
};

// =============================================================================
// CROSS-METHOD COMPATIBILITY VALIDATION
// =============================================================================

/**
 * Validate that multiple methods can work together effectively
 */
export const validateMethodCombination = (
  methodTypes: ResearchMethodType[]
): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];

  if (methodTypes.length < 2) {
    return { isValid: true, errors, warnings };
  }

  // Get categories and complexities
  const categories = methodTypes.map(type => RESEARCH_METHOD_METADATA[type]?.category).filter(Boolean);
  const complexities = methodTypes.map(type => RESEARCH_METHOD_METADATA[type]?.complexity).filter(Boolean);

  // Check for complementary combinations
  const uniqueCategories = [...new Set(categories)];
  const uniqueComplexities = [...new Set(complexities)];

  // Warn about complexity mismatches
  if (uniqueComplexities.includes('expert' as MethodComplexity) && 
      uniqueComplexities.includes('simple' as MethodComplexity)) {
    warnings.push({
      field: 'methodCombination',
      message: 'Mixing expert and simple methods may require different participant pools',
      suggestion: 'Consider participant expertise requirements carefully'
    });
  }

  // Recommend good combinations
  if (categories.includes('information-architecture') && categories.includes('usability-testing')) {
    warnings.push({
      field: 'methodCombination',
      message: 'Excellent combination: IA methods inform usability testing',
      suggestion: 'Run information architecture studies first to design better usability tests'
    });
  }

  if (categories.includes('user-research') && uniqueCategories.length > 1) {
    warnings.push({
      field: 'methodCombination',
      message: 'Good practice: Combining user research with other methods',
      suggestion: 'Use qualitative insights to interpret quantitative findings'
    });
  }

  // Check for potentially redundant combinations
  const duplicateCategories = categories.filter((cat, index) => 
    categories.indexOf(cat) !== index
  );

  if (duplicateCategories.length > 0) {
    warnings.push({
      field: 'methodCombination',
      message: 'Multiple methods in same category detected',
      suggestion: 'Consider if all methods are necessary or if they provide different insights'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// =============================================================================
// PARTICIPANT EXPERIENCE VALIDATION
// =============================================================================

/**
 * Validate that the study provides a good participant experience
 */
export const validateParticipantExperience = (
  study: any,
  methodType: ResearchMethodType
): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];

  const methodMeta = RESEARCH_METHOD_METADATA[methodType];
  if (!methodMeta) {
    return { isValid: false, errors: [{ 
      field: 'methodType', 
      message: 'Unknown method type', 
      code: 'INVALID_METHOD' 
    }], warnings };
  }

  // Check study length vs. complexity
  const estimatedDuration = study.configuration?.estimatedDuration || methodMeta.estimatedDuration.average;
  const complexity = methodMeta.complexity;

  if (complexity === 'simple' && estimatedDuration > 15) {
    warnings.push({
      field: 'estimatedDuration',
      message: 'Simple methods should typically be under 15 minutes',
      suggestion: 'Long simple tasks may frustrate participants'
    });
  }

  if (complexity === 'expert' && estimatedDuration < 30) {
    warnings.push({
      field: 'estimatedDuration',
      message: 'Expert methods may need more time for quality insights',
      suggestion: 'Consider allowing more time for thorough evaluation'
    });
  }

  // Check instructions and guidance
  if (!study.description || study.description.length < 50) {
    warnings.push({
      field: 'description',
      message: 'Study description is very brief',
      suggestion: 'Provide clear instructions to help participants understand the task'
    });
  }

  // Check for accessibility considerations
  if (methodMeta.category === 'accessibility' && !study.metadata?.accessibilityNotes) {
    warnings.push({
      field: 'accessibilityNotes',
      message: 'Consider adding accessibility notes for participants',
      suggestion: 'Accessibility studies should accommodate diverse participant needs'
    });
  }

  // Check mobile compatibility for relevant methods
  const mobileFriendlyMethods = ['survey', 'five-second-test', 'first-click-testing'];
  if (mobileFriendlyMethods.includes(methodType) && 
      !study.settings?.mobileOptimized) {
    warnings.push({
      field: 'mobileOptimized',
      message: 'This method type works well on mobile devices',
      suggestion: 'Consider enabling mobile optimization to reach more participants'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Combine multiple validation results
 */
export const combineValidationResults = (results: ValidationResult[]): ValidationResult => {
  const allErrors: any[] = [];
  const allWarnings: any[] = [];

  results.forEach(result => {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

/**
 * Create a validation result for success cases
 */
export const createSuccessValidation = (message?: string): ValidationResult => {
  return {
    isValid: true,
    errors: [],
    warnings: message ? [{ message, field: 'general', suggestion: '' }] : []
  };
};

/**
 * Create a validation result for error cases
 */
export const createErrorValidation = (
  field: string, 
  message: string, 
  code: string
): ValidationResult => {
  return {
    isValid: false,
    errors: [{ field, message, code }],
    warnings: []
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate that a value is within a numeric range
 */
export const validateRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): ValidationResult => {
  const errors: any[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_NUMBER'
    });
  } else if (value < min || value > max) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
      code: 'OUT_OF_RANGE'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
};