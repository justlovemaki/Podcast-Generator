import json
import requests
import time
import msgpack
import json

def check_fishaudio_voices():
    config_file_path = "../config/fish-audio.json"
    tts_providers_path = "../config/tts_providers.json"
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

    voices = config_data.get('voices', [])
    request_payload = config_data.get('request_payload', {})
    headers = config_data.get('headers', {})
    url = config_data.get('apiUrl','')

    try:
        with open(tts_providers_path, 'r', encoding='utf-8') as f:
            tts_providers_data = json.load(f)
        fish_api_key = tts_providers_data.get('fish', {}).get('api_key')
        if fish_api_key:
            headers['Authorization'] = f"Bearer {fish_api_key}"
        else:
            print(f"警告: 未在 {tts_providers_path} 中找到 Fish Audio 的 API 密钥。")
    except FileNotFoundError:
        print(f"错误: TTS 提供商配置文件未找到，请检查路径: {tts_providers_path}")
        return
    except json.JSONDecodeError:
        print(f"错误: 无法解析 TTS 提供商 JSON 文件: {tts_providers_path}")
        return

    if not voices:
        print("未在配置文件中找到任何声音（voices）。")
        return
    
    print(f"开始验证 {len(voices)} 个 Fish Audio 语音...")
    for voice in voices:
        voice_code = voice.get('code')
        voice_name = voice.get('alias', voice.get('name', '未知'))  # 优先使用 alias, 否则使用 name

        if voice_code:
            print(f"正在测试语音: {voice_name} (Code: {voice_code})")
            try:
                # 准备请求数据
                payload = request_payload.copy()
                payload['text'] = test_text
                payload['reference_id'] = voice_code
                
                # 编码请求数据
                encoded_payload = msgpack.packb(payload)
                
                # 发送请求
                response = requests.post(url, data=encoded_payload, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    print(f"  ✅ {voice_name} (Code: {voice_code}): 可用")
                    with open(f"test_{voice_code}.mp3", "wb") as f:
                        f.write(response.content)
                else:
                    print(f"  ❌ {voice_name} (Code: {voice_code}): 不可用, 状态码: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"  ❌ {voice_name} (Code: {voice_code}): 请求失败, 错误: {e}")
            time.sleep(0.5)  # 短暂延迟，避免请求过快
        else:
            print(f"跳过一个缺少 'code' 字段的语音条目: {voice}")

    print("Fish Audio 语音验证完成。")

if __name__ == "__main__":
    check_fishaudio_voices()