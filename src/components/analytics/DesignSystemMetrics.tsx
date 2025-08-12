import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { DesignSystemResult, DesignSystemComponent, AnalyticsMetadata, ComponentEvaluation } from '../../types';
import { PerformanceOptimizer, StatisticalAnalysis } from '../../analytics';
import { Download, TrendingUp, BarChart3, Users, Clock, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface DesignSystemMetricsProps {
  designSystemResults: DesignSystemResult[];
  components: DesignSystemComponent[];
  width?: number;
  height?: number;
  showTrends?: boolean;
  onExport?: (data: any) => void;
  responsive?: boolean;
}

const DesignSystemMetrics: React.FC<DesignSystemMetricsProps> = ({
  designSystemResults,
  components,
  width = 1200,
  height = 800,
  showTrends = false,
  onExport,
  responsive = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedView, setSelectedView] = useState<'adoption' | 'satisfaction' | 'usage' | 'health' | 'timeline' | 'integration'>('adoption');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'png'>('json');
  
  // Generate comprehensive sample data when no real data is available
  const sampleData = useMemo(() => {
    if (designSystemResults.length > 0 && components.length > 0) {
      return { designSystemResults, components };
    }
    return generateSampleData();
  }, [designSystemResults, components]);
  
  // Handle responsive sizing
  useEffect(() => {
    if (!responsive) return;
    
    const handleResize = PerformanceOptimizer.throttle(() => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = Math.min(containerWidth * 0.7, 800);
        const mobile = window.innerWidth < 768;
        
        setDimensions({ 
          width: Math.max(containerWidth, 320), 
          height: Math.max(containerHeight, 400) 
        });
        setIsMobile(mobile);
      }
    }, 250);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const startTime = performance.now();
    const currentData = sampleData.designSystemResults.length > 0 ? sampleData : generateSampleData();
    const shouldOptimize = PerformanceOptimizer.shouldOptimize(currentData.designSystemResults.length * currentData.components.length);
    
    renderDesignSystemVisualization();
    
    const endTime = performance.now();
    setMetadata({
      datasetSize: currentData.designSystemResults.length,
      processingTime: endTime - startTime,
      optimizationLevel: shouldOptimize ? 'advanced' : 'basic',
      cacheStatus: 'miss',
      visualizationComplexity: 'high'
    });
  }, [sampleData, selectedView, selectedCategory, selectedTimeframe, dimensions.width, dimensions.height, isMobile]);

  const renderDesignSystemVisualization = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const currentData = sampleData.designSystemResults.length > 0 ? sampleData : generateSampleData();
    const currentWidth = responsive ? dimensions.width : width;
    const currentHeight = responsive ? dimensions.height : height;

    const margin = isMobile 
      ? { top: 80, right: 20, bottom: 80, left: 60 }
      : { top: 100, right: 200, bottom: 100, left: 100 };
    const chartWidth = currentWidth - margin.left - margin.right;
    const chartHeight = currentHeight - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add navigation tabs
    renderNavigationTabs(svg, currentWidth);

    switch (selectedView) {
      case 'adoption':
        renderAdoptionMatrix(g, chartWidth, chartHeight, currentData);
        break;
      case 'satisfaction':
        renderSatisfactionAnalysis(g, chartWidth, chartHeight, currentData);
        break;
      case 'usage':
        renderUsagePatterns(g, chartWidth, chartHeight, currentData);
        break;
      case 'health':
        renderSystemHealth(g, chartWidth, chartHeight, currentData);
        break;
      case 'timeline':
        renderTimelineAnalysis(g, chartWidth, chartHeight, currentData);
        break;
      case 'integration':
        renderIntegrationAnalysis(g, chartWidth, chartHeight, currentData);
        break;
    }

    // Add title
    svg.append('text')
      .attr('x', currentWidth / 2)
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('font-size', isMobile ? '16px' : '20px')
      .style('font-weight', 'bold')
      .text(getViewTitle(selectedView));
      
    // Add data info
    svg.append('text')
      .attr('x', currentWidth / 2)
      .attr('y', 50)
      .style('text-anchor', 'middle')
      .style('font-size', isMobile ? '10px' : '12px')
      .style('fill', '#666')
      .text(`${currentData.designSystemResults.length} evaluations • ${currentData.components.length} components • ${selectedTimeframe} view`);
  };

  const renderNavigationTabs = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, svgWidth: number) => {
    const tabs = [
      { id: 'adoption', label: 'Adoption', fullLabel: 'Component Adoption' },
      { id: 'satisfaction', label: 'Satisfaction', fullLabel: 'User Satisfaction' },
      { id: 'usage', label: 'Usage', fullLabel: 'Usage Patterns' },
      { id: 'health', label: 'Health', fullLabel: 'System Health' },
      { id: 'timeline', label: 'Timeline', fullLabel: 'Timeline Analysis' },
      { id: 'integration', label: 'Integration', fullLabel: 'Integration Analytics' }
    ];

    const tabWidth = isMobile ? Math.max(svgWidth / tabs.length - 2, 60) : 120;
    const startX = (svgWidth - (tabs.length * tabWidth)) / 2;

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
        .style('font-size', isMobile ? '10px' : '12px')
        .style('font-weight', 'bold')
        .style('fill', isActive ? '#fff' : '#374151')
        .text(isMobile ? tab.label : tab.fullLabel);

      tabGroup.on('click', () => {
        setSelectedView(tab.id as any);
      });
    });
  };

  const generateTimelineData = (components: DesignSystemComponent[]) => {
    const dates = [];
    const startDate = new Date(2024, 0, 1);
    for (let i = 0; i < 90; i += 7) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push({
        date: date.toISOString().split('T')[0],
        adoptionRate: Math.min(95, 20 + i * 0.8 + Math.random() * 10)
      });
    }
    return dates;
  };
  
  const generateNetworkVisualization = (components: DesignSystemComponent[]) => {
    const nodes = components.slice(0, 15).map(component => ({
      id: component.id,
      name: component.name,
      size: Math.sqrt(component.usage.frequency) * 0.5 + 5,
      color: component.status === 'stable' ? '#10B981' : 
             component.status === 'beta' ? '#F59E0B' : 
             component.status === 'deprecated' ? '#EF4444' : '#8B5CF6'
    }));
    
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.7) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: Math.random() * 5 + 1
          });
        }
      }
    }
    
    return { nodes, links };
  };
  
  const calculateIntegrationMetrics = (data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }) => {
    return {
      crossPlatformUsage: Math.floor(Math.random() * 30) + 60,
      componentReuseRate: Math.floor(Math.random() * 20) + 75,
      integrationScore: Math.floor(Math.random() * 15) + 80,
      totalDependencies: Math.floor(Math.random() * 50) + 120
    };
  };

  const renderTimelineAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number,
    data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }
  ) => {
    const timelineData = generateTimelineData(data.components);
    const parseTime = d3.timeParse('%Y-%m-%d');
    const formatTime = d3.timeFormat('%b %d');
    
    const xScale = d3.scaleTime()
      .domain(d3.extent(timelineData, d => parseTime(d.date)) as [Date, Date])
      .range([0, chartWidth]);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timelineData, d => d.adoptionRate) || 100])
      .range([chartHeight - 50, 50]);
      
    const line = d3.line<any>()
      .x(d => xScale(parseTime(d.date)!))
      .y(d => yScale(d.adoptionRate))
      .curve(d3.curveMonotoneX);
    
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight - 50})`)
      .call(d3.axisBottom(xScale).tickFormat(formatTime as any));
      
    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));
    
    g.append('path')
      .datum(timelineData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line)
      .style('opacity', 0)
      .transition()
      .duration(2000)
      .style('opacity', 1);
    
    g.selectAll('.timeline-point')
      .data(timelineData)
      .enter().append('circle')
      .attr('class', 'timeline-point')
      .attr('cx', d => xScale(parseTime(d.date)!))
      .attr('cy', d => yScale(d.adoptionRate))
      .attr('r', 0)
      .style('fill', '#3b82f6')
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('r', 5);
  };

  const renderIntegrationAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number,
    data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }
  ) => {
    const integrationData = calculateIntegrationMetrics(data);
    const networkData = generateNetworkVisualization(data.components);
    
    const simulation = d3.forceSimulation(networkData.nodes)
      .force('link', d3.forceLink(networkData.links).id((d: any) => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2));
    
    const links = g.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .style('stroke', '#999')
      .style('stroke-opacity', 0.6)
      .style('stroke-width', 2);
    
    const nodes = g.append('g')
      .selectAll('circle')
      .data(networkData.nodes)
      .enter().append('circle')
      .attr('r', (d: any) => d.size || 8)
      .style('fill', (d: any) => d.color || '#69b3a2')
      .style('stroke', '#fff')
      .style('stroke-width', 2);
    
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      nodes
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });
    
    const metricsPanel = g.append('g')
      .attr('transform', `translate(${Math.max(chartWidth - 180, 20)}, 20)`);
    
    const metrics = [
      { label: 'Cross-Platform', value: `${integrationData.crossPlatformUsage}%` },
      { label: 'Reuse Rate', value: `${integrationData.componentReuseRate}%` },
      { label: 'Integration Score', value: `${integrationData.integrationScore}/100` }
    ];
    
    metrics.forEach((metric, i) => {
      const metricGroup = metricsPanel.append('g')
        .attr('transform', `translate(0, ${i * 30})`);
        
      metricGroup.append('rect')
        .attr('width', 160)
        .attr('height', 25)
        .attr('rx', 4)
        .style('fill', '#f8fafc')
        .style('stroke', '#e2e8f0');
        
      metricGroup.append('text')
        .attr('x', 8)
        .attr('y', 16)
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(metric.label);
        
      metricGroup.append('text')
        .attr('x', 152)
        .attr('y', 16)
        .style('font-size', '11px')
        .style('text-anchor', 'end')
        .style('fill', '#3b82f6')
        .text(metric.value);
    });
  };

  const generateSampleData = () => {
    const componentCategories = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
    const componentNames = {
      atoms: ['Button', 'Input', 'Icon', 'Typography', 'Color Token', 'Spacing Token'],
      molecules: ['Search Bar', 'Card', 'Navigation Item', 'Form Field', 'Alert', 'Badge'],
      organisms: ['Header', 'Footer', 'Sidebar', 'Product List', 'Form', 'Modal'],
      templates: ['Page Layout', 'Article Template', 'Dashboard Template', 'Profile Template'],
      pages: ['Home Page', 'Product Page', 'Checkout Page', 'Profile Page', 'Settings Page']
    };
    
    const sampleComponents: DesignSystemComponent[] = [];
    let componentId = 1;
    
    componentCategories.forEach(category => {
      componentNames[category].forEach(name => {
        sampleComponents.push({
          id: `comp-${componentId++}`,
          name,
          category: category as any,
          description: `${name} component for the design system`,
          status: Math.random() > 0.8 ? 'beta' : Math.random() > 0.6 ? 'deprecated' : 'stable',
          usage: {
            frequency: Math.floor(Math.random() * 500) + 50,
            contexts: ['Web App', 'Mobile App', 'Marketing Site'].filter(() => Math.random() > 0.3),
            variations: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
              id: `var-${i}`,
              name: `Variation ${i + 1}`,
              properties: { size: ['small', 'medium', 'large'][i % 3] },
              usageCount: Math.floor(Math.random() * 100)
            }))
          },
          accessibility: {
            wcagLevel: Math.random() > 0.7 ? 'AAA' : Math.random() > 0.3 ? 'AA' : 'A',
            keyboardSupport: Math.random() > 0.2,
            screenReaderSupport: Math.random() > 0.1,
            highContrastSupport: Math.random() > 0.3
          }
        });
      });
    });
    
    const sampleResults: DesignSystemResult[] = Array.from({ length: 25 }, (_, i) => ({
      participantId: `participant-${i + 1}`,
      studyId: 1,
      componentEvaluations: sampleComponents.filter(() => Math.random() > 0.3).map(component => ({
        componentId: component.id,
        usability: 1 + Math.random() * 4,
        consistency: 1 + Math.random() * 4,
        documentation: 1 + Math.random() * 4,
        accessibility: 1 + Math.random() * 4,
        feedback: ['Great component', 'Needs improvement', 'Very intuitive', 'Could be better documented'][Math.floor(Math.random() * 4)],
        improvementSuggestions: ['Better documentation', 'More examples', 'Improved accessibility'][Math.floor(Math.random() * 3)]
      })),
      overallSatisfaction: 1 + Math.random() * 4,
      adoptionMetrics: {
        componentsUsed: sampleComponents.filter(() => Math.random() > 0.4).map(c => c.id),
        customImplementations: Math.floor(Math.random() * 10),
        timeToImplement: Math.random() * 20 + 5
      }
    }));
    
    return { designSystemResults: sampleResults, components: sampleComponents };
  };

  const renderAdoptionMatrix = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chartWidth: number,
    chartHeight: number,
    data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }
  ) => {
    const categories = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
    const adoptionData = calculateAdoptionMetrics(data);

    // Create enhanced bubble chart with more sophisticated scaling
    const xScale = d3.scaleOrdinal()
      .domain(categories)
      .range(categories.map((_, i) => (chartWidth / categories.length) * (i + 0.5)));

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight - 50, 50]);

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(adoptionData, d => d.usage) || 1])
      .range(isMobile ? [3, 25] : [5, 40]);

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, 100]);
    
    const statusColorScale = d3.scaleOrdinal()
      .domain(['stable', 'beta', 'deprecated', 'planned'])
      .range(['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']);

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
    chartHeight: number,
    data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }
  ) => {
    const satisfactionData = calculateSatisfactionMetrics(data);

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
    chartHeight: number,
    data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }
  ) => {
    const usageData = calculateUsagePatterns(data);

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
    chartHeight: number,
    data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }
  ) => {
    const healthData = calculateSystemHealth(data);

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

  const calculateAdoptionMetrics = (data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }) => {
    return data.components.map(component => {
      const evaluations = data.designSystemResults.flatMap(result =>
        result.componentEvaluations.filter(eval => eval.componentId === component.id)
      );

      const adoptionRate = data.designSystemResults.length > 0 ? 
        (evaluations.length / data.designSystemResults.length) * 100 : 0;

      const avgCustomImplementations = data.designSystemResults.length > 0 ?
        data.designSystemResults.reduce((sum, result) => sum + result.adoptionMetrics.customImplementations, 0) / data.designSystemResults.length : 0;

      const avgImplementationTime = data.designSystemResults.length > 0 ?
        data.designSystemResults.reduce((sum, result) => sum + result.adoptionMetrics.timeToImplement, 0) / data.designSystemResults.length : 0;

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

  const calculateSatisfactionMetrics = (data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }) => {
    return data.components.map(component => {
      const evaluations = data.designSystemResults.flatMap(result =>
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

  const calculateUsagePatterns = (data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }) => {
    return data.components.map(component => ({
      id: component.id,
      name: component.name,
      usage: component.usage.frequency,
      category: component.category,
      variations: component.usage.variations.length
    }));
  };

  const calculateSystemHealth = (data: { designSystemResults: DesignSystemResult[]; components: DesignSystemComponent[] }) => {
    const totalComponents = data.components.length;
    const evaluatedComponents = new Set(
      data.designSystemResults.flatMap(result => 
        result.componentEvaluations.map(eval => eval.componentId)
      )
    ).size;

    const coverage = totalComponents > 0 ? (evaluatedComponents / totalComponents) * 100 : 0;

    const allEvaluations = data.designSystemResults.flatMap(result => result.componentEvaluations);
    const satisfaction = allEvaluations.length > 0 ?
      data.designSystemResults.reduce((sum, result) => sum + result.overallSatisfaction, 0) / data.designSystemResults.length : 0;

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
      health: 'Design System Health Dashboard',
      timeline: 'Adoption Timeline Analysis',
      integration: 'Component Integration Analytics'
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

  const handleExport = () => {
    if (onExport) {
      const currentData = sampleData.designSystemResults.length > 0 ? sampleData : generateSampleData();
      const exportData = {
        designSystemResults: currentData.designSystemResults,
        components: currentData.components,
        adoptionMetrics: calculateAdoptionMetrics(currentData),
        satisfactionMetrics: calculateSatisfactionMetrics(currentData),
        usagePatterns: calculateUsagePatterns(currentData),
        systemHealth: calculateSystemHealth(currentData),
        integrationMetrics: calculateIntegrationMetrics(currentData),
        exportMetadata: {
          timestamp: new Date().toISOString(),
          selectedView,
          selectedTimeframe,
          format: exportFormat
        }
      };
      onExport(exportData);
    }
  };

  return (
    <div ref={containerRef} className="bg-white p-2 sm:p-4 rounded-lg shadow border">
      {/* Export and Controls Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Design System Analytics</h3>
          {sampleData.designSystemResults.length === 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              Demo Data
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          
          {onExport && (
            <div className="flex items-center space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="png">PNG</option>
              </select>
              
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          )}
        </div>
      </div>
      <svg
        ref={svgRef}
        width={responsive ? dimensions.width : width}
        height={responsive ? dimensions.height : height}
        className="overflow-visible w-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-600">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div className="space-y-1">
            <p><strong>Evaluations:</strong> {sampleData.designSystemResults.length || 'Generated sample data'}</p>
            <p><strong>Components:</strong> {sampleData.components.length || 'Generated components'} tracked</p>
            <p><strong>Current View:</strong> {getViewTitle(selectedView)}</p>
            {isMobile && <p className="text-blue-600"><strong>Mobile view:</strong> Optimized layout</p>}
          </div>
          {metadata && (
            <div className="text-right space-y-1">
              <p><strong>Processing:</strong> {metadata.processingTime.toFixed(2)}ms</p>
              <p><strong>Optimization:</strong> {metadata.optimizationLevel}</p>
              <p><strong>Complexity:</strong> {metadata.visualizationComplexity}</p>
            </div>
          )}
        </div>
        
        <div className="mt-2 p-2 sm:p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-700">
            <strong>Design System Analytics:</strong> 
            Component adoption tracking, usage patterns, satisfaction metrics, system health monitoring, timeline analysis, and integration insights • 
            Use tabs to explore different analytical perspectives
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemMetrics;