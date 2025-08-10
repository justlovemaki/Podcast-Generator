import requests
import json

# --- 配置 ---
# 请将这里的URL替换为你要获取数据的实际URL
URL = "https://lf3-config.bytetcc.com/obj/tcc-config-web/tcc-v2-data-lab.speech.tts_middle_layer-default"  # <--- 替换成你的URL
OUTPUT_FILENAME = "data_from_url_volc_bigtts.json"
# 设置请求超时（秒），防止程序因网络问题无限期等待
TIMEOUT = 10 

print(f"准备从URL获取数据: {URL}")

# --- 主逻辑 ---
try:
    # 1. 发送GET请求到URL
    # a. requests.get() 发送请求
    # b. timeout=TIMEOUT 是一个好习惯，避免程序卡死
    response = requests.get(URL, timeout=TIMEOUT)

    # 2. 检查响应状态码，确保请求成功 (例如 200 OK)
    # response.raise_for_status() 会在响应码为 4xx 或 5xx (客户端/服务器错误) 时抛出异常
    response.raise_for_status()
    print("✅ HTTP请求成功，状态码: 200 OK")

    # 3. 解析最外层的JSON
    # requests库的 .json() 方法可以直接将响应内容解析为Python字典
    # 这完成了我们的第一次解析
    outer_data = response.json()
    
    # 4. 从解析后的字典中提取内层的JSON字符串
    # 这一步可能会因为键不存在而抛出KeyError
    volc_bigtts_string = outer_data['data']['volc_bigtts']
    
    # 5. 解析内层的JSON字符串，得到最终的JSON数组（Python列表）
    # 这一步可能会因为字符串格式不正确而抛出JSONDecodeError
    final_json_array = json.loads(volc_bigtts_string)

    print("✅ 成功解析嵌套的JSON数据。")
    print("解析出的数组内容:", final_json_array)
    
    # 6. 将最终的JSON数组写入本地文件
    with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as f:
        json.dump(final_json_array, f, indent=4, ensure_ascii=False)
        
    print(f"\n🎉 成功将数据写入文件: {OUTPUT_FILENAME}")

# --- 错误处理 ---
# 将不同类型的错误分开捕获，可以提供更清晰的错误信息
except requests.exceptions.HTTPError as errh:
    # 捕获HTTP错误，如 404 Not Found, 500 Internal Server Error
    print(f"❌ HTTP错误: {errh}")
except requests.exceptions.ConnectionError as errc:
    # 捕获连接错误，如DNS查询失败、拒绝连接等
    print(f"❌ 连接错误: {errc}")
except requests.exceptions.Timeout as errt:
    # 捕获请求超时
    print(f"❌ 请求超时: {errt}")
except requests.exceptions.RequestException as err:
    # 捕获requests库可能抛出的其他所有异常
    print(f"❌ 请求发生未知错误: {err}")
except json.JSONDecodeError:
    # 捕获JSON解析错误
    # 可能发生在 response.json() 或 json.loads()
    print("❌ JSON解析失败。从URL返回的数据或内层字符串不是有效的JSON格式。")
    # 如果需要调试，可以打印原始响应内容
    # print("原始响应内容:", response.text)
except KeyError:
    # 捕获键错误
    print("❌ JSON结构不符合预期，找不到 'data' 或 'volc_bigtts' 键。")
except Exception as e:
    # 捕获所有其他未预料到的异常
    print(f"❌ 发生未知错误: {e}")