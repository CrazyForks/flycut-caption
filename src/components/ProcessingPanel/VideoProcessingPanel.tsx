import React, { useState } from 'react';
import { Download, Settings, Play, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoProcessingProgress } from '@/types/video';
import type { ProcessingOptions } from '@/services/videoProcessor';

interface VideoProcessingPanelProps {
  isProcessing: boolean;
  progress: VideoProcessingProgress | null;
  processedVideoBlob: Blob | null;
  onStartProcessing: (options: ProcessingOptions) => void;
  onDownload: (filename?: string) => void;
  className?: string;
}

export const VideoProcessingPanel: React.FC<VideoProcessingPanelProps> = ({
  isProcessing,
  progress,
  processedVideoBlob,
  onStartProcessing,
  onDownload,
  className
}) => {
  const [options, setOptions] = useState<ProcessingOptions>({
    outputFormat: 'mp4',
    quality: 'medium',
    preserveAudio: true
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStartProcessing = () => {
    onStartProcessing(options);
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
    const filename = `cut_video_${timestamp}.${options.outputFormat}`;
    onDownload(filename);
  };

  const renderProgressContent = () => {
    if (!progress) return null;

    const getProgressIcon = () => {
      switch (progress.stage) {
        case 'analyzing':
          return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
        case 'cutting':
          return <Loader2 className="h-5 w-5 animate-spin text-orange-500" />;
        case 'encoding':
          return <Loader2 className="h-5 w-5 animate-spin text-purple-500" />;
        case 'complete':
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'error':
          return <AlertCircle className="h-5 w-5 text-red-500" />;
        default:
          return <Loader2 className="h-5 w-5 animate-spin" />;
      }
    };

    const getStageText = () => {
      switch (progress.stage) {
        case 'analyzing': return '分析中';
        case 'cutting': return '裁剪中';
        case 'encoding': return '编码中';
        case 'complete': return '完成';
        case 'error': return '错误';
        default: return '处理中';
      }
    };

    const getProgressColor = () => {
      switch (progress.stage) {
        case 'analyzing': return 'bg-blue-500';
        case 'cutting': return 'bg-orange-500';
        case 'encoding': return 'bg-purple-500';
        case 'complete': return 'bg-green-500';
        case 'error': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {getProgressIcon()}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{getStageText()}</span>
              <span className="text-sm text-muted-foreground">{progress.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn("h-2 rounded-full transition-all duration-300", getProgressColor())}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{progress.message}</p>

        {progress.error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{progress.error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("bg-card border rounded-lg p-6 space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">视频处理</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="设置选项"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* 处理选项 */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium">导出设置</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 输出格式 */}
            <div>
              <label className="block text-sm font-medium mb-2">输出格式</label>
              <select
                value={options.outputFormat}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  outputFormat: e.target.value as 'mp4' | 'webm'
                }))}
                className="w-full p-2 border rounded-md bg-background"
                disabled={isProcessing}
              >
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
              </select>
            </div>

            {/* 质量设置 */}
            <div>
              <label className="block text-sm font-medium mb-2">视频质量</label>
              <select
                value={options.quality}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  quality: e.target.value as 'high' | 'medium' | 'low'
                }))}
                className="w-full p-2 border rounded-md bg-background"
                disabled={isProcessing}
              >
                <option value="high">高质量</option>
                <option value="medium">中等质量</option>
                <option value="low">低质量</option>
              </select>
            </div>
          </div>

          {/* 音频保留选项 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="preserveAudio"
              checked={options.preserveAudio}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                preserveAudio: e.target.checked
              }))}
              disabled={isProcessing}
              className="rounded"
            />
            <label htmlFor="preserveAudio" className="text-sm font-medium">
              保留音频
            </label>
          </div>
        </div>
      )}

      {/* 进度显示 */}
      {isProcessing && renderProgressContent()}

      {/* 处理完成状态 */}
      {processedVideoBlob && !isProcessing && (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-300">处理完成！</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mb-3">
            视频已成功处理，文件大小: {(processedVideoBlob.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>下载视频</span>
          </button>
        </div>
      )}

      {/* 开始处理按钮 */}
      {!isProcessing && !processedVideoBlob && (
        <button
          onClick={handleStartProcessing}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
        >
          <Play className="h-5 w-5" />
          <span>开始处理视频</span>
        </button>
      )}

      {/* 重新处理按钮 */}
      {processedVideoBlob && !isProcessing && (
        <button
          onClick={handleStartProcessing}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-primary text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Play className="h-5 w-5" />
          <span>重新处理</span>
        </button>
      )}

      <div className="text-xs text-muted-foreground">
        <p>• 处理过程完全在本地进行，保护您的隐私</p>
        <p>• 大文件处理可能需要较长时间，请耐心等待</p>
      </div>
    </div>
  );
};