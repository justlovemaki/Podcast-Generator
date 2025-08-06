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

# Global configuration
output_dir = "output"
file_list_path = os.path.join(output_dir, "file_list.txt")

def read_file_content(filepath):
    """Reads content from a given file path."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        sys.exit(1)

def select_json_config(config_dir='config'):
    """
    Reads JSON files from the specified directory and allows the user to select one.
    Returns the content of the selected JSON file.
    """
    json_files = glob.glob(os.path.join(config_dir, '*.json'))
    if not json_files:
        print(f"Error: No JSON files found in {config_dir}")
        sys.exit(1)

    print(f"Found JSON configuration files in '{config_dir}':")
    for i, file_path in enumerate(json_files):
        print(f"{i + 1}. {os.path.basename(file_path)}")

    while True:
        try:
            choice = int(input("Enter the number of the configuration file to use: "))
            if 1 <= choice <= len(json_files):
                selected_file = json_files[choice - 1]
                print(f"Selected: {os.path.basename(selected_file)}")
                with open(selected_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                print("Invalid choice. Please enter a number within the range.")
        except ValueError:
            print("Invalid input. Please enter a number.")

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
        print("Error: FFmpeg is not installed or not in your PATH. Please install FFmpeg to merge audio files.")
        print("You can download FFmpeg from: https://ffmpeg.org/download.html")
        sys.exit(1)

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
        print(f"Error merging audio files with FFmpeg: {e}")
        print(f"FFmpeg stdout:\n", e.stdout)
        print(f"FFmpeg stderr:\n", e.stderr)
        sys.exit(1)
    finally:
        # Clean up temporary audio files and the file list
        # Clean up temporary audio files and the file list
        for item in os.listdir(output_dir):
            if item.startswith("temp_audio"):
                try:
                    os.remove(os.path.join(output_dir, item))
                except OSError as e:
                    print(f"Error removing temporary audio file {item}: {e}")
        try:
            os.remove(file_list_path)
        except OSError as e:
            print(f"Error removing file list {file_list_path}: {e}")
        print("Cleaned up temporary files.")


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Generate podcast script and audio using OpenAI and local TTS.")
    parser.add_argument("--api-key", help="OpenAI API key.")
    parser.add_argument("--base-url", default="https://api.openai.com/v1", help="OpenAI API base URL (default: https://api.openai.com/v1).")
    parser.add_argument("--model", default="gpt-3.5-turbo", help="OpenAI model to use (default: gpt-3.5-turbo).")
    parser.add_argument("--threads", type=int, default=1, help="Number of threads to use for audio generation (default: 1).")
    args = parser.parse_args()

    print("Podcast Generation Script")

    # Step 1: Select JSON configuration
    config_data = select_json_config()
    print("\nLoaded Configuration:")
    # print(json.dumps(config_data, indent=4))

    # Determine final API key, base URL, and model based on priority
    # Command-line args > config file > environment variables
    api_key = args.api_key or config_data.get("api_key") or os.getenv("OPENAI_API_KEY")
    base_url = args.base_url or config_data.get("base_url") or os.getenv("OPENAI_BASE_URL")
    model = args.model or config_data.get("model") # Allow model to be None if not provided anywhere

    # Fallback for model if not specified
    if not model:
        model = "gpt-3.5-turbo"
        print(f"Using default model: {model} as it was not specified via command-line, config, or environment variables.")

    if not api_key:
        print("Error: OpenAI API key is not set. Please provide it via --api-key, in your config file, or as an environment variable (OPENAI_API_KEY).")
        sys.exit(1)

    # Step 2: Read prompt files
    input_prompt = read_file_content('input.txt')
    overview_prompt = read_file_content('prompt/prompt-overview.txt')
    original_podscript_prompt = read_file_content('prompt/prompt-podscript.txt')

    # 从 input_prompt 中提取自定义内容
    custom_content = ""
    custom_begin_tag = '```custom-begin'
    custom_end_tag = '```custom-end'
    start_index = input_prompt.find(custom_begin_tag)
    if start_index != -1:
        end_index = input_prompt.find(custom_end_tag, start_index + len(custom_begin_tag))
        if end_index != -1:
            custom_content = input_prompt[start_index + len(custom_begin_tag):end_index].strip()
            # 移除 input_prompt 中 ```custom-end 以上的部分，包含 ```custom-end
            input_prompt = input_prompt[end_index + len(custom_end_tag):].strip()
    
    pod_users = config_data.get("podUsers", [])
    voices = config_data.get("voices", [])
    turn_pattern = config_data.get("turnPattern", "random")

    # 替换 original_podscript_prompt 中的占位符
    original_podscript_prompt = original_podscript_prompt.replace("{{numSpeakers}}", str(len(pod_users)))
    original_podscript_prompt = original_podscript_prompt.replace("{{turnPattern}}", turn_pattern)

    speaker_id_info = generate_speaker_id_text(pod_users, voices)
    # 将自定义内容前置到 podscript_prompt
    podscript_prompt =  speaker_id_info + "\n\n" + original_podscript_prompt + "\n\n" + custom_content

    print(f"\nInput Prompt (input.txt):\n{input_prompt[:100]}...") # Display first 100 chars
    print(f"\nOverview Prompt (prompt-overview.txt):\n{overview_prompt[:100]}...")
    print(f"\nPodscript Prompt (prompt-podscript.txt):\n{podscript_prompt[:1000]}...")

    # Step 4 & 5: Call openai_cli to generate overview content
    print("\nGenerating overview with OpenAI CLI...")
    try:
        openai_client_overview = OpenAICli(api_key=api_key, base_url=base_url, model=model, system_message=overview_prompt)
        overview_response_generator = openai_client_overview.chat_completion(messages=[{"role": "user", "content": input_prompt}])
        overview_content = "".join([chunk.choices[0].delta.content for chunk in overview_response_generator if chunk.choices and chunk.choices[0].delta.content])
        print("Generated Overview:")
        print(overview_content[:100])
    except Exception as e:
        print(f"Error generating overview: {e}")
        sys.exit(1)

    # Step 6: Call openai_cli to generate podcast script JSON
    print("\nGenerating podcast script with OpenAI CLI...")
    try:
        openai_client_podscript = OpenAICli(api_key=api_key, base_url=base_url, model=model, system_message=podscript_prompt)
        podscript_response_generator = openai_client_podscript.chat_completion(messages=[{"role": "user", "content": overview_content}])
        podscript_json_str = "".join([chunk.choices[0].delta.content for chunk in podscript_response_generator if chunk.choices and chunk.choices[0].delta.content])
        # try:
        #     output_script_filename = os.path.join(output_dir, f"podcast_script_{int(time.time())}.json")
        #     with open(output_script_filename, 'w', encoding='utf-8') as f:
        #         json.dump(podscript_json_str, f, ensure_ascii=False, indent=4)
        #     print(f"Podcast script saved to {output_script_filename}")
        # except Exception as e:
        #     print(f"Error saving podcast script to file: {e}")
        #     sys.exit(1)

        # Attempt to parse the JSON string. OpenAI sometimes returns extra text.
        podcast_script = None
        decoder = json.JSONDecoder()
        idx = 0
        valid_json_str = ""
        while idx < len(podscript_json_str):
            try:
                obj, end = decoder.raw_decode(podscript_json_str[idx:])
                # Check if this object is the expected podcast_script
                if isinstance(obj, dict) and "podcast_transcripts" in obj:
                    podcast_script = obj
                    valid_json_str = podscript_json_str[idx : idx + end] # Capture the exact valid JSON string
                    break # Found the desired JSON, stop searching
                idx += end # Move to the end of the current JSON object
            except json.JSONDecodeError:
                # If decoding fails, advance index by one and continue
                idx += 1
                # Optionally, skip to the next potential JSON start if it's far away
                next_brace = podscript_json_str.find('{', idx)
                if next_brace != -1:
                    idx = next_brace
                else:
                    break # No more braces, no more JSON to find

        if podcast_script is None:
            print(f"Error: Could not find a valid podcast script JSON object with 'podcast_transcripts' key in response.")
            print(f"Raw response: {podscript_json_str}")
            sys.exit(1)

        print("\nGenerated Podcast Script Length:"+ str(len(podcast_script.get("podcast_transcripts") or [])))
        print(valid_json_str[:100] + "...") # Print beginning of the *actual* parsed JSON
        if not podcast_script.get("podcast_transcripts"):
            print("Warning: 'podcast_transcripts' array is empty or not found in the generated script. Nothing to convert to audio.")
            sys.exit(0) # Exit gracefully if no transcripts to process

    except Exception as e:
        print(f"Error generating podcast script: {e}")
        sys.exit(1)

    # Step 7: Parse podcast script and generate audio
    os.makedirs(output_dir, exist_ok=True) # Create output directory if it doesn't exist
    
    def generate_audio_for_item(item, index):
        """Generate audio for a single podcast transcript item."""
        speaker_id = item.get("speaker_id")
        dialog = item.get("dialog")

        # Get the voice code based on speaker_id (index into config_data["person"])
        # Assuming speaker_id corresponds to the index in the 'person' array
        voice_code = None
        if config_data and "podUsers" in config_data and 0 <= speaker_id < len(config_data["podUsers"]):
            pod_user_entry = config_data["podUsers"][speaker_id]
            voice_code = pod_user_entry.get("code")
        
        if not voice_code:
            print(f"Warning: No voice code found for speaker_id {speaker_id}. Skipping this dialog.")
            return None

        # Replace placeholders in apiUrl
        # URL encode the dialog before replacing {{text}}
        # 移除指定标点符号，只保留逗号，句号，感叹号
        dialog = re.sub(r'[^\w\s\-,，.。?？!！\u4e00-\u9fa5]', '', dialog)
        print(f"dialog: {dialog}")
        encoded_dialog = urllib.parse.quote(dialog)
        api_url = config_data.get("apiUrl", "").replace("{{text}}", encoded_dialog).replace("{{voiceCode}}", voice_code)
        
        if not api_url:
            print(f"Warning: apiUrl not found in config. Skipping dialog for speaker_id {speaker_id}.")
            return None

        try:
            print(f"Calling TTS API for speaker {speaker_id} with voice {voice_code}...")
            response = requests.get(api_url, stream=True)
            response.raise_for_status() # Raise an exception for bad status codes

            # Save the audio chunk to a temporary file
            temp_audio_file = os.path.join(output_dir, f"temp_audio_{uuid.uuid4()}.mp3")
            with open(temp_audio_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Generated {os.path.basename(temp_audio_file)}")
            return temp_audio_file

        except requests.exceptions.RequestException as e:
            print(f"Error calling TTS API for speaker {speaker_id} ({voice_code}): {e}")
            return None
    
    print("\nGenerating audio files...")
    transcripts = podcast_script.get("podcast_transcripts", [])
    
    # Use ThreadPoolExecutor for multi-threading audio generation
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    # Create a dictionary to hold results with their indices
    audio_files_dict = {}
    
    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        # Submit all tasks with their indices
        future_to_index = {
            executor.submit(generate_audio_for_item, item, i): i
            for i, item in enumerate(transcripts)
        }
        
        # Collect results and place them in the correct order
        for future in as_completed(future_to_index):
            index = future_to_index[future]
            try:
                result = future.result()
                if result:
                    audio_files_dict[index] = result
            except Exception as e:
                print(f"Error generating audio for item {index}: {e}")
    
    # Convert dictionary to list in the correct order
    audio_files = [audio_files_dict[i] for i in sorted(audio_files_dict.keys())]
    
    print(f"\nFinished generating individual audio files. Total files: {len(audio_files)}")
    """
    Merges a list of audio files into a single output file using FFmpeg.
    Args:
        audio_files (list): A list of paths to the audio files to merge.
        output_dir (str): The directory where the merged audio file will be saved.
    """
    if not audio_files:
        print("No audio files were generated to merge.")
        return
    
    # Create a file list for ffmpeg
    print(f"Creating file list for ffmpeg at: {file_list_path}")
    with open(file_list_path, 'w', encoding='utf-8') as f:
        for audio_file in audio_files:
            # FFmpeg concat demuxer requires paths to be relative to the file_list.txt
            # or absolute. Using basename if file_list.txt is in output_dir.
            f.write(f"file '{os.path.basename(audio_file)}'\n")
    
    print("Content of file_list.txt:")
    with open(file_list_path, 'r', encoding='utf-8') as f:
        print(f.read())


if __name__ == "__main__":
    start_time = time.time() # Record the start time
    
    main()
    merge_audio_files()

    end_time = time.time() # Record the end time
    execution_time = end_time - start_time # Calculate total execution time
    print(f"\nTotal execution time: {execution_time:.2f} seconds")
    