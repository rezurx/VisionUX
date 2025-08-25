import React, { useMemo, useState } from 'react';
import { 
  Play, 
  Clock, 
  MessageCircle, 
  Eye, 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Video,
  Activity,
  Target
} from 'lucide-react';
import { VideoAnalysisResult, VideoAnnotation, VideoPlaybackEvent, Study } from '../../types';

interface VideoAnalyticsProps {
  studies: Study[];
  results: Record<string, VideoAnalysisResult[]>;
  selectedStudyId?: string;
}

interface VideoMetrics {
  totalParticipants: number;
  averageCompletionRate: number;
  averageWatchTime: number;
  totalAnnotations: number;
  averageEngagement: number;
  skipEventCount: number;
  mostCommonSkipTimestamp?: number;
  annotationTypes: Record<string, number>;
  playbackSpeedDistribution: Record<string, number>;
  qualityFlags: Record<string, number>;
}

const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({ studies, results, selectedStudyId }) => {
  const [selectedMetricType, setSelectedMetricType] = useState<'overview' | 'engagement' | 'annotations' | 'playback'>('overview');

  // Filter video analysis studies
  const videoStudies = studies.filter(study => study.type === 'video-analysis');
  const filteredResults = selectedStudyId 
    ? { [selectedStudyId]: results[selectedStudyId] || [] }
    : Object.fromEntries(
        Object.entries(results).filter(([studyId]) => 
          videoStudies.some(study => study.id.toString() === studyId)
        )
      );

  // Calculate comprehensive video metrics
  const metrics: VideoMetrics = useMemo(() => {
    const allResults = Object.values(filteredResults).flat();
    
    if (allResults.length === 0) {
      return {
        totalParticipants: 0,
        averageCompletionRate: 0,
        averageWatchTime: 0,
        totalAnnotations: 0,
        averageEngagement: 0,
        skipEventCount: 0,
        annotationTypes: {},
        playbackSpeedDistribution: {},
        qualityFlags: {}
      };
    }

    // Basic metrics
    const totalParticipants = allResults.length;
    const averageCompletionRate = allResults.reduce((sum, r) => sum + r.completionPercentage, 0) / totalParticipants;
    const averageWatchTime = allResults.reduce((sum, r) => sum + r.totalWatchTime, 0) / totalParticipants;
    const totalAnnotations = allResults.reduce((sum, r) => sum + r.annotations.length, 0);
    const averageEngagement = allResults.reduce((sum, r) => sum + r.engagementScore, 0) / totalParticipants;

    // Skip event analysis
    const allSkipEvents = allResults.flatMap(r => r.skipEvents);
    const skipEventCount = allSkipEvents.length;
    const skipTimestamps = allSkipEvents.map(skip => skip.fromTimestamp);
    const mostCommonSkipTimestamp = skipTimestamps.length > 0
      ? skipTimestamps.sort((a, b) => 
          skipTimestamps.filter(x => Math.abs(x - b) < 10).length - 
          skipTimestamps.filter(x => Math.abs(x - a) < 10).length
        )[0]
      : undefined;

    // Annotation type distribution
    const annotationTypes = allResults.reduce((acc, result) => {
      result.annotations.forEach(annotation => {
        acc[annotation.type] = (acc[annotation.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Playback speed distribution
    const playbackSpeedDistribution = allResults.reduce((acc, result) => {
      const speed = result.averagePlaybackSpeed.toFixed(1);
      acc[speed] = (acc[speed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Quality flags distribution
    const qualityFlags = allResults.reduce((acc, result) => {
      result.qualityFlags.forEach(flag => {
        acc[flag.type] = (acc[flag.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalParticipants,
      averageCompletionRate,
      averageWatchTime,
      totalAnnotations,
      averageEngagement,
      skipEventCount,
      mostCommonSkipTimestamp,
      annotationTypes,
      playbackSpeedDistribution,
      qualityFlags
    };
  }, [filteredResults]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  if (videoStudies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Video Studies</h3>
        <p className="text-gray-600">Create a video analysis study to see insights here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Video Analysis Insights</h2>
            <p className="text-gray-600 mt-1">
              Analyzing {metrics.totalParticipants} participant responses across {videoStudies.length} video studies
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Play className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Metric Type Selector */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'engagement', label: 'Engagement', icon: Activity },
              { id: 'annotations', label: 'Annotations', icon: MessageCircle },
              { id: 'playback', label: 'Playback', icon: Play }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedMetricType(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  selectedMetricType === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedMetricType === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Participants */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Participants</p>
                    <p className="text-2xl font-bold text-blue-700">{metrics.totalParticipants}</p>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Avg Completion</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatPercentage(metrics.averageCompletionRate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Watch Time */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-900">Avg Watch Time</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatTime(metrics.averageWatchTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Annotations */}
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center">
                  <MessageCircle className="w-6 h-6 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-900">Total Annotations</p>
                    <p className="text-2xl font-bold text-orange-700">{metrics.totalAnnotations}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMetricType === 'engagement' && (
            <div className="space-y-6">
              {/* Engagement Score Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(metrics.averageEngagement)}
                    </div>
                    <div className="text-sm text-gray-600">Average Engagement Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{metrics.skipEventCount}</div>
                    <div className="text-sm text-gray-600">Total Skip Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {metrics.mostCommonSkipTimestamp ? formatTime(metrics.mostCommonSkipTimestamp) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Most Common Skip Point</div>
                  </div>
                </div>
              </div>

              {/* Quality Flags */}
              {Object.keys(metrics.qualityFlags).length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                    Quality Issues
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(metrics.qualityFlags).map(([flagType, count]) => (
                      <div key={flagType} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 capitalize">
                          {flagType.replace(/-/g, ' ')}
                        </span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedMetricType === 'annotations' && (
            <div className="space-y-6">
              {/* Annotation Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Annotation Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">{metrics.totalAnnotations}</div>
                    <div className="text-sm text-gray-600">Total Annotations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {metrics.totalParticipants > 0 ? Math.round(metrics.totalAnnotations / metrics.totalParticipants) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg per Participant</div>
                  </div>
                </div>
              </div>

              {/* Annotation Type Distribution */}
              {Object.keys(metrics.annotationTypes).length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Annotation Types</h4>
                  <div className="space-y-3">
                    {Object.entries(metrics.annotationTypes)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => {
                        const percentage = (count / metrics.totalAnnotations) * 100;
                        return (
                          <div key={type} className="flex items-center">
                            <div className="w-32 text-sm text-gray-700 capitalize">
                              {type.replace(/-/g, ' ')}
                            </div>
                            <div className="flex-1 mx-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 w-12">
                              {count}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedMetricType === 'playback' && (
            <div className="space-y-6">
              {/* Playback Speed Distribution */}
              {Object.keys(metrics.playbackSpeedDistribution).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Playback Speed Preferences</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(metrics.playbackSpeedDistribution)
                      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                      .map(([speed, count]) => (
                        <div key={speed} className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-2xl font-bold text-gray-900">{speed}x</div>
                          <div className="text-sm text-gray-600">{count} users</div>
                          <div className="text-xs text-gray-500">
                            {Math.round((count / metrics.totalParticipants) * 100)}%
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Average Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Target className="w-5 h-5 text-blue-500 mr-2" />
                    Viewing Patterns
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Completion Rate:</span>
                      <span className="font-semibold">{formatPercentage(metrics.averageCompletionRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Watch Time:</span>
                      <span className="font-semibold">{formatTime(metrics.averageWatchTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skip Events:</span>
                      <span className="font-semibold">{metrics.skipEventCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                    Performance Insights
                  </h4>
                  <div className="space-y-2 text-sm">
                    {metrics.averageCompletionRate > 80 && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        High completion rate indicates engaging content
                      </div>
                    )}
                    {metrics.averageEngagement > 70 && (
                      <div className="flex items-center text-blue-600">
                        <Eye className="w-4 h-4 mr-2" />
                        Strong participant engagement detected
                      </div>
                    )}
                    {metrics.totalAnnotations > metrics.totalParticipants * 2 && (
                      <div className="flex items-center text-purple-600">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Active annotation participation
                      </div>
                    )}
                    {Object.keys(metrics.qualityFlags).length === 0 && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        No significant quality issues detected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoAnalytics;