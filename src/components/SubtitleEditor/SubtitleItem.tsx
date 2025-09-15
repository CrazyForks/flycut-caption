// 字幕项组件

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/timeUtils';
import type { SubtitleChunk } from '@/types/subtitle';
import { Play, Clock } from 'lucide-react';

interface SubtitleItemProps {
  chunk: SubtitleChunk;
  index: number;
  isSelected: boolean;
  isCurrent: boolean;
  isActive: boolean;
  onToggleSelection: (chunkId: string) => void;
  onSeekTo: (time: number) => void;
  className?: string;
}

export function SubtitleItem({
  chunk,
  index,
  isSelected,
  isCurrent,
  isActive,
  onToggleSelection,
  onSeekTo,
  className,
}: SubtitleItemProps) {
  const handleToggleSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelection(chunk.id);
  }, [chunk.id, onToggleSelection]);

  const handleChunkClick = useCallback(() => {
    onSeekTo(chunk.timestamp[0]);
  }, [chunk.timestamp, onSeekTo]);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSeekTo(chunk.timestamp[0]);
  }, [chunk.timestamp, onSeekTo]);

  return (
    <div
      className={cn(
        'group flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
        isCurrent && 'ring-2 ring-primary ring-offset-1',
        isSelected && 'bg-blue-50 dark:bg-blue-950/30 border-blue-200',
        !isActive && 'opacity-50 bg-red-50 dark:bg-red-950/30',
        isActive && !isSelected && 'hover:bg-muted/50',
        className
      )}
      onClick={handleChunkClick}
    >
      {/* 选择框 */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleToggleSelection}
        className="mt-1 rounded"
      />

      {/* 序号和时间 */}
      <div className="flex-shrink-0 text-xs text-muted-foreground w-16">
        <div className="font-mono">#{index + 1}</div>
        <div className="flex items-center space-x-1 mt-1">
          <Clock className="h-3 w-3" />
          <span>{formatTime(chunk.timestamp[0])}</span>
        </div>
      </div>

      {/* 字幕内容 */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-sm leading-relaxed text-primary',
          !isActive && 'line-through text-muted-foreground'
        )}>
          {chunk.text}
        </div>
        <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
          <span>
            {formatTime(chunk.timestamp[0])} - {formatTime(chunk.timestamp[1])}
          </span>
          <span>
            时长: {((chunk.timestamp[1] - chunk.timestamp[0])).toFixed(1)}s
          </span>
          {!isActive && (
            <span className="text-red-500 font-medium">已删除</span>
          )}
        </div>
      </div>

      {/* 播放按钮 */}
      <button
        onClick={handlePlayClick}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-opacity"
        title="跳转到此处"
      >
        <Play className="h-4 w-4 text-primary" />
      </button>
    </div>
  );
}