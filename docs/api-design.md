# FlyCut Caption API 设计文档

## 📋 API 设计概览

本文档详细说明 FlyCut Caption Tauri 后端 API 的设计，包括命令接口、数据模型、错误处理和事件系统。

## 🏗️ API 架构设计

### 分层架构

```
Frontend (React/TypeScript)
        ↕️ Tauri IPC
Backend Commands Layer
        ↕️ Service Interfaces  
Business Services Layer
        ↕️ External APIs
External Dependencies (Whisper.cpp, FFmpeg)
```

### 核心设计原则

1. **类型安全**: 前后端完全类型化
2. **异步优先**: 所有耗时操作异步处理
3. **错误透明**: 结构化错误处理和传递
4. **进度可见**: 长时间操作提供进度反馈
5. **资源管理**: 自动清理临时资源

## 🎯 核心 API 模块

### 1. 文件操作模块 (File Operations)

#### 命令接口

```rust
#[tauri::command]
pub async fn select_video_file(
    filters: Option<Vec<FileFilter>>,
) -> Result<Option<String>, FileError> {
    // 文件选择对话框
}

#[tauri::command]  
pub async fn get_file_info(
    path: String,
) -> Result<FileInfo, FileError> {
    // 获取文件基本信息
}

#[tauri::command]
pub async fn save_video_file(
    content: Vec<u8>,
    suggested_name: Option<String>,
) -> Result<Option<String>, FileError> {
    // 保存视频文件对话框
}
```

#### 数据模型

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub extension: Option<String>,
    pub mime_type: Option<String>,
    pub created: Option<SystemTime>,
    pub modified: Option<SystemTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Debug, thiserror::Error, Serialize)]
pub enum FileError {
    #[error("文件不存在: {path}")]
    FileNotFound { path: String },
    #[error("权限不足: {message}")]
    PermissionDenied { message: String },
    #[error("IO 错误: {message}")]
    IoError { message: String },
    #[error("用户取消操作")]
    UserCancelled,
}
```

#### TypeScript 接口

```typescript
// src/services/fileService.ts
import { invoke } from '@tauri-apps/api/tauri';

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  extension?: string;
  mimeType?: string;
  created?: string;
  modified?: string;
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export class FileService {
  static async selectVideoFile(
    filters?: FileFilter[]
  ): Promise<string | null> {
    return await invoke('select_video_file', { filters });
  }

  static async getFileInfo(path: string): Promise<FileInfo> {
    return await invoke('get_file_info', { path });
  }

  static async saveVideoFile(
    content: Uint8Array,
    suggestedName?: string
  ): Promise<string | null> {
    return await invoke('save_video_file', { 
      content: Array.from(content), 
      suggestedName 
    });
  }
}
```

### 2. ASR 处理模块 (Speech Recognition)

#### 命令接口

```rust
#[tauri::command]
pub async fn get_available_models() -> Result<Vec<ModelInfo>, ASRError> {
    // 获取可用的 Whisper 模型列表
}

#[tauri::command]
pub async fn download_model(
    model_name: String,
    window: Window,
) -> Result<(), ASRError> {
    // 下载指定模型
}

#[tauri::command]
pub async fn transcribe_audio(
    audio_path: String,
    options: TranscriptionOptions,
    window: Window,
) -> Result<TranscriptResult, ASRError> {
    // 执行音频转录
}

#[tauri::command]
pub async fn cancel_transcription(
    task_id: String,
) -> Result<(), ASRError> {
    // 取消正在进行的转录任务
}
```

#### 数据模型

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub display_name: String,
    pub size_mb: u32,
    pub languages: Vec<String>,
    pub is_downloaded: bool,
    pub download_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionOptions {
    pub model: String,
    pub language: Option<String>,
    pub translate: bool,
    pub word_timestamps: bool,
    pub temperature: f32,
    pub beam_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptResult {
    pub language: String,
    pub duration: f64,
    pub chunks: Vec<SubtitleChunk>,
    pub confidence: f32,
    pub processing_time: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleChunk {
    pub id: String,
    pub timestamp: [f64; 2], // [start, end]
    pub text: String,
    pub confidence: f32,
    pub words: Option<Vec<WordInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordInfo {
    pub word: String,
    pub start: f64,
    pub end: f64,
    pub confidence: f32,
}

// 进度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionProgress {
    pub task_id: String,
    pub progress: f32, // 0.0 - 1.0
    pub stage: String, // "loading", "processing", "completing"
    pub message: String,
    pub elapsed_time: f64,
    pub estimated_remaining: Option<f64>,
}

#[derive(Debug, thiserror::Error, Serialize)]
pub enum ASRError {
    #[error("模型未找到: {model}")]
    ModelNotFound { model: String },
    #[error("模型下载失败: {message}")]
    ModelDownloadFailed { message: String },
    #[error("音频文件无效: {path}")]
    InvalidAudioFile { path: String },
    #[error("转录被取消")]
    TranscriptionCancelled,
    #[error("转录失败: {message}")]
    TranscriptionFailed { message: String },
    #[error("资源不足: {message}")]
    InsufficientResources { message: String },
}
```

#### TypeScript 接口

```typescript
// src/services/asrService.ts
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface ModelInfo {
  name: string;
  displayName: string;
  sizeMb: number;
  languages: string[];
  isDownloaded: boolean;
  downloadUrl: string;
}

export interface TranscriptionOptions {
  model: string;
  language?: string;
  translate: boolean;
  wordTimestamps: boolean;
  temperature: number;
  beamSize?: number;
}

export interface TranscriptionProgress {
  taskId: string;
  progress: number;
  stage: string;
  message: string;
  elapsedTime: number;
  estimatedRemaining?: number;
}

export class ASRService {
  static async getAvailableModels(): Promise<ModelInfo[]> {
    return await invoke('get_available_models');
  }

  static async downloadModel(modelName: string): Promise<void> {
    return await invoke('download_model', { modelName });
  }

  static async transcribeAudio(
    audioPath: string,
    options: TranscriptionOptions
  ): Promise<TranscriptResult> {
    return await invoke('transcribe_audio', { audioPath, options });
  }

  static async onTranscriptionProgress(
    callback: (progress: TranscriptionProgress) => void
  ): Promise<UnlistenFn> {
    return await listen('transcription-progress', (event) => {
      callback(event.payload as TranscriptionProgress);
    });
  }

  static async cancelTranscription(taskId: string): Promise<void> {
    return await invoke('cancel_transcription', { taskId });
  }
}
```

### 3. 视频处理模块 (Video Processing)

#### 命令接口

```rust
#[tauri::command]
pub async fn get_video_info(
    path: String,
) -> Result<VideoInfo, VideoError> {
    // 获取视频基本信息
}

#[tauri::command]
pub async fn extract_audio(
    video_path: String,
    audio_path: String,
    options: AudioExtractionOptions,
    window: Window,
) -> Result<(), VideoError> {
    // 从视频提取音频
}

#[tauri::command]
pub async fn export_video(
    input_path: String,
    segments: Vec<TimeSegment>,
    output_path: String,
    options: VideoExportOptions,
    window: Window,
) -> Result<(), VideoError> {
    // 导出处理后的视频
}

#[tauri::command]
pub async fn cancel_video_processing(
    task_id: String,
) -> Result<(), VideoError> {
    // 取消视频处理任务
}
```

#### 数据模型

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub path: String,
    pub duration: f64,
    pub fps: f64,
    pub width: u32,
    pub height: u32,
    pub codec: String,
    pub bitrate: u64,
    pub audio_codec: Option<String>,
    pub audio_sample_rate: Option<u32>,
    pub audio_channels: Option<u32>,
    pub file_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSegment {
    pub start: f64,
    pub end: f64,
    pub id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioExtractionOptions {
    pub format: AudioFormat,
    pub sample_rate: u32,
    pub channels: AudioChannels,
    pub quality: AudioQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioFormat {
    WAV,
    MP3,
    AAC,
    FLAC,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioChannels {
    Mono,
    Stereo,
    Original,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioQuality {
    Low,    // 96kbps
    Medium, // 128kbps
    High,   // 192kbps
    Lossless,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoExportOptions {
    pub quality: VideoQuality,
    pub codec: VideoCodec,
    pub hardware_acceleration: bool,
    pub preserve_metadata: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoQuality {
    Low,    // CRF 28
    Medium, // CRF 23
    High,   // CRF 18
    Lossless, // CRF 0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoCodec {
    H264,
    H265,
    VP9,
    AV1,
}

// 进度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoProcessingProgress {
    pub task_id: String,
    pub progress: f32,
    pub stage: String,
    pub fps: Option<f64>,
    pub estimated_size: Option<u64>,
    pub elapsed_time: f64,
    pub estimated_remaining: Option<f64>,
}

#[derive(Debug, thiserror::Error, Serialize)]
pub enum VideoError {
    #[error("视频文件无效: {path}")]
    InvalidVideoFile { path: String },
    #[error("不支持的格式: {format}")]
    UnsupportedFormat { format: String },
    #[error("FFmpeg 错误: {message}")]
    FFmpegError { message: String },
    #[error("硬件加速不可用")]
    HardwareAccelerationUnavailable,
    #[error("处理被取消")]
    ProcessingCancelled,
    #[error("磁盘空间不足")]
    InsufficientDiskSpace,
}
```

#### TypeScript 接口

```typescript
// src/services/videoService.ts
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface VideoInfo {
  path: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  audioCodec?: string;
  audioSampleRate?: number;
  audioChannels?: number;
  fileSize: number;
}

export interface TimeSegment {
  start: number;
  end: number;
  id?: string;
}

export interface VideoExportOptions {
  quality: 'low' | 'medium' | 'high' | 'lossless';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  hardwareAcceleration: boolean;
  preserveMetadata: boolean;
}

export interface VideoProcessingProgress {
  taskId: string;
  progress: number;
  stage: string;
  fps?: number;
  estimatedSize?: number;
  elapsedTime: number;
  estimatedRemaining?: number;
}

export class VideoService {
  static async getVideoInfo(path: string): Promise<VideoInfo> {
    return await invoke('get_video_info', { path });
  }

  static async extractAudio(
    videoPath: string,
    audioPath: string,
    options: AudioExtractionOptions
  ): Promise<void> {
    return await invoke('extract_audio', { videoPath, audioPath, options });
  }

  static async exportVideo(
    inputPath: string,
    segments: TimeSegment[],
    outputPath: string,
    options: VideoExportOptions
  ): Promise<void> {
    return await invoke('export_video', { 
      inputPath, 
      segments, 
      outputPath, 
      options 
    });
  }

  static async onVideoProcessingProgress(
    callback: (progress: VideoProcessingProgress) => void
  ): Promise<UnlistenFn> {
    return await listen('video-processing-progress', (event) => {
      callback(event.payload as VideoProcessingProgress);
    });
  }
}
```

### 4. 系统集成模块 (System Integration)

#### 命令接口

```rust
#[tauri::command]
pub async fn show_notification(
    title: String,
    body: String,
    icon: Option<String>,
) -> Result<(), SystemError> {
    // 显示系统通知
}

#[tauri::command]
pub async fn open_file_in_explorer(
    path: String,
) -> Result<(), SystemError> {
    // 在文件管理器中打开文件
}

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, SystemError> {
    // 获取系统信息
}

#[tauri::command]
pub async fn check_hardware_acceleration() -> Result<HardwareCapabilities, SystemError> {
    // 检查硬件加速能力
}
```

#### 数据模型

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub cpu_count: usize,
    pub total_memory: u64,
    pub available_memory: u64,
    pub gpu_info: Option<Vec<GPUInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GPUInfo {
    pub name: String,
    pub vendor: String,
    pub memory: Option<u64>,
    pub cuda_support: bool,
    pub opencl_support: bool,
    pub metal_support: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareCapabilities {
    pub cpu_instructions: Vec<String>, // SSE, AVX, etc.
    pub gpu_acceleration: GPUAcceleration,
    pub video_encode: Vec<String>, // NVENC, Quick Sync, etc.
    pub video_decode: Vec<String>, // NVDEC, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GPUAcceleration {
    pub cuda: bool,
    pub opencl: bool,
    pub metal: bool,
    pub directx: bool,
    pub vulkan: bool,
}
```

## 🔄 事件系统设计

### 事件类型定义

```rust
// src-tauri/src/events.rs
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum AppEvent {
    // ASR 相关事件
    TranscriptionStarted { task_id: String },
    TranscriptionProgress { progress: TranscriptionProgress },
    TranscriptionCompleted { task_id: String, result: TranscriptResult },
    TranscriptionFailed { task_id: String, error: String },
    
    // 视频处理相关事件
    VideoProcessingStarted { task_id: String },
    VideoProcessingProgress { progress: VideoProcessingProgress },
    VideoProcessingCompleted { task_id: String, output_path: String },
    VideoProcessingFailed { task_id: String, error: String },
    
    // 模型下载相关事件
    ModelDownloadStarted { model_name: String },
    ModelDownloadProgress { model_name: String, progress: f32 },
    ModelDownloadCompleted { model_name: String },
    ModelDownloadFailed { model_name: String, error: String },
    
    // 系统相关事件
    SystemResourceWarning { message: String },
    ApplicationUpdated { version: String },
}
```

### 前端事件监听

```typescript
// src/services/eventService.ts
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export class EventService {
  private static listeners: Map<string, UnlistenFn> = new Map();

  static async onTranscriptionProgress(
    callback: (progress: TranscriptionProgress) => void
  ): Promise<string> {
    const unlisten = await listen('transcription-progress', (event) => {
      callback(event.payload as TranscriptionProgress);
    });
    
    const listenerId = `transcription-progress-${Date.now()}`;
    this.listeners.set(listenerId, unlisten);
    return listenerId;
  }

  static async onVideoProcessingProgress(
    callback: (progress: VideoProcessingProgress) => void
  ): Promise<string> {
    const unlisten = await listen('video-processing-progress', (event) => {
      callback(event.payload as VideoProcessingProgress);
    });
    
    const listenerId = `video-processing-progress-${Date.now()}`;
    this.listeners.set(listenerId, unlisten);
    return listenerId;
  }

  static removeListener(listenerId: string): void {
    const unlisten = this.listeners.get(listenerId);
    if (unlisten) {
      unlisten();
      this.listeners.delete(listenerId);
    }
  }

  static removeAllListeners(): void {
    for (const [id, unlisten] of this.listeners) {
      unlisten();
    }
    this.listeners.clear();
  }
}
```

## 🛡️ 错误处理策略

### 统一错误类型

```rust
// src-tauri/src/error.rs
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum AppError {
    #[error(transparent)]
    File(#[from] FileError),
    
    #[error(transparent)]
    ASR(#[from] ASRError),
    
    #[error(transparent)]
    Video(#[from] VideoError),
    
    #[error(transparent)]
    System(#[from] SystemError),
    
    #[error("未知错误: {message}")]
    Unknown { message: String },
}

impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
```

### 前端错误处理

```typescript
// src/utils/errorHandler.ts
export interface AppError {
  type: 'file' | 'asr' | 'video' | 'system' | 'unknown';
  message: string;
  details?: Record<string, any>;
}

export function parseError(error: string): AppError {
  try {
    const parsed = JSON.parse(error);
    return {
      type: parsed.type || 'unknown',
      message: parsed.message || error,
      details: parsed.details,
    };
  } catch {
    return {
      type: 'unknown',
      message: error,
    };
  }
}

export function handleAPIError(error: string): void {
  const appError = parseError(error);
  
  // 根据错误类型执行不同的处理逻辑
  switch (appError.type) {
    case 'file':
      console.error('File error:', appError.message);
      // 显示文件相关错误提示
      break;
    case 'asr':
      console.error('ASR error:', appError.message);
      // 显示 ASR 相关错误提示
      break;
    case 'video':
      console.error('Video error:', appError.message);
      // 显示视频处理错误提示
      break;
    default:
      console.error('Unknown error:', appError.message);
  }
}
```

## 📝 API 使用示例

### 完整的 ASR 处理流程

```typescript
// src/hooks/useASR.ts
import { useState, useCallback } from 'react';
import { ASRService, EventService } from '@/services';

export function useASR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcribeAudio = useCallback(async (
    audioPath: string,
    options: TranscriptionOptions
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // 监听进度事件
      const progressListenerId = await EventService.onTranscriptionProgress(setProgress);
      
      // 执行转录
      const result = await ASRService.transcribeAudio(audioPath, options);
      setResult(result);
      
      // 清理监听器
      EventService.removeListener(progressListenerId);
    } catch (err) {
      setError(err as string);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  return {
    isProcessing,
    progress,
    result,
    error,
    transcribeAudio,
  };
}
```

### 完整的视频处理流程

```typescript
// src/hooks/useVideoProcessing.ts
import { useState, useCallback } from 'react';
import { VideoService, EventService } from '@/services';

export function useVideoProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<VideoProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportVideo = useCallback(async (
    inputPath: string,
    segments: TimeSegment[],
    outputPath: string,
    options: VideoExportOptions
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // 监听进度事件
      const progressListenerId = await EventService.onVideoProcessingProgress(setProgress);
      
      // 执行视频导出
      await VideoService.exportVideo(inputPath, segments, outputPath, options);
      
      // 清理监听器
      EventService.removeListener(progressListenerId);
    } catch (err) {
      setError(err as string);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  return {
    isProcessing,
    progress,
    error,
    exportVideo,
  };
}
```

这个详细的 API 设计文档为 FlyCut Caption 的 Tauri 后端提供了完整的接口规范，确保前后端的类型安全和一致性，同时提供了良好的错误处理和进度反馈机制。