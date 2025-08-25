import React, { useState, useEffect } from 'react';
import { 
  VideoFile, 
  VideoStudySettings, 
  VideoPlaybackEvent, 
  VideoAnnotation, 
  VideoAnalysisResult,
  Study
} from '../../types';
import { VideoPlayer } from '../video';
import { CheckCircle, AlertCircle, Clock, MessageCircle, Play, ArrowRight } from 'lucide-react';

interface ParticipantVideoAnalysisProps {
  study: Study;
  participantId: string;
  onComplete: (results: VideoAnalysisResult) => void;
  onProgress?: (progress: number) => void;
}

const ParticipantVideoAnalysis: React.FC<ParticipantVideoAnalysisProps> = ({
  study,
  participantId,
  onComplete,
  onProgress
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playbackEvents, setPlaybackEvents] = useState<VideoPlaybackEvent[]>([]);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [videoProgress, setVideoProgress] = useState<Record<string, { watched: number; duration: number }>>({});
  const [startTime] = useState(Date.now());
  const [canProceed, setCanProceed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const videoFiles = study.videoFiles || [];
  const settings = study.videoSettings || {
    autoPlay: false,
    showControls: true,
    allowSeek: true,
    allowSpeedChange: true,
    allowFullscreen: true,
    enableTimestamping: true,
    requiredWatchPercentage: 80,
    allowRewatch: true,
    enableAnnotations: true,
    annotationTypes: ['timestamp-comment'],
    requireAnnotations: false,
    minAnnotations: 0,
    trackViewingBehavior: true,
    detectSkipping: true,
    showProgressBar: true,
    showTimestamp: true,
    pauseOnAnnotation: false
  };

  const currentVideo = videoFiles[currentVideoIndex];
  const isLastVideo = currentVideoIndex === videoFiles.length - 1;
  const totalVideos = videoFiles.length;
  const overallProgress = ((currentVideoIndex + (canProceed ? 1 : 0)) / totalVideos) * 100;

  useEffect(() => {
    onProgress?.(overallProgress);
  }, [overallProgress, onProgress]);

  // Check if current video meets completion criteria
  useEffect(() => {
    if (!currentVideo) return;

    const progress = videoProgress[currentVideo.id];
    if (!progress) {
      setCanProceed(false);
      return;
    }

    const watchedPercentage = (progress.watched / progress.duration) * 100;
    const meetsWatchRequirement = watchedPercentage >= settings.requiredWatchPercentage;
    
    let meetsAnnotationRequirement = true;
    if (settings.enableAnnotations && settings.requireAnnotations) {
      const videoAnnotations = annotations.filter(a => 
        playbackEvents.some(e => 
          e.participantId === a.participantId && 
          Math.abs(e.timestamp - a.timestamp) < 1
        )
      );
      meetsAnnotationRequirement = videoAnnotations.length >= (settings.minAnnotations || 0);
    }

    setCanProceed(meetsWatchRequirement && meetsAnnotationRequirement);
  }, [videoProgress, annotations, currentVideo, settings, playbackEvents]);

  const handlePlaybackEvent = (event: VideoPlaybackEvent) => {
    setPlaybackEvents(prev => [...prev, event]);
  };

  const handleAnnotation = (annotation: Omit<VideoAnnotation, 'id' | 'createdAt'>) => {
    const fullAnnotation: VideoAnnotation = {
      ...annotation,
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    setAnnotations(prev => [...prev, fullAnnotation]);
  };

  const handleVideoProgress = (currentTime: number, duration: number) => {
    if (!currentVideo) return;
    
    setVideoProgress(prev => ({
      ...prev,
      [currentVideo.id]: {
        watched: Math.max(prev[currentVideo.id]?.watched || 0, currentTime),
        duration
      }
    }));
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videoFiles.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setCanProceed(false);
    }
  };

  const handleComplete = () => {
    // Calculate engagement and quality metrics
    const totalWatchTime = Object.values(videoProgress).reduce((sum, p) => sum + p.watched, 0);
    const totalVideoTime = videoFiles.reduce((sum, video) => sum + video.duration, 0);
    const completionPercentage = (totalWatchTime / totalVideoTime) * 100;
    
    // Calculate engagement score based on interactions and annotations
    const engagementScore = Math.min(100, 
      (playbackEvents.length * 2) + 
      (annotations.length * 5) + 
      Math.min(completionPercentage, 100)
    );

    // Detect skip events from playback events
    const skipEvents = playbackEvents
      .filter(event => event.eventType === 'seek')
      .map(event => ({
        fromTimestamp: event.seekFrom || 0,
        toTimestamp: event.seekTo || 0,
        skippedDuration: Math.abs((event.seekTo || 0) - (event.seekFrom || 0)),
        reason: 'manual-seek' as const
      }))
      .filter(skip => skip.skippedDuration > 5); // Only significant skips

    const result: VideoAnalysisResult = {
      participantId,
      studyId: study.id,
      videoId: 'multi-video', // For multi-video studies
      totalWatchTime,
      completionPercentage,
      rewatchCount: playbackEvents.filter(e => e.eventType === 'seek' && (e.seekTo || 0) < (e.seekFrom || 0)).length,
      averagePlaybackSpeed: playbackEvents
        .filter(e => e.eventType === 'speed-change')
        .reduce((sum, e) => sum + (e.newValue || 1), playbackEvents.filter(e => e.eventType === 'speed-change').length || 1) / 
        (playbackEvents.filter(e => e.eventType === 'speed-change').length || 1),
      playbackEvents,
      annotations,
      engagementScore,
      attentionSpans: [], // Would need more sophisticated tracking
      distractionEvents: [], // Would need tab/window focus tracking
      skipEvents,
      qualityFlags: completionPercentage < settings.requiredWatchPercentage 
        ? [{ 
            type: 'insufficient-watch-time', 
            severity: 'high', 
            message: `Only watched ${completionPercentage.toFixed(1)}% of required ${settings.requiredWatchPercentage}%` 
          }] 
        : [],
      startTime,
      endTime: Date.now(),
      totalSessionTime: Date.now() - startTime,
      videoMetadata: {
        duration: totalVideoTime,
        resolution: videoFiles[0]?.resolution ? 
          `${videoFiles[0].resolution.width}x${videoFiles[0].resolution.height}` : 
          '1920x1080',
        frameRate: videoFiles[0]?.frameRate || 30
      }
    };

    setIsCompleted(true);
    onComplete(result);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showInstructions) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{study.name}</h1>
            <p className="text-gray-600">{study.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">What you'll do:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Watch {videoFiles.length} video{videoFiles.length > 1 ? 's' : ''} at your own pace
                  </span>
                </li>
                {settings.enableAnnotations && (
                  <li className="flex items-start">
                    <MessageCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      Add comments and annotations as you watch
                      {settings.requireAnnotations && settings.minAnnotations && 
                        ` (minimum ${settings.minAnnotations} required)`
                      }
                    </span>
                  </li>
                )}
                <li className="flex items-start">
                  <Clock className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Watch at least {settings.requiredWatchPercentage}% of each video
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Study Details:</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total videos:</span>
                  <span className="font-medium">{videoFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated time:</span>
                  <span className="font-medium">
                    ~{formatTime(videoFiles.reduce((sum, v) => sum + v.duration, 0) + videoFiles.length * 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Playback controls:</span>
                  <span className="font-medium">{settings.showControls ? 'Enabled' : 'Limited'}</span>
                </div>
                {!settings.allowSeek && (
                  <div className="flex items-center text-amber-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>Seeking disabled</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowInstructions(false)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Video Analysis
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analysis Complete!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for participating in this video analysis study. Your responses have been recorded.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">{annotations.length}</div>
                <div className="text-gray-600">Annotations</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-gray-600">Completed</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {formatTime((Date.now() - startTime) / 1000)}
                </div>
                <div className="text-gray-600">Duration</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">No Videos Available</h2>
          <p className="text-red-700">This study doesn't have any video files configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Video {currentVideoIndex + 1} of {totalVideos}: {currentVideo.name}
          </h2>
          <div className="text-sm text-gray-600">
            {Math.round(overallProgress)}% Complete
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Current Video Progress */}
        {videoProgress[currentVideo.id] && (
          <div className="mt-2 text-sm text-gray-600">
            Current video: {Math.round((videoProgress[currentVideo.id].watched / videoProgress[currentVideo.id].duration) * 100)}% watched
            {settings.requiredWatchPercentage && (
              <span className={`ml-2 ${
                (videoProgress[currentVideo.id].watched / videoProgress[currentVideo.id].duration) * 100 >= settings.requiredWatchPercentage
                  ? 'text-green-600' 
                  : 'text-amber-600'
              }`}>
                (Required: {settings.requiredWatchPercentage}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Video Player */}
      <div className="mb-6">
        <VideoPlayer
          videoFile={currentVideo}
          settings={settings}
          participantId={participantId}
          onPlaybackEvent={handlePlaybackEvent}
          onAnnotation={handleAnnotation}
          onProgress={handleVideoProgress}
          className="w-full"
        />
      </div>

      {/* Annotations Summary */}
      {settings.enableAnnotations && annotations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Your Annotations</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {annotations
              .filter(a => a.participantId === participantId)
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((annotation, index) => (
              <div key={annotation.id} className="flex items-start space-x-3 text-sm">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {formatTime(annotation.timestamp)}
                </div>
                <div className="flex-1">
                  <div className="text-gray-600 text-xs mb-1">
                    {annotation.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="text-gray-900">{annotation.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {!canProceed && (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              {(videoProgress[currentVideo.id]?.watched / videoProgress[currentVideo.id]?.duration * 100 || 0) < settings.requiredWatchPercentage
                ? `Watch ${settings.requiredWatchPercentage}% to continue`
                : settings.requireAnnotations && annotations.filter(a => a.participantId === participantId).length < (settings.minAnnotations || 0)
                  ? `Add ${(settings.minAnnotations || 0) - annotations.filter(a => a.participantId === participantId).length} more annotation(s)`
                  : 'Keep watching to continue'
              }
            </div>
          )}
        </div>
        
        <div className="space-x-3">
          {!isLastVideo ? (
            <button
              onClick={handleNextVideo}
              disabled={!canProceed}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Video
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Study
              <CheckCircle className="w-4 h-4 ml-2 inline" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantVideoAnalysis;