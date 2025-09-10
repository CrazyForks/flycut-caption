// 应用程序全局状态管理

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction } from '../types/app';
import { hasWebGPU } from '../utils/audioUtils';

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
  
  transcript: null,
  asrProgress: null,
  currentTime: 0,
  selectedChunks: new Set<string>(),
  
  isLoading: false,
  error: null,
  
  language: 'en',
  deviceType: 'wasm',
};

// Reducer 函数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STAGE':
      return {
        ...state,
        stage: action.stage,
      };

    case 'SET_VIDEO_FILE':
      return {
        ...state,
        videoFile: action.videoFile,
        stage: 'transcribe',
      };

    case 'SET_VIDEO_PLAYER_STATE':
      return {
        ...state,
        videoPlayerState: {
          ...state.videoPlayerState,
          ...action.playerState,
        },
      };

    case 'SET_VIDEO_PROCESSING_PROGRESS':
      return {
        ...state,
        videoProcessingProgress: action.progress,
      };

    case 'SET_VIDEO_PROCESSOR_CONFIG':
      return {
        ...state,
        videoProcessorConfig: {
          ...state.videoProcessorConfig,
          ...action.config,
        },
      };

    case 'SET_TRANSCRIPT':
      return {
        ...state,
        transcript: action.transcript,
        stage: 'edit',
      };

    case 'SET_ASR_PROGRESS':
      return {
        ...state,
        asrProgress: action.progress,
      };

    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.time,
        videoPlayerState: {
          ...state.videoPlayerState,
          currentTime: action.time,
        },
      };

    case 'TOGGLE_CHUNK_SELECTION':
      const newSelectedChunks = new Set(state.selectedChunks);
      if (newSelectedChunks.has(action.chunkId)) {
        newSelectedChunks.delete(action.chunkId);
      } else {
        newSelectedChunks.add(action.chunkId);
      }
      return {
        ...state,
        selectedChunks: newSelectedChunks,
      };

    case 'SELECT_ALL_CHUNKS':
      const allChunkIds = new Set(
        state.transcript?.chunks.map(chunk => chunk.id) || []
      );
      return {
        ...state,
        selectedChunks: allChunkIds,
      };

    case 'DESELECT_ALL_CHUNKS':
      return {
        ...state,
        selectedChunks: new Set<string>(),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'SET_ERROR':
      console.error('应用错误状态更新:', action.error);
      return {
        ...state,
        error: action.error,
        isLoading: false,
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.language,
      };

    case 'SET_DEVICE_TYPE':
      return {
        ...state,
        deviceType: action.deviceType,
      };

    case 'RESET':
      return {
        ...initialState,
        deviceType: state.deviceType, // 保持设备类型设置
        language: state.language, // 保持语言设置
      };

    default:
      return state;
  }
}

// Context 接口
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// 创建 Context
const AppContext = createContext<AppContextType | null>(null);

// Provider 组件
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 初始化设备检测
  useEffect(() => {
    const detectDevice = async () => {
      const supportsWebGPU = await hasWebGPU();
      dispatch({
        type: 'SET_DEVICE_TYPE',
        deviceType: supportsWebGPU ? 'webgpu' : 'wasm',
      });
    };

    detectDevice();
  }, []);

  // 错误自动清除
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_ERROR', error: null });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.error]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook for using the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// 便捷的 selector hooks
export function useAppState() {
  const { state } = useAppContext();
  return state;
}

export function useAppDispatch() {
  const { dispatch } = useAppContext();
  return dispatch;
}