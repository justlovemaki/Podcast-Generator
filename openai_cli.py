#!/usr/bin/env python3
"""
OpenAI CLI - 纯命令行OpenAI接口调用工具

支持以下功能：
- 自定义API密钥、URL和模型名称
- 交互式聊天模式
- 单次查询模式
- 流式输出

使用方法:

1. 安装依赖:
   pip install openai

2. 设置API密钥 (以下任意一种方式):
   - 环境变量: export OPENAI_API_KEY="你的API密钥"
   - 命令行参数: python openai_cli.py --api-key "你的API密钥"
   - 配置文件 (config.json):
     {
       "api_key": "你的API密钥",
       "base_url": "https://api.openai.com/v1",
       "model": "gpt-3.5-turbo",
       "temperature": 0.7,
       "top_p": 1.0
     }
     然后通过 --config config.json 加载

3. 运行脚本:

  - 交互式聊天模式:
    python openai_cli.py [可选参数: --api-key VAL --base-url VAL --model VAL --temperature VAL --top-p VAL]
    在交互模式中，输入 'quit' 或 'exit' 退出，输入 'clear' 清空对话历史。

  - 单次查询模式:
    python openai_cli.py --query "你的问题" [可选参数: --api-key VAL --base-url VAL --model VAL --temperature VAL --top-p VAL --max-tokens VAL --system-message VAL]

  - 使用配置文件:
    python openai_cli.py --config config.json --query "你的问题"

示例:
  python openai_cli.py
  python openai_cli.py -q "你好，世界" -m gpt-4
  python openai_cli.py -q "你好，世界" --temperature 0.8 --top-p 0.9
  python openai_cli.py --config my_config.json
"""

import argparse
import os
import sys
import json
from typing import Optional, Any, List, Union
import openai
from openai.types.chat import ChatCompletionMessageParam


class OpenAICli:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: str = "gpt-3.5-turbo", system_message: Optional[str] = None):
        """初始化CLI客户端"""
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.system_message = system_message
        
        if not self.api_key:
            raise ValueError("API密钥不能为空，请通过参数或环境变量OPENAI_API_KEY设置")

        # openai.OpenAI 客户端会自动处理 base_url 的默认值，如果传入 None
        # 如果 base_url 传入的是 None 或空字符串，则使用 OpenAI 默认的 API base
        # 否则，使用传入的 base_url
        effective_base_url = None
        if base_url:
            effective_base_url = base_url
        elif os.getenv("OPENAI_BASE_URL"):
            effective_base_url = os.getenv("OPENAI_BASE_URL")
        
        self.client = openai.OpenAI(api_key=self.api_key, base_url=effective_base_url)
    
    def chat_completion(self, messages: List[ChatCompletionMessageParam], temperature: float = 0.7, top_p: float = 1.0, max_tokens: Optional[int] = None) -> Any:
        """发送聊天完成请求"""
        # 处理系统提示词
        messages_to_send = list(messages)  # 创建一个副本以避免修改原始列表
        
        system_message_present = False
        if messages_to_send and messages_to_send[0].get("role") == "system":
            system_message_present = True

        if self.system_message:
            if system_message_present:
                # 更新现有的系统提示词
                messages_to_send[0]["content"] = self.system_message
            else:
                # 插入新的系统提示词
                messages_to_send.insert(0, {"role": "system", "content": self.system_message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages_to_send,  # 使用包含系统提示词的列表
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                stream=True
            )
            return response
        except Exception as e:
            raise Exception(f"API调用失败: {str(e)}")
    
    def interactive_chat(self):
        """启动交互式聊天模式"""
        print(f"🤖 OpenAI CLI 已启动 (模型: {self.model})")
        print("输入 'quit' 或 'exit' 退出，输入 'clear' 清空对话历史")
        print("-" * 50)
        
        messages: List[ChatCompletionMessageParam] = []
        # 移除此处添加system_message的逻辑，因为它已在chat_completion中处理
        
        while True:
            try:
                user_input = input("\n你: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 再见！")
                    break
                
                if user_input.lower() == 'clear':
                    messages = []
                    print("🗑️ 对话历史已清空")
                    continue
                
                if not user_input:
                    continue
                
                messages.append({"role": "user", "content": user_input})
                
                print("AI: ", end="", flush=True)
                
                response_generator = self.chat_completion(messages)
                ai_message_full = ""
                for chunk in response_generator:
                    if chunk.choices and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        print(content, end="", flush=True)
                        ai_message_full += content
                print() # Print a newline at the end of the AI's response
                messages.append({"role": "assistant", "content": ai_message_full})
                
            except KeyboardInterrupt:
                print("\n\n👋 再见！")
                break
            except Exception as e:
                print(f"\n❌ 错误: {str(e)}")
    
    def single_query(self, query: str, temperature: float = 0.7, top_p: float = 1.0, max_tokens: Optional[int] = None):
        """单次查询模式"""
        messages: List[ChatCompletionMessageParam] = []
        # 移除此处添加system_message的逻辑，因为它已在chat_completion中处理
        messages.append({"role": "user", "content": query})
        
        try:
            response_generator = self.chat_completion(messages, temperature, top_p, max_tokens)
            for chunk in response_generator:
                if chunk.choices and chunk.choices[0].delta.content:
                    print(chunk.choices[0].delta.content, end="", flush=True)
            print() # Ensure a newline at the end
        except Exception as e:
            print(f"错误: {str(e)}", file=sys.stderr)
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="OpenAI CLI - 使用litellm的纯命令行工具")
    
    # 基本参数
    parser.add_argument("--api-key", "-k", help="OpenAI API密钥")
    parser.add_argument("--base-url", "-u", help="API基础URL")
    parser.add_argument("--model", "-m", default="gpt-3.5-turbo", help="模型名称")
    
    # 查询参数
    parser.add_argument("--query", "-q", help="单次查询的问题")
    parser.add_argument("--temperature", "-t", type=float, default=1, help="温度参数 (0.0-2.0)")
    parser.add_argument("--top-p", type=float, default=0.95, help="Top-p采样参数 (0.0-1.0)")
    parser.add_argument("--max-tokens", type=int, help="最大token数")
    parser.add_argument("--system-message", "-s", help="系统提示词")
    
    # 配置文件
    parser.add_argument("--config", "-c", help="配置文件路径 (JSON格式)")
    
    args = parser.parse_args()
    
    # 加载配置文件
    config = {}
    if args.config and os.path.exists(args.config):
        try:
            with open(args.config, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except Exception as e:
            print(f"配置文件加载失败: {str(e)}", file=sys.stderr)
            sys.exit(1)
    
    # 合并配置优先级: 命令行参数 > 配置文件 > 环境变量
    api_key = args.api_key or config.get("api_key")
    base_url = args.base_url or config.get("base_url")
    model = args.model or config.get("model", "gpt-3.5-turbo")
    system_message = args.system_message or config.get("system_message")
    temperature = args.temperature or config.get("temperature", 1)
    top_p = args.top_p or config.get("top_p", 0.95)
    
    try:
        cli = OpenAICli(api_key=api_key, base_url=base_url, model=model, system_message=system_message)
        
        if args.query:
            # 单次查询模式
            cli.single_query(args.query, temperature, top_p, args.max_tokens)
        else:
            # 交互式模式
            cli.interactive_chat()
            
    except ValueError as e:
        print(f"配置错误: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"运行时错误: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()