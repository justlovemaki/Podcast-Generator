from fastapi import FastAPI, Request, HTTPException, Depends, Form, Header
from fastapi.responses import FileResponse, JSONResponse
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
import schedule
import threading

from podcast_generator import generate_podcast_audio

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

app = FastAPI()

# Global flag to signal the scheduler thread to stop
stop_scheduler_event = threading.Event()

# Global reference for the scheduler thread
scheduler_thread = None

# Global configuration
output_dir = "output"

# Define a function to clean the output directory
def clean_output_directory():
    """Removes files from the output directory that are older than 30 minutes."""
    print(f"Cleaning output directory: {output_dir}")
    now = time.time()
    # 30 minutes in seconds
    threshold = 30 * 60 

    for filename in os.listdir(output_dir):
        file_path = os.path.join(output_dir, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                # Get last modification time
                if now - os.path.getmtime(file_path) > threshold:
                    os.unlink(file_path)
                    print(f"Deleted old file: {file_path}")
            elif os.path.isdir(file_path):
                # Optionally, recursively delete old subdirectories or files within them
                # For now, just skip directories
                pass
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

# In-memory store for task results
# {task_id: {"auth_id": auth_id, "status": TaskStatus, "result": any, "timestamp": float}}
task_results: Dict[str, Dict[UUID, Dict]] = {}

# Configuration for signature verification
SECRET_KEY = os.getenv("PODCAST_API_SECRET_KEY", "your-super-secret-key") # Change this in production!
# Define a mapping from tts_provider names to their config file paths
tts_provider_map = {
    "index-tts": "config/index-tts.json",
    "doubao-tts": "config/doubao-tts.json",
    "edge-tts": "config/edge-tts.json",
    "fish-audio": "config/fish-audio.json",
    "gemini-tts": "config/gemini-tts.json",
    "minimax": "config/minimax.json",
}

async def get_auth_id(x_auth_id: str = Header(..., alias="X-Auth-Id")):
    """
    Dependency to get X-Auth-Id from headers.
    """
    if not x_auth_id:
        raise HTTPException(status_code=400, detail="Missing X-Auth-Id header.")
    return x_auth_id

async def verify_signature(request: Request):
    """
    Verify the 'sign' parameter in the request headers or query parameters.
    Expected signature format: SHA256(timestamp + SECRET_KEY)
    """
    timestamp = request.headers.get("X-Timestamp") or request.query_params.get("timestamp")
    client_sign = request.headers.get("X-Sign") or request.query_params.get("sign")

    if not timestamp or not client_sign:
        raise HTTPException(status_code=400, detail="Missing X-Timestamp or X-Sign header/query parameter.")

    try:
        current_time = int(time.time())
        if abs(current_time - int(timestamp)) > 300:
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
    tts_provider: str
):
    task_results[auth_id][task_id]["status"] = TaskStatus.RUNNING
    try:
        parser = argparse.ArgumentParser(description="Generate podcast script and audio using OpenAI and local TTS.")
        parser.add_argument("--api-key", default=api_key, help="OpenAI API key.")
        parser.add_argument("--base-url", default=base_url, help="OpenAI API base URL (default: https://api.openai.com/v1).")
        parser.add_argument("--model", default=model, help="OpenAI model to use (default: gpt-3.5-turbo).")
        parser.add_argument("--threads", type=int, default=threads, help="Number of threads to use for audio generation (default: 1).")
        args = parser.parse_args([])

        actual_config_path = tts_provider_map.get(tts_provider)
        if not actual_config_path:
            raise ValueError(f"Invalid tts_provider: {tts_provider}.") # Changed from HTTPException to ValueError

        output_filepath = await asyncio.to_thread(
            generate_podcast_audio,
            args=args,
            config_path=actual_config_path,
            input_txt_content=input_txt_content.strip(),
            tts_providers_config_content=tts_providers_config_content.strip(),
            podUsers_json_content=podUsers_json_content.strip()
        )
        task_results[auth_id][task_id]["status"] = TaskStatus.COMPLETED
        task_results[auth_id][task_id]["result"] = output_filepath
        print(f"\nPodcast generation completed for task {task_id}. Output file: {output_filepath}")
    except Exception as e:
        task_results[auth_id][task_id]["status"] = TaskStatus.FAILED
        task_results[auth_id][task_id]["result"] = str(e)
        print(f"\nPodcast generation failed for task {task_id}: {e}")

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
    tts_provider: str = Form("index-tts")
):
    # 1. Validate tts_provider
    if tts_provider not in tts_provider_map:
        raise HTTPException(status_code=400, detail=f"Invalid tts_provider: {tts_provider}.")

    # 2. Check for existing running tasks for this auth_id
    if auth_id in task_results:
        for existing_task_id, existing_task_info in task_results[auth_id].items():
            if existing_task_info["status"] == TaskStatus.RUNNING or existing_task_info["status"] == TaskStatus.PENDING:
                raise HTTPException(status_code=409, detail=f"There is already a running task (ID: {existing_task_id}) for this auth_id. Please wait for it to complete.")

    task_id = uuid.uuid4()
    if auth_id not in task_results:
        task_results[auth_id] = {}
    task_results[auth_id][task_id] = {
        "status": TaskStatus.PENDING,
        "result": None,
        "timestamp": time.time()
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
        tts_provider
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
    for task_id, task_info in task_results[auth_id].items():
        all_tasks_for_auth_id.append({
            "task_id": task_id,
            "status": task_info["status"],
            "result": task_info["result"] if task_info["status"] == TaskStatus.COMPLETED else None,
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

def run_scheduler():
    """Runs the scheduler in a loop until the stop event is set."""
    while not stop_scheduler_event.is_set():
        schedule.run_pending()
        time.sleep(1) # Check every second for new jobs or stop event

@app.on_event("startup")
async def startup_event():
    global scheduler_thread
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    # Schedule the cleaning task to run every 30 minutes
    schedule.every(30).minutes.do(clean_output_directory)
    # Start the scheduler in a separate thread
    if scheduler_thread is None or not scheduler_thread.is_alive():
        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
    print("FastAPI app started. Scheduled output directory cleaning.")

@app.on_event("shutdown")
async def shutdown_event():
    global scheduler_thread
    # Signal the scheduler thread to stop
    stop_scheduler_event.set()
    # Wait for the scheduler thread to finish (optional, but good practice)
    if scheduler_thread is not None and scheduler_thread.is_alive():
        scheduler_thread.join(timeout=5) # Wait for max 5 seconds
        if scheduler_thread.is_alive():
            print("Scheduler thread did not terminate gracefully.")
    print("FastAPI app shutting down.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)