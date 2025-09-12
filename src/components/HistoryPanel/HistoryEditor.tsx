// 字幕历史编辑器组件示例
import { useMemo } from 'react';
import { 
  useChunks,
  useHistoryText,
  useHistoryDuration,
  useCanUndo,
  useCanRedo,
  useUpdate,
  useDelete,
  useUndo,
  useRedo,
  useClearHistory
} from '@/stores/historyStore';
import { Undo2, Redo2, Trash2, RotateCcw } from 'lucide-react';

export function HistoryEditor() {
  const text = useHistoryText();
  const duration = useHistoryDuration();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const update = useUpdate();
  const deleteChunk = useDelete();
  const undo = useUndo();
  const redo = useRedo();
  const clearHistory = useClearHistory();
  const chunks = useChunks();
  
  // 在组件层用 useMemo 做过滤，避免无限循环
  const activeChunks = useMemo(
    () => chunks.filter(c => !c.deleted),
    [chunks]
  );
  
  const deletedChunks = useMemo(
    () => chunks.filter(c => c.deleted),
    [chunks]
  );

  return (
    <div className="p-4 space-y-4">
      {/* 状态信息 */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">当前状态:</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">文本长度:</span> {text.length} 字符
          </div>
          <div>
            <span className="font-medium">总时长:</span> {duration.toFixed(2)} 秒
          </div>
          <div>
            <span className="font-medium">活跃片段:</span> {activeChunks.length}
          </div>
          <div>
            <span className="font-medium">删除片段:</span> {deletedChunks.length}
          </div>
        </div>
      </div>

      {/* 历史操作按钮 */}
      <div className="flex gap-2">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50"
        >
          <Undo2 className="w-4 h-4" />
          撤销
        </button>
        
        <button 
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50"
        >
          <Redo2 className="w-4 h-4" />
          重做
        </button>
        
        <button 
          onClick={clearHistory}
          className="flex items-center gap-2 px-3 py-1 border rounded"
        >
          <RotateCcw className="w-4 h-4" />
          清空历史
        </button>
      </div>

      {/* 活跃字幕片段列表 */}
      <div>
        <h3 className="font-medium mb-2 text-green-700">活跃片段 ({activeChunks.length})</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {activeChunks.map((chunk) => (
            <div key={chunk.id} className="border rounded p-2 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">
                  {chunk.timestamp[0].toFixed(1)}s - {chunk.timestamp[1].toFixed(1)}s
                </span>
                <button
                  onClick={() => deleteChunk(chunk.id)}
                  className="ml-auto flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  删除
                </button>
              </div>
              <input
                value={chunk.text}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(chunk.id, { text: e.target.value })}
                placeholder="编辑文本..."
                className="text-sm border rounded px-2 py-1 w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 已删除字幕片段列表 */}
      {deletedChunks.length > 0 && (
        <div>
          <h3 className="font-medium mb-2 text-red-700">已删除片段 ({deletedChunks.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {deletedChunks.map((chunk) => (
              <div key={chunk.id} className="border rounded p-2 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">
                    {chunk.timestamp[0].toFixed(1)}s - {chunk.timestamp[1].toFixed(1)}s
                  </span>
                  <button
                    onClick={() => deleteChunk(chunk.id)} // 恢复（toggle删除状态）
                    className="ml-auto flex items-center gap-1 px-2 py-1 border rounded text-sm"
                  >
                    <RotateCcw className="w-3 h-3" />
                    恢复
                  </button>
                </div>
                <div className="text-sm text-gray-600 line-through">
                  {chunk.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最终文本预览 */}
      <div>
        <h3 className="font-medium mb-2">最终文本预览:</h3>
        <div className="bg-gray-50 p-3 rounded text-sm min-h-[80px] border">
          {text || '(无内容)'}
        </div>
      </div>
    </div>
  );
}