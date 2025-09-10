// 字幕列表组件

import { useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSubtitles } from '@/hooks/useSubtitles';
import { SubtitleItem } from './SubtitleItem';
import { SubtitleToolbar } from './SubtitleToolbar';
import { FileText, Search } from 'lucide-react';

interface SubtitleListProps {
  className?: string;
  maxHeight?: string;
}

export function SubtitleList({ className, maxHeight = '400px' }: SubtitleListProps) {
  const {
    transcript,
    currentChunk,
    selectedChunkIds,
    toggleChunkSelection,
    seekToChunk,
  } = useSubtitles();

  const listRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLDivElement>(null);

  // 自动滚动到当前播放的字幕
  useEffect(() => {
    if (currentChunk && currentItemRef.current && listRef.current) {
      const container = listRef.current;
      const item = currentItemRef.current;

      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      // 检查是否需要滚动
      const isVisible = 
        itemRect.top >= containerRect.top &&
        itemRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        // 滚动到中央位置
        const scrollTop = item.offsetTop - container.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      }
    }
  }, [currentChunk]);

  // 按时间排序字幕
  const sortedChunks = useMemo(() => {
    if (!transcript) return [];
    
    return [...transcript.chunks].sort((a, b) => a.timestamp[0] - b.timestamp[0]);
  }, [transcript]);

  if (!transcript || sortedChunks.length === 0) {
    return (
      <div className={cn('bg-card border rounded-lg p-8 text-center', className)}>
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">暂无字幕数据</p>
        <p className="text-sm text-muted-foreground">
          请先上传视频文件并生成字幕
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card border rounded-lg overflow-hidden', className)}>
      {/* 工具栏 */}
      <SubtitleToolbar className="border-b" />

      {/* 搜索栏 */}
      <div className="p-4 border-b bg-muted/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索字幕内容..."
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            // TODO: 实现搜索功能
          />
        </div>
      </div>

      {/* 字幕列表 */}
      <div 
        ref={listRef}
        className="overflow-y-auto p-4 space-y-2"
        style={{ maxHeight }}
      >
        {sortedChunks.map((chunk, index) => {
          const isSelected = selectedChunkIds.has(chunk.id);
          const isCurrent = currentChunk?.id === chunk.id;
          
          return (
            <div
              key={chunk.id}
              ref={isCurrent ? currentItemRef : undefined}
            >
              <SubtitleItem
                chunk={chunk}
                isSelected={isSelected}
                isCurrent={isCurrent}
                onToggleSelection={toggleChunkSelection}
                onSeekTo={seekToChunk}
                className={cn(
                  // 添加序号样式
                  'relative',
                  // 为当前播放项添加特殊样式
                  isCurrent && 'ring-2 ring-primary/20'
                )}
              />
              
              {/* 序号指示器 */}
              <div className="absolute left-1 top-1 text-xs text-muted-foreground/50 font-mono">
                #{index + 1}
              </div>
            </div>
          );
        })}

        {/* 列表底部填充 */}
        <div className="h-4" />
      </div>

      {/* 底部状态栏 */}
      <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            显示 {sortedChunks.length} 个字幕片段
          </span>
          
          {currentChunk && (
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>正在播放: #{sortedChunks.findIndex(c => c.id === currentChunk.id) + 1}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}