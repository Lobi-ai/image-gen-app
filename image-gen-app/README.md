# AI 图像生成工具

多模型 AI 图像生成 Web 应用，支持文生图和图生图。

## 功能特性

- **多模型支持**：OpenAI GPT-Image-2、Google Gemini、豆包 Seedream
- **文生图 / 图生图**：文本生成图片，或上传参考图引导生成
- **可调参数**：宽高比、分辨率、生成数量、CFG Scale、种子值
- **历史记录**：IndexedDB 持久化，右侧面板展示，支持勾选批量删除
- **代理模式**：内置 Express 代理服务，解决 CORS 跨域问题，支持中转站 API
- **自定义 API**：支持配置自定义 Base URL 和 API Key，适配各类中转站

## 快速开始

### 1. 安装依赖

```bash
cd image-gen-app
npm install
```

### 2. 启动代理服务器（推荐）

代理服务器用于解决浏览器 CORS 跨域限制，让前端可以请求任意 API 地址。

```bash
cd server
npm install
npm run dev        # 默认监听 http://localhost:3002
```

### 3. 启动前端

```bash
# 回到项目根目录
cd ..
npm run dev        # 默认监听 http://localhost:3001
```

### 4. 配置 API

打开 `http://localhost:3001`，点击右上角齿轮图标进入设置：

1. 确认 **代理模式** 已开启（默认开启，代理地址 `http://localhost:3002`）
2. 在对应厂商配置中填入你的 **API Key** 和 **Base URL**
3. 选择模型，输入提示词，点击生成

## 部署

### 环境要求

- **Node.js 18+**（推荐 20 LTS）
- 代理服务需要 Node.js 运行时环境

### 方式一：直接运行（最简单）

```bash
git clone https://github.com/Lobi-ai/image-gen-app.git
cd image-gen-app

# 构建前端
npm install
npm run build

# 启动静态文件服务
npx serve dist -l 3001

# 另开终端，启动代理服务
cd server
npm install
npm start              # 端口 3002
```

### 方式二：Nginx + PM2（推荐生产环境）

适合自有服务器、有域名的场景。

```bash
# 1. 克隆并构建前端
git clone https://github.com/Lobi-ai/image-gen-app.git
cd image-gen-app
npm install && npm run build

# 2. 部署静态文件到 Nginx
sudo cp -r dist /var/www/image-gen
sudo tee /etc/nginx/sites-available/image-gen << 'NGINX'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/image-gen;
        index index.html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3002;
    }
}
NGINX
sudo ln -s /etc/nginx/sites-available/image-gen /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. 代理服务用 PM2 守护
cd server
npm install
npm install -g pm2
pm2 start index.js --name image-gen-proxy
pm2 save && pm2 startup
```

### 方式三：Docker

```bash
# 先构建前端
npm install && npm run build

# 构建镜像
cat > Dockerfile << 'DOCKER'
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --production
COPY server/ ./server/
COPY dist/ ./dist/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD cd /app/server && node index.js
DOCKER

docker build -t image-gen-app .
docker run -d -p 80:80 --name image-gen image-gen-app
```

### 方式四：Docker Compose（Nginx + 代理服务）

```yaml
# docker-compose.yml
services:
  proxy:
    image: node:20-alpine
    working_dir: /app/server
    command: node index.js
    volumes:
      - ./server:/app/server
    ports:
      - "3002:3002"
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: always
```

```bash
npm run build
docker compose up -d
```

### 方式五：Vercel / Cloudflare Pages（仅前端）

前端静态文件可直接部署到 Vercel，代理服务仍需自建。

```bash
npm install -g vercel
vercel --prod
```

代理服务需额外部署在 VPS 上，前端设置中将代理地址指向 VPS 的代理服务地址。

### 环境变量

所有 API Key 均可在应用内设置面板直接配置，无需环境变量。

前端（可选）：
```env
VITE_OPENAI_API_KEY=
VITE_GOOGLE_API_KEY=
VITE_DOUBAO_API_KEY=
```

代理服务器（可选）：
```env
PORT=3002
OPENAI_API_KEY=
GOOGLE_API_KEY=
DOUBAO_API_KEY=
```

## 项目结构

```
image-gen-app/
├── index.html                  # HTML 入口
├── package.json                # 前端依赖
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # TailwindCSS 主题
├── tsconfig.json               # TypeScript 配置
├── public/
│   └── favicon.svg             # 网站图标
├── src/
│   ├── main.tsx                # React 入口
│   ├── App.tsx                 # 根组件
│   ├── index.css               # 全局样式
│   ├── components/
│   │   ├── DynamicParams.tsx   # 动态参数面板
│   │   ├── GenerateButton.tsx  # 生成按钮
│   │   ├── HistoryBar.tsx      # 右侧历史面板
│   │   ├── ImageCard.tsx       # 图片卡片
│   │   ├── ImageGrid.tsx       # 图片网格展示
│   │   ├── ImagePreview.tsx    # 全屏预览
│   │   ├── ImageUpload.tsx     # 图片上传
│   │   ├── ModeTabs.tsx        # 文生图/图生图切换
│   │   ├── ModelSelector.tsx   # 模型选择器
│   │   ├── PromptInput.tsx     # 提示词输入
│   │   └── SettingsModal.tsx   # 设置弹窗
│   ├── constants/
│   │   └── models.ts           # 模型定义和分辨率配置
│   ├── services/
│   │   ├── api.ts              # API 调用层
│   │   └── storage.ts          # IndexedDB 存储
│   ├── store/
│   │   └── useStore.ts         # Zustand 全局状态
│   ├── types/
│   │   └── index.ts            # TypeScript 类型
│   └── utils/
│       └── index.ts            # 工具函数
└── server/
    ├── package.json            # 服务端依赖
    ├── index.js                # Express 代理服务器
    └── .env.example            # 环境变量模板
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 样式 | TailwindCSS 3 |
| 动画 | Framer Motion 11 |
| 状态管理 | Zustand 4.5 |
| HTTP | Axios |
| 存储 | IndexedDB (历史) + localStorage (设置) |
| 代理服务 | Express 4 |

## API Key 获取

- [OpenAI](https://platform.openai.com/api-keys)
- [Google Gemini](https://aistudio.google.com/apikey)
- [豆包/火山引擎](https://console.volcengine.com/ark)

## License

MIT
