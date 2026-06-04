/**
 * AI 图像生成代理服务器
 * 用于保护 API Key，避免在前端直接暴露
 *
 * 使用方法：
 * 1. 复制 .env.example 为 .env 并填写 API Key
 * 2. npm install && npm start
 * 3. 前端设置中将 Base URL 改为 http://localhost:3001
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3002;

// ==================== OpenAI 代理 ====================

app.post('/api/openai/images/generations', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      return res.status(401).json({ error: { message: '未配置 OPENAI_API_KEY' } });
    }

    const response = await axios.post(`${baseUrl}/images/generations`, req.body, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 600000,
    });

    res.json(response.data);
  } catch (err) {
    handleError(err, res);
  }
});

// ==================== Google Gemini 代理 ====================

app.post('/api/google/models/:model', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const baseUrl = process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
    const { model } = req.params;

    if (!apiKey) {
      return res.status(401).json({ error: { message: '未配置 GOOGLE_API_KEY' } });
    }

    const response = await axios.post(
      `${baseUrl}/models/${model}:generateContent`,
      req.body,
      {
        headers: { 'Content-Type': 'application/json' },
        params: { key: apiKey },
        timeout: 600000,
      }
    );

    res.json(response.data);
  } catch (err) {
    handleError(err, res);
  }
});

// ==================== 豆包代理 ====================

app.post('/api/doubao/contents/generations/tasks', async (req, res) => {
  try {
    const apiKey = process.env.DOUBAO_API_KEY;
    const baseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';

    if (!apiKey) {
      return res.status(401).json({ error: { message: '未配置 DOUBAO_API_KEY' } });
    }

    const response = await axios.post(
      `${baseUrl}/contents/generations/tasks`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 600000,
      }
    );

    res.json(response.data);
  } catch (err) {
    handleError(err, res);
  }
});

// ==================== 图片上传代理（避免跨域问题） ====================

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  const base64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype;
  res.json({
    dataUrl: `data:${mimeType};base64,${base64}`,
    filename: req.file.originalname,
    size: req.file.size,
  });
});

// ==================== 通用透传代理（使用前端配置的 Key 和 URL） ====================

app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method, headers, body, formData } = req.body;

    if (!url) {
      return res.status(400).json({ error: { message: '缺少 url 参数' } });
    }

    let data = body;
    let reqHeaders = headers || {};

    // 处理 multipart/form-data（OpenAI 图生图）
    if (formData) {
      const FormData = (await import('form-data')).default;
      const fd = new FormData();
      for (const [key, value] of Object.entries(formData)) {
        if (value && typeof value === 'string' && value.startsWith('data:')) {
          // base64 图片 → Buffer
          const [meta, b64] = value.split(',');
          const mime = meta.match(/:(.*?);/)?.[1] || 'image/png';
          const buf = Buffer.from(b64, 'base64');
          fd.append(key, buf, { filename: 'image.png', contentType: mime });
        } else {
          fd.append(key, String(value));
        }
      }
      data = fd;
      reqHeaders = { ...reqHeaders, ...fd.getHeaders() };
    }

    const response = await axios({
      url,
      method: method || 'POST',
      headers: reqHeaders,
      data,
      timeout: 600000,
    });

    res.json(response.data);
  } catch (err) {
    handleError(err, res);
  }
});

// ==================== 根路由 ====================

app.get('/', (_req, res) => {
  res.json({
    name: 'AI 图像生成代理服务器',
    status: 'running',
    health: '/api/health',
  });
});

// ==================== 健康检查 ====================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    configured: {
      openai: !!process.env.OPENAI_API_KEY,
      google: !!process.env.GOOGLE_API_KEY,
      doubao: !!process.env.DOUBAO_API_KEY,
    },
  });
});

// ==================== 错误处理 ====================

function handleError(err, res) {
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }
  if (err.code === 'ECONNABORTED') {
    return res.status(504).json({ error: { message: '请求超时' } });
  }
  res.status(500).json({ error: { message: err.message } });
}

app.listen(PORT, () => {
  console.log(`🚀 代理服务器已启动: http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/api/health`);
});
