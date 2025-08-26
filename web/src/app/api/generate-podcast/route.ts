import { NextRequest, NextResponse } from 'next/server';
import { startPodcastGenerationTask } from '@/lib/podcastApi';
import type { PodcastGenerationRequest } from '@/types'; // 导入 SettingsFormData
import { getSessionData } from '@/lib/server-actions';
import { getUserPoints } from '@/lib/points'; // 导入 getUserPoints
import { fetchAndCacheProvidersLocal } from '@/lib/config-local'; // 导入 getTTSProviders
import { getTranslation } from '@/i18n';
import { getLanguageFromRequest } from '@/lib/utils';


const enableTTSConfigPage = process.env.NEXT_PUBLIC_ENABLE_TTS_CONFIG_PAGE === 'true'; // 定义环境变量

export async function POST(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await getTranslation(lang, 'errors');

  const session = await getSessionData();
  const userId = session.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: t('user_not_logged_in_or_session_expired') },
      { status: 403 }
    );
  }

  try {
    const body: PodcastGenerationRequest = await request.json();

    // 参数校验
    if (!body.input_txt_content || body.input_txt_content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: t('request_body_cannot_be_empty') },
        { status: 400 }
      );
    }
    if (!body.tts_provider || body.tts_provider.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: t('tts_provider_cannot_be_empty') },
        { status: 400 }
      );
    }
    let podUsers: any[] = [];
    try {
      podUsers = JSON.parse(body.podUsers_json_content || '[]');
      if (podUsers.length === 0) {
        return NextResponse.json(
          { success: false, error: t('please_select_at_least_one_speaker') },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, error: t('invalid_speaker_config_format') },
        { status: 400 }
      );
    }
    
    // 1. 查询用户积分
    const currentPoints = await getUserPoints(userId);

    const POINTS_PER_PODCAST = parseInt(process.env.POINTS_PER_PODCAST || '10', 10); // 从环境变量获取，默认10
    // 2. 检查积分是否足够
    if (currentPoints === null || currentPoints < POINTS_PER_PODCAST) {
      return NextResponse.json(
        { success: false, error: t('insufficient_points_for_podcast', { pointsNeeded: POINTS_PER_PODCAST, currentPoints: currentPoints || 0 }) },
        { status: 402 } // 402 Forbidden - 权限不足，因为积分不足
      );
    }

    // 校验语言和时长
    const allowedLanguages = ['Chinese', 'English', 'Japanese'];
    if (!body.output_language || !allowedLanguages.includes(body.output_language)) {
      return NextResponse.json(
        { success: false, error: t('invalid_output_language') },
        { status: 400 }
      );
    }

    const allowedDurations = ['Under 5 minutes', '8-15 minutes'];
    if (!body.usetime || !allowedDurations.includes(body.usetime)) {
      return NextResponse.json(
        { success: false, error: t('invalid_podcast_duration') },
        { status: 400 }
      );
    }

    // 根据 enableTTSConfigPage 构建最终的 request
    let finalRequest: PodcastGenerationRequest;
    if (enableTTSConfigPage) {
      // 如果启用配置页面，则直接使用前端传入的 body
      if (body.tts_providers_config_content === undefined || body.api_key === undefined || body.base_url === undefined || body.model === undefined) {
        return NextResponse.json(
          { success: false, error: t('missing_frontend_tts_config') },
          { status: 400 }
        );
      }
      finalRequest = body as PodcastGenerationRequest;
     
    } else {
      // 如果未启用配置页面，则在后端获取 TTS 配置
      const settings = await fetchAndCacheProvidersLocal(lang);
      if (!settings || !settings.apikey || !settings.model) {
        return NextResponse.json(
          { success: false, error: t('incomplete_backend_tts_config') },
          { status: 500 }
        );
      }

      finalRequest = {
        input_txt_content: body.input_txt_content,
        tts_provider: body.tts_provider,
        podUsers_json_content: body.podUsers_json_content,
        usetime: body.usetime,
        output_language: body.output_language,
        tts_providers_config_content: JSON.stringify(settings),
        api_key: settings.apikey,
        base_url: settings.baseurl,
        model: settings.model,
      } as PodcastGenerationRequest;
    }
    
    const callback_url = process.env.NEXT_PUBLIC_PODCAST_CALLBACK_URL || "" // 从环境变量获取
    finalRequest.callback_url = callback_url;
    // 积分足够，继续生成播客
    const result = await startPodcastGenerationTask(finalRequest, userId, lang);

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
      { success: false, error: error.message || t('internal_server_error_default') },
      { status: statusCode }
    );
  }
}
