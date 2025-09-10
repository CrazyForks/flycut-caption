// 字幕管理 Hook

import { useCallback, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { formatTime, isTimeInRange } from '../utils/timeUtils';
import type { SubtitleChunk } from '../types/subtitle';

export function useSubtitles() {
  const { state, dispatch } = useAppContext();

  // 获取当前高亮的字幕片段
  const currentChunk = useMemo(() => {
    if (!state.transcript) return null;

    return state.transcript.chunks.find(chunk =>
      isTimeInRange(state.currentTime, chunk.timestamp)
    ) || null;
  }, [state.transcript, state.currentTime]);

  // 获取选中的字幕片段
  const selectedChunks = useMemo(() => {
    if (!state.transcript) return [];

    return state.transcript.chunks.filter(chunk =>
      state.selectedChunks.has(chunk.id)
    );
  }, [state.transcript, state.selectedChunks]);

  // 获取未选中的字幕片段（即保留的片段）
  const keptChunks = useMemo(() => {
    if (!state.transcript) return [];

    return state.transcript.chunks.filter(chunk =>
      !state.selectedChunks.has(chunk.id)
    );
  }, [state.transcript, state.selectedChunks]);

  // 计算统计信息
  const statistics = useMemo(() => {
    if (!state.transcript) {
      return {
        totalChunks: 0,
        selectedChunks: 0,
        keptChunks: 0,
        totalDuration: 0,
        selectedDuration: 0,
        keptDuration: 0,
      };
    }

    const selectedDuration = selectedChunks.reduce((total, chunk) => {
      const [start, end] = chunk.timestamp;
      return total + (end - start);
    }, 0);

    const keptDuration = keptChunks.reduce((total, chunk) => {
      const [start, end] = chunk.timestamp;
      return total + (end - start);
    }, 0);

    return {
      totalChunks: state.transcript.chunks.length,
      selectedChunks: selectedChunks.length,
      keptChunks: keptChunks.length,
      totalDuration: state.transcript.duration,
      selectedDuration,
      keptDuration,
    };
  }, [state.transcript, selectedChunks, keptChunks]);

  // 切换字幕片段选择状态
  const toggleChunkSelection = useCallback((chunkId: string) => {
    dispatch({
      type: 'TOGGLE_CHUNK_SELECTION',
      chunkId,
    });
  }, [dispatch]);

  // 选中所有字幕片段
  const selectAllChunks = useCallback(() => {
    dispatch({
      type: 'SELECT_ALL_CHUNKS',
    });
  }, [dispatch]);

  // 取消选中所有字幕片段
  const deselectAllChunks = useCallback(() => {
    dispatch({
      type: 'DESELECT_ALL_CHUNKS',
    });
  }, [dispatch]);

  // 反选字幕片段
  const invertSelection = useCallback(() => {
    if (!state.transcript) return;

    // 先获取当前未选中的片段 IDs
    const unselectedIds = state.transcript.chunks
      .filter(chunk => !state.selectedChunks.has(chunk.id))
      .map(chunk => chunk.id);

    // 清空选择
    dispatch({
      type: 'DESELECT_ALL_CHUNKS',
    });

    // 选中之前未选中的片段
    unselectedIds.forEach(id => {
      dispatch({
        type: 'TOGGLE_CHUNK_SELECTION',
        chunkId: id,
      });
    });
  }, [state.transcript, state.selectedChunks, dispatch]);

  // 跳转到指定字幕片段
  const seekToChunk = useCallback((chunk: SubtitleChunk) => {
    const [start] = chunk.timestamp;
    dispatch({
      type: 'SET_CURRENT_TIME',
      time: start,
    });
  }, [dispatch]);

  // 按时间范围选择字幕片段
  const selectChunksByTimeRange = useCallback((startTime: number, endTime: number) => {
    if (!state.transcript) return;

    state.transcript.chunks.forEach(chunk => {
      const [chunkStart, chunkEnd] = chunk.timestamp;
      
      // 如果字幕片段与指定时间范围有重叠
      if (chunkStart < endTime && chunkEnd > startTime) {
        if (!state.selectedChunks.has(chunk.id)) {
          dispatch({
            type: 'TOGGLE_CHUNK_SELECTION',
            chunkId: chunk.id,
          });
        }
      }
    });
  }, [state.transcript, state.selectedChunks, dispatch]);

  // 导出字幕文件（SRT 格式）
  const exportSRT = useCallback((includeSelected = false) => {
    if (!state.transcript) return null;

    const chunksToExport = includeSelected ? selectedChunks : keptChunks;
    
    if (chunksToExport.length === 0) return null;

    let srtContent = '';
    
    chunksToExport.forEach((chunk, index) => {
      const [start, end] = chunk.timestamp;
      
      // SRT 时间格式: HH:MM:SS,mmm
      const formatSRTTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
      };
      
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(start)} --> ${formatSRTTime(end)}\n`;
      srtContent += `${chunk.text.trim()}\n\n`;
    });

    return srtContent;
  }, [state.transcript, selectedChunks, keptChunks]);

  // 导出字幕文件（JSON 格式）
  const exportJSON = useCallback((includeSelected = false) => {
    if (!state.transcript) return null;

    const chunksToExport = includeSelected ? selectedChunks : keptChunks;
    
    const exportData = {
      language: state.transcript.language,
      duration: statistics.keptDuration,
      chunks: chunksToExport.map(chunk => ({
        text: chunk.text,
        timestamp: chunk.timestamp,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.transcript, selectedChunks, keptChunks, statistics.keptDuration]);

  // 格式化时间显示
  const formatChunkTime = useCallback((chunk: SubtitleChunk) => {
    const [start, end] = chunk.timestamp;
    return `${formatTime(start)} - ${formatTime(end)}`;
  }, []);

  return {
    // 状态
    transcript: state.transcript,
    currentChunk,
    selectedChunks,
    keptChunks,
    selectedChunkIds: state.selectedChunks,
    currentTime: state.currentTime,
    statistics,

    // 操作方法
    toggleChunkSelection,
    selectAllChunks,
    deselectAllChunks,
    invertSelection,
    seekToChunk,
    selectChunksByTimeRange,

    // 导出方法
    exportSRT,
    exportJSON,

    // 工具方法
    formatChunkTime,
  };
}