import { useCallback, useRef, useState } from 'react';
import { VideoProcessor, type ProcessingOptions } from '@/services/videoProcessor';
import type { VideoSegment, VideoFile, VideoProcessingProgress } from '@/types/video';

interface UseVideoProcessorReturn {
  isProcessing: boolean;
  progress: VideoProcessingProgress | null;
  processedVideoBlob: Blob | null;
  processVideo: (videoFile: VideoFile, segments: VideoSegment[], options?: ProcessingOptions) => Promise<void>;
  downloadProcessedVideo: (filename?: string) => void;
  resetProcessor: () => void;
}

export const useVideoProcessor = (): UseVideoProcessorReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<VideoProcessingProgress | null>(null);
  const [processedVideoBlob, setProcessedVideoBlob] = useState<Blob | null>(null);
  const processorRef = useRef<VideoProcessor | null>(null);

  const handleProgress = useCallback((progressData: VideoProcessingProgress) => {
    setProgress(progressData);
  }, []);

  const processVideo = useCallback(async (
    videoFile: VideoFile,
    segments: VideoSegment[],
    options?: ProcessingOptions
  ) => {
    if (isProcessing) {
      console.warn('视频处理正在进行中');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(null);
      setProcessedVideoBlob(null);

      // 清理之前的处理器
      if (processorRef.current) {
        await processorRef.current.dispose();
      }

      // 创建新的处理器
      processorRef.current = new VideoProcessor(handleProgress);

      // 初始化并处理视频
      await processorRef.current.initialize(videoFile);
      const resultBlob = await processorRef.current.processVideo(segments, options);

      setProcessedVideoBlob(resultBlob);

    } catch (error) {
      console.error('视频处理失败:', error);
      console.error('视频处理错误详情:', { 
        videoFile: videoFile?.name, 
        segments: segments?.length, 
        options,
        stack: error instanceof Error ? error.stack : undefined 
      });
      setProgress({
        stage: 'error',
        progress: 0,
        message: '处理失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, handleProgress]);

  const downloadProcessedVideo = useCallback((filename?: string) => {
    if (!processedVideoBlob) {
      console.warn('没有处理完成的视频可以下载');
      return;
    }

    const url = URL.createObjectURL(processedVideoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `processed_video_${Date.now()}.mp4`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [processedVideoBlob]);

  const resetProcessor = useCallback(async () => {
    setIsProcessing(false);
    setProgress(null);
    setProcessedVideoBlob(null);

    if (processorRef.current) {
      await processorRef.current.dispose();
      processorRef.current = null;
    }
  }, []);

  return {
    isProcessing,
    progress,
    processedVideoBlob,
    processVideo,
    downloadProcessedVideo,
    resetProcessor,
  };
};