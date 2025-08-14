import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { generateId } from '@/lib/utils';
import type { PodcastGenerationRequest, PodcastGenerationResponse } from '@/types';

// 存储生成任务的状态
const generationTasks = new Map<string, PodcastGenerationResponse>();

export async function POST(request: NextRequest) {
  try {
    const body: PodcastGenerationRequest = await request.json();
    
    // 验证请求数据
    if (!body.topic || !body.topic.trim()) {
      return NextResponse.json(
        { success: false, error: '请提供播客主题' },
        { status: 400 }
      );
    }

    // 生成任务ID
    const taskId = generateId();
    
    // 初始化任务状态
    const task: PodcastGenerationResponse = {
      id: taskId,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      estimatedTime: getEstimatedTime(body.duration),
    };
    
    generationTasks.set(taskId, task);

    // 异步启动Python脚本
    startPodcastGeneration(taskId, body);

    return NextResponse.json({
      success: true,
      data: task,
    });

  } catch (error) {
    console.error('Error in generate-podcast API:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('id');

  if (!taskId) {
    return NextResponse.json(
      { success: false, error: '缺少任务ID' },
      { status: 400 }
    );
  }

  const task = generationTasks.get(taskId);
  if (!task) {
    return NextResponse.json(
      { success: false, error: '任务不存在' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: task,
  });
}

async function startPodcastGeneration(taskId: string, request: PodcastGenerationRequest) {
  try {
    // 更新任务状态
    updateTaskStatus(taskId, 'generating_outline', 10);

    // 准备输入文件
    const inputContent = prepareInputContent(request);
    const inputFilePath = path.join(process.cwd(), '..', 'input.txt');
    await fs.writeFile(inputFilePath, inputContent, 'utf-8');

    // 如果有TTS配置，写入配置文件
    let configPath = '';
    if (request.ttsConfig) {
      // 查找匹配的配置文件
      const configDir = path.join(process.cwd(), '..', 'config');
      const configFiles = await fs.readdir(configDir);
      const matchingConfig = configFiles.find(file => 
        file.endsWith('.json') && 
        !file.includes('tts_providers') &&
        file.includes(request.ttsConfig?.tts_provider || '')
      );
      
      if (matchingConfig) {
        configPath = path.join(configDir, matchingConfig);
      }
    }

    // 构建Python命令参数
    const pythonScriptPath = path.join(process.cwd(), '..', 'podcast_generator.py');
    const args = [
      pythonScriptPath,
      '--threads', '2', // 使用2个线程加速生成
    ];

    // 如果有环境变量中的API配置，添加到参数中
    if (process.env.OPENAI_API_KEY) {
      args.push('--api-key', process.env.OPENAI_API_KEY);
    }
    if (process.env.OPENAI_BASE_URL) {
      args.push('--base-url', process.env.OPENAI_BASE_URL);
    }
    if (process.env.OPENAI_MODEL) {
      args.push('--model', process.env.OPENAI_MODEL);
    }

    // 启动Python进程
    const pythonProcess = spawn('python', args, {
      cwd: path.join(process.cwd(), '..'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let outputBuffer = '';
    let errorBuffer = '';

    pythonProcess.stdout.on('data', (data) => {
      outputBuffer += data.toString();
      // 解析输出来更新进度
      parseProgressFromOutput(taskId, outputBuffer);
    });

    pythonProcess.stderr.on('data', (data) => {
      errorBuffer += data.toString();
      console.error('Python stderr:', data.toString());
    });

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        // 生成成功，查找输出文件
        try {
          const outputDir = path.join(process.cwd(), '..', 'output');
          const files = await fs.readdir(outputDir);
          const audioFile = files.find(file => file.endsWith('.wav'));
          
          if (audioFile) {
            const audioUrl = `/api/audio/${audioFile}`;
            updateTaskStatus(taskId, 'completed', 100, undefined, audioUrl);
          } else {
            updateTaskStatus(taskId, 'error', 100, '未找到生成的音频文件');
          }
        } catch (error) {
          updateTaskStatus(taskId, 'error', 100, '处理输出文件时出错');
        }
      } else {
        updateTaskStatus(taskId, 'error', 100, `生成失败: ${errorBuffer}`);
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python process error:', error);
      updateTaskStatus(taskId, 'error', 100, `进程启动失败: ${error.message}`);
    });

  } catch (error) {
    console.error('Error starting podcast generation:', error);
    updateTaskStatus(taskId, 'error', 100, `启动生成任务失败: ${error}`);
  }
}

function updateTaskStatus(
  taskId: string, 
  status: PodcastGenerationResponse['status'], 
  progress: number,
  error?: string,
  audioUrl?: string
) {
  const task = generationTasks.get(taskId);
  if (task) {
    task.status = status;
    task.progress = progress;
    if (error) task.error = error;
    if (audioUrl) task.audioUrl = audioUrl;
    generationTasks.set(taskId, task);
  }
}

function parseProgressFromOutput(taskId: string, output: string) {
  // 根据Python脚本的输出解析进度
  // 这里需要根据实际的Python脚本输出格式来调整
  
  if (output.includes('生成播客大纲')) {
    updateTaskStatus(taskId, 'generating_outline', 20);
  } else if (output.includes('生成播客脚本')) {
    updateTaskStatus(taskId, 'generating_script', 40);
  } else if (output.includes('生成音频')) {
    updateTaskStatus(taskId, 'generating_audio', 60);
  } else if (output.includes('合并音频')) {
    updateTaskStatus(taskId, 'merging', 80);
  }
}

function prepareInputContent(request: PodcastGenerationRequest): string {
  let content = request.topic;
  
  if (request.customInstructions) {
    content += '\n\n```custom-begin\n' + request.customInstructions + '\n```custom-end';
  }
  
  // 添加其他配置信息
  content += '\n\n```config\n';
  content += `语言: ${request.language || 'zh-CN'}\n`;
  content += `风格: ${request.style || 'casual'}\n`;
  content += `时长: ${request.duration || 'medium'}\n`;
  content += `说话人数量: ${request.speakers || 2}\n`;
  content += '```';
  
  return content;
}

function getEstimatedTime(duration?: string): number {
  // 根据时长估算生成时间（秒）
  switch (duration) {
    case 'short': return 120; // 2分钟
    case 'medium': return 300; // 5分钟
    case 'long': return 600; // 10分钟
    default: return 300;
  }
}