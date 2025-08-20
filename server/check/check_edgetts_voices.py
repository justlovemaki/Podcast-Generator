import json
import requests
import time

def check_tts_voices():
    config_file_path = "config/edge-tts.json"
    base_url = "http://192.168.1.178:7899/tts"
    test_text = "你好"
    rate = 5 # Assuming 'r' means rate

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
    if not voices:
        print("未在配置文件中找到任何声音（voices）。")
        return

    print(f"开始验证 {len(voices)} 个 TTS 语音...")
    for voice in voices:
        voice_code = voice.get('code')
        voice_name = voice.get('name', '未知')
        if voice_code:
            url = f"{base_url}?t={test_text}&v={voice_code}&r={rate}"
            print(f"正在测试语音: {voice_name} (Code: {voice_code}) - URL: {url}")
            try:
                response = requests.get(url, timeout=10) # 10秒超时
                if response.status_code == 200:
                    print(f"  ✅ {voice_name} (Code: {voice_code}): 可用")
                else:
                    print(f"  ❌ {voice_name} (Code: {voice_code}): 不可用, 状态码: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"  ❌ {voice_name} (Code: {voice_code}): 请求失败, 错误: {e}")
            time.sleep(0.1) # 短暂延迟，避免请求过快
        else:
            print(f"跳过一个缺少 'code' 字段的语音条目: {voice}")

    print("TTS 语音验证完成。")

if __name__ == "__main__":
    check_tts_voices()