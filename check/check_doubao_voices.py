import json
import requests
import time
import base64
import os
import json

def check_doubao_tts_voices():
    config_file_path = "config/doubao-tts.json"
    tts_providers_path = "config/tts_providers.json"
    test_text = "你好"  # 测试文本

    try:
        with open(config_file_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
    except FileNotFoundError:
        print(f"错误: 配置文件未找到，请检查路径: {config_file_path}")
        return
    except json.JSONDecodeError:
        print(f"错误: 无法解析 JSON 文件: {config_file_path}")
        return

    url = config_data.get("apiUrl", "")
    headers = config_data.get("headers", {})
    request_payload = config_data.get("request_payload", {})
    voices = config_data.get('voices', [])

    try:
        with open(tts_providers_path, 'r', encoding='utf-8') as f:
            tts_providers_data = json.load(f)
        doubao_config = tts_providers_data.get('doubao', {})
        doubao_app_id = doubao_config.get('X-Api-App-Id')
        doubao_access_key = doubao_config.get('X-Api-Access-Key')

        if doubao_app_id and doubao_access_key:
            headers['X-Api-App-Id'] = doubao_app_id
            headers['X-Api-Access-Key'] = doubao_access_key
        else:
            print(f"警告: 未在 {tts_providers_path} 中找到豆包的 X-Api-App-Id 或 X-Api-Access-Key。")
    except FileNotFoundError:
        print(f"错误: TTS 提供商配置文件未找到，请检查路径: {tts_providers_path}")
        return
    except json.JSONDecodeError:
        print(f"错误: 无法解析 TTS 提供商 JSON 文件: {tts_providers_path}")
        return
    
    print(f"开始验证 {len(voices)} 个豆包 TTS 语音...")

    for voice in voices:
        voice_code = voice.get('code')
        voice_name = voice.get('alias', voice.get('name', '未知'))  # 优先使用 alias, 否则使用 name

        if voice_code:
            print(f"正在测试语音: {voice_name} (Code: {voice_code})")
            session = requests.Session()
            try:
                payload = request_payload.copy()
                payload['req_params']['text'] = test_text
                payload['req_params']['speaker'] = voice_code

                response = session.post(url, headers=headers, json=payload, stream=True, timeout=30)
                
                logid = response.headers.get('X-Tt-Logid')
                if logid:
                    print(f"  X-Tt-Logid: {logid}")

                audio_data = bytearray()
                if response.status_code == 200:
                    for chunk in response.iter_lines(decode_unicode=True):
                        if not chunk:
                            continue
                        data = json.loads(chunk)

                        if data.get("code", 0) == 0 and "data" in data and data["data"]:
                            chunk_audio = base64.b64decode(data["data"])
                            audio_data.extend(chunk_audio)
                            continue
                        if data.get("code", 0) == 0 and "sentence" in data and data["sentence"]:
                            continue
                        if data.get("code", 0) == 20000000:
                            break
                        if data.get("code", 0) > 0:
                            print(f"  ❌ {voice_name} (Code: {voice_code}): 接口返回错误: {data}")
                            audio_data = bytearray()
                            break
                    
                    if audio_data:
                        print(f"  ✅ {voice_name} (Code: {voice_code}): 可用")
                        with open(f"test_{voice_code}.mp3", "wb") as f:
                            f.write(audio_data)
                    elif not audio_data and response.status_code == 200:
                        print(f"  ❌ {voice_name} (Code: {voice_code}): 接口返回成功但未收到音频数据。")
                else:
                    print(f"  ❌ {voice_name} (Code: {voice_code}): 不可用, HTTP状态码: {response.status_code}, 响应: {response.text}")

            except requests.exceptions.RequestException as e:
                print(f"  ❌ {voice_name} (Code: {voice_code}): 请求失败, 错误: {e}")
            finally:
                session.close()
            time.sleep(0.5)
        else:
            print(f"跳过一个缺少 'code' 字段的语音条目: {voice}")

    print("豆包 TTS 语音验证完成。")

if __name__ == "__main__":
    check_doubao_tts_voices()
