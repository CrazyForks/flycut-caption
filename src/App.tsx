// FlyCut Caption - 智能视频字幕裁剪工具

import { useCallback, useMemo, useState, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useChunks } from '@/stores/historyStore';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { EnhancedVideoPlayer } from '@/components/VideoPlayer/EnhancedVideoPlayer';
import { SubtitleList } from '@/components/SubtitleEditor/SubtitleList';
import { ASRPanel } from '@/components/ProcessingPanel/ASRPanel';
import { VideoProcessingPanel } from '@/components/ProcessingPanel/VideoProcessingPanel';
import { HistoryPanel } from '@/components/HistoryPanel/HistoryPanel';
import { ExportPanel } from '@/components/ExportPanel/ExportPanel';
import { EngineSelector } from '@/components/EngineSelector/EngineSelector';
import { SegmentDebugPanel } from '@/components/DebugPanel/SegmentDebugPanel';
import { UnifiedVideoProcessor } from '@/services/UnifiedVideoProcessor';
import { Scissors, Film, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoFile, VideoSegment, VideoProcessingProgress } from '@/types/video';
import type { VideoProcessingOptions, VideoEngineType } from '@/types/videoEngine';

function AppContent() {
  const stage = useAppStore(state => state.stage);
  const videoFile = useAppStore(state => state.videoFile);
  const error = useAppStore(state => state.error);
  const isLoading = useAppStore(state => state.isLoading);
  const chunks = useChunks();
  
  // 在组件层用 useMemo 做过滤，保证只有 chunks 引用变更时才重新计算
  const activeChunks = useMemo(
    () => chunks.filter(c => !c.deleted),
    [chunks]
  );
  const setCurrentTime = useAppStore(state => state.setCurrentTime);
  const setStage = useAppStore(state => state.setStage);
  const setError = useAppStore(state => state.setError);
  const reset = useAppStore(state => state.reset);
  
  // 视频处理相关状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<VideoProcessingProgress | null>(null);
  const [processedVideoBlob, setProcessedVideoBlob] = useState<Blob | null>(null);
  const [currentEngine, setCurrentEngine] = useState<VideoEngineType | null>(null);
  const processorRef = useRef<UnifiedVideoProcessor | null>(null);
  
  // const availableEngines = UnifiedVideoProcessor.getSupportedEngines();

  const handleProgress = useCallback((progressData: VideoProcessingProgress) => {
    setProgress(progressData);
  }, []);

  const processVideo = useCallback(async (
    videoFile: VideoFile,
    segments: VideoSegment[],
    options?: VideoProcessingOptions
  ) => {
    if (isProcessing) {
      console.warn('视频处理正在进行中');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(null);
      setProcessedVideoBlob(null);

      // 创建处理器（如果不存在）
      if (!processorRef.current) {
        processorRef.current = new UnifiedVideoProcessor(handleProgress);
      }

      // 初始化处理器（如果还没有初始化或需要切换引擎）
      const engineType = await processorRef.current.initialize(
        videoFile, 
        options?.engine || currentEngine || undefined
      );
      setCurrentEngine(engineType);

      // 处理视频
      const resultBlob = await processorRef.current.processVideo(segments, options || {
        quality: 'medium',
        preserveAudio: true
      });

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
  }, [isProcessing, handleProgress, currentEngine]);

  const switchEngine = useCallback(async (engine: VideoEngineType, videoFile: VideoFile) => {
    if (isProcessing) {
      throw new Error('无法在处理视频时切换引擎');
    }

    try {
      // 创建处理器（如果不存在）
      if (!processorRef.current) {
        processorRef.current = new UnifiedVideoProcessor(handleProgress);
      }

      await processorRef.current.switchEngine(engine, videoFile);
      setCurrentEngine(engine);
      
      console.log(`成功切换到引擎: ${engine}`);
    } catch (error) {
      console.error('切换引擎失败:', error);
      throw error;
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
      await processorRef.current.cleanup();
      processorRef.current = null;
    }
    setCurrentEngine(null);
  }, []);

  const handleFileSelect = (videoFile: VideoFile) => {
    console.log('文件选择完成:', videoFile);
  };

  // 从字幕生成视频片段 - 合并连续的保留区域
  const videoSegments = useMemo((): VideoSegment[] => {
    if (!activeChunks || activeChunks.length === 0) {
      return [];
    }

    // 按时间排序字幕块
    const sortedChunks = [...activeChunks].sort((a, b) => a.timestamp[0] - b.timestamp[0]);
    
    const segments: VideoSegment[] = [];
    let currentSegment: VideoSegment | null = null;

    for (const chunk of sortedChunks) {
      const isKept = !chunk.deleted; // historyStore 使用 deleted 属性
      const chunkStart = chunk.timestamp[0];
      const chunkEnd = chunk.timestamp[1];

      if (isKept) {
        // 这个块要保留
        if (currentSegment && Math.abs(currentSegment.end - chunkStart) < 0.1) {
          // 与当前片段连续，扩展当前片段
          currentSegment.end = chunkEnd;
        } else {
          // 开始新片段
          if (currentSegment) {
            segments.push(currentSegment);
          }
          currentSegment = {
            start: chunkStart,
            end: chunkEnd,
            keep: true
          };
        }
      } else {
        // 这个块要删除，结束当前片段（如果存在）
        if (currentSegment) {
          segments.push(currentSegment);
          currentSegment = null;
        }
      }
    }

    // 添加最后一个片段
    if (currentSegment) {
      segments.push(currentSegment);
    }

    // 调试输出
    if (segments.length > 0) {
      console.group('🎬 视频片段生成完成');
      console.log('保留的片段数量:', segments.length);
      segments.forEach((seg, i) => {
        console.log(`片段 ${i + 1}: ${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s (${(seg.end - seg.start).toFixed(2)}s)`);
      });
      console.groupEnd();
    }
    
    return segments;
  }, [activeChunks]);

  // 开始视频处理
  const handleStartProcessing = useCallback(async (options: VideoProcessingOptions) => {
    if (!videoFile) {
      console.error('没有视频文件可以处理');
      return;
    }

    // 切换到处理阶段
    setStage('process');

    try {
      await processVideo(videoFile, videoSegments, options);
      // 处理完成后切换到导出阶段
      setStage('export');
    } catch (error) {
      console.error('视频处理失败:', error);
      console.error('App视频处理错误详情:', { 
        videoFile: videoFile?.name, 
        segments: videoSegments?.length,
        error 
      });
      setError(`视频处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [videoFile, videoSegments, processVideo, setStage, setError]);

  // 重置处理器并返回编辑阶段
  const handleResetProcessing = useCallback(() => {
    resetProcessor();
    setStage('edit');
    setError(null);
  }, [resetProcessor, setStage, setError]);

  // 引擎切换处理
  const handleEngineSwitch = useCallback(async (engine: VideoEngineType) => {
    if (!videoFile) {
      console.warn('没有视频文件，无法切换引擎');
      return;
    }

    try {
      await switchEngine(engine, videoFile);
      console.log(`成功切换到引擎: ${engine}`);
    } catch (error) {
      console.error('引擎切换失败:', error);
      setError(`引擎切换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [videoFile, switchEngine, setError]);

  // 根据应用阶段显示不同的界面
  const renderMainContent = () => {
    switch (stage) {
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">上传您的视频文件</h2>
              <p className="text-muted-foreground text-lg">
                支持 MP4、WebM、AVI 等格式，开始您的智能字幕裁剪之旅
              </p>
            </div>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              className="mb-6"
            />
            
            <div className="text-center text-sm text-muted-foreground">
              <p>上传后将自动进入字幕生成阶段</p>
            </div>
          </div>
        );

      case 'transcribe':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ASRPanel />
              
              {videoFile && (
                <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg">
                  <p>已加载: {videoFile.name}</p>
                  <p>生成字幕后即可开始编辑</p>
                </div>
              )}
            </div>
            
            <div>
              {videoFile && (
                <EnhancedVideoPlayer 
                  videoUrl={videoFile.url}
                  className="w-full"
                  onTimeUpdate={(time) => setCurrentTime(time)}
                />
              )}
            </div>
          </div>
        );

      case 'edit':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* 左侧: 视频播放器 */}
            <div className="xl:col-span-1">
              {videoFile && (
                <EnhancedVideoPlayer 
                  videoUrl={videoFile.url}
                  className="w-full sticky top-6"
                  onTimeUpdate={(time) => setCurrentTime(time)}
                />
              )}
            </div>
            
            {/* 中间: 字幕编辑器 */}
            <div className="xl:col-span-2 space-y-6">
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>字幕编辑</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    选择要删除的字幕片段，这些片段将从视频中移除
                  </p>
                </div>
                
                <SubtitleList maxHeight="400px" />
              </div>

              {/* 视频处理面板 */}
              {activeChunks.length > 0 && (
                <VideoProcessingPanel
                  isProcessing={isProcessing}
                  progress={progress}
                  processedVideoBlob={processedVideoBlob}
                  onStartProcessing={handleStartProcessing}
                  onDownload={downloadProcessedVideo}
                />
              )}
            </div>

            {/* 右侧: 引擎选择器、历史记录和导出面板 */}
            <div className="xl:col-span-1 space-y-6">
              <EngineSelector
                currentEngine={currentEngine || undefined}
                onEngineChange={handleEngineSwitch}
                disabled={isProcessing}
                className="sticky top-6"
              />
              
              <HistoryPanel />
              
              {/* 调试面板 - 临时添加用于测试 */}
              {videoSegments.length > 0 && (
                <SegmentDebugPanel segments={videoSegments} />
              )}
              
              {activeChunks.length > 0 && (
                <ExportPanel
                  onExportSubtitles={(format) => {
                    console.log('导出字幕:', format);
                    // TODO: 实现字幕导出功能
                  }}
                  onExportVideo={(options) => {
                    console.log('导出视频:', options);
                    handleStartProcessing({
                      format: options.format === 'mp4' ? 'mp4' : 'webm',
                      quality: options.quality,
                      preserveAudio: !options.includeSubtitles, // 简化处理
                    });
                  }}
                />
              )}
            </div>
          </div>
        );

      case 'process':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Scissors className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">正在处理视频</h2>
              <p className="text-muted-foreground">
                根据您的编辑正在裁剪视频，请稍候...
              </p>
            </div>
            
            {/* 视频处理进度 */}
            <VideoProcessingPanel
              isProcessing={isProcessing}
              progress={progress}
              processedVideoBlob={processedVideoBlob}
              onStartProcessing={() => {}} // 处理阶段不允许重新开始
              onDownload={downloadProcessedVideo}
              className="bg-muted/30"
            />

            {/* 返回编辑按钮 */}
            <div className="mt-6 text-center">
              <button
                onClick={handleResetProcessing}
                className="px-4 py-2 text-sm border border-muted-foreground/30 hover:bg-muted rounded-lg transition-colors"
              >
                返回编辑
              </button>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Film className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">处理完成！</h2>
              <p className="text-muted-foreground">
                您的视频已成功裁剪，可以下载了
              </p>
            </div>
            
            {/* 导出面板 */}
            <VideoProcessingPanel
              isProcessing={false}
              progress={progress}
              processedVideoBlob={processedVideoBlob}
              onStartProcessing={handleStartProcessing}
              onDownload={downloadProcessedVideo}
              className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            />

            {/* 操作按钮 */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleResetProcessing}
                className="px-6 py-2 border border-muted-foreground/30 hover:bg-muted rounded-lg transition-colors"
              >
                重新编辑
              </button>
              <button
                onClick={() => {
                  // 重置整个应用，返回上传阶段
                  reset();
                  resetProcessor();
                }}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                处理新视频
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FlyCut Caption</h1>
                <p className="text-sm text-muted-foreground">智能视频字幕裁剪工具</p>
              </div>
            </div>
            
            {/* 阶段指示器 */}
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-full',
                stage === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Upload className="h-4 w-4" />
                <span>上传</span>
              </div>
              
              <div className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-full',
                stage === 'transcribe' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <FileText className="h-4 w-4" />
                <span>转录</span>
              </div>
              
              <div className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-full',
                stage === 'edit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Scissors className="h-4 w-4" />
                <span>编辑</span>
              </div>
              
              <div className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-full',
                (stage === 'process' || stage === 'export') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Film className="h-4 w-4" />
                <span>导出</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-6 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 加载指示器 */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <p className="text-blue-600 dark:text-blue-400 text-sm">处理中...</p>
            </div>
          </div>
        )}

        {/* 动态内容 */}
        {renderMainContent()}
      </main>

      {/* 页面底部 */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>FlyCut Caption - 基于 AI 的智能视频字幕裁剪工具</p>
            <p className="mt-1">支持本地处理，保护您的隐私安全</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
