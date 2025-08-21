import { NextRequest, NextResponse } from 'next/server';
import { fetchAndCacheProvidersLocal } from '@/lib/config-local';

// 获取 tts_providers.json 文件内容
export async function GET() {
  try {
    const config = await fetchAndCacheProvidersLocal();
    console.log('重新加载并缓存 tts_providers.json 数据');
    if (!config) {
      return NextResponse.json(
        { success: false, error: '无法读取TTS提供商配置文件' },
        { status: 500 }
      );
    }

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