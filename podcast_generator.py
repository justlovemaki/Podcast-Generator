# podcast_generator.py

import argparse # Import argparse for command-line arguments
import os
import json
import time
import glob
import sys
import subprocess # For calling external commands like ffmpeg
import requests # For making HTTP requests to TTS API
import uuid # For generating unique filenames for temporary audio files
from datetime import datetime
from openai_cli import OpenAICli # Moved to top for proper import
import urllib.parse # For URL encoding
import re # For regular expression operations
from tts_adapters import TTSAdapter, IndexTTSAdapter, EdgeTTSAdapter, FishAudioAdapter, MinimaxAdapter, DoubaoTTSAdapter, GeminiTTSAdapter # Import TTS adapters

# Global configuration
output_dir = "output"
file_list_path = os.path.join(output_dir, "file_list.txt")
tts_providers_config_path = 'config/tts_providers.json'

def read_file_content(filepath):
    """Reads content from a given file path."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: File not found at {filepath}")

def select_json_config(config_dir='config', return_file_path=False):
    """
    Reads JSON files from the specified directory and allows the user to select one.
    Returns the content of the selected JSON file.
    If return_file_path is True, returns a tuple of (file_path, content).
    """
    json_files = glob.glob(os.path.join(config_dir, '*.json'))
    if not json_files:
        raise FileNotFoundError(f"Error: No JSON files found in {config_dir}")

    valid_json_files = []
    print(f"Found JSON configuration files in '{config_dir}':")
    for i, file_path in enumerate(json_files):
        file_name = os.path.basename(file_path)
        if file_name != "tts_providers.json":
            valid_json_files.append(file_path)
            print(f"{len(valid_json_files)}. {file_name}")

    if not valid_json_files:
        raise FileNotFoundError(f"Error: No valid JSON files (excluding tts_providers.json) found in {config_dir}")

    while True:
        try:
            choice_str = input("Enter the number of the configuration file to use: ")
            if not choice_str: # Allow empty input to raise an error
                raise ValueError("No input provided. Please enter a number.")
            choice = int(choice_str)
            if 1 <= choice <= len(valid_json_files):
                selected_file = valid_json_files[choice - 1]
                print(f"Selected: {os.path.basename(selected_file)}")
                with open(selected_file, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    if return_file_path:
                        return selected_file, content
                    else:
                        return content
            else:
                raise ValueError("Invalid choice. Please enter a number within the range.")
        except FileNotFoundError as e:
            raise FileNotFoundError(f"Error loading selected JSON file: {e}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Error decoding JSON from selected file: {e}")
        except ValueError as e:
            print(f"Invalid input: {e}. Please enter a number.")

def generate_speaker_id_text(pod_users, voices_list):
    """
    Generates a text string mapping speaker IDs to their names/aliases based on podUsers and voices.
    Optimized by converting voices_list to a dictionary for faster lookups.
    """
    voice_map = {voice.get("code"): voice for voice in voices_list if voice.get("code")}
    
    speaker_info = []
    for speaker_id, pod_user in enumerate(pod_users):
        pod_user_code = pod_user.get("code")
        role = pod_user.get("role", "") # Default to "未知角色" if role is not provided

        found_name = None
        voice = voice_map.get(pod_user_code)
        if voice:
            found_name = voice.get("usedname") or voice.get("alias") or voice.get("name")
        
        if found_name:
            if role:
                speaker_info.append(f"speaker_id={speaker_id}的名叫{found_name}，是一个{role}")
            else:
                speaker_info.append(f"speaker_id={speaker_id}的名叫{found_name}")
        else:
            raise ValueError(f"语音code '{pod_user_code}' (speaker_id={speaker_id}) 未找到对应名称或alias。请检查 config/edge-tts.json 中的 voices 配置。")

    return "。".join(speaker_info) + "。"

def merge_audio_files():
    output_audio_filename = f"podcast_{int(time.time())}.wav"
    # Use ffmpeg to concatenate audio files
    # Check if ffmpeg is available
    try:
        subprocess.run(["ffmpeg", "-version"], check=True, capture_output=True)
    except FileNotFoundError:
        raise RuntimeError("FFmpeg is not installed or not in your PATH. Please install FFmpeg to merge audio files. You can download FFmpeg from: https://ffmpeg.org/download.html")

    print(f"\nMerging audio files into {output_audio_filename}...")
    try:
        command = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", os.path.basename(file_list_path),
            "-acodec", "pcm_s16le",
            "-ar", "44100",
            "-ac", "2",
            output_audio_filename
        ]
        # Execute ffmpeg from the output_dir to correctly resolve file paths in file_list.txt
        process = subprocess.run(command, check=True, cwd=output_dir, capture_output=True, text=True)
        print("Audio files merged successfully!")
        print("FFmpeg stdout:\n", process.stdout)
        print("FFmpeg stderr:\n", process.stderr)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error merging audio files with FFmpeg: {e.stderr}")
    finally:
        # Clean up temporary audio files and the file list
        for item in os.listdir(output_dir):
            if item.startswith("temp_audio"):
                try:
                    os.remove(os.path.join(output_dir, item))
                except OSError as e:
                    print(f"Error removing temporary audio file {item}: {e}") # This should not stop the process
        try:
            os.remove(file_list_path)
        except OSError as e:
            print(f"Error removing file list {file_list_path}: {e}") # This should not stop the process
        print("Cleaned up temporary files.")

def _parse_arguments():
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(description="Generate podcast script and audio using OpenAI and local TTS.")
    parser.add_argument("--api-key", help="OpenAI API key.")
    parser.add_argument("--base-url", default="https://api.openai.com/v1", help="OpenAI API base URL (default: https://api.openai.com/v1).")
    parser.add_argument("--model", default="gpt-3.5-turbo", help="OpenAI model to use (default: gpt-3.5-turbo).")
    parser.add_argument("--threads", type=int, default=1, help="Number of threads to use for audio generation (default: 1).")
    return parser.parse_args()

def _load_configuration():
    """Selects and loads JSON configuration, and infers tts_provider from the selected file name."""
    print("Podcast Generation Script")
    selected_file_path, config_data = select_json_config(return_file_path=True)
    
    # 从文件名中提取 tts_provider
    # 假设文件名格式为 'provider-name.json'
    file_name = os.path.basename(selected_file_path)
    tts_provider = os.path.splitext(file_name)[0] # 移除 .json 扩展名
    
    config_data["tts_provider"] = tts_provider # 将 tts_provider 添加到配置数据中
    
    print("\nLoaded Configuration: " + tts_provider)
    return config_data

def _prepare_openai_settings(args, config_data):
    """Determines final OpenAI API key, base URL, and model based on priority."""
    api_key = args.api_key or config_data.get("api_key") or os.getenv("OPENAI_API_KEY")
    base_url = args.base_url or config_data.get("base_url") or os.getenv("OPENAI_BASE_URL")
    model = args.model or config_data.get("model") # Allow model to be None if not provided anywhere

    if not model:
        model = "gpt-3.5-turbo"
        print(f"Using default model: {model} as it was not specified via command-line, config, or environment variables.")

    if not api_key:
        raise ValueError("Error: OpenAI API key is not set. Please provide it via --api-key, in your config file, or as an environment variable (OPENAI_API_KEY).")
    return api_key, base_url, model

def _read_prompt_files():
    """Reads content from input, overview, and podcast script prompt files."""
    input_prompt = read_file_content('input.txt')
    overview_prompt = read_file_content('prompt/prompt-overview.txt')
    original_podscript_prompt = read_file_content('prompt/prompt-podscript.txt')
    return input_prompt, overview_prompt, original_podscript_prompt

def _extract_custom_content(input_prompt_content):
    """Extracts custom content from the input prompt."""
    custom_content = ""
    custom_begin_tag = '```custom-begin'
    custom_end_tag = '```custom-end'
    start_index = input_prompt_content.find(custom_begin_tag)
    if start_index != -1:
        end_index = input_prompt_content.find(custom_end_tag, start_index + len(custom_begin_tag))
        if end_index != -1:
            custom_content = input_prompt_content[start_index + len(custom_begin_tag):end_index].strip()
            input_prompt_content = input_prompt_content[end_index + len(custom_end_tag):].strip()
    return custom_content, input_prompt_content

def _prepare_podcast_prompts(config_data, original_podscript_prompt, custom_content):
    """Prepares the podcast script prompts with speaker info and placeholders."""
    pod_users = config_data.get("podUsers", [])
    voices = config_data.get("voices", [])
    turn_pattern = config_data.get("turnPattern", "random")

    original_podscript_prompt = original_podscript_prompt.replace("{{numSpeakers}}", str(len(pod_users)))
    original_podscript_prompt = original_podscript_prompt.replace("{{turnPattern}}", turn_pattern)

    speaker_id_info = generate_speaker_id_text(pod_users, voices)
    podscript_prompt = speaker_id_info + "\n\n" + original_podscript_prompt + "\n\n" + custom_content
    return podscript_prompt, pod_users, voices, turn_pattern # Return voices for potential future use or consistency

def _generate_overview_content(api_key, base_url, model, overview_prompt, input_prompt):
    """Generates overview content using OpenAI CLI."""
    print("\nGenerating overview with OpenAI CLI...")
    try:
        openai_client_overview = OpenAICli(api_key=api_key, base_url=base_url, model=model, system_message=overview_prompt)
        overview_response_generator = openai_client_overview.chat_completion(messages=[{"role": "user", "content": input_prompt}])
        overview_content = "".join([chunk.choices[0].delta.content for chunk in overview_response_generator if chunk.choices and chunk.choices[0].delta.content])
        print("Generated Overview:")
        print(overview_content[:100])
        return overview_content
    except Exception as e:
        raise RuntimeError(f"Error generating overview: {e}")

def _generate_podcast_script(api_key, base_url, model, podscript_prompt, overview_content):
    """Generates and parses podcast script JSON using OpenAI CLI."""
    print("\nGenerating podcast script with OpenAI CLI...")
    # Initialize podscript_json_str outside try block to ensure it's always defined
    podscript_json_str = ""
    try:
        openai_client_podscript = OpenAICli(api_key=api_key, base_url=base_url, model=model, system_message=podscript_prompt)
        # Generate the response string first
        podscript_json_str = "".join([chunk.choices[0].delta.content for chunk in openai_client_podscript.chat_completion(messages=[{"role": "user", "content": overview_content}]) if chunk.choices and chunk.choices[0].delta.content])

        podcast_script = None
        decoder = json.JSONDecoder()
        idx = 0
        valid_json_str = ""

        while idx < len(podscript_json_str):
            try:
                obj, end = decoder.raw_decode(podscript_json_str[idx:])
                if isinstance(obj, dict) and "podcast_transcripts" in obj:
                    podcast_script = obj
                    valid_json_str = podscript_json_str[idx : idx + end]
                    break
                idx += end
            except json.JSONDecodeError:
                idx += 1
                next_brace = podscript_json_str.find('{', idx)
                if next_brace != -1:
                    idx = next_brace
                else:
                    break

        if podcast_script is None:
            raise ValueError(f"Error: Could not find a valid podcast script JSON object with 'podcast_transcripts' key in response. Raw response: {podscript_json_str}")

        print("\nGenerated Podcast Script Length:"+ str(len(podcast_script.get("podcast_transcripts") or [])))
        print(valid_json_str[:100] + "...")
        if not podcast_script.get("podcast_transcripts"):
            raise ValueError("Error: 'podcast_transcripts' array is empty or not found in the generated script. Nothing to convert to audio.")
        return podcast_script
    except json.JSONDecodeError as e:
        raise ValueError(f"Error decoding JSON from podcast script response: {e}. Raw response: {podscript_json_str}")
    except Exception as e:
        raise RuntimeError(f"Error generating podcast script: {e}")

def generate_audio_for_item(item, config_data, tts_adapter: TTSAdapter, max_retries: int = 3):
    """Generate audio for a single podcast transcript item using the provided TTS adapter."""
    speaker_id = item.get("speaker_id")
    dialog = item.get("dialog")

    voice_code = None
    volume_adjustment = 0.0 # 默认值为 0.0
    speed_adjustment = 0.0 # 默认值为 0.0


    if config_data and "podUsers" in config_data and 0 <= speaker_id < len(config_data["podUsers"]):
        pod_user_entry = config_data["podUsers"][speaker_id]
        voice_code = pod_user_entry.get("code")
        # 从 voices 列表中获取对应的 volume_adjustment
        voice_map = {voice.get("code"): voice for voice in config_data.get("voices", []) if voice.get("code")}
        volume_adjustment = voice_map.get(voice_code, {}).get("volume_adjustment", 0.0)
        speed_adjustment = voice_map.get(voice_code, {}).get("speed_adjustment", 0.0)

    if not voice_code:
        raise ValueError(f"No voice code found for speaker_id {speaker_id}. Cannot generate audio for this dialog.")
 
    # print(f"dialog-before: {dialog}")
    dialog = re.sub(r'[^\w\s\-,，.。?？!！\u4e00-\u9fa5]', '', dialog)
    print(f"dialog: {dialog}")
    
    for attempt in range(max_retries):
        try:
            print(f"Calling TTS API for speaker {speaker_id} ({voice_code}) (Attempt {attempt + 1}/{max_retries})...")
            temp_audio_file = tts_adapter.generate_audio(
                text=dialog,
                voice_code=voice_code,
                output_dir=output_dir,
                volume_adjustment=volume_adjustment, # 传递音量调整参数
                speed_adjustment=speed_adjustment # 传递速度调整参数
            )
            return temp_audio_file
        except RuntimeError as e: # Catch specific RuntimeError from TTS adapters
            print(f"Error generating audio for speaker {speaker_id} ({voice_code}) on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise RuntimeError(f"Max retries ({max_retries}) reached for speaker {speaker_id} ({voice_code}). Audio generation failed.")
        except Exception as e: # Catch other unexpected errors
            raise RuntimeError(f"An unexpected error occurred for speaker {speaker_id} ({voice_code}) on attempt {attempt + 1}: {e}")

def _generate_all_audio_files(podcast_script, config_data, tts_adapter: TTSAdapter, threads):
    """Orchestrates the generation of individual audio files."""
    os.makedirs(output_dir, exist_ok=True)
    print("\nGenerating audio files...")
    # test script
    # podcast_script = json.loads("{\"podcast_transcripts\":[{\"speaker_id\":0,\"dialog\":\"欢迎收听，来生小酒馆，客官不进来喝点吗？今天咱们来唠唠AI。 小希，你有什么新鲜事来分享吗？\"},{\"speaker_id\":1,\"dialog\":\"当然了， AI 编程工具 Cursor 给开发者送上了一份大礼，付费用户现在可以限时免费体验 GPT 5 的强大编码能力\"}]}")
    transcripts = podcast_script.get("podcast_transcripts", [])
    
    max_retries = config_data.get("tts_max_retries", 3) # 从配置中获取最大重试次数，默认3次
    
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    audio_files_dict = {}
    
    with ThreadPoolExecutor(max_workers=threads) as executor:
        future_to_index = {
            executor.submit(generate_audio_for_item, item, config_data, tts_adapter, max_retries): i
            for i, item in enumerate(transcripts)
        }
        
        for future in as_completed(future_to_index):
            index = future_to_index[future]
            try:
                result = future.result()
                if result:
                    audio_files_dict[index] = result
            except Exception as e:
                # Re-raise the exception to propagate it to the main thread
                raise RuntimeError(f"Error generating audio for item {index}: {e}")
    
    audio_files = [audio_files_dict[i] for i in sorted(audio_files_dict.keys())]
    
    print(f"\nFinished generating individual audio files. Total files: {len(audio_files)}")
    return audio_files

def _create_ffmpeg_file_list(audio_files):
    """Creates the file list for FFmpeg concatenation."""
    if not audio_files:
        raise ValueError("No audio files were generated to merge.")
    
    print(f"Creating file list for ffmpeg at: {file_list_path}")
    with open(file_list_path, 'w', encoding='utf-8') as f:
        for audio_file in audio_files:
            f.write(f"file '{os.path.basename(audio_file)}'\n")
    
    print("Content of file_list.txt:")
    with open(file_list_path, 'r', encoding='utf-8') as f:
        print(f.read())

from typing import cast # Add import for cast

def _initialize_tts_adapter(config_data: dict, output_dir: str) -> TTSAdapter:
    """
    根据配置数据初始化并返回相应的 TTS 适配器。
    """
    tts_provider = config_data.get("tts_provider")
    if not tts_provider:
        raise ValueError("TTS provider is not specified in the configuration.")

    tts_providers_config = {}
    try:
        tts_providers_config_content = read_file_content(tts_providers_config_path)
        tts_providers_config = json.loads(tts_providers_config_content)
    except Exception as e:
        print(f"Warning: Could not load tts_providers.json: {e}")
    
    # 获取当前 tts_provider 的额外参数
    current_tts_extra_params = tts_providers_config.get(tts_provider.split('-')[0], {}) # 例如 'doubao-tts' -> 'doubao'

    if tts_provider == "index-tts":
        api_url = config_data.get("apiUrl")
        if not api_url:
            raise ValueError("IndexTTS apiUrl is not configured.")
        return IndexTTSAdapter(api_url_template=cast(str, api_url))
    elif tts_provider == "edge-tts":
        api_url = config_data.get("apiUrl")
        if not api_url:
            raise ValueError("EdgeTTS apiUrl is not configured.")
        return EdgeTTSAdapter(api_url_template=cast(str, api_url))
    elif tts_provider == "fish-audio":
        api_url = config_data.get("apiUrl")
        headers = config_data.get("headers")
        request_payload = config_data.get("request_payload")
        if not all([api_url, headers, request_payload]):
            raise ValueError("FishAudio requires apiUrl, headers, and request_payload configuration.")
        return FishAudioAdapter(api_url=cast(str, api_url), headers=cast(dict, headers), request_payload_template=cast(dict, request_payload), tts_extra_params=cast(dict, current_tts_extra_params))
    elif tts_provider == "minimax":
        api_url = config_data.get("apiUrl")
        headers = config_data.get("headers")
        request_payload = config_data.get("request_payload")
        if not all([api_url, headers, request_payload]):
            raise ValueError("Minimax requires apiUrl, headers, and request_payload configuration.")
        return MinimaxAdapter(api_url=cast(str, api_url), headers=cast(dict, headers), request_payload_template=cast(dict, request_payload), tts_extra_params=cast(dict, current_tts_extra_params))
    elif tts_provider == "doubao-tts":
        api_url = config_data.get("apiUrl")
        headers = config_data.get("headers")
        request_payload = config_data.get("request_payload")
        if not all([api_url, headers, request_payload]):
            raise ValueError("DoubaoTTS requires apiUrl, headers, and request_payload configuration.")
        return DoubaoTTSAdapter(api_url=cast(str, api_url), headers=cast(dict, headers), request_payload_template=cast(dict, request_payload), tts_extra_params=cast(dict, current_tts_extra_params))
    elif tts_provider == "gemini-tts":
        api_url = config_data.get("apiUrl")
        headers = config_data.get("headers")
        request_payload = config_data.get("request_payload")
        if not all([api_url, headers, request_payload]):
            raise ValueError("GeminiTTS requires apiUrl, headers, and request_payload configuration.")
        return GeminiTTSAdapter(api_url=cast(str, api_url), headers=cast(dict, headers), request_payload_template=cast(dict, request_payload), tts_extra_params=cast(dict, current_tts_extra_params))
    else:
        raise ValueError(f"Unsupported TTS provider: {tts_provider}")

def main():
    args = _parse_arguments()
    config_data = _load_configuration()
    api_key, base_url, model = _prepare_openai_settings(args, config_data)
    
    input_prompt_content, overview_prompt, original_podscript_prompt = _read_prompt_files()
    custom_content, input_prompt = _extract_custom_content(input_prompt_content)
    podscript_prompt, pod_users, voices, turn_pattern = _prepare_podcast_prompts(config_data, original_podscript_prompt, custom_content)

    print(f"\nInput Prompt (input.txt):\n{input_prompt[:100]}...")
    print(f"\nOverview Prompt (prompt-overview.txt):\n{overview_prompt[:100]}...")
    print(f"\nPodscript Prompt (prompt-podscript.txt):\n{podscript_prompt[:1000]}...")

    overview_content = _generate_overview_content(api_key, base_url, model, overview_prompt, input_prompt)
    podcast_script = _generate_podcast_script(api_key, base_url, model, podscript_prompt, overview_content)
    
    tts_adapter = _initialize_tts_adapter(config_data, output_dir) # 初始化 TTS 适配器

    audio_files = _generate_all_audio_files(podcast_script, config_data, tts_adapter, args.threads)
    _create_ffmpeg_file_list(audio_files)


if __name__ == "__main__":
    start_time = time.time()
    try:
        main()
        merge_audio_files()
    except Exception as e:
        print(f"\nError: An unexpected error occurred during podcast generation: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        end_time = time.time()
        execution_time = end_time - start_time
        print(f"\nTotal execution time: {execution_time:.2f} seconds")
    