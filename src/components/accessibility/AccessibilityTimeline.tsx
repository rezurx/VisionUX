import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, Clock, CheckCircle2, AlertTriangle, BarChart3, Filter } from 'lucide-react';
import * as d3 from 'd3';
import { AccessibilityResult, AccessibilityEvaluation } from '../../types';
import { AccessibilityComplianceReport } from '../../utils/accessibility';

interface AccessibilityTimelineProps {
  accessibilityResults: AccessibilityResult[];
  complianceReports?: AccessibilityComplianceReport[];
  timeRange?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  showGoals?: boolean;
  goals?: AccessibilityGoal[];
  onGoalUpdate?: (goals: AccessibilityGoal[]) => void;
  width?: number;
  height?: number;
}

interface AccessibilityGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  targetScore: number;
  currentScore: number;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'overall' | 'principle' | 'severity' | 'custom';
  milestones: AccessibilityMilestone[];
}

interface AccessibilityMilestone {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  completedDate?: Date;
  description: string;
  linkedIssues?: string[];
}

interface TimelineDataPoint {
  date: Date;
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  passedTests: number;
  complianceLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
  principleScores: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
}

interface ProgressMetrics {
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  averageScore: number;
  scoreImprovement: number;
  issueReduction: number;
  completionVelocity: number; // issues resolved per day
  projectedComplianceDate: Date | null;
}

const AccessibilityTimeline: React.FC<AccessibilityTimelineProps> = ({
  accessibilityResults,
  complianceReports = [],
  timeRange = 'month',
  showGoals = true,
  goals: initialGoals = [],
  onGoalUpdate,
  width = 1000,
  height = 400
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'score' | 'issues' | 'principles'>('score');
  const [goals, setGoals] = useState<AccessibilityGoal[]>(initialGoals);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [hoveredPoint, setHoveredPoint] = useState<TimelineDataPoint | null>(null);

  // Process accessibility results into timeline data
  const timelineData = useMemo((): TimelineDataPoint[] => {
    if (!accessibilityResults.length) return [];

    // Sort results by completion time (assuming this represents the scan time)
    const sortedResults = [...accessibilityResults].sort((a, b) => 
      (a.completionTime || 0) - (b.completionTime || 0)
    );

    return sortedResults.map((result, index) => {
      const totalIssues = result.evaluations.filter(e => e.status === 'fail').length;
      const criticalIssues = result.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical').length;
      const highIssues = result.evaluations.filter(e => e.status === 'fail' && e.severity === 'high').length;
      const mediumIssues = result.evaluations.filter(e => e.status === 'fail' && e.severity === 'medium').length;
      const lowIssues = result.evaluations.filter(e => e.status === 'fail' && e.severity === 'low').length;
      const passedTests = result.evaluations.filter(e => e.status === 'pass').length;

      // Calculate principle-specific scores
      const principleScores = calculatePrincipleScores(result.evaluations);

      // Determine compliance level
      const complianceLevel = getComplianceLevel(result.overallScore, criticalIssues);

      return {
        date: new Date(Date.now() - (sortedResults.length - index - 1) * 24 * 60 * 60 * 1000), // Mock dates
        overallScore: result.overallScore,
        totalIssues,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
        passedTests,
        complianceLevel,
        principleScores
      };
    });
  }, [accessibilityResults]);

  // Calculate progress metrics
  const progressMetrics = useMemo((): ProgressMetrics => {
    if (timelineData.length < 2) {
      return {
        trend: 'stable',
        trendPercentage: 0,
        averageScore: timelineData[0]?.overallScore || 0,
        scoreImprovement: 0,
        issueReduction: 0,
        completionVelocity: 0,
        projectedComplianceDate: null
      };
    }

    const firstPoint = timelineData[0];
    const lastPoint = timelineData[timelineData.length - 1];
    const daysDiff = Math.max(1, (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24));

    const scoreImprovement = lastPoint.overallScore - firstPoint.overallScore;
    const issueReduction = firstPoint.totalIssues - lastPoint.totalIssues;
    const completionVelocity = issueReduction / daysDiff;

    const trend: 'improving' | 'declining' | 'stable' = 
      scoreImprovement > 5 ? 'improving' :
      scoreImprovement < -5 ? 'declining' : 'stable';

    const trendPercentage = Math.abs(scoreImprovement);
    const averageScore = timelineData.reduce((sum, point) => sum + point.overallScore, 0) / timelineData.length;

    // Project compliance date based on current velocity
    let projectedComplianceDate: Date | null = null;
    if (completionVelocity > 0 && lastPoint.totalIssues > 0) {
      const daysToZeroIssues = lastPoint.totalIssues / completionVelocity;
      projectedComplianceDate = new Date(lastPoint.date.getTime() + daysToZeroIssues * 24 * 60 * 60 * 1000);
    }

    return {
      trend,
      trendPercentage,
      averageScore,
      scoreImprovement,
      issueReduction,
      completionVelocity,
      projectedComplianceDate
    };
  }, [timelineData]);

  const calculatePrincipleScores = (evaluations: AccessibilityEvaluation[]) => {
    const principles = ['perceivable', 'operable', 'understandable', 'robust'];
    const scores: any = {};

    principles.forEach(principle => {
      const principleEvaluations = evaluations.filter(e => {
        // This would need actual mapping from guideline ID to principle
        return true; // Simplified for now
      });

      const passed = principleEvaluations.filter(e => e.status === 'pass').length;
      const total = principleEvaluations.length;
      scores[principle] = total > 0 ? (passed / total) * 100 : 0;
    });

    return scores;
  };

  const getComplianceLevel = (score: number, criticalIssues: number): 'A' | 'AA' | 'AAA' | 'non-compliant' => {
    if (criticalIssues > 0) return 'non-compliant';
    if (score >= 95) return 'AAA';
    if (score >= 85) return 'AA';
    if (score >= 75) return 'A';
    return 'non-compliant';
  };

  const updateGoals = (newGoals: AccessibilityGoal[]) => {
    setGoals(newGoals);
    onGoalUpdate?.(newGoals);
  };

  const addGoal = (goal: Omit<AccessibilityGoal, 'id' | 'currentScore'>) => {
    const newGoal: AccessibilityGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      currentScore: timelineData[timelineData.length - 1]?.overallScore || 0,
      status: 'on-track'
    };
    updateGoals([...goals, newGoal]);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'on-track': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'at-risk': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'behind': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderTimelineChart = () => {
    if (!timelineData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No timeline data available</p>
            <p className="text-sm">Complete accessibility scans to see progress over time</p>
          </div>
        </div>
      );
    }

    // This would contain the actual D3.js timeline rendering logic
    return (
      <div className="relative">
        <svg width={width} height={height} className="border rounded">
          {/* Simplified timeline visualization */}
          <g transform={`translate(60, 20)`}>
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={height - 60} stroke="#374151" strokeWidth={2} />
            
            {/* X-axis */}
            <line x1={0} y1={height - 60} x2={width - 120} y2={height - 60} stroke="#374151" strokeWidth={2} />
            
            {/* Data points */}
            {timelineData.map((point, index) => {
              const x = (index / (timelineData.length - 1)) * (width - 180);
              const y = ((100 - point.overallScore) / 100) * (height - 80);
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={6}
                    fill={point.overallScore >= 90 ? '#10b981' : point.overallScore >= 75 ? '#f59e0b' : '#ef4444'}
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {index < timelineData.length - 1 && (
                    <line
                      x1={x}
                      y1={y}
                      x2={(index + 1) / (timelineData.length - 1) * (width - 180)}
                      y2={((100 - timelineData[index + 1].overallScore) / 100) * (height - 80)}
                      stroke="#6b7280"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}
          </g>
          
          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(value => (
            <text key={value} x={45} y={((100 - value) / 100) * (height - 80) + 25} textAnchor="end" fontSize="12" fill="#6b7280">
              {value}%
            </text>
          ))}
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute bg-black bg-opacity-90 text-white p-3 rounded shadow-lg pointer-events-none z-10"
               style={{ top: '20px', left: '20px' }}>
            <div className="text-sm">
              <div className="font-medium">Score: {hoveredPoint.overallScore.toFixed(1)}%</div>
              <div>Issues: {hoveredPoint.totalIssues}</div>
              <div>Critical: {hoveredPoint.criticalIssues}</div>
              <div>Compliance: {hoveredPoint.complianceLevel.toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Accessibility Timeline & Progress</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track accessibility improvements and goal progress over time
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
            
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Overall Score</option>
              <option value="issues">Issue Count</option>
              <option value="principles">WCAG Principles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="border-b p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`flex items-center justify-center gap-1 ${getTrendColor(progressMetrics.trend)}`}>
              {progressMetrics.trend === 'improving' && <TrendingUp className="w-5 h-5" />}
              {progressMetrics.trend === 'declining' && <TrendingDown className="w-5 h-5" />}
              {progressMetrics.trend === 'stable' && <BarChart3 className="w-5 h-5" />}
              <span className="text-lg font-bold">
                {progressMetrics.trendPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-600 capitalize">{progressMetrics.trend} Trend</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {progressMetrics.averageScore.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Average Score</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {progressMetrics.issueReduction > 0 ? '+' : ''}{progressMetrics.issueReduction}
            </div>
            <div className="text-xs text-gray-600">Issues Resolved</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {progressMetrics.completionVelocity.toFixed(1)}/day
            </div>
            <div className="text-xs text-gray-600">Resolution Rate</div>
          </div>
        </div>
        
        {progressMetrics.projectedComplianceDate && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Projected Full Compliance: {progressMetrics.projectedComplianceDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Chart */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Progress Timeline</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Excellent (90%+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Good (75-89%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Needs Work (&lt;75%)</span>
            </div>
          </div>
        </div>
        
        {renderTimelineChart()}
      </div>

      {/* Goals Section */}
      {showGoals && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Accessibility Goals</h3>
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Target className="w-4 h-4 mr-1" />
              Add Goal
            </button>
          </div>
          
          {goals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No accessibility goals set</p>
              <p className="text-sm">Set goals to track your accessibility improvement progress</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(goal => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getGoalStatusColor(goal.status)}`}>
                      {goal.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{goal.currentScore.toFixed(1)}% / {goal.targetScore}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (goal.currentScore / goal.targetScore) * 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {goal.targetDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccessibilityTimeline;