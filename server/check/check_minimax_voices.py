import json
import requests
import time
import os
import json

def check_minimax_voices():
    config_file_path = "../config/minimax.json"
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
    url = config_data.get('apiUrl', '')

    try:
        with open(tts_providers_path, 'r', encoding='utf-8') as f:
            tts_providers_data = json.load(f)
        minimax_config = tts_providers_data.get('minimax', {})
        minimax_api_key = minimax_config.get('api_key')
        minimax_group_id = minimax_config.get('group_id')

        if minimax_api_key and minimax_group_id:
            headers['Authorization'] = f"Bearer {minimax_api_key}"
            url = url.replace('{{group_id}}', minimax_group_id)
        else:
            print(f"警告: 未在 {tts_providers_path} 中找到 Minimax 的 group_id 或 api_key。")
    except FileNotFoundError:
        print(f"错误: TTS 提供商配置文件未找到，请检查路径: {tts_providers_path}")
        return
    except json.JSONDecodeError:
        print(f"错误: 无法解析 TTS 提供商 JSON 文件: {tts_providers_path}")
        return
    
    if not voices:
        print("未在配置文件中找到任何声音（voices）。")
        return
    
    
    print(f"开始验证 {len(voices)} 个 Minimax 语音...")
    for voice in voices:
        voice_code = voice.get('code')
        voice_name = voice.get('alias', voice.get('name', '未知'))  # 优先使用 alias, 否则使用 name

        if voice_code:
            print(f"正在测试语音: {voice_name} (Code: {voice_code})")
            try:
                # 准备请求数据
                payload = request_payload.copy()
                payload['text'] = test_text
                payload['voice_setting']['voice_id'] = voice_code

                # 发送请求
                response = requests.post(url, json=payload, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    # 检查响应体中的状态
                    try:
                        response_data = response.json()
                        status = response_data.get('data', {}).get('status', 0)
                        if status == 2:
                            print(f"  ✅ {voice_name} (Code: {voice_code}): 可用")
                            # 解析并保存音频数据
                            audio_hex = response_data.get('data', {}).get('audio')
                            if audio_hex:
                                try:
                                    audio_bytes = bytes.fromhex(audio_hex)
                                    with open(f"test_{voice_code}.mp3", "wb") as audio_file:
                                        audio_file.write(audio_bytes)
                                except (ValueError, Exception) as e: # 捕获ValueError for invalid hex, Exception for other file errors
                                    print(f"  ❌ 保存音频文件时发生错误: {e}")
                            else:
                                print(f"  ⚠️ 响应中未找到音频数据。")
                        else:
                            print(f"  ❌ {voice_name} (Code: {voice_code}): 不可用, 状态: {status}")
                    except json.JSONDecodeError:
                        print(f"  ❌ {voice_name} (Code: {voice_code}): 无法解析响应 JSON")
                else:
                    print(f"  ❌ {voice_name} (Code: {voice_code}): 不可用, 状态码: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"  ❌ {voice_name} (Code: {voice_code}): 请求失败, 错误: {e}")
            time.sleep(0.5)  # 短暂延迟，避免请求过快
        else:
            print(f"跳过一个缺少 'code' 字段的语音条目: {voice}")
    
    print("Minimax 语音验证完成。")

if __name__ == "__main__":
    check_minimax_voices()