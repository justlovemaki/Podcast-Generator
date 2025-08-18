import { HttpError } from '@/types';
import type { PodcastGenerationRequest, PodcastGenerationResponse, ApiResponse, PodcastStatusResponse } from '@/types';
import { db } from "@/lib/database";
import * as schema from "../../drizzle-schema";
import { eq } from "drizzle-orm";

const API_BASE_URL = process.env.NEXT_PUBLIC_PODCAST_API_BASE_URL || 'http://192.168.1.232:8000';

/**
 * 启动播客生成任务
 */
export async function startPodcastGenerationTask(body: PodcastGenerationRequest, userId: string): Promise<ApiResponse<PodcastGenerationResponse>> {

  try {
    const response = await fetch(`${API_BASE_URL}/generate-podcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Id': userId,
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
export async function getPodcastStatus(userId: string): Promise<ApiResponse<PodcastStatusResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/podcast-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Id': userId,
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

/**
 * 处理 GET 请求，用于查询后端 FastAPI 应用的 /get-audio-info 接口。
 * 
 * @param req NextRequest 对象，包含请求信息，如查询参数 file_name。
 * @returns 返回从 FastAPI 后端获取的音频信息，或错误响应。
 */
export async function getAudioInfo(fileName: string) {

    if (!fileName) {
        return { success: false, error: '缺少 file_name 查询参数', statusCode: 400 };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/get-audio-info?file_name=${encodeURIComponent(fileName)}`);

        if (!response.ok) {
            // 如果后端返回错误状态码，则转发错误信息
            const errorData = await response.json();
            return { success: false, error: errorData.detail || '获取音频信息失败', statusCode: response.status };
        }

        const result: PodcastGenerationResponse = await response.json();
        result.audioUrl = `/api/audio?filename=${result.output_audio_filepath}`;
        return { success: true, data: result };
    } catch (error) {
        console.error('代理 /get-audio-info 失败:', error);
        return { success: false, error: ' 无法连接到后端服务或内部服务器错误 查询参数', statusCode: 500 };
    }
}

/**
 * 根据用户ID查询用户信息。
 * @param userId 用户ID
 * @returns Promise<ApiResponse<typeof schema.user.$inferSelect | null>> 返回用户信息或null
 */
export async function getUserInfo(userId: string): Promise<ApiResponse<typeof schema.user.$inferSelect | null>> {
    try {
        const userInfo = await db
            .select()
            .from(schema.user)
            .where(eq(schema.user.id, userId))
            .limit(1);

        if (userInfo.length > 0) {
            return { success: true, data: userInfo[0] };
        } else {
            return { success: true, data: null }; // 用户不存在
        }
    } catch (error: any) {
        console.error(`获取用户 ${userId} 信息失败:`, error);
        return { success: false, error: error.message || '获取用户信息失败', statusCode: 500 };
    }
}