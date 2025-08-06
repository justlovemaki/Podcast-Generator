# 用法：
# python ./indextts/index-tts-api.py
# http://localhost:7899/synthesize?text=Hello world, this is a test using FastAPI&verbose=true&max_text_tokens_per_sentence=80&server_audio_prompt_path=johnny-v.wav

import os
import shutil
import tempfile
import time
from typing import Optional
import re # For sanitizing filenames/paths

import uvicorn
from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
# Removed File and UploadFile as we are not uploading anymore

# Assuming infer.py is in the same directory or in PYTHONPATH
from infer import IndexTTS

# --- Configuration ---
MODEL_CFG_PATH = "checkpoints/config.yaml"
MODEL_DIR = "checkpoints"
DEFAULT_IS_FP16 = True
DEFAULT_USE_CUDA_KERNEL = None
DEFAULT_DEVICE = None

# Default local audio prompt, can be overridden by a query parameter
DEFAULT_SERVER_AUDIO_PROMPT_PATH = "prompts/fdt-v.wav" #  <-- CHANGE THIS TO YOUR ACTUAL DEFAULT PROMPT
# Define a base directory from which user-specified prompts can be loaded
# THIS IS A SECURITY MEASURE. Prompts outside this directory (and its subdirs) won't be allowed.
ALLOWED_PROMPT_BASE_DIR = os.path.abspath("prompts") # Example: /app/prompts

# --- Global TTS instance ---
tts_model: Optional[IndexTTS] = None

app = FastAPI(title="IndexTTS FastAPI Service")

@app.on_event("startup")
async def startup_event():
    global tts_model
    print("Loading IndexTTS model...")
    start_load_time = time.time()
    try:
        tts_model = IndexTTS(
            cfg_path=MODEL_CFG_PATH,
            model_dir=MODEL_DIR,
            is_fp16=DEFAULT_IS_FP16,
            device=DEFAULT_DEVICE,
            use_cuda_kernel=DEFAULT_USE_CUDA_KERNEL,
        )
        # Verify default prompt exists
        if not os.path.isfile(DEFAULT_SERVER_AUDIO_PROMPT_PATH):
            print(f"WARNING: Default server audio prompt file not found at: {DEFAULT_SERVER_AUDIO_PROMPT_PATH}")
        
        # Create the allowed prompts directory if it doesn't exist (optional, for convenience)
        if not os.path.isdir(ALLOWED_PROMPT_BASE_DIR):
            try:
                os.makedirs(ALLOWED_PROMPT_BASE_DIR, exist_ok=True)
                print(f"Created ALLOWED_PROMPT_BASE_DIR: {ALLOWED_PROMPT_BASE_DIR}")
            except Exception as e:
                print(f"WARNING: Could not create ALLOWED_PROMPT_BASE_DIR at {ALLOWED_PROMPT_BASE_DIR}: {e}")
        else:
            print(f"User-specified prompts will be loaded from: {ALLOWED_PROMPT_BASE_DIR}")

    except Exception as e:
        print(f"Error loading IndexTTS model: {e}")
        tts_model = None
    load_time = time.time() - start_load_time
    print(f"IndexTTS model loaded in {load_time:.2f} seconds.")
    if tts_model:
        print(f"Model ready on device: {tts_model.device}")
    else:
        print("Model FAILED to load.")


async def cleanup_temp_dir(temp_dir_path: str):
    try:
        if os.path.exists(temp_dir_path):
            shutil.rmtree(temp_dir_path)
            print(f"Successfully cleaned up temporary directory: {temp_dir_path}")
    except Exception as e:
        print(f"Error cleaning up temporary directory {temp_dir_path}: {e}")

def sanitize_path_component(component: str) -> str:
    """Basic sanitization for a path component."""
    # Remove leading/trailing whitespace and dots
    component = component.strip().lstrip('.')
    # Replace potentially harmful characters or sequences
    component = re.sub(r'\.\.[/\\]', '', component) # Remove .. sequences
    component = re.sub(r'[<>:"|?*]', '_', component) # Replace illegal filename chars
    return component

def get_safe_prompt_path(base_dir: str, user_path: Optional[str]) -> str:
    """
    Constructs a safe path within the base_dir from a user-provided path.
    Prevents directory traversal.
    """
    if not user_path:
        return "" # Or raise error if user_path is mandatory when called

    # Normalize user_path (e.g., handle mixed slashes, remove redundant ones)
    normalized_user_path = os.path.normpath(user_path)
    
    # Split the path into components and sanitize each one
    path_components = []
    head = normalized_user_path
    while True:
        head, tail = os.path.split(head)
        if tail:
            path_components.insert(0, sanitize_path_component(tail))
        elif head: # Handle case like "/path" or "path/" leading to empty tail
            path_components.insert(0, sanitize_path_component(head))
            break
        else: # Both head and tail are empty
            break
        if not head or head == os.sep or head == '.': # Stop if root or current dir
            break
            
    if not path_components:
         raise ValueError("Invalid or empty prompt path provided after sanitization.")

    # Join sanitized components. This prevents using absolute paths from user_path directly.
    # os.path.join will correctly use the OS's path separator.
    # The first component of user_path is NOT joined with base_dir if it's absolute.
    # We ensure user_path is treated as relative to base_dir.
    # So, we must ensure path_components doesn't represent an absolute path itself after sanitization.
    # The sanitize_path_component and os.path.normpath help, but the critical part is os.path.join(base_dir, *path_components)
    
    # Construct the full path relative to the base directory
    # *path_components will expand the list into arguments for join
    prospective_path = os.path.join(base_dir, *path_components)

    # Final check: ensure the resolved path is still within the base_dir
    # os.path.abspath resolves any '..' etc., in the prospective_path
    resolved_path = os.path.abspath(prospective_path)
    if not resolved_path.startswith(os.path.abspath(base_dir)):
        raise ValueError("Prompt path traversal attempt detected or path is outside allowed directory.")
    
    return resolved_path


@app.api_route("/synthesize/", methods=["POST", "GET"], response_class=FileResponse)
async def synthesize_speech(
    background_tasks: BackgroundTasks,
    text: str = Query(..., description="Text to synthesize."),
    # New parameter for specifying a server-side audio prompt path
    server_audio_prompt_path: Optional[str] = Query(None, description=f"Relative path to an audio prompt file on the server (within {ALLOWED_PROMPT_BASE_DIR}). If not provided, uses default."),
    
    verbose: bool = Query(False, description="Enable verbose logging."),
    max_text_tokens_per_sentence: int = Query(100, description="Max text tokens per sentence."),
    sentences_bucket_max_size: int = Query(4, description="Sentences bucket max size."),
    do_sample: bool = Query(True, description="Enable sampling."),
    top_p: float = Query(0.8, description="Top P for sampling."),
    top_k: int = Query(30, description="Top K for sampling."),
    temperature: float = Query(1.0, description="Temperature for sampling."),
    length_penalty: float = Query(0.0, description="Length penalty."),
    num_beams: int = Query(3, description="Number of beams for beam search."),
    repetition_penalty: float = Query(10.0, description="Repetition penalty."),
    max_mel_tokens: int = Query(600, description="Max mel tokens to generate.")
):
    if tts_model is None:
        raise HTTPException(status_code=503, detail="TTS model is not loaded or failed to load.")

    temp_dir = tempfile.mkdtemp()
    actual_audio_prompt_to_use = "" # This will be the path on the server filesystem

    try:
        if server_audio_prompt_path:
            print(f"Client specified server_audio_prompt_path: {server_audio_prompt_path}")
            # Auto-complete .wav extension if missing
            if server_audio_prompt_path and not server_audio_prompt_path.lower().endswith(".wav"):
                print(f"server_audio_prompt_path '{server_audio_prompt_path}' does not end with .wav, appending it.")
                server_audio_prompt_path += ".wav"
            try:
                # Sanitize and resolve the user-provided path against the allowed base directory
                safe_path = get_safe_prompt_path(ALLOWED_PROMPT_BASE_DIR, server_audio_prompt_path)
                if os.path.isfile(safe_path):
                    actual_audio_prompt_to_use = safe_path
                    print(f"Using user-specified server prompt: {actual_audio_prompt_to_use}")
                else:
                    await cleanup_temp_dir(temp_dir)
                    raise HTTPException(status_code=404, detail=f"Specified server audio prompt not found or not a file: {safe_path} (original: {server_audio_prompt_path})")
            except ValueError as ve: # From get_safe_prompt_path for security violations
                await cleanup_temp_dir(temp_dir)
                raise HTTPException(status_code=400, detail=f"Invalid server_audio_prompt_path: {str(ve)}")
        else:
            print(f"Using default server audio prompt: {DEFAULT_SERVER_AUDIO_PROMPT_PATH}")
            if not os.path.isfile(DEFAULT_SERVER_AUDIO_PROMPT_PATH):
                await cleanup_temp_dir(temp_dir)
                raise HTTPException(status_code=500, detail=f"Default server audio prompt file not found: {DEFAULT_SERVER_AUDIO_PROMPT_PATH}. Please configure the server.")
            actual_audio_prompt_to_use = DEFAULT_SERVER_AUDIO_PROMPT_PATH

        # Copy the chosen prompt (either user-specified or default) to the temp_dir.
        # This keeps the subsequent logic (model interaction, cleanup) consistent.
        # It also means the original prompt files are not directly modified or locked.
        prompt_filename_for_temp = os.path.basename(actual_audio_prompt_to_use)
        temp_audio_prompt_path_in_job_dir = os.path.join(temp_dir, prompt_filename_for_temp)
        try:
            shutil.copy2(actual_audio_prompt_to_use, temp_audio_prompt_path_in_job_dir)
        except Exception as e:
            await cleanup_temp_dir(temp_dir)
            raise HTTPException(status_code=500, detail=f"Failed to copy audio prompt to temporary workspace: {str(e)}")


        output_filename = f"generated_speech_{int(time.time())}.wav"
        temp_output_path = os.path.join(temp_dir, output_filename)
        
        print(f"Synthesizing for text: '{text[:50]}...' with prompt (in temp): {temp_audio_prompt_path_in_job_dir}")
        print(f"Output will be saved to: {temp_output_path}")

        generation_kwargs = {
            "do_sample": do_sample,
            "top_p": top_p,
            "top_k": top_k,
            "temperature": temperature,
            "length_penalty": length_penalty,
            "num_beams": num_beams,
            "repetition_penalty": repetition_penalty,
            "max_mel_tokens": max_mel_tokens,
        }

        start_infer_time = time.time()
        returned_output_path = tts_model.infer_fast(
            audio_prompt=temp_audio_prompt_path_in_job_dir, # Use the copied prompt in temp dir
            text=text,
            output_path=temp_output_path,
            verbose=verbose,
            max_text_tokens_per_sentence=max_text_tokens_per_sentence,
            sentences_bucket_max_size=sentences_bucket_max_size,
            **generation_kwargs
        )
        infer_time = time.time() - start_infer_time
        print(f"Inference completed in {infer_time:.2f} seconds. Expected output: {temp_output_path}, Returned path: {returned_output_path}")

        if not os.path.exists(temp_output_path):
            print(f"ERROR: Output file {temp_output_path} was NOT found after inference call.")
            background_tasks.add_task(cleanup_temp_dir, temp_dir)
            raise HTTPException(status_code=500, detail="TTS synthesis failed to produce an output file.")
        
        print(f"Output file {temp_output_path} confirmed to exist.")
        background_tasks.add_task(cleanup_temp_dir, temp_dir)

        return FileResponse(
            path=temp_output_path,
            media_type="audio/wav",
            filename="synthesized_audio.wav"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"An unexpected error occurred during synthesis: {e}")
        import traceback
        traceback.print_exc()
        if 'temp_dir' in locals() and os.path.exists(temp_dir):
            background_tasks.add_task(cleanup_temp_dir, temp_dir)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@app.get("/")
async def read_root():
    return {"message": "IndexTTS FastAPI service is running. Use the /synthesize/ endpoint (GET or POST) to generate audio."}

if __name__ == "__main__":
    if not os.path.isfile(DEFAULT_SERVER_AUDIO_PROMPT_PATH):
        print(f"CRITICAL WARNING: Default server audio prompt at '{DEFAULT_SERVER_AUDIO_PROMPT_PATH}' not found!")
    else:
        print(f"Default server audio prompt: {os.path.abspath(DEFAULT_SERVER_AUDIO_PROMPT_PATH)}")
    
    if not os.path.isdir(ALLOWED_PROMPT_BASE_DIR):
         print(f"WARNING: ALLOWED_PROMPT_BASE_DIR '{ALLOWED_PROMPT_BASE_DIR}' does not exist. Consider creating it or prompts specified by 'server_audio_prompt_path' may not be found.")
    else:
        print(f"User-specified prompts should be relative to: {os.path.abspath(ALLOWED_PROMPT_BASE_DIR)}")


    print(f"Attempting to use MODEL_DIR: {os.path.abspath(MODEL_DIR)}")
    print(f"Attempting to use MODEL_CFG_PATH: {os.path.abspath(MODEL_CFG_PATH)}")

    if not os.path.isdir(MODEL_DIR):
        print(f"ERROR: MODEL_DIR '{MODEL_DIR}' not found. Please check the path.")
    if not os.path.isfile(MODEL_CFG_PATH):
        print(f"ERROR: MODEL_CFG_PATH '{MODEL_CFG_PATH}' not found. Please check the path.")
        
    uvicorn.run(app, host="0.0.0.0", port=7899)