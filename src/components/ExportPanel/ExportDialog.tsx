// 导出设置对话框组件

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Download, 
  FileText, 
  Video, 
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export interface VideoExportOptions {
  format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';
  subtitleProcessing: 'none' | 'soft' | 'hard';
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: 'subtitles' | 'video';
  onExportSubtitles: (format: 'srt' | 'json') => void;
  onExportVideo: (options: VideoExportOptions) => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  exportType,
  onExportSubtitles,
  onExportVideo
}: ExportDialogProps) {
  const [videoOptions, setVideoOptions] = useState<VideoExportOptions>({
    format: 'mp4',
    quality: 'medium',
    subtitleProcessing: 'none',
  });

  const handleSubtitleExport = (format: 'srt' | 'json') => {
    onExportSubtitles(format);
    onOpenChange(false);
  };

  const handleVideoExport = () => {
    onExportVideo(videoOptions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {exportType === 'subtitles' ? (
              <>
                <FileText className="h-5 w-5 text-primary" />
                <span>导出字幕</span>
              </>
            ) : (
              <>
                <Video className="h-5 w-5 text-primary" />
                <span>导出视频</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {exportType === 'subtitles' 
              ? '选择字幕格式并导出字幕文件' 
              : '配置视频导出选项'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {exportType === 'subtitles' ? (
            /* 字幕导出选项 */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleSubtitleExport('srt')}
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
                  onClick={() => handleSubtitleExport('json')}
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
                  <div className="font-medium text-blue-900 dark:text-blue-100">仅导出保留的字幕</div>
                  <div className="text-blue-700 dark:text-blue-300 mt-1">
                    已删除的字幕片段不会包含在导出文件中
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 视频导出选项 */
            <div className="space-y-4">
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

              {/* 字幕处理选项 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">字幕处理</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setVideoOptions(prev => ({ ...prev, subtitleProcessing: 'none' }))}
                    className={cn(
                      'w-full p-3 border rounded-lg text-left transition-colors',
                      videoOptions.subtitleProcessing === 'none'
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="font-semibold">无字幕</div>
                    <div className="text-xs text-muted-foreground">不处理字幕，仅导出视频</div>
                  </button>
                  
                  <button
                    onClick={() => setVideoOptions(prev => ({ ...prev, subtitleProcessing: 'soft' }))}
                    className={cn(
                      'w-full p-3 border rounded-lg text-left transition-colors',
                      videoOptions.subtitleProcessing === 'soft'
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="font-semibold">软烧录</div>
                    <div className="text-xs text-muted-foreground">字幕作为单独轨道嵌入，可开关</div>
                  </button>
                  
                  <button
                    onClick={() => setVideoOptions(prev => ({ ...prev, subtitleProcessing: 'hard' }))}
                    className={cn(
                      'w-full p-3 border rounded-lg text-left transition-colors',
                      videoOptions.subtitleProcessing === 'hard'
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="font-semibold">硬烧录</div>
                    <div className="text-xs text-muted-foreground">字幕直接烧录到视频画面上</div>
                  </button>
                </div>
              </div>

              {/* 警告信息 */}
              <div className="flex items-start space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-orange-900 dark:text-orange-100">注意事项</div>
                  <div className="text-orange-700 dark:text-orange-300 mt-1">
                    视频导出可能需要较长时间，导出过程中请勿关闭浏览器。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {exportType === 'video' && (
          <DialogFooter>
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted/50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleVideoExport}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              开始导出
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}