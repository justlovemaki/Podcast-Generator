import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { TTSConfig } from '@/types';

// 获取配置文件列表
export async function GET() {
  try {
    const configDir = path.join(process.cwd(), '..', 'config');
    const files = await fs.readdir(configDir);
    
    const configFiles = files
      .filter(file => file.endsWith('.json') && !file.includes('tts_providers'))
      .map(file => ({
        name: file,
        displayName: file.replace('.json', ''),
        path: file,
      }));

    return NextResponse.json({
      success: true,
      data: configFiles,
    });
  } catch (error) {
    console.error('Error reading config directory:', error);
    return NextResponse.json(
      { success: false, error: '无法读取配置目录' },
      { status: 500 }
    );
  }
}

// 获取特定配置文件内容
export async function POST(request: NextRequest) {
  try {
    const { configFile } = await request.json();
    
    if (!configFile || !configFile.endsWith('.json')) {
      return NextResponse.json(
        { success: false, error: '无效的配置文件名' },
        { status: 400 }
      );
    }

    const configPath = path.join(process.cwd(), '..', 'config', configFile);
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config: TTSConfig = JSON.parse(configContent);

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error reading config file:', error);
    return NextResponse.json(
      { success: false, error: '无法读取配置文件' },
      { status: 500 }
    );
  }
}