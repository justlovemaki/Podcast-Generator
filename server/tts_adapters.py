import os
import json # 导入 json 模块
import base64 # 导入 base64 模块
from msgpack.fallback import EX_CONSTRUCT
import requests
import uuid
import urllib.parse
import re # Add re import
import time # Add time import
from abc import ABC, abstractmethod
from typing import Optional # Add Optional import

class TTSAdapter(ABC):
    """
    抽象基类，定义 TTS 适配器的接口。
    """
    @abstractmethod
    def generate_audio(self, text: str, voice_code: str, output_dir: str, volume_adjustment: float = 0.0, speed_adjustment: float = 0.0) -> str:
        """
        根据文本和语音代码生成音频文件。

        Args:
            text (str): 要转换为语音的文本。
            voice_code (str): 用于生成语音的语音代码。
            output_dir (str): 生成的音频文件保存的目录。
            volume_adjustment (float): 音量调整值，正数增加，负数减少。

        Returns:
            str: 生成的音频文件路径。

        Raises:
            Exception: 如果音频生成失败。
        """
        pass

    def _apply_audio_effects(self, audio_file_path: str, volume_adjustment: float, speed_adjustment: float) -> str:
        """
        对音频文件应用音量和速度调整。
        Args:
            audio_file_path (str): 原始音频文件路径。
            volume_adjustment (float): 音量调整值。例如，6.0 表示增加 6dB，-3.0 表示减少 3dB。
            speed_adjustment (float): 速度调整值，正数增加，负数减少。speed_adjustment 是百分比，例如 10 表示 +10%，-10 表示 -10%。
        Returns:
            str: 调整后的音频文件路径。
        Raises:
            ImportError: 如果 'pydub' 模块未安装。
            RuntimeError: 如果音频效果调整失败。
        """
        if volume_adjustment == 0.0 and speed_adjustment == 0.0:
            return audio_file_path

        try:
            from pydub import AudioSegment
        except ImportError:
            raise ImportError("The 'pydub' module is required for audio adjustments. Please install it using 'pip install pydub'.")

        current_audio_file = audio_file_path
        base, ext = os.path.splitext(audio_file_path)

        try:
            audio = AudioSegment.from_file(current_audio_file)

            # 应用音量调整
            if volume_adjustment != 0.0:
                adjusted_audio = audio + volume_adjustment
                new_file_path = f"{base}_vol_adjusted{ext}"
                adjusted_audio.export(new_file_path, format=ext[1:])
                os.remove(current_audio_file)
                current_audio_file = new_file_path
                audio = adjusted_audio
                print(f"Applied volume adjustment of {volume_adjustment} dB to {os.path.basename(current_audio_file)}")

            # 应用速度调整
            if speed_adjustment != 0.0:
                speed_multiplier = 1 + speed_adjustment / 100.0
                adjusted_audio = audio.speedup(playback_speed=speed_multiplier, chunk_size=150, crossfade=25)
                new_file_path = f"{base}_speed_adjusted{ext}"
                adjusted_audio.export(new_file_path, format=ext[1:])
                if current_audio_file != audio_file_path and os.path.exists(current_audio_file): # 只有当 current_audio_file 是中间文件时才删除
                    os.remove(current_audio_file)
                else: # 如果没有音量调整，current_audio_file 仍然是原始文件
                    os.remove(audio_file_path)
                current_audio_file = new_file_path
                print(f"Applied speed adjustment of {speed_adjustment}% to {os.path.basename(current_audio_file)}")

            return current_audio_file

        except Exception as e:
            # 如果发生错误，清理任何中间文件
            if current_audio_file != audio_file_path and os.path.exists(current_audio_file):
                os.remove(current_audio_file)
            raise RuntimeError(f"Error applying audio effects to {os.path.basename(audio_file_path)}: {e}")


class IndexTTSAdapter(TTSAdapter):
    """
    IndexTTS 的 TTS 适配器实现。
    """
    def __init__(self, api_url_template: str, tts_extra_params: Optional[dict] = None):
        self.api_url_template = api_url_template
        self.tts_extra_params = tts_extra_params if tts_extra_params is not None else {}

    def generate_audio(self, text: str, voice_code: str, output_dir: str, volume_adjustment: float = 0.0, speed_adjustment: float = 0.0) -> str:
        encoded_text = urllib.parse.quote(text)

        self.api_url_template = self.tts_extra_params.get("api_url", self.api_url_template)
        api_url = self.api_url_template.replace("{{text}}", encoded_text).replace("{{voiceCode}}", voice_code)

        if not api_url:
            raise ValueError("API URL is not configured for IndexTTS. Cannot generate audio.")

        try:
            print(f"Calling IndexTTS API with voice {voice_code}...")
            response = requests.get(api_url, stream=True, timeout=30)
            response.raise_for_status()

            temp_audio_file = os.path.join(output_dir, f"temp_audio_{uuid.uuid4()}.wav")
            with open(temp_audio_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Generated {os.path.basename(temp_audio_file)}")
            # 应用音量调整
            final_audio_file = self._apply_audio_effects(temp_audio_file, volume_adjustment, speed_adjustment)
            return final_audio_file

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error calling IndexTTS API with voice {voice_code}: {e}")
        except Exception as e: # Catch other potential errors like JSON parsing or data decoding
            raise RuntimeError(f"Error processing IndexTTS API response for voice {voice_code}: {e}")

class EdgeTTSAdapter(TTSAdapter):
    """
    EdgeTTS 的 TTS 适配器实现。
    """
    def __init__(self, api_url_template: str, tts_extra_params: Optional[dict] = None):
        self.api_url_template = api_url_template
        self.tts_extra_params = tts_extra_params if tts_extra_params is not None else {}

    def generate_audio(self, text: str, voice_code: str, output_dir: str, volume_adjustment: float = 0.0, speed_adjustment: float = 0.0) -> str:
        encoded_text = urllib.parse.quote(text)

        self.api_url_template = self.tts_extra_params.get("api_url", self.api_url_template)
        api_url = self.api_url_template.replace("{{text}}", encoded_text).replace("{{voiceCode}}", voice_code)

        if not api_url:
            raise ValueError("API URL is not configured for EdgeTTS. Cannot generate audio.")

        try:
            print(f"Calling EdgeTTS API with voice {voice_code}...")
            response = requests.get(api_url, stream=True, timeout=30)
            response.raise_for_status()

            temp_audio_file = os.path.join(output_dir, f"temp_audio_{uuid.uuid4()}.mp3")
            with open(temp_audio_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Generated {os.path.basename(temp_audio_file)}")
            # 应用音量调整
            final_audio_file = self._apply_audio_effects(temp_audio_file, volume_adjustment, speed_adjustment)
            return final_audio_file

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error calling EdgeTTS API with voice {voice_code}: {e}")
        except Exception as e: # Catch other potential errors like JSON parsing or data decoding
            raise RuntimeError(f"Error processing EdgeTTS API response for voice {voice_code}: {e}")

# 尝试导入 msgpack
class FishAudioAdapter(TTSAdapter):
    """
    FishAudio 的 TTS 适配器实现。
    """
    def __init__(self, api_url: str, headers: dict, request_payload_template: dict, tts_extra_params: Optional[dict] = None):
        self.api_url = api_url
        self.headers = headers
        self.request_payload_template = request_payload_template
        self.tts_extra_params = tts_extra_params if tts_extra_params is not None else {}

    def generate_audio(self, text: str, voice_code: str, output_dir: str, volume_adjustment: float = 0.0, speed_adjustment: float = 0.0) -> str:
        try:
            import msgpack # 延迟导入 msgpack
        except ImportError:
            raise ImportError("The 'msgpack' module is required for FishAudioAdapter. Please install it using 'pip install msgpack'.")

        # 构造请求体
        payload = self.request_payload_template.copy()
        payload["text"] = text
        payload["reference_id"] = voice_code
        self.headers["Authorization"] = self.headers["Authorization"].replace("{{api_key}}", self.tts_extra_params["api_key"])

        # 使用 msgpack 打包请求体
        packed_payload = msgpack.packb(payload, use_bin_type=True)

        try:
            print(f"Calling FishAudio API with voice {voice_code}...")
            response = requests.post(self.api_url, data=packed_payload, headers=self.headers, timeout=60) # Increased timeout for FishAudio

            temp_audio_file = os.path.join(output_dir, f"temp_audio_{uuid.uuid4()}.mp3")
            with open(temp_audio_file, "wb") as f:
                f.write(response.content)

            print(f"Generated {os.path.basename(temp_audio_file)}")
            # 应用音量调整
            final_audio_file = self._apply_audio_effects(temp_audio_file, volume_adjustment, speed_adjustment)
            return final_audio_file

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error calling FishAudio API with voice {voice_code}: {e}")
        except Exception as e: # Catch other potential errors like JSON parsing or data decoding
            raise RuntimeError(f"Error processing FishAudio API response for voice {voice_code}: {e}")


class MinimaxAdapter(TTSAdapter):
    """
    Minimax 的 TTS 适配器实现。
    """
    def __init__(self, api_url: str, headers: dict, request_payload_template: dict, tts_extra_params: Optional[dict] = None):
        self.api_url = api_url
        self.headers = headers
        self.request_payload_template = request_payload_template
        self.tts_extra_params = tts_extra_params if tts_extra_params is not None else {}

    def generate_audio(self, text: str, voice_code: str, output_dir: str, volume_adjustment: float = 0.0, speed_adjustment: float = 0.0) -> str:

        # 构造请求体
        payload = self.request_payload_template.copy()
        payload["text"] = text
        payload["voice_setting"]["voice_id"] = voice_code
        self.headers["Authorization"] = self.headers["Authorization"].replace("{{api_key}}", self.tts_extra_params["api_key"])
        self.api_url = self.api_url.replace("{{group_id}}", self.tts_extra_params["group_id"])

        # Minimax 返回十六进制编码的音频数据，需要解码
        if payload.get("output_format") == "hex":
            is_hex_output = True
        else:
            is_hex_output = False
            
        try:
            print(f"Calling Minimax API with voice {voice_code}...")
            response = requests.post(self.api_url, json=payload, headers=self.headers, timeout=60) # Increased timeout for Minimax

            temp_audio_file = os.path.join(output_dir, f"temp_audio_{uuid.uuid4()}.mp3")
            response_data = response.json()
            # 解析并保存音频数据
            if is_hex_output:
                audio_hex = response_data.get('data', {}).get('audio')
                audio_bytes = bytes.fromhex(audio_hex)
                with open(temp_audio_file, "wb") as f:
                    f.write(audio_bytes)
            else:
                audio_url = response_data.get('data', {}).get('audio')
                if not audio_url:
                    raise RuntimeError("Minimax API returned success but no audio URL found when output_format is not hex.")
                
                # 下载音频文件
                audio_response = requests.get(audio_url, stream=True, timeout=30)
                audio_response.raise_for_status()
                with open(temp_audio_file, 'wb') as f:
                    for chunk in audio_response.iter_content(chunk_size=8192):
                        f.write(chunk)

            print(f"Generated {os.path.basename(temp_audio_file)}")
            # 应用音量调整
            final_audio_file = self._apply_audio_effects(temp_audio_file, volume_adjustment, speed_adjustment)
            return final_audio_file

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error calling Minimax API with voice {voice_code}: {e}")
        except Exception as e: # Catch other potential errors like JSON parsing or data decoding
            raise RuntimeError(f"Error processing Minimax API response for voice {voice_code}: {e}")


class DoubaoTTSAdapter(TTSAdapter):
    """
    豆包TTS 的 TTS 适配器实现。
    """
    def __init__(self, api_url: str, headers: dict, request_payload_template: dict, tts_extra_params: Optional[dict] = None):
        self.api_url = api_url
        self.headers = headers
        self.request_payload_template = request_payload_template
        self.tts_extra_params = tts_extra_params if tts_extra_params is not None else {}

    def generate_audio(self, text: str, voice_code: str, output_dir: str, volume_adjustment: float = 0.0, speed_adjustment: float = 0.0) -> str:
        session = requests.Session()
        try:
            payload = self.request_payload_template.copy()
            payload['req_params']['text'] = text
            payload['req_params']['speaker'] = voice_code
            self.headers["X-Api-App-Id"] = self.headers["X-Api-App-Id"].replace("{{X-Api-App-Id}}", self.tts_extra_params["X-Api-App-Id"])
            self.headers["X-Api-Access-Key"] = self.headers["X-Api-Access-Key"].replace("{{X-Api-Access-Key}}", self.tts_extra_params["X-Api-Access-Key"])

            print(f"Calling Doubao TTS API with voice {voice_code}...")
            response = session.post(self.api_url, headers=self.headers, json=payload, stream=True, timeout=30)
            response.raise_for_status()

            audio_data = bytearray()
            for chunk in response.iter_lines(decode_unicode=True):
                if not chunk:
                    continue
                data = json.loads(chunk)

                if data.get("code", 0) == 0 and "data" in data and data["data"]:
                    import base64
                    chunk_audio = base64.b64decode(data["data"])
                    audio_data.extend(chunk_audio)
                    continue
                if data.get("code", 0) == 0 and "sentence" in data and data["sentence"]:
                    continue
                if data.get("code", 0) == 20000000:
                    break
                if data.get("code", 0) > 0:
                    raise RuntimeError(f"Doubao TTS API returned error: {data}")

            if not audio_data:
                raise RuntimeError("Doubao TTS API returned success but no audio data received.")

            temp_audio_file = os.path.join(output_dir, f"temp_audio_{uuid.uuid4()}.mp3")
            with open(temp_audio_file, "wb") as f:
                f.write(audio_data)

            print(f"Generated {os.path.basename(temp_audio_file)}")
            # 应用音量调整
            final_audio_file = self._apply_audio_effects(temp_audio_file, volume_adjustment, speed_adjustment)
            return final_audio_file

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error calling Doubao TTS API with voice {voice_code}: {e}")
        except Exception as e:
            raise RuntimeError(f"Error processing Doubao TTS API response for voice {voice_code}: {e}")
        finally:
            session.close()


class GeminiTTSAdapter(TTSAdapter):
    """
    Gemini TTS 的 TTS 适配器实现。
    """
    def __init__(self, api_url: str, headers: dict, request_payload_template: dict, tts_extra_params: Optional[dict] = None):
        self.api_url = api_url
        self.headers = headers
        self.request_payload_template = request_payload_template
        self.tts_extra_params = tts_extra_params if tts_extra_params is not None else {}

    def generate_audio(self, text: str, voice_code: str, output_dir: str, volume_adjustment: float = 0.0, speed_adjustment: float = 0.0) -> str:
        try:
            # 构造请求体
            payload = self.request_payload_template.copy()
            model_name = payload['model']
            api_url = self.api_url.replace('{{model}}', model_name) if '{{model}}' in self.api_url else self.api_url

            # 更新请求 payload
            payload['contents'][0]['parts'][0]['text'] = text
            payload['generationConfig']['speechConfig']['voiceConfig']['prebuiltVoiceConfig']['voiceName'] = voice_code

            # 更新 headers 中的 API key
            gemini_api_key = self.tts_extra_params.get('api_key')
            self.headers['x-goog-api-key'] = gemini_api_key

            print(f"Calling Gemini TTS API with voice {voice_code}...")
            response = requests.post(api_url, headers=self.headers, json=payload, timeout=60)
            response.raise_for_status()

            response_data = response.json()
            audio_data_base64 = response_data['candidates'][0]['content']['parts'][0]['inlineData']['data']
            audio_data_pcm = base64.b64decode(audio_data_base64)

            # Gemini 返回的是 PCM 数据，需要保存为 WAV
            temp_audio_file = os.path.join(output_dir, f"temp_audio_{uuid.uuid4()}.wav") # 更改为 .wav 扩展名
            import wave # 导入 wave 模块
            with wave.open(temp_audio_file, "wb") as f:
                f.setnchannels(1)
                f.setsampwidth(2) # 假设 16-bit PCM
                f.setframerate(24000) # 假设 24kHz 采样率
                f.writeframes(audio_data_pcm)

            print(f"Generated {os.path.basename(temp_audio_file)}")
            # 应用音量和速度调整
            final_audio_file = self._apply_audio_effects(temp_audio_file, volume_adjustment, speed_adjustment)
            return final_audio_file

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error calling Gemini TTS API with voice {voice_code}: {e}")
        except Exception as e:
            raise RuntimeError(f"Error processing Gemini TTS API response for voice {voice_code}: {e}")