import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function PromptInput() {
  const {
    mode, prompt, setPrompt,
    negativePrompt, setNegativePrompt,
    getCurrentModel,
  } = useStore();
  const model = getCurrentModel();
  const maxLength = model.vendor === 'doubao' ? 2000 : undefined;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 font-medium">
          提示词 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'text-to-image'
            ? '描述你想要生成的图片...'
            : '描述你想要生成的效果，可上传参考图作为风格/构图参考...'}
          rows={4}
          maxLength={maxLength}
          className="
            w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
            text-white text-sm outline-none resize-none transition-all duration-200
            placeholder:text-white/25
            focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
            hover:border-white/20
          "
        />
        <div className={`text-right text-xs ${maxLength && prompt.length >= maxLength - 100 ? 'text-amber-400' : 'text-white/30'}`}>
          {prompt.length}{maxLength ? `/${maxLength}` : ''} 字符{maxLength && prompt.length >= maxLength ? '（已达上限）' : ''}
        </div>
      </div>

      {model.supports.negativePrompt && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-1.5"
        >
          <label className="text-xs text-white/50 font-medium">负面提示词</label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="描述你不希望在图片中出现的内容..."
            rows={2}
            className="
              w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
              text-white text-sm outline-none resize-none transition-all duration-200
              placeholder:text-white/25
              focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
              hover:border-white/20
            "
          />
        </motion.div>
      )}
    </div>
  );
}
