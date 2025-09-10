// ASR 功能管理 Hook

import { useCallback, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { asrService } from '../services/asrService';
import type { ASRProgress } from '../types/subtitle';

export function useASR() {
  const { state, dispatch } = useAppContext();

  // 设置进度回调
  useEffect(() => {
    const handleProgress = (progress: ASRProgress) => {
      dispatch({
        type: 'SET_ASR_PROGRESS',
        progress,
      });

      // 处理完成状态
      if (progress.status === 'complete' && progress.result) {
        dispatch({
          type: 'SET_TRANSCRIPT',
          transcript: progress.result,
        });
      }

      // 处理错误状态
      if (progress.status === 'error') {
        console.error('ASR处理进度错误:', progress.error);
        dispatch({
          type: 'SET_ERROR',
          error: progress.error || 'ASR 处理失败',
        });
      }
    };

    asrService.setProgressCallback(handleProgress);

    return () => {
      asrService.setProgressCallback(() => {});
    };
  }, [dispatch]);

  // 设置设备类型
  useEffect(() => {
    asrService.setDevice(state.deviceType);
  }, [state.deviceType]);

  // 准备模型（新的分步API）
  const prepareModel = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      await asrService.prepareModel();
    } catch (error) {
      console.error('ASR模型准备失败:', error);
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : '模型准备失败',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [dispatch]);

  // 加载模型（兼容旧API）
  const loadModel = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      await asrService.loadModel();
    } catch (error) {
      console.error('ASR模型加载失败:', error);
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : '模型加载失败',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [dispatch]);

  // 开始转录（分步操作）
  const startTranscription = useCallback(async (audioBuffer: ArrayBuffer) => {
    if (!state.videoFile) {
      dispatch({
        type: 'SET_ERROR',
        error: '请先上传视频文件',
      });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      // 先确保模型已准备
      if (!asrService.isReady()) {
        dispatch({
          type: 'SET_ASR_PROGRESS',
          progress: { status: 'loading', data: '准备模型中...' },
        });
        await asrService.prepareModel();
      }

      // 然后进行转录
      dispatch({
        type: 'SET_ASR_PROGRESS',
        progress: { status: 'loading', data: '开始转录音频...' },
      });
      
      const transcript = await asrService.transcribeAudio(
        audioBuffer,
        state.language
      );

      dispatch({
        type: 'SET_TRANSCRIPT',
        transcript,
      });
    } catch (error) {
      console.error('ASR转录失败:', error);
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : '转录失败',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [state.videoFile, state.language, dispatch]);

  // 一键转录（兼容原有接口）
  const startTranscriptionWithAutoLoad = useCallback(async (audioBuffer: ArrayBuffer) => {
    if (!state.videoFile) {
      dispatch({
        type: 'SET_ERROR',
        error: '请先上传视频文件',
      });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const transcript = await asrService.transcribeAudioWithAutoLoad(
        audioBuffer,
        state.language
      );

      dispatch({
        type: 'SET_TRANSCRIPT',
        transcript,
      });
    } catch (error) {
      console.error('ASR转录失败:', error);
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : '转录失败',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [state.videoFile, state.language, dispatch]);

  // 重新开始转录
  const retryTranscription = useCallback(async (audioBuffer: ArrayBuffer) => {
    // 重置状态
    dispatch({
      type: 'SET_ASR_PROGRESS',
      progress: { status: 'loading', data: '准备重新转录...' },
    });

    await startTranscription(audioBuffer);
  }, [startTranscription, dispatch]);

  // 检查是否准备就绪
  const isReady = useCallback(() => {
    return asrService.isReady();
  }, []);

  // 获取当前设备类型
  const getCurrentDevice = useCallback(() => {
    return asrService.getCurrentDevice();
  }, []);

  // 更改设备类型
  const changeDevice = useCallback((device: 'webgpu' | 'wasm') => {
    dispatch({
      type: 'SET_DEVICE_TYPE',
      deviceType: device,
    });
  }, [dispatch]);

  // 更改语言
  const changeLanguage = useCallback((language: string) => {
    dispatch({
      type: 'SET_LANGUAGE',
      language,
    });
  }, [dispatch]);

  return {
    // 状态
    asrProgress: state.asrProgress,
    transcript: state.transcript,
    language: state.language,
    deviceType: state.deviceType,
    isLoading: state.isLoading,
    error: state.error,

    // 方法
    prepareModel,                    // 新的分步API - 仅准备模型
    loadModel,                       // 兼容旧API - 仅加载模型
    startTranscription,              // 新的分步API - 需要先调用prepareModel
    startTranscriptionWithAutoLoad,  // 兼容旧API - 自动加载+转录
    retryTranscription,
    isReady,
    getCurrentDevice,
    changeDevice,
    changeLanguage,
  };
}