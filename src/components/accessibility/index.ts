// Accessibility components exports
export { default as AccessibilityDashboard } from './AccessibilityDashboard';
export { default as AccessibilityScanner } from './AccessibilityScanner';
export { default as AccessibilityIssueDetector } from './AccessibilityIssueDetector';
export { default as AccessibilityReporting } from './AccessibilityReporting';
export { default as AccessibilityConfiguration } from './AccessibilityConfiguration';
export { default as AccessibilityAuditCreator } from './AccessibilityAuditCreator';
export { default as AccessibilityPreferences, useAccessibilityPreferences, defaultPreferences } from './AccessibilityPreferences';
export type { AccessibilityPreferences as AccessibilityPreferencesType } from './AccessibilityPreferences';

// Re-export accessibility utilities for convenience
export { 
  AccessibilityScanner as AccessibilityScannerClass,
  AccessibilityUtils,
  defaultScanner,
  WCAG_GUIDELINES
} from '../../utils/accessibility';

// Types related to accessibility
export type {
  AccessibilityScanConfig,
  AccessibilityIssue,
  AccessibilityMonitor,
  AccessibilityProgress,
  AccessibilityComplianceReport
} from '../../utils/accessibility';