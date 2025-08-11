import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SurveyResult, SurveyQuestion, AnalyticsMetadata } from '../../types';
import { PerformanceOptimizer } from '../../analytics';

interface SurveyAnalyticsProps {
  surveyResults: SurveyResult[];
  questions: SurveyQuestion[];
  width?: number;
  height?: number;
  interactive?: boolean;
  showStatistics?: boolean;
  enableExport?: boolean;
  onExport?: (format: 'csv' | 'json' | 'pdf') => void;
}

interface SurveyStatistics {
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  averageResponseTime: number;
  dropOffPoints: { questionId: string; dropOffRate: number }[];
  responseQuality: {
    score: number;
    flags: string[];
  };
}

const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({
  surveyResults,
  questions,
  width = 900,
  height = 600,
  interactive = true,
  showStatistics = true,
  enableExport = true,
  onExport
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [statistics, setStatistics] = useState<SurveyStatistics | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'responses' | 'analytics'>('overview');

  // Calculate survey statistics
  const calculateStatistics = useCallback((): SurveyStatistics => {
    const totalResponses = surveyResults.length;
    const completedResponses = surveyResults.filter(result => 
      result.results?.responses?.length === questions.length
    ).length;
    
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
    
    // Calculate average completion time
    const completionTimes = surveyResults
      .filter(result => result.results?.completionTime)
      .map(result => result.results.completionTime);
    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length / 1000 / 60 // Convert to minutes
      : 0;

    // Calculate average response time per question
    const allResponseTimes = surveyResults.flatMap(result => 
      result.results?.responses?.map((response: any) => response.responseTime) || []
    );
    const averageResponseTime = allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length / 1000 // Convert to seconds
      : 0;

    // Calculate drop-off points
    const dropOffPoints = questions.map(question => {
      const questionResponses = surveyResults.filter(result =>
        result.results?.responses?.some((response: any) => response.questionId === question.id)
      ).length;
      const dropOffRate = totalResponses > 0 ? ((totalResponses - questionResponses) / totalResponses) * 100 : 0;
      return {
        questionId: question.id,
        dropOffRate
      };
    });

    // Calculate response quality
    let qualityScore = 100;
    const qualityFlags: string[] = [];
    
    // Check for very fast responses (potential quality issues)
    const fastResponses = allResponseTimes.filter(time => time < 1000).length;
    if (fastResponses > allResponseTimes.length * 0.2) {
      qualityScore -= 20;
      qualityFlags.push('High number of very fast responses');
    }

    // Check completion rate
    if (completionRate < 50) {
      qualityScore -= 15;
      qualityFlags.push('Low completion rate');
    }

    // Check for consistent response patterns
    const ratingQuestions = questions.filter(q => q.type === 'rating-scale');
    if (ratingQuestions.length > 0) {
      const consistentRatings = surveyResults.filter(result => {
        const ratings = result.results?.responses?.filter((response: any) => 
          ratingQuestions.some(q => q.id === response.questionId)
        ).map((response: any) => response.response) || [];
        
        // Check if all ratings are the same (straight-lining)
        return ratings.length > 2 && new Set(ratings).size === 1;
      }).length;

      if (consistentRatings > totalResponses * 0.1) {
        qualityScore -= 10;
        qualityFlags.push('Potential straight-lining detected');
      }
    }

    return {
      totalResponses,
      completionRate,
      averageCompletionTime,
      averageResponseTime,
      dropOffPoints,
      responseQuality: {
        score: Math.max(0, qualityScore),
        flags: qualityFlags
      }
    };
  }, [surveyResults, questions]);

  useEffect(() => {
    if (surveyResults.length > 0 && questions.length > 0) {
      setStatistics(calculateStatistics());
    }
  }, [surveyResults, questions, calculateStatistics]);
  
  useEffect(() => {
    if (!svgRef.current || surveyResults.length === 0 || questions.length === 0) return;
    
    const startTime = performance.now();
    const shouldOptimize = PerformanceOptimizer.shouldOptimize(surveyResults.length);
    
    renderSurveyVisualization();
    
    const endTime = performance.now();
    setMetadata({
      datasetSize: surveyResults.length,
      processingTime: endTime - startTime,
      optimizationLevel: shouldOptimize ? 'advanced' : 'none',
      cacheStatus: 'miss',
      visualizationComplexity: 'medium'
    });
  }, [surveyResults, questions, selectedQuestion, width, height]);

  const renderSurveyVisualization = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 60, right: 120, bottom: 80, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // If a specific question is selected, show detailed analysis
    if (selectedQuestion) {
      renderQuestionDetail(g, chartWidth, chartHeight);
    } else {
      renderOverviewChart(g, chartWidth, chartHeight);
    }

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text(selectedQuestion ? `Question Analysis: ${getQuestionText(selectedQuestion)}` : 'Survey Response Overview');
  };

  const renderOverviewChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, chartWidth: number, chartHeight: number) => {
    // Calculate response rates for each question
    const questionData = questions.map(question => {
      const responses = surveyResults.flatMap(result => 
        result.responses.filter(r => r.questionId === question.id)
      );
      
      const responseRate = surveyResults.length > 0 ? (responses.length / surveyResults.length) * 100 : 0;
      const avgResponseTime = responses.length > 0 
        ? responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length / 1000
        : 0;

      return {
        id: question.id,
        question: question.question,
        type: question.type,
        responseRate,
        avgResponseTime,
        responseCount: responses.length
      };
    });

    // Create scales
    const xScale = d3.scaleBand()
      .domain(questionData.map(d => d.id))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    const timeScale = d3.scaleLinear()
      .domain([0, d3.max(questionData, d => d.avgResponseTime) || 10])
      .range([5, 15]);

    // Color scale by question type
    const colorScale = d3.scaleOrdinal()
      .domain(['multiple-choice', 'rating-scale', 'text', 'boolean', 'ranking'])
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);

    // Create bars for response rates
    const bars = g.selectAll('.response-bar')
      .data(questionData)
      .enter().append('rect')
      .attr('class', 'response-bar')
      .attr('x', d => xScale(d.id) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', chartHeight)
      .attr('height', 0)
      .style('fill', d => colorScale(d.type) as string)
      .style('opacity', 0.8)
      .style('cursor', interactive ? 'pointer' : 'default');

    // Animate bars
    bars.transition()
      .duration(1000)
      .attr('y', d => yScale(d.responseRate))
      .attr('height', d => chartHeight - yScale(d.responseRate));

    // Add response time circles
    const circles = g.selectAll('.time-circle')
      .data(questionData)
      .enter().append('circle')
      .attr('class', 'time-circle')
      .attr('cx', d => (xScale(d.id) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.responseRate) - timeScale(d.avgResponseTime) - 5)
      .attr('r', 0)
      .style('fill', '#ff6b6b')
      .style('opacity', 0.7);

    circles.transition()
      .duration(1000)
      .delay(500)
      .attr('r', d => timeScale(d.avgResponseTime));

    // Add response rate labels
    g.selectAll('.rate-label')
      .data(questionData)
      .enter().append('text')
      .attr('class', 'rate-label')
      .attr('x', d => (xScale(d.id) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.responseRate) - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text(d => `${d.responseRate.toFixed(1)}%`)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(750)
      .style('opacity', 1);

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d, i) => `Q${i + 1}`);
    
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d}%`);
    
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Response Rate (%)');

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Survey Questions');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth + 20}, 20)`);

    const legendData = [
      { color: '#3b82f6', label: 'Multiple Choice' },
      { color: '#10b981', label: 'Rating Scale' },
      { color: '#f59e0b', label: 'Text Input' },
      { color: '#ef4444', label: 'Boolean' },
      { color: '#8b5cf6', label: 'Ranking' },
      { color: '#ff6b6b', label: 'Avg Response Time' }
    ];

    legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .each(function(d, i) {
        const item = d3.select(this);
        
        if (i === legendData.length - 1) {
          // Circle for response time
          item.append('circle')
            .attr('cx', 6)
            .attr('cy', 0)
            .attr('r', 6)
            .style('fill', d.color);
        } else {
          // Rectangle for question types
          item.append('rect')
            .attr('x', 0)
            .attr('y', -6)
            .attr('width', 12)
            .attr('height', 12)
            .style('fill', d.color);
        }
        
        item.append('text')
          .attr('x', 20)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .style('font-size', '12px')
          .text(d.label);
      });

    // Add interactivity
    if (interactive) {
      bars.on('click', (event, d) => {
        setSelectedQuestion(d.id);
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('opacity', 1)
          .style('stroke', '#374151')
          .style('stroke-width', 2);

        // Tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'survey-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        tooltip.html(`
          <strong>${d.question}</strong><br/>
          Type: ${d.type}<br/>
          Response Rate: ${d.responseRate.toFixed(1)}%<br/>
          Responses: ${d.responseCount}/${surveyResults.length}<br/>
          Avg Response Time: ${d.avgResponseTime.toFixed(1)}s
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke', 'none');
        
        d3.select('.survey-tooltip').remove();
      });
    }
  };

  const renderQuestionDetail = (g: d3.Selection<SVGGElement, unknown, null, undefined>, chartWidth: number, chartHeight: number) => {
    const question = questions.find(q => q.id === selectedQuestion);
    if (!question) return;

    const responses = surveyResults.flatMap(result => 
      result.responses.filter(r => r.questionId === selectedQuestion)
    );

    switch (question.type) {
      case 'multiple-choice':
        renderMultipleChoiceAnalysis(g, question, responses, chartWidth, chartHeight);
        break;
      case 'rating-scale':
        renderRatingScaleAnalysis(g, question, responses, chartWidth, chartHeight);
        break;
      case 'boolean':
        renderBooleanAnalysis(g, question, responses, chartWidth, chartHeight);
        break;
      default:
        renderTextAnalysis(g, question, responses, chartWidth, chartHeight);
    }
  };

  const renderMultipleChoiceAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    question: SurveyQuestion, 
    responses: any[], 
    chartWidth: number, 
    chartHeight: number
  ) => {
    // Count responses by option
    const optionCounts = new Map<string, number>();
    question.options?.forEach(option => optionCounts.set(option.id, 0));

    responses.forEach(response => {
      const count = optionCounts.get(response.response) || 0;
      optionCounts.set(response.response, count + 1);
    });

    const data = Array.from(optionCounts.entries()).map(([optionId, count]) => {
      const option = question.options?.find(o => o.id === optionId);
      return {
        id: optionId,
        text: option?.text || optionId,
        count,
        percentage: responses.length > 0 ? (count / responses.length) * 100 : 0
      };
    }).sort((a, b) => b.count - a.count);

    // Create pie chart
    const radius = Math.min(chartWidth, chartHeight) / 2 - 40;
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;

    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    const colorScale = d3.scaleOrdinal(d3.schemeSet3);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    arcs.append('path')
      .attr('d', arc)
      .style('fill', (d, i) => colorScale(i.toString()))
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 0.8);

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => `${d.data.percentage.toFixed(1)}%`)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 1);

    // Add legend with option texts
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth + 20}, 50)`);

    legend.selectAll('.option-legend')
      .data(data)
      .enter().append('g')
      .attr('class', 'option-legend')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .each(function(d, i) {
        const item = d3.select(this);
        
        item.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .style('fill', colorScale(i.toString()));
        
        item.append('text')
          .attr('x', 20)
          .attr('y', 7.5)
          .attr('dy', '0.35em')
          .style('font-size', '11px')
          .text(`${d.text} (${d.count})`);
      });
  };

  const renderRatingScaleAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    question: SurveyQuestion, 
    responses: any[], 
    chartWidth: number, 
    chartHeight: number
  ) => {
    const scale = question.scale || { min: 1, max: 5 };
    const ratings = responses.map(r => r.response);
    
    // Calculate statistics
    const mean = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    const sortedRatings = [...ratings].sort((a, b) => a - b);
    const median = sortedRatings.length > 0 ? sortedRatings[Math.floor(sortedRatings.length / 2)] : 0;
    
    // Create histogram
    const bins = d3.range(scale.min, scale.max + 1);
    const counts = bins.map(bin => ({
      value: bin,
      count: ratings.filter(r => r === bin).length,
      percentage: ratings.length > 0 ? (ratings.filter(r => r === bin).length / ratings.length) * 100 : 0
    }));

    const xScale = d3.scaleBand()
      .domain(bins.map(String))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(counts, d => d.count) || 1])
      .range([chartHeight - 100, 50]);

    // Create bars
    g.selectAll('.rating-bar')
      .data(counts)
      .enter().append('rect')
      .attr('class', 'rating-bar')
      .attr('x', d => xScale(String(d.value)) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', chartHeight - 100)
      .attr('height', 0)
      .style('fill', '#3b82f6')
      .style('opacity', 0.8)
      .transition()
      .duration(1000)
      .attr('y', d => yScale(d.count))
      .attr('height', d => (chartHeight - 100) - yScale(d.count));

    // Add count labels
    g.selectAll('.count-label')
      .data(counts)
      .enter().append('text')
      .attr('class', 'count-label')
      .attr('x', d => (xScale(String(d.value)) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => d.count)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 1);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight - 100})`)
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale);
    g.append('g')
      .call(yAxis);

    // Add statistics summary
    const statsY = chartHeight - 60;
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', statsY)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`Mean: ${mean.toFixed(2)} | Median: ${median} | Responses: ${ratings.length}`);
  };

  const renderBooleanAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    question: SurveyQuestion, 
    responses: any[], 
    chartWidth: number, 
    chartHeight: number
  ) => {
    const trueCount = responses.filter(r => r.response === true).length;
    const falseCount = responses.filter(r => r.response === false).length;
    
    const data = [
      { label: 'Yes/True', count: trueCount, percentage: responses.length > 0 ? (trueCount / responses.length) * 100 : 0 },
      { label: 'No/False', count: falseCount, percentage: responses.length > 0 ? (falseCount / responses.length) * 100 : 0 }
    ];

    // Create simple bar chart
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, chartWidth / 2])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 1])
      .range([chartHeight / 2, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(['Yes/True', 'No/False'])
      .range(['#10b981', '#ef4444']);

    g.selectAll('.bool-bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bool-bar')
      .attr('x', d => (xScale(d.label) || 0) + chartWidth / 4)
      .attr('width', xScale.bandwidth())
      .attr('y', chartHeight / 2)
      .attr('height', 0)
      .style('fill', d => colorScale(d.label) as string)
      .style('opacity', 0.8)
      .transition()
      .duration(1000)
      .attr('y', d => yScale(d.count) + chartHeight / 4)
      .attr('height', d => (chartHeight / 2) - yScale(d.count));

    // Add percentage labels
    g.selectAll('.bool-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'bool-label')
      .attr('x', d => (xScale(d.label) || 0) + chartWidth / 4 + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) + chartHeight / 4 - 10)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(d => `${d.percentage.toFixed(1)}%`)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 1);
  };

  const renderTextAnalysis = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    question: SurveyQuestion, 
    responses: any[], 
    chartWidth: number, 
    chartHeight: number
  ) => {
    // Simple text response statistics
    const wordCounts = responses.map(r => String(r.response).split(/\s+/).length);
    const avgWordCount = wordCounts.length > 0 ? wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length : 0;
    
    // Display statistics
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight / 2 - 40)
      .style('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Text Response Analysis');

    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(`Total Responses: ${responses.length}`);

    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight / 2 + 30)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(`Average Word Count: ${avgWordCount.toFixed(1)}`);

    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight / 2 + 60)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('(Detailed text analysis requires NLP processing)');
  };

  const getQuestionText = (questionId: string): string => {
    const question = questions.find(q => q.id === questionId);
    return question ? (question.question.length > 50 ? question.question.substring(0, 50) + '...' : question.question) : '';
  };

  const handleBackToOverview = () => {
    setSelectedQuestion(null);
  };

  if (surveyResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">No survey data available for analysis</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Enhanced Header with Navigation */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeView === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('responses')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeView === 'responses'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Response Details
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeView === 'analytics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Advanced Analytics
            </button>
          </div>
          
          {enableExport && onExport && (
            <div className="flex space-x-2">
              <button
                onClick={() => onExport('csv')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Export CSV
              </button>
              <button
                onClick={() => onExport('json')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Export JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      {showStatistics && statistics && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalResponses}</div>
              <div className="text-sm text-gray-600">Total Responses</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{statistics.completionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{statistics.averageCompletionTime.toFixed(1)}m</div>
              <div className="text-sm text-gray-600">Avg. Completion</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-orange-600">{statistics.responseQuality.score}</div>
                <div className={`text-sm px-2 py-1 rounded ${
                  statistics.responseQuality.score >= 80 ? 'bg-green-100 text-green-700' :
                  statistics.responseQuality.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {statistics.responseQuality.score >= 80 ? 'Good' :
                   statistics.responseQuality.score >= 60 ? 'Fair' : 'Poor'}
                </div>
              </div>
              <div className="text-sm text-gray-600">Data Quality</div>
            </div>
          </div>
          
          {statistics.responseQuality.flags.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 mb-1">Data Quality Alerts:</div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {statistics.responseQuality.flags.map((flag, index) => (
                  <li key={index}>• {flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        {selectedQuestion && (
          <button
            onClick={handleBackToOverview}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            ← Back to Overview
          </button>
        )}
        
        {activeView === 'overview' && (
          <div>
            <svg
              ref={svgRef}
              width={width}
              height={height}
              className="overflow-visible"
            />
          </div>
        )}

        {activeView === 'responses' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Individual Responses</h3>
            {surveyResults.slice(0, 10).map((result, index) => (
              <div key={result.participantId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Participant {index + 1}</span>
                  <span className="text-sm text-gray-500">
                    {result.results?.completionTime ? 
                      `${(result.results.completionTime / 1000 / 60).toFixed(1)} min` : 
                      'Incomplete'
                    }
                  </span>
                </div>
                <div className="space-y-2">
                  {result.results?.responses?.slice(0, 3).map((response: any) => {
                    const question = questions.find(q => q.id === response.questionId);
                    return (
                      <div key={response.questionId} className="text-sm">
                        <span className="font-medium">{question?.question}</span>
                        <span className="ml-2 text-gray-600">{response.response}</span>
                      </div>
                    );
                  })}
                  {(result.results?.responses?.length || 0) > 3 && (
                    <div className="text-sm text-gray-500">
                      +{(result.results?.responses?.length || 0) - 3} more responses
                    </div>
                  )}
                </div>
              </div>
            ))}
            {surveyResults.length > 10 && (
              <div className="text-center text-gray-500">
                Showing first 10 responses of {surveyResults.length} total
              </div>
            )}
          </div>
        )}

        {activeView === 'analytics' && statistics && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Drop-off Analysis</h3>
              <div className="space-y-2">
                {statistics.dropOffPoints.map(point => {
                  const question = questions.find(q => q.id === point.questionId);
                  return (
                    <div key={point.questionId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{question?.question}</div>
                        <div className="text-sm text-gray-600">Question {questions.indexOf(question!) + 1}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          point.dropOffRate < 10 ? 'text-green-600' :
                          point.dropOffRate < 25 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {point.dropOffRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">drop-off</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Response Time Analysis</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  Average response time per question: {statistics.averageResponseTime.toFixed(1)} seconds
                </div>
                <div className="text-sm text-gray-600">
                  Total completion time: {statistics.averageCompletionTime.toFixed(1)} minutes
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with metadata */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <div>
            <p><strong>Survey Responses:</strong> {surveyResults.length} participants</p>
            <p><strong>Questions:</strong> {questions.length} total</p>
            {!selectedQuestion && activeView === 'overview' && (
              <p><strong>Tip:</strong> Click on any bar to see detailed question analysis</p>
            )}
          </div>
          {metadata && (
            <div className="text-right">
              <p><strong>Processing:</strong> {metadata.processingTime.toFixed(2)}ms</p>
              <p><strong>Optimization:</strong> {metadata.optimizationLevel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyAnalytics;