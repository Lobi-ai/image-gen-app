import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { MODELS } from '../constants/models';

export default function HistoryBar() {
  const { history, loadHistory, clearHistory, deleteHistory } = useStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (history.length === 0) {
    return (
      <aside className="w-[200px] flex-shrink-0 border-l border-white/5 backdrop-blur-sm bg-white/[0.01] flex items-center justify-center">
        <p className="text-xs text-white/15 px-4 text-center">暂无历史记录</p>
      </aside>
    );
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`确定删除选中的 ${selected.size} 条历史记录？`)) return;
    deleteHistory(Array.from(selected));
    setSelected(new Set());
  };

  const handleClearAll = () => {
    if (!confirm('确定清除全部历史记录？')) return;
    clearHistory();
    setSelected(new Set());
  };

  return (
    <aside className="w-[200px] flex-shrink-0 border-l border-white/5 backdrop-blur-sm bg-white/[0.01] flex flex-col">
      {/* 标题栏 */}
      <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs text-white/30 font-medium">历史</span>
        <div className="flex items-center gap-1">
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleDeleteSelected}
                className="px-2 py-0.5 text-[10px] text-red-400 bg-red-500/10
                  border border-red-500/20 hover:bg-red-500/20 rounded transition-colors"
              >
                删({selected.size})
              </motion.button>
            )}
          </AnimatePresence>
          <button
            onClick={handleClearAll}
            className="px-2 py-0.5 text-[10px] text-white/25 hover:text-red-400 transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      {/* 缩略图列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.map((record) => {
          const model = MODELS.find((m) => m.id === record.model);
          const isSelected = selected.has(record.id);
          return (
            <div key={record.id} className="relative group">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => loadHistory(record)}
                className="block w-full"
              >
                <div
                  className={`
                    w-full aspect-square rounded-lg overflow-hidden border-2 transition-all
                    ${isSelected
                      ? 'border-purple-500 ring-1 ring-purple-500/30'
                      : 'border-white/10 group-hover:border-white/25'
                    }
                  `}
                >
                  {record.thumbnails[0] ? (
                    <img src={record.thumbnails[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/15 text-[10px]">
                      N/A
                    </div>
                  )}
                </div>
                {/* 信息标签 */}
                <div className="mt-1 px-0.5">
                  <p className="text-[10px] text-white/40 truncate">{record.prompt}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: model
                          ? { openai: '#10A37F', google: '#4285F4', doubao: '#FF6B35' }[model.vendor]
                          : '#666',
                      }}
                    />
                    <span className="text-[9px] text-white/25 truncate">
                      {model?.displayName || record.model}
                    </span>
                  </div>
                </div>
              </motion.button>

              {/* 勾选框 */}
              <label
                className={`
                  absolute top-1 right-1 z-10 w-5 h-5 rounded-md
                  flex items-center justify-center cursor-pointer transition-all shadow-md
                  ${isSelected
                    ? 'bg-purple-500 opacity-100'
                    : 'bg-black/60 border border-white/20 opacity-0 group-hover:opacity-100'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(record.id)}
                  className="sr-only"
                />
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
