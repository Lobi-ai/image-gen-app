// ==================== 模型定义 ====================

export type Vendor = 'openai' | 'google' | 'doubao';

export type GenerationMode = 'text-to-image' | 'image-to-image';

export interface ModelInfo {
  id: string;
  displayName: string;
  vendor: Vendor;
  supports: {
    aspectRatio: boolean;
    resolution: boolean;
    resolutionOptions?: ResolutionOption[];
    n: boolean;              // 生成数量 1-8
    negativePrompt: boolean;
    cfgScale: boolean;       // 引导强度 1-10
    seed: boolean;
  };
}

export interface ResolutionOption {
  label: string;
  value: string;
  dimensions: string;  // "1024x1024"
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// ==================== API 配置 ====================

export interface SavedBaseUrl {
  name: string;
  url: string;
}

export interface VendorConfig {
  apiKey: string;
  baseUrl: string;
  savedBaseUrls: SavedBaseUrl[];
}

export interface ApiSettings {
  openai: VendorConfig;
  google: VendorConfig;
  doubao: VendorConfig;
  useProxy: boolean;
  proxyUrl: string;
}

// ==================== 生成请求/响应 ====================

export interface GenerateRequest {
  model: string;
  mode: GenerationMode;
  prompt: string;
  image?: string;          // base64 或 File
  imageStrength?: number;  // 0-1
  aspectRatio?: string;    // "16:9"
  resolution?: string;     // "2K" 或 "1024x1024"
  n?: number;              // 仅 OpenAI
  negativePrompt?: string; // 仅 Gemini/豆包
  cfgScale?: number;       // 仅 Gemini/豆包，1-10
  seed?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  base64?: string;
}

export interface GenerateResponse {
  images: GeneratedImage[];
  model: string;
  mode: GenerationMode;
}

// ==================== 生成历史 ====================

export interface HistoryRecord {
  id: string;
  timestamp: number;
  model: string;
  modelDisplayName: string;
  prompt: string;
  mode: GenerationMode;
  thumbnails: string[];    // base64 缩略图
  request: GenerateRequest;
  response: GenerateResponse;
}

// ==================== 应用状态 ====================

export interface AppState {
  // 模式
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;

  // 模型
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;

  // 提示词
  prompt: string;
  setPrompt: (prompt: string) => void;
  negativePrompt: string;
  setNegativePrompt: (prompt: string) => void;

  // 图生图
  referenceImage: string | null;   // base64
  referenceImageName: string | null;
  setReferenceImage: (base64: string | null, name?: string | null) => void;
  imageStrength: number;
  setImageStrength: (val: number) => void;

  // 参数
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  resolution: string;
  setResolution: (res: string) => void;
  count: number;
  setCount: (n: number) => void;
  cfgScale: number;
  setCfgScale: (val: number) => void;
  seed: number | undefined;
  setSeed: (seed: number | undefined) => void;

  // 生成
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  generatedImages: GeneratedImage[];
  setGeneratedImages: (imgs: GeneratedImage[]) => void;
  error: string | null;
  setError: (err: string | null) => void;

  // 历史
  history: HistoryRecord[];
  addHistory: (record: HistoryRecord) => void;
  loadHistory: (record: HistoryRecord) => void;
  clearHistory: () => void;
  deleteHistory: (ids: string[]) => void;
  initHistory: () => Promise<void>;

  // API 设置
  apiSettings: ApiSettings;
  setApiSettings: (settings: ApiSettings) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // 预览
  previewImage: GeneratedImage | null;
  setPreviewImage: (img: GeneratedImage | null) => void;

  // 获取当前模型信息
  getCurrentModel: () => ModelInfo;
}
