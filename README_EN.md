# 🎙️ Simple Podcast Generator

> Easily transform your ideas into lively and engaging multi-person dialogue podcasts with one click!
> [中文版本](README.md)

This is a powerful script tool that leverages the wisdom of **OpenAI API** to generate insightful podcast scripts, and through **TTS (Text-to-Speech)** API services, transforms cold text into warm audio. You just need to provide a topic, and leave the rest to it!

✨ The podcast script generation logic of this project is deeply inspired by the [SurfSense](https://github.com/MODSetter/SurfSense) project. We would like to express our heartfelt thanks to their open-source contributions!

---

## ✨ Core Highlights

*   **🤖 AI-Driven Scripts**: Automatically create high-quality, in-depth podcast dialogue scripts with the power of OpenAI models.
*   **👥 Multi-Character Support**: Freely define multiple podcast characters (such as host, guest), and assign unique TTS voices to each character.
*   **🔌 Flexible TTS Integration**: Seamlessly connect to your self-hosted or third-party TTS services through simple API URL configuration.
*   **🔊 Intelligent Audio Synthesis**: Automatically splice voice segments of each character accurately, and support **volume and speed adjustment** to synthesize a complete, smooth podcast audio file (`.wav` format).
*   **⌨️ Convenient Command-Line Interface**: Provides clear command-line parameters, giving you full control over every aspect of the podcast generation process.

---

## 🛠️ Installation Guide

### 📝 Prerequisites

1.  **Python 3.x**
    *   Please ensure Python 3 is installed on your system.

2.  **FFmpeg**
    *   This project depends on FFmpeg for audio merging. Please visit the [FFmpeg official website](https://ffmpeg.org/download.html) to download and install.
    *   **Important Note**: After installation, please ensure the `ffmpeg` command has been added to your system's environment variables (PATH) so that the script can call it normally.

### 🐍 Python Dependencies

Open your terminal or command prompt and install the required Python libraries using pip:
```bash
pip install requests openai pydub msgpack
```

> **Dependency Explanation**:
> - `requests`: Used to send HTTP requests to TTS service APIs
> - `openai`: Used to interact with OpenAI API to generate podcast scripts
> - `pydub`: Used for audio processing, such as adjusting volume and speed
> - `msgpack`: Used for efficient data serialization with certain TTS services (such as Fish Audio)

---

## 🚀 Quick Start

### 1. Prepare Input Files

Before running, please ensure the following files are ready:

*   `input.txt`: Enter your **podcast topic** or core idea in this file.
*   `prompt/prompt-overview.txt`: System prompt used to guide AI in generating the podcast **overall outline**.
*   `prompt/prompt-podscript.txt`: System prompt used to guide AI in generating **detailed dialogue scripts**. It contains dynamic placeholders (such as `{{numSpeakers}}`, `{{turnPattern}}`), which the script will automatically replace.

### 2. Configure TTS Services and Characters

*   TTS configuration files (such as `edge-tts.json`) are stored in the `config/` directory. This file defines the TTS service API interface, podcast characters (`podUsers`) and their corresponding voices (`voices`).

### 3. Run the Script

Execute the following command in the project root directory:

```bash
python podcast_generator.py [optional parameters]
```

#### **Optional Parameters**

*   `--api-key <YOUR_OPENAI_API_KEY>`: Your OpenAI API key. If not provided, it will be read from the configuration file or `OPENAI_API_KEY` environment variable.
*   `--base-url <YOUR_OPENAI_BASE_URL>`: Proxy address of the OpenAI API. If not provided, it will be read from the configuration file or `OPENAI_BASE_URL` environment variable.
*   `--model <OPENAI_MODEL_NAME>`: Specify the OpenAI model to use (such as `gpt-4o`, `gpt-4-turbo`). Default value is `gpt-3.5-turbo`.
*   `--threads <NUMBER_OF_THREADS>`: Specify the number of parallel threads for audio generation (default is `1`) to improve processing speed.
*   `--output-language <LANGUAGE_CODE>`: Specify the output language of the podcast script (default is `Chinese`).
*   `--usetime <TIME_DURATION>`: Specify the time length of the podcast script (default is `10 minutes`).

#### **Running Example**

```bash
# Use gpt-4o model, edge-tts service and 4 threads to generate podcast
python podcast_generator.py --api-key sk-xxxxxx --model gpt-4o --tts-provider edge --threads 4
```

### 5. Using Web API (main.py)

This project also provides a FastAPI-based web service that allows you to generate podcasts through HTTP requests.

#### Start Web Service

```bash
python main.py
```

By default, the service will run on `http://localhost:8000`.

#### API Endpoints

1. **Generate Podcast** - `POST /generate-podcast`
   - Parameters:
     - `api_key`: OpenAI API key
     - `base_url`: OpenAI API base URL (optional)
     - `model`: OpenAI model name (optional)
     - `input_txt_content`: Input text content
     - `tts_providers_config_content`: TTS provider configuration content
     - `podUsers_json_content`: Podcast user JSON configuration
     - `threads`: Number of threads (optional, default is 1)
     - `tts_provider`: TTS provider name (optional, default is "index-tts")

2. **Get Podcast Generation Status** - `GET /podcast-status`
   - Requires `X-Auth-Id` header

3. **Download Podcast** - `GET /download-podcast/`
   - Parameters:
     - `file_name`: Name of the file to download

4. **Get Voice List** - `GET /get-voices`
   - Parameters:
     - `tts_provider`: TTS provider name (optional, default is "tts")

#### API Usage Example

```bash
# After starting the service, use curl to send a request to generate podcast
curl -X POST "http://localhost:8000/generate-podcast" \
  -H "X-Auth-Id: your-auth-id" \
  -F "api_key=sk-xxxxxx" \
  -F "model=gpt-4o" \
  -F "input_txt_content=The future development of artificial intelligence" \
  -F "tts_providers_config_content={\"index\": {\"api_key\": \"your-api-key\"}}" \
  -F "podUsers_json_content=[{\"code\":\"zh-CN-XiaoxiaoNeural\",\"role\":\"Host\"}],\"voices\":[{\"name\":\"Xiaoxiao\",\"code\":\"zh-CN-XiaoxiaoNeural\"}]" \
  -F "threads=4" \
  -F "tts_provider=index-tts"
```

### 4. Customizing AI Prompts (`custom` code block)

To provide more detailed AI instructions or add specific context, you can embed `custom` code blocks in the `input.txt` file. The content in this code block will be used as additional instructions, built into the core prompt for podcast script generation (`prompt-podscript.txt`), thereby influencing the AI's generation behavior.

**Usage**:
In the `input.txt` file, define your custom content anywhere using the following format:

```
```custom-begin
Additional instructions or context you want to provide to the AI, for example:
- "Please ensure the discussion includes an in-depth analysis of [specific concept]."
- "Please add some humor to the conversation, especially jokes about [a certain topic]."
- "All characters' speeches must be brief, with each sentence not exceeding two lines."
```custom-end
```

---

## 🌐 Web Application (Next.js)

In addition to the command-line script and FastAPI service, this project also provides a fully functional web user interface. This interface aims to provide a more intuitive and convenient podcast generation and management experience, exposing complex backend functions through friendly frontend operations to users.

### ✨ Core Features

*   **Web Operation Interface**: Intuitive and friendly web interface that makes the podcast generation process clear at a glance.
*   **Micro User System Integration**: Supports user login, registration, points and billing functions, building a complete user ecosystem.
*   **Podcast Creation and Configuration**: Allows users to enter topics through forms and configure TTS characters, volume and speed parameters.
*   **Real-time Progress Tracking**: Displays the status and progress of podcast generation.
*   **Podcast Playback and Management**: Integrates an audio player for users to listen to generated podcasts and may provide functions for managing historical podcasts.
*   **API Interaction**: Seamless communication with the backend Python service through APIs, including podcast generation, status queries, and audio streaming.

### 🚀 Quick Start (Web)

1.  **Install Node.js**: Please ensure Node.js is installed on your system (LTS version recommended).
2.  **Install Dependencies**: Enter the `web/` directory and install all frontend dependencies.
    ```bash
    cd web/
    npm install
    # or yarn install
    ```
3.  **Start Development Server**:
    ```bash
    npm run dev
    # or yarn dev
    ```
    The web application will start at `http://localhost:3000` (default).
4.  **Build Production Environment**:
    ```bash
    npm run build
    # or yarn build
    npm run start
    # or yarn start
    ```

### 🐳 Docker Deployment

This project supports deployment via Docker. For detailed information, please refer to [Docker Usage Guide](DOCKER_USAGE.md).

---

## ⚙️ Configuration File Details

### `config/[tts-provider].json` (TTS Character and Voice Configuration)

This is your core TTS configuration file, with the filename corresponding to the provider specified by the `--tts-provider` parameter. It tells the script how to work with the TTS service.

```json
{
  "podUsers": [
    {
      "code": "zh-CN-XiaoxiaoNeural",
      "role": "Host"
    },
    {
      "code": "zh-CN-YunxiNeural",
      "role": "Tech Expert"
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

*   `podUsers`: Defines the **characters** in the podcast. Each character's `code` must correspond to a valid voice in the `voices` list.
*   `voices`: Defines all available TTS **voices**.
    *   `volume_adjustment` (optional): Volume adjustment (dB). For example, `6.0` increases volume by 6dB.
    *   `speed_adjustment` (optional): Speed adjustment (%). For example, `10.0` increases speed by 10%.
*   `apiUrl`: Your TTS service API endpoint. `{{text}}` and `{{voiceCode}}` are placeholders.
*   `turnPattern`: Defines the **turn-taking mode** for character dialogue, such as `random` (random) or `sequential` (sequential).
*   `tts_max_retries` (optional): Maximum number of retries when TTS API calls fail (default is `3`).

### `config/tts_providers.json` (TTS Provider Authentication)

This file is used to centrally manage authentication information (such as API keys) for all TTS service providers.

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
**Note**: In actual use, please replace `"null"` with valid authentication information. You can create a `tts_providers-local.json` to store real keys, which has been ignored by `.gitignore`.

---

## 🔌 Supported TTS Services

This project is designed to be highly flexible and supports multiple TTS services.

| Provider | Type | Support Status |
| :--- | :--- | :---: |
| **Index-TTS** | Local | ✅ Supported |
| **Edge-TTS** | Local | ✅ Supported |
| **Doubao** | Network | ✅ Supported |
| **Minimax** | Network | ✅ Supported |
| **Fish Audio**| Network | ✅ Supported |
| **Gemini** | Network | ✅ Supported |
| **OpenAI TTS**| Network | Planned |
| **Azure TTS** | Network | Planned |

---

## 🎉 Output Results

All successfully generated podcast audio files will be automatically saved in the `output/` directory. The filename format is `podcast_` plus the timestamp when it was generated, for example `podcast_1678886400.wav`.

---

## 🎧 Sample Audio

You can find sample podcast audio generated using different TTS services in the `example/` folder.

| TTS Service | Listen Link |
| :--- | :--- |
| **Edge TTS** | [▶️ edgeTTS.wav](example/edgeTTS.wav) |
| **Index TTS** | [▶️ indexTTS.wav](example/indexTTS.wav) |
| **Doubao TTS** | [▶️ doubaoTTS.wav](example/doubaoTTS.wav) |
| **Minimax** | [▶️ minimax.wav](example/minimax.wav) |
| **Fish Audio**| [▶️ fish.wav](example/fish.wav) |
| **Gemini TTS**| [▶️ geminiTTS.wav](example/geminiTTS.wav) |

---

## 📂 File Structure

```
.
├── config/                  # ⚙️ Configuration directory
│   ├── doubao-tts.json      # ... (configuration for each TTS provider)
│   └── tts_providers.json   # Unified TTS authentication file
├── server/                  # 🐍 Backend service directory
│   ├── main.py              # FastAPI Web API entry: Provides RESTful APIs for podcast generation, status query, audio download, manages task lifecycle, and performs data cleanup.
│   ├── podcast_generator.py # Core podcast generation logic: Responsible for interacting with OpenAI API to generate podcast scripts, calling TTS adapters to convert text to speech, and using FFmpeg to merge audio files.
│   ├── tts_adapters.py      # TTS adapter: Encapsulates interaction logic with different TTS services (such as Index-TTS, Edge-TTS, Doubao, Minimax, Fish Audio, Gemini).
│   ├── openai_cli.py        # OpenAI command-line tool
│   └── ...                  # Other backend files
├── web/                     # 🌐 Frontend Web Application Directory (Next.js)
│   ├── public/              # Static resources
│   ├── src/                 # Source code
│   │   ├── app/             # Next.js route pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # React Hooks
│   │   ├── lib/             # Library files (authentication, database, API, etc.)
│   │   └── types/           # TypeScript type definitions
│   ├── package.json         # Frontend dependencies
│   ├── next.config.js       # Next.js configuration
│   └── ...                  # Other frontend files
├── prompt/                  # 🧠 AI prompt directory
│   ├── prompt-overview.txt
│   └── prompt-podscript.txt
├── example/                 # 🎧 Sample audio directory
├── output/                  # 🎉 Output audio directory
├── input.txt                # 🎙️ Podcast topic input file
├── README.md                # 📄 Project documentation (Chinese)
└── README_EN.md             # 📄 Project documentation (English)
```

---

## 📝 Disclaimer

*   **License**: This project is licensed under [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html).
*   **No Warranty**: This software is provided "as is" without any express or implied warranties.
*   **Liability Limitation**: Under no circumstances shall the authors or copyright holders be liable for any damages arising from the use of this software.
*   **Third-Party Services**: Users bear the risks and responsibilities of using third-party services (such as OpenAI API, TTS services) on their own.
*   **Usage Purpose**: This project is for learning and research purposes only. Please comply with all applicable laws and regulations.
*   **Final Interpretation Rights**: We reserve the right to modify this disclaimer at any time.