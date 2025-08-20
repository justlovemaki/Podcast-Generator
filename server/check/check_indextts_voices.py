import json
import requests
import time
import re

def check_indextts_voices():
    config_file_path = "config/index-tts.json"
    test_text = "你好" # 测试文本
    
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
    api_url_template = config_data.get('apiUrl')

    if not voices:
        print("未在配置文件中找到任何声音（voices）。")
        return
    
    if not api_url_template:
        print("未在配置文件中找到 'apiUrl' 字段。")
        return

    print(f"开始验证 {len(voices)} 个 IndexTTS 语音...")
    for voice in voices:
        voice_code = voice.get('code')
        voice_name = voice.get('alias', voice.get('name', '未知')) # 优先使用 alias, 否则使用 name

        if voice_code:
            # 替换 URL 模板中的占位符
            url = api_url_template.replace("{{text}}", test_text).replace("{{voiceCode}}", voice_code)
            
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

    print("IndexTTS 语音验证完成。")

if __name__ == "__main__":
    check_indextts_voices()