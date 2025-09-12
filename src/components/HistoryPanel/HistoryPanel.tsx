// 历史记录面板组件

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useEditingSession } from './useEditingSession';
import { formatTimeSaved } from '@/utils/segmentUtils';
import { 
  History, 
  Undo2, 
  Redo2, 
  Trash2, 
  RotateCcw,
  Clock,
  Scissors,
  Plus
} from 'lucide-react';

interface HistoryPanelProps {
  className?: string;
}

export function HistoryPanel({ className }: HistoryPanelProps) {
  const { session, history, undo, redo, clearHistory } = useEditingSession();

  // 格式化动作图标
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'DELETE_CHUNKS':
        return <Scissors className="h-3 w-3 text-destructive" />;
      case 'RESTORE_CHUNKS':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'SELECT_ALL':
        return <Scissors className="h-3 w-3 text-orange-600" />;
      case 'CLEAR_SELECTION':
        return <RotateCcw className="h-3 w-3 text-blue-600" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else {
      return new Date(timestamp).toLocaleTimeString();
    }
  };

  // 统计信息
  const stats = useMemo(() => {
    if (!session) return null;

    return {
      savedTime: formatTimeSaved(session.totalDeletedTime),
      compressionRatio: `${(session.compressionRatio * 100).toFixed(1)}%`,
      deletedSegments: session.deletedSegments.length,
      keptSegments: session.keptSegments.length,
    };
  }, [session]);

  if (!session) {
    return (
      <div className={cn('bg-card border rounded-lg p-6 text-center', className)}>
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">暂无编辑历史</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card border rounded-lg overflow-hidden', className)}>
      {/* 头部工具栏 */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">编辑历史</h3>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={undo}
              disabled={!history.canUndo}
              className={cn(
                'p-2 rounded-md transition-colors',
                history.canUndo
                  ? 'hover:bg-muted text-foreground'
                  : 'text-muted-foreground cursor-not-allowed'
              )}
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            
            <button
              onClick={redo}
              disabled={!history.canRedo}
              className={cn(
                'p-2 rounded-md transition-colors',
                history.canRedo
                  ? 'hover:bg-muted text-foreground'
                  : 'text-muted-foreground cursor-not-allowed'
              )}
              title="重做 (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <button
              onClick={clearHistory}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              title="清空历史记录"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">节省时间</div>
              <div className="font-semibold text-green-600">{stats.savedTime}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">保留比例</div>
              <div className="font-semibold text-blue-600">{stats.compressionRatio}</div>
            </div>
          </div>
        )}
      </div>

      {/* 历史记录列表 */}
      <div className="max-h-96 overflow-y-auto">
        {history.appliedActions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>还没有编辑操作</p>
          </div>
        ) : (
          <div className="p-2">
            {history.appliedActions.map((action: any, _index: number) => {
              const isApplied = true; // 简化版本，所有action都是已应用的
              const isCurrent = false; // 简化版本
              
              return (
                <div
                  key={action.id}
                  className={cn(
                    'flex items-start space-x-3 p-3 rounded-lg margin-1 transition-all',
                    isApplied ? 'opacity-100' : 'opacity-50',
                    isCurrent && 'bg-primary/10 ring-1 ring-primary/20'
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(action.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        'text-sm font-medium',
                        isApplied ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {action.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(action.timestamp)}
                      </span>
                    </div>
                    
                    {action.data.chunkIds && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.data.chunkIds.length} 个片段
                      </p>
                    )}
                  </div>
                  
                  {isCurrent && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部状态 */}
      <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            {history.appliedActions.length}/∞ 个操作
          </span>
          <span>
            撤销/重做可用
          </span>
        </div>
      </div>
    </div>
  );
}