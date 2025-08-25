import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/fantasy/index.css';
import { 
  VideoFile, 
  VideoPlaybackEvent, 
  VideoAnnotation, 
  VideoStudySettings,
  VideoAnnotationType
} from '../../types';
import { Play, Pause, Volume2, VolumeX, Maximize, MessageCircle, Clock } from 'lucide-react';

interface VideoPlayerProps {
  videoFile: VideoFile;
  settings: VideoStudySettings;
  participantId: string;
  onPlaybackEvent?: (event: VideoPlaybackEvent) => void;
  onAnnotation?: (annotation: Omit<VideoAnnotation, 'id' | 'createdAt'>) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  className?: string;
}

interface AnnotationForm {
  type: VideoAnnotationType;
  content: string;
  timestamp: number;
  rating?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoFile,
  settings,
  participantId,
  onPlaybackEvent,
  onAnnotation,
  onProgress,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationForm, setAnnotationForm] = useState<AnnotationForm>({
    type: 'timestamp-comment',
    content: '',
    timestamp: 0
  });

  // Initialize Video.js player
  useEffect(() => {
    if (!videoRef.current) return;

    const options = {
      controls: settings.showControls,
      fluid: true,
      responsive: true,
      playbackRates: settings.allowSpeedChange ? [0.5, 1, 1.25, 1.5, 2] : [],
      preload: 'metadata',
      sources: [{
        src: videoFile.url,
        type: `video/${videoFile.format}`
      }],
      poster: videoFile.thumbnail,
    };

    playerRef.current = videojs(videoRef.current, options);

    // Add event listeners
    playerRef.current.ready(() => {
      console.log('Video.js player ready');
      setDuration(playerRef.current.duration() || 0);
    });

    playerRef.current.on('play', () => {
      setIsPlaying(true);
      emitPlaybackEvent('play', playerRef.current.currentTime());
    });

    playerRef.current.on('pause', () => {
      setIsPlaying(false);
      emitPlaybackEvent('pause', playerRef.current.currentTime());
    });

    playerRef.current.on('seeked', () => {
      const newTime = playerRef.current.currentTime();
      emitPlaybackEvent('seek', newTime, { seekTo: newTime });
    });

    playerRef.current.on('volumechange', () => {
      const newVolume = playerRef.current.volume();
      const muted = playerRef.current.muted();
      setVolume(newVolume);
      setIsMuted(muted);
      emitPlaybackEvent('volume-change', playerRef.current.currentTime(), { newValue: newVolume });
    });

    playerRef.current.on('timeupdate', () => {
      const current = playerRef.current.currentTime();
      const dur = playerRef.current.duration();
      setCurrentTime(current);
      setDuration(dur);
      onProgress?.(current, dur);
    });

    playerRef.current.on('ratechange', () => {
      const newRate = playerRef.current.playbackRate();
      setPlaybackRate(newRate);
      emitPlaybackEvent('speed-change', playerRef.current.currentTime(), { newValue: newRate });
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoFile.url, settings]);

  const emitPlaybackEvent = useCallback((
    eventType: VideoPlaybackEvent['eventType'], 
    timestamp: number, 
    additionalData?: any
  ) => {
    if (!onPlaybackEvent) return;

    const event: VideoPlaybackEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participantId,
      eventType,
      timestamp,
      eventTimestamp: Date.now(),
      ...additionalData
    };

    onPlaybackEvent(event);
  }, [participantId, onPlaybackEvent]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    
    const newMuted = !isMuted;
    playerRef.current.muted(newMuted);
    setIsMuted(newMuted);
  };

  const handleSeek = (time: number) => {
    if (!playerRef.current || !settings.allowSeek) return;
    
    const oldTime = playerRef.current.currentTime();
    playerRef.current.currentTime(time);
    emitPlaybackEvent('seek', time, { seekFrom: oldTime, seekTo: time });
  };

  const handleFullscreen = () => {
    if (!playerRef.current || !settings.allowFullscreen) return;
    
    if (playerRef.current.isFullscreen()) {
      playerRef.current.exitFullscreen();
    } else {
      playerRef.current.requestFullscreen();
    }
    emitPlaybackEvent('fullscreen-toggle', playerRef.current.currentTime());
  };

  const handleAddAnnotation = () => {
    if (!settings.enableAnnotations) return;
    
    setAnnotationForm({
      type: 'timestamp-comment',
      content: '',
      timestamp: currentTime
    });
    setShowAnnotationForm(true);
    
    if (settings.pauseOnAnnotation && isPlaying) {
      playerRef.current?.pause();
    }
  };

  const submitAnnotation = () => {
    if (!onAnnotation || !annotationForm.content.trim()) return;

    const annotation = {
      participantId,
      timestamp: annotationForm.timestamp,
      type: annotationForm.type,
      content: annotationForm.content,
      rating: annotationForm.rating,
      tags: []
    };

    onAnnotation(annotation);
    setShowAnnotationForm(false);
    setAnnotationForm({
      type: 'timestamp-comment',
      content: '',
      timestamp: 0
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`video-player-container bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      <div className="relative">
        <video
          ref={videoRef}
          className="video-js vjs-theme-fantasy w-full"
          style={{ minHeight: '300px' }}
        />
        
        {/* Custom Controls Overlay (when native controls are disabled) */}
        {!settings.showControls && (
          <div className="absolute inset-0 flex items-end">
            <div className="w-full bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              {settings.showProgressBar && (
                <div className="mb-4">
                  <div className="relative h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                    {settings.allowSeek && (
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={handlePlayPause}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleMuteToggle}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        playerRef.current?.volume(newVolume);
                        setVolume(newVolume);
                      }}
                      className="w-16 h-1 bg-gray-600 rounded-full"
                    />
                  </div>

                  {/* Time Display */}
                  {settings.showTimestamp && (
                    <div className="text-white text-sm font-mono">
                      <Clock size={16} className="inline mr-1" />
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Speed Control */}
                  {settings.allowSpeedChange && (
                    <select
                      value={playbackRate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value);
                        playerRef.current?.playbackRate(newRate);
                        setPlaybackRate(newRate);
                      }}
                      className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  )}

                  {/* Annotation Button */}
                  {settings.enableAnnotations && (
                    <button
                      onClick={handleAddAnnotation}
                      className="text-white hover:text-blue-400 transition-colors"
                      title="Add annotation"
                    >
                      <MessageCircle size={20} />
                    </button>
                  )}

                  {/* Fullscreen Button */}
                  {settings.allowFullscreen && (
                    <button
                      onClick={handleFullscreen}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      <Maximize size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Annotation Form Modal */}
      {showAnnotationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Annotation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timestamp: {formatTime(annotationForm.timestamp)}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annotation Type
                </label>
                <select
                  value={annotationForm.type}
                  onChange={(e) => setAnnotationForm(prev => ({ 
                    ...prev, 
                    type: e.target.value as VideoAnnotationType 
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {settings.annotationTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={annotationForm.content}
                  onChange={(e) => setAnnotationForm(prev => ({ 
                    ...prev, 
                    content: e.target.value 
                  }))}
                  placeholder="Enter your annotation..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none"
                />
              </div>

              {(annotationForm.type === 'emotion-rating' || annotationForm.type === 'usability-issue') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={annotationForm.rating || 3}
                    onChange={(e) => setAnnotationForm(prev => ({ 
                      ...prev, 
                      rating: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">
                    {annotationForm.rating || 3}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAnnotationForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitAnnotation}
                disabled={!annotationForm.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add Annotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Information */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{videoFile.name}</h4>
            <p className="text-sm text-gray-500">
              {formatTime(videoFile.duration)} • {videoFile.resolution.quality} • {videoFile.format.toUpperCase()}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {Math.round(progressPercentage)}% watched
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;