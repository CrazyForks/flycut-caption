// 导出面板组件

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useEditingSession } from '../HistoryPanel/useEditingSession';
import { formatTime, formatTimeSaved } from '@/utils/segmentUtils';
import { 
  Download, 
  FileText, 
  Video, 
  Settings,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ExportPanelProps {
  className?: string;
  onExportSubtitles?: (format: 'srt' | 'json') => void;
  onExportVideo?: (options: VideoExportOptions) => void;
}

interface VideoExportOptions {
  format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';
  includeSubtitles: boolean;
}

export function ExportPanel({ 
  className, 
  onExportSubtitles, 
  onExportVideo 
}: ExportPanelProps) {
  const { session } = useEditingSession();
  
  const [exportType, setExportType] = useState<'subtitles' | 'video'>('subtitles');
  const [videoOptions, setVideoOptions] = useState<VideoExportOptions>({
    format: 'mp4',
    quality: 'medium',
    includeSubtitles: false,
  });
  
  // 计算导出统计信息
  const exportStats = useMemo(() => {
    if (!session) return null;

    const compressionRatio = session.compressionRatio;
    const estimatedSize = compressionRatio * 100; // 假设原文件 100MB
    const sizeSaving = 100 - estimatedSize;

    return {
      originalDuration: formatTime(session.originalDuration),
      finalDuration: formatTime(session.currentDuration),
      timeSaved: formatTimeSaved(session.totalDeletedTime),
      compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
      estimatedSize: `~${estimatedSize.toFixed(0)}MB`,
      sizeSaving: `节省 ~${sizeSaving.toFixed(0)}MB`,
      segmentsCount: session.keptSegments.length,
      deletedSegments: session.deletedSegments.length,
    };
  }, [session]);

  const handleExportSubtitles = (format: 'srt' | 'json') => {
    onExportSubtitles?.(format);
  };

  const handleExportVideo = () => {
    onExportVideo?.(videoOptions);
  };

  if (!session) {
    return (
      <div className={cn('bg-card border rounded-lg p-8 text-center', className)}>
        <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">暂无可导出内容</p>
        <p className="text-sm text-muted-foreground">
          请先上传视频并进行编辑
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card border rounded-lg overflow-hidden', className)}>
      {/* 头部 */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">导出设置</h3>
          </div>
          
          {/* 导出类型切换 */}
          <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setExportType('subtitles')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                exportType === 'subtitles'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="w-4 h-4 mr-1 inline" />
              字幕
            </button>
            <button
              onClick={() => setExportType('video')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                exportType === 'video'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Video className="w-4 h-4 mr-1 inline" />
              视频
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        {exportStats && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground">原时长</div>
                <div className="font-semibold">{exportStats.originalDuration}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">最终时长</div>
                <div className="font-semibold text-green-600">{exportStats.finalDuration}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">节省时间</div>
                <div className="font-semibold text-blue-600">{exportStats.timeSaved}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">保留比例</div>
                <div className="font-semibold text-purple-600">{exportStats.compressionRatio}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 导出选项 */}
      <div className="p-4 space-y-4">
        {exportType === 'subtitles' ? (
          /* 字幕导出 */
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>导出字幕文件</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleExportSubtitles('srt')}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">SRT 格式</div>
                    <div className="text-sm text-muted-foreground">标准字幕文件</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => handleExportSubtitles('json')}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">JSON 格式</div>
                    <div className="text-sm text-muted-foreground">带时间戳数据</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100">仅导出保留的字幕片段</div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  已删除的字幕片段不会包含在导出文件中，时间戳会自动调整为连续时间轴。
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 视频导出 */
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Video className="w-4 h-4" />
              <span>导出裁剪后的视频</span>
            </div>

            {/* 格式选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">输出格式</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVideoOptions(prev => ({ ...prev, format: 'mp4' }))}
                  className={cn(
                    'p-3 border rounded-lg text-left transition-colors',
                    videoOptions.format === 'mp4'
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="font-semibold">MP4</div>
                  <div className="text-xs text-muted-foreground">广泛兼容</div>
                </button>
                <button
                  onClick={() => setVideoOptions(prev => ({ ...prev, format: 'webm' }))}
                  className={cn(
                    'p-3 border rounded-lg text-left transition-colors',
                    videoOptions.format === 'webm'
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="font-semibold">WebM</div>
                  <div className="text-xs text-muted-foreground">体积更小</div>
                </button>
              </div>
            </div>

            {/* 质量选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">输出质量</label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setVideoOptions(prev => ({ ...prev, quality }))}
                    className={cn(
                      'p-2 border rounded text-sm transition-colors',
                      videoOptions.quality === quality
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    {quality === 'high' ? '高' : quality === 'medium' ? '中' : '低'}
                  </button>
                ))}
              </div>
            </div>

            {/* 字幕嵌入 */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">嵌入字幕</div>
                <div className="text-sm text-muted-foreground">将字幕直接烧录到视频中</div>
              </div>
              <input
                type="checkbox"
                checked={videoOptions.includeSubtitles}
                onChange={(e) => setVideoOptions(prev => ({ 
                  ...prev, 
                  includeSubtitles: e.target.checked 
                }))}
                className="w-4 h-4"
              />
            </div>

            {/* 预估信息 */}
            {exportStats && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-green-900 dark:text-green-100">预计输出</div>
                    <div className="text-green-700 dark:text-green-300 mt-1">
                      时长: {exportStats.finalDuration} | 大小: {exportStats.estimatedSize} | {exportStats.sizeSaving}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 警告信息 */}
            <div className="flex items-start space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-orange-900 dark:text-orange-100">注意事项</div>
                <div className="text-orange-700 dark:text-orange-300 mt-1">
                  视频导出可能需要较长时间，取决于视频长度和输出质量。导出过程中请勿关闭浏览器。
                </div>
              </div>
            </div>

            {/* 导出按钮 */}
            <button
              onClick={handleExportVideo}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>开始导出视频</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}