// Cross-Method Accessibility Analysis for Vision UX Research Suite
import { Study, AccessibilityResult, ResearchMethodType, StudyResult } from '../types';
import { AccessibilityUtils } from './accessibility';

export interface CrossMethodAccessibilityAnalysis {
  studyCorrelations: StudyCorrelation[];
  accessibilityTrends: AccessibilityTrend[];
  methodImpacts: MethodAccessibilityImpact[];
  recommendations: CrossMethodRecommendation[];
  overallScore: number;
  participantAccessibilityProfile: ParticipantAccessibilityProfile;
}

export interface StudyCorrelation {
  studyA: Study;
  studyB: Study;
  correlationScore: number;
  sharedAccessibilityIssues: string[];
  differentialImpact: string[];
  significance: 'low' | 'medium' | 'high';
}

export interface AccessibilityTrend {
  principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
  methods: ResearchMethodType[];
  trendDirection: 'improving' | 'declining' | 'stable';
  impactFactor: number;
  timeframe: string;
}

export interface MethodAccessibilityImpact {
  methodType: ResearchMethodType;
  accessibilityScore: number;
  commonIssues: string[];
  participantBarriers: string[];
  effectiveness: number; // How well this method captures accessibility issues
  recommendations: string[];
}

export interface CrossMethodRecommendation {
  type: 'method-combination' | 'accessibility-enhancement' | 'participant-support';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedMethods: ResearchMethodType[];
  expectedImpact: string;
  implementationEffort: 'minimal' | 'moderate' | 'significant';
}

export interface ParticipantAccessibilityProfile {
  totalParticipants: number;
  accessibilityUsers: number;
  commonAssistiveTechnologies: string[];
  preferredInteractionMethods: string[];
  barrierFrequency: Record<string, number>;
  methodAccessibility: Record<ResearchMethodType, number>;
}

export class CrossMethodAccessibilityAnalyzer {
  private studies: Study[];
  private results: StudyResult[];
  private accessibilityResults: AccessibilityResult[];

  constructor(
    studies: Study[],
    results: StudyResult[],
    accessibilityResults: AccessibilityResult[] = []
  ) {
    this.studies = studies;
    this.results = results;
    this.accessibilityResults = accessibilityResults;
  }

  // Main analysis method
  analyze(): CrossMethodAccessibilityAnalysis {
    const studyCorrelations = this.calculateStudyCorrelations();
    const accessibilityTrends = this.analyzeAccessibilityTrends();
    const methodImpacts = this.assessMethodAccessibilityImpacts();
    const recommendations = this.generateCrossMethodRecommendations();
    const overallScore = this.calculateOverallAccessibilityScore();
    const participantAccessibilityProfile = this.createParticipantProfile();

    return {
      studyCorrelations,
      accessibilityTrends,
      methodImpacts,
      recommendations,
      overallScore,
      participantAccessibilityProfile
    };
  }

  private calculateStudyCorrelations(): StudyCorrelation[] {
    const correlations: StudyCorrelation[] = [];
    
    for (let i = 0; i < this.studies.length; i++) {
      for (let j = i + 1; j < this.studies.length; j++) {
        const studyA = this.studies[i];
        const studyB = this.studies[j];
        
        const correlation = this.calculatePairwiseCorrelation(studyA, studyB);
        if (correlation.correlationScore > 0.3) { // Only include meaningful correlations
          correlations.push(correlation);
        }
      }
    }
    
    return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
  }

  private calculatePairwiseCorrelation(studyA: Study, studyB: Study): StudyCorrelation {
    // Get accessibility issues from both studies
    const issuesA = this.getAccessibilityIssues(studyA);
    const issuesB = this.getAccessibilityIssues(studyB);
    
    const sharedIssues = issuesA.filter(issue => issuesB.includes(issue));
    const correlationScore = sharedIssues.length / Math.max(issuesA.length, issuesB.length, 1);
    
    const differentialImpact = this.analyzeDifferentialImpact(studyA, studyB);
    
    return {
      studyA,
      studyB,
      correlationScore,
      sharedAccessibilityIssues: sharedIssues,
      differentialImpact,
      significance: correlationScore > 0.7 ? 'high' : correlationScore > 0.5 ? 'medium' : 'low'
    };
  }

  private getAccessibilityIssues(study: Study): string[] {
    // Extract accessibility issues from study results
    const studyResults = this.results.filter(r => r.studyId === study.id);
    const issues: string[] = [];
    
    studyResults.forEach(result => {
      // Check if result has accessibility evaluations
      if (result.results && result.results.evaluations) {
        result.results.evaluations
          .filter((e: any) => e.status === 'fail')
          .forEach((e: any) => issues.push(e.guidelineId));
      }
    });
    
    return [...new Set(issues)];
  }

  private analyzeDifferentialImpact(studyA: Study, studyB: Study): string[] {
    const impacts: string[] = [];
    
    // Analyze how accessibility issues manifest differently across methods
    if (studyA.type === 'card-sorting' && studyB.type === 'tree-testing') {
      impacts.push('Navigation structure affects both sorting and wayfinding tasks');
      impacts.push('Cognitive load varies between categorization and pathfinding');
    }
    
    if (studyA.type === 'accessibility-audit' && studyB.type !== 'accessibility-audit') {
      impacts.push('Technical barriers identified in audit affect actual task performance');
      impacts.push('User experience issues compound technical accessibility problems');
    }
    
    // Add method-specific differential impacts
    const methodCombination = `${studyA.type}-${studyB.type}`;
    const specificImpacts = this.getMethodSpecificImpacts(methodCombination);
    impacts.push(...specificImpacts);
    
    return impacts;
  }

  private getMethodSpecificImpacts(combination: string): string[] {
    const impactMap: Record<string, string[]> = {
      'card-sorting-survey': [
        'Categorization difficulties correlate with survey comprehension issues',
        'Mental model mismatches affect both sorting accuracy and response patterns'
      ],
      'tree-testing-usability-testing': [
        'Navigation problems in tree testing predict usability task failures',
        'Information architecture issues compound interaction difficulties'
      ],
      'accessibility-audit-usability-testing': [
        'Technical violations create practical usability barriers',
        'Compliance issues directly impact task completion rates'
      ]
    };
    
    return impactMap[combination] || [];
  }

  private analyzeAccessibilityTrends(): AccessibilityTrend[] {
    const principles = ['perceivable', 'operable', 'understandable', 'robust'] as const;
    const trends: AccessibilityTrend[] = [];
    
    principles.forEach(principle => {
      const methodsAffected = this.getMethodsAffectedByPrinciple(principle);
      const trendDirection = this.calculateTrendDirection(principle);
      const impactFactor = this.calculateImpactFactor(principle);
      
      trends.push({
        principle,
        methods: methodsAffected,
        trendDirection,
        impactFactor,
        timeframe: 'last-30-days'
      });
    });
    
    return trends;
  }

  private getMethodsAffectedByPrinciple(principle: string): ResearchMethodType[] {
    const affectedMethods: ResearchMethodType[] = [];
    
    this.studies.forEach(study => {
      const issues = this.getAccessibilityIssues(study);
      const principleIssues = issues.filter(issue => {
        const guideline = AccessibilityUtils.guidelines[issue];
        return guideline?.principle === principle;
      });
      
      if (principleIssues.length > 0) {
        affectedMethods.push(study.type);
      }
    });
    
    return [...new Set(affectedMethods)];
  }

  private calculateTrendDirection(principle: string): 'improving' | 'declining' | 'stable' {
    // This would analyze historical data if available
    // For now, return stable as default
    return 'stable';
  }

  private calculateImpactFactor(principle: string): number {
    const principleWeights = {
      perceivable: 0.9, // High impact - affects visibility and readability
      operable: 0.95, // Highest impact - affects interaction ability
      understandable: 0.8, // Medium-high impact - affects comprehension
      robust: 0.7 // Medium impact - affects compatibility
    };
    
    return principleWeights[principle as keyof typeof principleWeights] || 0.5;
  }

  private assessMethodAccessibilityImpacts(): MethodAccessibilityImpact[] {
    const methodTypes = [...new Set(this.studies.map(s => s.type))];
    
    return methodTypes.map(methodType => {
      const methodStudies = this.studies.filter(s => s.type === methodType);
      const accessibilityScore = this.calculateMethodAccessibilityScore(methodType);
      const commonIssues = this.getCommonIssuesByMethod(methodType);
      const participantBarriers = this.getParticipantBarriersByMethod(methodType);
      const effectiveness = this.calculateDetectionEffectiveness(methodType);
      const recommendations = this.getMethodSpecificRecommendations(methodType);
      
      return {
        methodType,
        accessibilityScore,
        commonIssues,
        participantBarriers,
        effectiveness,
        recommendations
      };
    });
  }

  private calculateMethodAccessibilityScore(methodType: ResearchMethodType): number {
    const methodStudies = this.studies.filter(s => s.type === methodType);
    const allIssues = methodStudies.flatMap(study => this.getAccessibilityIssues(study));
    
    if (allIssues.length === 0) return 100;
    
    // Calculate based on severity and frequency of issues
    const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    const totalSeverity = allIssues.length * 2; // Assume average medium severity
    const maxPossibleSeverity = allIssues.length * 4; // All critical
    
    return Math.max(0, (1 - (totalSeverity / maxPossibleSeverity)) * 100);
  }

  private getCommonIssuesByMethod(methodType: ResearchMethodType): string[] {
    const methodSpecificIssues: Record<ResearchMethodType, string[]> = {
      'card-sorting': [
        'Drag and drop not keyboard accessible',
        'Category labels not announced to screen readers',
        'Visual-only feedback for sorting actions'
      ],
      'tree-testing': [
        'Complex navigation not keyboard accessible',
        'Tree structure not announced properly',
        'Visual hierarchy not conveyed to assistive technology'
      ],
      'survey': [
        'Form controls missing labels',
        'Error messages not associated with fields',
        'Required field indicators not accessible'
      ],
      'accessibility-audit': [
        'False positives in automated testing',
        'Context-dependent issues not detected',
        'User experience impacts not captured'
      ],
      'usability-testing': [
        'Task instructions not accessible',
        'Interface elements missing focus indicators',
        'Timing constraints not adjustable'
      ]
    } as Record<ResearchMethodType, string[]>;
    
    return methodSpecificIssues[methodType] || [];
  }

  private getParticipantBarriersByMethod(methodType: ResearchMethodType): string[] {
    const barrierMap: Record<ResearchMethodType, string[]> = {
      'card-sorting': [
        'Motor impairments affecting drag/drop',
        'Visual impairments affecting spatial relationships',
        'Cognitive load from simultaneous categorization'
      ],
      'tree-testing': [
        'Navigation complexity for screen reader users',
        'Spatial memory requirements',
        'Multiple interaction modes confusion'
      ],
      'survey': [
        'Lengthy forms causing fatigue',
        'Complex response formats',
        'Time pressure affecting responses'
      ],
      'accessibility-audit': [
        'Technical expertise barriers',
        'Tool complexity for non-experts',
        'Interpretation of automated results'
      ],
      'usability-testing': [
        'Performance anxiety in testing situations',
        'Unfamiliar interface patterns',
        'Task complexity compounding accessibility issues'
      ]
    } as Record<ResearchMethodType, string[]>;
    
    return barrierMap[methodType] || [];
  }

  private calculateDetectionEffectiveness(methodType: ResearchMethodType): number {
    // Effectiveness in detecting accessibility issues
    const effectivenessMap: Record<ResearchMethodType, number> = {
      'accessibility-audit': 0.95, // Highest - specifically designed for this
      'usability-testing': 0.8, // High - real user interaction reveals issues
      'tree-testing': 0.6, // Medium - structural navigation issues
      'card-sorting': 0.5, // Medium-low - conceptual organization issues
      'survey': 0.4 // Lower - mainly form accessibility issues
    } as Record<ResearchMethodType, number>;
    
    return effectivenessMap[methodType] || 0.5;
  }

  private getMethodSpecificRecommendations(methodType: ResearchMethodType): string[] {
    const recommendationsMap: Record<ResearchMethodType, string[]> = {
      'accessibility-audit': [
        'Combine automated scanning with manual testing',
        'Include users with disabilities in validation',
        'Test with actual assistive technologies'
      ],
      'card-sorting': [
        'Provide keyboard alternatives to drag/drop',
        'Add audio descriptions for visual sorting',
        'Include accessibility preferences in setup'
      ],
      'tree-testing': [
        'Ensure keyboard navigation works properly',
        'Provide alternative text for tree structure',
        'Test with screen readers during setup'
      ],
      'survey': [
        'Use proper form labels and descriptions',
        'Implement clear error messaging',
        'Allow extended time for completion'
      ],
      'usability-testing': [
        'Include accessibility tasks in test scenarios',
        'Recruit participants with disabilities',
        'Use accessibility-friendly testing environments'
      ]
    } as Record<ResearchMethodType, string[]>;
    
    return recommendationsMap[methodType] || [];
  }

  private generateCrossMethodRecommendations(): CrossMethodRecommendation[] {
    const recommendations: CrossMethodRecommendation[] = [];
    
    // Analyze cross-method patterns and generate recommendations
    const accessibilityMethods = this.studies.filter(s => s.type === 'accessibility-audit');
    const otherMethods = this.studies.filter(s => s.type !== 'accessibility-audit');
    
    if (accessibilityMethods.length === 0) {
      recommendations.push({
        type: 'method-combination',
        priority: 'critical',
        description: 'Add accessibility audits to validate technical compliance across all studies',
        affectedMethods: [...new Set(otherMethods.map(s => s.type))],
        expectedImpact: 'Identify 60-80% more accessibility issues through technical scanning',
        implementationEffort: 'moderate'
      });
    }
    
    // Recommend combining methods for comprehensive coverage
    if (this.hasMethod('usability-testing') && this.hasMethod('accessibility-audit')) {
      recommendations.push({
        type: 'method-combination',
        priority: 'high',
        description: 'Cross-validate accessibility audit findings with usability testing results',
        affectedMethods: ['usability-testing', 'accessibility-audit'],
        expectedImpact: 'Reduce false positives and identify real-world impact of technical issues',
        implementationEffort: 'minimal'
      });
    }
    
    // Participant support recommendations
    const participantAccessibilityNeeds = this.assessParticipantAccessibilityNeeds();
    if (participantAccessibilityNeeds > 0.2) { // More than 20% need accessibility support
      recommendations.push({
        type: 'participant-support',
        priority: 'high',
        description: 'Implement comprehensive accessibility preferences system for participants',
        affectedMethods: [...new Set(this.studies.map(s => s.type))],
        expectedImpact: 'Improve participation rates by 30-50% for users with disabilities',
        implementationEffort: 'significant'
      });
    }
    
    return recommendations;
  }

  private hasMethod(methodType: ResearchMethodType): boolean {
    return this.studies.some(s => s.type === methodType);
  }

  private assessParticipantAccessibilityNeeds(): number {
    // Estimate percentage of participants needing accessibility accommodations
    const totalParticipants = this.results.length;
    if (totalParticipants === 0) return 0;
    
    // This would analyze actual participant data if available
    // For now, use general population estimates
    return 0.15; // ~15% of population has some form of disability
  }

  private calculateOverallAccessibilityScore(): number {
    if (this.studies.length === 0) return 0;
    
    const methodScores = this.studies.map(study => 
      this.calculateMethodAccessibilityScore(study.type)
    );
    
    return methodScores.reduce((sum, score) => sum + score, 0) / methodScores.length;
  }

  private createParticipantProfile(): ParticipantAccessibilityProfile {
    const totalParticipants = this.results.length;
    const estimatedAccessibilityUsers = Math.round(totalParticipants * 0.15);
    
    return {
      totalParticipants,
      accessibilityUsers: estimatedAccessibilityUsers,
      commonAssistiveTechnologies: [
        'Screen readers',
        'Keyboard navigation',
        'Voice recognition software',
        'Screen magnification'
      ],
      preferredInteractionMethods: [
        'Keyboard-only navigation',
        'High contrast displays',
        'Extended time limits',
        'Audio descriptions'
      ],
      barrierFrequency: {
        'Visual barriers': Math.round(estimatedAccessibilityUsers * 0.4),
        'Motor barriers': Math.round(estimatedAccessibilityUsers * 0.3),
        'Cognitive barriers': Math.round(estimatedAccessibilityUsers * 0.2),
        'Auditory barriers': Math.round(estimatedAccessibilityUsers * 0.1)
      },
      methodAccessibility: this.studies.reduce((acc, study) => {
        acc[study.type] = this.calculateMethodAccessibilityScore(study.type);
        return acc;
      }, {} as Record<ResearchMethodType, number>)
    };
  }
}

// Utility functions
export const analyzeCrossMethodAccessibility = (
  studies: Study[],
  results: StudyResult[],
  accessibilityResults: AccessibilityResult[] = []
): CrossMethodAccessibilityAnalysis => {
  const analyzer = new CrossMethodAccessibilityAnalyzer(studies, results, accessibilityResults);
  return analyzer.analyze();
};

export const getMethodAccessibilityRecommendations = (
  methodType: ResearchMethodType
): string[] => {
  const analyzer = new CrossMethodAccessibilityAnalyzer([], [], []);
  return analyzer['getMethodSpecificRecommendations'](methodType);
};

export const calculateMethodCompatibilityScore = (
  methodA: ResearchMethodType,
  methodB: ResearchMethodType
): number => {
  const compatibilityMatrix: Record<string, number> = {
    'accessibility-audit-usability-testing': 0.9,
    'accessibility-audit-survey': 0.7,
    'accessibility-audit-card-sorting': 0.6,
    'usability-testing-survey': 0.8,
    'card-sorting-tree-testing': 0.9,
    'tree-testing-usability-testing': 0.8
  };
  
  const key = `${methodA}-${methodB}`;
  const reverseKey = `${methodB}-${methodA}`;
  
  return compatibilityMatrix[key] || compatibilityMatrix[reverseKey] || 0.5;
};