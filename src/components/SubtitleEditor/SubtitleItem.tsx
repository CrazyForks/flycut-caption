// 字幕项组件

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/timeUtils';
import type { SubtitleChunk } from '@/types/subtitle';
import { Trash2, Clock } from 'lucide-react';

interface SubtitleItemProps {
  chunk: SubtitleChunk;
  isSelected: boolean;
  isCurrent: boolean;
  onToggleSelection: (chunkId: string) => void;
  onSeekTo: (chunk: SubtitleChunk) => void;
  className?: string;
}

export function SubtitleItem({
  chunk,
  isSelected,
  isCurrent,
  onToggleSelection,
  onSeekTo,
  className,
}: SubtitleItemProps) {
  const [start, end] = chunk.timestamp;

  const handleToggleSelection = useCallback(() => {
    onToggleSelection(chunk.id);
  }, [chunk.id, onToggleSelection]);

  const handleSeekTo = useCallback(() => {
    onSeekTo(chunk);
  }, [chunk, onSeekTo]);

  return (
    <div
      className={cn(
        'group flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200',
        'hover:bg-muted/50 cursor-pointer',
        isCurrent && 'bg-primary/10 border-primary ring-1 ring-primary/50',
        isSelected && 'bg-destructive/10 border-destructive',
        !isSelected && !isCurrent && 'border-border',
        className
      )}
    >
      {/* 选择复选框 */}
      <div className="flex-shrink-0 pt-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggleSelection}
          className="w-4 h-4 rounded border-gray-300 text-destructive focus:ring-destructive focus:ring-2"
          title={isSelected ? '取消删除' : '标记删除'}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        {/* 时间信息 */}
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-mono">
            {formatTime(start)} → {formatTime(end)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({((end - start)).toFixed(1)}s)
          </span>
        </div>

        {/* 字幕文本 */}
        <p 
          className={cn(
            'text-sm leading-relaxed break-words',
            isCurrent && 'font-medium text-primary',
            isSelected && 'text-muted-foreground line-through',
            !isSelected && !isCurrent && 'text-foreground'
          )}
          onClick={handleSeekTo}
          title="点击跳转到此时间点"
        >
          {chunk.text.trim()}
        </p>

        {/* 状态指示器 */}
        {isCurrent && (
          <div className="mt-2 flex items-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs text-primary font-medium">当前播放</span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleToggleSelection}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            isSelected 
              ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' 
              : 'text-destructive hover:bg-destructive/10'
          )}
          title={isSelected ? '撤销删除' : '删除此片段'}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}