import { NextRequest, NextResponse } from 'next/server';
import { fetchAndCacheProvidersLocal } from '@/lib/config-local';
import { useTranslation } from '@/i18n';
import { getLanguageFromRequest } from '@/lib/utils';


// 获取 tts_providers.json 文件内容
export async function GET(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await useTranslation(lang, 'errors');

  try {
    const config = await fetchAndCacheProvidersLocal(lang);
    console.log('重新加载并缓存 tts_providers.json 数据');
    if (!config) {
      return NextResponse.json(
        { success: false, error: t('cannot_read_tts_provider_config') },
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
      { success: false, error: t('cannot_read_tts_provider_config') },
      { status: 500 }
    );
  }
}