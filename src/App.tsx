// FlyCut Caption - 智能视频字幕裁剪工具

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useChunks } from '@/stores/historyStore';
import { useThemeStore } from '@/stores/themeStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useI18n } from '@/hooks/useI18n';
import { useTranslation } from 'react-i18next';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { EnhancedVideoPlayer } from '@/components/VideoPlayer/EnhancedVideoPlayer';
import { SubtitleList } from '@/components/SubtitleEditor/SubtitleList';
import { ASRPanel } from '@/components/ProcessingPanel/ASRPanel';
import { ExportDialog, type VideoExportOptions } from '@/components/ExportPanel/ExportDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeInitializer } from '@/components/ThemeInitializer';
import { ToastContainer, MessageCenterButton } from '@/components/MessageCenter';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SubtitleSettings, defaultSubtitleStyle } from '@/components/SubtitleSettings';
import type { SubtitleStyle } from '@/components/SubtitleSettings';
import { 
  useStartVideoProcessing, 
  useUpdateVideoProcessingProgress, 
  useCompleteVideoProcessing, 
  useErrorVideoProcessing 
} from '@/stores/messageStore';
import { UnifiedVideoProcessor } from '@/services/UnifiedVideoProcessor';
import { saveFile } from '@/utils/createFileWriter';
import { Scissors, FileText, Upload, Download, Video } from 'lucide-react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import type { VideoFile, VideoSegment, VideoProcessingProgress } from '@/types/video';
import type { VideoProcessingOptions, VideoEngineType } from '@/types/videoEngine';

function AppContent() {
  const stage = useAppStore(state => state.stage);
  const videoFile = useAppStore(state => state.videoFile);
  const error = useAppStore(state => state.error);
  const isLoading = useAppStore(state => state.isLoading);
  const chunks = useChunks();
  
  // 主题管理
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  
  // 国际化
  const { t, ready } = useTranslation();
  
  // 如果翻译还没准备好，显示加载状态
  if (!ready) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // 初始化主题 - 确保在客户端正确应用
  useEffect(() => {
    // 确保主题正确应用到 DOM
    const applyTheme = (theme: 'light' | 'dark') => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);
  
  // 消息中心钩子
  const startVideoProcessing = useStartVideoProcessing();
  const updateVideoProcessingProgress = useUpdateVideoProcessingProgress();
  const completeVideoProcessing = useCompleteVideoProcessing();
  const errorVideoProcessing = useErrorVideoProcessing();
  
  // 启用快捷键
  useHotkeys({
    enableHistoryHotkeys: true,
    enableGlobalHotkeys: true, // 全局启用，即使焦点不在特定元素上也能工作
  });
  
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
  const [currentProcessingMessageId, setCurrentProcessingMessageId] = useState<string | null>(null);
  const [currentEngine, setCurrentEngine] = useState<VideoEngineType | null>(null);
  const processorRef = useRef<UnifiedVideoProcessor | null>(null);
  
  // 导出对话框状态
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDialogType, setExportDialogType] = useState<'subtitles' | 'video'>('video');
  
  // 字幕样式状态
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(defaultSubtitleStyle);
  
  
  // const availableEngines = UnifiedVideoProcessor.getSupportedEngines();

  const handleProgress = useCallback((progressData: VideoProcessingProgress) => {
    if (currentProcessingMessageId) {
      updateVideoProcessingProgress(currentProcessingMessageId, progressData);
    }
  }, [currentProcessingMessageId, updateVideoProcessingProgress]);

  const processVideo = useCallback(async (
    videoFile: VideoFile,
    segments: VideoSegment[],
    options?: VideoProcessingOptions
  ) => {
    if (isProcessing) {
      console.warn(t('processingVideo', { ns: 'app' }));
      return;
    }

    let messageId: string | null = null;

    try {
      setIsProcessing(true);
      
      // 开始视频处理消息
      messageId = startVideoProcessing(t('videoProcessing', { ns: 'app' }));
      setCurrentProcessingMessageId(messageId);

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

      // 完成处理
      if (messageId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
        const filename = `cut_video_${timestamp}.${options?.format || 'mp4'}`;
        completeVideoProcessing(messageId, resultBlob, filename);
      }

    } catch (error) {
      console.error('视频处理失败:', error);
      console.error('视频处理错误详情:', { 
        videoFile: videoFile?.name, 
        segments: segments?.length, 
        options,
        stack: error instanceof Error ? error.stack : undefined 
      });
      
      if (messageId) {
        errorVideoProcessing(messageId, error instanceof Error ? error.message : '未知错误');
      }
    } finally {
      setIsProcessing(false);
      setCurrentProcessingMessageId(null);
    }
  }, [isProcessing, currentEngine, startVideoProcessing, completeVideoProcessing, errorVideoProcessing, handleProgress]);


  // 格式化时间为 SRT 格式
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }, []);


  // 导出字幕
  const handleExportSubtitles = useCallback(async (format: 'srt' | 'json') => {
    const keptChunks = chunks.filter(chunk => !chunk.deleted);
    if (keptChunks.length === 0) {
      console.warn(t('noActiveSubtitles', { ns: 'app' }));
      return;
    }

    let content: string;
    let filename: string;
    let types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;

    if (format === 'srt') {
      content = keptChunks.map((chunk, index) => {
        const start = formatTime(chunk.timestamp[0]);
        const end = formatTime(chunk.timestamp[1]);
        return `${index + 1}\n${start} --> ${end}\n${chunk.text}\n`;
      }).join('\n');
      filename = `subtitles_${Date.now()}.srt`;
      types = [{
        description: 'SRT Subtitle files',
        accept: { 'text/srt': ['.srt'] },
      }];
    } else {
      content = JSON.stringify(keptChunks.map(chunk => ({
        text: chunk.text,
        timestamp: chunk.timestamp,
      })), null, 2);
      filename = `subtitles_${Date.now()}.json`;
      types = [{
        description: 'JSON files',
        accept: { 'application/json': ['.json'] },
      }];
    }

    const blob = new Blob([content], { type: 'text/plain' });
    await saveFile(blob, filename, types);
  }, [chunks, formatTime]);

  // 重新上传文件
  const handleReupload = useCallback(() => {
    const setVideoFile = useAppStore.getState().setVideoFile;
    setVideoFile(null);
  }, []);


  const handleFileSelect = (selectedVideoFile: VideoFile) => {
    console.log('文件选择完成:', selectedVideoFile);
    // 使用 appStore 的 setVideoFile 方法，它会自动切换到 'transcribe' 阶段
    const setVideoFile = useAppStore.getState().setVideoFile;
    setVideoFile(selectedVideoFile);
  };

  // 从字幕生成视频片段 - 包含所有片段的删除状态和字幕信息
  const videoSegments = useMemo((): VideoSegment[] => {
    return chunks.map(chunk => ({
      start: chunk.timestamp[0],
      end: chunk.timestamp[1],
      keep: !chunk.deleted,
      text: chunk.text,
      id: chunk.id
    }));
  }, [chunks]);

  // 开始视频处理
  const handleStartProcessing = useCallback(async (options: VideoProcessingOptions) => {
    if (!videoFile) {
      console.error(t('noVideoToProcess', { ns: 'app' }));
      return;
    }

    try {
      await processVideo(videoFile, videoSegments, options);
    } catch (error) {
      console.error('视频处理失败:', error);
      console.error('App视频处理错误详情:', { 
        videoFile: videoFile?.name, 
        segments: videoSegments?.length,
        error 
      });
      setError(`${t('videoProcessingFailed', { ns: 'app' })}: ${error instanceof Error ? error.message : t('unknownError', { ns: 'messages' })}`);
    }
  }, [videoFile, videoSegments, processVideo, setStage, setError]);

  // 打开字幕导出对话框
  const handleOpenSubtitleExportDialog = useCallback(() => {
    setExportDialogType('subtitles');
    setExportDialogOpen(true);
  }, []);

  // 打开视频导出对话框
  const handleOpenVideoExportDialog = useCallback(() => {
    setExportDialogType('video');
    setExportDialogOpen(true);
  }, []);

  // 处理视频导出配置
  const handleVideoExport = useCallback(async (options: VideoExportOptions) => {
    await handleStartProcessing({
      format: options.format === 'mp4' ? 'mp4' : 'webm',
      quality: options.quality,
      preserveAudio: true,
      subtitleProcessing: options.subtitleProcessing,
      subtitleStyle: subtitleStyle, // 传递字幕样式配置
    });
  }, [handleStartProcessing, subtitleStyle]);



  // 渲染左侧面板
  const renderLeftPanel = () => {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* 配置面板 */}
        {stage === 'transcribe' && <div className="flex-shrink-0 p-4">
          <div className="space-y-4">
            {/* 语言选择 */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('recognitionLanguage', { ns: 'app' })}</label>
              <ASRPanel />
            </div>
          </div>
        </div>}

        {/* 字幕编辑器 */}
        {stage === 'edit' && <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4">
            <h3 className="text-sm font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{t('subtitleEditor', { ns: 'app' })}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('subtitleEditorDescription', { ns: 'app' })}
            </p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <SubtitleList />
          </div>
        </div>}

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
              <h2 className="text-2xl font-bold mb-4">{t('uploadTitle', { ns: 'app' })}</h2>
              <p className="text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: t('uploadDescription', { ns: 'app' }) }} />
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部状态栏 */}
        <div className="flex-shrink-0 p-4 bg-background/50">
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
                  <span>{t('processing', { ns: 'common' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 视频播放器区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-black/5 flex items-center justify-center p-6 overflow-hidden">
            <div className="w-full h-full max-w-4xl">
              <EnhancedVideoPlayer 
                videoUrl={videoFile.url}
                className="w-full h-full"
                onTimeUpdate={(time) => setCurrentTime(time)}
                subtitleStyle={subtitleStyle}
                onSubtitleStyleChange={setSubtitleStyle}
              />
            </div>
          </div>

          {/* 波形图和时间线区域 */}
          {/* <div className="flex-shrink-0 h-32 bg-background/50 p-4">
            <div className="h-full bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-xs mb-1">音频波形图</div>
                <div className="text-xs opacity-60">即将推出</div>
              </div>
            </div>
          </div> */}
        </div>

      </div>
    );
  };

  // 渲染右侧字幕设置面板
  const renderSubtitleSettingsPanel = () => {
    // 如果没有视频文件，显示占位内容
    if (!videoFile) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 p-4 border-b">
            <h2 className="text-sm font-semibold">{t('subtitleSettings', { ns: 'app' })}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('subtitleSettingsDescription', { ns: 'app' })}</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              <div className="text-xs opacity-60">{t('waitingForVideo', { ns: 'app' })}</div>
            </div>
          </div>
        </div>
      );
    }

    // 有视频文件时显示字幕设置面板
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 p-4 border-b">
          <h2 className="text-sm font-semibold">{t('app.subtitleSettings')}</h2>
          <p className="text-xs text-muted-foreground mt-1">{t('app.subtitleSettingsDescription')}</p>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <SubtitleSettings
            style={subtitleStyle}
            onStyleChange={setSubtitleStyle}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* 顶部标题栏 */}
      <header className="flex-shrink-0 bg-card shadow-sm border-b border-background/90 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{t('title', { ns: 'app' })}</h1>
                <p className="text-xs text-muted-foreground">{t('subtitle', { ns: 'app' })}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 语言切换按钮 */}
              <LanguageSelector variant="minimal" />
              
              {/* 主题切换按钮 */}
              <ThemeToggle variant="button" />
              
              {/* 消息中心按钮 */}
              <MessageCenterButton />
              
              {/* 操作菜单栏 - 平铺展示 */}
              <Menubar className="h-auto border bg-card rounded-lg p-1 gap-0.5 shadow-sm">
                {/* 文件菜单 */}
                <MenubarMenu>
                  <MenubarTrigger 
                    className="h-8 px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                    disabled={false}
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">{t('fileMenu', { ns: 'app' })}</span>
                  </MenubarTrigger>
                  <MenubarContent align="start" className="min-w-[160px]">
                    <MenubarItem onClick={handleReupload}>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('reuploadVideo', { ns: 'app' })}
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>

                {/* 字幕菜单 */}
                <MenubarMenu>
                  <MenubarTrigger 
                    className="h-8 px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    disabled={!hasActiveChunks}
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">{t('subtitleMenu', { ns: 'app' })}</span>
                  </MenubarTrigger>
                  <MenubarContent align="start" className="min-w-[160px]">
                    <MenubarItem onClick={handleOpenSubtitleExportDialog}>
                      <FileText className="h-4 w-4 mr-2" />
                      {t('exportSubtitle', { ns: 'app' })}
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>

                {/* 视频菜单 */}
                <MenubarMenu>
                  <MenubarTrigger 
                    className="h-8 px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    disabled={!hasActiveChunks || stage !== 'edit' || isProcessing}
                  >
                    <Video className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">
                      {isProcessing ? t('processing', { ns: 'common' }) : t('videoMenu', { ns: 'app' })}
                    </span>
                  </MenubarTrigger>
                  <MenubarContent align="start" className="min-w-[180px]">
                    <MenubarItem onClick={handleOpenVideoExportDialog}>
                      <Video className="h-4 w-4 mr-2" />
                      {t('processAndExportVideo', { ns: 'app' })}
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem
                      disabled={true}
                      className="data-[disabled]:opacity-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('viewInMessageCenter', { ns: 'app' })}
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 - 三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 - 字幕编辑器和配置 */}
        <div className="w-80 flex-shrink-0 bg-card shadow-sm">
          {renderLeftPanel()}
        </div>

        {/* 中间面板 - 视频播放器 */}
        <div className="flex-1 flex flex-col bg-muted/10 h-full">
          {renderRightPanel()}
        </div>
        
        {/* 右侧面板 - 字幕设置 */}
        <div className="w-80 flex-shrink-0 bg-card shadow-sm border-l">
          {renderSubtitleSettingsPanel()}
        </div>
      </div>

      {/* 导出配置对话框 */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportType={exportDialogType}
        onExportSubtitles={handleExportSubtitles}
        onExportVideo={handleVideoExport}
      />
    </div>
  );
}

function App() {
  return (
    <>
      <ThemeInitializer />
      <AppContent />
      <ToastContainer />
    </>
  );
}

export default App;
