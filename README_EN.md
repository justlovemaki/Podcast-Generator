# 🎙️ Simple Podcast Generator

> Easily transform your ideas into lively and engaging multi-person conversational podcasts with a single click!
> [中文版](README.md)

This is a powerful script tool that leverages the intelligence of **OpenAI API** to generate insightful podcast scripts and transforms cold text into warm audio through **TTS (Text-to-Speech)** API services. You just need to provide a topic, and it handles the rest!

✨ The podcast script generation logic of this project is deeply inspired by the [SurfSense](https://github.com/MODSetter/SurfSense) project. We express our sincere gratitude for its open-source contribution!

---

## ✨ Core Features

*   **🤖 AI-Driven Scripting**: Automatically generate high-quality, in-depth podcast dialogue scripts with the powerful OpenAI model.
*   **👥 Multi-Role Support**: Freely define multiple podcast roles (e.g., host, guest) and assign a unique TTS voice to each role.
*   **🔌 Flexible TTS Integration**: Seamlessly connect with your self-built or third-party TTS services through simple API URL configuration.
*   **🔊 Smart Audio Merging**: Automatically and precisely stitch together voice segments from various roles, and support volume and speed adjustment, to synthesize a complete, smooth podcast audio file (`.wav` format).
*   **⌨️ Convenient Command-Line Interface**: Provides clear command-line parameters, giving you full control over every aspect of the podcast generation process.

---

## 🛠️ Installation Guide

### 📝 Prerequisites

1.  **Python 3.x**
    *   Please ensure Python 3 is installed on your system.

2.  **FFmpeg**
    *   This project relies on FFmpeg for audio merging. Please visit the [FFmpeg official website](https://ffmpeg.org/download.html) to download and install it.
    *   **Important**: After installation, please ensure the `ffmpeg` command is added to your system's environment variable (PATH) so that the script can call it normally.

### 🐍 Python Dependencies

Open your terminal or command prompt and install the required Python libraries using pip:
```bash
pip install requests openai pydub msgpack
```

---

## 🚀 Quick Start

### 1. Prepare Input Files

Before running, please ensure the following files are ready:

*   `input.txt`: Enter the **podcast topic** or core ideas you wish to discuss in this file.
*   `prompt/prompt-overview.txt`: A system prompt used to guide AI in generating the **overall outline** of the podcast.
*   `prompt/prompt-podscript.txt`: A system prompt used to guide AI in generating the **detailed dialogue script**. It contains dynamic placeholders (e.g., `{{numSpeakers}}`, `{{turnPattern}}`), which the script will automatically replace.

### 2. Configure TTS Service and Roles

*   The `config/` directory contains your TTS configuration files (e.g., `edge-tts.json`). This file defines the TTS service's API interface, podcast roles (`podUsers`), and their corresponding voices (`voices`).

### 3. Run the Script

Execute the following command in the project root directory:

```bash
python podcast_generator.py [Optional Parameters]
```

#### **Optional Parameters**

*   `--api-key <YOUR_OPENAI_API_KEY>`: Your OpenAI API key. If not provided, it will be read from the configuration file or the `OPENAI_API_KEY` environment variable.
*   `--base-url <YOUR_OPENAI_BASE_URL>`: Proxy address for the OpenAI API. If not provided, it will be read from the configuration file or the `OPENAI_BASE_URL` environment variable.
*   `--model <OPENAI_MODEL_NAME>`: Specify the OpenAI model to use (e.g., `gpt-4o`, `gpt-4-turbo`). The default value is `gpt-3.5-turbo`.
*   `--threads <NUMBER_OF_THREADS>`: Specify the number of parallel threads for audio generation (default is `1`), improving processing speed.

#### **Run Example**

```bash
# Use gpt-4o model and 4 threads to generate the podcast
python podcast_generator.py --api-key sk-xxxxxx --model gpt-4o --threads 4
```

### 4. Custom AI Prompts (`custom` code block)

To provide more detailed AI instructions or add specific context, you can embed `custom` code blocks in the `input.txt` file. The content of this code block will serve as additional instructions, built into the core prompt (`prompt-podscript.txt`) for podcast script generation, thereby influencing the AI's generation behavior.

**Usage**:
In any location within the `input.txt` file, define your custom content using the following format:

```
```custom-begin
Additional instructions or context you wish to provide to the AI, for example:
- "Please ensure the discussion includes an in-depth analysis of [specific concept]."
- "Please add some humorous elements to the dialogue, especially jokes about [a certain topic]."
- "All character speeches must be concise, and each sentence should not exceed two lines."
```custom-end
```

**Effect**:
All text content within the `custom` code block (excluding the `custom-begin` and `custom-end` tags themselves) will be extracted and appended to the processed content of the [`prompt/prompt-podscript.txt`](prompt/prompt-podscript.txt) template. This means that these custom instructions will directly influence the AI's decisions and style when generating specific podcast dialogue scripts, helping you to control the output more precisely.

**Example Scenario**:
If you want the AI to particularly emphasize the future development of a certain technological trend when discussing a tech topic, you can add this to `input.txt`:

```
```custom-begin
Please foresightedly analyze the disruptive changes AI might bring in the next five years, and mention the potential impact of quantum computing on existing encryption technologies.
```custom-end
```

---

## ⚙️ Configuration File Details (`config/*.json`)

The configuration file is the "brain" of the entire project, telling the script how to work with AI and TTS services.

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

*   `podUsers`: Defines the **roles** in the podcast. The `code` for each role must correspond to a valid voice in the `voices` list.
*   `tts_max_retries` (optional): The maximum number of retries when a TTS API call fails (default is `3`).
*   `voices`: Defines all available TTS **voices**, which can include `volume_adjustment` (volume adjustment in dB, e.g., `6.0` to increase by 6dB, `-3.0` to decrease by 3dB) and `speed_adjustment` (speed adjustment in percentage, e.g., `10.0` to increase speed by 10%, `-10.0` to decrease speed by 10%) parameters.
*   `voices`: Defines all available TTS **voices**.
*   `apiUrl`: Your TTS service API endpoint. `{{text}}` will be replaced with the dialogue text, and `{{voiceCode}}` will be replaced with the character's voice code.
*   `turnPattern`: Defines the **turn-taking pattern** for character dialogue, such as `random` or `sequential`.

### `tts_providers.json` File Description

The `tts_providers.json` file is used to store authentication information for various TTS service providers, such as API keys. This file is used in the following scenarios:

1. In the various TTS service test scripts in the `check/` directory, to obtain the corresponding authentication information
2. In the `podcast_generator.py` script, to obtain additional configuration parameters for specific TTS services

The structure of this file is as follows:
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

Notes:
*   In actual use, please replace `"null"` with the corresponding authentication information
*   `tts_providers-local.json` is a local configuration file example that contains actual authentication information (please do not commit this file to version control systems)
---

## 🔌 TTS (Text-to-Speech) Service Integration

This project is designed to be highly flexible, supporting various TTS services. Whether locally deployed or cloud-based web services, they can be integrated into this project through simple configuration.

### 💻 Local TTS Interface Support

You can deploy the following open-source projects as local TTS services and integrate them into this project via `apiUrl` configuration:

*   **index-tts**: [https://github.com/index-tts/index-tts](https://github.com/index-tts/index-tts)
    *   **Usage with**: Requires running with `ext/index-tts-api.py`, which provides a simple API interface to encapsulate `index-tts` as a service callable by this project.

*   **edge-tts**: [https://github.com/zuoban/tts](https://github.com/zuoban/tts)
    *   This is a general TTS library that you can integrate by customizing an adapter.

### 🌐 Web TTS Interface Support

This project can also be easily configured to integrate various web TTS services. Just ensure your `apiUrl` configuration meets the service provider's requirements. Commonly supported services include:
*   **Doubao TTS**
*   **Minimax TTS**
*   **Fish Audio TTS**
*   **Gemini TTS**
*   **OpenAI TTS** (Planned)
*   **Azure TTS** (Planned)
*   **Google Cloud Text-to-Speech (Vertex AI)** (Planned)

---

## 🎉 Output Results

All successfully generated podcast audio files will be automatically saved in the `output/` directory. The filename format is `podcast_` followed by a timestamp, e.g., `podcast_1678886400.wav`.

## 🎧 Sample Audio

You can find sample podcast audio generated using different TTS services in the `example/` folder:

*   **Edge TTS Sample**: 

[edgeTTS](example/edgeTTS.wav)

*   **Index TTS Sample**: 

[indexTTS](example/indexTTS.wav)

*   **Doubao TTS Sample**: 

[doubaoTTS](example/doubaoTTS.wav)

*   **Minimax Sample**: 

[minimax](example/minimax.wav)

*   **Fish Audio Sample**: 

[fish](example/fish.wav)

*   **Gemini TTS Sample**: 

[geminiTTS](example/geminiTTS.wav)

These audio files demonstrate the actual effect of this tool in practical applications.

---

## 📂 File Structure

```
.
├── config/                  # ⚙️ Configuration Files Directory
│   ├── doubao-tts.json
│   ├── edge-tts.json
│   ├── fish-audio.json
│   ├── gemini-tts.json
│   ├── index-tts.json
│   ├── minimax.json
│   └── tts_providers.json
├── prompt/                  # 🧠 AI Prompt Files Directory
│   ├── prompt-overview.txt
│   └── prompt-podscript.txt
├── example/                 # 🎧 Sample Audio Directory
│   ├── doubaoTTS.wav
│   ├── edgeTTS.wav
│   ├── fish.wav
│   ├── geminiTTS.wav
│   ├── indexTTS.wav
│   └── minimax.wav
├── output/                  # 🎉 Output Audio Directory
├── input.txt                # 🎙️ Podcast Topic Input File
├── openai_cli.py            # OpenAI Command Line Tool
├── podcast_generator.py     # 🚀 Main Running Script
├── README.md                # 📄 Project Documentation
├── README_EN.md             # 📄 English Documentation
└── tts_adapters.py          # TTS Adapter File
## 📝 Disclaimer

This project is free software licensed under the GNU General Public License v3.0 (GPL-3.0). We provide no warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. In no event shall the authors or copyright holders be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption) however caused and on any theory of liability, whether in contract, strict liability, or tort (including negligence or otherwise) arising in any way out of the use of this software, even if advised of the possibility of such damage. You use this software at your own risk. This software is provided "as is" without warranty of any kind. Before using this software, please ensure you have read and understood all terms of this disclaimer. If you do not agree to these terms, please do not use this software. Third-party services used in this project (such as OpenAI API, TTS services, etc.) may have their own terms of use and restrictions, and users are responsible for using these services at their own risk. We make no commitments or guarantees regarding the availability, performance, or security of any third-party services. This project is for learning and research purposes only and should not be used for any commercial purposes or production environments. We are not responsible for any consequences arising from the use of this project. Users should comply with all applicable laws and regulations when using this project. Any violations of laws and regulations are the sole responsibility of the user. The interpretation rights of this disclaimer belong to the project developers. We reserve the right to modify this disclaimer at any time without notice. The modified disclaimer will be published in the project repository, and users should check regularly to stay informed of the latest version. Continued use of this project indicates your acceptance and agreement to comply with the latest version of the disclaimer terms. If you have any questions about this disclaimer or need more information, please contact us through the contact information in the project repository.