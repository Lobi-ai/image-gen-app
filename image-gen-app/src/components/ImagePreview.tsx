import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { downloadImage, copyImageToClipboard } from '../services/api';

export default function ImagePreview() {
  const { previewImage, setPreviewImage } = useStore();

  const handleDownload = async () => {
    if (!previewImage) return;
    try {
      await downloadImage(previewImage.url, `ai-image-preview-${Date.now()}.png`);
    } catch {
      alert('下载失败');
    }
  };

  const handleCopy = async () => {
    if (!previewImage) return;
    try {
      await copyImageToClipboard(previewImage.url);
      alert('已复制到剪贴板');
    } catch {
      window.open(previewImage.url, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage.url}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
            />

            {/* 操作按钮 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2
              bg-black/60 backdrop-blur-md rounded-xl px-4 py-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white
                  bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载 PNG
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white
                  bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                复制
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white
                  bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕ 关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
