// FlyCut Caption React Component Library
// Main entry point for npm package

// Import styles
import './index.css'

// Main component export
export { default as FlyCutCaption } from './FlyCutCaption'

// Type exports for TypeScript users
export type {
  FlyCutCaptionProps,
  FlyCutCaptionConfig,
  SubtitleChunk,
  VideoFile,
  ASRProgress,
  VideoSegment,
  VideoProcessingProgress,
  SubtitleStyle
} from './types'

// Configuration export
export { defaultConfig } from './types'

// Utility exports
export { formatTime } from './utils/timeUtils'
export { isVideoFile, formatFileSize } from './utils/fileUtils'

// Version info
export const version = '1.0.0'

// Component metadata
export const metadata = {
  name: '@flycut/caption-react',
  description: 'Complete video subtitle editing React component with AI-powered speech recognition',
  author: 'FlyCut Team',
  license: 'MIT'
} as const