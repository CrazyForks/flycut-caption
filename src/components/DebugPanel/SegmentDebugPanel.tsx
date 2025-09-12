// 视频片段调试面板

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranscript, useChunks } from '@/stores/historyStore';
import type { VideoSegment } from '@/types/video';
import { Play, Scissors, Info } from 'lucide-react';

interface SegmentDebugPanelProps {
  segments: VideoSegment[];
  className?: string;
}

export function SegmentDebugPanel({ segments, className }: SegmentDebugPanelProps) {
  const transcript = useTranscript();
  const chunks = useChunks();
  
  // 在组件层用 useMemo 做过滤，避免无限循环
  const deletedChunks = useMemo(
    () => chunks.filter(c => c.deleted),
    [chunks]
  );

  // 计算统计信息
  const stats = useMemo(() => {
    if (!transcript.chunks.length) return null;

    const originalDuration = transcript.duration || 0;
    const keptDuration = segments
      .filter(seg => seg.keep)
      .reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    const deletedDuration = originalDuration - keptDuration;

    return {
      originalDuration,
      keptDuration,
      deletedDuration,
      compressionRatio: originalDuration > 0 ? (keptDuration / originalDuration) * 100 : 0,
      segmentCount: segments.filter(seg => seg.keep).length,
      currentlySelected: deletedChunks.length, // 当前选中准备删除的
      remainingChunks: transcript.chunks.length, // 剩余的字幕块数量
    };
  }, [transcript, deletedChunks, segments]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  if (!transcript.chunks.length || segments.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-card border rounded-lg p-4', className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Scissors className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">视频片段调试</h3>
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm">
            <div className="text-muted-foreground">准备删除</div>
            <div className="font-medium text-red-600">{stats.currentlySelected} 个字幕块</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">剩余字幕</div>
            <div className="font-medium">{stats.remainingChunks} 个字幕块</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">生成片段</div>
            <div className="font-medium text-blue-600">{stats.segmentCount} 个视频片段</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">预计时长</div>
            <div className="font-medium text-green-600">{formatTime(stats.keptDuration)}</div>
          </div>
        </div>
      )}

      {/* 片段列表 */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        <div className="text-sm font-medium text-muted-foreground mb-2">保留的视频片段:</div>
        {segments
          .filter(seg => seg.keep)
          .map((segment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded border-l-4 border-green-500"
            >
              <div className="flex items-center space-x-2">
                <Play className="h-4 w-4 text-green-600" />
                <span className="font-mono text-sm">
                  片段 {index + 1}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(segment.start)} - {formatTime(segment.end)}
                <span className="ml-2 text-green-600">
                  ({formatTime(segment.end - segment.start)})
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-start space-x-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <div className="font-medium mb-1">片段生成逻辑:</div>
          <div>连续的保留字幕块会被合并成一个视频片段，选中删除的部分会被跳过。</div>
        </div>
      </div>
    </div>
  );
}