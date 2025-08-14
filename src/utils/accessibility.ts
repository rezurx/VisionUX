// Comprehensive accessibility utilities for WCAG compliance testing and axe-core integration
import axe, { AxeResults } from 'axe-core';
import { AccessibilityResult, AccessibilityEvaluation, AccessibilityGuideline } from '../types';

// Define types for axe-core compatibility
export type AxeRunContext = any;
export type Result = any;

// Enhanced accessibility scanning configuration
export interface AccessibilityScanConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  rules?: string[]; // Specific rules to test
  tags?: string[]; // Rule categories to include
  exclude?: string[]; // Selectors to exclude from testing
  include?: string[]; // Specific selectors to test
  timeout?: number; // Scan timeout in milliseconds
  allowFailedFrames?: boolean;
  reporter?: 'v1' | 'v2' | 'raw';
  resultTypes?: ('violations' | 'incomplete' | 'passes' | 'inapplicable')[];
}

// Accessibility issue with enhanced metadata
export interface AccessibilityIssue extends Result {
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagPrinciple: 'perceivable' | 'operable' | 'understandable' | 'robust';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: 'minutes' | 'hours' | 'days';
  remediationGuidance: string[];
  codeExamples?: string[];
  testingNotes?: string[];
  affectedUsers?: string[];
}

// Real-time accessibility monitoring
export interface AccessibilityMonitor {
  isActive: boolean;
  scanInterval: number;
  lastScanTime: number;
  issueHistory: AccessibilityIssue[];
  progressTracking: AccessibilityProgress;
  schedule?: AccessibilityScheduleConfig;
  isScheduled?: boolean;
  nextScanTime?: number;
}

export interface AccessibilityProgress {
  totalIssues: number;
  resolvedIssues: number;
  newIssues: number;
  criticalIssues: number;
  progressPercentage: number;
  complianceLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
  lastUpdated: number;
}

// Scheduling configuration for automated scans
export interface AccessibilityScheduleConfig {
  type: 'interval' | 'cron' | 'event-driven';
  schedule: string | number; // cron expression or interval in ms
  timezone?: string;
  enabled: boolean;
  conditions?: ScheduleCondition[];
  notifications?: NotificationConfig[];
  retryPolicy?: RetryPolicy;
}

export interface ScheduleCondition {
  type: 'page-change' | 'user-activity' | 'time-range' | 'custom';
  value: string | number | boolean;
  operator?: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains';
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack' | 'browser';
  target: string; // email address, webhook URL, etc.
  events: ('scan-complete' | 'issues-found' | 'compliance-change' | 'error')[];
  template?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay?: number;
  retryConditions: ('network-error' | 'timeout' | 'server-error' | 'rate-limit')[];
}

// Comprehensive WCAG guidelines database
export const WCAG_GUIDELINES: Record<string, AccessibilityGuideline> = {
  // Perceivable Principle
  '1.1.1': {
    id: '1.1.1',
    principle: 'perceivable',
    level: 'A',
    title: 'Non-text Content',
    description: 'All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.',
    successCriteria: [
      'Images have meaningful alt text',
      'Decorative images have empty alt attributes',
      'Complex images have detailed descriptions',
      'Form controls have associated labels'
    ],
    testingMethods: [
      'Automated axe-core scanning',
      'Screen reader testing',
      'Manual inspection of alt attributes',
      'Keyboard navigation testing'
    ]
  },
  '1.3.1': {
    id: '1.3.1',
    principle: 'perceivable',
    level: 'A',
    title: 'Info and Relationships',
    description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.',
    successCriteria: [
      'Headings use proper markup',
      'Lists use proper list markup',
      'Tables have appropriate headers',
      'Form labels are properly associated'
    ],
    testingMethods: [
      'Automated structure analysis',
      'Screen reader testing',
      'Keyboard navigation',
      'HTML validation'
    ]
  },
  '1.4.3': {
    id: '1.4.3',
    principle: 'perceivable',
    level: 'AA',
    title: 'Contrast (Minimum)',
    description: 'The visual presentation of text and images of text has a contrast ratio of at least 4.5:1.',
    successCriteria: [
      'Normal text has 4.5:1 contrast ratio',
      'Large text has 3:1 contrast ratio',
      'UI components meet contrast requirements',
      'Graphical elements meet contrast standards'
    ],
    testingMethods: [
      'Automated contrast analysis',
      'Color contrast analyzers',
      'Manual testing with tools',
      'User testing with vision impairments'
    ]
  },
  '2.1.1': {
    id: '2.1.1',
    principle: 'operable',
    level: 'A',
    title: 'Keyboard',
    description: 'All functionality of the content is operable through a keyboard interface.',
    successCriteria: [
      'All interactive elements are keyboard accessible',
      'No keyboard traps exist',
      'Focus order is logical',
      'Keyboard shortcuts are available'
    ],
    testingMethods: [
      'Keyboard-only navigation testing',
      'Tab order verification',
      'Focus indicator testing',
      'Screen reader compatibility'
    ]
  },
  '2.4.1': {
    id: '2.4.1',
    principle: 'operable',
    level: 'A',
    title: 'Bypass Blocks',
    description: 'A mechanism is available to bypass blocks of content that are repeated on multiple Web pages.',
    successCriteria: [
      'Skip links are provided',
      'Proper heading structure exists',
      'Landmarks are implemented',
      'Page regions are identified'
    ],
    testingMethods: [
      'Skip link functionality testing',
      'Screen reader navigation',
      'Keyboard navigation patterns',
      'Automated landmark detection'
    ]
  },
  '3.1.1': {
    id: '3.1.1',
    principle: 'understandable',
    level: 'A',
    title: 'Language of Page',
    description: 'The default human language of each Web page can be programmatically determined.',
    successCriteria: [
      'Page has lang attribute',
      'Language changes are marked',
      'Content language is appropriate',
      'Text direction is specified'
    ],
    testingMethods: [
      'HTML lang attribute validation',
      'Screen reader language testing',
      'Automated language detection',
      'Manual content review'
    ]
  },
  '4.1.1': {
    id: '4.1.1',
    principle: 'robust',
    level: 'A',
    title: 'Parsing',
    description: 'In content implemented using markup languages, elements have complete start and end tags.',
    successCriteria: [
      'HTML is well-formed',
      'No duplicate IDs exist',
      'Elements are properly nested',
      'Attributes are unique'
    ],
    testingMethods: [
      'HTML validation',
      'Automated parsing checks',
      'Markup structure analysis',
      'Browser compatibility testing'
    ]
  },
  '4.1.2': {
    id: '4.1.2',
    principle: 'robust',
    level: 'A',
    title: 'Name, Role, Value',
    description: 'For all user interface components, the name and role can be programmatically determined.',
    successCriteria: [
      'Form controls have accessible names',
      'Buttons have meaningful labels',
      'Links have descriptive text',
      'Custom controls have ARIA attributes'
    ],
    testingMethods: [
      'Screen reader testing',
      'ARIA attribute validation',
      'Automated accessibility scanning',
      'Keyboard interaction testing'
    ]
  }
};

// Enhanced accessibility scanning class
export class AccessibilityScanner {
  private config: AccessibilityScanConfig;
  private isScanning: boolean = false;
  private monitor: AccessibilityMonitor | null = null;

  constructor(config: AccessibilityScanConfig = { wcagLevel: 'AA' }) {
    this.config = {
      timeout: 30000,
      allowFailedFrames: true,
      reporter: 'v2',
      resultTypes: ['violations', 'incomplete', 'passes'],
      ...config
    };

    this.initializeAxeConfig();
  }

  private initializeAxeConfig(): void {
    // Configure axe-core with custom rules and settings
    axe.configure({
      locale: 'en',
      rules: []
    } as any);
  }

  private getWCAGRules(): Record<string, { enabled: boolean }> {
    const level = this.config.wcagLevel;
    const rules: Record<string, { enabled: boolean }> = {};

    // Enable rules based on WCAG level
    const allRules = [
      // Level A rules
      'area-alt', 'aria-allowed-attr', 'aria-required-attr', 'aria-roles',
      'aria-valid-attr-value', 'aria-valid-attr', 'blink', 'button-name',
      'color-contrast', 'document-title', 'duplicate-id', 'empty-heading',
      'form-field-multiple-labels', 'frame-title', 'html-has-lang',
      'html-lang-valid', 'image-alt', 'input-image-alt', 'label',
      'link-name', 'list', 'listitem', 'marquee', 'meta-refresh',
      'object-alt', 'p-as-heading', 'role-img-alt', 'scrollable-region-focusable',
      'server-side-image-map', 'svg-img-alt', 'td-headers-attr',
      'th-has-data-cells', 'valid-lang', 'video-caption',
      
      // Level AA rules
      ...(level === 'AA' || level === 'AAA' ? [
        'color-contrast-enhanced', 'focus-order-semantics', 'hidden-content',
        'meta-viewport-large', 'meta-viewport', 'page-has-heading-one',
        'region', 'skip-link', 'tabindex'
      ] : []),
      
      // Level AAA rules  
      ...(level === 'AAA' ? [
        'focus-order-semantics', 'hidden-content', 'meta-viewport-large'
      ] : [])
    ];

    allRules.forEach(rule => {
      rules[rule] = { enabled: true };
    });

    return rules;
  }

  private getWCAGTags(): string[] {
    const level = this.config.wcagLevel;
    const tags = ['wcag2a'];
    
    if (level === 'AA' || level === 'AAA') {
      tags.push('wcag2aa');
    }
    
    if (level === 'AAA') {
      tags.push('wcag2aaa');
    }
    
    return tags;
  }

  // Main scanning method
  async scanPage(context?: AxeRunContext): Promise<AccessibilityResult> {
    if (this.isScanning) {
      throw new Error('Accessibility scan already in progress');
    }

    this.isScanning = true;
    const startTime = Date.now();

    try {
      const axeContext = context || document;
      const axeOptions = {
        rules: this.config.rules ? Object.fromEntries(
          this.config.rules.map(rule => [rule, { enabled: true }])
        ) : undefined,
        tags: this.config.tags || this.getWCAGTags(),
        exclude: this.config.exclude,
        include: this.config.include,
        timeout: this.config.timeout,
        allowFailedFrames: this.config.allowFailedFrames,
        reporter: this.config.reporter,
        resultTypes: this.config.resultTypes
      };

      const results: AxeResults = await (axe as any).run(axeContext, axeOptions);
      
      return this.processResults(results, startTime);
    } catch (error) {
      console.error('Accessibility scan failed:', error);
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  // Process axe results into enhanced accessibility data
  private processResults(results: AxeResults, startTime: number): AccessibilityResult {
    const evaluations: AccessibilityEvaluation[] = [];
    
    // Process violations (failures)
    results.violations.forEach(violation => {
      const guideline = WCAG_GUIDELINES[violation.id] || this.createGuidelineFromViolation(violation);
      
      evaluations.push({
        guidelineId: violation.id,
        status: 'fail',
        severity: this.mapSeverity(violation.impact || 'medium'),
        findings: [
          violation.description,
          ...violation.nodes.map(node => `Element: ${node.target.join(', ')} - ${(node as any).failureSummary || 'No summary available'}`)
        ],
        recommendations: this.generateRecommendations(violation),
        evidence: {
          codeSnippets: violation.nodes.map(node => node.html),
          screenshots: [], // Would be populated by screenshot service
          userQuotes: []
        }
      });
    });

    // Process incomplete tests (needs review)
    ((results as any).incomplete || []).forEach((incomplete: any) => {
      evaluations.push({
        guidelineId: incomplete.id,
        status: 'needs-review',
        severity: 'medium',
        findings: [
          incomplete.description,
          ...incomplete.nodes.map(node => `Needs manual review: ${node.target.join(', ')}`)
        ],
        recommendations: this.generateRecommendations(incomplete),
        evidence: {
          codeSnippets: incomplete.nodes.map(node => node.html),
          screenshots: [],
          userQuotes: []
        }
      });
    });

    // Process passes (successes)
    results.passes.forEach(pass => {
      evaluations.push({
        guidelineId: pass.id,
        status: 'pass',
        severity: 'low',
        findings: [`Successfully meets criteria: ${pass.description}`],
        recommendations: [],
        evidence: {
          codeSnippets: [],
          screenshots: [],
          userQuotes: []
        }
      });
    });

    // Calculate overall score
    const totalTests = evaluations.length;
    const passedTests = evaluations.filter(e => e.status === 'pass').length;
    const overallScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      participantId: 'system', // For automated scans
      studyId: 0, // Would be set by calling context
      evaluations,
      overallScore,
      completionTime: Date.now() - startTime,
      assistiveTechnology: 'axe-core'
    };
  }

  private createGuidelineFromViolation(violation: Result): AccessibilityGuideline {
    return {
      id: violation.id,
      principle: this.inferPrinciple(violation.tags),
      level: this.inferLevel(violation.tags),
      title: violation.help,
      description: violation.description,
      successCriteria: [violation.help],
      testingMethods: ['Automated axe-core scanning']
    };
  }

  private inferPrinciple(tags: string[]): 'perceivable' | 'operable' | 'understandable' | 'robust' {
    if (tags.some(tag => tag.includes('color') || tag.includes('contrast') || tag.includes('image'))) {
      return 'perceivable';
    }
    if (tags.some(tag => tag.includes('keyboard') || tag.includes('focus') || tag.includes('navigation'))) {
      return 'operable';
    }
    if (tags.some(tag => tag.includes('language') || tag.includes('input') || tag.includes('error'))) {
      return 'understandable';
    }
    return 'robust';
  }

  private inferLevel(tags: string[]): 'A' | 'AA' | 'AAA' {
    if (tags.includes('wcag2aaa')) return 'AAA';
    if (tags.includes('wcag2aa')) return 'AA';
    return 'A';
  }

  private mapSeverity(impact: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (impact) {
      case 'minor': return 'low';
      case 'moderate': return 'medium';
      case 'serious': return 'high';
      case 'critical': return 'critical';
      default: return 'medium';
    }
  }

  private generateRecommendations(result: Result): string[] {
    const recommendations: string[] = [];
    
    // Add specific recommendations based on the rule
    if (result.helpUrl) {
      recommendations.push(`Learn more: ${result.helpUrl}`);
    }
    
    result.nodes.forEach(node => {
      if (node.any.length > 0) {
        node.any.forEach(check => {
          if (check.message) {
            recommendations.push(check.message);
          }
        });
      }
      
      if (node.all.length > 0) {
        node.all.forEach(check => {
          if (check.message) {
            recommendations.push(check.message);
          }
        });
      }
      
      if (node.none.length > 0) {
        node.none.forEach(check => {
          if (check.message) {
            recommendations.push(`Avoid: ${check.message}`);
          }
        });
      }
    });
    
    // Add generic recommendations if none specific
    if (recommendations.length === 0) {
      recommendations.push(`Review and fix: ${result.description}`);
      recommendations.push('Consult WCAG guidelines for detailed requirements');
      recommendations.push('Test with assistive technologies');
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Enhanced real-time monitoring capabilities with scheduling
  startMonitoring(intervalMs: number = 30000, schedule?: AccessibilityScheduleConfig): void {
    if (this.monitor?.isActive) {
      return;
    }

    this.monitor = {
      isActive: true,
      scanInterval: intervalMs,
      lastScanTime: 0,
      issueHistory: [],
      progressTracking: {
        totalIssues: 0,
        resolvedIssues: 0,
        newIssues: 0,
        criticalIssues: 0,
        progressPercentage: 0,
        complianceLevel: 'non-compliant',
        lastUpdated: Date.now()
      },
      schedule,
      isScheduled: !!schedule
    };

    if (schedule) {
      this.schedulePeriodicScans(schedule);
    } else {
      this.runPeriodicScans();
    }
  }

  stopMonitoring(): void {
    if (this.monitor) {
      this.monitor.isActive = false;
      this.monitor = null;
    }
  }

  private async runPeriodicScans(): Promise<void> {
    if (!this.monitor?.isActive) return;

    try {
      const result = await this.scanPage();
      this.updateProgress(result);
      
      // Send notifications if configured
      if (this.monitor.schedule?.notifications) {
        await this.sendNotifications(result);
      }
    } catch (error) {
      console.error('Periodic accessibility scan failed:', error);
      await this.handleScanError(error);
    }

    // Schedule next scan
    if (this.monitor?.isActive) {
      setTimeout(() => this.runPeriodicScans(), this.monitor.scanInterval);
    }
  }

  private schedulePeriodicScans(schedule: AccessibilityScheduleConfig): void {
    if (!schedule.enabled) return;

    switch (schedule.type) {
      case 'interval':
        this.monitor!.scanInterval = schedule.schedule as number;
        this.runPeriodicScans();
        break;
      
      case 'cron':
        // Basic cron-like scheduling (simplified for demo)
        this.scheduleCronScans(schedule.schedule as string);
        break;
      
      case 'event-driven':
        this.setupEventDrivenScans(schedule);
        break;
    }
  }

  private scheduleCronScans(cronExpression: string): void {
    // Simplified cron parsing - in production use a proper cron library
    const [minutes, hours, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
    
    const scheduleNextScan = () => {
      if (!this.monitor?.isActive) return;
      
      const now = new Date();
      const targetHour = parseInt(hours) || 0;
      const targetMinute = parseInt(minutes) || 0;
      
      const target = new Date(now);
      target.setHours(targetHour, targetMinute, 0, 0);
      
      // If target time has passed today, schedule for tomorrow
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      
      const timeUntilScan = target.getTime() - now.getTime();
      this.monitor!.nextScanTime = target.getTime();
      
      setTimeout(async () => {
        try {
          const result = await this.scanPage();
          this.updateProgress(result);
          if (this.monitor?.schedule?.notifications) {
            await this.sendNotifications(result);
          }
        } catch (error) {
          console.error('Scheduled scan failed:', error);
          await this.handleScanError(error);
        }
        
        // Schedule next occurrence
        scheduleNextScan();
      }, timeUntilScan);
    };
    
    scheduleNextScan();
  }

  private setupEventDrivenScans(schedule: AccessibilityScheduleConfig): void {
    if (!schedule.conditions) return;
    
    schedule.conditions.forEach(condition => {
      switch (condition.type) {
        case 'page-change':
          this.observePageChanges();
          break;
        case 'user-activity':
          this.observeUserActivity();
          break;
        case 'time-range':
          this.scheduleTimeBasedScans(condition);
          break;
      }
    });
  }

  private observePageChanges(): void {
    const observer = new MutationObserver(async (mutations) => {
      const significantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && 
        mutation.addedNodes.length > 5 // Threshold for significant changes
      );
      
      if (significantChanges && this.monitor?.isActive) {
        // Debounce multiple rapid changes
        clearTimeout(this.pageChangeTimeout);
        this.pageChangeTimeout = setTimeout(async () => {
          try {
            const result = await this.scanPage();
            this.updateProgress(result);
          } catch (error) {
            console.error('Page change triggered scan failed:', error);
          }
        }, 2000);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'role', 'aria-*']
    });
  }

  private observeUserActivity(): void {
    let lastActivity = Date.now();
    const inactivityThreshold = 30000; // 30 seconds
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Check for inactivity and trigger scan
    const checkInactivity = () => {
      if (this.monitor?.isActive && Date.now() - lastActivity > inactivityThreshold) {
        this.scanPage().then(result => {
          this.updateProgress(result);
        }).catch(error => {
          console.error('Inactivity triggered scan failed:', error);
        });
      }
      setTimeout(checkInactivity, inactivityThreshold);
    };
    
    checkInactivity();
  }

  private scheduleTimeBasedScans(condition: ScheduleCondition): void {
    // Parse time range from condition value (e.g., "09:00-17:00")
    const timeRange = condition.value as string;
    const [startTime, endTime] = timeRange.split('-');
    
    const isWithinTimeRange = (): boolean => {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const start = parseInt(startTime.replace(':', ''));
      const end = parseInt(endTime.replace(':', ''));
      
      return currentTime >= start && currentTime <= end;
    };
    
    const scheduleCheck = () => {
      if (this.monitor?.isActive && isWithinTimeRange()) {
        this.scanPage().then(result => {
          this.updateProgress(result);
        }).catch(error => {
          console.error('Time-based scan failed:', error);
        });
      }
      
      // Check every minute
      setTimeout(scheduleCheck, 60000);
    };
    
    scheduleCheck();
  }

  private async sendNotifications(result: AccessibilityResult): Promise<void> {
    if (!this.monitor?.schedule?.notifications) return;
    
    for (const notification of this.monitor.schedule.notifications) {
      try {
        switch (notification.type) {
          case 'browser':
            this.sendBrowserNotification(result, notification);
            break;
          case 'webhook':
            await this.sendWebhookNotification(result, notification);
            break;
          case 'email':
            // Email notifications would require backend integration
            console.log('Email notification would be sent:', notification.target);
            break;
          case 'slack':
            // Slack notifications would require Slack integration
            console.log('Slack notification would be sent:', notification.target);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${notification.type} notification:`, error);
      }
    }
  }

  private sendBrowserNotification(result: AccessibilityResult, config: NotificationConfig): void {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const violations = result.evaluations.filter(e => e.status === 'fail');
      const critical = violations.filter(v => v.severity === 'critical');
      
      let title = 'Accessibility Scan Complete';
      let body = `Score: ${result.overallScore.toFixed(1)}%`;
      
      if (critical.length > 0) {
        title = '🚨 Critical Accessibility Issues Found';
        body = `${critical.length} critical issues require immediate attention`;
      } else if (violations.length > 0) {
        title = '⚠️ Accessibility Issues Detected';
        body = `${violations.length} issues found, score: ${result.overallScore.toFixed(1)}%`;
      } else {
        title = '✅ Accessibility Scan Passed';
        body = `All checks passed with ${result.overallScore.toFixed(1)}% score`;
      }
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: critical.length > 0
      });
    }
  }

  private async sendWebhookNotification(result: AccessibilityResult, config: NotificationConfig): Promise<void> {
    const payload = {
      timestamp: Date.now(),
      overallScore: result.overallScore,
      violations: result.evaluations.filter(e => e.status === 'fail').length,
      criticalIssues: result.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical').length,
      complianceLevel: this.determineComplianceLevel(
        result.overallScore,
        result.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical').length
      ),
      details: result.evaluations.filter(e => e.status === 'fail').slice(0, 5) // Top 5 issues
    };
    
    await fetch(config.target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async handleScanError(error: any): Promise<void> {
    console.error('Accessibility scan error:', error);
    
    if (this.monitor?.schedule?.retryPolicy) {
      await this.retryWithPolicy(error);
    }
    
    // Send error notifications
    if (this.monitor?.schedule?.notifications) {
      const errorNotifications = this.monitor.schedule.notifications.filter(n => 
        n.events.includes('error')
      );
      
      for (const notification of errorNotifications) {
        if (notification.type === 'browser') {
          new Notification('Accessibility Scan Error', {
            body: `Scan failed: ${error.message}`,
            icon: '/favicon.ico'
          });
        }
      }
    }
  }

  private async retryWithPolicy(error: any): Promise<void> {
    const policy = this.monitor?.schedule?.retryPolicy;
    if (!policy) return;
    
    for (let attempt = 1; attempt <= policy.maxRetries; attempt++) {
      const delay = this.calculateRetryDelay(attempt, policy);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await this.scanPage();
        this.updateProgress(result);
        return; // Success, exit retry loop
      } catch (retryError) {
        if (attempt === policy.maxRetries) {
          console.error(`All ${policy.maxRetries} retry attempts failed:`, retryError);
        }
      }
    }
  }

  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    switch (policy.backoffStrategy) {
      case 'exponential':
        return Math.min(policy.initialDelay * Math.pow(2, attempt - 1), policy.maxDelay || 60000);
      case 'linear':
        return Math.min(policy.initialDelay * attempt, policy.maxDelay || 60000);
      case 'fixed':
      default:
        return policy.initialDelay;
    }
  }

  // Store timeout references
  private pageChangeTimeout: NodeJS.Timeout | null = null;

  private updateProgress(result: AccessibilityResult): void {
    if (!this.monitor) return;

    const violations = result.evaluations.filter(e => e.status === 'fail');
    const criticalIssues = violations.filter(v => v.severity === 'critical').length;
    
    const previousTotal = this.monitor.progressTracking.totalIssues;
    const currentTotal = violations.length;
    
    this.monitor.progressTracking = {
      totalIssues: currentTotal,
      resolvedIssues: Math.max(0, previousTotal - currentTotal),
      newIssues: Math.max(0, currentTotal - previousTotal),
      criticalIssues,
      progressPercentage: result.overallScore,
      complianceLevel: this.determineComplianceLevel(result.overallScore, criticalIssues),
      lastUpdated: Date.now()
    };

    this.monitor.lastScanTime = Date.now();
  }

  private determineComplianceLevel(
    score: number, 
    criticalIssues: number
  ): 'A' | 'AA' | 'AAA' | 'non-compliant' {
    if (criticalIssues > 0) return 'non-compliant';
    if (score >= 95) return 'AAA';
    if (score >= 85) return 'AA';
    if (score >= 75) return 'A';
    return 'non-compliant';
  }

  // Get current monitoring status
  getMonitoringStatus(): AccessibilityMonitor | null {
    return this.monitor;
  }

  // Generate compliance report
  generateComplianceReport(results: AccessibilityResult[]): AccessibilityComplianceReport {
    const allEvaluations = results.flatMap(r => r.evaluations);
    const violations = allEvaluations.filter(e => e.status === 'fail');
    const passes = allEvaluations.filter(e => e.status === 'pass');
    
    const principleBreakdown = this.analyzePrincipleCompliance(allEvaluations);
    const severityBreakdown = this.analyzeSeverityDistribution(violations);
    const recommendations = this.generatePriorityRecommendations(violations);
    
    return {
      overview: {
        totalTests: allEvaluations.length,
        passed: passes.length,
        failed: violations.length,
        overallScore: allEvaluations.length > 0 ? (passes.length / allEvaluations.length) * 100 : 0,
        complianceLevel: this.determineComplianceLevel(
          allEvaluations.length > 0 ? (passes.length / allEvaluations.length) * 100 : 0,
          violations.filter(v => v.severity === 'critical').length
        )
      },
      principleBreakdown,
      severityBreakdown,
      recommendations,
      detailedFindings: violations,
      generatedAt: Date.now()
    };
  }

  private analyzePrincipleCompliance(evaluations: AccessibilityEvaluation[]): Record<string, any> {
    const principles = ['perceivable', 'operable', 'understandable', 'robust'];
    const breakdown: Record<string, any> = {};

    principles.forEach(principle => {
      const principleEvaluations = evaluations.filter(e => {
        const guideline = WCAG_GUIDELINES[e.guidelineId];
        return guideline?.principle === principle;
      });

      const passed = principleEvaluations.filter(e => e.status === 'pass').length;
      const total = principleEvaluations.length;

      breakdown[principle] = {
        total,
        passed,
        failed: total - passed,
        score: total > 0 ? (passed / total) * 100 : 0
      };
    });

    return breakdown;
  }

  private analyzeSeverityDistribution(violations: AccessibilityEvaluation[]): Record<string, number> {
    return {
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length
    };
  }

  private generatePriorityRecommendations(violations: AccessibilityEvaluation[]): string[] {
    const priorityMap = new Map<string, number>();
    
    violations.forEach(violation => {
      violation.recommendations.forEach(rec => {
        const currentPriority = priorityMap.get(rec) || 0;
        const severityWeight = this.getSeverityWeight(violation.severity);
        priorityMap.set(rec, currentPriority + severityWeight);
      });
    });

    return Array.from(priorityMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([rec]) => rec);
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }
}

// Compliance report interface
export interface AccessibilityComplianceReport {
  overview: {
    totalTests: number;
    passed: number;
    failed: number;
    overallScore: number;
    complianceLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
  };
  principleBreakdown: Record<string, any>;
  severityBreakdown: Record<string, number>;
  recommendations: string[];
  detailedFindings: AccessibilityEvaluation[];
  generatedAt: number;
}

// Export utilities and default scanner instance
export const defaultScanner = new AccessibilityScanner();

export const AccessibilityUtils = {
  scanner: defaultScanner,
  guidelines: WCAG_GUIDELINES,
  
  // Quick scan method for components
  async quickScan(element?: Element): Promise<AccessibilityResult> {
    const context = element || document;
    return defaultScanner.scanPage(context);
  },
  
  // Enhanced scan with custom configuration
  async enhancedScan(config?: Partial<AccessibilityScanConfig>, element?: Element): Promise<AccessibilityResult> {
    const fullConfig: AccessibilityScanConfig = { wcagLevel: 'AA', ...config };
    const scanner = new AccessibilityScanner(fullConfig);
    const context = element || document;
    return scanner.scanPage(context);
  },
  
  // Batch scan multiple elements
  async batchScan(elements: Element[], config?: Partial<AccessibilityScanConfig>): Promise<AccessibilityResult[]> {
    const results = [];
    for (const element of elements) {
      try {
        const result = await this.enhancedScan(config, element);
        results.push(result);
      } catch (error) {
        console.error('Failed to scan element:', element, error);
      }
    }
    return results;
  },
  
  // Live accessibility monitoring
  startLiveMonitoring(callback: (issues: AccessibilityEvaluation[]) => void, interval = 5000): () => void {
    const monitor = setInterval(async () => {
      try {
        const result = await this.quickScan();
        const issues = result.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical');
        callback(issues);
      } catch (error) {
        console.error('Live monitoring scan failed:', error);
      }
    }, interval);
    
    return () => clearInterval(monitor);
  },
  
  // Generate accessibility scorecard
  generateScorecard(results: AccessibilityResult[]): {
    overallScore: number;
    principleScores: Record<string, number>;
    severityBreakdown: Record<string, number>;
    trendAnalysis: { trend: 'improving' | 'declining' | 'stable'; percentage: number };
    recommendations: string[];
  } {
    if (results.length === 0) {
      return {
        overallScore: 0,
        principleScores: {},
        severityBreakdown: {},
        trendAnalysis: { trend: 'stable', percentage: 0 },
        recommendations: []
      };
    }
    
    const allEvaluations = results.flatMap(r => r.evaluations);
    const violations = allEvaluations.filter(e => e.status === 'fail');
    
    // Overall score
    const overallScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
    
    // Principle scores
    const principleScores: Record<string, number> = {};
    ['perceivable', 'operable', 'understandable', 'robust'].forEach(principle => {
      const principleEvaluations = allEvaluations.filter(e => {
        const guideline = WCAG_GUIDELINES[e.guidelineId];
        return guideline?.principle === principle;
      });
      const passed = principleEvaluations.filter(e => e.status === 'pass').length;
      principleScores[principle] = principleEvaluations.length > 0 ? (passed / principleEvaluations.length) * 100 : 0;
    });
    
    // Severity breakdown
    const severityBreakdown: Record<string, number> = {
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length
    };
    
    // Trend analysis
    let trendAnalysis: { trend: 'improving' | 'declining' | 'stable'; percentage: number };
    if (results.length < 2) {
      trendAnalysis = { trend: 'stable', percentage: 0 };
    } else {
      const recent = results[0].overallScore;
      const previous = results[results.length - 1].overallScore;
      const change = ((recent - previous) / previous) * 100;
      
      if (Math.abs(change) < 5) {
        trendAnalysis = { trend: 'stable', percentage: change };
      } else if (change > 0) {
        trendAnalysis = { trend: 'improving', percentage: change };
      } else {
        trendAnalysis = { trend: 'declining', percentage: Math.abs(change) };
      }
    }
    
    // Generate recommendations
    const recommendations = this.generatePriorityRecommendations(violations).slice(0, 5);
    
    return {
      overallScore,
      principleScores,
      severityBreakdown,
      trendAnalysis,
      recommendations
    };
  },
  
  // Generate priority recommendations
  generatePriorityRecommendations(violations: AccessibilityEvaluation[]): string[] {
    const recommendationMap = new Map<string, number>();
    
    violations.forEach(violation => {
      const weight = this.getSeverityWeight(violation.severity);
      violation.recommendations.forEach(rec => {
        const currentScore = recommendationMap.get(rec) || 0;
        recommendationMap.set(rec, currentScore + weight);
      });
    });
    
    return Array.from(recommendationMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([rec]) => rec);
  },
  
  // Utility method to get severity weight
  getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  },
  
  // Get guidelines by level
  getGuidelinesByLevel(level: 'A' | 'AA' | 'AAA'): AccessibilityGuideline[] {
    return Object.values(WCAG_GUIDELINES).filter(g => 
      g.level === level || 
      (level === 'AA' && g.level === 'A') || 
      (level === 'AAA' && (g.level === 'A' || g.level === 'AA'))
    );
  },
  
  // Get guidelines by principle
  getGuidelinesByPrinciple(principle: 'perceivable' | 'operable' | 'understandable' | 'robust'): AccessibilityGuideline[] {
    return Object.values(WCAG_GUIDELINES).filter(g => g.principle === principle);
  },
  
  // Validate accessibility results
  validateResults(results: AccessibilityResult[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (results.length === 0) {
      warnings.push('No accessibility results provided for validation');
    }
    
    results.forEach((result, index) => {
      if (!result.participantId) {
        errors.push(`Result ${index + 1}: Missing participant ID`);
      }
      
      if (!result.evaluations || result.evaluations.length === 0) {
        warnings.push(`Result ${index + 1}: No evaluations found`);
      }
      
      if (result.overallScore < 0 || result.overallScore > 100) {
        errors.push(`Result ${index + 1}: Invalid overall score ${result.overallScore}`);
      }
      
      result.evaluations?.forEach((evaluation, evalIndex) => {
        if (!['pass', 'fail', 'needs-review', 'not-applicable'].includes(evaluation.status)) {
          errors.push(`Result ${index + 1}, Evaluation ${evalIndex + 1}: Invalid status ${evaluation.status}`);
        }
        
        if (!['low', 'medium', 'high', 'critical'].includes(evaluation.severity)) {
          errors.push(`Result ${index + 1}, Evaluation ${evalIndex + 1}: Invalid severity ${evaluation.severity}`);
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },
  
  // Export accessibility data
  exportData(results: AccessibilityResult[], format: 'json' | 'csv' | 'xlsx' = 'json'): string | Blob {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
        
      case 'csv':
        const csvHeaders = ['Participant ID', 'Study ID', 'Overall Score', 'Guideline ID', 'Status', 'Severity', 'Findings', 'Recommendations'];
        const csvRows = [csvHeaders.join(',')];
        
        results.forEach(result => {
          result.evaluations.forEach(evaluation => {
            const row = [
              result.participantId,
              result.studyId.toString(),
              result.overallScore.toString(),
              evaluation.guidelineId,
              evaluation.status,
              evaluation.severity,
              `"${evaluation.findings.join('; ')}"`,
              `"${evaluation.recommendations.join('; ')}"`
            ];
            csvRows.push(row.join(','));
          });
        });
        
        return csvRows.join('\n');
        
      case 'xlsx':
        // For XLSX, return a structured object that can be processed by a spreadsheet library
        const worksheetData = results.flatMap(result => 
          result.evaluations.map(evaluation => ({
            'Participant ID': result.participantId,
            'Study ID': result.studyId,
            'Overall Score': result.overallScore,
            'Guideline ID': evaluation.guidelineId,
            'Status': evaluation.status,
            'Severity': evaluation.severity,
            'Findings': evaluation.findings.join('; '),
            'Recommendations': evaluation.recommendations.join('; ')
          }))
        );
        
        return JSON.stringify(worksheetData, null, 2);
        
      default:
        return JSON.stringify(results, null, 2);
    }
  }
};