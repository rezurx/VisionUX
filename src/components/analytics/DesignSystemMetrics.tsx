import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DesignSystemResult, DesignSystemComponent, AnalyticsMetadata } from '../../types';
import { PerformanceOptimizer, StatisticalAnalysis } from '../../analytics';

interface DesignSystemMetricsProps {
  designSystemResults: DesignSystemResult[];
  components: DesignSystemComponent[];
  width?: number;
  height?: number;
  showTrends?: boolean;
}

const DesignSystemMetrics: React.FC<DesignSystemMetricsProps> = ({
  designSystemResults,
  components,
  width = 1200,
  height = 800,
  showTrends = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedView, setSelectedView] = useState<'adoption' | 'satisfaction' | 'usage' | 'health'>('adoption');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  
  useEffect(() => {
    if (!svgRef.current || designSystemResults.length === 0) return;
    
    const startTime = performance.now();
    const shouldOptimize = PerformanceOptimizer.shouldOptimize(designSystemResults.length * components.length);
    
    renderDesignSystemVisualization();
    
    const endTime = performance.now();
    setMetadata({
      datasetSize: designSystemResults.length,
      processingTime: endTime - startTime,
      optimizationLevel: shouldOptimize ? 'advanced' : 'basic',
      cacheStatus: 'miss',
      visualizationComplexity: 'high'
    });
  }, [designSystemResults, components, selectedView, selectedCategory, width, height]);

  const renderDesignSystemVisualization = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 100, right: 200, bottom: 100, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add navigation tabs
    renderNavigationTabs(svg);

    switch (selectedView) {
      case 'adoption':
        renderAdoptionMatrix(g, chartWidth, chartHeight);
        break;
      case 'satisfaction':
        renderSatisfactionAnalysis(g, chartWidth, chartHeight);
        break;
      case 'usage':
        renderUsagePatterns(g, chartWidth, chartHeight);
        break;
      case 'health':
        renderSystemHealth(g, chartWidth, chartHeight);
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
  };

  const renderNavigationTabs = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const tabs = [
      { id: 'adoption', label: 'Component Adoption' },
      { id: 'satisfaction', label: 'User Satisfaction' },
      { id: 'usage', label: 'Usage Patterns' },
      { id: 'health', label: 'System Health' }
    ];

    const tabWidth = 150;
    const startX = (width - (tabs.length * tabWidth)) / 2;

    tabs.forEach((tab, index) => {
      const tabGroup = svg.append('g')
        .attr('class', 'tab')
        .style('cursor', 'pointer');

      const isActive = selectedView === tab.id;
      
      tabGroup.append('rect')
        .attr('x', startX + index * tabWidth)
        .attr('y', 60)
        .attr('width', tabWidth - 5)
        .attr('height', 30)
        .attr('rx', 4)
        .style('fill', isActive ? '#3b82f6' : '#f3f4f6')
        .style('stroke', isActive ? '#2563eb' : '#d1d5db')
        .style('stroke-width', 1);

      tabGroup.append('text')
        .attr('x', startX + index * tabWidth + tabWidth / 2)
        .attr('y', 75)
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

  const renderAdoptionMatrix = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number
  ) => {
    const categories = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
    const adoptionData = calculateAdoptionMetrics();

    // Create bubble chart
    const xScale = d3.scaleOrdinal()
      .domain(categories)
      .range(categories.map((_, i) => (chartWidth / categories.length) * (i + 0.5)));

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight - 50, 50]);

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(adoptionData, d => d.usage) || 1])
      .range([5, 50]);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 100]);

    // Create category sections
    categories.forEach((category, index) => {
      const x = (chartWidth / categories.length) * index;
      const sectionWidth = chartWidth / categories.length;

      // Category background
      g.append('rect')
        .attr('x', x)
        .attr('y', 0)
        .attr('width', sectionWidth)
        .attr('height', chartHeight - 50)
        .style('fill', index % 2 === 0 ? '#f9fafb' : '#fff')
        .style('opacity', 0.5);

      // Category label
      g.append('text')
        .attr('x', x + sectionWidth / 2)
        .attr('y', chartHeight - 20)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('text-transform', 'capitalize')
        .text(category);
    });

    // Component bubbles
    const bubbles = g.selectAll('.component-bubble')
      .data(adoptionData)
      .enter().append('g')
      .attr('class', 'component-bubble')
      .style('cursor', 'pointer');

    bubbles.append('circle')
      .attr('cx', d => xScale(d.category) as number)
      .attr('cy', d => yScale(d.adoptionRate))
      .attr('r', 0)
      .style('fill', d => colorScale(d.adoptionRate))
      .style('opacity', 0.7)
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr('r', d => sizeScale(d.usage));

    // Component labels
    bubbles.append('text')
      .attr('x', d => xScale(d.category) as number)
      .attr('y', d => yScale(d.adoptionRate))
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50 + 500)
      .style('opacity', 1);

    // Add Y-axis
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d}%`);
    
    g.append('g')
      .call(yAxis);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -(chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Adoption Rate (%)');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth + 20}, 50)`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Usage Frequency');

    const legendData = [10, 50, 100, 200].map(value => ({
      value,
      radius: sizeScale(value)
    }));

    legendData.forEach((item, index) => {
      const legendY = 20 + index * 40;
      
      legend.append('circle')
        .attr('cx', item.radius)
        .attr('cy', legendY)
        .attr('r', item.radius)
        .style('fill', '#3b82f6')
        .style('opacity', 0.5);

      legend.append('text')
        .attr('x', item.radius * 2 + 10)
        .attr('y', legendY)
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .text(`${item.value} uses`);
    });

    // Add interactions
    bubbles.on('mouseover', function(event, d) {
      d3.select(this).select('circle')
        .style('opacity', 1)
        .style('stroke-width', 3);

      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'design-system-tooltip')
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
        <strong>${d.name}</strong><br/>
        Category: ${d.category}<br/>
        Adoption Rate: ${d.adoptionRate.toFixed(1)}%<br/>
        Total Usage: ${d.usage} implementations<br/>
        Status: ${d.status}<br/>
        Custom Implementations: ${d.customImplementations}<br/>
        Avg Implementation Time: ${d.avgImplementationTime.toFixed(1)}h
      `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
    });

    bubbles.on('mouseout', function() {
      d3.select(this).select('circle')
        .style('opacity', 0.7)
        .style('stroke-width', 2);
      
      d3.select('.design-system-tooltip').remove();
    });
  };

  const renderSatisfactionAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number
  ) => {
    const satisfactionData = calculateSatisfactionMetrics();

    // Create radar chart for satisfaction dimensions
    const dimensions = ['usability', 'consistency', 'documentation', 'accessibility'];
    const angleSlice = Math.PI * 2 / dimensions.length;

    const rScale = d3.scaleLinear()
      .domain([0, 5])
      .range([0, Math.min(chartWidth, chartHeight) / 2 - 100]);

    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;

    // Draw radar chart grid
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const radius = rScale(level);
      
      g.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .style('fill', 'none')
        .style('stroke', '#ddd')
        .style('stroke-dasharray', '3,3');

      g.append('text')
        .attr('x', centerX + 5)
        .attr('y', centerY - radius)
        .style('font-size', '10px')
        .style('fill', '#666')
        .text(level.toString());
    }

    // Draw axis lines
    dimensions.forEach((dimension, index) => {
      const angle = angleSlice * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * rScale(5);
      const y = centerY + Math.sin(angle) * rScale(5);

      g.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x)
        .attr('y2', y)
        .style('stroke', '#ddd')
        .style('stroke-width', 1);

      // Add dimension labels
      const labelX = centerX + Math.cos(angle) * (rScale(5) + 20);
      const labelY = centerY + Math.sin(angle) * (rScale(5) + 20);

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('text-transform', 'capitalize')
        .text(dimension);
    });

    // Calculate average scores
    const avgScores = dimensions.map(dim => {
      const scores = satisfactionData.map(d => d.scores[dim]).filter(score => score !== undefined);
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    });

    // Draw radar polygon
    const pathData = avgScores.map((score, index) => {
      const angle = angleSlice * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * rScale(score);
      const y = centerY + Math.sin(angle) * rScale(score);
      return [x, y];
    });

    const lineGenerator = d3.line()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(pathData)
      .attr('d', lineGenerator)
      .style('fill', '#3b82f6')
      .style('opacity', 0.3)
      .style('stroke', '#3b82f6')
      .style('stroke-width', 2);

    // Add data points
    pathData.forEach((point, index) => {
      g.append('circle')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', 0)
        .style('fill', '#3b82f6')
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .transition()
        .duration(1000)
        .delay(index * 200)
        .attr('r', 6);

      // Add score labels
      g.append('text')
        .attr('x', point[0])
        .attr('y', point[1] - 15)
        .style('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', '#3b82f6')
        .text(avgScores[index].toFixed(1))
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay(index * 200 + 500)
        .style('opacity', 1);
    });

    // Add satisfaction distribution
    const distributionY = chartHeight - 150;
    const distributionHeight = 100;

    satisfactionData.forEach((component, index) => {
      const x = (index * (chartWidth / satisfactionData.length)) + 10;
      const barWidth = Math.max((chartWidth / satisfactionData.length) - 20, 20);

      const overallSatisfaction = Object.values(component.scores).reduce((sum: number, score: number) => sum + score, 0) / dimensions.length;

      g.append('rect')
        .attr('x', x)
        .attr('y', distributionY + distributionHeight)
        .attr('width', barWidth)
        .attr('height', 0)
        .style('fill', getSatisfactionColor(overallSatisfaction))
        .style('opacity', 0.8)
        .transition()
        .duration(1000)
        .delay(index * 100)
        .attr('y', distributionY + distributionHeight - (overallSatisfaction / 5) * distributionHeight)
        .attr('height', (overallSatisfaction / 5) * distributionHeight);

      // Component name
      g.append('text')
        .attr('x', x + barWidth / 2)
        .attr('y', distributionY + distributionHeight + 15)
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('transform', `rotate(45deg)`)
        .style('transform-origin', `${x + barWidth / 2}px ${distributionY + distributionHeight + 15}px`)
        .text(component.name.length > 8 ? component.name.substring(0, 8) + '...' : component.name);
    });
  };

  const renderUsagePatterns = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number
  ) => {
    const usageData = calculateUsagePatterns();

    // Create timeline chart for usage trends
    if (showTrends) {
      // Implementation would show usage over time
      // For now, show current usage distribution
    }

    // Create treemap for component usage
    const treemap = d3.treemap()
      .size([chartWidth, chartHeight - 100])
      .padding(2)
      .round(true);

    const hierarchy = d3.hierarchy({ children: usageData })
      .sum(d => d.usage || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    treemap(hierarchy);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const cells = g.selectAll('.usage-cell')
      .data(hierarchy.leaves())
      .enter().append('g')
      .attr('class', 'usage-cell')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cells.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .style('fill', (d, i) => colorScale(i.toString()))
      .style('opacity', 0.8)
      .style('stroke', '#fff')
      .style('stroke-width', 1);

    cells.append('text')
      .attr('x', d => (d.x1 - d.x0) / 2)
      .attr('y', d => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', d => Math.min((d.x1 - d.x0) / 8, (d.y1 - d.y0) / 4, 12))
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .text(d => d.data.name);

    cells.append('text')
      .attr('x', d => (d.x1 - d.x0) / 2)
      .attr('y', d => (d.y1 - d.y0) / 2 + 15)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', d => Math.min((d.x1 - d.x0) / 10, (d.y1 - d.y0) / 6, 10))
      .style('fill', '#fff')
      .text(d => `${d.data.usage} uses`);
  };

  const renderSystemHealth = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number
  ) => {
    const healthData = calculateSystemHealth();

    // Create health dashboard with key metrics
    const metrics = [
      { label: 'Component Coverage', value: healthData.coverage, target: 80, unit: '%' },
      { label: 'Average Satisfaction', value: healthData.satisfaction, target: 4.0, unit: '/5' },
      { label: 'Implementation Consistency', value: healthData.consistency, target: 90, unit: '%' },
      { label: 'Accessibility Compliance', value: healthData.accessibility, target: 100, unit: '%' }
    ];

    const cardWidth = chartWidth / 2 - 20;
    const cardHeight = chartHeight / 2 - 20;

    metrics.forEach((metric, index) => {
      const x = (index % 2) * (cardWidth + 40);
      const y = Math.floor(index / 2) * (cardHeight + 40);

      const card = g.append('g')
        .attr('transform', `translate(${x}, ${y})`);

      // Card background
      const healthColor = getHealthColor(metric.value, metric.target);
      card.append('rect')
        .attr('width', cardWidth)
        .attr('height', cardHeight)
        .attr('rx', 8)
        .style('fill', healthColor)
        .style('opacity', 0.1)
        .style('stroke', healthColor)
        .style('stroke-width', 2);

      // Metric title
      card.append('text')
        .attr('x', cardWidth / 2)
        .attr('y', 30)
        .style('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(metric.label);

      // Progress circle
      const radius = 60;
      const centerX = cardWidth / 2;
      const centerY = cardHeight / 2;
      const circumference = 2 * Math.PI * radius;
      const progress = (metric.value / (metric.unit === '%' ? 100 : 5)) * circumference;

      card.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .style('fill', 'none')
        .style('stroke', '#e5e7eb')
        .style('stroke-width', 8);

      card.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .style('fill', 'none')
        .style('stroke', healthColor)
        .style('stroke-width', 8)
        .style('stroke-linecap', 'round')
        .style('stroke-dasharray', circumference)
        .style('stroke-dashoffset', circumference)
        .style('transform', 'rotate(-90deg)')
        .style('transform-origin', 'center')
        .transition()
        .duration(2000)
        .style('stroke-dashoffset', circumference - progress);

      // Value text
      card.append('text')
        .attr('x', centerX)
        .attr('y', centerY - 5)
        .style('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .style('fill', healthColor)
        .text(`${metric.value.toFixed(1)}${metric.unit}`);

      // Target text
      card.append('text')
        .attr('x', centerX)
        .attr('y', centerY + 20)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text(`Target: ${metric.target}${metric.unit}`);
    });
  };

  const calculateAdoptionMetrics = () => {
    return components.map(component => {
      const evaluations = designSystemResults.flatMap(result =>
        result.componentEvaluations.filter(eval => eval.componentId === component.id)
      );

      const adoptionRate = designSystemResults.length > 0 ? 
        (evaluations.length / designSystemResults.length) * 100 : 0;

      const avgCustomImplementations = designSystemResults.length > 0 ?
        designSystemResults.reduce((sum, result) => sum + result.adoptionMetrics.customImplementations, 0) / designSystemResults.length : 0;

      const avgImplementationTime = designSystemResults.length > 0 ?
        designSystemResults.reduce((sum, result) => sum + result.adoptionMetrics.timeToImplement, 0) / designSystemResults.length : 0;

      return {
        id: component.id,
        name: component.name,
        category: component.category,
        status: component.status,
        adoptionRate,
        usage: component.usage.frequency,
        customImplementations: avgCustomImplementations,
        avgImplementationTime
      };
    });
  };

  const calculateSatisfactionMetrics = () => {
    return components.map(component => {
      const evaluations = designSystemResults.flatMap(result =>
        result.componentEvaluations.filter(eval => eval.componentId === component.id)
      );

      const scores = {
        usability: evaluations.length > 0 ? 
          evaluations.reduce((sum, eval) => sum + eval.usability, 0) / evaluations.length : 0,
        consistency: evaluations.length > 0 ? 
          evaluations.reduce((sum, eval) => sum + eval.consistency, 0) / evaluations.length : 0,
        documentation: evaluations.length > 0 ? 
          evaluations.reduce((sum, eval) => sum + eval.documentation, 0) / evaluations.length : 0,
        accessibility: evaluations.length > 0 ? 
          evaluations.reduce((sum, eval) => sum + eval.accessibility, 0) / evaluations.length : 0
      };

      return {
        id: component.id,
        name: component.name,
        scores
      };
    });
  };

  const calculateUsagePatterns = () => {
    return components.map(component => ({
      id: component.id,
      name: component.name,
      usage: component.usage.frequency,
      category: component.category,
      variations: component.usage.variations.length
    }));
  };

  const calculateSystemHealth = () => {
    const totalComponents = components.length;
    const evaluatedComponents = new Set(
      designSystemResults.flatMap(result => 
        result.componentEvaluations.map(eval => eval.componentId)
      )
    ).size;

    const coverage = totalComponents > 0 ? (evaluatedComponents / totalComponents) * 100 : 0;

    const allEvaluations = designSystemResults.flatMap(result => result.componentEvaluations);
    const satisfaction = allEvaluations.length > 0 ?
      designSystemResults.reduce((sum, result) => sum + result.overallSatisfaction, 0) / designSystemResults.length : 0;

    const consistency = allEvaluations.length > 0 ?
      allEvaluations.reduce((sum, eval) => sum + eval.consistency, 0) / allEvaluations.length / 5 * 100 : 0;

    const accessibility = allEvaluations.length > 0 ?
      allEvaluations.reduce((sum, eval) => sum + eval.accessibility, 0) / allEvaluations.length / 5 * 100 : 0;

    return { coverage, satisfaction, consistency, accessibility };
  };

  const getViewTitle = (view: string): string => {
    const titles = {
      adoption: 'Design System Component Adoption',
      satisfaction: 'User Satisfaction Analysis',
      usage: 'Usage Patterns & Frequency',
      health: 'Design System Health Dashboard'
    };
    return titles[view] || '';
  };

  const getSatisfactionColor = (score: number): string => {
    if (score >= 4) return '#10b981';
    if (score >= 3) return '#f59e0b';
    if (score >= 2) return '#f97316';
    return '#ef4444';
  };

  const getHealthColor = (value: number, target: number): string => {
    const ratio = value / target;
    if (ratio >= 0.9) return '#10b981';
    if (ratio >= 0.7) return '#f59e0b';
    if (ratio >= 0.5) return '#f97316';
    return '#ef4444';
  };

  if (designSystemResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No design system evaluation data available</p>
          <p className="text-sm text-gray-400">Complete component evaluations to see adoption metrics</p>
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
            <p><strong>Evaluations:</strong> {designSystemResults.length} completed</p>
            <p><strong>Components:</strong> {components.length} tracked</p>
            <p><strong>Current View:</strong> {getViewTitle(selectedView)}</p>
          </div>
          {metadata && (
            <div className="text-right">
              <p><strong>Processing:</strong> {metadata.processingTime.toFixed(2)}ms</p>
              <p><strong>Optimization:</strong> {metadata.optimizationLevel}</p>
            </div>
          )}
        </div>
        
        <div className="mt-2 p-2 bg-green-50 rounded">
          <p className="text-xs text-green-700">
            <strong>Design System Metrics:</strong> 
            Adoption rates, satisfaction scores, usage patterns, and system health indicators • 
            Use tabs above to switch between different analysis views
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemMetrics;