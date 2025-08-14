import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { ttsConfigName } = await request.json();

    if (!ttsConfigName) {
      return NextResponse.json(
        { success: false, error: '缺少 ttsConfigName 参数' },
        { status: 400 }
      );
    }

    const configPath = path.join(process.cwd(), '..', 'config', ttsConfigName);
    const configContent = await fs.readFile(configPath, 'utf-8');
    const ttsConfig = JSON.parse(configContent);

    // 假设 ttsConfig 结构中有一个 `voices` 字段
    // 如果没有，可能需要根据 ttsConfig 的 provider 调用不同的逻辑来获取声音列表
    if (ttsConfig && ttsConfig.voices) {
      // 模拟添加 sample_audio_url
      const voicesWithSampleAudio = ttsConfig.voices.map((voice: any) => ({
        ...voice,
        sample_audio_url: `${voice.audio}`, // 假设有一个示例音频路径
      }));
      return NextResponse.json({
        success: true,
        data: voicesWithSampleAudio,
      });
    } else {
      return NextResponse.json(
        { success: false, error: '未找到声音配置' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching TTS voices:', error);
    return NextResponse.json(
      { success: false, error: '无法获取TTS声音列表' },
      { status: 500 }
    );
  }
}