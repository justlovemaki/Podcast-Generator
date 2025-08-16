import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// 获取 tts_providers.json 文件内容
export async function GET() {
  try {
    const configPath = path.join(process.cwd(), '..', 'config', 'tts_providers.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error reading tts_providers.json:', error);
    return NextResponse.json(
      { success: false, error: '无法读取TTS提供商配置文件' },
      { status: 500 }
    );
  }
}