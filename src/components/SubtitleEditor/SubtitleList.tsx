// 字幕列表组件

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useHistoryStore, useTranscript, useChunks } from '@/stores/historyStore';
import { useAppStore } from '@/stores/appStore';
import { formatTime, isTimeInRange } from '@/utils/timeUtils';
import { FileText, Play, Trash2, RotateCcw, Check, Clock } from 'lucide-react';

interface SubtitleListProps {
  className?: string;
  maxHeight?: string;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onPlayPause?: () => void;
}

export function SubtitleList({ 
  className,
  maxHeight = '400px'
}: SubtitleListProps) {
  const transcript = useTranscript();
  const chunks = useChunks();
  
  // 在组件层用 useMemo 做过滤，避免无限循环
  const activeChunks = useMemo(
    () => chunks.filter(c => !c.deleted),
    [chunks]
  );
  const currentTime = useAppStore(state => state.currentTime);
  const setCurrentTime = useAppStore(state => state.setCurrentTime);
  const deleteSelected = useHistoryStore(state => state.deleteSelected);
  const restoreSelected = useHistoryStore(state => state.restoreSelected);
  // const toggleDeleted = useHistoryStore(state => state.toggleDeleted);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 获取当前高亮的字幕片段
  const currentChunk = useMemo(() => {
    return transcript.chunks.find(chunk =>
      isTimeInRange(currentTime, chunk.timestamp)
    ) || null;
  }, [transcript.chunks, currentTime]);

  // 计算统计信息
  const statistics = useMemo(() => {
    const deletedChunks = transcript.chunks.filter(chunk => chunk.deleted);
    const activeCount = activeChunks.length;
    const deletedCount = deletedChunks.length;
    const totalCount = transcript.chunks.length;

    const deletedDuration = deletedChunks.reduce((sum, chunk) => 
      sum + (chunk.timestamp[1] - chunk.timestamp[0]), 0);
    const activeDuration = activeChunks.reduce((sum, chunk) => 
      sum + (chunk.timestamp[1] - chunk.timestamp[0]), 0);

    return {
      totalCount,
      activeCount,
      deletedCount,
      activeDuration,
      deletedDuration,
    };
  }, [transcript.chunks, activeChunks]);

  const handleChunkClick = (chunkId: string) => {
    const chunk = transcript.chunks.find(c => c.id === chunkId);
    if (chunk) {
      setCurrentTime(chunk.timestamp[0]);
    }
  };

  const handleToggleSelection = (chunkId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(chunkId)) {
      newSelected.delete(chunkId);
    } else {
      newSelected.add(chunkId);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      deleteSelected(selectedIds);
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = () => {
    const allActiveIds = new Set(activeChunks.map(chunk => chunk.id));
    setSelectedIds(allActiveIds);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleRestoreDeleted = () => {
    const deletedIds = new Set(
      transcript.chunks
        .filter(chunk => chunk.deleted)
        .map(chunk => chunk.id)
    );
    if (deletedIds.size > 0) {
      restoreSelected(deletedIds);
    }
  };

  if (!transcript.chunks || transcript.chunks.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          还没有字幕数据
          <br />
          请先上传视频并生成字幕
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{statistics.activeCount}</div>
          <div className="text-muted-foreground">保留</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{statistics.deletedCount}</div>
          <div className="text-muted-foreground">删除</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{statistics.totalCount}</div>
          <div className="text-muted-foreground">总计</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-card">
        <button
          onClick={handleSelectAll}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
        >
          <Check className="h-3 w-3" />
          <span>全选</span>
        </button>
        
        <button
          onClick={handleClearSelection}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>清除选择</span>
        </button>
        
        <button
          onClick={handleDeleteSelected}
          disabled={selectedIds.size === 0}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs border rounded hover:bg-red-50 hover:border-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          <span>删除选中 ({selectedIds.size})</span>
        </button>

        {statistics.deletedCount > 0 && (
          <button
            onClick={handleRestoreDeleted}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs border rounded hover:bg-green-50 hover:border-green-200 text-green-600 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>恢复删除 ({statistics.deletedCount})</span>
          </button>
        )}
      </div>

      {/* 字幕列表 */}
      <div 
        className="border rounded-lg overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-y-auto space-y-1 p-2">
          {transcript.chunks.map((chunk, index) => {
            const isActive = !chunk.deleted;
            const isCurrent = currentChunk?.id === chunk.id;
            const isSelected = selectedIds.has(chunk.id);
            
            return (
              <div
                key={chunk.id}
                className={cn(
                  'group flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
                  isCurrent && 'ring-2 ring-primary ring-offset-1',
                  isSelected && 'bg-blue-50 dark:bg-blue-950/30 border-blue-200',
                  !isActive && 'opacity-50 bg-red-50 dark:bg-red-950/30',
                  isActive && !isSelected && 'hover:bg-muted/50'
                )}
                onClick={() => handleChunkClick(chunk.id)}
              >
                {/* 选择框 */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleSelection(chunk.id);
                  }}
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
                    'text-sm leading-relaxed',
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTime(chunk.timestamp[0]);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-opacity"
                  title="跳转到此处"
                >
                  <Play className="h-4 w-4 text-primary" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部统计 */}
      <div className="text-xs text-muted-foreground text-center p-2 border-t">
        预计保留时长: {formatTime(statistics.activeDuration)} / 
        删除时长: {formatTime(statistics.deletedDuration)}
      </div>
    </div>
  );
}