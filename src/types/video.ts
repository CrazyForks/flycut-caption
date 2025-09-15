// 视频相关类型定义

export interface VideoFile {
  file: File;
  url: string;
  duration: number;
  size: number;
  type: string;
  name: string;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
}

export interface VideoSegment {
  start: number;
  end: number;
  keep: boolean; // true = 保留, false = 删除
  text?: string; // 字幕文本内容
  id?: string; // 字幕片段ID
}

export interface VideoProcessingProgress {
  stage: 'analyzing' | 'cutting' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export interface VideoProcessorConfig {
  engine: 'webav' | 'ffmpeg.wasm';
  outputFormat: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';
  preserveAudio: boolean;
}

export interface ExportOptions {
  format: 'mp4' | 'webm' | 'avi';
  quality: 'high' | 'medium' | 'low';
  includeSubtitles: boolean;
  subtitleFormat?: 'srt' | 'vtt' | 'json';
}

export type VideoAction =
  | { type: 'SET_VIDEO_FILE'; videoFile: VideoFile }
  | { type: 'SET_PLAYER_STATE'; playerState: Partial<VideoPlayerState> }
  | { type: 'SET_PROCESSING_PROGRESS'; progress: VideoProcessingProgress }
  | { type: 'SET_PROCESSOR_CONFIG'; config: Partial<VideoProcessorConfig> }
  | { type: 'RESET_VIDEO' };