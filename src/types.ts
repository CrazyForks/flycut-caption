import type { CSSProperties } from 'react'

// Define all types locally to avoid rollup issues
export interface VideoFile {
  file: File
  url: string
  duration: number
  size: number
  type: string
  name: string
}

export interface SubtitleChunk {
  id: string
  text: string
  timestamp: [number, number]
  deleted?: boolean
}

export interface VideoSegment {
  start: number
  end: number
  keep: boolean
  text?: string
  id?: string
}

export interface VideoProcessingProgress {
  stage: 'analyzing' | 'cutting' | 'encoding' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
}

export interface ASRProgress {
  stage: 'initializing' | 'processing' | 'completed' | 'error'
  progress: number
  message?: string
}

export interface SubtitleStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  color: string
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  padding: number
  position: 'top' | 'center' | 'bottom'
  alignment: 'left' | 'center' | 'right'
  opacity: number
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
}

// FlyCut Caption specific configuration
export interface FlyCutCaptionConfig {
  /** Theme mode */
  theme?: 'light' | 'dark' | 'auto'
  /** Interface language (zh-CN, en-US, etc.) */
  language?: string
  /** ASR recognition language */
  asrLanguage?: string
  /** Enable drag and drop file upload */
  enableDragDrop?: boolean
  /** Enable export functionality */
  enableExport?: boolean
  /** Enable video processing functionality */
  enableVideoProcessing?: boolean
  /** Maximum file size in MB */
  maxFileSize?: number
  /** Supported file formats */
  supportedFormats?: string[]
}

// FlyCut Caption component props
export interface FlyCutCaptionProps {
  /** Custom CSS class name */
  className?: string
  /** Custom inline styles */
  style?: CSSProperties
  /** Component configuration */
  config?: FlyCutCaptionConfig
  /** Called when component is ready */
  onReady?: () => void
  /** Called when a file is selected */
  onFileSelected?: (file: VideoFile) => void
  /** Called when subtitles are generated */
  onSubtitleGenerated?: (subtitles: SubtitleChunk[]) => void
  /** Called when subtitles are changed */
  onSubtitleChanged?: (subtitles: SubtitleChunk[]) => void
  /** Called when video processing is complete */
  onVideoProcessed?: (blob: Blob, filename: string) => void
  /** Called when export is complete */
  onExportComplete?: (blob: Blob, filename: string) => void
  /** Called when an error occurs */
  onError?: (error: Error) => void
  /** Called to report progress updates */
  onProgress?: (stage: string, progress: number) => void
}

// Default configuration
export const defaultConfig: Required<FlyCutCaptionConfig> = {
  theme: 'auto',
  language: 'zh-CN',
  asrLanguage: 'auto',
  enableDragDrop: true,
  enableExport: true,
  enableVideoProcessing: true,
  maxFileSize: 500, // MB
  supportedFormats: ['mp4', 'webm', 'avi', 'mov', 'mp3', 'wav', 'ogg']
}