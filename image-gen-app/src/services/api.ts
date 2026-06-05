import axios from 'axios';
import type { GenerateRequest, GenerateResponse, GeneratedImage, ApiSettings, AspectRatio } from '../types';
import { MODELS, getResolutionDimensions } from '../constants/models';

// ==================== 工具函数 ====================

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const raw = parts[1] || parts[0];
  const bytes = atob(raw);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

// ==================== API 调用 ====================

function buildRequestBody(req: GenerateRequest, settings: ApiSettings, dimensions: string): unknown {
  const model = MODELS.find((m) => m.id === req.model);
  const vendor = model?.vendor;

  switch (vendor) {
    case 'openai':
      return {
        model: req.model,
        prompt: req.prompt,
        n: req.n || 1,
        size: dimensions,
        ...(req.seed !== undefined && { seed: req.seed }),
      };

    case 'google': {
      const parts: Record<string, unknown>[] = [{ text: req.prompt }];
      if (req.image) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: req.image.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }
      const generationConfig: Record<string, unknown> = {};
      if (req.aspectRatio) generationConfig.aspectRatio = req.aspectRatio;
      if (req.cfgScale) generationConfig.cfgScale = req.cfgScale;
      if (req.seed !== undefined) generationConfig.seed = req.seed;
      if (req.negativePrompt) generationConfig.negativePrompt = req.negativePrompt;

      return {
        contents: [{ parts }],
        generationConfig,
      };
    }

    case 'doubao':
      return {
        model: req.model,
        prompt: req.prompt,
        size: dimensions,
        response_format: 'url',
        seed: req.seed ?? -1,
        ...(req.image && { image: req.image }),
        ...(req.cfgScale && { guidance_scale: req.cfgScale }),
        ...(req.negativePrompt && { negative_prompt: req.negativePrompt }),
      };

    default:
      return req;
  }
}

function parseResponse(
  data: unknown,
  model: string,
  vendor: string | undefined
): GeneratedImage[] {
  const d = data as Record<string, unknown>;

  switch (vendor) {
    case 'openai': {
      const items = (d.data as Array<{ url?: string; b64_json?: string }>) || [];
      return items.map((item, i) => ({
        id: `openai-${Date.now()}-${i}`,
        url: item.url || `data:image/png;base64,${item.b64_json}`,
      }));
    }

    case 'google': {
      const candidates = (d.candidates as Array<{
        content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> };
      }>) || [];
      return candidates
        .flatMap((c) => c.content?.parts || [])
        .filter((p) => p.inlineData?.data)
        .map((p, i) => ({
          id: `google-${Date.now()}-${i}`,
          url: `data:${p.inlineData!.mimeType};base64,${p.inlineData!.data}`,
        }));
    }

    case 'doubao': {
      const results = (d.data as Array<{ url?: string; b64_json?: string }>) || [];
      return results.map((item, i) => ({
        id: `doubao-${Date.now()}-${i}`,
        url: item.url || `data:image/png;base64,${item.b64_json}`,
      }));
    }

    default:
      return [];
  }
}

export async function generateImages(
  req: GenerateRequest,
  settings: ApiSettings
): Promise<GenerateResponse> {
  // 检查 API Key 是否配置
  const model = MODELS.find((m) => m.id === req.model);
  const vendor = model?.vendor;
  const vendorConfig = vendor ? settings[vendor] : null;

  if (!vendorConfig || !vendorConfig.apiKey) {
    throw new Error(
      `未配置 API Key，请前往 ⚙️ 设置 填写 ${vendor === 'openai' ? 'OpenAI' : vendor === 'google' ? 'Google Gemini' : '豆包'} 的 API Key`
    );
  }

  const dimensions = req.resolution
    ? getResolutionDimensions(req.resolution, (req.aspectRatio || '1:1') as AspectRatio)
    : '1024x1024';

  const body = buildRequestBody(req, settings, dimensions);

  const isOpenAIImageEdit = vendor === 'openai' && req.mode === 'image-to-image' && req.image;

  let endpoint = '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  switch (vendor) {
    case 'openai':
      if (isOpenAIImageEdit) {
        endpoint = `${settings.openai.baseUrl}/images/edits`;
      } else {
        endpoint = `${settings.openai.baseUrl}/images/generations`;
      }
      headers['Authorization'] = `Bearer ${settings.openai.apiKey}`;
      break;
    case 'google':
      endpoint = `${settings.google.baseUrl}/models/${req.model}:generateContent`;
      headers['x-goog-api-key'] = settings.google.apiKey;
      break;
    case 'doubao':
      endpoint = `${settings.doubao.baseUrl}/image/generate`;
      headers['Authorization'] = `Bearer ${settings.doubao.apiKey}`;
      break;
    default:
      throw new Error('未知模型厂商');
  }

  try {
    let response;
    const proxyBase = settings.useProxy ? (settings.proxyUrl || '') : '';
    if (isOpenAIImageEdit) {
      // OpenAI 图生图使用 multipart/form-data，base64 转 Blob 构建 FormData
      const formData = new FormData();
      formData.append('image', base64ToBlob(req.image!), 'image.png');
      formData.append('prompt', req.prompt);
      if (req.model) formData.append('model', req.model);
      if (dimensions) formData.append('size', dimensions);
      if (req.n) formData.append('n', String(req.n));

      if (settings.useProxy) {
        // 通过代理转发（proxyUrl 为空则用相对路径，适配生产环境 Nginx 同域代理）
        response = await axios.post(
          `${proxyBase}/api/proxy`,
          {
            url: endpoint,
            method: 'POST',
            headers: { Authorization: headers['Authorization'] },
            formData: {
              image: req.image,
              prompt: req.prompt,
              model: req.model,
              size: dimensions,
              ...(req.n ? { n: String(req.n) } : {}),
            },
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 600000 }
        );
      } else {
        response = await axios.post(endpoint, formData, {
          headers: { Authorization: headers['Authorization'] },
          timeout: 600000,
        });
      }
    } else if (settings.useProxy) {
      response = await axios.post(
        `${proxyBase}/api/proxy`,
        { url: endpoint, method: 'POST', headers, body },
        { headers: { 'Content-Type': 'application/json' }, timeout: 600000 }
      );
    } else {
      response = await axios.post(endpoint, body, { headers, timeout: 600000 });
    }
    const images = parseResponse(response.data, req.model, vendor);
    return { images, model: req.model, mode: req.mode };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        if (err.code === 'ECONNABORTED') {
          throw new Error('请求超时，复杂图片生成可能需要较长时间（最长 10 分钟），请重试');
        }
        throw new Error(
          `网络连接失败，无法访问 API 服务器。\n请检查：\n1. 网络连接是否正常\n2. Base URL 是否正确\n3. 是否开启了代理模式（⚙️ 设置 → 🔄 代理模式）`
        );
      }
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.error?.code ||
        `HTTP ${err.response.status}`;
      throw new Error(`API 请求失败: ${msg}`);
    }
    throw err;
  }
}

// ==================== 测试连接 ====================

export async function testConnection(
  vendor: 'openai' | 'google' | 'doubao',
  settings: ApiSettings
): Promise<{ success: boolean; message: string }> {
  const config = settings[vendor];
  if (!config.apiKey) {
    return { success: false, message: '请先填写 API Key' };
  }

  try {
    switch (vendor) {
      case 'openai': {
        const res = await axios.get(`${config.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          timeout: 10000,
        });
        return { success: res.status === 200, message: '✅ 连接成功' };
      }
      case 'google': {
        const res = await axios.get(
          `${config.baseUrl}/models?key=${config.apiKey}`,
          { timeout: 10000 }
        );
        return { success: res.status === 200, message: '✅ 连接成功' };
      }
      case 'doubao': {
        const res = await axios.get(`${config.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          timeout: 10000,
        });
        return { success: res.status === 200, message: '✅ 连接成功' };
      }
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        return { success: false, message: '❌ 网络连接失败，请检查 Base URL 和网络' };
      }
      return {
        success: false,
        message: `❌ 连接失败: ${err.response?.data?.error?.message || err.message}`,
      };
    }
    return { success: false, message: '❌ 连接失败: 未知错误' };
  }
}

// ==================== 图片下载 ====================

export async function downloadImage(url: string, filename: string): Promise<void> {
  const { saveAs } = await import('file-saver');

  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1];
    const byteChars = atob(base64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    const byteArr = new Uint8Array(byteNums);
    const blob = new Blob([byteArr], { type: 'image/png' });
    saveAs(blob, filename);
  } else {
    const response = await axios.get(url, { responseType: 'blob' });
    saveAs(response.data, filename);
  }
}

// ==================== 复制到剪贴板 ====================

export async function copyImageToClipboard(url: string): Promise<void> {
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1];
    const byteChars = atob(base64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNums)], { type: 'image/png' });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } else {
    const response = await axios.get(url, { responseType: 'blob' });
    const blob = response.data;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  }
}
