import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, HistoryRecord, GeneratedImage, GenerateRequest, VendorConfig } from '../types';
import { MODELS, DEFAULT_API_SETTINGS } from '../constants/models';
import { saveHistory, loadHistory, clearHistory as clearHistoryDB, deleteHistoryRecords } from '../services/storage';

function migrateSavedBaseUrls(config: Partial<VendorConfig>): { name: string; url: string }[] {
  if (!config.savedBaseUrls || config.savedBaseUrls.length === 0) return [];
  // 兼容旧版 string[] 格式，迁移到 { name, url }[]
  return config.savedBaseUrls.map((item: unknown) => {
    if (typeof item === 'string') {
      try { return { name: new URL(item).hostname, url: item }; }
      catch { return { name: item, url: item }; }
    }
    return item as { name: string; url: string };
  });
}

function mergeVendorConfig(defaults: { apiKey: string; baseUrl: string; savedBaseUrls: { name: string; url: string }[] }, persisted: Partial<VendorConfig> | undefined) {
  const persistedUrls = migrateSavedBaseUrls(persisted || {});
  const defaultUrls = defaults.savedBaseUrls || [];
  // 合并：默认优先，用户添加的跟在后面，按 url 去重
  const mergedUrls = [...defaultUrls];
  for (const u of persistedUrls) {
    if (!mergedUrls.some((d) => d.url === u.url)) {
      mergedUrls.push(u);
    }
  }
  return {
    apiKey: (persisted?.apiKey as string) ?? defaults.apiKey,
    baseUrl: (persisted?.baseUrl as string) ?? defaults.baseUrl,
    savedBaseUrls: mergedUrls,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 模式
      mode: 'text-to-image',
      setMode: (mode) => set({ mode }),

      // 模型
      selectedModel: MODELS[0].id,
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),

      // 提示词
      prompt: '',
      setPrompt: (prompt) => set({ prompt }),
      negativePrompt: '',
      setNegativePrompt: (negativePrompt) => set({ negativePrompt }),

      // 图生图
      referenceImage: null,
      referenceImageName: null,
      setReferenceImage: (base64, name = null) =>
        set({ referenceImage: base64, referenceImageName: name }),
      imageStrength: 0.7,
      setImageStrength: (imageStrength) => set({ imageStrength }),

      // 参数
      aspectRatio: '1:1',
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      resolution: '1K',
      setResolution: (resolution) => set({ resolution }),
      count: 1,
      setCount: (count) => set({ count }),
      cfgScale: 5,
      setCfgScale: (cfgScale) => set({ cfgScale }),
      seed: undefined,
      setSeed: (seed) => set({ seed }),

      // 生成状态
      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      generatedImages: [],
      setGeneratedImages: (generatedImages) => set({ generatedImages }),
      error: null,
      setError: (error) => set({ error }),

      // 历史
      history: [],
      addHistory: (record) =>
        set((state) => {
          const newHistory = [record, ...state.history].slice(0, 20);
          saveHistory(newHistory); // 异步写入 IndexedDB，不阻塞 UI
          return { history: newHistory };
        }),
      loadHistory: (record) => {
        set({
          mode: record.mode,
          selectedModel: record.request.model,
          prompt: record.request.prompt,
          negativePrompt: record.request.negativePrompt || '',
          referenceImage: record.request.image || null,
          imageStrength: record.request.imageStrength || 0.7,
          aspectRatio: (record.request.aspectRatio as AppState['aspectRatio']) || '1:1',
          resolution: record.request.resolution || '1K',
          count: record.request.n || 1,
          cfgScale: record.request.cfgScale || 5,
          seed: record.request.seed,
          generatedImages: record.response.images,
        });
      },
      clearHistory: () => {
        clearHistoryDB();
        set({ history: [] });
      },
      deleteHistory: (ids: string[]) =>
        set((state) => {
          const newHistory = state.history.filter((r) => !ids.includes(r.id));
          deleteHistoryRecords(ids);
          saveHistory(newHistory);
          return { history: newHistory };
        }),
      initHistory: async () => {
        try {
          const records = await loadHistory();
          if (records.length > 0) {
            set({ history: records });
          }
        } catch {
          // IndexedDB 不可用，使用空历史
        }
      },

      // API 设置
      apiSettings: DEFAULT_API_SETTINGS,
      setApiSettings: (apiSettings) => set({ apiSettings }),
      isSettingsOpen: false,
      setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),

      // 预览
      previewImage: null,
      setPreviewImage: (previewImage) => set({ previewImage }),

      // 获取当前模型
      getCurrentModel: () => {
        const { selectedModel } = get();
        return MODELS.find((m) => m.id === selectedModel) || MODELS[0];
      },
    }),
    {
      name: 'image-gen-store',
      partialize: (state) => ({
        apiSettings: state.apiSettings,
        // 历史记录不持久化，base64 图片数据太大会撑爆 localStorage
      }),
      merge: (persisted, current) => {
        const oldSettings = (persisted as Partial<AppState>)?.apiSettings;
        // 迁移：旧版 localhost 代理地址清理，避免 HTTPS 页面报错
        const proxyUrl = oldSettings?.proxyUrl;
        const migratedProxyUrl = (proxyUrl === 'http://localhost:3001' || proxyUrl === 'http://localhost:3002')
          ? '' : (proxyUrl ?? DEFAULT_API_SETTINGS.proxyUrl);
        return {
          ...current,
          ...(persisted as Partial<AppState>),
          apiSettings: {
            ...DEFAULT_API_SETTINGS,
            ...(oldSettings || {}),
            proxyUrl: migratedProxyUrl,
            openai: mergeVendorConfig(DEFAULT_API_SETTINGS.openai, oldSettings?.openai),
            google: mergeVendorConfig(DEFAULT_API_SETTINGS.google, oldSettings?.google),
            doubao: mergeVendorConfig(DEFAULT_API_SETTINGS.doubao, oldSettings?.doubao),
          },
        };
      },
    }
  )
);
