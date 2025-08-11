import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SimilarityAnalysis, HierarchicalClustering, CardSortResult } from '../../analytics';

interface DendrogramProps {
  results: CardSortResult[];
  width?: number;
  height?: number;
}

const Dendrogram: React.FC<DendrogramProps> = ({ 
  results, 
  width = 800, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || results.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Get card names
    const cardNames: string[] = [];
    if (results.length > 0) {
      results[0].cardSortResults.forEach(category => {
        category.cards.forEach(card => {
          if (!cardNames.includes(card.text)) {
            cardNames.push(card.text);
          }
        });
      });
    }

    if (cardNames.length < 2) return;

    // Calculate similarity matrix and perform clustering
    const similarityMatrix = SimilarityAnalysis.createSimilarityMatrix(results);
    const clusterTree = HierarchicalClustering.cluster(similarityMatrix, cardNames);

    // Set up dimensions
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create tree layout
    const tree = d3.tree<any>()
      .size([chartHeight, chartWidth])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Create hierarchy and calculate layout
    const hierarchy = d3.hierarchy(clusterTree);
    tree(hierarchy);

    // Color scale based on cluster distance
    const maxDistance = d3.max(hierarchy.descendants(), d => d.data.distance) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, maxDistance]);

    // Draw links
    const links = g.selectAll('.link')
      .data(hierarchy.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .style('fill', 'none')
      .style('stroke', '#666')
      .style('stroke-width', 2)
      .style('opacity', 0);

    // Animate links
    links.transition()
      .duration(1000)
      .style('opacity', 1);

    // Draw nodes
    const nodes = g.selectAll('.node')
      .data(hierarchy.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // Add circles for internal nodes
    nodes.filter(d => !!d.children)
      .append('circle')
      .attr('r', 0)
      .style('fill', d => colorScale(d.data.distance))
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .transition()
      .duration(1000)
      .delay(500)
      .attr('r', 6);

    // Add rectangles for leaf nodes
    const leafNodes = nodes.filter(d => !d.children);
    
    leafNodes.append('rect')
      .attr('x', -40)
      .attr('y', -10)
      .attr('width', 80)
      .attr('height', 20)
      .attr('rx', 4)
      .style('fill', '#e3f2fd')
      .style('stroke', '#1976d2')
      .style('stroke-width', 1)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(750)
      .style('opacity', 1);

    // Add text labels for leaf nodes (card names)
    leafNodes.append('text')
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#1976d2')
      .style('opacity', 0)
      .text(d => {
        const cardName = d.data.name;
        return cardName.length > 12 ? cardName.substring(0, 12) + '...' : cardName;
      })
      .transition()
      .duration(1000)
      .delay(1000)
      .style('opacity', 1);

    // Add distance labels for internal nodes
    nodes.filter(d => !!d.children)
      .append('text')
      .attr('dy', -10)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .style('opacity', 0)
      .text(d => d.data.distance.toFixed(2))
      .transition()
      .duration(1000)
      .delay(1250)
      .style('opacity', 1);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .style('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Card Relationship Dendrogram');

    // Add scale/legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 20;
    const legendY = height - 60;

    const legendScale = d3.scaleLinear()
      .domain([0, maxDistance])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.2f'));

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Create gradient for legend
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'dendrogram-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    const gradientStops = d3.range(0, 1.1, 0.1);
    gradient.selectAll('stop')
      .data(gradientStops)
      .enter().append('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(d * maxDistance));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#dendrogram-gradient)');

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis);

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Cluster Distance');

    // Add interactivity
    leafNodes.on('mouseover', function(event, d) {
      d3.select(this).select('rect')
        .style('fill', '#bbdefb')
        .style('stroke-width', 2);

      // Find related cards in the same cluster
      const findLeafSiblings = (node: any): any[] => {
        if (!node.parent) return [];
        const siblings = node.parent.children.filter((child: any) => child !== node);
        const leafSiblings: any[] = [];
        
        const collectLeaves = (n: any) => {
          if (!n.children) {
            leafSiblings.push(n);
          } else {
            n.children.forEach(collectLeaves);
          }
        };
        
        siblings.forEach(collectLeaves);
        return leafSiblings;
      };

      const relatedCards = findLeafSiblings(d);
      
      // Highlight related cards
      relatedCards.forEach(related => {
        leafNodes.filter(n => n === related)
          .select('rect')
          .style('fill', '#ffecb3')
          .style('stroke', '#f57c00')
          .style('stroke-width', 2);
      });

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

      const tooltipText = `
        <strong>${d.data.name}</strong><br/>
        Cluster Distance: ${d.parent?.data.distance.toFixed(3) || 'N/A'}<br/>
        Related Cards: ${relatedCards.map(n => n.data.name).join(', ') || 'None in immediate cluster'}
      `;

      tooltip.html(tooltipText)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      // Reset all card styling
      leafNodes.select('rect')
        .style('fill', '#e3f2fd')
        .style('stroke', '#1976d2')
        .style('stroke-width', 1);
      
      d3.select('.tooltip').remove();
    });

  }, [results, width, height]);

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">No card sorting data available for dendrogram analysis</p>
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
        <p><strong>How to read:</strong> Cards that branch together are frequently grouped by participants. Lower distances = stronger relationships.</p>
        <p><strong>Participants:</strong> {results.length} | <strong>Shows:</strong> Hierarchical relationships between cards based on co-occurrence</p>
      </div>
    </div>
  );
};

export default Dendrogram;