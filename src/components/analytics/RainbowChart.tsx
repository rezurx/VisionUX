import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FrequencyAnalysis, CardSortResult } from '../../analytics';

interface RainbowChartProps {
  results: CardSortResult[];
  width?: number;
  height?: number;
}

const RainbowChart: React.FC<RainbowChartProps> = ({ 
  results, 
  width = 800, 
  height = 400 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || results.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Calculate category frequency
    const categoryFrequencies = FrequencyAnalysis.calculateCategoryFrequency(results);
    
    if (categoryFrequencies.length === 0) return;

    // Set up dimensions
    const margin = { top: 60, right: 80, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleBand()
      .domain(categoryFrequencies.map(d => d.categoryName))
      .range([0, chartWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(categoryFrequencies, d => d.percentage) || 100])
      .range([chartHeight, 0])
      .nice();

    // Color scale - rainbow colors
    const colorScale = d3.scaleOrdinal()
      .domain(categoryFrequencies.map(d => d.categoryName))
      .range([
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FFEAA7', // Yellow
        '#DDA0DD', // Plum
        '#98D8C8', // Mint
        '#F7DC6F', // Light Yellow
        '#BB8FCE', // Light Purple
        '#85C1E9'  // Light Blue
      ]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create bars
    const bars = g.selectAll('.bar')
      .data(categoryFrequencies)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.categoryName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', chartHeight)
      .attr('height', 0)
      .style('fill', d => colorScale(d.categoryName) as string)
      .style('stroke', '#fff')
      .style('stroke-width', 2);

    // Animate bars
    bars.transition()
      .duration(1000)
      .attr('y', d => yScale(d.percentage))
      .attr('height', d => chartHeight - yScale(d.percentage));

    // Add percentage labels on top of bars
    g.selectAll('.bar-label')
      .data(categoryFrequencies)
      .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => (xScale(d.categoryName) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.percentage) - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => `${d.percentage.toFixed(1)}%`)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 1);

    // Add usage count labels
    g.selectAll('.usage-label')
      .data(categoryFrequencies)
      .enter().append('text')
      .attr('class', 'usage-label')
      .attr('x', d => (xScale(d.categoryName) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.percentage) - 20)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => `${d.usage} uses`)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(750)
      .style('opacity', 1);

    // Add x-axis
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '12px');

    // Add y-axis
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
      .style('font-weight', 'bold')
      .text('Usage Percentage');

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Categories');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .style('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Category Usage Rainbow Chart');

    // Add summary statistics
    const totalParticipants = results.length;
    const mostUsedCategory = categoryFrequencies[0];
    const leastUsedCategory = categoryFrequencies[categoryFrequencies.length - 1];

    const statsGroup = svg.append('g')
      .attr('transform', `translate(${width - 250}, 60)`);

    const statsData = [
      `Total Participants: ${totalParticipants}`,
      `Most Used: ${mostUsedCategory.categoryName} (${mostUsedCategory.percentage.toFixed(1)}%)`,
      `Least Used: ${leastUsedCategory.categoryName} (${leastUsedCategory.percentage.toFixed(1)}%)`
    ];

    statsGroup.selectAll('.stat-text')
      .data(statsData)
      .enter().append('text')
      .attr('class', 'stat-text')
      .attr('x', 0)
      .attr('y', (_d, i) => i * 18)
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(d => d);

    // Add interactivity
    bars.on('mouseover', function(event, d) {
      d3.select(this)
        .style('opacity', 0.8)
        .style('stroke-width', 3);
      
      // Create tooltip
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('pointer-events', 'none')
        .style('font-size', '12px')
        .style('z-index', '1000');

      const topCards = d.cards.slice(0, 3);
      const tooltipText = `
        <strong>${d.categoryName}</strong><br/>
        Usage: ${d.usage}/${totalParticipants} (${d.percentage.toFixed(1)}%)<br/>
        Top Cards: ${topCards.map(c => c.text).join(', ')}
      `;

      tooltip.html(tooltipText)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('opacity', 1)
        .style('stroke-width', 2);
      
      d3.select('.tooltip').remove();
    });

  }, [results, width, height]);

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">No card sorting data available for frequency analysis</p>
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
        <p><strong>How to read:</strong> Bar height shows how often each category was used. Hover for details.</p>
        <p><strong>Participants:</strong> {results.length} | <strong>Shows:</strong> Category popularity and usage patterns</p>
      </div>
    </div>
  );
};

export default RainbowChart;