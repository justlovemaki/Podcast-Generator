import { NextRequest, NextResponse } from 'next/server';
import { getPodcastStatus } from '@/lib/podcastApi';

export const revalidate = 0; // 等同于 `cache: 'no-store'`

export async function GET(request: NextRequest) {
  const result = await getPodcastStatus();
  if (result.success) {
    return NextResponse.json({
      success: true,
      ...result.data, // 展开 result.data，因为它已经是 PodcastStatusResponse 类型
    });
  } else {
    return NextResponse.json(
      { success: false, error: result.error || '获取任务状态失败' },
      { status: result.statusCode || 500 }
    );
  }
}