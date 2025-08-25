import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Video, 
  Play, 
  MessageCircle, 
  Clock, 
  Users, 
  BarChart3,
  Camera,
  Film,
  FileVideo,
  CheckCircle
} from 'lucide-react';
import { VideoAnalysisResult, VideoAnnotation, Study } from '../../types';

interface VideoExporterProps {
  studies: Study[];
  videoResults: Record<string, VideoAnalysisResult[]>;
  selectedStudyId?: string;
}

interface ExportOptions {
  includeAnnotations: boolean;
  includePlaybackEvents: boolean;
  includeEngagementMetrics: boolean;
  includeVideoMetadata: boolean;
  exportFormat: 'json' | 'csv' | 'xlsx';
  annotationFormat: 'detailed' | 'summary';
  timeFormat: 'seconds' | 'timestamp';
}

const VideoExporter: React.FC<VideoExporterProps> = ({ 
  studies, 
  videoResults, 
  selectedStudyId 
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeAnnotations: true,
    includePlaybackEvents: true,
    includeEngagementMetrics: true,
    includeVideoMetadata: true,
    exportFormat: 'json',
    annotationFormat: 'detailed',
    timeFormat: 'timestamp'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Filter video studies and results
  const videoStudies = studies.filter(study => study.type === 'video-analysis');
  const filteredResults = selectedStudyId 
    ? { [selectedStudyId]: videoResults[selectedStudyId] || [] }
    : Object.fromEntries(
        Object.entries(videoResults).filter(([studyId]) => 
          videoStudies.some(study => study.id.toString() === studyId)
        )
      );

  const allResults = Object.values(filteredResults).flat();
  const totalParticipants = allResults.length;
  const totalAnnotations = allResults.reduce((sum, r) => sum + r.annotations.length, 0);
  const totalPlaybackEvents = allResults.reduce((sum, r) => sum + r.playbackEvents.length, 0);

  const formatTime = (seconds: number): string => {
    if (exportOptions.timeFormat === 'seconds') {
      return seconds.toFixed(2);
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateAnnotationReport = (results: VideoAnalysisResult[]): any[] => {
    const annotations: any[] = [];
    
    results.forEach(result => {
      result.annotations.forEach(annotation => {
        const annotationData = {
          participantId: result.participantId,
          studyId: result.studyId,
          videoId: result.videoId,
          annotationId: annotation.id,
          timestamp: formatTime(annotation.timestamp),
          type: annotation.type,
          content: annotation.content,
          rating: annotation.rating,
          tags: annotation.tags?.join(', ') || '',
          createdAt: new Date(annotation.createdAt).toISOString()
        };

        if (exportOptions.annotationFormat === 'detailed') {
          annotations.push(annotationData);
        } else {
          // Summary format - aggregate by type
          const summary = annotations.find(a => 
            a.participantId === result.participantId && 
            a.type === annotation.type
          );
          if (summary) {
            summary.count += 1;
            summary.content += '; ' + annotation.content;
          } else {
            annotations.push({
              ...annotationData,
              count: 1
            });
          }
        }
      });
    });

    return annotations;
  };

  const generatePlaybackReport = (results: VideoAnalysisResult[]): any[] => {
    const events: any[] = [];
    
    results.forEach(result => {
      result.playbackEvents.forEach(event => {
        events.push({
          participantId: result.participantId,
          studyId: result.studyId,
          videoId: result.videoId,
          eventId: event.id,
          eventType: event.eventType,
          timestamp: formatTime(event.timestamp),
          eventTimestamp: new Date(event.eventTimestamp).toISOString(),
          previousValue: event.previousValue,
          newValue: event.newValue,
          seekFrom: event.seekFrom ? formatTime(event.seekFrom) : null,
          seekTo: event.seekTo ? formatTime(event.seekTo) : null
        });
      });
    });

    return events;
  };

  const generateEngagementReport = (results: VideoAnalysisResult[]): any[] => {
    return results.map(result => ({
      participantId: result.participantId,
      studyId: result.studyId,
      videoId: result.videoId,
      totalWatchTime: formatTime(result.totalWatchTime),
      completionPercentage: result.completionPercentage.toFixed(2),
      engagementScore: result.engagementScore.toFixed(2),
      rewatchCount: result.rewatchCount,
      averagePlaybackSpeed: result.averagePlaybackSpeed.toFixed(2),
      skipEventsCount: result.skipEvents.length,
      annotationsCount: result.annotations.length,
      qualityFlags: result.qualityFlags.map(f => f.type).join(', '),
      sessionDuration: formatTime(result.totalSessionTime / 1000),
      startTime: new Date(result.startTime).toISOString(),
      endTime: new Date(result.endTime).toISOString()
    }));
  };

  const generateComprehensiveReport = (): any => {
    const report = {
      metadata: {
        exportDate: new Date().toISOString(),
        studyCount: videoStudies.length,
        participantCount: totalParticipants,
        annotationCount: totalAnnotations,
        playbackEventCount: totalPlaybackEvents,
        exportOptions: exportOptions,
        timeFormat: exportOptions.timeFormat
      },
      studies: videoStudies.map(study => ({
        studyId: study.id,
        studyName: study.name,
        studyDescription: study.description,
        studyType: study.type,
        videoCount: study.videoFiles?.length || 0,
        participantCount: filteredResults[study.id.toString()]?.length || 0
      })),
      results: allResults.map(result => {
        const data: any = {
          participantId: result.participantId,
          studyId: result.studyId,
          videoId: result.videoId,
          totalWatchTime: formatTime(result.totalWatchTime),
          completionPercentage: result.completionPercentage,
          engagementScore: result.engagementScore,
          rewatchCount: result.rewatchCount,
          averagePlaybackSpeed: result.averagePlaybackSpeed
        };

        if (exportOptions.includeVideoMetadata) {
          data.videoMetadata = result.videoMetadata;
        }

        if (exportOptions.includeAnnotations) {
          data.annotations = result.annotations.map(annotation => ({
            id: annotation.id,
            timestamp: formatTime(annotation.timestamp),
            type: annotation.type,
            content: annotation.content,
            rating: annotation.rating,
            tags: annotation.tags,
            createdAt: new Date(annotation.createdAt).toISOString()
          }));
        }

        if (exportOptions.includePlaybackEvents) {
          data.playbackEvents = result.playbackEvents.map(event => ({
            id: event.id,
            eventType: event.eventType,
            timestamp: formatTime(event.timestamp),
            eventTimestamp: new Date(event.eventTimestamp).toISOString(),
            previousValue: event.previousValue,
            newValue: event.newValue,
            seekFrom: event.seekFrom ? formatTime(event.seekFrom) : null,
            seekTo: event.seekTo ? formatTime(event.seekTo) : null
          }));
        }

        if (exportOptions.includeEngagementMetrics) {
          data.engagementMetrics = {
            skipEvents: result.skipEvents,
            qualityFlags: result.qualityFlags,
            attentionSpans: result.attentionSpans,
            distractionEvents: result.distractionEvents
          };
        }

        return data;
      })
    };

    return report;
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (allResults.length === 0) return;
    
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const studyName = selectedStudyId 
        ? studies.find(s => s.id.toString() === selectedStudyId)?.name || 'video-study'
        : 'all-video-studies';

      if (exportOptions.exportFormat === 'json') {
        const report = generateComprehensiveReport();
        downloadJSON(report, `${studyName}_video_analysis_${timestamp}.json`);
      } else {
        // Export separate CSV files for different data types
        if (exportOptions.includeEngagementMetrics) {
          const engagementData = generateEngagementReport(allResults);
          downloadCSV(engagementData, `${studyName}_engagement_metrics_${timestamp}.csv`);
        }

        if (exportOptions.includeAnnotations) {
          const annotationData = generateAnnotationReport(allResults);
          downloadCSV(annotationData, `${studyName}_annotations_${timestamp}.csv`);
        }

        if (exportOptions.includePlaybackEvents) {
          const playbackData = generatePlaybackReport(allResults);
          downloadCSV(playbackData, `${studyName}_playback_events_${timestamp}.csv`);
        }
      }

      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = allResults.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <Video className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Video Analysis Export</h2>
            <p className="text-gray-600">
              Export comprehensive video research data and insights
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{totalParticipants}</div>
            <div className="text-xs text-gray-600">Participants</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{totalAnnotations}</div>
            <div className="text-xs text-gray-600">Annotations</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <Play className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{totalPlaybackEvents}</div>
            <div className="text-xs text-gray-600">Playback Events</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <FileVideo className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{videoStudies.length}</div>
            <div className="text-xs text-gray-600">Video Studies</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Data Inclusion Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Include Data:</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAnnotations}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeAnnotations: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <MessageCircle className="w-4 h-4 text-green-600 ml-2 mr-2" />
                <span className="text-sm text-gray-700">Video Annotations</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includePlaybackEvents}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includePlaybackEvents: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Play className="w-4 h-4 text-purple-600 ml-2 mr-2" />
                <span className="text-sm text-gray-700">Playback Events</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeEngagementMetrics}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeEngagementMetrics: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <BarChart3 className="w-4 h-4 text-blue-600 ml-2 mr-2" />
                <span className="text-sm text-gray-700">Engagement Metrics</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeVideoMetadata}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeVideoMetadata: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Film className="w-4 h-4 text-red-600 ml-2 mr-2" />
                <span className="text-sm text-gray-700">Video Metadata</span>
              </label>
            </div>
          </div>

          {/* Format Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Export Format:</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="json"
                  checked={exportOptions.exportFormat === 'json'}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    exportFormat: e.target.value as any 
                  }))}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">JSON (Comprehensive)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportOptions.exportFormat === 'csv'}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    exportFormat: e.target.value as any 
                  }))}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">CSV (Multiple files)</span>
              </label>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Annotation Format:</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="annotationFormat"
                    value="detailed"
                    checked={exportOptions.annotationFormat === 'detailed'}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      annotationFormat: e.target.value as any 
                    }))}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Detailed (One row per annotation)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="annotationFormat"
                    value="summary"
                    checked={exportOptions.annotationFormat === 'summary'}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      annotationFormat: e.target.value as any 
                    }))}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Summary (Aggregated by participant)</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Time Format:</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="timestamp"
                    checked={exportOptions.timeFormat === 'timestamp'}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      timeFormat: e.target.value as any 
                    }))}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Clock className="w-4 h-4 text-orange-600 ml-2 mr-1" />
                  <span className="ml-1 text-sm text-gray-700">MM:SS format</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="seconds"
                    checked={exportOptions.timeFormat === 'seconds'}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      timeFormat: e.target.value as any 
                    }))}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Decimal seconds</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Ready to Export</h3>
            <p className="text-sm text-gray-600 mt-1">
              {canExport 
                ? `Export data from ${totalParticipants} participants across ${videoStudies.length} studies`
                : 'No video analysis data available to export'
              }
            </p>
          </div>
          
          <button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              canExport && !isExporting
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Exporting...</span>
              </>
            ) : exportComplete ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Export Complete!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export Video Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Preview */}
      {canExport && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-medium text-gray-900 mb-3">Export Preview:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {exportOptions.exportFormat === 'json' && (
              <p>• Single JSON file with comprehensive video analysis data</p>
            )}
            {exportOptions.exportFormat === 'csv' && (
              <div className="space-y-1">
                {exportOptions.includeEngagementMetrics && <p>• Engagement metrics CSV</p>}
                {exportOptions.includeAnnotations && <p>• Video annotations CSV ({exportOptions.annotationFormat})</p>}
                {exportOptions.includePlaybackEvents && <p>• Playback events CSV</p>}
              </div>
            )}
            <p>• Time format: {exportOptions.timeFormat === 'timestamp' ? 'MM:SS' : 'Decimal seconds'}</p>
            <p>• Total records: {totalParticipants} participants, {totalAnnotations} annotations, {totalPlaybackEvents} events</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoExporter;