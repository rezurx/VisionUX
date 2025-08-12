// Sample accessibility data for demonstration and testing

import { AccessibilityResult, AccessibilityEvaluation } from '../types';

// Generate sample accessibility results for demonstration
export const generateSampleAccessibilityData = (): AccessibilityResult[] => {
  const sampleEvaluations: AccessibilityEvaluation[] = [
    {
      guidelineId: '1.1.1',
      status: 'fail',
      severity: 'critical',
      findings: [
        'Image missing alt text: <img src="logo.png">',
        'Decorative image has meaningful alt text: <img alt="Red background pattern">'
      ],
      recommendations: [
        'Add meaningful alt text to all informative images',
        'Use empty alt="" for decorative images',
        'Review image context and provide appropriate descriptions'
      ],
      evidence: {
        codeSnippets: ['<img src="logo.png">', '<img src="pattern.jpg" alt="Red background pattern">'],
        screenshots: [],
        userQuotes: []
      }
    },
    {
      guidelineId: '1.4.3',
      status: 'fail',
      severity: 'high',
      findings: [
        'Text has insufficient color contrast: 3.2:1 (minimum 4.5:1)',
        'Button text contrast ratio: 2.8:1'
      ],
      recommendations: [
        'Increase text color contrast to meet WCAG AA requirements',
        'Use darker text colors or lighter background colors',
        'Test with color contrast analyzers'
      ],
      evidence: {
        codeSnippets: ['.low-contrast { color: #888; background: #fff; }'],
        screenshots: [],
        userQuotes: []
      }
    },
    {
      guidelineId: '2.1.1',
      status: 'fail',
      severity: 'high',
      findings: [
        'Interactive element not keyboard accessible',
        'Custom dropdown cannot be operated with keyboard'
      ],
      recommendations: [
        'Make all interactive elements keyboard accessible',
        'Add proper focus management',
        'Implement ARIA keyboard interaction patterns'
      ],
      evidence: {
        codeSnippets: ['<div class="dropdown" onclick="toggle()">'],
        screenshots: [],
        userQuotes: []
      }
    },
    {
      guidelineId: '2.4.1',
      status: 'pass',
      severity: 'low',
      findings: [
        'Skip links properly implemented and functional'
      ],
      recommendations: [],
      evidence: {
        codeSnippets: [],
        screenshots: [],
        userQuotes: []
      }
    },
    {
      guidelineId: '4.1.2',
      status: 'fail',
      severity: 'medium',
      findings: [
        'Form control missing accessible name',
        'Button has no accessible name or label'
      ],
      recommendations: [
        'Associate form controls with descriptive labels',
        'Use aria-label for buttons without visible text',
        'Ensure all interactive elements have accessible names'
      ],
      evidence: {
        codeSnippets: ['<input type="text">', '<button><span class="icon"></span></button>'],
        screenshots: [],
        userQuotes: []
      }
    },
    {
      guidelineId: '1.3.1',
      status: 'pass',
      severity: 'low',
      findings: [
        'Heading structure is properly implemented',
        'Lists use appropriate markup'
      ],
      recommendations: [],
      evidence: {
        codeSnippets: [],
        screenshots: [],
        userQuotes: []
      }
    }
  ];

  // Generate multiple scan results with variations
  const results: AccessibilityResult[] = [
    {
      participantId: 'system-scan-001',
      studyId: 1,
      evaluations: sampleEvaluations,
      overallScore: 75.2,
      completionTime: 2840,
      assistiveTechnology: 'axe-core'
    },
    {
      participantId: 'system-scan-002',
      studyId: 1,
      evaluations: sampleEvaluations.map(e => ({
        ...e,
        status: e.guidelineId === '1.1.1' ? 'pass' : e.status
      })).filter(e => e.guidelineId !== '1.1.1' || e.status === 'pass') as AccessibilityEvaluation[],
      overallScore: 82.1,
      completionTime: 1920,
      assistiveTechnology: 'axe-core'
    },
    {
      participantId: 'system-scan-003',
      studyId: 1,
      evaluations: sampleEvaluations.map(e => ({
        ...e,
        status: ['1.1.1', '1.4.3'].includes(e.guidelineId) ? 'pass' : e.status
      })).filter(e => !['1.1.1', '1.4.3'].includes(e.guidelineId) || e.status === 'pass') as AccessibilityEvaluation[],
      overallScore: 88.7,
      completionTime: 1650,
      assistiveTechnology: 'axe-core'
    }
  ];

  return results;
};

// Sample WCAG compliance test scenarios
export const sampleTestScenarios = [
  {
    name: 'E-commerce Product Page',
    description: 'Testing accessibility of a typical e-commerce product page',
    elements: [
      'Product images with alt text',
      'Add to cart button accessibility',
      'Price information markup',
      'Product review form',
      'Navigation breadcrumbs'
    ],
    expectedIssues: [
      'Missing alt text for product images',
      'Insufficient color contrast in price displays',
      'Form labels not properly associated',
      'Missing skip navigation links'
    ]
  },
  {
    name: 'News Article Layout',
    description: 'Accessibility testing for news article and blog content',
    elements: [
      'Article heading structure',
      'Image captions and credits',
      'Social sharing buttons',
      'Comment form',
      'Related articles navigation'
    ],
    expectedIssues: [
      'Improper heading hierarchy',
      'Social buttons without accessible names',
      'Low contrast on comment timestamps',
      'Missing focus indicators'
    ]
  },
  {
    name: 'Dashboard Interface',
    description: 'Complex dashboard with charts and interactive elements',
    elements: [
      'Data visualization charts',
      'Interactive filter controls',
      'Modal dialogs',
      'Data tables with sorting',
      'Notification alerts'
    ],
    expectedIssues: [
      'Charts lacking text alternatives',
      'Modal focus management issues',
      'Table headers not properly associated',
      'Alerts not announced to screen readers'
    ]
  }
];

// Sample accessibility guidelines with enhanced details
export const enhancedWCAGGuidelines = {
  '1.1.1': {
    title: 'Non-text Content',
    level: 'A',
    principle: 'Perceivable',
    description: 'All non-text content has a text alternative that serves the equivalent purpose',
    commonFailures: [
      'Images without alt attributes',
      'Decorative images with meaningful alt text',
      'Complex images without detailed descriptions',
      'Form controls without labels'
    ],
    testingMethods: [
      'Automated scanning with axe-core',
      'Screen reader testing',
      'Manual review of alt attributes',
      'Image context analysis'
    ],
    successExamples: [
      '<img src="chart.png" alt="Sales increased 25% from Q1 to Q2 2024">',
      '<img src="decoration.jpg" alt="">',
      '<button aria-label="Close dialog">×</button>'
    ]
  },
  '1.4.3': {
    title: 'Contrast (Minimum)',
    level: 'AA',
    principle: 'Perceivable', 
    description: 'Text has a contrast ratio of at least 4.5:1',
    commonFailures: [
      'Light gray text on white backgrounds',
      'Colorful text on colorful backgrounds',
      'Low contrast in form placeholders',
      'Insufficient contrast in UI components'
    ],
    testingMethods: [
      'Color contrast analyzers',
      'Automated contrast checking',
      'Visual inspection',
      'User testing with vision impairments'
    ],
    successExamples: [
      'Black text on white background (21:1)',
      'Dark blue text on light blue background (5.2:1)',
      'High contrast mode compatibility'
    ]
  },
  '2.1.1': {
    title: 'Keyboard',
    level: 'A',
    principle: 'Operable',
    description: 'All functionality is available from a keyboard',
    commonFailures: [
      'Click-only interactive elements',
      'Missing keyboard event handlers',
      'Keyboard traps in custom widgets',
      'No visible focus indicators'
    ],
    testingMethods: [
      'Tab navigation testing',
      'Keyboard-only interaction testing',
      'Focus indicator visibility testing',
      'Screen reader compatibility testing'
    ],
    successExamples: [
      'Proper tab order and focus management',
      'Arrow key navigation in menus',
      'Enter and Space key activation',
      'Escape key to close dialogs'
    ]
  }
};

// Generate realistic accessibility metrics over time
export const generateAccessibilityTrends = (days: number = 30): Array<{
  date: string;
  overallScore: number;
  criticalIssues: number;
  totalIssues: number;
  complianceLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
}> => {
  const trends = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulate gradual improvement over time with some variations
    const baseScore = 65 + (i / days) * 25; // Improve from 65% to 90%
    const variation = (Math.random() - 0.5) * 10; // ±5% variation
    const overallScore = Math.min(100, Math.max(0, baseScore + variation));
    
    const criticalIssues = Math.max(0, Math.round(8 - (i / days) * 6 + (Math.random() - 0.5) * 2));
    const totalIssues = Math.max(criticalIssues, Math.round(25 - (i / days) * 15 + (Math.random() - 0.5) * 5));
    
    let complianceLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
    if (criticalIssues > 0) {
      complianceLevel = 'non-compliant';
    } else if (overallScore >= 95) {
      complianceLevel = 'AAA';
    } else if (overallScore >= 85) {
      complianceLevel = 'AA';
    } else if (overallScore >= 75) {
      complianceLevel = 'A';
    } else {
      complianceLevel = 'non-compliant';
    }

    trends.push({
      date: date.toISOString().split('T')[0],
      overallScore: Math.round(overallScore * 10) / 10,
      criticalIssues,
      totalIssues,
      complianceLevel
    });
  }

  return trends;
};

// Sample compliance gaps for roadmap generation
export const sampleComplianceGaps = [
  {
    criterion: '1.1.1',
    currentStatus: 'fail' as const,
    requiredForLevel: 'A' as const,
    impact: 'critical' as const,
    effort: 'moderate' as const,
    priority: 10,
    recommendations: [
      'Add alt text to all informative images',
      'Use empty alt="" for decorative images',
      'Create detailed descriptions for complex images'
    ],
    resources: [
      'WCAG 2.1 Understanding 1.1.1',
      'WebAIM Alt Text Guidelines',
      'Image Alt Text Best Practices'
    ]
  },
  {
    criterion: '1.4.3',
    currentStatus: 'fail' as const,
    requiredForLevel: 'AA' as const,
    impact: 'high' as const,
    effort: 'minimal' as const,
    priority: 9,
    recommendations: [
      'Increase text contrast ratios to 4.5:1 minimum',
      'Use color contrast checking tools',
      'Update brand color palette for accessibility'
    ],
    resources: [
      'WCAG Contrast Requirements',
      'Color Contrast Analyzers',
      'Accessible Color Palette Tools'
    ]
  },
  {
    criterion: '2.1.1',
    currentStatus: 'fail' as const,
    requiredForLevel: 'A' as const,
    impact: 'high' as const,
    effort: 'significant' as const,
    priority: 8,
    recommendations: [
      'Implement keyboard event handlers for all interactive elements',
      'Add visible focus indicators',
      'Create proper tab order'
    ],
    resources: [
      'Keyboard Navigation Patterns',
      'Focus Management Guidelines',
      'ARIA Keyboard Interactions'
    ]
  }
];