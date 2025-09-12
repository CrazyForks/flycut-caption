// 主应用 Zustand Store
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  VideoFile, 
  VideoPlayerState, 
  VideoProcessingProgress,
  VideoProcessorConfig 
} from '@/types/video'
import type { ASRProgress } from '@/types/subtitle'
import { hasWebGPU } from '@/utils/audioUtils'

// 应用状态接口
export interface AppState {
  // 应用程序阶段
  stage: 'upload' | 'transcribe' | 'edit' | 'process' | 'export'
  
  // 视频相关状态
  videoFile: VideoFile | null
  videoPlayerState: VideoPlayerState
  videoProcessingProgress: VideoProcessingProgress | null
  videoProcessorConfig: VideoProcessorConfig
  
  // ASR相关状态（仅进度，实际数据在historyStore）
  asrProgress: ASRProgress | null
  currentTime: number
  
  // UI状态
  isLoading: boolean
  error: string | null
  
  // 设置
  language: string
  deviceType: 'webgpu' | 'wasm'
}

// 应用动作接口
export interface AppActions {
  // 阶段管理
  setStage: (stage: AppState['stage']) => void
  
  // 视频管理
  setVideoFile: (videoFile: VideoFile) => void
  setVideoPlayerState: (playerState: Partial<VideoPlayerState>) => void
  setVideoProcessingProgress: (progress: VideoProcessingProgress) => void
  setVideoProcessorConfig: (config: Partial<VideoProcessorConfig>) => void
  
  // ASR管理（仅进度）
  setASRProgress: (progress: ASRProgress) => void
  setCurrentTime: (time: number) => void
  
  // UI状态管理
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  
  // 设置管理
  setLanguage: (language: string) => void
  setDeviceType: (deviceType: 'webgpu' | 'wasm') => void
  
  // 重置
  reset: () => void
  
  // 初始化
  initialize: () => Promise<void>
}

// 初始状态
const initialState: AppState = {
  stage: 'upload',
  
  videoFile: null,
  videoPlayerState: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
  },
  videoProcessingProgress: null,
  videoProcessorConfig: {
    engine: 'webav',
    outputFormat: 'mp4',
    quality: 'medium',
    preserveAudio: true,
  },
  
  asrProgress: null,
  currentTime: 0,
  
  isLoading: false,
  error: null,
  
  language: 'en',
  deviceType: 'wasm',
}

// 创建Store
export const useAppStore = create<AppState & AppActions>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // 阶段管理
      setStage: (stage) =>
        set((state) => ({
          ...state,
          stage
        })),
      
      // 视频管理
      setVideoFile: (videoFile) =>
        set((state) => ({
          ...state,
          videoFile,
          stage: 'transcribe'
        })),
      
      setVideoPlayerState: (playerState) =>
        set((state) => ({
          ...state,
          videoPlayerState: {
            ...state.videoPlayerState,
            ...playerState
          }
        })),
      
      setVideoProcessingProgress: (progress) =>
        set((state) => ({
          ...state,
          videoProcessingProgress: progress
        })),
      
      setVideoProcessorConfig: (config) =>
        set((state) => ({
          ...state,
          videoProcessorConfig: {
            ...state.videoProcessorConfig,
            ...config
          }
        })),
      
      // ASR管理（仅进度）
      setASRProgress: (progress) =>
        set((state) => ({
          ...state,
          asrProgress: progress
        })),
      
      setCurrentTime: (time) =>
        set((state) => ({
          ...state,
          currentTime: time
        })),
      
      // UI状态管理
      setLoading: (isLoading) =>
        set((state) => ({
          ...state,
          isLoading
        })),
      
      setError: (error) => {
        console.error('应用错误状态更新:', error)
        set((state) => ({
          ...state,
          error,
          isLoading: false
        }))
        
        // 自动清除错误 - 5秒后
        if (error) {
          setTimeout(() => {
            set((state) => ({
              ...state,
              error: null
            }))
          }, 5000)
        }
      },
      
      // 设置管理
      setLanguage: (language) =>
        set((state) => ({
          ...state,
          language
        })),
      
      setDeviceType: (deviceType) =>
        set((state) => ({
          ...state,
          deviceType
        })),
      
      // 重置
      reset: () =>
        set((state) => ({
          ...initialState,
          language: state.language, // 保持语言设置
          deviceType: state.deviceType, // 保持设备类型设置
        })),
      
      // 初始化
      initialize: async () => {
        try {
          // 检测设备支持
          const supportsWebGPU = await hasWebGPU()
          set((state) => ({
            ...state,
            deviceType: supportsWebGPU ? 'webgpu' : 'wasm'
          }))
        } catch (error) {
          console.warn('设备检测失败:', error)
          set((state) => ({
            ...state,
            deviceType: 'wasm'
          }))
        }
      },
    }),
    {
      name: 'app-store', // 用于Redux DevTools
    }
  )
)

// 注意: 直接使用 useAppStore(state => state.property) 或 useAppStore(state => state.actionName)
// 这样可以获得更好的性能和类型安全