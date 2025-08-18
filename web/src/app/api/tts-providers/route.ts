import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// 定义缓存变量和缓存过期时间
let ttsProvidersCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟，单位毫秒

// 获取 tts_providers.json 文件内容
export async function GET() {
  try {
    const now = Date.now();

    // 检查缓存是否有效
    if (ttsProvidersCache && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('从缓存中返回 tts_providers.json 数据');
      return NextResponse.json({
        success: true,
        data: ttsProvidersCache,
      });
    }

    // 缓存无效或不存在，读取文件并更新缓存
    const configPath = path.join(process.cwd(), '..', 'config', 'tts_providers.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // 更新缓存
    ttsProvidersCache = config;
    cacheTimestamp = now;
    console.log('重新加载并缓存 tts_providers.json 数据');

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