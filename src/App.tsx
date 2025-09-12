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
  
  // 缓存 activeChunks 的长度，避免在渲染中重复计算
  const hasActiveChunks = useMemo(
    () => activeChunks.length > 0,
    [activeChunks.length]
  );
  const setCurrentTime = useAppStore(state => state.setCurrentTime);
  const setStage = useAppStore(state => state.setStage);
  const setError = useAppStore(state => state.setError);
  
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


  const handleFileSelect = (selectedVideoFile: VideoFile) => {
    console.log('文件选择完成:', selectedVideoFile);
    // 使用 appStore 的 setVideoFile 方法，它会自动切换到 'transcribe' 阶段
    const setVideoFile = useAppStore.getState().setVideoFile;
    setVideoFile(selectedVideoFile);
  };

  // 从字幕生成视频片段 - 合并连续的保留区域
  const videoSegments = useMemo((): VideoSegment[] => {
    return chunks.filter(chunk => !chunk.deleted).map(chunk => ({
      start: chunk.timestamp[0],
      end: chunk.timestamp[1],
      keep: true
    }));
  }, [chunks]);

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



  // 渲染左侧面板
  const renderLeftPanel = () => {
    return (
      <div className="flex flex-col h-full">
        {/* 配置面板 */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="space-y-4">
            {/* 语言选择 */}
            <div>
              <label className="text-sm font-medium mb-2 block">识别语言</label>
              <ASRPanel />
            </div>
          </div>
        </div>

        {/* 字幕编辑器 */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>字幕编辑器</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              选择要删除的字幕片段
            </p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <SubtitleList />
          </div>
        </div>

        {/* 历史记录和导出 */}
        <div className="flex-shrink-0 border-t">
          <div className="p-4 space-y-4">
            <HistoryPanel />
            
            {hasActiveChunks && (
              <ExportPanel
                onExportSubtitles={(format) => {
                  console.log('导出字幕:', format);
                }}
                onExportVideo={(options) => {
                  console.log('导出视频:', options);
                  handleStartProcessing({
                    format: options.format === 'mp4' ? 'mp4' : 'webm',
                    quality: options.quality,
                    preserveAudio: !options.includeSubtitles,
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染右侧面板
  const renderRightPanel = () => {
    if (!videoFile) {
      // 没有视频文件时显示上传区域
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-6 bg-primary/10 rounded-2xl">
                  <Upload className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">上传您的视频文件</h2>
              <p className="text-muted-foreground text-sm">
                支持 MP4、WebM、AVI 等格式<br/>
                开始您的智能字幕裁剪之旅
              </p>
            </div>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              className="w-full"
            />
          </div>
        </div>
      );
    }

    // 有视频文件时显示视频播放器和波形图
    return (
      <div className="flex-1 flex flex-col">
        {/* 顶部状态栏 */}
        <div className="flex-shrink-0 p-4 border-b bg-background/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{videoFile.name}</span>
            </div>
            
            {/* 错误和加载提示 */}
            <div className="flex items-center space-x-2">
              {error && (
                <div className="px-2 py-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-600">
                  {error}
                </div>
              )}
              {isLoading && (
                <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-600 flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600" />
                  <span>处理中</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 视频播放器区域 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black/5 flex items-center justify-center p-6">
            <div className="w-full max-w-4xl">
              <EnhancedVideoPlayer 
                videoUrl={videoFile.url}
                className="w-full rounded-lg overflow-hidden shadow-lg"
                onTimeUpdate={(time) => setCurrentTime(time)}
              />
            </div>
          </div>

          {/* 波形图和时间线区域 */}
          <div className="flex-shrink-0 h-32 border-t bg-background/50 p-4">
            <div className="h-full bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-xs mb-1">音频波形图</div>
                <div className="text-xs opacity-60">即将推出</div>
              </div>
            </div>
          </div>
        </div>

        {/* 处理面板 */}
        {hasActiveChunks && stage === 'edit' && (
          <div className="flex-shrink-0 border-t bg-background/50 p-4">
            <VideoProcessingPanel
              isProcessing={isProcessing}
              progress={progress}
              processedVideoBlob={processedVideoBlob}
              onStartProcessing={handleStartProcessing}
              onDownload={downloadProcessedVideo}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* 顶部标题栏 */}
      <header className="flex-shrink-0 border-b bg-card">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">FlyCut Caption</h1>
                <p className="text-xs text-muted-foreground">智能视频字幕裁剪工具</p>
              </div>
            </div>
            
            {/* 阶段指示器 */}
            <div className="hidden md:flex items-center space-x-3 text-xs">
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded-full',
                stage === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Upload className="h-3 w-3" />
                <span>上传</span>
              </div>
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded-full',
                stage === 'transcribe' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <FileText className="h-3 w-3" />
                <span>转录</span>
              </div>
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded-full',
                stage === 'edit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Scissors className="h-3 w-3" />
                <span>编辑</span>
              </div>
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded-full',
                (stage === 'process' || stage === 'export') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                <Film className="h-3 w-3" />
                <span>导出</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 - 左右分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 - 字幕编辑器和配置 */}
        <div className="w-96 flex-shrink-0 border-r bg-card">
          {renderLeftPanel()}
        </div>

        {/* 右侧面板 - 视频播放器和波形图 */}
        <div className="flex-1 flex flex-col bg-muted/10">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
