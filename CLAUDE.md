# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

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

## 高层代码架构

本项目是一个简易播客生成器，核心功能是利用 AI 生成播客脚本并将其转换为音频。

*   **`podcast_generator.py`**: 主运行脚本，负责协调整个播客生成流程，包括：
    *   读取配置文件 (`config/*.json`)。
    *   读取输入文件 (`input.txt`) 和 AI 提示词文件 (`prompt/*.txt`)。
    *   调用 OpenAI API 生成播客大纲和详细脚本。
    *   调用配置的 TTS 服务生成音频。
    *   使用 FFmpeg 合并生成的音频文件。
    *   支持命令行参数配置 OpenAI API 和线程数。

*   **`config/`**: 存放 TTS 服务和播客角色配置的 JSON 文件。例如 `edge-tts.json`。这些文件定义了 `podUsers` (播客角色)、`voices` (可用语音) 和 `apiUrl` (TTS 服务接口)。

*   **`prompt/`**: 包含用于指导 AI 生成内容的提示词文件。
    *   `prompt-overview.txt`: 用于生成播客整体大纲。
    *   `prompt-podscript.txt`: 用于生成详细对话脚本，包含占位符 (`{{numSpeakers}}`, `{{turnPattern}}`)。

*   **`input.txt`**: 用户输入播客主题或核心观点，也支持嵌入 `custom` 代码块来提供额外的 AI 指令。

*   **`openai_cli.py`**: 负责与 OpenAI API 进行交互的模块。

*   **`output/`**: 生成的播客音频文件 (`.wav`) 存放目录。

*   **TTS 服务集成**: 项目设计为高度灵活，支持多种 TTS 服务，通过 `config/*.json` 中的 `apiUrl` 进行配置。目前支持本地部署的 `index-tts` 和 `edge-tts`，以及理论上可集成的网络 TTS 服务（如 OpenAI TTS, Azure TTS 等）。

*   **音频合并**: 使用 FFmpeg 工具将各个角色的语音片段拼接成一个完整的播客音频文件。FFmpeg 必须安装并配置在系统环境变量中。
