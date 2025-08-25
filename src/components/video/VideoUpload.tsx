import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Film, AlertCircle, CheckCircle, FileVideo, Loader } from 'lucide-react';
import { VideoFile, VideoResolution, VideoFileMetadata } from '../../types';

interface VideoUploadProps {
  onVideoUpload: (videoFile: VideoFile) => void;
  onError?: (error: string) => void;
  maxFileSize?: number; // in MB, default 500MB
  allowedFormats?: string[]; // default ['mp4', 'webm', 'mov', 'avi']
  className?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoUpload,
  onError,
  maxFileSize = 500,
  allowedFormats = ['mp4', 'webm', 'mov', 'avi'],
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File format not supported. Allowed formats: ${allowedFormats.join(', ')}`
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        isValid: false,
        error: `File size too large. Maximum allowed: ${maxFileSize}MB`
      };
    }

    return { isValid: true };
  };

  const extractVideoMetadata = async (file: File): Promise<{
    duration: number;
    resolution: VideoResolution;
    frameRate: number;
    metadata: VideoFileMetadata;
  }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Determine quality based on resolution
        const width = video.videoWidth;
        const height = video.videoHeight;
        let quality: VideoResolution['quality'] = 'medium';

        if (width >= 3840 || height >= 2160) quality = '4k';
        else if (width >= 1920 || height >= 1080) quality = 'hd';
        else if (width >= 1280 || height >= 720) quality = 'high';
        else if (width >= 640 || height >= 480) quality = 'medium';
        else quality = 'low';

        const resolution: VideoResolution = {
          width,
          height,
          quality
        };

        const metadata: VideoFileMetadata = {
          hasAudio: true, // We'll assume audio is present for now
          hasSubtitles: false,
          tags: []
        };

        resolve({
          duration: video.duration,
          resolution,
          frameRate: 30, // Default frame rate, would need more complex detection for actual value
          metadata
        });

        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const generateThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.addEventListener('loadedmetadata', () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to 10% of video duration for thumbnail
        video.currentTime = video.duration * 0.1;
      });

      video.addEventListener('seeked', () => {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);
        
        // Convert to data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
        
        URL.revokeObjectURL(video.src);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to generate thumbnail'));
        URL.revokeObjectURL(video.src);
      });

      video.src = URL.createObjectURL(file);
    });
  };

  const processVideoFile = async (file: File): Promise<VideoFile> => {
    setIsProcessing(true);
    setUploadError(null);

    try {
      // Extract metadata
      const { duration, resolution, frameRate, metadata } = await extractVideoMetadata(file);
      
      // Generate thumbnail
      const thumbnail = await generateThumbnail(file);
      
      // Create object URL for video
      const videoUrl = URL.createObjectURL(file);

      const videoFile: VideoFile = {
        id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        originalName: file.name,
        size: file.size,
        duration,
        format: file.name.split('.').pop()?.toLowerCase() || 'mp4',
        resolution,
        frameRate,
        uploadedAt: Date.now(),
        url: videoUrl,
        thumbnail,
        metadata,
        processingStatus: 'ready'
      };

      return videoFile;
    } catch (error) {
      throw new Error(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid file');
      onError?.(validation.error || 'Invalid file');
      return;
    }

    // Set preview
    setPreviewVideo(URL.createObjectURL(file));

    try {
      // Simulate upload progress
      setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });
      
      // Simulate progressive upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress({
          loaded: (file.size * i) / 100,
          total: file.size,
          percentage: i
        });
      }

      // Process video file
      const videoFile = await processVideoFile(file);
      
      // Call success callback
      onVideoUpload(videoFile);
      
      // Reset states
      setUploadProgress(null);
      setPreviewVideo(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      onError?.(errorMessage);
      setUploadProgress(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    if (previewVideo) {
      URL.revokeObjectURL(previewVideo);
    }
    setPreviewVideo(null);
    setUploadError(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`video-upload-container ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedFormats.map(format => `.${format}`).join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Upload Area */}
      {!previewVideo && !uploadProgress && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploadError ? 'border-red-300 bg-red-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-3 rounded-full ${
              uploadError 
                ? 'bg-red-100 text-red-600' 
                : isDragging 
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {uploadError ? <AlertCircle size={32} /> : <FileVideo size={32} />}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {uploadError ? 'Upload Error' : 'Upload Video File'}
              </h3>
              
              {uploadError ? (
                <p className="text-red-600 mb-4">{uploadError}</p>
              ) : (
                <p className="text-gray-500 mb-4">
                  Drag and drop your video file here, or click to browse
                </p>
              )}

              <button
                onClick={uploadError ? clearPreview : handleBrowseClick}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-colors
                  ${uploadError
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                {uploadError ? 'Try Again' : 'Browse Files'}
              </button>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>Supported formats: {allowedFormats.join(', ').toUpperCase()}</p>
              <p>Maximum file size: {maxFileSize}MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="border-2 border-blue-200 rounded-lg p-8 bg-blue-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Upload size={32} />
            </div>

            <div className="w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                {isProcessing ? 'Processing Video...' : 'Uploading Video...'}
              </h3>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}</span>
                <span>{Math.round(uploadProgress.percentage)}%</span>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center mt-4 text-blue-600">
                  <Loader className="animate-spin mr-2" size={16} />
                  <span className="text-sm">Extracting video metadata...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {previewVideo && !uploadProgress && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="relative">
            <video
              src={previewVideo}
              controls
              className="w-full h-64 object-cover"
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
              }}
            />
            
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 bg-gray-50">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Film size={16} />
              <span>Video preview ready</span>
              <CheckCircle className="text-green-600" size={16} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;