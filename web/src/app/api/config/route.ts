import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { TTSConfig } from '@/types';

const TTS_PROVIDER_ORDER = [
  'edge-tts',
  'doubao-tts',
  'minimax',
  'fish-audio',
  'gemini-tts',
  'index-tts',
];

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

    // 根据预定义顺序排序
    configFiles.sort((a, b) => {
      const aName = a.name.replace('.json', '');
      const bName = b.name.replace('.json', '');
      const aIndex = TTS_PROVIDER_ORDER.indexOf(aName);
      const bIndex = TTS_PROVIDER_ORDER.indexOf(bName);
      
      // 未知提供商排在已知提供商之后，并保持其相对顺序
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

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