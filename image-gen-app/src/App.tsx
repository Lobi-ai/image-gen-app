import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from './store/useStore';
import { MODELS } from './constants/models';
import { generateImages } from './services/api';
import { generateId } from './utils';
import type { GenerateRequest, HistoryRecord } from './types';

import ModeTabs from './components/ModeTabs';
import ModelSelector from './components/ModelSelector';
import PromptInput from './components/PromptInput';
import ImageUpload from './components/ImageUpload';
import DynamicParams from './components/DynamicParams';
import GenerateButton from './components/GenerateButton';
import ImageGrid from './components/ImageGrid';
import ImagePreview from './components/ImagePreview';
import HistoryBar from './components/HistoryBar';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const {
    mode, selectedModel, prompt, negativePrompt,
    referenceImage, imageStrength,
    aspectRatio, resolution, count, cfgScale, seed,
    isGenerating, setIsGenerating,
    generatedImages, setGeneratedImages,
    error, setError,
    apiSettings, setSettingsOpen,
    addHistory, initHistory,
    getCurrentModel,
  } = useStore();

  useEffect(() => {
    initHistory();
  }, [initHistory]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    if (mode === 'image-to-image' && !referenceImage) {
      setError('图生图模式请上传参考图片');
      return;
    }

    setError(null);
    setIsGenerating(true);

    const model = getCurrentModel();
    const request: GenerateRequest = {
      model: selectedModel,
      mode,
      prompt: prompt.trim(),
      image: referenceImage || undefined,
      imageStrength: mode === 'image-to-image' ? imageStrength : undefined,
      aspectRatio: model.supports.aspectRatio ? aspectRatio : undefined,
      resolution: model.supports.resolution ? resolution : undefined,
      n: model.supports.n ? count : undefined,
      negativePrompt: model.supports.negativePrompt ? negativePrompt || undefined : undefined,
      cfgScale: model.supports.cfgScale ? cfgScale : undefined,
      seed: model.supports.seed ? seed : undefined,
    };

    try {
      const response = await generateImages(request, apiSettings);
      setGeneratedImages(response.images);

      const modelInfo = MODELS.find((m) => m.id === selectedModel);
      const historyRecord: HistoryRecord = {
        id: generateId(),
        timestamp: Date.now(),
        model: selectedModel,
        modelDisplayName: modelInfo?.displayName || selectedModel,
        prompt: prompt.trim(),
        mode,
        thumbnails: response.images.map((img) => img.url),
        request,
        response,
      };
      addHistory(historyRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt, mode, referenceImage, imageStrength, selectedModel,
    aspectRatio, resolution, count, cfgScale, seed,
    apiSettings, setIsGenerating, setGeneratedImages,
    setError, addHistory, getCurrentModel,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E14] to-[#13161F] text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-sm bg-white/[0.01]">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            AI 图像生成
          </h1>
          <ModeTabs />
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
          title="设置"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <div className="flex h-[calc(100vh-9rem)]">
        <aside className="w-[420px] flex-shrink-0 p-6 overflow-y-auto border-r border-white/5 space-y-5
          backdrop-blur-sm bg-white/[0.01]">
          <ModelSelector />
          <PromptInput />

          {mode === 'image-to-image' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <ImageUpload />
            </motion.div>
          )}

          <DynamicParams />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <p className="text-xs text-red-400">{error}</p>
            </motion.div>
          )}

          <GenerateButton
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            loading={isGenerating}
          />
        </aside>

        <main className="flex-1 p-4 overflow-y-auto flex justify-center">
          <div className="w-full max-w-xl">
            <ImageGrid />
          </div>
        </main>

        <HistoryBar />
      </div>

      <ImagePreview />
      <SettingsModal />
    </div>
  );
}
