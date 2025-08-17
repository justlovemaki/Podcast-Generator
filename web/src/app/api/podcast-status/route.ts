import { NextRequest, NextResponse } from 'next/server';
import { getPodcastStatus } from '@/lib/podcastApi';
import { getSessionData } from '@/lib/server-actions';

export const revalidate = 0; // 等同于 `cache: 'no-store'`

export async function GET(request: NextRequest) {
  const session = await getSessionData();
  const userId = session.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: '用户未登录或会话已过期' },
      { status: 403 }
    );
  }

  const result = await getPodcastStatus(userId);
  if (result.success) {
    return NextResponse.json({
      success: true,
      ...result.data, // 展开 result.data，因为它已经是 PodcastStatusResponse 类型
    });
  } else {
    console.log('获取任务状态失败', result);
    return NextResponse.json(
      { success: false, error: result.error || '获取任务状态失败' },
      { status: result.statusCode || 500 }
    );
  }
}