import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Eye, EyeOff, Settings2, Filter, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { AccessibilityUtils, AccessibilityIssue } from '../../utils/accessibility';
import { AccessibilityResult, AccessibilityEvaluation } from '../../types';

interface AccessibilityIssueDetectorProps {
  targetElement?: Element | null;
  onIssueSelect?: (issue: AccessibilityIssue) => void;
  onIssueResolve?: (issueId: string) => void;
  autoDetect?: boolean;
  showOverlay?: boolean;
  filterBySeverity?: string[];
  filterByPrinciple?: string[];
}

interface DetectedIssue {
  id: string;
  element: Element;
  evaluation: AccessibilityEvaluation;
  position: { top: number; left: number; width: number; height: number };
  isVisible: boolean;
  isResolved: boolean;
}

const AccessibilityIssueDetector: React.FC<AccessibilityIssueDetectorProps> = ({
  targetElement,
  onIssueSelect,
  onIssueResolve,
  autoDetect = true,
  showOverlay = true,
  filterBySeverity = ['critical', 'high', 'medium', 'low'],
  filterByPrinciple = ['perceivable', 'operable', 'understandable', 'robust']
}) => {
  const [detectedIssues, setDetectedIssues] = useState<DetectedIssue[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showIssueOverlay, setShowIssueOverlay] = useState(showOverlay);
  const [selectedIssue, setSelectedIssue] = useState<DetectedIssue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string[]>(filterBySeverity);
  const [activePrincipleFilter, setActivePrincipleFilter] = useState<string[]>(filterByPrinciple);
  const [sortBy, setSortBy] = useState<'severity' | 'principle' | 'position'>('severity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoDetect) {
      startRealTimeDetection();
    }

    return () => {
      stopRealTimeDetection();
    };
  }, [autoDetect, targetElement]);

  useEffect(() => {
    // Update issue visibility when filters change
    updateIssueVisibility();
  }, [activeSeverityFilter, activePrincipleFilter, searchTerm]);

  const startRealTimeDetection = () => {
    if (detectionIntervalRef.current) return;

    const runDetection = async () => {
      if (!isDetecting) {
        await detectIssues();
      }
    };

    // Initial detection
    runDetection();

    // Set up periodic detection
    detectionIntervalRef.current = setInterval(runDetection, 5000); // Every 5 seconds
  };

  const stopRealTimeDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const detectIssues = async () => {
    setIsDetecting(true);
    try {
      const scanTarget = targetElement || document;
      const result = await AccessibilityUtils.quickScan(scanTarget as Element);
      
      const issues: DetectedIssue[] = [];
      
      // Process violations and map them to DOM elements
      result.evaluations
        .filter(evaluation => evaluation.status === 'fail')
        .forEach((evaluation) => {
          // Find elements associated with this evaluation
          const selector = evaluation.evidence?.codeSnippets?.[0];
          if (selector) {
            try {
              // Extract selector from HTML snippet or use a general approach
              const elements = findElementsByEvaluation(evaluation);
              
              elements.forEach((element, index) => {
                const position = getElementPosition(element);
                const issueId = `${evaluation.guidelineId}-${index}-${Date.now()}`;
                
                issues.push({
                  id: issueId,
                  element,
                  evaluation,
                  position,
                  isVisible: true,
                  isResolved: false
                });
              });
            } catch (error) {
              console.warn('Failed to locate element for accessibility issue:', error);
            }
          }
        });
      
      setDetectedIssues(prevIssues => {
        // Merge new issues with existing ones, avoiding duplicates
        const existingIds = new Set(prevIssues.map(issue => issue.id));
        const newIssues = issues.filter(issue => !existingIds.has(issue.id));
        return [...prevIssues, ...newIssues];
      });
      
    } catch (error) {
      console.error('Issue detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const findElementsByEvaluation = (evaluation: AccessibilityEvaluation): Element[] => {
    const elements: Element[] = [];
    
    // Try to find elements based on the evaluation type
    const guidelineId = evaluation.guidelineId;
    
    switch (guidelineId) {
      case 'image-alt':
        elements.push(...Array.from(document.querySelectorAll('img:not([alt])')));
        elements.push(...Array.from(document.querySelectorAll('img[alt=""]')));
        break;
      
      case 'color-contrast':
        // Find elements with potential contrast issues
        elements.push(...Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.color && style.backgroundColor;
        }));
        break;
      
      case 'label':
        elements.push(...Array.from(document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])')));
        elements.push(...Array.from(document.querySelectorAll('select:not([aria-label]):not([aria-labelledby])')));
        elements.push(...Array.from(document.querySelectorAll('textarea:not([aria-label]):not([aria-labelledby])')));
        break;
      
      case 'link-name':
        elements.push(...Array.from(document.querySelectorAll('a:not([aria-label]):not([title])')).filter(link => {
          return !link.textContent?.trim();
        }));
        break;
      
      case 'button-name':
        elements.push(...Array.from(document.querySelectorAll('button:not([aria-label]):not([title])')).filter(btn => {
          return !btn.textContent?.trim();
        }));
        break;
      
      case 'heading-order':
        elements.push(...Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')));
        break;
      
      default:
        // Generic approach - find elements mentioned in code snippets
        if (evaluation.evidence?.codeSnippets) {
          evaluation.evidence.codeSnippets.forEach(snippet => {
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(snippet, 'text/html');
              const parsedElement = doc.body.firstElementChild;
              
              if (parsedElement) {
                // Try to find similar elements in the actual DOM
                const tagName = parsedElement.tagName;
                const className = parsedElement.className;
                const id = parsedElement.id;
                
                let selector = tagName.toLowerCase();
                if (id) selector = `#${id}`;
                else if (className) selector = `${tagName.toLowerCase()}.${className.split(' ')[0]}`;
                
                const foundElements = document.querySelectorAll(selector);
                elements.push(...Array.from(foundElements));
              }
            } catch (error) {
              // Fallback: use evaluation findings to guess element types
              const findings = evaluation.findings.join(' ').toLowerCase();
              if (findings.includes('image')) {
                elements.push(...Array.from(document.querySelectorAll('img')));
              } else if (findings.includes('link')) {
                elements.push(...Array.from(document.querySelectorAll('a')));
              } else if (findings.includes('button')) {
                elements.push(...Array.from(document.querySelectorAll('button')));
              } else if (findings.includes('input') || findings.includes('form')) {
                elements.push(...Array.from(document.querySelectorAll('input, select, textarea')));
              }
            }
          });
        }
        break;
    }
    
    return elements;
  };

  const getElementPosition = (element: Element): { top: number; left: number; width: number; height: number } => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  };

  const updateIssueVisibility = () => {
    setDetectedIssues(prevIssues => 
      prevIssues.map(issue => ({
        ...issue,
        isVisible: isIssueVisible(issue)
      }))
    );
  };

  const isIssueVisible = (issue: DetectedIssue): boolean => {
    const principle = AccessibilityUtils.guidelines[issue.evaluation.guidelineId]?.principle || 'robust';
    
    // Check severity filter
    if (!activeSeverityFilter.includes(issue.evaluation.severity)) {
      return false;
    }
    
    // Check principle filter
    if (!activePrincipleFilter.includes(principle)) {
      return false;
    }
    
    // Check search term
    if (searchTerm && !matchesSearchTerm(issue, searchTerm)) {
      return false;
    }
    
    return !issue.isResolved;
  };

  const matchesSearchTerm = (issue: DetectedIssue, term: string): boolean => {
    const searchableText = [
      issue.evaluation.guidelineId,
      ...issue.evaluation.findings,
      ...issue.evaluation.recommendations
    ].join(' ').toLowerCase();
    
    return searchableText.includes(term.toLowerCase());
  };

  const getSortedIssues = (): DetectedIssue[] => {
    const visibleIssues = detectedIssues.filter(issue => issue.isVisible);
    
    return visibleIssues.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'severity':
          const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          comparison = severityOrder[b.evaluation.severity as keyof typeof severityOrder] - 
                      severityOrder[a.evaluation.severity as keyof typeof severityOrder];
          break;
        
        case 'principle':
          const aPrinciple = AccessibilityUtils.guidelines[a.evaluation.guidelineId]?.principle || 'robust';
          const bPrinciple = AccessibilityUtils.guidelines[b.evaluation.guidelineId]?.principle || 'robust';
          comparison = aPrinciple.localeCompare(bPrinciple);
          break;
        
        case 'position':
          comparison = a.position.top - b.position.top;
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  };

  const handleIssueClick = (issue: DetectedIssue) => {
    setSelectedIssue(issue);
    const element = issue.element as HTMLElement;
    
    // Scroll to the element
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Highlight the element temporarily
    const originalOutline = element.style.outline;
    element.style.outline = '3px solid #ef4444';
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 2000);
    
    onIssueSelect?.(issue.evaluation as any);
  };

  const handleResolveIssue = (issueId: string) => {
    setDetectedIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId ? { ...issue, isResolved: true, isVisible: false } : issue
      )
    );
    
    onIssueResolve?.(issueId);
    
    if (selectedIssue?.id === issueId) {
      setSelectedIssue(null);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500';
      case 'high': return 'border-orange-500 bg-orange-500';
      case 'medium': return 'border-yellow-500 bg-yellow-500';
      case 'low': return 'border-blue-500 bg-blue-500';
      default: return 'border-gray-500 bg-gray-500';
    }
  };

  const getSeverityTextColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const sortedIssues = getSortedIssues();

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Issue Detector</h2>
            <p className="text-sm text-gray-600">
              {sortedIssues.length} active issues • {detectedIssues.filter(i => i.isResolved).length} resolved
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIssueOverlay(!showIssueOverlay)}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showIssueOverlay 
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {showIssueOverlay ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              Overlay
            </button>
            
            <button
              onClick={detectIssues}
              disabled={isDetecting}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isDetecting && <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>}
              {isDetecting ? 'Detecting...' : 'Detect Issues'}
            </button>
          </div>
        </div>
        
        {/* Real-time Detection Status */}
        {autoDetect && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700 font-medium">Real-time detection active</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="severity">Sort by Severity</option>
              <option value="principle">Sort by Principle</option>
              <option value="position">Sort by Position</option>
            </select>
            
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <div className="flex gap-2">
              {['critical', 'high', 'medium', 'low'].map(severity => (
                <button
                  key={severity}
                  onClick={() => {
                    setActiveSeverityFilter(prev => 
                      prev.includes(severity) 
                        ? prev.filter(s => s !== severity)
                        : [...prev, severity]
                    );
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    activeSeverityFilter.includes(severity)
                      ? getSeverityTextColor(severity)
                      : 'text-gray-500 bg-gray-100 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WCAG Principle</label>
            <div className="flex gap-2">
              {['perceivable', 'operable', 'understandable', 'robust'].map(principle => (
                <button
                  key={principle}
                  onClick={() => {
                    setActivePrincipleFilter(prev => 
                      prev.includes(principle) 
                        ? prev.filter(p => p !== principle)
                        : [...prev, principle]
                    );
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    activePrincipleFilter.includes(principle)
                      ? 'text-blue-700 bg-blue-50 border-blue-200'
                      : 'text-gray-500 bg-gray-100 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {principle}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedIssues.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
            <p className="text-gray-600">
              {detectedIssues.length === 0 
                ? 'Run detection to scan for accessibility issues' 
                : 'All issues are resolved or filtered out'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedIssue?.id === issue.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleIssueClick(issue)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(issue.evaluation.severity)}`}></div>
                      <span className="font-medium text-gray-900">
                        {issue.evaluation.guidelineId}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityTextColor(issue.evaluation.severity)}`}>
                        {issue.evaluation.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {issue.evaluation.findings[0]}
                    </p>
                    
                    {issue.evaluation.recommendations.length > 0 && (
                      <p className="text-xs text-gray-600">
                        <strong>Fix:</strong> {issue.evaluation.recommendations[0]}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolveIssue(issue.id);
                    }}
                    className="ml-4 px-3 py-1 text-xs border border-green-300 text-green-700 bg-green-50 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Overlay */}
      {showIssueOverlay && (
        <div
          ref={overlayRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ zIndex: 9999 }}
        >
          {sortedIssues.map((issue) => (
            <div
              key={`overlay-${issue.id}`}
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 hover:scale-110 ${getSeverityColor(issue.evaluation.severity)} opacity-70 hover:opacity-90`}
              style={{
                top: issue.position.top,
                left: issue.position.left,
                width: Math.max(issue.position.width, 20),
                height: Math.max(issue.position.height, 20),
                minWidth: '20px',
                minHeight: '20px'
              }}
              onClick={() => handleIssueClick(issue)}
              title={`${issue.evaluation.guidelineId} - ${issue.evaluation.severity}`}
            >
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-current">
                <AlertCircle className="w-2 h-2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessibilityIssueDetector;