import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { TTSConfig } from '@/types';
import { getTranslation } from '@/i18n'; // 导入 getTranslation
import { getLanguageFromRequest } from '@/lib/utils';

// 缓存对象，存储响应数据和时间戳
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

function getCache(key: string) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  // 检查缓存是否过期
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key); // 缓存过期，删除
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

const TTS_PROVIDER_ORDER = [
  'edge-tts',
  'doubao-tts',
  'minimax',
  'fish-audio',
  'gemini-tts',
  'index-tts',
];

// 获取配置文件列表
export async function GET(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await getTranslation(lang, 'errors'); // 加载 'errors' 命名空间的翻译
  
  const cacheKey = `config_files_list_${lang}`; // 缓存键中包含语言
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log('Returning config files list from cache.');
    return NextResponse.json({
      success: true,
      data: cachedData,
    });
  }

  try {
    const configDir = path.join(process.cwd(), '..', 'config');
    const files = await fs.readdir(configDir);
    
    const configFiles = files
      .filter(file => file.endsWith('.json') && !file.includes('tts_providers'))
      .map(file => ({
        name: file,
        displayName: file.replace('.json', ''),
        path: file,
      }));

    // 根据预定义顺序排序
    configFiles.sort((a, b) => {
      const aName = a.name.replace('.json', '');
      const bName = b.name.replace('.json', '');
      const aIndex = TTS_PROVIDER_ORDER.indexOf(aName);
      const bIndex = TTS_PROVIDER_ORDER.indexOf(bName);
      
      // 未知提供商排在已知提供商之后，并保持其相对顺序
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

    setCache(cacheKey, configFiles); // 存储到缓存

    return NextResponse.json({
      success: true,
      message: t('config_files_list_success'), // 添加多语言消息
      data: configFiles,
    });
  } catch (error) {
    console.error('Error reading config directory:', error);
    return NextResponse.json(
      { success: false, error: t('config_files_list_error') }, // 使用翻译的错误消息
      { status: 500 }
    );
  }
}

// 获取特定配置文件内容
export async function POST(request: NextRequest) {
  const lang = getLanguageFromRequest(request);
  const { t } = await getTranslation(lang, 'errors'); // 加载 'errors' 命名空间的翻译

  const { configFile } = await request.json();
  const cacheKey = `config_file_${configFile}_${lang}`; // 缓存键中包含语言
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    console.log(`Returning config file "${configFile}" from cache.`);
    return NextResponse.json({
      success: true,
      data: cachedData,
    });
  }

  try {
    if (!configFile || !configFile.endsWith('.json')) {
      return NextResponse.json(
        { success: false, error: t('invalid_config_file_name') }, // 使用翻译的错误消息
        { status: 400 }
      );
    }

    const configPath = path.join(process.cwd(), '..', 'config', configFile);
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config: TTSConfig = JSON.parse(configContent);

    setCache(cacheKey, config); // 存储到缓存

    return NextResponse.json({
      success: true,
      message: t('config_file_read_success'), // 添加多语言消息
      data: config,
    });
  } catch (error) {
    console.error('Error reading config file:', error);
    return NextResponse.json(
      { success: false, error: t('read_config_file_error') }, // 使用翻译的错误消息
      { status: 500 }
    );
  }
}