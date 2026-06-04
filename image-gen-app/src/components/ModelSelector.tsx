import { useStore } from '../store/useStore';
import { MODELS, VENDOR_COLORS } from '../constants/models';

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useStore();

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/50 font-medium">模型选择</label>
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="
            w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10
            text-white text-sm outline-none transition-all duration-200
            focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
            hover:border-white/20
          "
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-gray-900 text-white">
              {m.displayName}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {/* 当前模型供应商标签 */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: VENDOR_COLORS[MODELS.find(m => m.id === selectedModel)?.vendor || 'openai'] }}
        />
        <span className="text-xs text-white/40">
          {MODELS.find(m => m.id === selectedModel)?.displayName}
        </span>
      </div>
    </div>
  );
}
