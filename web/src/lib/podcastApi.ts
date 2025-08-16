import { HttpError } from '@/types';
import type { PodcastGenerationRequest, PodcastGenerationResponse, ApiResponse, PodcastStatusResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_PODCAST_API_BASE_URL || 'http://192.168.1.232:8000';

/**
 * 启动播客生成任务
 */
export async function startPodcastGenerationTask(body: PodcastGenerationRequest): Promise<ApiResponse<PodcastGenerationResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-podcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Id': '7788414',
      },
      body: new URLSearchParams(Object.entries(body).map(([key, value]) => [key, String(value)])),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `请求失败，状态码: ${response.status}` }));
      throw new HttpError(errorData.detail || `请求失败，状态码: ${response.status}`, response.status);
    }

    const result: PodcastGenerationResponse = await response.json();
    // 确保id字段存在，因为它在前端被广泛使用
    result.id = result.task_id;
    return { success: true, data: result };

  } catch (error: any) {
    console.error('Error in startPodcastGenerationTask:', error);
    const statusCode = error instanceof HttpError ? error.statusCode : undefined;
    return { success: false, error: error.message || '启动生成任务失败', statusCode };
  }
}

/**
 * 获取播客生成任务状态
 */
export async function getPodcastStatus(): Promise<ApiResponse<PodcastStatusResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/podcast-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Id': '7788414',
      },
      cache: 'no-store', // 禁用客户端缓存
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `请求失败，状态码: ${response.status}` }));
      throw new HttpError(errorData.detail || `请求失败，状态码: ${response.status}`, response.status);
    }

    const result: PodcastStatusResponse = await response.json();
    result.tasks.forEach(item => {
      item.audioUrl = `/api/audio?filename=${item.output_audio_filepath}`;
    })
    return { success: true, data: result };

  } catch (error: any) {
    console.error('Error in getPodcastStatus:', error);
    const statusCode = error instanceof HttpError ? error.statusCode : undefined;
    return { success: false, error: error.message || '获取任务状态失败', statusCode };
  }
}