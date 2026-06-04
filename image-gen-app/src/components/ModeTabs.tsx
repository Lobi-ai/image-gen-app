import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { GenerationMode } from '../types';

const tabs: { mode: GenerationMode; label: string; icon: string }[] = [
  { mode: 'text-to-image', label: '文生图', icon: '📝' },
  { mode: 'image-to-image', label: '图生图', icon: '🖼️' },
];

export default function ModeTabs() {
  const { mode, setMode } = useStore();

  return (
    <div className="flex gap-1 bg-white/5 rounded-xl p-1 backdrop-blur-sm">
      {tabs.map((tab) => (
        <button
          key={tab.mode}
          onClick={() => setMode(tab.mode)}
          className={`
            relative px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
            ${mode === tab.mode ? 'text-white' : 'text-white/50 hover:text-white/80'}
          `}
        >
          {mode === tab.mode && (
            <motion.div
              layoutId="mode-tab-bg"
              className="absolute inset-0 bg-gradient-to-r from-purple-600/60 to-cyan-600/60 rounded-lg"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <span>{tab.icon}</span>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
