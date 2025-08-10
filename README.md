# 🎙️ 简易播客生成器 (Simple Podcast Generator)

> 轻松将您的想法，一键生成为生动有趣的多人对话播客！
> [English Version](README_EN.md)

这是一个强大的脚本工具，它利用 **OpenAI API** 的智慧生成富有洞察力的播客脚本，并通过 **TTS (Text-to-Speech)** API服务，将冰冷的文字转化为有温度的音频。您只需提供一个主题，剩下的交给它！

✨ 本项目的播客脚本生成逻辑深受 [SurfSense](https://github.com/MODSetter/SurfSense) 项目的启发，在此向其开源贡献表示衷心感谢！

---

## ✨ 核心功能

*   **🤖 AI 驱动脚本**：借助强大的 OpenAI 模型，自动创作高质量、有深度的播客对话脚本。
*   **👥 多角色支持**：自由定义多个播客角色（如主持、嘉宾），并为每个角色指定独一无二的 TTS 语音。
*   **🔌 灵活的 TTS 集成**：通过简单的 API URL 配置，无缝对接您自建的或第三方的 TTS 服务。
*   **🔊 智能音频合并**：自动将各个角色的语音片段精准拼接，并支持**音量与语速调整**，合成一个完整的、流畅的播客音频文件 (`.wav` 格式)。
*   **⌨️ 便捷的命令行接口**：提供清晰的命令行参数，让您对播客生成过程的每一个环节都了如指掌。

---

## 🛠️ 安装指南

### 📝 前提条件

1.  **Python 3.x**
    *   请确保您的系统中已安装 Python 3。

2.  **FFmpeg**
    *   本项目依赖 FFmpeg 进行音频合并。请访问 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载并安装。
    *   **重要提示**：安装完成后，请确保 `ffmpeg` 命令已添加到您系统的环境变量 (PATH) 中，以便脚本可以正常调用。

### 🐍 Python 依赖

打开您的终端或命令提示符，使用 pip 安装所需的 Python 库：
```bash
pip install requests openai pydub msgpack
```

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

#### **运行示例**

```bash
# 使用 gpt-4o 模型和 4 个线程来生成播客
python podcast_generator.py --api-key sk-xxxxxx --model gpt-4o --threads 4
```

### 4. 自定义 AI 提示词（`custom` 代码块）

为了提供更细致的 AI 指令或添加特定上下文，您可以在 `input.txt` 文件中嵌入 `custom` 代码块。此代码块中的内容将作为额外指示，被内置到播客脚本生成的核心提示词（`prompt-podscript.txt`）之中，从而影响 AI 的生成行为。

**使用方法**：
在 `input.txt` 文件的任意位置，使用以下格式定义您的自定义内容：

```
```custom-begin
您希望提供给 AI 的额外指令或上下文，例如：
- “请确保讨论中包含对 [特定概念] 的深入分析。”
- “请在对话中加入一些幽默元素，特别是关于 [某个主题] 的笑话。”
- “所有角色的发言都必须是简短的，并且每句话不超过两行。”
```custom-end
```

**效果**：
`custom` 代码块中的所有文本内容（不包括 `custom-begin` 和 `custom-end` 标签本身）会被提取出来，并附加到 [`prompt/prompt-podscript.txt`](prompt/prompt-podscript.txt) 模板处理后的内容之中。这意味着，这些自定义指令将直接影响 AI 在生成具体播客对话脚本时的决策和风格，帮助您更精准地控制输出。

**示例场景**：
如果您希望 AI 在讨论一个技术话题时，特别强调某个技术趋势的未来发展，您可以在 `input.txt` 中添加：

```
```custom-begin
请在讨论中预见性地分析人工智能在未来五年内可能带来的颠覆性变革，并提及量子计算对现有加密技术的潜在影响。
```custom-end
```

---

## ⚙️ 配置文件详解 (`config/*.json`)

配置文件是整个项目的“大脑”，它告诉脚本如何与 AI 和 TTS 服务协同工作。

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
      "alias": "晓敏",
      "code": "yue-CN-XiaoMinNeural",
      "locale": "yue-CN",
      "gender": "Female",
      "usedname": "晓敏"
    },
    {
      "name": "YunSong",
      "alias": "云松",
      "code": "yue-CN-YunSongNeural",
      "locale": "yue-CN",
      "gender": "Male",
      "usedname": "云松"
    }
  ],
  "apiUrl": "http://localhost:5000/api/tts?text={{text}}&voiceCode={{voiceCode}}",
  "turnPattern": "random"
}
```

*   `tts_max_retries` (可选): TTS API 调用失败时的最大重试次数（默认为 `3`）。
*   `podUsers`: 定义播客中的**角色**。每个角色的 `code` 必须对应 `voices` 列表中的一个有效语音。
*   `voices`: 定义所有可用的 TTS **语音**，可包含 `volume_adjustment` (音量调整，单位 dB，例如 `6.0` 增加 6dB，`-3.0` 减少 3dB) 和 `speed_adjustment` (语速调整，单位百分比，例如 `10.0` 增加 10% 语速，`-10.0` 减少 10% 语速) 参数。
*   `apiUrl`: 您的 TTS 服务 API 端点。`{{text}}` 将被替换为对话文本，`{{voiceCode}}` 将被替换为角色的语音代码。
*   `turnPattern`: 定义角色对话的**轮流模式**，例如 `random` (随机) 或 `sequential` (顺序)。

### `tts_providers.json` 文件说明

`tts_providers.json` 文件用于存储各种 TTS 服务提供商的认证信息，如 API 密钥等。该文件在以下场景中被使用：

1. 在 `check/` 目录下的各种 TTS 服务测试脚本中，用于获取相应的认证信息
2. 在 `podcast_generator.py` 脚本中，用于获取特定 TTS 服务的额外配置参数

该文件的结构如下：
```json
{
  "index": {
        "api_key": null
  },
  "edge": {
        "api_key": null
  },
  "doubao": {
        "X-Api-App-Id": "null",
        "X-Api-Access-Key": "null"
  },
  "fish": {
        "api_key": "null"
  },
  "minimax": {
        "group_id": "null",
        "api_key": "null"
  },
  "gemini": {
        "api_key": "null"
  }
}
```

注意事项：
*   实际使用时，请将 `"null"` 替换为相应的认证信息
*   `tts_providers-local.json` 是一个本地配置文件示例，包含了实际的认证信息（请勿将其提交到版本控制系统中）
---

## 🔌 TTS (Text-to-Speech) 服务集成

本项目设计为高度灵活，支持多种 TTS 服务，无论是本地部署还是基于云的网络服务，都可以通过简单的配置进行集成。

### 💻 本地 TTS 接口支持

您可以将以下开源项目作为本地 TTS 服务部署，并通过 `apiUrl` 配置集成到本项目中：

*   **index-tts**: [https://github.com/index-tts/index-tts](https://github.com/index-tts/index-tts)
    *   **配合使用**: 需要配合 `ext/index-tts-api.py` 文件运行，该文件提供了一个简单的 API 接口，将 `index-tts` 封装为本项目可调用的服务。

*   **edge-tts**: [https://github.com/zuoban/tts](https://github.com/zuoban/tts)
    *   这是一个通用的 TTS 库，您可以通过自定义适配器将其集成。

### 🌐 网络 TTS 接口支持

本项目也可以轻松配置集成各种网络 TTS 服务，只需确保您的 `apiUrl` 配置符合服务提供商的要求。常见的支持服务包括：
*   **豆包 TTS (Doubao TTS)**
*   **Minimax TTS**
*   **Fish Audio TTS**
*   **Gemini TTS**
*   **OpenAI TTS**(计划中)
*   **Azure TTS**(计划中)
*   **Google Cloud Text-to-Speech (Vertex AI)**(计划中)

---

## 🎉 输出成果

所有成功生成的播客音频文件将自动保存在 `output/` 目录下。文件名格式为 `podcast_` 加上生成时的时间戳，例如 `podcast_1678886400.wav`。


## 🎧 示例音频

您可以在 `example/` 文件夹中找到使用不同 TTS 服务生成的播客示例音频：

*   **Edge TTS 生成示例**:

[edgeTTS](example/edgeTTS.wav)

*   **Index TTS 生成示例**:

[indexTTS](example/indexTTS.wav)

*   **豆包 TTS 生成示例**:

[doubaoTTS](example/doubaoTTS.wav)

*   **Minimax 生成示例**:

[minimax](example/minimax.wav)

*   **Fish Audio 生成示例**:

[fish](example/fish.wav)

*   **Gemini TTS 生成示例**:

[geminiTTS](example/geminiTTS.wav)


这些音频文件展示了本工具在实际应用中的效果。

---

## 📂 文件结构

```
.
├── config/                  # ⚙️ 配置文件目录
│   ├── doubao-tts.json
│   ├── edge-tts.json
│   ├── fish-audio.json
│   ├── gemini-tts.json
│   ├── index-tts.json
│   ├── minimax.json
│   └── tts_providers.json
├── prompt/                  # 🧠 AI 提示词目录
│   ├── prompt-overview.txt
│   └── prompt-podscript.txt
├── example/                 # 🎧 示例音频目录
│   ├── doubaoTTS.wav
│   ├── edgeTTS.wav
│   ├── fish.wav
│   ├── geminiTTS.wav
│   ├── indexTTS.wav
│   └── minimax.wav
├── output/                  # 🎉 输出音频目录
├── input.txt                # 🎙️ 播客主题输入文件
├── openai_cli.py            # OpenAI 命令行工具
├── podcast_generator.py     # 🚀 主运行脚本
├── README.md                # 📄 项目说明文档
├── README_EN.md             # 📄 英文说明文档
└── tts_adapters.py          # TTS 适配器文件

```
## 📝 免责声明

本项目是根据 GNU 通用公共许可证 v3.0 (GPL-3.0) 授权的自由软件。我们不提供任何明示或暗示的担保，包括但不限于对适销性、特定用途的适用性和非侵权性的担保。在任何情况下，作者或版权持有者均不对因使用本软件而产生的任何直接、间接、附带、特殊、惩戒性或后果性损害（包括但不限于采购替代商品或服务；系统故障或数据丢失；业务中断；利润损失）承担责任，即使事先已被告知此类损害的可能性。您使用本软件的风险完全由您自己承担。本软件按"现状"提供，不附带任何形式的担保。在使用本软件前，请确保您已阅读并理解本免责声明的所有条款。如果您不同意这些条款，请勿使用本软件。本项目中使用的第三方服务（如 OpenAI API、TTS 服务等）可能有其自己的使用条款和限制，用户需自行承担使用这些服务的责任。我们不对任何第三方服务的可用性、性能或安全性做出任何承诺或保证。本项目仅供学习和研究目的使用，不应用于任何商业用途或生产环境。我们不对使用本项目产生的任何后果承担责任。用户在使用本项目时，应遵守所有适用的法律法规。任何违反法律法规的行为均由用户自行承担全部责任。本免责声明的解释权归项目开发者所有。我们保留随时修改本免责声明的权利，恕不另行通知。修改后的免责声明将在项目仓库中发布，用户应定期查看以了解最新版本。继续使用本项目即表示您接受并同意遵守最新版本的免责声明条款。如果您对本免责声明有任何疑问或需要更多信息，请通过项目仓库中的联系方式与我们取得联系。
