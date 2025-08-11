// Comprehensive WCAG Compliance Framework with Certification Capabilities
import { AccessibilityResult, AccessibilityEvaluation, AccessibilityGuideline } from '../types';
import { WCAG_GUIDELINES } from './accessibility';

export interface WCAGComplianceLevel {
  level: 'A' | 'AA' | 'AAA';
  version: '2.0' | '2.1' | '2.2';
  passPercentage: number;
  requiredCriteria: string[];
  optionalCriteria: string[];
}

export interface ComplianceCertification {
  id: string;
  websiteUrl: string;
  complianceLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
  wcagVersion: '2.0' | '2.1' | '2.2';
  certificationDate: Date;
  expirationDate: Date;
  auditResults: AccessibilityResult[];
  complianceScore: number;
  criticalIssues: number;
  resolvedIssues: AccessibilityEvaluation[];
  pendingIssues: AccessibilityEvaluation[];
  certificationBody: string;
  auditor: string;
  evidence: CertificationEvidence;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
}

export interface CertificationEvidence {
  screenshots: string[];
  testReports: string[];
  codeExamples: string[];
  userTestingResults: string[];
  remediationDocumentation: string[];
  thirdPartyValidation: string[];
}

export interface ComplianceGap {
  criterion: string;
  currentStatus: 'pass' | 'fail' | 'not-tested';
  requiredForLevel: 'A' | 'AA' | 'AAA';
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'minimal' | 'moderate' | 'significant' | 'extensive';
  priority: number;
  recommendations: string[];
  resources: string[];
}

export interface ComplianceRoadmap {
  currentLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
  targetLevel: 'A' | 'AA' | 'AAA';
  gaps: ComplianceGap[];
  phases: CompliancePhase[];
  timeline: ComplianceTimeline;
  budget: ComplianceBudget;
}

export interface CompliancePhase {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  estimatedDuration: number; // in days
  estimatedCost: number;
  dependencies: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
}

export interface ComplianceTimeline {
  startDate: Date;
  targetCompletionDate: Date;
  milestones: ComplianceMilestone[];
  riskFactors: string[];
}

export interface ComplianceMilestone {
  id: string;
  name: string;
  date: Date;
  criteria: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
}

export interface ComplianceBudget {
  totalEstimate: number;
  breakdown: {
    audit: number;
    remediation: number;
    testing: number;
    certification: number;
    maintenance: number;
  };
  contingency: number;
}

// WCAG Compliance Levels Definition
export const WCAG_COMPLIANCE_LEVELS: Record<string, WCAGComplianceLevel> = {
  'A': {
    level: 'A',
    version: '2.1',
    passPercentage: 100,
    requiredCriteria: [
      '1.1.1', '1.2.1', '1.2.2', '1.2.3', '1.3.1', '1.3.2', '1.3.3',
      '1.4.1', '1.4.2', '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.3.1',
      '2.4.1', '2.4.2', '2.4.3', '2.4.4', '3.1.1', '3.2.1', '3.2.2',
      '3.3.1', '3.3.2', '4.1.1', '4.1.2'
    ],
    optionalCriteria: []
  },
  'AA': {
    level: 'AA',
    version: '2.1',
    passPercentage: 100,
    requiredCriteria: [
      // Include all A level criteria plus AA criteria
      '1.1.1', '1.2.1', '1.2.2', '1.2.3', '1.3.1', '1.3.2', '1.3.3',
      '1.4.1', '1.4.2', '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.3.1',
      '2.4.1', '2.4.2', '2.4.3', '2.4.4', '3.1.1', '3.2.1', '3.2.2',
      '3.3.1', '3.3.2', '4.1.1', '4.1.2',
      // AA level criteria
      '1.2.4', '1.2.5', '1.3.4', '1.3.5', '1.4.3', '1.4.4', '1.4.5',
      '2.4.5', '2.4.6', '2.4.7', '3.1.2', '3.2.3', '3.2.4', '3.3.3', '3.3.4'
    ],
    optionalCriteria: []
  },
  'AAA': {
    level: 'AAA',
    version: '2.1',
    passPercentage: 100,
    requiredCriteria: [
      // Include all A and AA level criteria plus AAA criteria
      '1.1.1', '1.2.1', '1.2.2', '1.2.3', '1.3.1', '1.3.2', '1.3.3',
      '1.4.1', '1.4.2', '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.3.1',
      '2.4.1', '2.4.2', '2.4.3', '2.4.4', '3.1.1', '3.2.1', '3.2.2',
      '3.3.1', '3.3.2', '4.1.1', '4.1.2',
      '1.2.4', '1.2.5', '1.3.4', '1.3.5', '1.4.3', '1.4.4', '1.4.5',
      '2.4.5', '2.4.6', '2.4.7', '3.1.2', '3.2.3', '3.2.4', '3.3.3', '3.3.4',
      // AAA level criteria
      '1.2.6', '1.2.7', '1.2.8', '1.2.9', '1.4.6', '1.4.7', '1.4.8', '1.4.9',
      '2.1.3', '2.2.3', '2.2.4', '2.2.5', '2.3.2', '2.4.8', '2.4.9', '2.4.10',
      '3.1.3', '3.1.4', '3.1.5', '3.1.6', '3.2.5', '3.3.5', '3.3.6'
    ],
    optionalCriteria: []
  }
};

export class WCAGComplianceFramework {
  private wcagVersion: '2.0' | '2.1' | '2.2';
  private targetLevel: 'A' | 'AA' | 'AAA';

  constructor(wcagVersion: '2.0' | '2.1' | '2.2' = '2.1', targetLevel: 'A' | 'AA' | 'AAA' = 'AA') {
    this.wcagVersion = wcagVersion;
    this.targetLevel = targetLevel;
  }

  // Assess current compliance level
  assessComplianceLevel(results: AccessibilityResult[]): 'A' | 'AA' | 'AAA' | 'non-compliant' {
    const allEvaluations = results.flatMap(r => r.evaluations);
    
    // Check each level in ascending order
    for (const level of ['A', 'AA', 'AAA'] as const) {
      const compliance = WCAG_COMPLIANCE_LEVELS[level];
      const meetsLevel = this.checkLevelCompliance(allEvaluations, compliance);
      
      if (!meetsLevel) {
        // If we fail at level A, we're non-compliant
        if (level === 'A') return 'non-compliant';
        
        // Otherwise, return the previous level
        if (level === 'AA') return 'A';
        if (level === 'AAA') return 'AA';
      }
    }
    
    return 'AAA'; // If we pass all levels
  }

  private checkLevelCompliance(evaluations: AccessibilityEvaluation[], level: WCAGComplianceLevel): boolean {
    const requiredCriteria = level.requiredCriteria;
    
    for (const criterion of requiredCriteria) {
      const criterionEvaluations = evaluations.filter(e => e.guidelineId === criterion);
      
      // If no evaluations exist for this criterion, consider it a fail
      if (criterionEvaluations.length === 0) {
        return false;
      }
      
      // All evaluations for this criterion must pass
      const allPass = criterionEvaluations.every(e => e.status === 'pass');
      if (!allPass) {
        return false;
      }
    }
    
    return true;
  }

  // Generate compliance gaps
  generateComplianceGaps(results: AccessibilityResult[], targetLevel: 'A' | 'AA' | 'AAA'): ComplianceGap[] {
    const allEvaluations = results.flatMap(r => r.evaluations);
    const compliance = WCAG_COMPLIANCE_LEVELS[targetLevel];
    const gaps: ComplianceGap[] = [];

    for (const criterion of compliance.requiredCriteria) {
      const criterionEvaluations = allEvaluations.filter(e => e.guidelineId === criterion);
      
      let currentStatus: 'pass' | 'fail' | 'not-tested' = 'not-tested';
      if (criterionEvaluations.length > 0) {
        currentStatus = criterionEvaluations.some(e => e.status === 'fail') ? 'fail' : 'pass';
      }

      if (currentStatus !== 'pass') {
        const guideline = WCAG_GUIDELINES[criterion];
        const impact = this.assessImpact(criterion, criterionEvaluations);
        const effort = this.estimateEffort(criterion, criterionEvaluations);
        
        gaps.push({
          criterion,
          currentStatus,
          requiredForLevel: targetLevel,
          impact,
          effort,
          priority: this.calculatePriority(impact, effort),
          recommendations: this.generateRecommendations(criterion, criterionEvaluations),
          resources: this.getResources(criterion)
        });
      }
    }

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  private assessImpact(criterion: string, evaluations: AccessibilityEvaluation[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCriteria = ['1.1.1', '1.3.1', '2.1.1', '4.1.2'];
    const highImpactCriteria = ['1.4.3', '2.4.1', '2.4.2', '3.3.1'];
    
    if (criticalCriteria.includes(criterion)) return 'critical';
    if (highImpactCriteria.includes(criterion)) return 'high';
    
    // Check severity of existing issues
    const hasHighSeverity = evaluations.some(e => e.severity === 'critical' || e.severity === 'high');
    if (hasHighSeverity) return 'high';
    
    const hasMediumSeverity = evaluations.some(e => e.severity === 'medium');
    if (hasMediumSeverity) return 'medium';
    
    return 'low';
  }

  private estimateEffort(criterion: string, evaluations: AccessibilityEvaluation[]): 'minimal' | 'moderate' | 'significant' | 'extensive' {
    const minimalEffortCriteria = ['1.4.2', '2.4.2', '3.1.1'];
    const extensiveEffortCriteria = ['1.2.3', '1.2.5', '1.4.5'];
    
    if (minimalEffortCriteria.includes(criterion)) return 'minimal';
    if (extensiveEffortCriteria.includes(criterion)) return 'extensive';
    
    // Base on number of issues and their complexity
    const issueCount = evaluations.filter(e => e.status === 'fail').length;
    if (issueCount > 10) return 'extensive';
    if (issueCount > 5) return 'significant';
    if (issueCount > 1) return 'moderate';
    
    return 'minimal';
  }

  private calculatePriority(impact: string, effort: string): number {
    const impactScore = { critical: 4, high: 3, medium: 2, low: 1 };
    const effortScore = { minimal: 4, moderate: 3, significant: 2, extensive: 1 };
    
    return (impactScore[impact as keyof typeof impactScore] * 2) + 
           effortScore[effort as keyof typeof effortScore];
  }

  private generateRecommendations(criterion: string, evaluations: AccessibilityEvaluation[]): string[] {
    const recommendations: string[] = [];
    const guideline = WCAG_GUIDELINES[criterion];
    
    if (guideline) {
      recommendations.push(`Review WCAG ${criterion}: ${guideline.title}`);
      recommendations.push(...guideline.successCriteria.map(sc => `Ensure ${sc}`));
    }
    
    // Add specific recommendations based on failed evaluations
    evaluations.forEach(evaluation => {
      recommendations.push(...evaluation.recommendations);
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  private getResources(criterion: string): string[] {
    const baseResources = [
      `WCAG ${this.wcagVersion} Guidelines: ${criterion}`,
      `WebAIM Article on ${criterion}`,
      `Deque University: ${criterion}`
    ];
    
    // Add criterion-specific resources
    const specificResources: Record<string, string[]> = {
      '1.1.1': [
        'Alt Text Best Practices Guide',
        'Image Description Guidelines',
        'Decorative vs. Informative Images'
      ],
      '1.4.3': [
        'Color Contrast Analyzer Tool',
        'WCAG Contrast Requirements',
        'Accessible Color Palette Generator'
      ],
      '2.1.1': [
        'Keyboard Navigation Patterns',
        'Focus Management Guide',
        'ARIA Keyboard Interaction Patterns'
      ]
    };
    
    return [...baseResources, ...(specificResources[criterion] || [])];
  }

  // Create compliance roadmap
  createComplianceRoadmap(results: AccessibilityResult[], targetLevel: 'A' | 'AA' | 'AAA'): ComplianceRoadmap {
    const currentLevel = this.assessComplianceLevel(results);
    const gaps = this.generateComplianceGaps(results, targetLevel);
    const phases = this.createCompliancePhases(gaps);
    const timeline = this.createTimeline(phases);
    const budget = this.estimateBudget(phases);

    return {
      currentLevel,
      targetLevel,
      gaps,
      phases,
      timeline,
      budget
    };
  }

  private createCompliancePhases(gaps: ComplianceGap[]): CompliancePhase[] {
    const phases: CompliancePhase[] = [];
    
    // Phase 1: Critical and High Impact Issues
    const criticalGaps = gaps.filter(g => g.impact === 'critical' || g.impact === 'high');
    if (criticalGaps.length > 0) {
      phases.push({
        id: 'phase-1',
        name: 'Critical Issues Resolution',
        description: 'Address critical and high-impact accessibility barriers',
        criteria: criticalGaps.map(g => g.criterion),
        estimatedDuration: Math.max(30, criticalGaps.length * 3),
        estimatedCost: criticalGaps.length * 1500,
        dependencies: [],
        deliverables: [
          'Critical accessibility issues resolved',
          'Updated accessibility documentation',
          'Testing reports for critical fixes'
        ],
        acceptanceCriteria: [
          'All critical issues pass automated testing',
          'Manual testing confirms fixes',
          'No regression in existing functionality'
        ]
      });
    }

    // Phase 2: Medium Impact Issues
    const mediumGaps = gaps.filter(g => g.impact === 'medium');
    if (mediumGaps.length > 0) {
      phases.push({
        id: 'phase-2',
        name: 'Medium Impact Issues',
        description: 'Resolve medium-impact accessibility issues',
        criteria: mediumGaps.map(g => g.criterion),
        estimatedDuration: Math.max(20, mediumGaps.length * 2),
        estimatedCost: mediumGaps.length * 800,
        dependencies: phases.length > 0 ? ['phase-1'] : [],
        deliverables: [
          'Medium-impact issues resolved',
          'User testing with assistive technologies',
          'Compliance testing report'
        ],
        acceptanceCriteria: [
          'All medium-impact issues resolved',
          'User testing validates fixes',
          'Compliance score improvement documented'
        ]
      });
    }

    // Phase 3: Low Impact and Polish
    const lowGaps = gaps.filter(g => g.impact === 'low');
    if (lowGaps.length > 0) {
      phases.push({
        id: 'phase-3',
        name: 'Compliance Polish',
        description: 'Address remaining issues and achieve full compliance',
        criteria: lowGaps.map(g => g.criterion),
        estimatedDuration: Math.max(15, lowGaps.length * 1),
        estimatedCost: lowGaps.length * 400,
        dependencies: phases.length > 0 ? [phases[phases.length - 1].id] : [],
        deliverables: [
          'Complete compliance achieved',
          'Final compliance audit',
          'Certification documentation prepared'
        ],
        acceptanceCriteria: [
          'All success criteria met',
          'Third-party audit confirms compliance',
          'Certification ready for submission'
        ]
      });
    }

    return phases;
  }

  private createTimeline(phases: CompliancePhase[]): ComplianceTimeline {
    const startDate = new Date();
    const milestones: ComplianceMilestone[] = [];
    let currentDate = new Date(startDate);

    phases.forEach((phase, index) => {
      // Add buffer time between phases
      if (index > 0) {
        currentDate.setDate(currentDate.getDate() + 7);
      }

      const phaseStart = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + phase.estimatedDuration);
      const phaseEnd = new Date(currentDate);

      milestones.push({
        id: `${phase.id}-start`,
        name: `${phase.name} - Start`,
        date: phaseStart,
        criteria: phase.criteria,
        status: 'pending'
      });

      milestones.push({
        id: `${phase.id}-end`,
        name: `${phase.name} - Complete`,
        date: phaseEnd,
        criteria: phase.criteria,
        status: 'pending'
      });
    });

    return {
      startDate,
      targetCompletionDate: currentDate,
      milestones,
      riskFactors: [
        'Resource availability constraints',
        'Technical complexity underestimation',
        'Third-party dependency delays',
        'Scope creep from additional requirements',
        'Testing and validation bottlenecks'
      ]
    };
  }

  private estimateBudget(phases: CompliancePhase[]): ComplianceBudget {
    const remediationCost = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);
    const auditCost = 5000; // Initial and final audit costs
    const testingCost = Math.floor(remediationCost * 0.2); // 20% of remediation
    const certificationCost = 2000;
    const maintenanceCost = Math.floor(remediationCost * 0.1); // 10% annually

    const totalEstimate = remediationCost + auditCost + testingCost + certificationCost + maintenanceCost;
    const contingency = Math.floor(totalEstimate * 0.15); // 15% contingency

    return {
      totalEstimate: totalEstimate + contingency,
      breakdown: {
        audit: auditCost,
        remediation: remediationCost,
        testing: testingCost,
        certification: certificationCost,
        maintenance: maintenanceCost
      },
      contingency
    };
  }

  // Generate compliance certificate
  generateCertificate(
    results: AccessibilityResult[],
    websiteUrl: string,
    auditor: string,
    certificationBody: string = 'Vision UX Accessibility Audit'
  ): ComplianceCertification {
    const complianceLevel = this.assessComplianceLevel(results);
    const allEvaluations = results.flatMap(r => r.evaluations);
    const violations = allEvaluations.filter(e => e.status === 'fail');
    const criticalIssues = violations.filter(v => v.severity === 'critical').length;
    
    // Calculate compliance score
    const totalCriteria = WCAG_COMPLIANCE_LEVELS[this.targetLevel].requiredCriteria.length;
    const passedCriteria = totalCriteria - violations.length;
    const complianceScore = (passedCriteria / totalCriteria) * 100;

    const certificationDate = new Date();
    const expirationDate = new Date(certificationDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 year validity

    return {
      id: `cert-${Date.now()}`,
      websiteUrl,
      complianceLevel,
      wcagVersion: this.wcagVersion,
      certificationDate,
      expirationDate,
      auditResults: results,
      complianceScore,
      criticalIssues,
      resolvedIssues: allEvaluations.filter(e => e.status === 'pass'),
      pendingIssues: violations,
      certificationBody,
      auditor,
      evidence: {
        screenshots: [],
        testReports: [],
        codeExamples: [],
        userTestingResults: [],
        remediationDocumentation: [],
        thirdPartyValidation: []
      },
      status: complianceLevel === 'non-compliant' ? 'rejected' : 'approved'
    };
  }

  // Export compliance report
  exportComplianceReport(
    roadmap: ComplianceRoadmap,
    certification?: ComplianceCertification
  ): string {
    const report = {
      title: `WCAG ${this.wcagVersion} ${this.targetLevel} Compliance Report`,
      generatedAt: new Date().toISOString(),
      summary: {
        currentLevel: roadmap.currentLevel,
        targetLevel: roadmap.targetLevel,
        totalGaps: roadmap.gaps.length,
        estimatedDuration: roadmap.timeline.targetCompletionDate,
        estimatedBudget: roadmap.budget.totalEstimate
      },
      complianceGaps: roadmap.gaps,
      implementationPlan: roadmap.phases,
      timeline: roadmap.timeline,
      budget: roadmap.budget,
      certification
    };

    return JSON.stringify(report, null, 2);
  }
}

// Utility functions
export const createWCAGFramework = (
  version: '2.0' | '2.1' | '2.2' = '2.1',
  level: 'A' | 'AA' | 'AAA' = 'AA'
): WCAGComplianceFramework => {
  return new WCAGComplianceFramework(version, level);
};

export const getComplianceScore = (results: AccessibilityResult[]): number => {
  const framework = new WCAGComplianceFramework();
  const allEvaluations = results.flatMap(r => r.evaluations);
  const passedEvaluations = allEvaluations.filter(e => e.status === 'pass');
  
  return allEvaluations.length > 0 ? (passedEvaluations.length / allEvaluations.length) * 100 : 0;
};

export const isCompliantForLevel = (
  results: AccessibilityResult[],
  level: 'A' | 'AA' | 'AAA'
): boolean => {
  const framework = new WCAGComplianceFramework('2.1', level);
  const assessedLevel = framework.assessComplianceLevel(results);
  
  const levelHierarchy = ['non-compliant', 'A', 'AA', 'AAA'];
  const currentIndex = levelHierarchy.indexOf(assessedLevel);
  const targetIndex = levelHierarchy.indexOf(level);
  
  return currentIndex >= targetIndex;
};