import { motion } from 'framer-motion';

interface Props {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export default function GenerateButton({ onClick, disabled, loading }: Props) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`
        relative w-full py-3.5 rounded-xl text-sm font-semibold text-white
        transition-all duration-300 overflow-hidden
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer'}
      `}
    >
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500" />
      {/* 悬浮亮度提升 */}
      <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity" />

      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            生成中...
          </>
        ) : (
          <>
            <span>✨</span>
            生成图片
          </>
        )}
      </span>
    </motion.button>
  );
}
