import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export interface VideoProcessingOptions {
  // Compression settings
  compression: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high' | 'custom';
    customCRF?: number; // 18-28 for good quality, lower = better quality
    targetBitrate?: string; // e.g., '2000k', '5000k'
    maxWidth?: number;
    maxHeight?: number;
  };
  
  // Format conversion
  outputFormat?: 'mp4' | 'webm' | 'hls' | 'original';
  
  // Audio processing
  audio: {
    enabled: boolean;
    bitrate?: string; // e.g., '128k', '192k'
    normalize?: boolean;
  };
  
  // Thumbnail generation
  thumbnails: {
    enabled: boolean;
    count: number; // number of thumbnails to generate
    width?: number;
    height?: number;
    format?: 'jpg' | 'png' | 'webp';
    quality?: number; // 1-100 for JPEG quality
  };
  
  // HLS streaming preparation
  hls: {
    enabled: boolean;
    segmentDuration?: number; // seconds per segment, default 6
    qualities?: HLSQuality[];
  };
  
  // Progress callback
  onProgress?: (progress: number) => void;
  
  // Memory management
  maxMemoryUsage?: number; // in MB
}

export interface HLSQuality {
  name: string;
  width: number;
  height: number;
  bitrate: string;
  maxrate: string;
  bufsize: string;
}

export interface VideoProcessingResult {
  success: boolean;
  processedFile?: File;
  thumbnails?: File[];
  hlsPlaylist?: string;
  hlsSegments?: File[];
  metadata: {
    originalSize: number;
    processedSize?: number;
    compressionRatio?: number;
    duration: number;
    resolution: { width: number; height: number };
    bitrate?: string;
    frameRate?: number;
  };
  processingTime: number;
  error?: string;
}

export interface ThumbnailGenerationOptions {
  timestamps?: number[]; // specific timestamps in seconds
  count?: number; // auto-generate count thumbnails evenly spaced
  width?: number;
  height?: number;
  format?: 'jpg' | 'png' | 'webp';
  quality?: number;
}

class VideoProcessor {
  private ffmpeg: FFmpeg;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.ffmpeg = new FFmpeg();
    
    // Set up progress logging
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadFFmpeg();
    return this.loadingPromise;
  }

  private async loadFFmpeg(): Promise<void> {
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.0/dist/esm';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      this.isLoaded = true;
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error(`FFmpeg initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processVideo(file: File, options: VideoProcessingOptions): Promise<VideoProcessingResult> {
    const startTime = Date.now();
    
    try {
      await this.initialize();
      
      // Write input file to FFmpeg filesystem
      const inputFileName = 'input.' + this.getFileExtension(file.name);
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(file));
      
      const result: VideoProcessingResult = {
        success: false,
        metadata: {
          originalSize: file.size,
          duration: 0,
          resolution: { width: 0, height: 0 }
        },
        processingTime: 0
      };

      // Get video metadata first
      const metadata = await this.getVideoMetadata(inputFileName);
      result.metadata = { ...result.metadata, ...metadata };

      // Process main video if needed
      if (options.compression.enabled || options.outputFormat !== 'original') {
        const processedFile = await this.compressVideo(inputFileName, file.name, options);
        result.processedFile = processedFile;
        result.metadata.processedSize = processedFile.size;
        result.metadata.compressionRatio = file.size / processedFile.size;
      }

      // Generate thumbnails if requested
      if (options.thumbnails.enabled) {
        result.thumbnails = await this.generateThumbnails(inputFileName, {
          count: options.thumbnails.count,
          width: options.thumbnails.width,
          height: options.thumbnails.height,
          format: options.thumbnails.format,
          quality: options.thumbnails.quality
        });
      }

      // Generate HLS playlist if requested
      if (options.hls.enabled) {
        const hlsResult = await this.generateHLS(inputFileName, options);
        result.hlsPlaylist = hlsResult.playlist;
        result.hlsSegments = hlsResult.segments;
      }

      result.success = true;
      result.processingTime = Date.now() - startTime;
      
      return result;
    } catch (error) {
      return {
        success: false,
        metadata: {
          originalSize: file.size,
          duration: 0,
          resolution: { width: 0, height: 0 }
        },
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }

  private async getVideoMetadata(fileName: string): Promise<Partial<VideoProcessingResult['metadata']>> {
    try {
      // Use ffprobe-like functionality to get metadata
      await this.ffmpeg.exec([
        '-i', fileName,
        '-f', 'null', 
        '-'
      ]);

      // Parse metadata from logs (simplified approach)
      // In a real implementation, you'd use ffprobe or parse the detailed output
      return {
        duration: 0, // Would extract from logs
        resolution: { width: 1920, height: 1080 }, // Would extract from logs
        frameRate: 30, // Would extract from logs
        bitrate: '5000k' // Would extract from logs
      };
    } catch (error) {
      console.warn('Could not extract detailed metadata:', error);
      return {};
    }
  }

  private async compressVideo(inputFileName: string, originalName: string, options: VideoProcessingOptions): Promise<File> {
    const outputFileName = 'output.' + (options.outputFormat === 'original' ? 
      this.getFileExtension(originalName) : options.outputFormat);
    
    const args = ['-i', inputFileName];
    
    // Video codec and compression settings
    if (options.compression.enabled) {
      args.push('-c:v', 'libx264');
      
      if (options.compression.quality === 'custom' && options.compression.customCRF) {
        args.push('-crf', options.compression.customCRF.toString());
      } else {
        const crfMap = { low: '28', medium: '23', high: '18' };
        args.push('-crf', crfMap[options.compression.quality] || '23');
      }
      
      if (options.compression.targetBitrate) {
        args.push('-b:v', options.compression.targetBitrate);
      }
      
      // Resolution scaling
      if (options.compression.maxWidth && options.compression.maxHeight) {
        args.push('-vf', `scale='min(${options.compression.maxWidth},iw)':'min(${options.compression.maxHeight},ih)':force_original_aspect_ratio=decrease`);
      }
    }
    
    // Audio settings
    if (options.audio.enabled) {
      args.push('-c:a', 'aac');
      if (options.audio.bitrate) {
        args.push('-b:a', options.audio.bitrate);
      }
      if (options.audio.normalize) {
        args.push('-af', 'loudnorm');
      }
    } else {
      args.push('-an'); // No audio
    }
    
    // Output settings
    args.push('-preset', 'medium'); // Balance between speed and compression
    args.push('-movflags', '+faststart'); // Enable fast start for web playback
    args.push(outputFileName);
    
    // Set up progress tracking
    if (options.onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        options.onProgress!(progress * 100);
      });
    }
    
    await this.ffmpeg.exec(args);
    
    // Read the output file
    const data = await this.ffmpeg.readFile(outputFileName) as Uint8Array;
    const processedFile = new File([data.buffer as ArrayBuffer], originalName, { 
      type: this.getMimeType(options.outputFormat || this.getFileExtension(originalName)) 
    });
    
    // Clean up
    await this.ffmpeg.deleteFile(outputFileName);
    
    return processedFile;
  }

  async generateThumbnails(
    inputFileName: string, 
    options: ThumbnailGenerationOptions
  ): Promise<File[]> {
    const thumbnails: File[] = [];
    const format = options.format || 'jpg';
    const quality = options.quality || 80;
    
    let timestamps: number[] = [];
    
    if (options.timestamps) {
      timestamps = options.timestamps;
    } else if (options.count) {
      // Generate evenly spaced thumbnails
      // Note: In a real implementation, you'd get the actual video duration
      const duration = 60; // Placeholder - would get from metadata
      for (let i = 0; i < options.count; i++) {
        timestamps.push((duration / (options.count + 1)) * (i + 1));
      }
    }
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputFileName = `thumbnail_${i}.${format}`;
      
      const args = [
        '-i', inputFileName,
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-f', 'image2'
      ];
      
      // Resolution settings
      if (options.width && options.height) {
        args.push('-vf', `scale=${options.width}:${options.height}`);
      }
      
      // Quality settings for JPEG
      if (format === 'jpg' && quality) {
        args.push('-q:v', Math.round((100 - quality) / 10).toString());
      }
      
      args.push(outputFileName);
      
      await this.ffmpeg.exec(args);
      
      // Read the thumbnail file
      const data = await this.ffmpeg.readFile(outputFileName) as Uint8Array;
      const thumbnail = new File([data.buffer as ArrayBuffer], `thumbnail_${timestamp}s.${format}`, {
        type: `image/${format === 'jpg' ? 'jpeg' : format}`
      });
      
      thumbnails.push(thumbnail);
      
      // Clean up
      await this.ffmpeg.deleteFile(outputFileName);
    }
    
    return thumbnails;
  }

  private async generateHLS(
    inputFileName: string, 
    options: VideoProcessingOptions
  ): Promise<{ playlist: string; segments: File[] }> {
    const segmentDuration = options.hls.segmentDuration || 6;
    const qualities = options.hls.qualities || [
      {
        name: '720p',
        width: 1280,
        height: 720,
        bitrate: '2500k',
        maxrate: '2675k',
        bufsize: '3750k'
      }
    ];
    
    const segments: File[] = [];
    let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:' + segmentDuration + '\n';
    
    // For simplicity, generate a single quality level
    // In production, you'd generate multiple qualities and a master playlist
    const quality = qualities[0];
    
    const args = [
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-b:v', quality.bitrate,
      '-maxrate', quality.maxrate,
      '-bufsize', quality.bufsize,
      '-vf', `scale=${quality.width}:${quality.height}`,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-hls_time', segmentDuration.toString(),
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', 'segment_%03d.ts',
      'playlist.m3u8'
    ];
    
    await this.ffmpeg.exec(args);
    
    // Read playlist
    const playlistData = await this.ffmpeg.readFile('playlist.m3u8') as Uint8Array;
    playlist = new TextDecoder().decode(playlistData);
    
    // Read segments
    const files = await this.ffmpeg.listDir('.');
    for (const file of files) {
      if (file.name.startsWith('segment_') && file.name.endsWith('.ts')) {
        const segmentData = await this.ffmpeg.readFile(file.name) as Uint8Array;
        const segment = new File([segmentData.buffer as ArrayBuffer], file.name, { type: 'video/mp2t' });
        segments.push(segment);
        
        // Clean up
        await this.ffmpeg.deleteFile(file.name);
      }
    }
    
    // Clean up playlist file
    await this.ffmpeg.deleteFile('playlist.m3u8');
    
    return { playlist, segments };
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || 'mp4';
  }

  private getMimeType(format: string): string {
    const mimeMap: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska'
    };
    return mimeMap[format] || 'video/mp4';
  }

  // Utility method for quick thumbnail generation
  async generateSingleThumbnail(
    file: File, 
    timestamp: number = 5, 
    width: number = 320, 
    height: number = 180
  ): Promise<File | null> {
    try {
      await this.initialize();
      
      const inputFileName = 'input.' + this.getFileExtension(file.name);
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(file));
      
      const thumbnails = await this.generateThumbnails(inputFileName, {
        timestamps: [timestamp],
        width,
        height,
        format: 'jpg',
        quality: 80
      });
      
      // Clean up
      await this.ffmpeg.deleteFile(inputFileName);
      
      return thumbnails.length > 0 ? thumbnails[0] : null;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  // Memory management
  cleanup(): void {
    if (this.isLoaded) {
      // FFmpeg doesn't have an explicit cleanup method
      // Memory is managed by the browser's garbage collector
      console.log('VideoProcessor cleanup requested');
    }
  }
}

// Singleton instance
let videoProcessorInstance: VideoProcessor | null = null;

export const getVideoProcessor = (): VideoProcessor => {
  if (!videoProcessorInstance) {
    videoProcessorInstance = new VideoProcessor();
  }
  return videoProcessorInstance;
};

// Utility functions for common operations
export const compressVideoFile = async (
  file: File, 
  quality: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: (progress: number) => void
): Promise<File | null> => {
  const processor = getVideoProcessor();
  
  const options: VideoProcessingOptions = {
    compression: {
      enabled: true,
      quality,
      maxWidth: quality === 'high' ? undefined : (quality === 'medium' ? 1920 : 1280),
      maxHeight: quality === 'high' ? undefined : (quality === 'medium' ? 1080 : 720)
    },
    audio: {
      enabled: true,
      bitrate: '128k'
    },
    thumbnails: {
      enabled: false,
      count: 0
    },
    hls: {
      enabled: false
    },
    onProgress
  };
  
  const result = await processor.processVideo(file, options);
  return result.success ? result.processedFile || null : null;
};

export const generateVideoThumbnails = async (
  file: File,
  count: number = 5
): Promise<File[]> => {
  const processor = getVideoProcessor();
  
  const options: VideoProcessingOptions = {
    compression: {
      enabled: false,
      quality: 'medium'
    },
    audio: {
      enabled: false
    },
    thumbnails: {
      enabled: true,
      count,
      width: 320,
      height: 180,
      format: 'jpg',
      quality: 80
    },
    hls: {
      enabled: false
    }
  };
  
  const result = await processor.processVideo(file, options);
  return result.success ? result.thumbnails || [] : [];
};

export const prepareVideoForHLS = async (
  file: File,
  qualities?: HLSQuality[],
  onProgress?: (progress: number) => void
): Promise<{ playlist: string; segments: File[] } | null> => {
  const processor = getVideoProcessor();
  
  const options: VideoProcessingOptions = {
    compression: {
      enabled: true,
      quality: 'medium'
    },
    audio: {
      enabled: true,
      bitrate: '128k'
    },
    thumbnails: {
      enabled: false,
      count: 0
    },
    hls: {
      enabled: true,
      segmentDuration: 6,
      qualities
    },
    onProgress
  };
  
  const result = await processor.processVideo(file, options);
  
  if (result.success && result.hlsPlaylist && result.hlsSegments) {
    return {
      playlist: result.hlsPlaylist,
      segments: result.hlsSegments
    };
  }
  
  return null;
};