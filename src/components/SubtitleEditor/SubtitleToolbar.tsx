// 字幕编辑器工具栏组件

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSubtitles } from '@/hooks/useSubtitles';
import { downloadFile } from '@/utils/fileUtils';
import { 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Download, 
  Info,
  FileText,
  Trash2,
  Undo2
} from 'lucide-react';
import { formatTime } from '@/utils/timeUtils';

interface SubtitleToolbarProps {
  className?: string;
}

export function SubtitleToolbar({ className }: SubtitleToolbarProps) {
  const {
    statistics,
    selectedChunkIds,
    selectAllChunks,
    deselectAllChunks,
    invertSelection,
    exportSRT,
    exportJSON,
  } = useSubtitles();

  // 全选/取消全选
  const handleToggleSelectAll = useCallback(() => {
    if (selectedChunkIds.size === statistics.totalChunks) {
      deselectAllChunks();
    } else {
      selectAllChunks();
    }
  }, [selectedChunkIds.size, statistics.totalChunks, selectAllChunks, deselectAllChunks]);

  // 导出SRT字幕
  const handleExportSRT = useCallback(() => {
    const srtContent = exportSRT(false); // 导出保留的字幕
    if (srtContent) {
      const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
      downloadFile(blob, `subtitle_edited_${Date.now()}.srt`);
    }
  }, [exportSRT]);

  // 导出JSON字幕
  const handleExportJSON = useCallback(() => {
    const jsonContent = exportJSON(false); // 导出保留的字幕
    if (jsonContent) {
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
      downloadFile(blob, `subtitle_edited_${Date.now()}.json`);
    }
  }, [exportJSON]);

  const hasSelection = selectedChunkIds.size > 0;
  const hasFullSelection = selectedChunkIds.size === statistics.totalChunks;

  return (
    <div className={cn('bg-card border rounded-lg p-4 space-y-4', className)}>
      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">
              共 <span className="font-medium text-foreground">{statistics.totalChunks}</span> 个片段
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Trash2 className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">
              删除 <span className="font-medium text-red-600">{statistics.selectedChunks}</span> 个
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              保留 <span className="font-medium text-green-600">{statistics.keptChunks}</span> 个
            </span>
          </div>
        </div>

        {/* 时长信息 */}
        <div className="text-xs text-muted-foreground space-x-3">
          <span>
            总时长: <span className="font-medium">{formatTime(statistics.totalDuration)}</span>
          </span>
          <span>
            保留: <span className="font-medium text-green-600">{formatTime(statistics.keptDuration)}</span>
          </span>
          <span>
            删除: <span className="font-medium text-red-600">{formatTime(statistics.selectedDuration)}</span>
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 全选/取消全选 */}
          <button
            onClick={handleToggleSelectAll}
            className={cn(
              'flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors',
              'border hover:bg-muted',
              hasFullSelection 
                ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30' 
                : 'text-muted-foreground border-border'
            )}
          >
            {hasFullSelection ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>{hasFullSelection ? '取消全选' : '全选'}</span>
          </button>

          {/* 反选 */}
          <button
            onClick={invertSelection}
            disabled={statistics.totalChunks === 0}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            <span>反选</span>
          </button>

          {/* 清空选择 */}
          {hasSelection && (
            <button
              onClick={deselectAllChunks}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors border border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30"
            >
              <Undo2 className="h-4 w-4" />
              <span>清空选择</span>
            </button>
          )}
        </div>

        {/* 导出按钮 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportSRT}
            disabled={statistics.keptChunks === 0}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
          >
            <Download className="h-4 w-4" />
            <span>导出 SRT</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={statistics.keptChunks === 0}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            <Download className="h-4 w-4" />
            <span>导出 JSON</span>
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      {statistics.keptChunks === 0 && statistics.totalChunks > 0 && (
        <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            注意：您已删除所有字幕片段，导出的视频将没有内容！
          </span>
        </div>
      )}

      {hasSelection && (
        <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            已选择 {statistics.selectedChunks} 个片段进行删除，这些片段将从最终视频中移除。
          </span>
        </div>
      )}
    </div>
  );
}