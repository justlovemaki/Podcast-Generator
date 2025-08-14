# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

### Python 后端播客生成器

*   **生成播客**:
    ```bash
    python podcast_generator.py [可选参数]
    ```
    可选参数包括：
    *   `--api-key <YOUR_OPENAI_API_KEY>`: OpenAI API 密钥。
    *   `--base-url <YOUR_OPENAI_BASE_URL>`: OpenAI API 代理地址。
    *   `--model <OPENAI_MODEL_NAME>`: 使用的 OpenAI 模型，默认为 `gpt-3.5-turbo`。
    *   `--threads <NUMBER_OF_THREADS>`: 生成音频的并行线程数，默认为 `1`。

    **示例**:
    ```bash
    python podcast_generator.py --api-key sk-xxxxxx --model gpt-4o --threads 4
    ```

*   **启动 FastAPI Web 服务**:
    ```bash
    python main.py
    ```
    默认在 `http://localhost:8000` 启动，提供 REST API 接口。

*   **检查 TTS 语音列表**:
    ```bash
    python check/check_edgetts_voices.py
    python check/check_indextts_voices.py
    # 其他 TTS 服务检查脚本...
    ```

### Next.js Web 应用 (web/ 目录)

*   **开发模式**:
    ```bash
    cd web
    npm run dev
    ```
    在 `http://localhost:3000` 启动开发服务器。

*   **构建生产版本**:
    ```bash
    cd web
    npm run build
    ```

*   **启动生产服务器**:
    ```bash
    cd web
    npm run start
    ```

*   **类型检查**:
    ```bash
    cd web
    npm run type-check
    ```

*   **代码检查**:
    ```bash
    cd web
    npm run lint
    ```

*   **安装依赖**:
    ```bash
    cd web
    npm install
    ```

## 高层代码架构

本项目是一个全栈播客生成器，包含 Python 后端和 Next.js Web 前端，核心功能是利用 AI 生成播客脚本并将其转换为音频。

### Python 后端架构

*   **`podcast_generator.py`**: 主运行脚本，负责协调整个播客生成流程，包括：
    *   读取配置文件 (`config/*.json`)。
    *   读取输入文件 (`input.txt`) 和 AI 提示词文件 (`prompt/*.txt`)。
    *   调用 OpenAI API 生成播客大纲和详细脚本。
    *   调用配置的 TTS 服务生成音频。
    *   使用 FFmpeg 合并生成的音频文件。
    *   支持命令行参数配置 OpenAI API 和线程数。

*   **`main.py`**: FastAPI Web 服务，提供 REST API 接口：
    *   `/generate-podcast`: 启动播客生成任务
    *   `/podcast-status`: 查询生成进度
    *   `/download-podcast/`: 下载生成的音频文件
    *   `/get-voices`: 获取可用的 TTS 语音列表

*   **`tts_adapters.py`**: TTS 服务适配器，统一处理不同 TTS 服务的 API 调用。

*   **`openai_cli.py`**: 负责与 OpenAI API 进行交互的模块。

*   **`config/`**: 存放 TTS 服务和播客角色配置的 JSON 文件。例如 `edge-tts.json`。这些文件定义了 `podUsers` (播客角色)、`voices` (可用语音) 和 `apiUrl` (TTS 服务接口)。

*   **`prompt/`**: 包含用于指导 AI 生成内容的提示词文件。
    *   `prompt-overview.txt`: 用于生成播客整体大纲。
    *   `prompt-podscript.txt`: 用于生成详细对话脚本，包含占位符 (`{{numSpeakers}}`, `{{turnPattern}}`)。

*   **`check/`**: TTS 服务语音列表检查脚本，用于验证各种 TTS 服务的可用语音。

### Next.js Web 前端架构 (web/ 目录)

*   **技术栈**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion

*   **`src/app/`**: Next.js App Router 页面和 API 路由
    *   `api/generate-podcast/route.ts`: 播客生成 API，与 Python 后端集成
    *   `api/audio/[filename]/route.ts`: 音频文件服务 API
    *   `api/config/route.ts`: 配置管理 API
    *   `api/tts-voices/route.ts`: TTS 语音列表 API

*   **`src/components/`**: React 组件
    *   `PodcastCreator.tsx`: 播客创建器主组件
    *   `AudioPlayer.tsx`: 音频播放器组件
    *   `ProgressModal.tsx`: 生成进度显示模态框
    *   `ConfigSelector.tsx`: TTS 配置选择器
    *   `VoicesModal.tsx`: 语音选择模态框

*   **`src/types/`**: TypeScript 类型定义，定义了播客生成请求/响应的数据结构

*   **集成方式**: Web 应用通过 Node.js 子进程启动 Python 脚本，实时监控生成进度，并提供音频文件访问服务。

### TTS 服务集成

项目设计为高度灵活，支持多种 TTS 服务：
*   **本地服务**: Index-TTS, Edge-TTS
*   **网络服务**: 豆包 (Doubao), Minimax, Fish Audio, Gemini TTS
*   **配置方式**: 通过 `config/*.json` 中的 `apiUrl` 进行配置

### 音频处理

使用 FFmpeg 工具将各个角色的语音片段拼接成一个完整的播客音频文件。FFmpeg 必须安装并配置在系统环境变量中。
