import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import ImageCard from './ImageCard';

export default function ImageGrid() {
  const { generatedImages, setPreviewImage, setGeneratedImages, isGenerating } = useStore();

  if (isGenerating) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/40 text-center">正在生成中...</p>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (generatedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/25 space-y-3">
        <div className="text-5xl">🎨</div>
        <p className="text-sm">输入提示词并点击生成，你的图片将在这里展示</p>
      </div>
    );
  }

  const cols = generatedImages.length <= 2 ? generatedImages.length : generatedImages.length <= 4 ? 2 : 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          共 {generatedImages.length} 张图片
        </p>
        <button
          onClick={() => setGeneratedImages([])}
          className="text-xs text-white/30 hover:text-red-400 transition-colors px-2 py-1"
          title="关闭图片"
        >
          ✕ 关闭
        </button>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {generatedImages.map((img, i) => (
          <ImageCard
            key={img.id}
            image={img}
            index={i}
            onPreview={setPreviewImage}
          />
        ))}
      </div>
    </motion.div>
  );
}
