# PodcastHub Web Application

一个现代化的播客生成Web应用，基于Next.js构建，集成了现有的Python播客生成器。

## 功能特性

- 🎙️ **AI播客生成**: 使用OpenAI API生成高质量播客内容
- 🎵 **多TTS支持**: 支持多种文本转语音服务
- 🎨 **现代化UI**: 基于Tailwind CSS的响应式设计
- 📱 **移动端友好**: 完全响应式的用户界面
- 🔄 **实时进度**: 实时显示播客生成进度
- 🎧 **内置播放器**: 支持音频播放、下载和分享
- 📚 **内容管理**: 播客库和探索功能

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **动画**: Framer Motion
- **后端集成**: Python播客生成器

## 项目结构

```
web2/
├── src/
│   ├── app/                 # Next.js App Router页面
│   │   ├── api/            # API路由
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 主页
│   ├── components/         # React组件
│   │   ├── Sidebar.tsx     # 侧边栏导航
│   │   ├── PodcastCreator.tsx  # 播客创建器
│   │   ├── PodcastCard.tsx     # 播客卡片
│   │   ├── ContentSection.tsx  # 内容展示区
│   │   ├── AudioPlayer.tsx     # 音频播放器
│   │   └── ProgressModal.tsx   # 进度模态框
│   ├── lib/                # 工具函数
│   ├── types/              # TypeScript类型定义
│   └── hooks/              # 自定义Hooks
├── public/                 # 静态资源
├── package.json           # 项目依赖
├── tailwind.config.js     # Tailwind配置
├── tsconfig.json          # TypeScript配置
└── next.config.js         # Next.js配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置必要的环境变量：

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

## API集成

### 播客生成API

- **POST** `/api/generate-podcast` - 启动播客生成任务
- **GET** `/api/generate-podcast?id={taskId}` - 查询生成进度

### 音频服务API

- **GET** `/api/audio/{filename}` - 获取音频文件（支持流式播放）

## 与Python后端集成

Web应用通过以下方式与现有Python播客生成器集成：

1. **输入处理**: 将用户输入写入 `../input.txt`
2. **进程管理**: 使用Node.js子进程启动Python脚本
3. **进度监控**: 解析Python脚本输出来更新进度
4. **文件服务**: 提供生成的音频文件访问

## 开发指南

### 组件开发

所有组件都使用TypeScript编写，遵循以下原则：

- 使用函数式组件和Hooks
- 严格的类型定义
- 响应式设计优先
- 性能优化（memo、useMemo等）

### 样式规范

- 使用Tailwind CSS工具类
- 遵循设计系统的颜色和间距
- 支持深色模式（预留）
- 移动端优先的响应式设计

### 性能优化

- 使用Next.js Image组件优化图片
- 代码分割和懒加载
- 服务端组件优先
- 音频流式播放支持

## 部署

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

### 类型检查

```bash
npm run type-check
```

### 代码检查

```bash
npm run lint
```

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。