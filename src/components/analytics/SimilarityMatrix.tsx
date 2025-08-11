import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimilarityAnalysis, CardSortResult, PerformanceOptimizer } from '../../analytics';

interface SimilarityMatrixProps {
  results: CardSortResult[];
  width?: number;
  height?: number;
  responsive?: boolean;
}

const SimilarityMatrix: React.FC<SimilarityMatrixProps> = ({ 
  results, 
  width = 600, 
  height = 600,
  responsive = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sizing
  useEffect(() => {
    if (!responsive) return;
    
    const handleResize = PerformanceOptimizer.throttle(() => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = Math.min(containerWidth, 700);
        const mobile = window.innerWidth < 768;
        
        setDimensions({ 
          width: Math.max(containerWidth, 300), 
          height: Math.max(containerHeight, 300) 
        });
        setIsMobile(mobile);
      }
    }, 250);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive]);

  useEffect(() => {
    if (!svgRef.current || results.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render
    
    const currentWidth = responsive ? dimensions.width : width;
    const currentHeight = responsive ? dimensions.height : height;

    // Get card names for labels
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

    if (cardNames.length === 0) return;

    // Calculate similarity matrix
    const similarityMatrix = SimilarityAnalysis.createSimilarityMatrix(results);
    const n = cardNames.length;

    // Set up dimensions with mobile adaptations
    const margin = isMobile 
      ? { top: 60, right: 15, bottom: 60, left: 60 }
      : { top: 80, right: 20, bottom: 20, left: 80 };
    const cellSize = Math.min(
      (currentWidth - margin.left - margin.right) / n, 
      (currentHeight - margin.top - margin.bottom) / n,
      isMobile ? 25 : 50 // Smaller cells on mobile
    );

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 1]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create cells
    const rows = g.selectAll('.row')
      .data(similarityMatrix)
      .enter().append('g')
      .attr('class', 'row')
      .attr('transform', (_d, i) => `translate(0, ${i * cellSize})`);

    rows.selectAll('.cell')
      .data((_d, i) => _d.map((value, j) => ({ value, row: i, col: j })))
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => d.col * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .style('fill', d => colorScale(d.value))
      .style('stroke', '#fff')
      .style('stroke-width', 1);

    // Add value labels (conditional based on size)
    if (cellSize > 20) {
      rows.selectAll('.cell-text')
        .data((_d, i) => _d.map((value, j) => ({ value, row: i, col: j })))
        .enter().append('text')
        .attr('class', 'cell-text')
        .attr('x', d => d.col * cellSize + cellSize / 2)
        .attr('y', cellSize / 2)
        .attr('dy', '.35em')
        .style('text-anchor', 'middle')
        .style('fill', d => d.value > 0.5 ? 'white' : 'black')
        .style('font-size', `${Math.min(cellSize / 4, isMobile ? 8 : 12)}px`)
        .text(d => isMobile && cellSize < 30 ? d.value.toFixed(1) : d.value.toFixed(2));
    }

    // Add row labels with mobile adaptations
    g.selectAll('.row-label')
      .data(cardNames)
      .enter().append('text')
      .attr('class', 'row-label')
      .attr('x', -10)
      .attr('y', (_d, i) => i * cellSize + cellSize / 2)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .style('font-size', `${Math.min(cellSize / 3, isMobile ? 10 : 14)}px`)
      .style('font-weight', 'bold')
      .text(d => {
        const maxLength = isMobile ? 8 : 15;
        return d.length > maxLength ? d.substring(0, maxLength) + '...' : d;
      });

    // Add column labels with mobile adaptations
    g.selectAll('.col-label')
      .data(cardNames)
      .enter().append('text')
      .attr('class', 'col-label')
      .attr('x', (_d, i) => i * cellSize + cellSize / 2)
      .attr('y', -10)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', `${Math.min(cellSize / 3, isMobile ? 10 : 14)}px`)
      .style('font-weight', 'bold')
      .attr('transform', (_d, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -10)`)
      .text(d => {
        const maxLength = isMobile ? 8 : 15;
        return d.length > maxLength ? d.substring(0, maxLength) + '...' : d;
      });

    // Add title with responsive sizing
    svg.append('text')
      .attr('x', currentWidth / 2)
      .attr('y', 20)
      .style('text-anchor', 'middle')
      .style('font-size', isMobile ? '16px' : '18px')
      .style('font-weight', 'bold')
      .text('Card Similarity Matrix');

    // Add legend with mobile adaptations
    const legendWidth = isMobile ? 150 : 200;
    const legendHeight = isMobile ? 15 : 20;
    const legendX = currentWidth - legendWidth - (isMobile ? 10 : 20);
    const legendY = isMobile ? currentHeight - 60 : 40;

    const legendScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'));

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Create gradient for legend
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.selectAll('stop')
      .data(d3.range(0, 1.1, 0.1))
      .enter().append('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(d));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis);

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .style('text-anchor', 'middle')
      .style('font-size', isMobile ? '10px' : '12px')
      .text('Similarity Score');

  }, [results, dimensions.width, dimensions.height, isMobile]);

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">No card sorting data available for similarity analysis</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white p-2 sm:p-4 rounded-lg shadow border">
      <svg
        ref={svgRef}
        width={responsive ? dimensions.width : width}
        height={responsive ? dimensions.height : height}
        className="overflow-visible w-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-600">
        <p className="mb-1"><strong>How to read:</strong> Darker blue = higher similarity. Cards placed together more often have higher similarity scores.</p>
        <p><strong>Participants:</strong> {results.length} | <strong>Matrix shows:</strong> How frequently cards are grouped together</p>
        {isMobile && <p className="text-xs text-blue-600 mt-1"><strong>Mobile view:</strong> Some labels may be abbreviated for better visibility</p>}
      </div>
    </div>
  );
};

export default SimilarityMatrix;