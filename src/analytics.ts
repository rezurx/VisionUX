// Data analysis utilities for Card Sorting Application
// Supporting advanced visualizations: dendrogram, similarity matrix, rainbow chart

export interface CardSortResult {
  participantId: string;
  studyId: number;
  cardSortResults: {
    categoryId: number;
    categoryName: string;
    cards: { id: number; text: string }[];
  }[];
}

export interface TreeTestResult {
  participantId: string;
  studyId: number;
  treeTestResults: {
    task: string;
    path: string[];
    success: boolean;
    clicks: number;
  };
}

export interface SimilarityPair {
  cardId1: number;
  cardId2: number;
  cardName1: string;
  cardName2: string;
  coOccurrence: number;
  similarity: number;
}

export interface CategoryFrequency {
  categoryId: number;
  categoryName: string;
  usage: number;
  percentage: number;
  cards: { id: number; text: string; frequency: number }[];
}

// Similarity Matrix Calculations
export class SimilarityAnalysis {
  /**
   * Calculate card-to-card similarity based on how often they're grouped together
   */
  static calculateCardSimilarity(results: CardSortResult[]): SimilarityPair[] {
    const cardPairs = new Map<string, SimilarityPair>();
    const totalParticipants = results.length;
    
    // Get all unique cards from first result
    const allCards: { id: number; text: string }[] = [];
    if (results.length > 0) {
      results[0].cardSortResults.forEach(category => {
        category.cards.forEach(card => {
          if (!allCards.find(c => c.id === card.id)) {
            allCards.push(card);
          }
        });
      });
    }
    
    // Calculate co-occurrence for each card pair
    for (let i = 0; i < allCards.length; i++) {
      for (let j = i + 1; j < allCards.length; j++) {
        const card1 = allCards[i];
        const card2 = allCards[j];
        const pairKey = `${Math.min(card1.id, card2.id)}-${Math.max(card1.id, card2.id)}`;
        
        let coOccurrence = 0;
        
        // Count how many participants put these cards in the same category
        results.forEach(result => {
          const foundInSameCategory = result.cardSortResults.some(category => 
            category.cards.some(c => c.id === card1.id) &&
            category.cards.some(c => c.id === card2.id)
          );
          
          if (foundInSameCategory) {
            coOccurrence++;
          }
        });
        
        const similarity = totalParticipants > 0 ? coOccurrence / totalParticipants : 0;
        
        cardPairs.set(pairKey, {
          cardId1: card1.id,
          cardId2: card2.id,
          cardName1: card1.text,
          cardName2: card2.text,
          coOccurrence,
          similarity
        });
      }
    }
    
    return Array.from(cardPairs.values()).sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Create a similarity matrix for visualization
   */
  static createSimilarityMatrix(results: CardSortResult[]): number[][] {
    const similarities = this.calculateCardSimilarity(results);
    
    // Get all unique cards
    const allCards: { id: number; text: string }[] = [];
    if (results.length > 0) {
      results[0].cardSortResults.forEach(category => {
        category.cards.forEach(card => {
          if (!allCards.find(c => c.id === card.id)) {
            allCards.push(card);
          }
        });
      });
    }
    
    const matrix: number[][] = Array(allCards.length).fill(null).map(() => Array(allCards.length).fill(0));
    
    // Fill diagonal with 1.0 (perfect similarity with self)
    for (let i = 0; i < allCards.length; i++) {
      matrix[i][i] = 1.0;
    }
    
    // Fill matrix with similarity values
    similarities.forEach(sim => {
      const index1 = allCards.findIndex(c => c.id === sim.cardId1);
      const index2 = allCards.findIndex(c => c.id === sim.cardId2);
      
      if (index1 !== -1 && index2 !== -1) {
        matrix[index1][index2] = sim.similarity;
        matrix[index2][index1] = sim.similarity; // Symmetric matrix
      }
    });
    
    return matrix;
  }
}

// Hierarchical Clustering for Dendrogram
export class HierarchicalClustering {
  /**
   * Perform hierarchical clustering using Ward's method
   */
  static cluster(similarityMatrix: number[][], cardNames: string[]): ClusterNode {
    const n = similarityMatrix.length;
    if (n === 0) return { name: 'Empty', children: [], distance: 0 };
    
    // Convert similarity to distance (1 - similarity)
    const distanceMatrix = similarityMatrix.map(row => 
      row.map(sim => 1 - sim)
    );
    
    // Initialize clusters (each card starts as its own cluster)
    const clusters: ClusterNode[] = cardNames.map((name, i) => ({
      name,
      children: [],
      distance: 0,
      cardIndex: i
    }));
    
    const distances = [...distanceMatrix.map(row => [...row])];
    
    // Merge clusters until only one remains
    while (clusters.length > 1) {
      let minDistance = Infinity;
      let mergeI = 0, mergeJ = 1;
      
      // Find closest pair of clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const dist = this.getClusterDistance(clusters[i], clusters[j], distances);
          if (dist < minDistance) {
            minDistance = dist;
            mergeI = i;
            mergeJ = j;
          }
        }
      }
      
      // Merge the closest clusters
      const newCluster: ClusterNode = {
        name: `Cluster_${clusters.length}`,
        children: [clusters[mergeI], clusters[mergeJ]],
        distance: minDistance,
        size: (clusters[mergeI].size || 1) + (clusters[mergeJ].size || 1)
      };
      
      // Remove merged clusters and add new one
      const newClusters = clusters.filter((_, idx) => idx !== mergeI && idx !== mergeJ);
      newClusters.push(newCluster);
      clusters.splice(0, clusters.length, ...newClusters);
    }
    
    return clusters[0];
  }
  
  private static getClusterDistance(cluster1: ClusterNode, cluster2: ClusterNode, distances: number[][]): number {
    // For simplicity, use average linkage
    if (cluster1.cardIndex !== undefined && cluster2.cardIndex !== undefined) {
      return distances[cluster1.cardIndex][cluster2.cardIndex];
    }
    
    // For merged clusters, compute average distance
    const indices1 = this.getCardIndices(cluster1);
    const indices2 = this.getCardIndices(cluster2);
    
    let totalDistance = 0;
    let count = 0;
    
    indices1.forEach(i1 => {
      indices2.forEach(i2 => {
        totalDistance += distances[i1][i2];
        count++;
      });
    });
    
    return count > 0 ? totalDistance / count : 0;
  }
  
  private static getCardIndices(cluster: ClusterNode): number[] {
    if (cluster.cardIndex !== undefined) {
      return [cluster.cardIndex];
    }
    
    const indices: number[] = [];
    cluster.children?.forEach(child => {
      indices.push(...this.getCardIndices(child));
    });
    
    return indices;
  }
}

export interface ClusterNode {
  name: string;
  children: ClusterNode[];
  distance: number;
  size?: number;
  cardIndex?: number;
}

// Frequency Analysis for Rainbow Chart
export class FrequencyAnalysis {
  /**
   * Calculate category usage frequency
   */
  static calculateCategoryFrequency(results: CardSortResult[]): CategoryFrequency[] {
    const categoryMap = new Map<number, {
      name: string;
      usage: number;
      cards: Map<number, { text: string; frequency: number }>;
    }>();
    
    const totalParticipants = results.length;
    
    // Count category usage
    results.forEach(result => {
      result.cardSortResults.forEach(category => {
        if (!categoryMap.has(category.categoryId)) {
          categoryMap.set(category.categoryId, {
            name: category.categoryName,
            usage: 0,
            cards: new Map()
          });
        }
        
        const catData = categoryMap.get(category.categoryId)!;
        catData.usage++;
        
        // Count card frequency within categories
        category.cards.forEach(card => {
          if (!catData.cards.has(card.id)) {
            catData.cards.set(card.id, { text: card.text, frequency: 0 });
          }
          catData.cards.get(card.id)!.frequency++;
        });
      });
    });
    
    // Convert to CategoryFrequency format
    return Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      usage: data.usage,
      percentage: totalParticipants > 0 ? (data.usage / totalParticipants) * 100 : 0,
      cards: Array.from(data.cards.entries()).map(([cardId, cardData]) => ({
        id: cardId,
        text: cardData.text,
        frequency: cardData.frequency
      })).sort((a, b) => b.frequency - a.frequency)
    })).sort((a, b) => b.usage - a.usage);
  }
  
  /**
   * Get most popular card-category combinations
   */
  static getMostPopularPlacements(results: CardSortResult[]): Array<{
    cardId: number;
    cardText: string;
    categoryId: number;
    categoryName: string;
    frequency: number;
    percentage: number;
  }> {
    const placementMap = new Map<string, {
      cardId: number;
      cardText: string;
      categoryId: number;
      categoryName: string;
      frequency: number;
    }>();
    
    const totalParticipants = results.length;
    
    results.forEach(result => {
      result.cardSortResults.forEach(category => {
        category.cards.forEach(card => {
          const key = `${card.id}-${category.categoryId}`;
          
          if (!placementMap.has(key)) {
            placementMap.set(key, {
              cardId: card.id,
              cardText: card.text,
              categoryId: category.categoryId,
              categoryName: category.categoryName,
              frequency: 0
            });
          }
          
          placementMap.get(key)!.frequency++;
        });
      });
    });
    
    return Array.from(placementMap.values())
      .map(placement => ({
        ...placement,
        percentage: totalParticipants > 0 ? (placement.frequency / totalParticipants) * 100 : 0
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }
}

// Agreement Analysis
export class AgreementAnalysis {
  /**
   * Calculate inter-participant agreement using Fleiss' Kappa approximation
   */
  static calculateAgreement(results: CardSortResult[]): {
    overallAgreement: number;
    cardAgreements: { cardId: number; cardText: string; agreement: number }[];
  } {
    if (results.length < 2) {
      return { overallAgreement: 0, cardAgreements: [] };
    }
    
    // Get all unique cards
    const allCards: { id: number; text: string }[] = [];
    if (results.length > 0) {
      results[0].cardSortResults.forEach(category => {
        category.cards.forEach(card => {
          if (!allCards.find(c => c.id === card.id)) {
            allCards.push(card);
          }
        });
      });
    }
    
    // Calculate agreement for each card
    const cardAgreements = allCards.map(card => {
      const placements = new Map<number, number>();
      
      // Count where each participant placed this card
      results.forEach(result => {
        result.cardSortResults.forEach(category => {
          if (category.cards.some(c => c.id === card.id)) {
            placements.set(category.categoryId, (placements.get(category.categoryId) || 0) + 1);
          }
        });
      });
      
      // Calculate agreement (most common placement / total participants)
      const maxPlacements = Math.max(...Array.from(placements.values()));
      const agreement = results.length > 0 ? maxPlacements / results.length : 0;
      
      return {
        cardId: card.id,
        cardText: card.text,
        agreement
      };
    });
    
    // Overall agreement is average of individual card agreements
    const overallAgreement = cardAgreements.length > 0 
      ? cardAgreements.reduce((sum, card) => sum + card.agreement, 0) / cardAgreements.length 
      : 0;
    
    return {
      overallAgreement,
      cardAgreements: cardAgreements.sort((a, b) => b.agreement - a.agreement)
    };
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  private static readonly LARGE_DATASET_THRESHOLD = 1000;
  private static readonly VIRTUALIZATION_CHUNK_SIZE = 100;
  
  /**
   * Check if dataset requires performance optimization
   */
  static shouldOptimize(dataSize: number): boolean {
    return dataSize > this.LARGE_DATASET_THRESHOLD;
  }
  
  /**
   * Create virtualized data chunks for progressive rendering
   */
  static createDataChunks<T>(data: T[], chunkSize: number = this.VIRTUALIZATION_CHUNK_SIZE): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Debounce function for performance optimization
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Throttle function for scroll-based operations
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function executedFunction(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Enhanced Statistical Analysis
export class StatisticalAnalysis {
  /**
   * Calculate confidence intervals for similarity scores
   */
  static calculateConfidenceInterval(
    proportion: number,
    sampleSize: number,
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } {
    if (sampleSize === 0) return { lower: 0, upper: 0 };
    
    // Z-score for confidence level
    const zScores: { [key: number]: number } = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    
    const z = zScores[confidenceLevel] || 1.96;
    const standardError = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
    const marginOfError = z * standardError;
    
    return {
      lower: Math.max(0, proportion - marginOfError),
      upper: Math.min(1, proportion + marginOfError)
    };
  }
  
  /**
   * Calculate Cohen's Kappa for inter-rater agreement
   */
  static calculateCohensKappa(results: CardSortResult[]): {
    kappa: number;
    interpretation: string;
    pairwiseAgreements: { participant1: string; participant2: string; kappa: number }[];
  } {
    if (results.length < 2) {
      return { kappa: 0, interpretation: 'Insufficient data', pairwiseAgreements: [] };
    }
    
    // Get all unique cards
    const allCards: { id: number; text: string }[] = [];
    if (results.length > 0) {
      results[0].cardSortResults.forEach(category => {
        category.cards.forEach(card => {
          if (!allCards.find(c => c.id === card.id)) {
            allCards.push(card);
          }
        });
      });
    }
    
    const pairwiseAgreements: { participant1: string; participant2: string; kappa: number }[] = [];
    let totalKappa = 0;
    let validPairs = 0;
    
    // Calculate pairwise kappa for all participant pairs
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const kappa = this.calculatePairwiseKappa(results[i], results[j], allCards);
        pairwiseAgreements.push({
          participant1: results[i].participantId,
          participant2: results[j].participantId,
          kappa
        });
        totalKappa += kappa;
        validPairs++;
      }
    }
    
    const averageKappa = validPairs > 0 ? totalKappa / validPairs : 0;
    
    const interpretation = this.interpretKappa(averageKappa);
    
    return {
      kappa: averageKappa,
      interpretation,
      pairwiseAgreements: pairwiseAgreements.sort((a, b) => b.kappa - a.kappa)
    };
  }
  
  private static calculatePairwiseKappa(
    result1: CardSortResult,
    result2: CardSortResult,
    allCards: { id: number; text: string }[]
  ): number {
    let agreements = 0;
    let totalComparisons = 0;
    
    // Compare each pair of cards
    for (let i = 0; i < allCards.length; i++) {
      for (let j = i + 1; j < allCards.length; j++) {
        const card1 = allCards[i];
        const card2 = allCards[j];
        
        // Check if cards are in same category for participant 1
        const sameCategory1 = result1.cardSortResults.some(category =>
          category.cards.some(c => c.id === card1.id) &&
          category.cards.some(c => c.id === card2.id)
        );
        
        // Check if cards are in same category for participant 2
        const sameCategory2 = result2.cardSortResults.some(category =>
          category.cards.some(c => c.id === card1.id) &&
          category.cards.some(c => c.id === card2.id)
        );
        
        if (sameCategory1 === sameCategory2) {
          agreements++;
        }
        totalComparisons++;
      }
    }
    
    if (totalComparisons === 0) return 0;
    
    const observedAgreement = agreements / totalComparisons;
    const expectedAgreement = 0.5; // Assuming random chance
    
    return totalComparisons > 0 ? (observedAgreement - expectedAgreement) / (1 - expectedAgreement) : 0;
  }
  
  private static interpretKappa(kappa: number): string {
    if (kappa < 0) return 'Poor agreement';
    if (kappa < 0.20) return 'Slight agreement';
    if (kappa < 0.40) return 'Fair agreement';
    if (kappa < 0.60) return 'Moderate agreement';
    if (kappa < 0.80) return 'Substantial agreement';
    return 'Almost perfect agreement';
  }
  
  /**
   * Calculate statistical significance using Chi-square test
   */
  static calculateSignificance(
    observed: number[][],
    alpha: number = 0.05
  ): { chiSquare: number; pValue: number; isSignificant: boolean; degreesOfFreedom: number } {
    const rows = observed.length;
    const cols = observed[0]?.length || 0;
    
    if (rows === 0 || cols === 0) {
      return { chiSquare: 0, pValue: 1, isSignificant: false, degreesOfFreedom: 0 };
    }
    
    // Calculate expected frequencies
    const rowTotals = observed.map(row => row.reduce((sum, val) => sum + val, 0));
    const colTotals = Array(cols).fill(0).map((_, col) =>
      observed.reduce((sum, row) => sum + row[col], 0)
    );
    const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);
    
    let chiSquare = 0;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const expected = (rowTotals[i] * colTotals[j]) / grandTotal;
        if (expected > 0) {
          chiSquare += Math.pow(observed[i][j] - expected, 2) / expected;
        }
      }
    }
    
    const degreesOfFreedom = (rows - 1) * (cols - 1);
    
    // Simplified p-value calculation (approximation)
    const pValue = this.chiSquarePValue(chiSquare, degreesOfFreedom);
    
    return {
      chiSquare,
      pValue,
      isSignificant: pValue < alpha,
      degreesOfFreedom
    };
  }
  
  private static chiSquarePValue(chiSquare: number, df: number): number {
    // Simplified approximation - in production, use proper statistical library
    if (df === 1) {
      if (chiSquare > 3.841) return 0.05;
      if (chiSquare > 6.635) return 0.01;
      if (chiSquare > 10.828) return 0.001;
    }
    return chiSquare > df ? 0.05 : 0.5; // Very rough approximation
  }
}

// Data Quality and Validation
export class DataQualityAnalyzer {
  /**
   * Validate card sorting results for completeness and consistency
   */
  static validateCardSortResults(results: CardSortResult[]): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    completeness: number;
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    if (results.length === 0) {
      issues.push('No results provided');
      return { isValid: false, issues, warnings, completeness: 0 };
    }
    
    // Check for consistent card sets
    const firstResultCards = results[0]?.cardSortResults.flatMap(cat => cat.cards) || [];
    const expectedCardCount = firstResultCards.length;
    
    let totalCompleteResults = 0;
    
    results.forEach((result) => {
      const currentCards = result.cardSortResults.flatMap(cat => cat.cards);
      
      if (currentCards.length !== expectedCardCount) {
        issues.push(`Participant ${result.participantId}: Inconsistent card count (${currentCards.length} vs ${expectedCardCount})`);
      }
      
      if (result.cardSortResults.length === 0) {
        issues.push(`Participant ${result.participantId}: No categories created`);
      }
      
      if (result.cardSortResults.some(cat => cat.cards.length === 0)) {
        warnings.push(`Participant ${result.participantId}: Has empty categories`);
      }
      
      if (currentCards.length === expectedCardCount && result.cardSortResults.length > 0) {
        totalCompleteResults++;
      }
    });
    
    const completeness = results.length > 0 ? totalCompleteResults / results.length : 0;
    
    if (completeness < 0.8) {
      warnings.push(`Low data completeness: ${(completeness * 100).toFixed(1)}%`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      completeness
    };
  }
  
  /**
   * Detect outliers in participant behavior
   */
  static detectOutliers(results: CardSortResult[]): {
    outliers: { participantId: string; reason: string; severity: 'low' | 'medium' | 'high' }[];
    summary: { mean: number; median: number; stdDev: number };
  } {
    const outliers: { participantId: string; reason: string; severity: 'low' | 'medium' | 'high' }[] = [];
    
    // Analyze category counts
    const categoryCounts = results.map(result => result.cardSortResults.length);
    const mean = categoryCounts.reduce((sum, val) => sum + val, 0) / categoryCounts.length;
    const sortedCounts = [...categoryCounts].sort((a, b) => a - b);
    const median = sortedCounts[Math.floor(sortedCounts.length / 2)];
    const variance = categoryCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / categoryCounts.length;
    const stdDev = Math.sqrt(variance);
    
    results.forEach((result) => {
      const categoryCount = result.cardSortResults.length;
      const zScore = Math.abs((categoryCount - mean) / stdDev);
      
      if (zScore > 3) {
        outliers.push({
          participantId: result.participantId,
          reason: `Extreme category count: ${categoryCount} (mean: ${mean.toFixed(1)})`,
          severity: 'high'
        });
      } else if (zScore > 2) {
        outliers.push({
          participantId: result.participantId,
          reason: `Unusual category count: ${categoryCount} (mean: ${mean.toFixed(1)})`,
          severity: 'medium'
        });
      }
      
      // Check for very uneven distributions
      const cardDistribution = result.cardSortResults.map(cat => cat.cards.length);
      const maxCards = Math.max(...cardDistribution);
      const minCards = Math.min(...cardDistribution);
      
      if (maxCards > 0 && minCards === 0) {
        outliers.push({
          participantId: result.participantId,
          reason: 'Has empty categories',
          severity: 'low'
        });
      }
      
      if (maxCards > minCards * 5 && minCards > 0) {
        outliers.push({
          participantId: result.participantId,
          reason: 'Very uneven card distribution',
          severity: 'medium'
        });
      }
    });
    
    return {
      outliers: outliers.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      summary: { mean, median, stdDev }
    };
  }
}

// Export utility function to process study results
export function processStudyResults(studyResults: any): {
  cardSortResults: CardSortResult[];
  treeTestResults: TreeTestResult[];
} {
  const cardSortResults: CardSortResult[] = [];
  const treeTestResults: TreeTestResult[] = [];
  
  Object.values(studyResults).forEach((result: any) => {
    if (result.studyType === 'card-sorting' && result.cardSortResults) {
      cardSortResults.push({
        participantId: result.participantId,
        studyId: result.studyId,
        cardSortResults: result.cardSortResults
      });
    } else if (result.studyType === 'tree-testing' && result.treeTestResults) {
      treeTestResults.push({
        participantId: result.participantId,
        studyId: result.studyId,
        treeTestResults: result.treeTestResults
      });
    }
  });
  
  return { cardSortResults, treeTestResults };
}