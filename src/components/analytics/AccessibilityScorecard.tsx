import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AccessibilityResult, AccessibilityGuideline, AnalyticsMetadata } from '../../types';
import { PerformanceOptimizer } from '../../analytics';
import { AccessibilityUtils, AccessibilityComplianceReport } from '../../utils/accessibility';

interface AccessibilityScorecardProps {
  accessibilityResults: AccessibilityResult[];
  guidelines: AccessibilityGuideline[];
  width?: number;
  height?: number;
  showTrends?: boolean;
  enableLiveScanning?: boolean;
  onScanTriggered?: () => void;
  complianceReport?: AccessibilityComplianceReport | null;
  scanHistory?: AccessibilityResult[];
}

const AccessibilityScorecard: React.FC<AccessibilityScorecardProps> = ({
  accessibilityResults,
  guidelines,
  width = 1000,
  height = 700,
  showTrends: _showTrends = false,
  enableLiveScanning = false,
  onScanTriggered,
  complianceReport,
  scanHistory = []
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPrinciple, setSelectedPrinciple] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [liveScanResults, setLiveScanResults] = useState<AccessibilityResult | null>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const resultsToUse = liveScanResults ? [liveScanResults, ...accessibilityResults] : accessibilityResults;
    const guidelinesToUse = guidelines.length > 0 ? guidelines : Object.values(AccessibilityUtils.guidelines);
    
    if (resultsToUse.length === 0) {
      renderEmptyState();
      return;
    }
    
    const startTime = performance.now();
    const shouldOptimize = PerformanceOptimizer.shouldOptimize(resultsToUse.length * guidelinesToUse.length);
    
    renderAccessibilityVisualization(resultsToUse, guidelinesToUse);
    
    const endTime = performance.now();
    setMetadata({
      datasetSize: resultsToUse.length,
      processingTime: endTime - startTime,
      optimizationLevel: shouldOptimize ? 'advanced' : 'basic',
      cacheStatus: liveScanResults ? 'miss' : 'hit',
      visualizationComplexity: 'high'
    });
  }, [accessibilityResults, guidelines, selectedPrinciple, width, height, liveScanResults]);

  // Handle live scanning
  const handleLiveScan = async () => {
    if (isLiveScanning) return;
    
    setIsLiveScanning(true);
    try {
      const result = await AccessibilityUtils.quickScan();
      setLiveScanResults(result);
      onScanTriggered?.();
    } catch (error) {
      console.error('Live scan failed:', error);
    } finally {
      setIsLiveScanning(false);
    }
  };

  const renderEmptyState = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Empty state illustration
    g.append('circle')
      .attr('r', 60)
      .style('fill', '#f3f4f6')
      .style('stroke', '#d1d5db')
      .style('stroke-width', 2);
    
    g.append('text')
      .attr('y', -10)
      .style('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('fill', '#9ca3af')
      .text('📊');
    
    g.append('text')
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text('No Accessibility Data');
    
    g.append('text')
      .attr('y', 50)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#6b7280')
      .text('Run accessibility scans to see compliance metrics');
      
    if (enableLiveScanning) {
      const button = g.append('g')
        .attr('class', 'scan-button')
        .style('cursor', 'pointer')
        .attr('transform', 'translate(0, 80)');
      
      button.append('rect')
        .attr('x', -60)
        .attr('y', -15)
        .attr('width', 120)
        .attr('height', 30)
        .attr('rx', 15)
        .style('fill', '#3b82f6')
        .style('stroke', 'none');
      
      button.append('text')
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text('Start Scan');
      
      button.on('click', handleLiveScan);
    }
  };

  const renderAccessibilityVisualization = (results: AccessibilityResult[], guidelinesList: AccessibilityGuideline[]) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 80, right: 150, bottom: 100, left: 150 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Calculate compliance metrics
    const complianceData = calculateComplianceMetrics(results, guidelinesList);

    if (selectedPrinciple) {
      renderPrincipleDetail(g, complianceData, chartWidth, chartHeight, results, guidelinesList);
    } else {
      renderOverallScorecard(g, complianceData, chartWidth, chartHeight, results);
    }

    // Add title with live scan indicator
    const titleGroup = svg.append('g');
    
    titleGroup.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(selectedPrinciple ? `${selectedPrinciple} Principle Analysis` : 'Accessibility Compliance Scorecard');

    // Add subtitle with scan info
    const subtitleText = liveScanResults 
      ? `Live scan • ${results.length} total evaluations • WCAG 2.1 Guidelines`
      : `Based on ${results.length} evaluations • WCAG 2.1 Guidelines`;
    
    titleGroup.append('text')
      .attr('x', width / 2)
      .attr('y', 55)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text(subtitleText);
    
    // Add live scan button if enabled
    if (enableLiveScanning && !selectedPrinciple) {
      const buttonGroup = titleGroup.append('g')
        .attr('class', 'live-scan-button')
        .style('cursor', 'pointer')
        .attr('transform', `translate(${width - 100}, 40)`);
      
      buttonGroup.append('rect')
        .attr('width', 80)
        .attr('height', 24)
        .attr('rx', 12)
        .style('fill', isLiveScanning ? '#f59e0b' : '#3b82f6')
        .style('opacity', 0.9);
      
      buttonGroup.append('text')
        .attr('x', 40)
        .attr('y', 12)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text(isLiveScanning ? 'Scanning...' : 'Live Scan');
      
      if (!isLiveScanning) {
        buttonGroup.on('click', handleLiveScan);
      }
    }
  };

  const calculateComplianceMetrics = (results: AccessibilityResult[], guidelinesList: AccessibilityGuideline[]) => {
    const principles = ['perceivable', 'operable', 'understandable', 'robust'];
    const levels = ['A', 'AA', 'AAA'];
    
    const principleData = principles.map(principle => {
      const principleGuidelines = guidelinesList.filter(g => g.principle === principle);
      
      const levelData = levels.map(level => {
        const levelGuidelines = principleGuidelines.filter(g => g.level === level);
        
        let totalEvaluations = 0;
        let passedEvaluations = 0;
        let criticalIssues = 0;
        let highIssues = 0;
        let mediumIssues = 0;
        let lowIssues = 0;

        results.forEach(result => {
          result.evaluations.forEach(evaluation => {
            const guideline = levelGuidelines.find(g => g.id === evaluation.guidelineId);
            if (guideline) {
              totalEvaluations++;
              if (evaluation.status === 'pass') {
                passedEvaluations++;
              }
              
              switch (evaluation.severity) {
                case 'critical':
                  criticalIssues++;
                  break;
                case 'high':
                  highIssues++;
                  break;
                case 'medium':
                  mediumIssues++;
                  break;
                case 'low':
                  lowIssues++;
                  break;
              }
            }
          });
        });

        const complianceRate = totalEvaluations > 0 ? (passedEvaluations / totalEvaluations) * 100 : 0;

        return {
          level,
          complianceRate,
          totalEvaluations,
          passedEvaluations,
          issues: { critical: criticalIssues, high: highIssues, medium: mediumIssues, low: lowIssues },
          guidelines: levelGuidelines.length
        };
      });

      const overallCompliance = levelData.reduce((sum, level) => 
        sum + (level.complianceRate * level.totalEvaluations), 0
      ) / levelData.reduce((sum, level) => sum + level.totalEvaluations, 0) || 0;

      return {
        principle,
        overallCompliance,
        levels: levelData,
        totalIssues: levelData.reduce((sum, level) => 
          sum + Object.values(level.issues).reduce((a, b) => a + b, 0), 0
        )
      };
    });

    return principleData;
  };

  const renderOverallScorecard = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    complianceData: any[],
    chartWidth: number,
    chartHeight: number,
    results: AccessibilityResult[]
  ) => {
    const cardWidth = chartWidth / 2 - 20;
    const cardHeight = chartHeight / 2 - 20;

    // Create principle cards
    complianceData.forEach((principle, index) => {
      const x = (index % 2) * (cardWidth + 40);
      const y = Math.floor(index / 2) * (cardHeight + 40);

      const card = g.append('g')
        .attr('class', 'principle-card')
        .attr('transform', `translate(${x}, ${y})`)
        .style('cursor', 'pointer');

      // Card background
      const bgColor = getComplianceColor(principle.overallCompliance);
      card.append('rect')
        .attr('width', cardWidth)
        .attr('height', cardHeight)
        .attr('rx', 8)
        .style('fill', bgColor)
        .style('opacity', 0.1)
        .style('stroke', bgColor)
        .style('stroke-width', 2);

      // Principle title
      card.append('text')
        .attr('x', cardWidth / 2)
        .attr('y', 30)
        .style('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .style('text-transform', 'capitalize')
        .text(principle.principle);

      // Overall compliance score
      const scoreGroup = card.append('g')
        .attr('transform', `translate(${cardWidth / 2}, ${cardHeight / 2 - 20})`);

      // Circular progress indicator
      const radius = 50;
      const circumference = 2 * Math.PI * radius;
      const progress = (principle.overallCompliance / 100) * circumference;

      scoreGroup.append('circle')
        .attr('r', radius)
        .style('fill', 'none')
        .style('stroke', '#e5e7eb')
        .style('stroke-width', 8);

      scoreGroup.append('circle')
        .attr('r', radius)
        .style('fill', 'none')
        .style('stroke', bgColor)
        .style('stroke-width', 8)
        .style('stroke-linecap', 'round')
        .style('stroke-dasharray', circumference)
        .style('stroke-dashoffset', circumference)
        .style('transform', 'rotate(-90deg)')
        .style('transform-origin', 'center')
        .transition()
        .duration(2000)
        .style('stroke-dashoffset', circumference - progress);

      // Score text
      scoreGroup.append('text')
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .style('fill', bgColor)
        .text(`${principle.overallCompliance.toFixed(1)}%`);

      // Level breakdown
      const levelY = cardHeight - 80;
      principle.levels.forEach((level: any, levelIndex: number) => {
        const levelX = 20 + levelIndex * ((cardWidth - 40) / 3);
        
        card.append('rect')
          .attr('x', levelX)
          .attr('y', levelY)
          .attr('width', (cardWidth - 60) / 3)
          .attr('height', 30)
          .attr('rx', 4)
          .style('fill', getComplianceColor(level.complianceRate))
          .style('opacity', 0.2);

        card.append('text')
          .attr('x', levelX + ((cardWidth - 60) / 6))
          .attr('y', levelY + 15)
          .attr('dy', '0.35em')
          .style('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${level.level}: ${level.complianceRate.toFixed(0)}%`);
      });

      // Issues count
      card.append('text')
        .attr('x', cardWidth / 2)
        .attr('y', cardHeight - 20)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text(`${principle.totalIssues} issues identified`);

      // Add click interaction
      card.on('click', () => {
        setSelectedPrinciple(principle.principle);
      });

      card.on('mouseover', function() {
        d3.select(this).select('rect')
          .style('opacity', 0.2)
          .style('stroke-width', 3);
      });

      card.on('mouseout', function() {
        d3.select(this).select('rect')
          .style('opacity', 0.1)
          .style('stroke-width', 2);
      });
    });

    // Overall summary with enhanced metrics
    const overallCompliance = complianceData.reduce((sum, p) => sum + p.overallCompliance, 0) / complianceData.length;
    const totalIssues = complianceData.reduce((sum, p) => sum + p.totalIssues, 0);
    const criticalIssues = results.reduce((sum, result) => 
      sum + result.evaluations.filter(e => e.status === 'fail' && e.severity === 'critical').length, 0
    );
    const completionTime = results.reduce((sum, result) => sum + result.completionTime, 0) / results.length;

    const summaryY = chartHeight - 40;
    const summaryGroup = g.append('g')
      .attr('transform', `translate(0, ${summaryY})`);
    
    // Main summary
    summaryGroup.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 0)
      .style('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', getComplianceColor(overallCompliance))
      .text(`Overall Compliance: ${overallCompliance.toFixed(1)}%`);
    
    // Additional metrics
    const metricsY = 20;
    const metricsData = [
      { label: 'Total Issues', value: totalIssues, color: '#ef4444' },
      { label: 'Critical Issues', value: criticalIssues, color: '#dc2626' },
      { label: 'Avg Scan Time', value: `${completionTime.toFixed(0)}ms`, color: '#6b7280' },
      { label: 'Scans Completed', value: results.length, color: '#059669' }
    ];
    
    const metricWidth = chartWidth / metricsData.length;
    metricsData.forEach((metric, index) => {
      const metricGroup = summaryGroup.append('g')
        .attr('transform', `translate(${index * metricWidth + metricWidth / 2}, ${metricsY})`);
      
      metricGroup.append('text')
        .attr('y', 0)
        .style('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', metric.color)
        .text(metric.value);
      
      metricGroup.append('text')
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#6b7280')
        .text(metric.label);
    });
  };

  const renderPrincipleDetail = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    complianceData: any[],
    chartWidth: number,
    chartHeight: number,
    results: AccessibilityResult[],
    guidelinesList: AccessibilityGuideline[]
  ) => {
    const principleData = complianceData.find(p => p.principle === selectedPrinciple);
    if (!principleData) return;

    // Create detailed heatmap for guidelines
    const principleGuidelines = guidelinesList.filter(g => g.principle === selectedPrinciple);
    const levels = ['A', 'AA', 'AAA'];

    // Create heatmap matrix
    const cellWidth = Math.min((chartWidth - 100) / principleGuidelines.length, 80);
    const cellHeight = 30;

    // Guidelines on x-axis, levels/severity on y-axis
    const matrixData: any[] = [];
    principleGuidelines.forEach((guideline, gIndex) => {
      levels.forEach((level, lIndex) => {
        if (guideline.level === level) {
          // Calculate metrics for this guideline
          let totalEvaluations = 0;
          let passedEvaluations = 0;
          const issueCounts = { critical: 0, high: 0, medium: 0, low: 0 };

          results.forEach(result => {
            result.evaluations.forEach(evaluation => {
              if (evaluation.guidelineId === guideline.id) {
                totalEvaluations++;
                if (evaluation.status === 'pass') {
                  passedEvaluations++;
                }
                issueCounts[evaluation.severity]++;
              }
            });
          });

          const complianceRate = totalEvaluations > 0 ? (passedEvaluations / totalEvaluations) * 100 : 0;

          matrixData.push({
            guideline,
            level,
            gIndex,
            lIndex,
            complianceRate,
            totalEvaluations,
            passedEvaluations,
            issueCounts,
            totalIssues: Object.values(issueCounts).reduce((a, b) => a + b, 0)
          });
        }
      });
    });

    // Create heatmap
    const heatmapY = 50;
    matrixData.forEach(cell => {
      const x = cell.gIndex * cellWidth;
      const y = heatmapY + cell.lIndex * cellHeight;

      const cellGroup = g.append('g')
        .attr('transform', `translate(${x}, ${y})`);

      cellGroup.append('rect')
        .attr('width', cellWidth - 2)
        .attr('height', cellHeight - 2)
        .style('fill', getComplianceColor(cell.complianceRate))
        .style('opacity', 0.8)
        .style('stroke', '#fff')
        .style('stroke-width', 1);

      cellGroup.append('text')
        .attr('x', cellWidth / 2)
        .attr('y', cellHeight / 2)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', cell.complianceRate > 50 ? '#fff' : '#000')
        .text(`${cell.complianceRate.toFixed(0)}%`);

      // Add interaction
      cellGroup.on('mouseover', function(event) {
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'accessibility-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '12px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('max-width', '300px');

        tooltip.html(`
          <strong>${cell.guideline.title}</strong><br/>
          Level: ${cell.level}<br/>
          Compliance: ${cell.complianceRate.toFixed(1)}%<br/>
          Passed: ${cell.passedEvaluations}/${cell.totalEvaluations}<br/>
          Issues: Critical(${cell.issueCounts.critical}) High(${cell.issueCounts.high}) Medium(${cell.issueCounts.medium}) Low(${cell.issueCounts.low})<br/>
          <em>${cell.guideline.description}</em>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      });

      cellGroup.on('mouseout', function() {
        d3.select('.accessibility-tooltip').remove();
      });
    });

    // Add labels
    // Guideline labels (x-axis)
    principleGuidelines.forEach((guideline, index) => {
      g.append('text')
        .attr('x', index * cellWidth + cellWidth / 2)
        .attr('y', heatmapY + levels.length * cellHeight + 20)
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('transform', `rotate(45deg)`)
        .style('transform-origin', `${index * cellWidth + cellWidth / 2}px ${heatmapY + levels.length * cellHeight + 20}px`)
        .text(guideline.title.substring(0, 20) + (guideline.title.length > 20 ? '...' : ''));
    });

    // Level labels (y-axis)
    levels.forEach((level, index) => {
      g.append('text')
        .attr('x', -10)
        .attr('y', heatmapY + index * cellHeight + cellHeight / 2)
        .attr('dy', '0.35em')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(`Level ${level}`);
    });

    // Add legend
    const legendY = heatmapY + levels.length * cellHeight + 80;
    const legendData = [
      { range: '90-100%', color: getComplianceColor(95), label: 'Excellent' },
      { range: '70-89%', color: getComplianceColor(80), label: 'Good' },
      { range: '50-69%', color: getComplianceColor(60), label: 'Fair' },
      { range: '0-49%', color: getComplianceColor(25), label: 'Poor' }
    ];

    legendData.forEach((item, index) => {
      const legendX = index * (chartWidth / 4);
      
      g.append('rect')
        .attr('x', legendX)
        .attr('y', legendY)
        .attr('width', 20)
        .attr('height', 20)
        .style('fill', item.color);

      g.append('text')
        .attr('x', legendX + 25)
        .attr('y', legendY + 10)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .text(`${item.label} (${item.range})`);
    });

    // Back button
    const backButton = g.append('g')
      .attr('class', 'back-button')
      .style('cursor', 'pointer');

    backButton.append('rect')
      .attr('x', 0)
      .attr('y', -40)
      .attr('width', 100)
      .attr('height', 30)
      .attr('rx', 4)
      .style('fill', '#3b82f6')
      .style('opacity', 0.1);

    backButton.append('text')
      .attr('x', 50)
      .attr('y', -25)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text('← Overview');

    backButton.on('click', () => {
      setSelectedPrinciple(null);
    });
  };

  const getComplianceColor = (percentage: number): string => {
    if (percentage >= 90) return '#10b981'; // Green
    if (percentage >= 70) return '#f59e0b'; // Yellow
    if (percentage >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  // Enhanced empty state with live scanning option
  if (accessibilityResults.length === 0 && !liveScanResults) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 font-medium">No accessibility evaluation data available</p>
          <p className="text-sm text-gray-400 mb-4">Complete accessibility audits to see compliance metrics</p>
          
          {enableLiveScanning && (
            <button
              onClick={handleLiveScan}
              disabled={isLiveScanning}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLiveScanning ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Scanning Current Page...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan Current Page
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Enhanced Header */}
      {(liveScanResults || enableLiveScanning) && (
        <div className="border-b p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${liveScanResults ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-900">
                  {liveScanResults ? 'Live Data Active' : 'Live Scanning Available'}
                </span>
              </div>
              
              {liveScanResults && (
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Score: {liveScanResults.overallScore.toFixed(1)}% • 
                  Issues: {liveScanResults.evaluations.filter(e => e.status === 'fail').length}
                </div>
              )}
            </div>
            
            {enableLiveScanning && (
              <button
                onClick={handleLiveScan}
                disabled={isLiveScanning}
                className="inline-flex items-center px-3 py-1 text-xs border border-blue-300 text-blue-700 bg-white rounded hover:bg-blue-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLiveScanning ? (
                  <>
                    <div className="animate-spin w-3 h-3 mr-1 border border-blue-600 border-t-transparent rounded-full"></div>
                    Scanning
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Progress indicator for scan history */}
          {scanHistory.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <span>Scan History ({scanHistory.length} scans)</span>
              </div>
              <div className="flex gap-1">
                {scanHistory.slice(0, 10).map((scan, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      scan.overallScore >= 90 
                        ? 'bg-green-400' 
                        : scan.overallScore >= 75 
                        ? 'bg-yellow-400' 
                        : 'bg-red-400'
                    }`}
                    title={`Scan ${index + 1}: ${scan.overallScore.toFixed(1)}%`}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        />
      
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <p><strong>Evaluations:</strong> {(liveScanResults ? 1 : 0) + accessibilityResults.length} completed</p>
              <p><strong>Guidelines:</strong> {guidelines.length > 0 ? guidelines.length : Object.keys(AccessibilityUtils.guidelines).length} WCAG criteria</p>
              {!selectedPrinciple && <p><strong>Tip:</strong> Click on any principle card for detailed analysis</p>}
              {liveScanResults && (
                <p className="text-green-600"><strong>Live Scan:</strong> Current page data included</p>
              )}
            </div>
            {metadata && (
              <div className="text-right">
                <p><strong>Processing:</strong> {metadata.processingTime.toFixed(2)}ms</p>
                <p><strong>Optimization:</strong> {metadata.optimizationLevel}</p>
                <p><strong>Cache:</strong> {metadata.cacheStatus}</p>
                {enableLiveScanning && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Live scanning enabled
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 mb-2">
              <strong>WCAG Compliance Levels:</strong> 
              Level A (Essential), Level AA (Standard), Level AAA (Enhanced)
            </p>
            <p className="text-xs text-blue-700">
              Colors indicate compliance rates: 
              <span className="text-green-600">Excellent (90%+)</span>, 
              <span className="text-yellow-600">Good (70-89%)</span>, 
              <span className="text-orange-600">Fair (50-69%)</span>, 
              <span className="text-red-600">Poor (0-49%)</span>
            </p>
            
            {complianceReport && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-blue-800">{complianceReport.overview.overallScore.toFixed(1)}%</div>
                    <div className="text-blue-600">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-800">{complianceReport.overview.failed}</div>
                    <div className="text-red-600">Failed Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-800">{complianceReport.overview.passed}</div>
                    <div className="text-green-600">Passed Tests</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold px-2 py-1 rounded text-xs ${getComplianceTextColor(complianceReport.overview.complianceLevel)}`}>
                      {complianceReport.overview.complianceLevel.toUpperCase()}
                    </div>
                    <div className="text-gray-600">Compliance</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for compliance level colors
const getComplianceTextColor = (level: string): string => {
  switch (level) {
    case 'AAA': return 'text-green-800 bg-green-100';
    case 'AA': return 'text-blue-800 bg-blue-100';
    case 'A': return 'text-yellow-800 bg-yellow-100';
    case 'non-compliant': return 'text-red-800 bg-red-100';
    default: return 'text-gray-800 bg-gray-100';
  }
};

  return (
    <div className="accessibility-scorecard">
      {renderComponent()}
    </div>
  );
  
  function renderComponent() {
    const resultsToUse = liveScanResults ? [liveScanResults, ...accessibilityResults] : accessibilityResults;
    const guidelinesToUse = guidelines.length > 0 ? guidelines : Object.values(AccessibilityUtils.guidelines);
    
    // Enhanced empty state with live scanning option
    if (accessibilityResults.length === 0 && !liveScanResults) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2 font-medium">No accessibility evaluation data available</p>
            <p className="text-sm text-gray-400 mb-4">Complete accessibility audits to see compliance metrics</p>
            
            {enableLiveScanning && (
              <button
                onClick={handleLiveScan}
                disabled={isLiveScanning}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLiveScanning ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Scanning Current Page...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Scan Current Page
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow border">
        {/* Enhanced Header */}
        {(liveScanResults || enableLiveScanning) && (
          <div className="border-b p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${liveScanResults ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {liveScanResults ? 'Live Data Active' : 'Live Scanning Available'}
                  </span>
                </div>
                
                {liveScanResults && (
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Score: {liveScanResults.overallScore.toFixed(1)}% • 
                    Issues: {liveScanResults.evaluations.filter(e => e.status === 'fail').length}
                  </div>
                )}
              </div>
              
              {enableLiveScanning && (
                <button
                  onClick={handleLiveScan}
                  disabled={isLiveScanning}
                  className="inline-flex items-center px-3 py-1 text-xs border border-blue-300 text-blue-700 bg-white rounded hover:bg-blue-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isLiveScanning ? (
                    <>
                      <div className="animate-spin w-3 h-3 mr-1 border border-blue-600 border-t-transparent rounded-full"></div>
                      Scanning
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Progress indicator for scan history */}
            {scanHistory.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span>Scan History ({scanHistory.length} scans)</span>
                </div>
                <div className="flex gap-1">
                  {scanHistory.slice(0, 10).map((scan, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        scan.overallScore >= 90 
                          ? 'bg-green-400' 
                          : scan.overallScore >= 75 
                          ? 'bg-yellow-400' 
                          : 'bg-red-400'
                      }`}
                      title={`Scan ${index + 1}: ${scan.overallScore.toFixed(1)}%`}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="overflow-visible"
          />
        
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <div>
                <p><strong>Evaluations:</strong> {resultsToUse.length} completed</p>
                <p><strong>Guidelines:</strong> {guidelinesToUse.length} WCAG criteria</p>
                {!selectedPrinciple && <p><strong>Tip:</strong> Click on any principle card for detailed analysis</p>}
                {liveScanResults && (
                  <p className="text-green-600"><strong>Live Scan:</strong> Current page data included</p>
                )}
              </div>
              {metadata && (
                <div className="text-right">
                  <p><strong>Processing:</strong> {metadata.processingTime.toFixed(2)}ms</p>
                  <p><strong>Optimization:</strong> {metadata.optimizationLevel}</p>
                  <p><strong>Cache:</strong> {metadata.cacheStatus}</p>
                  {enableLiveScanning && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Live scanning enabled
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 mb-2">
                <strong>WCAG Compliance Levels:</strong> 
                Level A (Essential), Level AA (Standard), Level AAA (Enhanced)
              </p>
              <p className="text-xs text-blue-700">
                Colors indicate compliance rates: 
                <span className="text-green-600">Excellent (90%+)</span>, 
                <span className="text-yellow-600">Good (70-89%)</span>, 
                <span className="text-orange-600">Fair (50-69%)</span>, 
                <span className="text-red-600">Poor (0-49%)</span>
              </p>
              
              {complianceReport && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-blue-800">{complianceReport.overview.overallScore.toFixed(1)}%</div>
                      <div className="text-blue-600">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-800">{complianceReport.overview.failed}</div>
                      <div className="text-red-600">Failed Tests</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-800">{complianceReport.overview.passed}</div>
                      <div className="text-green-600">Passed Tests</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold px-2 py-1 rounded text-xs ${getComplianceTextColor(complianceReport.overview.complianceLevel)}`}>
                        {complianceReport.overview.complianceLevel.toUpperCase()}
                      </div>
                      <div className="text-gray-600">Compliance</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default AccessibilityScorecard;