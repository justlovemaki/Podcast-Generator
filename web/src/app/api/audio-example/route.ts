import { NextRequest, NextResponse } from 'next/server';
import { getLanguageFromRequest } from '@/lib/utils';
import { getTranslation } from '@/i18n';
import { fetchAndCacheProvidersLocal } from '@/lib/config-local';

export async function GET(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await getTranslation(lang, 'errors');
  
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('t');
  const voiceCode = searchParams.get('v');
  const providerKey = searchParams.get('p'); // 从URL参数p获取providerKey
  
  // 验证必需参数
  if (!text || !voiceCode || !providerKey) {
    return NextResponse.json(
      { error: t('invalid_request_parameters')},
      { status: 400 }
    );
  }
  
  try {
    // 获取TTS提供商配置
    const config = await fetchAndCacheProvidersLocal(lang);
    if (!config) {
      return NextResponse.json(
        { error: t('cannot_read_tts_provider_config') },
        { status: 500 }
      );
    }
    
    // 检查配置中是否存在对应的提供商
    if (!config[providerKey] || !config[providerKey].api_url) {
      return NextResponse.json(
        { error: t('invalid_provider')},
        { status: 400 }
      );
    }
    
    // 构建目标URL
    const templateUrl = config[providerKey].api_url;
    const targetUrl = templateUrl
      .replace('{{text}}', encodeURIComponent(text))
      .replace('{{voiceCode}}', encodeURIComponent(voiceCode));
    
    // 发起请求到目标服务器
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'PodcastHub/1.0'
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      console.error(`TTS API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: t('internal_server_error') },
        { status: response.status }
      );
    }
    
    // 获取响应内容类型
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    
    // 将响应转换为流并返回
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error: any) {
    console.error('Error in audio-example API:', error);
    return NextResponse.json(
      { error: t('internal_server_error') },
      { status: 500 }
    );
  }
}