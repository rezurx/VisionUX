import React, { useState } from 'react';
import { Save, X, Play, Settings, Users, Clock, FileVideo, MessageCircle } from 'lucide-react';
import { 
  Study, 
  VideoFile, 
  VideoStudySettings, 
  VideoAnalysisConfig,
  VideoAnnotationType,
  RESEARCH_METHOD_METADATA
} from '../../types';
import VideoUpload from './VideoUpload';
import VideoPlayer from './VideoPlayer';

interface VideoStudyCreatorProps {
  onSave: (study: Partial<Study>) => void;
  onCancel: () => void;
  existingStudy?: Study;
  className?: string;
}

const VideoStudyCreator: React.FC<VideoStudyCreatorProps> = ({
  onSave,
  onCancel,
  existingStudy,
  className = ''
}) => {
  const [studyName, setStudyName] = useState(existingStudy?.name || '');
  const [studyDescription, setStudyDescription] = useState(existingStudy?.description || '');
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>(existingStudy?.videoFiles || []);
  const [videoSettings, setVideoSettings] = useState<VideoStudySettings>(
    existingStudy?.videoSettings || {
      autoPlay: false,
      showControls: true,
      allowSeek: true,
      allowSpeedChange: true,
      allowFullscreen: true,
      enableTimestamping: true,
      requiredWatchPercentage: 80,
      allowRewatch: true,
      maxRewatchCount: 3,
      enableAnnotations: true,
      annotationTypes: ['timestamp-comment', 'usability-issue', 'emotion-rating'],
      requireAnnotations: false,
      minAnnotations: 0,
      trackViewingBehavior: true,
      detectSkipping: true,
      minimumViewingTime: 30,
      showProgressBar: true,
      showTimestamp: true,
      pauseOnAnnotation: false
    }
  );

  const [activeTab, setActiveTab] = useState<'basic' | 'videos' | 'settings'>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!studyName.trim()) {
      newErrors.studyName = 'Study name is required';
    }

    if (videoFiles.length === 0) {
      newErrors.videos = 'At least one video file is required';
    }

    if (videoSettings.enableAnnotations && videoSettings.requireAnnotations && videoSettings.minAnnotations === 0) {
      newErrors.annotations = 'Minimum annotations must be greater than 0 when required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVideoUpload = (videoFile: VideoFile) => {
    setVideoFiles(prev => [...prev, videoFile]);
    if (errors.videos) {
      setErrors(prev => ({ ...prev, videos: '' }));
    }
  };

  const handleVideoRemove = (videoId: string) => {
    setVideoFiles(prev => prev.filter(video => video.id !== videoId));
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const methodConfig: VideoAnalysisConfig = {
      methodType: 'video-analysis',
      version: '1.0',
      analysisTypes: ['screen-recording'],
      recordingSettings: {
        recordScreen: true,
        recordCamera: false,
        recordAudio: true,
        quality: 'high'
      },
      aiProcessing: {
        enabled: false,
        features: [],
        confidenceThreshold: 0.8
      },
      privacySettings: {
        blurFaces: false,
        maskPII: false,
        retentionPeriod: 90
      }
    };

    const study: Partial<Study> = {
      id: existingStudy?.id || Date.now(),
      name: studyName,
      description: studyDescription,
      type: 'video-analysis',
      status: 'draft',
      participants: existingStudy?.participants || 0,
      completion: existingStudy?.completion || 0,
      created: existingStudy?.created || new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      methodMeta: RESEARCH_METHOD_METADATA['video-analysis'],
      configuration: {
        maxParticipants: 50,
        minParticipants: 5,
        recruitmentStrategy: 'open',
        collectDemographics: true,
        consentRequired: true,
        estimatedDuration: Math.max(...videoFiles.map(v => v.duration)) + 10 // video duration + 10 min buffer
      },
      methodConfig,
      videoFiles,
      videoSettings,
      settings: {
        theme: 'default',
        showProgress: true,
        allowPause: true,
        allowBacktrack: videoSettings.allowRewatch,
        autoSave: true,
        saveInterval: 30,
        captureTimestamps: true
      },
      metadata: {
        version: '1.0',
        tags: ['video-analysis', 'user-research']
      }
    };

    onSave(study);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = videoFiles.reduce((sum, video) => sum + video.duration, 0);
  const estimatedCompletionTime = totalDuration + (videoFiles.length * 5); // 5 min per video for annotations/feedback

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {existingStudy ? 'Edit Video Analysis Study' : 'Create Video Analysis Study'}
            </h2>
            <p className="text-gray-600 mt-1">
              Set up a professional video research study with advanced analytics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!studyName.trim() || videoFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2 inline" />
              {existingStudy ? 'Update Study' : 'Create Study'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 mr-2 inline" />
            Basic Settings
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'videos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileVideo className="w-4 h-4 mr-2 inline" />
            Videos ({videoFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Play className="w-4 h-4 mr-2 inline" />
            Playback & Analysis
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Name *
              </label>
              <input
                type="text"
                value={studyName}
                onChange={(e) => {
                  setStudyName(e.target.value);
                  if (errors.studyName) {
                    setErrors(prev => ({ ...prev, studyName: '' }));
                  }
                }}
                placeholder="Enter study name..."
                className={`w-full border rounded-lg px-3 py-2 ${
                  errors.studyName ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.studyName && (
                <p className="text-red-600 text-sm mt-1">{errors.studyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Description
              </label>
              <textarea
                value={studyDescription}
                onChange={(e) => setStudyDescription(e.target.value)}
                placeholder="Describe the purpose and goals of this video analysis study..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {videoFiles.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Study Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <FileVideo className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">{videoFiles.length} video(s)</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">~{formatDuration(estimatedCompletionTime)} total</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">5-50 participants</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-6">
            {errors.videos && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{errors.videos}</p>
              </div>
            )}

            <VideoUpload
              onVideoUpload={handleVideoUpload}
              onError={(error) => console.error('Video upload error:', error)}
              maxFileSize={500}
            />

            {videoFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Videos</h3>
                <div className="space-y-4">
                  {videoFiles.map((video, index) => (
                    <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{video.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                            <span>Duration: {formatDuration(video.duration)}</span>
                            <span>Resolution: {video.resolution.width}x{video.resolution.height}</span>
                            <span>Format: {video.format.toUpperCase()}</span>
                          </div>
                          {video.thumbnail && (
                            <img 
                              src={video.thumbnail} 
                              alt="Video thumbnail"
                              className="mt-2 w-32 h-18 object-cover rounded border"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => handleVideoRemove(video.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Playback Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Playback Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Auto-play videos</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.autoPlay}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, autoPlay: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Show native controls</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.showControls}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, showControls: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Allow seeking</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.allowSeek}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, allowSeek: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Allow speed changes</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.allowSpeedChange}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, allowSpeedChange: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Allow fullscreen</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.allowFullscreen}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, allowFullscreen: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Show progress bar</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.showProgressBar}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, showProgressBar: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Show timestamp</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.showTimestamp}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, showTimestamp: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Allow rewatching</label>
                    <input
                      type="checkbox"
                      checked={videoSettings.allowRewatch}
                      onChange={(e) => setVideoSettings(prev => ({ ...prev, allowRewatch: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required watch percentage: {videoSettings.requiredWatchPercentage}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={videoSettings.requiredWatchPercentage}
                  onChange={(e) => setVideoSettings(prev => ({ 
                    ...prev, 
                    requiredWatchPercentage: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Annotation Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <MessageCircle className="w-5 h-5 inline mr-2" />
                Annotation Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable annotations</label>
                  <input
                    type="checkbox"
                    checked={videoSettings.enableAnnotations}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, enableAnnotations: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {videoSettings.enableAnnotations && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Annotation Types
                      </label>
                      <div className="space-y-2">
                        {(['timestamp-comment', 'region-highlight', 'emotion-rating', 'usability-issue', 'comprehension-note', 'suggestion'] as VideoAnnotationType[]).map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={videoSettings.annotationTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setVideoSettings(prev => ({
                                    ...prev,
                                    annotationTypes: [...prev.annotationTypes, type]
                                  }));
                                } else {
                                  setVideoSettings(prev => ({
                                    ...prev,
                                    annotationTypes: prev.annotationTypes.filter(t => t !== type)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Require annotations</label>
                      <input
                        type="checkbox"
                        checked={videoSettings.requireAnnotations}
                        onChange={(e) => setVideoSettings(prev => ({ ...prev, requireAnnotations: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {videoSettings.requireAnnotations && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum annotations required
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={videoSettings.minAnnotations}
                          onChange={(e) => setVideoSettings(prev => ({ 
                            ...prev, 
                            minAnnotations: parseInt(e.target.value) || 0 
                          }))}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        {errors.annotations && (
                          <p className="text-red-600 text-sm mt-1">{errors.annotations}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quality Control Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Control</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Track viewing behavior</label>
                  <input
                    type="checkbox"
                    checked={videoSettings.trackViewingBehavior}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, trackViewingBehavior: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Detect skipping behavior</label>
                  <input
                    type="checkbox"
                    checked={videoSettings.detectSkipping}
                    onChange={(e) => setVideoSettings(prev => ({ ...prev, detectSkipping: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudyCreator;