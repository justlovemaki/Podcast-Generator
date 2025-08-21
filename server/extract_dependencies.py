import os
import re
import sys
from collections import defaultdict

# 假设的项目根目录，用于判断是否为内部模块
PROJECT_ROOT = os.getcwd()

# Python 内置库的简单列表 (可以根据需要扩展)
# 这是一个不完全列表，但包含了常见的内置库
BUILTIN_LIBS = {
    "os", "sys", "json", "time", "argparse", "uuid", "hashlib", "hmac", 
    "enum", "shutil", "random", "threading", "contextlib", "io", "base64",
    "datetime", "glob", "subprocess", "urllib", "re", "abc", "typing",
    "concurrent", "collections", "wave"
}

def is_builtin_or_standard_library(module_name):
    """
    判断模块是否为 Python 内置库或标准库。
    这里仅做一个简单的基于名称的判断。
    更精确的判断需要检查 sys.builtin_module_names 或 sys.stdlib_module_names，
    但会使脚本复杂化，对于当前任务，基于列表判断已足够。
    """
    return module_name.lower() in BUILTIN_LIBS

def is_project_internal_module(module_name, project_root_path, py_files_paths):
    """
    判断模块是否为项目内部模块。
    通过检查模块名是否对应项目中的某个Python文件或包。
    """
    # 转换为可能的相对路径形式
    module_path_parts = module_name.replace('.', os.sep)
    
    for py_file_path in py_files_paths:
        # 检查是否为直接导入的文件 (例如: from podcast_generator import ...)
        if py_file_path.endswith(f"{module_path_parts}.py"):
            return True
        # 检查是否为包导入 (例如: from check.check_doubao_voices import ...)
        if os.path.isdir(os.path.join(project_root_path, module_path_parts)) and \
           os.path.exists(os.path.join(project_root_path, module_path_parts, "__init__.py")):
            return True
    return False


def extract_dependencies(file_path, project_root_path, all_py_files):
    """从Python文件中提取第三方依赖"""
    dependencies = set()
    internal_modules = set()
    
    # 将所有Python文件的路径转换为集合，方便查找
    all_py_files_set = set(all_py_files)

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 匹配 import module 和 from package import module
    # 这里我们只关心顶级模块名
    for match in re.finditer(r"^(?:import|from)\s+([a-zA-Z0-9_.]+)", content, re.MULTILINE):
        full_module_name = match.group(1).split('.')[0] # 获取顶级模块名

        if is_builtin_or_standard_library(full_module_name):
            continue # 跳过内置库

        # 检查是否为项目内部模块
        # 为了提高准确性，这里需要将py_files_paths传递给 is_project_internal_module
        if is_project_internal_module(full_module_name, project_root_path, all_py_files_set):
            internal_modules.add(full_module_name)
            continue

        dependencies.add(full_module_name)
    
    return dependencies, internal_modules

def find_all_py_files(directory):
    """递归查找指定目录下所有.py文件"""
    py_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                py_files.append(os.path.relpath(os.path.join(root, file), start=directory))
    return py_files

def main():
    print("开始提取 Python 项目依赖...")
    
    all_py_files = find_all_py_files(PROJECT_ROOT)
    
    all_external_dependencies = set()
    all_internal_modules = set()

    for py_file in all_py_files:
        print(f"处理文件: {py_file}")
        try:
            current_dependencies, current_internal_modules = extract_dependencies(py_file, PROJECT_ROOT, all_py_files)
            all_external_dependencies.update(current_dependencies)
            all_internal_modules.update(current_internal_modules)
        except Exception as e:
            print(f"处理文件 {py_file} 时出错: {e}", file=sys.stderr)

    # 某些库名可能需要映射到 pip 包名
    # 例如，PIL 导入为 PIL 但包名是 Pillow
    # httpx 导入为 httpx, 包名也是 httpx
    # starlette 导入为 starlette，包名也是 starlette
    # fastapi 导入为 fastapi，包名也是 fastapi
    # uvicorn 导入为 uvicorn，包名也是 uvicorn
    # openai 导入为 openai，包名也是 openai
    # msgpack 导入为 msgpack，包名是 msgpack
    # pydub 导入为 pydub，包名是 pydub
    # requests 导入为 requests, 包名也是 requests
    # schedule 导入为 schedule，包名是 schedule
    dependency_mapping = {
        "PIL": "Pillow",
        "fastapi": "fastapi",
        "starlette": "starlette",
        "httpx": "httpx",
        "schedule": "schedule",
        "uvicorn": "uvicorn",
        "openai": "openai",
        "msgpack": "msgpack",
        "pydub": "pydub",
        "requests": "requests",
    }

    final_dependencies = set()
    for dep in all_external_dependencies:
        final_dependencies.add(dependency_mapping.get(dep, dep))

    # 手动添加一些可能未通过 import 语句捕获的依赖，或者需要特定版本的依赖
    # 这部分通常需要根据项目实际情况调整
    # 例如：
    # final_dependencies.add("uvicorn[standard]") # 如果使用了 uvicorn 的标准安装
    # final_dependencies.add("fastapi[all]") # 如果使用了 FastAPI 的所有可选依赖

    output_file = "requirements.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        for dep in sorted(list(final_dependencies)):
            f.write(f"{dep}\n")

    print(f"\n提取完成。所有第三方依赖已写入 {output_file}。")
    print("\n检测到的第三方依赖:")
    for dep in sorted(list(final_dependencies)):
        print(f"- {dep}")

    print("\n检测到的项目内部模块 (供参考):")
    for mod in sorted(list(all_internal_modules)):
        print(f"- {mod}")

if __name__ == "__main__":
    main()