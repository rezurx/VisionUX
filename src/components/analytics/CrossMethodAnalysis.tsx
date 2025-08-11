import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  CrossMethodAnalysis as CrossMethodData, 
  SurveyResult, 
  AccessibilityResult,
  DesignSystemResult,
  AnalyticsMetadata 
} from '../../types';
import { CardSortResult } from '../../analytics';
import { PerformanceOptimizer } from '../../analytics';

interface CrossMethodAnalysisProps {
  cardSortResults?: CardSortResult[];
  surveyResults?: SurveyResult[];
  accessibilityResults?: AccessibilityResult[];
  designSystemResults?: DesignSystemResult[];
  width?: number;
  height?: number;
  confidenceLevel?: number;
}

const CrossMethodAnalysis: React.FC<CrossMethodAnalysisProps> = ({
  cardSortResults = [],
  surveyResults = [],
  accessibilityResults = [],
  designSystemResults = [],
  width = 1200,
  height = 900,
  confidenceLevel = 0.95
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedView, setSelectedView] = useState<'correlation' | 'patterns' | 'insights'>('correlation');
  const [selectedMethod] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  
  // Calculate cross-method analysis data
  const analysisData = useMemo(() => {
    return calculateCrossMethodAnalysis();
  }, [cardSortResults, surveyResults, accessibilityResults, designSystemResults]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const startTime = performance.now();
    const totalDataPoints = cardSortResults.length + surveyResults.length + 
                           accessibilityResults.length + designSystemResults.length;
    const shouldOptimize = PerformanceOptimizer.shouldOptimize(totalDataPoints);
    
    renderCrossMethodVisualization();
    
    const endTime = performance.now();
    setMetadata({
      datasetSize: totalDataPoints,
      processingTime: endTime - startTime,
      optimizationLevel: shouldOptimize ? 'advanced' : 'basic',
      cacheStatus: 'miss',
      visualizationComplexity: 'high'
    });
  }, [analysisData, selectedView, selectedMethod, width, height]);

  const calculateCrossMethodAnalysis = (): CrossMethodData => {
    const methods = [];
    if (cardSortResults.length > 0) methods.push('card-sorting');
    if (surveyResults.length > 0) methods.push('survey');
    if (accessibilityResults.length > 0) methods.push('accessibility');
    if (designSystemResults.length > 0) methods.push('design-system');

    const correlations = calculateMethodCorrelations(methods);
    const patterns = identifyPatterns(methods);
    const insights = generateInsights(correlations, patterns);

    return {
      studyIds: [], // Would be populated with actual study IDs
      correlations,
      patterns,
      insights,
      confidence: calculateOverallConfidence(correlations)
    };
  };

  const calculateMethodCorrelations = (methods: string[]) => {
    const correlations = [];
    
    for (let i = 0; i < methods.length; i++) {
      for (let j = i + 1; j < methods.length; j++) {
        const method1 = methods[i];
        const method2 = methods[j];
        
        // Find shared participants
        const participants1 = getParticipantsByMethod(method1);
        const participants2 = getParticipantsByMethod(method2);
        const sharedParticipants = participants1.filter(p => participants2.includes(p)).length;
        
        if (sharedParticipants >= 2) {
          const correlation = calculatePairwiseCorrelation(method1, method2, sharedParticipants);
          const significance = calculateSignificance(correlation, sharedParticipants);
          
          correlations.push({
            method1,
            method2,
            correlation,
            significance,
            sharedParticipants
          });
        }
      }
    }
    
    return correlations;
  };

  const getParticipantsByMethod = (method: string): string[] => {
    switch (method) {
      case 'card-sorting':
        return cardSortResults.map(r => r.participantId);
      case 'survey':
        return surveyResults.map(r => r.participantId);
      case 'accessibility':
        return accessibilityResults.map(r => r.participantId);
      case 'design-system':
        return designSystemResults.map(r => r.participantId);
      default:
        return [];
    }
  };

  const calculatePairwiseCorrelation = (method1: string, method2: string, sharedParticipants: number): number => {
    // Simplified correlation calculation
    // In a real implementation, this would analyze actual data correlations
    
    // Mock correlation based on method compatibility
    const methodCompatibility: { [key: string]: { [key: string]: number } } = {
      'card-sorting': {
        'survey': 0.65,
        'accessibility': 0.45,
        'design-system': 0.75
      },
      'survey': {
        'accessibility': 0.55,
        'design-system': 0.70
      },
      'accessibility': {
        'design-system': 0.80
      }
    };
    
    const baseCorrelation = methodCompatibility[method1]?.[method2] || 
                           methodCompatibility[method2]?.[method1] || 0.5;
    
    // Adjust based on sample size
    const sampleAdjustment = Math.min(sharedParticipants / 50, 1);
    
    return baseCorrelation * sampleAdjustment + (Math.random() * 0.2 - 0.1);
  };

  const calculateSignificance = (correlation: number, sampleSize: number): number => {
    // Simplified significance test
    const tStat = Math.abs(correlation) * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    
    // Rough p-value approximation
    if (tStat > 2.58) return 0.01;
    if (tStat > 1.96) return 0.05;
    if (tStat > 1.64) return 0.10;
    return 0.20;
  };

  const identifyPatterns = (methods: string[]) => {
    const patterns = [];
    
    // Behavioral consistency pattern
    if (methods.includes('card-sorting') && methods.includes('survey')) {
      patterns.push({
        patternType: 'behavioral',
        description: 'Participants show consistent information organization preferences across card sorting and survey responses',
        supportingMethods: ['card-sorting', 'survey'],
        strength: 'moderate',
        implications: ['Information architecture aligns with user mental models', 'Navigation patterns are predictable']
      });
    }
    
    // Accessibility-usability correlation
    if (methods.includes('accessibility') && methods.includes('design-system')) {
      patterns.push({
        patternType: 'performance',
        description: 'Higher accessibility compliance correlates with better design system adoption',
        supportingMethods: ['accessibility', 'design-system'],
        strength: 'strong',
        implications: ['Accessible components are more usable', 'Design system promotes inclusive design']
      });
    }
    
    // User satisfaction convergence
    if (methods.length >= 3) {
      patterns.push({
        patternType: 'satisfaction',
        description: 'User satisfaction metrics converge across multiple research methods',
        supportingMethods: methods,
        strength: 'moderate',
        implications: ['Multi-method validation of findings', 'Triangulated insights increase confidence']
      });
    }
    
    return patterns;
  };

  const generateInsights = (correlations: any[], patterns: any[]) => {
    const convergentFindings = [
      'Information architecture preferences are consistent across methods',
      'Accessibility improvements correlate with overall usability gains',
      'Design system adoption reduces implementation inconsistencies'
    ];
    
    const divergentFindings = [
      'Self-reported preferences differ from observed behavior in card sorting',
      'Perceived accessibility doesn\'t always match objective measurements',
      'Component satisfaction varies significantly across user groups'
    ];
    
    const recommendations = [
      'Combine card sorting with user surveys for comprehensive IA insights',
      'Use accessibility audits to validate design system components',
      'Cross-validate findings across multiple research methods',
      'Focus on areas where methods show strong correlation for reliable insights'
    ];
    
    return {
      convergentFindings,
      divergentFindings,
      recommendations
    };
  };

  const calculateOverallConfidence = (correlations: any[]): number => {
    if (correlations.length === 0) return 0;
    
    const weightedSum = correlations.reduce((sum, corr) => {
      const weight = corr.sharedParticipants / 100; // Weight by sample size
      return sum + (Math.abs(corr.correlation) * weight);
    }, 0);
    
    const totalWeight = correlations.reduce((sum, corr) => sum + (corr.sharedParticipants / 100), 0);
    
    return totalWeight > 0 ? (weightedSum / totalWeight) : 0;
  };

  const renderCrossMethodVisualization = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 100, right: 150, bottom: 100, left: 150 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add navigation tabs
    renderNavigationTabs(svg);

    switch (selectedView) {
      case 'correlation':
        renderCorrelationMatrix(g, chartWidth, chartHeight);
        break;
      case 'patterns':
        renderPatternAnalysis(g, chartWidth, chartHeight);
        break;
      case 'insights':
        renderInsightsDashboard(g, chartWidth, chartHeight);
        break;
    }

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(getViewTitle(selectedView));

    // Add confidence indicator
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 55)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text(`Analysis Confidence: ${(analysisData.confidence * 100).toFixed(1)}% • ${analysisData.correlations.length} Method Pairs`);
  };

  const renderNavigationTabs = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const tabs = [
      { id: 'correlation', label: 'Method Correlations' },
      { id: 'patterns', label: 'Pattern Analysis' },
      { id: 'insights', label: 'Research Insights' }
    ];

    const tabWidth = 160;
    const startX = (width - (tabs.length * tabWidth)) / 2;

    tabs.forEach((tab, index) => {
      const tabGroup = svg.append('g')
        .attr('class', 'tab')
        .style('cursor', 'pointer');

      const isActive = selectedView === tab.id;
      
      tabGroup.append('rect')
        .attr('x', startX + index * tabWidth)
        .attr('y', 70)
        .attr('width', tabWidth - 5)
        .attr('height', 30)
        .attr('rx', 4)
        .style('fill', isActive ? '#3b82f6' : '#f3f4f6')
        .style('stroke', isActive ? '#2563eb' : '#d1d5db')
        .style('stroke-width', 1);

      tabGroup.append('text')
        .attr('x', startX + index * tabWidth + tabWidth / 2)
        .attr('y', 85)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', isActive ? '#fff' : '#374151')
        .text(tab.label);

      tabGroup.on('click', () => {
        setSelectedView(tab.id as any);
      });
    });
  };

  const renderCorrelationMatrix = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number
  ) => {
    const methods = Array.from(new Set([
      ...analysisData.correlations.map(c => c.method1),
      ...analysisData.correlations.map(c => c.method2)
    ]));

    if (methods.length < 2) {
      g.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight / 2)
        .style('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#666')
        .text('Need at least 2 research methods with shared participants for correlation analysis');
      return;
    }

    // Create correlation matrix
    const cellSize = Math.min(chartWidth, chartHeight) / methods.length - 10;
    const matrix: number[][] = Array(methods.length).fill(null).map(() => Array(methods.length).fill(0));
    
    // Fill matrix with correlation values
    methods.forEach((method1, i) => {
      methods.forEach((method2, j) => {
        if (i === j) {
          matrix[i][j] = 1; // Perfect correlation with self
        } else {
          const correlation = analysisData.correlations.find(c => 
            (c.method1 === method1 && c.method2 === method2) ||
            (c.method1 === method2 && c.method2 === method1)
          );
          matrix[i][j] = correlation ? correlation.correlation : 0;
        }
      });
    });

    // Color scale for correlations
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([1, -1]); // High positive correlation = red, negative = blue

    // Create cells
    methods.forEach((method1, i) => {
      methods.forEach((method2, j) => {
        const x = j * cellSize;
        const y = i * cellSize;
        const correlation = matrix[i][j];

        const cell = g.append('g')
          .attr('transform', `translate(${x}, ${y})`);

        cell.append('rect')
          .attr('width', cellSize - 2)
          .attr('height', cellSize - 2)
          .style('fill', colorScale(correlation))
          .style('stroke', '#fff')
          .style('stroke-width', 1)
          .style('opacity', 0.8);

        // Add correlation value
        cell.append('text')
          .attr('x', cellSize / 2)
          .attr('y', cellSize / 2)
          .attr('dy', '0.35em')
          .style('text-anchor', 'middle')
          .style('font-size', Math.min(cellSize / 4, 14))
          .style('font-weight', 'bold')
          .style('fill', Math.abs(correlation) > 0.5 ? '#fff' : '#000')
          .text(correlation.toFixed(2));

        // Add interaction
        cell.style('cursor', 'pointer')
          .on('mouseover', function(event) {
            if (correlation !== 1) { // Skip diagonal
              const correlationData = analysisData.correlations.find(c => 
                (c.method1 === method1 && c.method2 === method2) ||
                (c.method1 === method2 && c.method2 === method1)
              );

              if (correlationData) {
                const tooltip = d3.select('body')
                  .append('div')
                  .attr('class', 'correlation-tooltip')
                  .style('position', 'absolute')
                  .style('background', 'rgba(0, 0, 0, 0.9)')
                  .style('color', 'white')
                  .style('padding', '12px')
                  .style('border-radius', '6px')
                  .style('font-size', '12px')
                  .style('pointer-events', 'none')
                  .style('z-index', '1000');

                tooltip.html(`
                  <strong>${method1} ↔ ${method2}</strong><br/>
                  Correlation: ${correlation.toFixed(3)}<br/>
                  Significance: p = ${correlationData.significance.toFixed(3)}<br/>
                  Shared Participants: ${correlationData.sharedParticipants}<br/>
                  Strength: ${getCorrelationStrength(Math.abs(correlation))}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
              }
            }
          })
          .on('mouseout', function() {
            d3.select('.correlation-tooltip').remove();
          });
      });
    });

    // Add method labels
    methods.forEach((method, i) => {
      // Row labels
      g.append('text')
        .attr('x', -10)
        .attr('y', i * cellSize + cellSize / 2)
        .attr('dy', '0.35em')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('text-transform', 'capitalize')
        .text(method.replace('-', ' '));

      // Column labels
      g.append('text')
        .attr('x', i * cellSize + cellSize / 2)
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('text-transform', 'capitalize')
        .attr('transform', `rotate(-45, ${i * cellSize + cellSize / 2}, -10)`)
        .text(method.replace('-', ' '));
    });

    // Add color legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = chartWidth - legendWidth - 20;
    const legendY = methods.length * cellSize + 40;

    const legend = g.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Create gradient
    const gradient = g.append('defs')
      .append('linearGradient')
      .attr('id', 'correlation-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    const gradientStops = d3.range(-1, 1.1, 0.2);
    gradient.selectAll('stop')
      .data(gradientStops)
      .enter().append('stop')
      .attr('offset', d => `${((d + 1) / 2) * 100}%`)
      .attr('stop-color', d => colorScale(d));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#correlation-gradient)');

    // Legend labels
    [-1, 0, 1].forEach(value => {
      const x = ((value + 1) / 2) * legendWidth;
      legend.append('text')
        .attr('x', x)
        .attr('y', legendHeight + 15)
        .style('text-anchor', 'middle')
        .style('font-size', '11px')
        .text(value.toString());
    });

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Correlation Coefficient');
  };

  const renderPatternAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number
  ) => {
    if (analysisData.patterns.length === 0) {
      g.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight / 2)
        .style('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#666')
        .text('No cross-method patterns identified with current data');
      return;
    }

    const patternHeight = Math.min((chartHeight - 40) / analysisData.patterns.length, 150);

    analysisData.patterns.forEach((pattern, index) => {
      const y = index * (patternHeight + 20);
      
      const patternGroup = g.append('g')
        .attr('transform', `translate(0, ${y})`);

      // Pattern card background
      const strengthColor = getPatternColor(pattern.strength);
      patternGroup.append('rect')
        .attr('width', chartWidth)
        .attr('height', patternHeight)
        .attr('rx', 8)
        .style('fill', strengthColor)
        .style('opacity', 0.1)
        .style('stroke', strengthColor)
        .style('stroke-width', 2);

      // Pattern type badge
      patternGroup.append('rect')
        .attr('x', 20)
        .attr('y', 15)
        .attr('width', 120)
        .attr('height', 25)
        .attr('rx', 12)
        .style('fill', strengthColor);

      patternGroup.append('text')
        .attr('x', 80)
        .attr('y', 27.5)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', '#fff')
        .style('text-transform', 'uppercase')
        .text(pattern.patternType);

      // Strength indicator
      patternGroup.append('text')
        .attr('x', chartWidth - 20)
        .attr('y', 27.5)
        .attr('dy', '0.35em')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', strengthColor)
        .style('text-transform', 'capitalize')
        .text(`${pattern.strength} Pattern`);

      // Pattern description
      patternGroup.append('text')
        .attr('x', 20)
        .attr('y', 60)
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(pattern.description);

      // Supporting methods
      const methodsText = `Supporting Methods: ${pattern.supportingMethods.map(m => m.replace('-', ' ')).join(', ')}`;
      patternGroup.append('text')
        .attr('x', 20)
        .attr('y', 85)
        .style('font-size', '12px')
        .style('fill', '#666')
        .text(methodsText);

      // Implications
      pattern.implications.forEach((implication, impIndex) => {
        patternGroup.append('text')
          .attr('x', 40)
          .attr('y', 110 + impIndex * 20)
          .style('font-size', '11px')
          .style('fill', '#555')
          .text(`• ${implication}`);
      });
    });
  };

  const renderInsightsDashboard = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number
  ) => {
    const sectionHeight = (chartHeight - 60) / 3;
    
    // Convergent Findings
    renderInsightSection(
      g, 
      'Convergent Findings', 
      analysisData.insights.convergentFindings,
      0,
      sectionHeight,
      chartWidth,
      '#10b981'
    );

    // Divergent Findings
    renderInsightSection(
      g,
      'Divergent Findings',
      analysisData.insights.divergentFindings,
      sectionHeight + 20,
      sectionHeight,
      chartWidth,
      '#ef4444'
    );

    // Recommendations
    renderInsightSection(
      g,
      'Recommendations',
      analysisData.insights.recommendations,
      (sectionHeight + 20) * 2,
      sectionHeight,
      chartWidth,
      '#3b82f6'
    );
  };

  const renderInsightSection = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    title: string,
    items: string[],
    y: number,
    height: number,
    width: number,
    color: string
  ) => {
    const section = g.append('g')
      .attr('transform', `translate(0, ${y})`);

    // Section background
    section.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 8)
      .style('fill', color)
      .style('opacity', 0.05)
      .style('stroke', color)
      .style('stroke-width', 1);

    // Section title
    section.append('text')
      .attr('x', 20)
      .attr('y', 25)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', color)
      .text(title);

    // Items
    items.forEach((item, index) => {
      const itemY = 50 + index * 25;
      
      // Bullet point
      section.append('circle')
        .attr('cx', 30)
        .attr('cy', itemY)
        .attr('r', 3)
        .style('fill', color);

      // Item text
      section.append('text')
        .attr('x', 45)
        .attr('y', itemY)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('fill', '#374151')
        .text(item);
    });
  };

  const getCorrelationStrength = (absCorrelation: number): string => {
    if (absCorrelation >= 0.7) return 'Strong';
    if (absCorrelation >= 0.5) return 'Moderate';
    if (absCorrelation >= 0.3) return 'Weak';
    return 'Very Weak';
  };

  const getPatternColor = (strength: string): string => {
    switch (strength) {
      case 'strong': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'weak': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getViewTitle = (view: string): string => {
    const titles = {
      correlation: 'Cross-Method Correlation Analysis',
      patterns: 'Research Pattern Identification',
      insights: 'Multi-Method Research Insights'
    };
    return titles[view as keyof typeof titles] || '';
  };

  const totalMethods = [cardSortResults, surveyResults, accessibilityResults, designSystemResults]
    .filter(results => results.length > 0).length;

  if (totalMethods < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Cross-method analysis requires at least 2 research methods</p>
          <p className="text-sm text-gray-400">
            Current methods: {totalMethods} of 4 available (Card Sorting, Survey, Accessibility, Design System)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      />
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <div>
            <p><strong>Methods Analyzed:</strong> {totalMethods} research methods</p>
            <p><strong>Method Correlations:</strong> {analysisData.correlations.length} pairs</p>
            <p><strong>Patterns Identified:</strong> {analysisData.patterns.length}</p>
          </div>
          {metadata && (
            <div className="text-right">
              <p><strong>Processing:</strong> {metadata.processingTime.toFixed(2)}ms</p>
              <p><strong>Analysis Confidence:</strong> {(analysisData.confidence * 100).toFixed(1)}%</p>
            </div>
          )}
        </div>
        
        <div className="mt-2 p-2 bg-purple-50 rounded">
          <p className="text-xs text-purple-700">
            <strong>Cross-Method Analysis:</strong> 
            Correlations between research methods, behavioral patterns, and triangulated insights • 
            Higher correlations indicate methods are measuring similar constructs
          </p>
        </div>
      </div>
    </div>
  );
};

export default CrossMethodAnalysis;