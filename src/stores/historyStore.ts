// 字幕历史管理 Zustand Store
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { SubtitleChunk, SubtitleTranscript } from '@/types/subtitle'

interface Chunk extends SubtitleChunk {
  deleted?: boolean;
}

interface UpdateAction {
  type: "update";
  id: string;
  prev: Partial<Chunk>;
  next: Partial<Chunk>;
}

interface HistoryState {
  // 字幕数据
  chunks: Chunk[];
  language: string;
  
  // 历史记录
  undoStack: UpdateAction[];
  redoStack: UpdateAction[];
  lastUpdateTime: number;
  mergeThreshold: number; // 连续操作合并阈值（毫秒）

  // 衍生状态
  text: string; // 所有未删除chunks的text拼接
  duration: number; // 所有未删除chunks的总时长
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryActions {
  // 基础操作
  setTranscript: (transcript: SubtitleTranscript) => void;
  update: (id: string, next: Partial<Chunk>) => void;
  delete: (id: string) => void; // 封装的删除操作
  
  // 历史操作
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // 批量操作
  deleteSelected: (selectedIds: Set<string>) => void;
  restoreSelected: (selectedIds: Set<string>) => void;
  
  // 重置
  reset: () => void;
}

// 计算衍生状态的辅助函数
const computeDerivedState = (chunks: Chunk[]) => {
  const activeChunks = chunks.filter(chunk => !chunk.deleted);
  
  const text = activeChunks
    .sort((a, b) => a.timestamp[0] - b.timestamp[0])
    .map(chunk => chunk.text)
    .join(' ');
    
  const duration = activeChunks.reduce((total, chunk) => {
    return total + (chunk.timestamp[1] - chunk.timestamp[0]);
  }, 0);
  
  return { text, duration };
};

// 初始状态
const initialState: HistoryState = {
  chunks: [],
  language: 'en',
  undoStack: [],
  redoStack: [],
  lastUpdateTime: 0,
  mergeThreshold: 500,
  text: '',
  duration: 0,
  canUndo: false,
  canRedo: false,
};

// 创建Store
export const useHistoryStore = create<HistoryState & HistoryActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 设置字幕转录内容
      setTranscript: (transcript) => {
        // 转换SubtitleChunk为Chunk，添加deleted属性
        const chunks = transcript.chunks.map(chunk => ({
          ...chunk,
          deleted: false,
        }));
        
        // 重新计算衍生状态
        const derived = computeDerivedState(chunks);
        
        set({
          chunks,
          language: transcript.language,
          text: derived.text,
          duration: derived.duration,
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        });
      },

      // 更新chunk属性
      update: (id, next) => {
        const state = get();
        const chunkIndex = state.chunks.findIndex(c => c.id === id);
        if (chunkIndex === -1) return;

        const chunk = state.chunks[chunkIndex];
        
        // 生成prev状态记录
        const prev: Partial<Chunk> = {};
        for (const key in next) {
          const k = key as keyof Chunk;
          prev[k] = chunk[k] as never;
        }

        const now = Date.now();
        const lastAction = state.undoStack[state.undoStack.length - 1];
        
        // 更新chunk
        const updatedChunk = { ...chunk, ...next };
        const newChunks = [...state.chunks];
        newChunks[chunkIndex] = updatedChunk;

        let newUndoStack: UpdateAction[];
        const newRedoStack: UpdateAction[] = [];
        const newLastUpdateTime = now;

        // 检查是否可以合并操作（连续快速操作同一个chunk）
        if (
          lastAction &&
          lastAction.type === "update" &&
          lastAction.id === id &&
          now - state.lastUpdateTime < state.mergeThreshold
        ) {
          // 合并到上一个操作
          const mergedAction = {
            ...lastAction,
            next: { ...lastAction.next, ...next }
          };
          newUndoStack = [...state.undoStack.slice(0, -1), mergedAction];
        } else {
          // 创建新的历史记录
          const action: UpdateAction = { type: "update", id, prev, next };
          newUndoStack = [...state.undoStack, action];
        }

        // 重新计算衍生状态
        const derived = computeDerivedState(newChunks);
        
        set({
          chunks: newChunks,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
          lastUpdateTime: newLastUpdateTime,
          text: derived.text,
          duration: derived.duration,
          canUndo: newUndoStack.length > 0,
          canRedo: newRedoStack.length > 0,
        });
      },

      // 删除chunk（封装的便捷方法）
      delete: (id) => {
        const state = get();
        const chunk = state.chunks.find(c => c.id === id);
        if (!chunk) return;
        
        // 使用update方法来确保历史记录正确
        get().update(id, { deleted: !chunk.deleted });
      },

      // 撤销操作
      undo: () => {
        const state = get();
        if (state.undoStack.length === 0) return;

        const action = state.undoStack[state.undoStack.length - 1];
        const chunkIndex = state.chunks.findIndex(c => c.id === action.id);
        if (chunkIndex === -1) return;

        // 恢复之前的状态
        const chunk = state.chunks[chunkIndex];
        const restoredChunk = { ...chunk, ...action.prev };
        const newChunks = [...state.chunks];
        newChunks[chunkIndex] = restoredChunk;
        
        // 移动到redo栈
        const newUndoStack = state.undoStack.slice(0, -1);
        const newRedoStack = [...state.redoStack, action];

        // 重新计算衍生状态
        const derived = computeDerivedState(newChunks);

        set({
          chunks: newChunks,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
          text: derived.text,
          duration: derived.duration,
          canUndo: newUndoStack.length > 0,
          canRedo: newRedoStack.length > 0,
        });
      },

      // 重做操作
      redo: () => {
        const state = get();
        if (state.redoStack.length === 0) return;

        const action = state.redoStack[state.redoStack.length - 1];
        const chunkIndex = state.chunks.findIndex(c => c.id === action.id);
        if (chunkIndex === -1) return;

        // 应用操作
        const chunk = state.chunks[chunkIndex];
        const updatedChunk = { ...chunk, ...action.next };
        const newChunks = [...state.chunks];
        newChunks[chunkIndex] = updatedChunk;
        
        // 移动回undo栈
        const newUndoStack = [...state.undoStack, action];
        const newRedoStack = state.redoStack.slice(0, -1);

        // 重新计算衍生状态
        const derived = computeDerivedState(newChunks);

        set({
          chunks: newChunks,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
          text: derived.text,
          duration: derived.duration,
          canUndo: newUndoStack.length > 0,
          canRedo: newRedoStack.length > 0,
        });
      },

      // 清空历史记录
      clearHistory: () => {
        set({
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        });
      },

      // 批量删除选中的chunks
      deleteSelected: (selectedIds) => {
        const state = get();
        const actions: UpdateAction[] = [];
        const newChunks = [...state.chunks];
        const now = Date.now();
        
        // 为每个选中的chunk创建删除操作
        for (const id of selectedIds) {
          const chunkIndex = newChunks.findIndex(c => c.id === id);
          if (chunkIndex !== -1) {
            const chunk = newChunks[chunkIndex];
            if (!chunk.deleted) {
              const action: UpdateAction = {
                type: "update",
                id,
                prev: { deleted: chunk.deleted },
                next: { deleted: true }
              };
              
              newChunks[chunkIndex] = { ...chunk, deleted: true };
              actions.push(action);
            }
          }
        }
        
        if (actions.length > 0) {
          // 重新计算衍生状态
          const derived = computeDerivedState(newChunks);
          
          set({
            chunks: newChunks,
            undoStack: [...state.undoStack, ...actions],
            redoStack: [],
            lastUpdateTime: now,
            text: derived.text,
            duration: derived.duration,
            canUndo: true,
            canRedo: false,
          });
        }
      },

      // 批量恢复选中的chunks
      restoreSelected: (selectedIds) => {
        const state = get();
        const actions: UpdateAction[] = [];
        const newChunks = [...state.chunks];
        const now = Date.now();
        
        // 为每个选中的chunk创建恢复操作
        for (const id of selectedIds) {
          const chunkIndex = newChunks.findIndex(c => c.id === id);
          if (chunkIndex !== -1) {
            const chunk = newChunks[chunkIndex];
            if (chunk.deleted) {
              const action: UpdateAction = {
                type: "update",
                id,
                prev: { deleted: chunk.deleted },
                next: { deleted: false }
              };
              
              newChunks[chunkIndex] = { ...chunk, deleted: false };
              actions.push(action);
            }
          }
        }
        
        if (actions.length > 0) {
          // 重新计算衍生状态
          const derived = computeDerivedState(newChunks);
          
          set({
            chunks: newChunks,
            undoStack: [...state.undoStack, ...actions],
            redoStack: [],
            lastUpdateTime: now,
            text: derived.text,
            duration: derived.duration,
            canUndo: true,
            canRedo: false,
          });
        }
      },

      // 重置所有状态
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'history-store', // Redux DevTools
    }
  )
);

// 独立的状态选择器，避免创建新对象引用
export const useCanUndo = () => useHistoryStore(state => state.canUndo);
export const useCanRedo = () => useHistoryStore(state => state.canRedo);

// 独立的动作选择器，避免创建新对象引用
export const useSetTranscript = () => useHistoryStore(state => state.setTranscript);
export const useUpdate = () => useHistoryStore(state => state.update);
export const useDelete = () => useHistoryStore(state => state.delete);
export const useUndo = () => useHistoryStore(state => state.undo);
export const useRedo = () => useHistoryStore(state => state.redo);
export const useClearHistory = () => useHistoryStore(state => state.clearHistory);
export const useDeleteSelected = () => useHistoryStore(state => state.deleteSelected);
export const useRestoreSelected = () => useHistoryStore(state => state.restoreSelected);
export const useResetHistory = () => useHistoryStore(state => state.reset);

// 获取所有chunks（在组件中使用 useMemo 过滤）
export const useChunks = () => useHistoryStore(state => state.chunks);

// 独立的选择器，避免创建新对象引用
export const useHistoryText = () => useHistoryStore(state => state.text);
export const useHistoryLanguage = () => useHistoryStore(state => state.language);
export const useHistoryDuration = () => useHistoryStore(state => state.duration);