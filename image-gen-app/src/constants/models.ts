import type { ModelInfo, AspectRatio, ResolutionOption } from '../types';

// ==================== 宽高比选项 ====================

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 方形' },
  { value: '16:9', label: '16:9 横屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

// ==================== 分辨率选项（按模型） ====================

export const OPENAI_RESOLUTIONS: ResolutionOption[] = [
  { label: '1024x1024 (1K)', value: '1024x1024', dimensions: '1024x1024' },
  { label: '1344x768 (16:9)', value: '1344x768', dimensions: '1344x768' },
  { label: '768x1344 (9:16)', value: '768x1344', dimensions: '768x1344' },
  { label: '1536x1536 (1.5K)', value: '1536x1536', dimensions: '1536x1536' },
  { label: '1792x1024 (16:9宽幅)', value: '1792x1024', dimensions: '1792x1024' },
  { label: '1024x1792 (9:16竖幅)', value: '1024x1792', dimensions: '1024x1792' },
];

export const GEMINI_3PRO_RESOLUTIONS: ResolutionOption[] = [
  { label: '1K (1024)', value: '1K', dimensions: '1024x1024' },
  { label: '2K (2048)', value: '2K', dimensions: '2048x2048' },
  { label: '4K (4096)', value: '4K', dimensions: '4096x4096' },
];

export const DOUBAO_RESOLUTIONS: ResolutionOption[] = [
  { label: '标准 (1K)', value: '1K', dimensions: '1024x1024' },
  { label: '高清 (2K)', value: '2K', dimensions: '2048x2048' },
  { label: '超清 (4K)', value: '4K', dimensions: '4096x4096' },
];

export const DOUBAO_4_5_RESOLUTIONS: ResolutionOption[] = [
  { label: '高清 (2K)', value: '2K', dimensions: '2048x2048' },
  { label: '超清 (4K)', value: '4K', dimensions: '4096x4096' },
];

// ==================== 模型列表 ====================

export const MODELS: ModelInfo[] = [
  {
    id: 'gpt-image-2',
    displayName: 'OpenAI Images 2.0',
    vendor: 'openai',
    supports: {
      aspectRatio: true,
      resolution: true,
      resolutionOptions: OPENAI_RESOLUTIONS,
      n: true,
      negativePrompt: false,
      cfgScale: false,
      seed: true,
    },
  },
  {
    id: 'gemini-2.5-flash-image',
    displayName: 'Gemini 2.5 Flash',
    vendor: 'google',
    supports: {
      aspectRatio: true,
      resolution: false,     // 固定1K，不显示分辨率控件
      n: false,
      negativePrompt: true,
      cfgScale: true,
      seed: true,
    },
  },
  {
    id: 'gemini-3-pro-image-preview',
    displayName: 'Gemini 3 Pro (预览)',
    vendor: 'google',
    supports: {
      aspectRatio: true,
      resolution: true,
      resolutionOptions: GEMINI_3PRO_RESOLUTIONS,
      n: false,
      negativePrompt: true,
      cfgScale: true,
      seed: true,
    },
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    displayName: 'Gemini 3.1 Flash (预览)',
    vendor: 'google',
    supports: {
      aspectRatio: true,
      resolution: false,     // 固定1K，不显示分辨率控件
      n: false,
      negativePrompt: true,
      cfgScale: true,
      seed: true,
    },
  },
  {
    id: 'doubao-seedream-4-0-250828',
    displayName: '豆包 Seedream 4.0',
    vendor: 'doubao',
    supports: {
      aspectRatio: true,
      resolution: true,
      resolutionOptions: DOUBAO_RESOLUTIONS,
      n: false,
      negativePrompt: true,
      cfgScale: true,
      seed: true,
    },
  },
  {
    id: 'doubao-seedream-4-5-251128',
    displayName: '豆包 Seedream 4.5',
    vendor: 'doubao',
    supports: {
      aspectRatio: true,
      resolution: true,
      resolutionOptions: DOUBAO_4_5_RESOLUTIONS,
      n: false,
      negativePrompt: true,
      cfgScale: true,
      seed: true,
    },
  },
];

// ==================== 默认 API 设置 ====================

export const DEFAULT_API_SETTINGS = {
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
  },
  google: {
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  doubao: {
    apiKey: '',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  useProxy: true,
  proxyUrl: 'http://localhost:3002',
};

// ==================== 厂商标签颜色 ====================

export const VENDOR_COLORS: Record<string, string> = {
  openai: '#10A37F',
  google: '#4285F4',
  doubao: '#FF6B35',
};

export const VENDOR_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  google: 'Google Gemini',
  doubao: '豆包',
};

// ==================== 分辨率与宽高比联动计算 ====================

export function getResolutionDimensions(
  resolution: string,
  aspectRatio: AspectRatio
): string {
  // 如果 resolution 已经是具体尺寸（如 "1024x1024"），直接返回
  if (/^\d+x\d+$/.test(resolution)) {
    return resolution;
  }

  // K 级别分辨率
  const baseSize: Record<string, number> = {
    '1K': 1024,
    '2K': 2048,
    '4K': 4096,
  };

  const maxSide = baseSize[resolution] || 1024;

  const ratios: Record<AspectRatio, [number, number]> = {
    '1:1': [1, 1],
    '16:9': [16, 9],
    '9:16': [9, 16],
    '4:3': [4, 3],
    '3:4': [3, 4],
  };

  const [w, h] = ratios[aspectRatio] || ratios['1:1'];
  const scale = maxSide / Math.max(w, h);
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);

  return `${width}x${height}`;
}
