import { NextRequest, NextResponse } from 'next/server';
import { getPodcastStatus } from '@/lib/podcastApi';
import { getSessionData } from '@/lib/server-actions';
import { useTranslation } from '@/i18n';
import { getLanguageFromRequest } from '@/lib/utils';

export const revalidate = 0; // 等同于 `cache: 'no-store'`

export async function GET(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await useTranslation(lang, 'errors');

  const session = await getSessionData();
  const userId = session.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: t('user_not_logged_in_or_session_expired') },
      { status: 403 }
    );
  }

  const result = await getPodcastStatus(userId, lang);
  if (result.success) {
    return NextResponse.json({
      success: true,
      ...result.data, // 展开 result.data，因为它已经是 PodcastStatusResponse 类型
    });
  } else {
    console.log('获取任务状态失败', result);
    return NextResponse.json(
      { success: false, error: result.error || t('failed_to_get_task_status') },
      { status: result.statusCode || 500 }
    );
  }
}