import { NextRequest, NextResponse } from 'next/server';
import { startPodcastGenerationTask } from '@/lib/podcastApi';
import type { PodcastGenerationRequest } from '@/types';
import { getSessionData } from '@/lib/server-actions';
import { getUserPoints } from '@/lib/points'; // 导入 getUserPoints

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  const userId = session.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: '用户未登录或会话已过期' },
      { status: 403 }
    );
  }

  try {
    const body: PodcastGenerationRequest = await request.json();
    
    // 1. 查询用户积分
    const currentPoints = await getUserPoints(userId);

    const POINTS_PER_PODCAST = parseInt(process.env.POINTS_PER_PODCAST || '10', 10); // 从环境变量获取，默认10
    // 2. 检查积分是否足够
    if (currentPoints === null || currentPoints < POINTS_PER_PODCAST) {
      return NextResponse.json(
        { success: false, error: `积分不足，生成一个播客需要 ${POINTS_PER_PODCAST} 积分，您当前只有 ${currentPoints || 0} 积分。` },
        { status: 403 } // 403 Forbidden - 权限不足，因为积分不足
      );
    }

    // 积分足够，继续生成播客
    const result = await startPodcastGenerationTask(body, userId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 } // Use 400 for client-side errors, or 500 for internal server errors
      );
    }

  } catch (error: any) {
    console.error('Error in generate-podcast API:', error);
    const statusCode = error.statusCode || 500; // 假设 HttpError 会有 statusCode 属性
    return NextResponse.json(
      { success: false, error: error.message || '服务器内部错误' },
      { status: statusCode }
    );
  }
}
