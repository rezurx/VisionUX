import React, { useState, useMemo } from 'react';
import { BarChart3, Network, Palette, Users, TrendingUp, Shield, Layers, GitBranch, Download, FileText } from 'lucide-react';
import { 
  processStudyResults, 
  AgreementAnalysis, 
  FrequencyAnalysis, 
  StatisticalAnalysis,
  DataQualityAnalyzer 
} from '../../analytics';
import { Study } from '../../types';
import SimilarityMatrix from './SimilarityMatrix';
import Dendrogram from './Dendrogram';
import RainbowChart from './RainbowChart';
import SurveyAnalytics from './SurveyAnalytics';
import AccessibilityScorecard from './AccessibilityScorecard';
import DesignSystemMetrics from './DesignSystemMetrics';
import CrossMethodAnalysis from './CrossMethodAnalysis';
import DataExporter from './DataExporter';
import AccessibilityDashboard from '../accessibility/AccessibilityDashboard';
import { generateSampleAccessibilityData } from '../../data/sampleAccessibilityData';

interface AnalyticsDashboardProps {
  studies: Study[];
  studyResults: any;
  surveyResults?: any[];
  accessibilityResults?: any[];
  designSystemResults?: any[];
  enableMultiMethod?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  studies, 
  studyResults,
  surveyResults = [],
  accessibilityResults = [],
  designSystemResults = [],
  enableMultiMethod = false
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<
    'overview' | 'similarity' | 'dendrogram' | 'rainbow' | 'survey' | 'accessibility' | 'design-system' | 'cross-method' | 'export'
  >('overview');

  // Process and filter study results
  const { cardSortResults } = useMemo(() => processStudyResults(studyResults), [studyResults]);
  
  const filteredResults = useMemo(() => {
    if (selectedStudyId === null) return cardSortResults;
    return cardSortResults.filter(result => result.studyId === selectedStudyId);
  }, [cardSortResults, selectedStudyId]);

  // Enhanced analytics with statistical rigor
  const enhancedAnalytics = useMemo(() => {
    const cohensKappa = StatisticalAnalysis.calculateCohensKappa(filteredResults);
    const dataQuality = DataQualityAnalyzer.validateCardSortResults(filteredResults);
    const outliers = DataQualityAnalyzer.detectOutliers(filteredResults);
    
    return {
      cohensKappa,
      dataQuality,
      outliers
    };
  }, [filteredResults]);

  // Calculate analytics
  const agreementAnalysis = useMemo(() => 
    AgreementAnalysis.calculateAgreement(filteredResults), [filteredResults]
  );

  const categoryFrequencies = useMemo(() => 
    FrequencyAnalysis.calculateCategoryFrequency(filteredResults), [filteredResults]
  );

  const cardSortStudies = studies.filter(study => study.type === 'card-sorting');

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-200 rounded-lg">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Participants</p>
              <p className="text-2xl font-bold text-blue-900">{filteredResults.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-200 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Agreement Score</p>
              <p className="text-2xl font-bold text-green-900">
                {(agreementAnalysis.overallAgreement * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-green-600">
                κ = {enhancedAnalytics.cohensKappa.kappa.toFixed(3)} ({enhancedAnalytics.cohensKappa.interpretation})
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-200 rounded-lg">
              <Palette className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-900">{categoryFrequencies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-200 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Total Cards</p>
              <p className="text-2xl font-bold text-orange-900">
                {agreementAnalysis.cardAgreements.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Agreement Analysis with Data Quality */}
      {agreementAnalysis.cardAgreements.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Card Agreement Analysis</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded ${enhancedAnalytics.dataQuality.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {enhancedAnalytics.dataQuality.isValid ? 'Valid Data' : 'Data Issues'}
              </span>
              <span>Quality: {(enhancedAnalytics.dataQuality.completeness * 100).toFixed(1)}%</span>
              {enhancedAnalytics.outliers.outliers.length > 0 && (
                <span className="text-orange-600">{enhancedAnalytics.outliers.outliers.length} Outliers</span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-medium text-green-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Highest Agreement Cards
                </h4>
                <div className="space-y-2">
                  {agreementAnalysis.cardAgreements.slice(0, 5).map((card) => (
                    <div key={card.cardId} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors duration-150">
                      <span className="text-sm font-medium text-gray-900 truncate mr-2">{card.cardText}</span>
                      <span className="text-sm text-green-700 font-bold flex-shrink-0">
                        {(card.agreement * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-orange-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Lowest Agreement Cards
                </h4>
                <div className="space-y-2">
                  {agreementAnalysis.cardAgreements.slice(-5).reverse().map((card) => (
                    <div key={card.cardId} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors duration-150">
                      <span className="text-sm font-medium text-gray-900 truncate mr-2">{card.cardText}</span>
                      <span className="text-sm text-orange-700 font-bold flex-shrink-0">
                        {(card.agreement * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Usage Summary */}
      {categoryFrequencies.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Category Usage Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryFrequencies.map((category) => (
              <div key={category.categoryId} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <h4 className="font-semibold text-gray-900 mb-3 truncate">{category.categoryName}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Usage:</span>
                    <span className="font-medium text-gray-900">{category.usage} times ({category.percentage.toFixed(1)}%)</span>
                  </div>
                  <div>
                    <span className="block mb-1">Top Cards:</span>
                    <p className="text-gray-700 font-medium text-xs leading-relaxed">
                      {category.cards.slice(0, 3).map(c => c.text).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalysisView = () => {
    const [isLoading, setIsLoading] = useState(false);
    
    React.useEffect(() => {
      if (activeView !== 'overview') {
        setIsLoading(true);
        // Simulate loading time for D3 rendering
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
      }
    }, [activeView]);

    if (activeView !== 'overview' && isLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading visualization...</p>
              <p className="text-sm text-gray-500 mt-1">Analyzing {filteredResults.length} participant responses</p>
            </div>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'similarity':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 overflow-auto">
            <SimilarityMatrix 
              results={filteredResults} 
              width={Math.min(800, window.innerWidth - 100)} 
              height={600}
              responsive={true}
            />
          </div>
        );
      case 'dendrogram':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 overflow-auto">
            <Dendrogram results={filteredResults} width={Math.min(900, window.innerWidth - 100)} height={700} />
          </div>
        );
      case 'rainbow':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 overflow-auto">
            <RainbowChart results={filteredResults} width={Math.min(900, window.innerWidth - 100)} height={500} />
          </div>
        );
      case 'survey':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 overflow-auto">
            <SurveyAnalytics 
              surveyResults={surveyResults}
              questions={[]}
              width={Math.min(900, window.innerWidth - 100)}
              height={600}
            />
          </div>
        );
      case 'accessibility':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-auto">
            <AccessibilityDashboard
              studyId={selectedStudyId || 0}
              studyType="accessibility-audit"
              initialResults={accessibilityResults.length > 0 ? accessibilityResults : generateSampleAccessibilityData()}
              enableAllFeatures={true}
              onConfigurationChange={(config) => console.log('Accessibility config updated:', config)}
              onResultsUpdate={(results) => console.log('Accessibility results updated:', results)}
            />
          </div>
        );
      case 'design-system':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 overflow-auto">
            <DesignSystemMetrics 
              designSystemResults={designSystemResults}
              components={[]}
              width={Math.min(1200, window.innerWidth - 100)}
              height={800}
            />
          </div>
        );
      case 'cross-method':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 overflow-auto">
            <CrossMethodAnalysis 
              cardSortResults={filteredResults}
              surveyResults={surveyResults}
              accessibilityResults={accessibilityResults}
              designSystemResults={designSystemResults}
              width={Math.min(1200, window.innerWidth - 100)}
              height={900}
            />
          </div>
        );
      case 'export':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <DataExporter 
              data={{
                cardSortResults: filteredResults,
                surveyResults,
                accessibilityResults,
                designSystemResults
              }}
              studyName={studies.find(s => s.id === selectedStudyId)?.name || 'research-data'}
            />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  if (cardSortStudies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No card sorting studies found</p>
          <p className="text-sm text-gray-400">Create a card sorting study to see advanced analytics</p>
        </div>
      </div>
    );
  }

  if (filteredResults.length === 0) {
    return (
      <div className="space-y-6">
        {/* Study Selection */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Advanced Analytics</h2>
            <select
              value={selectedStudyId || ''}
              onChange={(e) => setSelectedStudyId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Card Sorting Studies</option>
              {cardSortStudies.map(study => (
                <option key={study.id} value={study.id}>{study.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No participant data available</p>
            <p className="text-sm text-gray-400">
              {selectedStudyId ? 'This study has no completed participants yet' : 'No participants have completed any card sorting studies yet'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Study Selection */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Advanced Analytics</h2>
          <select
            value={selectedStudyId || ''}
            onChange={(e) => setSelectedStudyId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium min-w-0"
            aria-label="Select study to analyze"
          >
            <option value="">All Card Sorting Studies</option>
            {cardSortStudies.map(study => (
              <option key={study.id} value={study.id}>{study.name}</option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3, shortLabel: 'Overview' },
            { id: 'similarity', label: 'Similarity Matrix', icon: Network, shortLabel: 'Matrix' },
            { id: 'dendrogram', label: 'Dendrogram', icon: Users, shortLabel: 'Tree' },
            { id: 'rainbow', label: 'Rainbow Chart', icon: Palette, shortLabel: 'Rainbow' },
            ...(enableMultiMethod ? [
              { id: 'survey', label: 'Survey Analytics', icon: FileText, shortLabel: 'Survey' },
              { id: 'accessibility', label: 'Accessibility', icon: Shield, shortLabel: 'A11y' },
              { id: 'design-system', label: 'Design System', icon: Layers, shortLabel: 'DS' },
              { id: 'cross-method', label: 'Cross-Method', icon: GitBranch, shortLabel: 'Cross' }
            ] : []),
            { id: 'export', label: 'Export Data', icon: Download, shortLabel: 'Export' }
          ].map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as any)}
              className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md transition-all duration-200 text-xs sm:text-sm ${
                activeView === id
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              aria-label={`View ${label}`}
              title={label}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium whitespace-nowrap">
                <span className="hidden lg:inline">{label}</span>
                <span className="lg:hidden">{shortLabel}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Content */}
      <div className="min-h-[400px]">
        {renderAnalysisView()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;