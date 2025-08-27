import { NextRequest, NextResponse } from 'next/server';
import { fetchAndCacheProvidersLocal } from '@/lib/config-local';
import { getTranslation } from '@/i18n';
import { getLanguageFromRequest } from '@/lib/utils';
import type { SettingsFormData } from '@/types';


// 获取 tts_providers.json 文件内容
export async function GET(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await getTranslation(lang, 'errors');

  try {
    const config = await fetchAndCacheProvidersLocal(lang) as SettingsFormData;
    console.log('重新加载并缓存 tts_providers.json 数据');
    if (!config) {
      return NextResponse.json(
        { success: false, error: t('cannot_read_tts_provider_config') },
        { status: 500 }
      );
    }

    config.apikey = "";
    config.baseurl = "";
    config.model = "";
    config.index.api_url = !!config.index.api_url ? "1" : "";
    config.edge.api_url = !!config.edge.api_url ? "1" : "";
    config.doubao['X-Api-App-Id'] = !!config.doubao['X-Api-App-Id'] ? "1" : "";
    config.doubao['X-Api-Access-Key'] = !!config.doubao['X-Api-Access-Key'] ? "1" : "";
    config.fish.api_key = !!config.fish.api_key ? "1" : "";
    config.minimax.group_id = !!config.minimax.group_id ? "1" : "";
    config.minimax.api_key = !!config.minimax.api_key ? "1" : "";
    config.gemini.api_key = !!config.gemini.api_key ? "1" : "";
    
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