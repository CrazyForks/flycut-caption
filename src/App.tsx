// FlyCut Caption - 智能视频字幕裁剪工具

import { useRef, useCallback, useMemo } from 'react';
import { AppProvider, useAppState, useAppDispatch } from '@/contexts/AppContext';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import VideoPlayer, { type VideoPlayerRef } from '@/components/VideoPlayer/VideoPlayer';
import { SubtitleList } from '@/components/SubtitleEditor/SubtitleList';
import { ASRPanel } from '@/components/ProcessingPanel/ASRPanel';
import { VideoProcessingPanel } from '@/components/ProcessingPanel/VideoProcessingPanel';
import { useVideoProcessor } from '@/hooks/useVideoProcessor';
import { Scissors, Film, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoFile, VideoSegment } from '@/types/video';
import type { ProcessingOptions } from '@/services/videoProcessor';

function AppContent() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  
  // 视频处理相关状态和方法
  const {
    isProcessing,
    progress,
    processedVideoBlob,
    processVideo,
    downloadProcessedVideo,
    resetProcessor
  } = useVideoProcessor();

  const handleFileSelect = (videoFile: VideoFile) => {
    console.log('文件选择完成:', videoFile);
  };

  // 从字幕生成视频片段
  const videoSegments = useMemo((): VideoSegment[] => {
    if (!state.transcript || !state.transcript.chunks || state.transcript.chunks.length === 0) {
      return [];
    }

    return state.transcript.chunks.map(chunk => ({
      start: chunk.timestamp[0],
      end: chunk.timestamp[1],
      keep: !state.selectedChunks.has(chunk.id), // 未选中删除的保留
    }));
  }, [state.transcript, state.selectedChunks]);

  // 开始视频处理
  const handleStartProcessing = useCallback(async (options: ProcessingOptions) => {
    if (!state.videoFile) {
      console.error('没有视频文件可以处理');
      return;
    }

    // 切换到处理阶段
    dispatch({ type: 'SET_STAGE', stage: 'process' });

    try {
      await processVideo(state.videoFile, videoSegments, options);
      // 处理完成后切换到导出阶段
      dispatch({ type: 'SET_STAGE', stage: 'export' });
    } catch (error) {
      console.error('视频处理失败:', error);
      console.error('App视频处理错误详情:', { 
        videoFile: state.videoFile?.name, 
        segments: videoSegments?.length,
        error 
      });
      dispatch({
        type: 'SET_ERROR',
        error: `视频处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
    }
  }, [state.videoFile, videoSegments, processVideo, dispatch]);

  // 重置处理器并返回编辑阶段
  const handleResetProcessing = useCallback(() => {
    resetProcessor();
    dispatch({ type: 'SET_STAGE', stage: 'edit' });
    dispatch({ type: 'SET_ERROR', error: null });
  }, [resetProcessor, dispatch]);

  // 根据应用阶段显示不同的界面
  const renderMainContent = () => {
    switch (state.stage) {
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
              
              {state.videoFile && (
                <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg">
                  <p>已加载: {state.videoFile.name}</p>
                  <p>生成字幕后即可开始编辑</p>
                </div>
              )}
            </div>
            
            <div>
              {state.videoFile && (
                <VideoPlayer 
                  ref={videoPlayerRef}
                  className="w-full"
                />
              )}
            </div>
          </div>
        );

      case 'edit':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 左侧: 视频播放器 */}
            <div className="xl:col-span-1">
              {state.videoFile && (
                <VideoPlayer 
                  ref={videoPlayerRef}
                  className="w-full sticky top-6"
                />
              )}
            </div>
            
            {/* 右侧: 字幕编辑器和处理面板 */}
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
              {state.transcript && state.transcript.chunks && state.transcript.chunks.length > 0 && (
                <VideoProcessingPanel
                  isProcessing={isProcessing}
                  progress={progress}
                  processedVideoBlob={processedVideoBlob}
                  onStartProcessing={handleStartProcessing}
                  onDownload={downloadProcessedVideo}
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
                  dispatch({ type: 'RESET' });
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
                state.stage === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Upload className="h-4 w-4" />
                <span>上传</span>
              </div>
              
              <div className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-full',
                state.stage === 'transcribe' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <FileText className="h-4 w-4" />
                <span>转录</span>
              </div>
              
              <div className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-full',
                state.stage === 'edit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Scissors className="h-4 w-4" />
                <span>编辑</span>
              </div>
              
              <div className={cn(
                'flex items-center space-x-2 px-3 py-1 rounded-full',
                (state.stage === 'process' || state.stage === 'export') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
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
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{state.error}</p>
          </div>
        )}

        {/* 加载指示器 */}
        {state.isLoading && (
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
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
