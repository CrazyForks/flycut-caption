# useHistoryStore 使用指南

基于 Zustand 的字幕历史记录管理 Store，支持完整的 undo/redo 操作。

## 🔧 核心特性

- ✅ **字幕chunk管理**: 支持文本编辑、删除/恢复操作
- ✅ **撤销/重做**: 完整的历史记录支持，支持连续操作合并
- ✅ **衍生状态**: 自动计算文本拼接和总时长
- ✅ **批量操作**: 支持批量删除/恢复选中的chunks
- ✅ **状态联动**: UI自动响应状态变化
- ✅ **类型安全**: 完整的TypeScript支持

## 📦 基本使用

```tsx
import React from 'react';
import { useHistoryStore, useHistoryActions, useActiveChunks } from '@/stores/historyStore';

function SubtitleEditor() {
  // 获取状态
  const { text, duration, canUndo, canRedo } = useHistoryStore();
  
  // 获取操作方法
  const { update, delete: deleteChunk, undo, redo } = useHistoryActions();
  
  // 获取活跃的chunks
  const activeChunks = useActiveChunks();

  return (
    <div>
      {/* 显示总信息 */}
      <div>
        <p>拼接文本: {text}</p>
        <p>总时长: {duration.toFixed(2)}s</p>
      </div>

      {/* 历史操作 */}
      <div>
        <button onClick={undo} disabled={!canUndo}>撤销</button>
        <button onClick={redo} disabled={!canRedo}>重做</button>
      </div>

      {/* 编辑chunks */}
      {activeChunks.map(chunk => (
        <div key={chunk.id}>
          <input
            value={chunk.text}
            onChange={e => update(chunk.id, { text: e.target.value })}
          />
          <button onClick={() => deleteChunk(chunk.id)}>
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 API 接口

### 状态选择器

```tsx
// 获取完整状态
const state = useHistoryStore();

// 获取核心状态
const { chunks, text, duration, canUndo, canRedo } = useHistoryState();

// 获取活跃chunks（未删除的）
const activeChunks = useActiveChunks();

// 获取已删除的chunks
const deletedChunks = useDeletedChunks();

// 获取兼容的转录对象
const transcript = useTranscript();
```

### 操作方法

```tsx
const actions = useHistoryActions();

// 设置转录内容
actions.setTranscript(transcript);

// 更新chunk属性
actions.update('chunk-id', { text: '新文本' });
actions.update('chunk-id', { deleted: true });

// 删除/恢复chunk（便捷方法）
actions.delete('chunk-id'); // toggle删除状态

// 历史操作
actions.undo();
actions.redo();
actions.clearHistory();

// 批量操作
actions.deleteSelected(new Set(['id1', 'id2']));
actions.restoreSelected(new Set(['id1', 'id2']));

// 重置
actions.reset();
```

## 🔄 历史记录机制

### 操作合并
连续快速操作（默认500ms内）会自动合并，避免产生过多历史记录：

```tsx
// 快速连续输入会合并为一个历史记录
actions.update('id', { text: 'a' });
actions.update('id', { text: 'ab' });     // 合并
actions.update('id', { text: 'abc' });    // 合并

// 停顿后的操作会创建新的历史记录
setTimeout(() => {
  actions.update('id', { text: 'abcd' }); // 新历史记录
}, 1000);
```

### 批量操作
批量删除/恢复会作为一个整体操作记录：

```tsx
// 一次撤销可以恢复多个chunks
actions.deleteSelected(new Set(['id1', 'id2', 'id3']));
actions.undo(); // 同时恢复所有3个chunks
```

## 🎨 UI集成示例

### 与现有SubtitleEditor集成
```tsx
import { useHistoryStore } from '@/stores/historyStore';
import { useEffect } from 'react';

function SubtitleEditor() {
  const transcript = useAppStore(state => state.transcript);
  const { setTranscript } = useHistoryActions();
  
  // 同步转录数据到历史store
  useEffect(() => {
    if (transcript) {
      setTranscript(transcript);
    }
  }, [transcript, setTranscript]);
  
  // 使用历史store的数据
  const activeChunks = useActiveChunks();
  const { update, delete: deleteChunk } = useHistoryActions();
  
  return (
    <div>
      {activeChunks.map(chunk => (
        <ChunkEditor 
          key={chunk.id}
          chunk={chunk}
          onUpdate={(next) => update(chunk.id, next)}
          onDelete={() => deleteChunk(chunk.id)}
        />
      ))}
    </div>
  );
}
```

### 状态同步
```tsx
// 将历史store的变化同步到主应用store
function useHistorySync() {
  const transcript = useTranscript();
  const setAppTranscript = useAppStore(state => state.setTranscript);
  
  useEffect(() => {
    if (transcript.chunks.length > 0) {
      setAppTranscript(transcript);
    }
  }, [transcript, setAppTranscript]);
}
```

## ⚡ 性能优化

1. **选择器优化**: 使用细粒度选择器避免不必要的重渲染
2. **操作合并**: 连续操作自动合并减少历史记录
3. **immer集成**: 使用immer确保不可变更新的性能
4. **devtools支持**: 集成Redux DevTools便于调试

## 🔧 配置项

```tsx
// 在store创建时可以调整配置
const initialState = {
  mergeThreshold: 500, // 操作合并时间阈值（毫秒）
  // 其他配置...
};
```