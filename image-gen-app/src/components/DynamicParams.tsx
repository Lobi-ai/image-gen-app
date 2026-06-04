import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { ASPECT_RATIOS } from '../constants/models';
import type { AspectRatio } from '../types';

export default function DynamicParams() {
  const {
    getCurrentModel,
    aspectRatio, setAspectRatio,
    resolution, setResolution,
    count, setCount,
    cfgScale, setCfgScale,
    seed, setSeed,
  } = useStore();

  const model = getCurrentModel();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={model.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {/* 宽高比 */}
        {model.supports.aspectRatio && (
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-medium">宽高比</label>
            <div className="flex gap-1.5 flex-wrap">
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setAspectRatio(r.value as AspectRatio)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${aspectRatio === r.value
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'}
                  `}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 分辨率 */}
        {model.supports.resolution && model.supports.resolutionOptions && (
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-medium">分辨率</label>
            <div className="flex gap-1.5 flex-wrap">
              {model.supports.resolutionOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setResolution(opt.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${resolution === opt.value
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'}
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 生成数量（仅 OpenAI） */}
        {model.supports.n && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-xs text-white/50 font-medium">生成数量</label>
              <span className="text-xs text-white/40">{count}</span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="
                w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50
              "
            />
          </div>
        )}

        {/* 引导强度 */}
        {model.supports.cfgScale && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-xs text-white/50 font-medium">引导强度</label>
              <span className="text-xs text-white/40">{cfgScale}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={cfgScale}
              onChange={(e) => setCfgScale(parseFloat(e.target.value))}
              className="
                w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50
              "
            />
          </div>
        )}

        {/* 随机种子 */}
        {model.supports.seed && (
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-medium">随机种子</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={seed === undefined ? '' : seed}
                onChange={(e) => {
                  const v = e.target.value;
                  setSeed(v === '' ? undefined : parseInt(v));
                }}
                placeholder="留空为随机"
                className="
                  flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-white text-sm outline-none transition-all duration-200
                  placeholder:text-white/25
                  focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                  hover:border-white/20
                "
              />
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 999999999))}
                className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/50
                  hover:bg-white/10 hover:text-white/70 transition-colors"
              >
                🎲
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
