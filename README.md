# 🎙️ 播客生成器 (Podcast Generator)

> 轻松将您的想法，一键生成为生动有趣的多人对话播客！
> [English Version](README_EN.md) [语音介绍](https://podcasts.hubtoday.app/podcast/podcasthub.mp3) [视频介绍](https://podcasts.hubtoday.app/podcast/podcasthub.mp4)

这是一个强大的脚本工具，它利用 **OpenAI API** 的智慧生成富有洞察力的播客脚本，并通过 **TTS (Text-to-Speech)** API服务，将冰冷的文字转化为有温度的音频。您只需提供一个主题，剩下的交给它！

✨ 本项目的播客脚本生成逻辑深受 [SurfSense](https://github.com/MODSetter/SurfSense) 项目的启发，在此向其开源贡献表示衷心感谢！

---

<audio src="https://podcasts.hubtoday.app/podcast/podcasthub.mp3" />



## ✨ 核心亮点

*   **AI驱动脚本**：AI为你创作有深度、高质量的播客对话。
*   **多角色配音**：自由设定多个角色，并为每个角色匹配专属声音。
*   **开放语音接口**：轻松接入你自建或第三方的语音服务。
*   **智能音频合成**：自动拼接对话，调整音量语速，一键生成完整播客。
*   **命令行控制**：为开发者提供命令行工具，精准控制生成过程。
*   **商业化就绪**：提供简洁美观的Web界面，内置用户积分，接上支付即可运营。

---

## 🚀 开发计划

我们一直在积极地规划和开发新功能，以使播客生成器更加强大和易用。以下是我们正在酝酿的一些激动人心的更新：

*   **📖 全新故事模式**: 引入创新的故事模式，让您不仅能生成对话式播客，更能一键创作引人入胜的单人或多人叙事音频故事。
*   **🎨 沉浸式黑暗主题**: 为 Web 应用提供优雅的黑暗主题选项，优化夜间使用体验，减轻眼部疲劳。
*   **☁️ 云端数据同步**: 集成云数据库，实现用户数据和播客历史的云端存储与多设备同步，确保您的创作永不丢失。
*   **🗄️ 音频云存储 (OSS)**: 对接主流对象存储服务（OSS），为生成的音频文件提供更稳定、高效的存储与分发，方便随时随地访问和分享。
*   **💳 支付系统集成**: 无缝接入主流支付网关，完善用户体系的计费与订阅功能，为项目的商业化运营提供支持。

---

### 🐳 Docker 部署

本项目支持通过 Docker 进行部署，详细信息请参考 [Docker 使用指南](DOCKER_USAGE.md)。
  
---

## 🛠️ 安装指南

### 📝 前提条件

1.  **Python 3.x**
    *   请确保您的系统中已安装 Python 3。

2.  **FFmpeg**
    *   本项目依赖 FFmpeg 进行音频合并。请访问 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载并安装。
    *   **重要提示**: 安装完成后，请确保 `ffmpeg` 命令已添加到您系统的环境变量 (PATH) 中，以便脚本可以正常调用。

### 🐍 Python 依赖

打开您的终端或命令提示符，使用 pip 安装所需的 Python 库：
```bash
pip install requests openai pydub msgpack
```

> **依赖说明**:
> - `requests`: 用于向TTS服务API发送HTTP请求
> - `openai`: 用于与OpenAI API交互，生成播客脚本
> - `pydub`: 用于音频处理，如调整音量和语速
> - `msgpack`: 用于与某些TTS服务（如Fish Audio）进行高效的数据序列化

---

## 🚀 快速开始

### 1. 准备输入文件

在运行前，请确保以下文件已准备就绪：

*   `input.txt`: 在此文件中输入您想讨论的**播客主题**或核心观点。
*   `prompt/prompt-overview.txt`: 用于指导 AI 生成播客**整体大纲**的系统提示。
*   `prompt/prompt-podscript.txt`: 用于指导 AI 生成**详细对话脚本**的系统提示。它包含动态占位符（如 `{{numSpeakers}}`, `{{turnPattern}}`），脚本会自动替换。

### 2. 配置 TTS 服务与角色

*   `config/` 目录下存放您的 TTS 配置文件（例如 `edge-tts.json`）。该文件定义了 TTS 服务的 API 接口、播客角色 (`podUsers`) 及其对应的语音 (`voices`)。

### 3. 运行脚本

在项目根目录下执行以下命令：

```bash
python podcast_generator.py [可选参数]
```

#### **可选参数**

*   `--api-key <YOUR_OPENAI_API_KEY>`: 您的 OpenAI API 密钥。若不提供，将从配置文件或 `OPENAI_API_KEY` 环境变量中读取。
*   `--base-url <YOUR_OPENAI_BASE_URL>`: OpenAI API 的代理地址。若不提供，将从配置文件或 `OPENAI_BASE_URL` 环境变量中读取。
*   `--model <OPENAI_MODEL_NAME>`: 指定使用的 OpenAI 模型（如 `gpt-4o`, `gpt-4-turbo`）。默认值为 `gpt-3.5-turbo`。
*   `--threads <NUMBER_OF_THREADS>`: 指定生成音频的并行线程数（默认为 `1`），提高处理速度。
*   `--output-language <LANGUAGE_CODE>`: 指定播客脚本的输出语言（默认为 `Chinese`）。
*   `--usetime <TIME_DURATION>`: 指定播客脚本的时间长度（默认为 `10 minutes`）。

#### **运行示例**

```bash
# 使用 gpt-4o 模型、edge-tts 服务和 4 个线程来生成播客
python podcast_generator.py --api-key sk-xxxxxx --model gpt-4o --tts-provider edge --threads 4
```

### 5. 使用 Web API (main.py)

本项目还提供了一个基于 FastAPI 的 Web 服务，允许您通过 HTTP 请求生成播客。

#### 启动 Web 服务

```bash
python main.py
```

默认情况下，服务将在 `http://localhost:8000` 上运行。

#### API 端点

1. **生成播客** - `POST /generate-podcast`
   - 参数:
     - `api_key`: OpenAI API 密钥
     - `base_url`: OpenAI API 基础 URL (可选)
     - `model`: OpenAI 模型名称 (可选)
     - `input_txt_content`: 输入文本内容
     - `tts_providers_config_content`: TTS 提供商配置内容
     - `podUsers_json_content`: 播客用户 JSON 配置
     - `threads`: 线程数 (可选，默认为 1)
     - `tts_provider`: TTS 提供商名称 (可选，默认为 "index-tts")

2. **获取播客生成状态** - `GET /podcast-status`
   - 需要提供 `X-Auth-Id` 头部

3. **下载播客** - `GET /download-podcast/`
   - 参数:
     - `file_name`: 要下载的文件名

4. **获取语音列表** - `GET /get-voices`
   - 参数:
     - `tts_provider`: TTS 提供商名称 (可选，默认为 "tts")

#### API 使用示例

```bash
# 启动服务后，使用 curl 发送请求生成播客
curl -X POST "http://localhost:8000/generate-podcast" \
  -H "X-Auth-Id: your-auth-id" \
  -F "api_key=sk-xxxxxx" \
  -F "model=gpt-4o" \
  -F "input_txt_content=人工智能的未来发展" \
  -F "tts_providers_config_content={\"index\": {\"api_key\": \"your-api-key\"}}" \
  -F "podUsers_json_content=[{\"code\":\"zh-CN-XiaoxiaoNeural\",\"role\":\"主持人\"}],\"voices\":[{\"name\":\"Xiaoxiao\",\"code\":\"zh-CN-XiaoxiaoNeural\"}]" \
  -F "threads=4" \
  -F "tts_provider=index-tts"
```

### 4. 自定义 AI 提示词 (`custom` 代码块)

为了提供更细致的 AI 指令或添加特定上下文，您可以在 `input.txt` 文件中嵌入 `custom` 代码块。此代码块中的内容将作为额外指示，被内置到播客脚本生成的核心提示词（`prompt-podscript.txt`）之中，从而影响 AI 的生成行为。

**使用方法**：
在 `input.txt` 文件的任意位置，使用以下格式定义您的自定义内容：

```
```custom-begin
您希望提供给 AI 的额外指令或上下文，例如：
- "请确保讨论中包含对 [特定概念] 的深入分析。"
- "请在对话中加入一些幽默元素，特别是关于 [某个主题] 的笑话。"
- "所有角色的发言都必须是简短的，并且每句话不超过两行。"
```custom-end
```

---

## 🌐 Web 应用 (Next.js)

除了命令行脚本和 FastAPI 服务，本项目还提供了一个功能完善的 Web 用户界面。这个界面旨在提供更直观、便捷的播客生成与管理体验，将后端复杂的功能通过友好的前端操作暴露给用户。

### ✨ 核心功能亮点

*   **web操作界面**: 直观友好的web界面，让播客生成过程一目了然。
*   **微用户体系集成**: 支持用户登录、注册、积分与计费功能，构建完善的用户生态。
*   **播客创建与配置**: 允许用户通过表单输入主题，配置 TTS 角色、音量和语速等参数。
*   **实时进度跟踪**: 显示播客生成的状态和进度。
*   **播客播放与管理**: 集成音频播放器，方便用户收听已生成的播客，并可能提供管理历史播客的功能。
*   **API 交互**: 通过 API 与后端 Python 服务无缝通信，包括播客生成、状态查询和音频流。

### 🚀 快速开始 (Web)

1.  **安装 Node.js**: 请确保您的系统中已安装 Node.js (推荐 LTS 版本)。
2.  **安装依赖**: 进入 `web/` 目录，安装所有前端依赖。
    ```bash
    cd web/
    npm install
    # 或者 yarn install
    ```
3.  **启动开发服务器**:
    ```bash
    npm run dev
    # 或者 yarn dev
    ```
    Web 应用将在 `http://localhost:3000` (默认) 启动。
4.  **构建生产环境**:
    ```bash
    npm run build
    # 或者 yarn build
    npm run start
    # 或者 yarn start
    ```

---

## 🌍 国际化 (i18n) 支持

本项目支持多语言界面，目前支持英文 (en)、中文 (zh-CN) 和日文 (ja)。

### 📁 语言文件结构

语言文件位于 `web/public/locales/` 目录下，按照语言代码分组：
- `web/public/locales/en/common.json` - 英文翻译
- `web/public/locales/zh-CN/common.json` - 中文翻译
- `web/public/locales/ja/common.json` - 日文翻译

### 🛠️ 添加新语言

1. 在 `web/public/locales/` 目录下创建新的语言文件夹，例如 `fr/`
2. 复制 `common.json` 文件到新文件夹中
3. 翻译文件中的所有键值对
4. 在 `web/src/i18n/settings.ts` 文件中更新 `languages` 变量

### 🌐 语言切换

用户可以通过 URL 路径或浏览器语言设置自动切换语言：
- `http://localhost:3000/en/` - 英文界面
- `http://localhost:3000/zh-CN/` - 中文界面
- `http://localhost:3000/ja/` - 日文界面

---

## ⚙️ 配置文件详解

### `config/[tts-provider].json` (TTS 角色与语音配置)

这是您的 TTS 核心配置文件，文件名与您通过 `--tts-provider` 参数指定的提供商对应。它告诉脚本如何与 TTS 服务协同工作。

```json
{
  "podUsers": [
    {
      "code": "zh-CN-XiaoxiaoNeural",
      "role": "主持人"
    },
    {
      "code": "zh-CN-YunxiNeural",
      "role": "技术专家"
    }
  ],
  "voices": [
    {
      "name": "XiaoMin",
      "code": "yue-CN-XiaoMinNeural",
      "volume_adjustment": 1.0,
      "speed_adjustment": 5.0
    }
  ],
  "apiUrl": "http://localhost:5000/api/tts?text={{text}}&voiceCode={{voiceCode}}",
  "turnPattern": "random",
  "tts_max_retries": 3
}
```

*   `podUsers`: 定义播客中的**角色**。每个角色的 `code` 必须对应 `voices` 列表中的一个有效语音。
*   `voices`: 定义所有可用的 TTS **语音**。
    *   `volume_adjustment` (可选): 音量调整 (dB)。例如 `6.0` 增加 6dB。
    *   `speed_adjustment` (可选): 语速调整 (%)。例如 `10.0` 增加 10% 语速。
*   `apiUrl`: 您的 TTS 服务 API 端点。`{{text}}` 和 `{{voiceCode}}` 是占位符。
*   `turnPattern`: 定义角色对话的**轮流模式**，例如 `random` (随机) 或 `sequential` (顺序)。
*   `tts_max_retries` (可选): TTS API 调用失败时的最大重试次数（默认为 `3`）。

### `config/tts_providers.json` (TTS 服务商认证)

此文件用于统一管理所有 TTS 服务提供商的认证信息（如 API 密钥）。

```json
{
  "index": { "api_key": null },
  "edge": { "api_key": null },
  "doubao": { "X-Api-App-Id": "null", "X-Api-Access-Key": "null" },
  "fish": { "api_key": "null" },
  "minimax": { "group_id": "null", "api_key": "null" },
  "gemini": { "api_key": "null" }
}
```
**注意**: 实际使用时，请将 `"null"` 替换为有效的认证信息。可以创建一个 `tts_providers-local.json` 来存放真实密钥，此文件已被 `.gitignore` 忽略。

---

## 🔌 支持的 TTS 服务

本项目设计为高度灵活，支持多种 TTS 服务。

| 服务商 | 类型 | 支持状态 |
| :--- | :--- | :---: |
| **Index-TTS** | 本地 | ✅ 已支持 |
| **Edge-TTS** | 本地 | ✅ 已支持 |
| **豆包 (Doubao)** | 网络 | ✅ 已支持 |
| **Minimax** | 网络 | ✅ 已支持 |
| **Fish Audio**| 网络 | ✅ 已支持 |
| **Gemini** | 网络 | ✅ 已支持 |
| **OpenAI TTS**| 网络 | 计划中 |
| **Azure TTS** | 网络 | 计划中 |

---

## 🎉 输出成果

所有成功生成的播客音频文件将自动保存在 `output/` 目录下。文件名格式为 `podcast_` 加上生成时的时间戳，例如 `podcast_1678886400.wav`。

---

## 🎧 示例音频

您可以在 `example/` 文件夹中找到使用不同 TTS 服务生成的播客示例音频。

| TTS 服务 | 试听链接 |
| :--- | :--- |
| **Edge TTS** | [▶️ edgeTTS.wav](example/edgeTTS.wav) |
| **Index TTS** | [▶️ indexTTS.wav](example/indexTTS.wav) |
| **豆包 TTS** | [▶️ doubaoTTS.wav](example/doubaoTTS.wav) |
| **Minimax** | [▶️ minimax.wav](example/minimax.wav) |
| **Fish Audio**| [▶️ fish.wav](example/fish.wav) |
| **Gemini TTS**| [▶️ geminiTTS.wav](example/geminiTTS.wav) |

---

## 📂 文件结构

```
.
├── config/                  # ⚙️ 配置文件目录
│   ├── doubao-tts.json      # ... (各 TTS 服务商的配置)
│   └── tts_providers.json   # 统一的 TTS 认证文件
├── server/                  # 🐍 后端服务目录
│   ├── main.py              # FastAPI Web API 入口：提供播客生成、状态查询、音频下载等 RESTful API，管理任务生命周期，并进行数据清理。
│   ├── podcast_generator.py # 核心播客生成逻辑：负责与 OpenAI API 交互生成播客脚本，调用 TTS 适配器将文本转语音，并使用 FFmpeg 合并音频文件。
│   ├── tts_adapters.py      # TTS 适配器：封装了与不同 TTS 服务（如 Index-TTS, Edge-TTS, Doubao, Minimax, Fish Audio, Gemini）的交互逻辑。
│   ├── openai_cli.py        # OpenAI 命令行工具
│   └── ...                  # 其他后端文件
├── web/                     # 🌐 前端 Web 应用目录 (Next.js)
│   ├── public/              # 静态资源
│   ├── src/                 # 源码
│   │   ├── app/             # Next.js 路由页面
│   │   ├── components/      # React 组件
│   │   ├── hooks/           # React Hooks
│   │   ├── lib/             # 库文件 (认证、数据库、API等)
│   │   └── types/           # TypeScript 类型定义
│   ├── package.json         # 前端依赖
│   ├── next.config.js       # Next.js 配置
│   └── ...                  # 其他前端文件
├── prompt/                  # 🧠 AI 提示词目录
│   ├── prompt-overview.txt
│   └── prompt-podscript.txt
├── example/                 # 🎧 示例音频目录
├── output/                  # 🎉 输出音频目录
├── input.txt                # 🎙️ 播客主题输入文件
├── README.md                # 📄 项目说明文档 (中文)
└── README_EN.md             # 📄 项目说明文档 (英文)
```

---

## 📝 免责声明

*   **许可证**: 本项目采用 [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) 授权。
*   **无担保**: 本软件按"现状"提供，不附带任何明示或暗示的担保。
*   **责任限制**: 在任何情况下，作者或版权持有者均不对因使用本软件而产生的任何损害承担责任。
*   **第三方服务**: 用户需自行承担使用第三方服务（如 OpenAI API、TTS 服务）的风险和责任。
*   **使用目的**: 本项目仅供学习和研究目的使用，请遵守所有适用的法律法规。
*   **最终解释权**: 我们保留随时修改本免责声明的权利。
