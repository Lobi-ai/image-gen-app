import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { fileToBase64, validateImageFile } from '../utils';

export default function ImageUpload() {
  const { referenceImage, referenceImageName, setReferenceImage, imageStrength, setImageStrength } = useStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const error = validateImageFile(file);
      if (error) {
        alert(error);
        return;
      }
      const base64 = await fileToBase64(file);
      setReferenceImage(base64, file.name);
    },
    [setReferenceImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      {!referenceImage ? (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive
              ? 'border-purple-400 bg-purple-500/10 scale-[1.02]'
              : 'border-white/15 hover:border-white/30 bg-white/[0.02]'}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="text-3xl">📤</div>
            <p className="text-sm text-white/60">
              {isDragActive ? '释放以上传图片' : '点击或拖拽上传参考图片'}
            </p>
            <p className="text-xs text-white/30">JPG / PNG / WebP · 最大 10MB</p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          <div className="relative rounded-xl overflow-hidden border border-white/10 group">
            <img
              src={referenceImage}
              alt="参考图"
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => document.getElementById('ref-upload-input')?.click()}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs text-white transition-colors"
              >
                更换
              </button>
              <button
                onClick={() => setReferenceImage(null)}
                className="px-3 py-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-xs text-white transition-colors"
              >
                移除
              </button>
            </div>
          </div>
          <p className="text-xs text-white/40 truncate">{referenceImageName}</p>
          <input
            id="ref-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const error = validateImageFile(file);
              if (error) { alert(error); return; }
              const base64 = await fileToBase64(file);
              setReferenceImage(base64, file.name);
            }}
          />
        </motion.div>
      )}

      {/* 参考强度滑块 */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <label className="text-xs text-white/50 font-medium">参考强度</label>
          <span className="text-xs text-white/40">{imageStrength.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={imageStrength}
          onChange={(e) => setImageStrength(parseFloat(e.target.value))}
          className="
            w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50
          "
        />
      </div>
    </div>
  );
}
