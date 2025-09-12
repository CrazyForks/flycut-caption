// 编辑会话管理 Hook - 使用 historyStore
import { useMemo, useCallback } from 'react';
import { 
  useHistoryStore,
  useChunks,
  useHistoryText,
  useHistoryDuration,
  useCanUndo,
  useCanRedo,
  useUndo,
  useRedo,
  useClearHistory
} from '@/stores/historyStore';
import { 
  calculateKeptSegments, 
  calculateDeletedSegments, 
  mapToOriginalTime,
  mapToNewTime,
  isTimeInKeptSegments
} from '@/utils/segmentUtils';
import type { EditingSession } from '@/types/history';

export function useEditingSession() {
  const chunks = useChunks();
  const text = useHistoryText();
  const duration = useHistoryDuration();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useUndo();
  const redo = useRedo();
  const clearHistory = useClearHistory();
  
  // 在 Hook 层用 useMemo 做过滤，避免无限循环
  const activeChunks = useMemo(
    () => chunks.filter(c => !c.deleted),
    [chunks]
  );

  // 计算当前编辑会话状态
  const session = useMemo((): EditingSession | null => {
    if (chunks.length === 0) return null;

    // 计算删除的chunks（被标记为deleted的）
    const deletedChunks = chunks.filter(chunk => chunk.deleted);
    const selectedChunks = new Set(deletedChunks.map(chunk => chunk.id));

    // 创建临时的transcript对象用于计算
    const tempTranscript = {
      text,
      chunks: chunks.filter(chunk => !chunk.deleted),
      language: 'en',
      duration
    };

    const keptSegments = calculateKeptSegments(tempTranscript, selectedChunks);
    const deletedSegments = calculateDeletedSegments(tempTranscript, selectedChunks);
    
    // 计算统计信息
    const originalDuration = chunks.reduce((total, chunk) => 
      total + (chunk.timestamp[1] - chunk.timestamp[0]), 0
    );
    
    const currentDuration = duration;
    const totalDeletedTime = originalDuration - currentDuration;
    const compressionRatio = originalDuration > 0 ? currentDuration / originalDuration : 0;

    return {
      id: `session-${Date.now()}`,
      originalDuration,
      currentDuration,
      keptSegments,
      deletedSegments,
      selectedChunks,
      totalDeletedTime,
      compressionRatio,
    };
  }, [chunks, text, duration]);

  // 时间工具函数
  const timeUtils = useMemo(() => {
    if (!session) {
      return {
        mapToOriginalTime: (newTime: number) => newTime,
        mapToNewTime: (originalTime: number) => originalTime,
        isTimeInKeptSegments: (_time: number) => true,
      };
    }

    return {
      mapToOriginalTime: (newTime: number) => mapToOriginalTime(newTime, session.keptSegments),
      mapToNewTime: (originalTime: number) => mapToNewTime(originalTime, session.keptSegments),
      isTimeInKeptSegments: (time: number) => isTimeInKeptSegments(time, session.keptSegments),
    };
  }, [session]);

  // 历史操作封装
  const history = useMemo(() => ({
    canUndo,
    canRedo,
    appliedActions: [], // 简化版本，historyStore内部管理
  }), [canUndo, canRedo]);

  // 删除选中的chunks
  const deleteSelectedChunks = useCallback((chunkIds: string[]) => {
    const deleteAction = useHistoryStore.getState().deleteSelected;
    deleteAction(new Set(chunkIds));
  }, []);

  // 恢复选中的chunks  
  const restoreSelectedChunks = useCallback((chunkIds: string[]) => {
    const restoreAction = useHistoryStore.getState().restoreSelected;
    restoreAction(new Set(chunkIds));
  }, []);

  // 选择所有chunks
  const selectAllChunks = useCallback(() => {
    // 在新架构中，"选择"意味着标记为删除
    // 这里需要根据业务逻辑调整
    console.warn('selectAllChunks: 需要明确业务逻辑 - 是选择所有还是删除所有？');
  }, []);

  // 清除选择
  const clearSelection = useCallback(() => {
    // 在新架构中，清除选择意味着恢复所有删除的chunks
    const deletedChunkIds = chunks.filter(chunk => chunk.deleted).map(chunk => chunk.id);
    if (deletedChunkIds.length > 0) {
      restoreSelectedChunks(deletedChunkIds);
    }
  }, [chunks, restoreSelectedChunks]);

  return {
    // 会话状态
    session,
    
    // 历史记录
    history,
    undo,
    redo,
    clearHistory,
    
    // 时间工具
    timeUtils,
    
    // 编辑操作
    deleteSelectedChunks,
    restoreSelectedChunks,
    selectAllChunks,
    clearSelection,
    
    // 快捷访问
    activeChunks,
    totalChunks: chunks.length,
    deletedChunksCount: chunks.filter(chunk => chunk.deleted).length,
  };
}