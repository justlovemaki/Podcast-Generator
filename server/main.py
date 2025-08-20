from fastapi import FastAPI, Request, HTTPException, Depends, Form, Header
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from typing import Optional, Dict
import uuid
import asyncio
from starlette.background import BackgroundTasks
from uuid import UUID
import hashlib
import hmac
import time
import os
import json
import argparse
from enum import Enum
import shutil
from PIL import Image, ImageDraw
import random
import schedule
import threading
from contextlib import asynccontextmanager # 导入 asynccontextmanager
import httpx # 导入 httpx 库
from io import BytesIO # 导入 BytesIO
import base64 # 导入 base64

from podcast_generator import generate_podcast_audio_api

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

# --- 新的 Lifespan 上下文管理器 ---
# 这是替代已弃用的 on_event("startup") 和 on_event("shutdown") 的新方法
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 在应用启动时运行的代码 (等同于 startup_event)
    print("FastAPI app is starting up...")
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 安排清理任务每30分钟运行一次
    schedule.every(time_after).minutes.do(clean_output_directory)
    
    # 在单独的线程中启动调度器
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    print("FastAPI app started. Output directory cleaning is scheduled.")
    
    # `yield` 语句是分割点，应用在这里运行
    yield
    
    # 在应用关闭时运行的代码 (等同于 shutdown_event)
    print("FastAPI app is shutting down...")
    
    # 发送信号让调度器线程停止
    stop_scheduler_event.set()
    
    # 等待调度器线程结束（可选，但推荐）
    # 注意：在 lifespan 中，我们无法直接访问在启动部分创建的 scheduler_thread 局部变量
    # 因此，我们仍然需要一个全局事件标志来通信。
    # 线程本身是守护线程(daemon=True)，如果主程序退出它也会被强制终止，
    # 但优雅地停止是更好的实践。
    print("Signaled scheduler to stop. Main application will now exit.")


# 在创建 FastAPI 实例时，传入 lifespan 函数
app = FastAPI(lifespan=lifespan)

# 全局标志，用于通知调度器线程停止
stop_scheduler_event = threading.Event()

# 全局配置
output_dir = "output"
time_after = 30

# 内存中存储任务结果
# {task_id: {"auth_id": auth_id, "status": TaskStatus, "result": any, "timestamp": float}}
task_results: Dict[str, Dict[UUID, Dict]] = {}
# 新增字典对象，key为音频文件名，value为task_results[auth_id][task_id]的值
audio_file_mapping: Dict[str, Dict] = {}

# 签名验证配置
SECRET_KEY = os.getenv("PODCAST_API_SECRET_KEY", "your-super-secret-key") # 在生产环境中请务必修改!
# 定义从 tts_provider 名称到其配置文件路径的映射
tts_provider_map = {
    "index-tts": "../config/index-tts.json",
    "doubao-tts": "../config/doubao-tts.json",
    "edge-tts": "../config/edge-tts.json",
    "fish-audio": "../config/fish-audio.json",
    "gemini-tts": "../config/gemini-tts.json",
    "minimax": "../config/minimax.json",
}

# 定义一个函数来清理输出目录
def clean_output_directory():
    """
    清理 output 目录中的旧文件以及 task_results 中过期的任务。
    优先清理过期的任务及其关联文件，确保内存和文件系统同步。
    """
    print(f"Cleaning output directory and expired tasks from memory: {output_dir}")
    now = time.time()
    threshold = time_after * 60  # 清理阈值，单位秒

    # 第一阶段：清理 task_results 中已完成且过期的任务及其关联文件
    # 使用 list() 创建副本以安全地在迭代时修改原始字典
    auth_ids_to_clean = []
    for auth_id, tasks_by_auth in list(task_results.items()):
        task_ids_to_clean = []
        for task_id, task_info in list(tasks_by_auth.items()):
            # 只要 timestamp 过期，无论任务状态如何，都进行清理
            if (now - task_info["timestamp"] > threshold):
                task_ids_to_clean.append(task_id)
                
                # 尝试删除对应的音频文件
                output_audio_filepath = task_info.get("output_audio_filepath")
                if output_audio_filepath:
                    full_audio_path = os.path.join(output_dir, output_audio_filepath)
                    try:
                        if os.path.isfile(full_audio_path):
                            os.unlink(full_audio_path)
                            print(f"Deleted expired audio file: {full_audio_path}")
                        else:
                            print(f"Expired task {task_id} audio file {full_audio_path} not found or is not a file.")
                    except Exception as e:
                        print(f"Failed to delete audio file {full_audio_path}. Reason: {e}")

                # 从 audio_file_mapping 中删除对应的条目
                filename_without_ext = os.path.splitext(output_audio_filepath)[0] if output_audio_filepath else None
                if filename_without_ext and filename_without_ext in audio_file_mapping:
                    del audio_file_mapping[filename_without_ext]
                    print(f"Removed audio_file_mapping entry for {filename_without_ext}.")

        # 清理 task_results 中的任务
        for task_id in task_ids_to_clean:
            if task_id in task_results[auth_id]:
                del task_results[auth_id][task_id]
                print(f"Removed expired task {task_id} for auth_id {auth_id} from task_results.")
        
        # 如果该 auth_id 下没有其他任务，则删除 auth_id 的整个条目
        if not task_results[auth_id]:
            auth_ids_to_clean.append(auth_id)
    
    for auth_id in auth_ids_to_clean:
        if auth_id in task_results:
            del task_results[auth_id]
            print(f"Removed empty auth_id {auth_id} from task_results.")

    # 第二阶段：清理 output 目录中可能未被任务关联的孤立文件
    # 或者那些任务还未过期，但文件因为某种原因在内存任务清理阶段没有被删除的文件
    for filename in os.listdir(output_dir):
        file_path = os.path.join(output_dir, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                # 获取最后修改时间
                if now - os.path.getmtime(file_path) > threshold:
                    os.unlink(file_path)
                    print(f"Deleted old unassociated file: {file_path}")
            elif os.path.isdir(file_path):
                # 可选地，递归删除旧的子目录或其中的文件
                pass
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

async def get_auth_id(x_auth_id: str = Header(..., alias="X-Auth-Id")):
    """
    从头部获取 X-Auth-Id 的依赖项。
    """
    if not x_auth_id:
        raise HTTPException(status_code=400, detail="Missing X-Auth-Id header.")
    return x_auth_id

async def verify_signature(request: Request):
    """
    验证请求头或查询参数中的 'sign' 参数。
    期望的签名格式: SHA256(timestamp + SECRET_KEY)
    """
    timestamp = request.headers.get("X-Timestamp") or request.query_params.get("timestamp")
    client_sign = request.headers.get("X-Sign") or request.query_params.get("sign")

    if not timestamp or not client_sign:
        raise HTTPException(status_code=400, detail="Missing X-Timestamp or X-Sign header/query parameter.")

    try:
        current_time = int(time.time())
        if abs(current_time - int(timestamp)) > 300: # 请求在5分钟内有效
            raise HTTPException(status_code=400, detail="Request expired or timestamp is too far in the future.")

        message = f"{timestamp}{SECRET_KEY}".encode('utf-8')
        server_sign = hmac.new(SECRET_KEY.encode('utf-8'), message, hashlib.sha256).hexdigest()

        if server_sign != client_sign:
            raise HTTPException(status_code=401, detail="Invalid signature.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signature verification error: {e}")

async def _generate_podcast_task(
    task_id: UUID,
    auth_id: str,
    api_key: str,
    base_url: str,
    model: str,
    input_txt_content: str,
    tts_providers_config_content: str,
    podUsers_json_content: str,
    threads: int,
    tts_provider: str,
    callback_url: Optional[str] = None, # 新增回调地址参数
    output_language: Optional[str] = None,
    usetime: Optional[str] = None,
):
    task_results[auth_id][task_id]["status"] = TaskStatus.RUNNING
    try:
        parser = argparse.ArgumentParser(description="Generate podcast script and audio using OpenAI and local TTS.")
        parser.add_argument("--api-key", default=api_key, help="OpenAI API key.")
        parser.add_argument("--base-url", default=base_url, help="OpenAI API base URL (default: https://api.openai.com/v1).")
        parser.add_argument("--model", default=model, help="OpenAI model to use (default: gpt-3.5-turbo).")
        parser.add_argument("--threads", type=int, default=threads, help="Number of threads to use for audio generation (default: 1).")
        parser.add_argument("--output-language", default=output_language, help="Output language for the podcast script (default: Chinese).")
        parser.add_argument("--usetime", default=usetime, help="Time duration for the podcast script (default: 10 minutes).")
        args = parser.parse_args([])

        actual_config_path = tts_provider_map.get(tts_provider)
        if not actual_config_path:
            raise ValueError(f"Invalid tts_provider: {tts_provider}.")

        podcast_generation_results = await asyncio.to_thread(
            generate_podcast_audio_api,
            args=args,
            config_path=actual_config_path,
            input_txt_content=input_txt_content.strip(),
            tts_providers_config_content=tts_providers_config_content.strip(),
            podUsers_json_content=podUsers_json_content.strip()
        )
        task_results[auth_id][task_id]["status"] = TaskStatus.COMPLETED
        task_results[auth_id][task_id].update(podcast_generation_results)
        print(f"\nPodcast generation completed for task {task_id}. Output file: {podcast_generation_results.get('output_audio_filepath')}")
        # 更新 audio_file_mapping
        output_audio_filepath = podcast_generation_results.get('output_audio_filepath')
        if output_audio_filepath:
            # 从完整路径中提取文件名
            filename = os.path.basename(output_audio_filepath)
            filename = filename.split(".")[0]
            # 将任务信息添加到 audio_file_mapping
            audio_file_mapping[filename] = task_results[auth_id][task_id]

        # 生成并编码像素头像
        avatar_bytes = generate_pixel_avatar(str(task_id)) # 使用 task_id 作为种子
        avatar_base64 = base64.b64encode(avatar_bytes).decode('utf-8')
        task_results[auth_id][task_id]["avatar_base64"] = avatar_base64 # 存储 Base64 编码的头像数据
    except Exception as e:
        task_results[auth_id][task_id]["status"] = TaskStatus.FAILED
        task_results[auth_id][task_id]["result"] = str(e)
        print(f"\nPodcast generation failed for task {task_id}: {e}")
    finally: # 无论成功或失败，都尝试调用回调
        if callback_url:
            print(f"Attempting to send callback for task {task_id} to {callback_url}")
            callback_data = {
                "task_id": str(task_id),
                "auth_id": auth_id,
                "task_results": task_results[auth_id][task_id],
                "timestamp": int(time.time()), 
                "status": task_results[auth_id][task_id]["status"],
            }
            
            MAX_RETRIES = 3 # 定义最大重试次数
            RETRY_DELAY = 5 # 定义重试间隔（秒）
            
            for attempt in range(MAX_RETRIES + 1): # 尝试次数从0到MAX_RETRIES
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.put(callback_url, json=callback_data, timeout=30.0)
                        response.raise_for_status() # 对 4xx/5xx 响应抛出异常
                        print(f"Callback successfully sent for task {task_id} on attempt {attempt + 1}. Status: {response.status_code}")
                        break # 成功发送，跳出循环
                except httpx.RequestError as req_err:
                    print(f"Callback request failed for task {task_id} to {callback_url} on attempt {attempt + 1}: {req_err}")
                except httpx.HTTPStatusError as http_err:
                    print(f"Callback received error response for task {task_id} from {callback_url} on attempt {attempt + 1}: {http_err.response.status_code} - {http_err.response.text}")
                except Exception as cb_err:
                    print(f"An unexpected error occurred during callback for task {task_id} on attempt {attempt + 1}: {cb_err}")
                
                if attempt < MAX_RETRIES:
                    print(f"Retrying callback for task {task_id} in {RETRY_DELAY} seconds...")
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    print(f"Callback failed for task {task_id} after {MAX_RETRIES} attempts.") 

# @app.post("/generate-podcast", dependencies=[Depends(verify_signature)])
@app.post("/generate-podcast")
async def generate_podcast_submission(
    background_tasks: BackgroundTasks,
    auth_id: str = Depends(get_auth_id),
    api_key: str = Form("OpenAI API key."),
    base_url: str = Form("https://api.openai.com/v1"),
    model: str = Form("gpt-3.5-turbo"),
    input_txt_content: str = Form(...),
    tts_providers_config_content: str = Form(...),
    podUsers_json_content: str = Form(...),
    threads: int = Form(1),
    tts_provider: str = Form("index-tts"),
    callback_url: Optional[str] = Form(None),
    output_language: Optional[str] = Form(None),
    usetime: Optional[str] = Form(None),
):
    # 1. 验证 tts_provider
    if tts_provider not in tts_provider_map:
        raise HTTPException(status_code=400, detail=f"Invalid tts_provider: {tts_provider}.")

    # 2. 检查此 auth_id 是否有正在运行的任务
    if auth_id in task_results:
        for existing_task_id, existing_task_info in task_results[auth_id].items():
            if existing_task_info["status"] in (TaskStatus.RUNNING, TaskStatus.PENDING):
                raise HTTPException(status_code=409, detail=f"There is already a running task (ID: {existing_task_id}) for this auth_id. Please wait for it to complete.")

    task_id = uuid.uuid4()
    if auth_id not in task_results:
        task_results[auth_id] = {}
    task_results[auth_id][task_id] = {
        "status": TaskStatus.PENDING,
        "result": None,
        "timestamp": time.time(),
        "callback_url": callback_url, # 存储回调地址
        "auth_id": auth_id, # 存储 auth_id
    }

    background_tasks.add_task(
        _generate_podcast_task,
        task_id,
        auth_id,
        api_key,
        base_url,
        model,
        input_txt_content,
        tts_providers_config_content,
        podUsers_json_content,
        threads,
        tts_provider,
        callback_url,
        output_language,
        usetime
    )

    return {"message": "Podcast generation started.", "task_id": task_id}

# @app.get("/podcast-status", dependencies=[Depends(verify_signature)])
@app.get("/podcast-status")
async def get_podcast_status(
    auth_id: str = Depends(get_auth_id)
):
    if auth_id not in task_results:
        return {"message": "No tasks found for this auth_id.", "tasks": []}

    all_tasks_for_auth_id = []
    for task_id, task_info in task_results.get(auth_id, {}).items():
        all_tasks_for_auth_id.append({
            "task_id": task_id,
            "status": task_info["status"],
            "podUsers": task_info.get("podUsers"),
            "output_audio_filepath": task_info.get("output_audio_filepath"),
            "overview_content": task_info.get("overview_content"),
            "podcast_script": task_info.get("podcast_script"),
            "avatar_base64": task_info.get("avatar_base64"), # 添加 Base64 编码的头像数据
            "audio_duration": task_info.get("audio_duration"),
            "title": task_info.get("title"),
            "tags": task_info.get("tags"),
            "error": task_info["result"] if task_info["status"] == TaskStatus.FAILED else None,
            "timestamp": task_info["timestamp"]
        })
    return {"message": "Tasks retrieved successfully.", "tasks": all_tasks_for_auth_id}

@app.get("/download-podcast/")
async def download_podcast(file_name: str):
    file_path = os.path.join(output_dir, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(file_path, media_type='audio/mpeg', filename=file_name)

@app.get("/get-audio-info/")
async def get_audio_info(file_name: str):
    """
    根据文件名从 audio_file_mapping 中获取对应的任务信息。
    """
    # 移除文件扩展名（如果存在），因为 audio_file_mapping 的键是文件名（不含扩展名）
    base_file_name = os.path.splitext(file_name)[0]

    audio_info = audio_file_mapping.get(base_file_name)
    if audio_info:
        # 返回任务信息的副本，避免直接暴露内部字典引用
        return JSONResponse(content={k: str(v) if isinstance(v, UUID) else v for k, v in audio_info.items()})
    else:
        raise HTTPException(status_code=404, detail="Audio file information not found.")

@app.get("/avatar/{username}")
async def get_avatar(username: str):
    """
    根据用户名生成并返回一个像素头像。
    """
    avatar_bytes = generate_pixel_avatar(username)
    return StreamingResponse(BytesIO(avatar_bytes), media_type="image/png")

@app.get("/get-voices")
async def get_voices(tts_provider: str = "tts"):
    config_path = tts_provider_map.get(tts_provider)
    if not config_path:
        raise HTTPException(status_code=400, detail=f"Invalid tts_provider: {tts_provider}.")

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
            
        voices = config_data.get("voices")
        if voices is None:
            raise HTTPException(status_code=404, detail=f"No 'voices' key found in config for {tts_provider}.")

        return {"tts_provider": tts_provider, "voices": voices}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Config file not found for {tts_provider}: {config_path}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Error decoding JSON from config file for {tts_provider}: {config_path}. Please check file format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/")
async def read_root():
    return {"message": "FastAPI server is running!"}

def generate_pixel_avatar(seed_string: str) -> bytes:
    """
    根据给定的字符串生成一个48x48像素的像素头像。
    头像具有确定性（相同输入字符串生成相同头像）和对称性。
    """
    size = 48
    pixel_grid_size = 5 # 内部像素网格大小 (例如 5x5)
    
    # 使用SHA256哈希作为随机种子，确保确定性
    hash_object = hashlib.sha256(seed_string.encode('utf-8'))
    hash_hex = hash_object.hexdigest()
    
    # 将哈希值转换为整数，作为随机数生成器的种子
    random.seed(int(hash_hex, 16))
    
    # 创建一个空白的48x48 RGBA图像
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0)) # 透明背景
    draw = ImageDraw.Draw(img)
    
    # 随机生成头像的主颜色 (饱和度较高，亮度适中)
    hue = random.randint(0, 360)
    saturation = random.randint(70, 100) # 高饱和度
    lightness = random.randint(40, 60)   # 适中亮度
    
    # 将HSL转换为RGB
    def hsl_to_rgb(h, s, l):
        h /= 360
        s /= 100
        l /= 100
        
        if s == 0:
            return (int(l * 255), int(l * 255), int(l * 255), 255)
        
        def hue_to_rgb(p, q, t):
            if t < 0: t += 1
            if t > 1: t -= 1
            if t < 1/6: return p + (q - p) * 6 * t
            if t < 1/2: return q
            if t < 2/3: return p + (q - p) * (2/3 - t) * 6
            return p
        
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)
        
        return (int(r * 255), int(g * 255), int(b * 255), 255)
        
    main_color = hsl_to_rgb(hue, saturation, lightness)
    
    # 生成像素网格
    # 只需生成一半的网格，然后对称复制
    pixels = [[0 for _ in range(pixel_grid_size)] for _ in range(pixel_grid_size)]
    
    for y in range(pixel_grid_size):
        for x in range((pixel_grid_size + 1) // 2): # 只生成左半部分或中间列
            if random.random() > 0.5: # 50% 的几率填充像素
                pixels[y][x] = 1 # 填充
                pixels[y][pixel_grid_size - 1 - x] = 1 # 对称填充
    
    # 计算每个内部像素在最终图像中的大小
    pixel_width = size // pixel_grid_size
    pixel_height = size // pixel_grid_size
    
    # 绘制像素
    for y in range(pixel_grid_size):
        for x in range(pixel_grid_size):
            if pixels[y][x] == 1:
                draw.rectangle(
                    [x * pixel_width, y * pixel_height, (x + 1) * pixel_width, (y + 1) * pixel_height],
                    fill=main_color
                )
    
    # 将图像转换为字节流
    from io import BytesIO
    byte_io = BytesIO()
    img.save(byte_io, format='PNG')
    return byte_io.getvalue()

def run_scheduler():
    """在循环中运行调度器，直到设置停止事件。"""
    while not stop_scheduler_event.is_set():
        schedule.run_pending()
        time.sleep(1) # 每秒检查一次新任务或停止事件

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)