import { NextRequest, NextResponse } from 'next/server';
import { startPodcastGenerationTask } from '@/lib/podcastApi';
import type { PodcastGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: PodcastGenerationRequest = await request.json();
    const result = await startPodcastGenerationTask(body);

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
