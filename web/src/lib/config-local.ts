'use server'
import path from 'path';
import fs from 'fs/promises';

// 获取 tts_providers.json 文件内容
export async function fetchAndCacheProvidersLocal(lang: string) {
  try {

    // 缓存无效或不存在，读取文件并更新缓存
    const ttsProvidersName = process.env.TTS_PROVIDERS_NAME;
    if (!ttsProvidersName) {
      throw new Error('TTS_PROVIDERS_NAME 环境变量未设置');
    }
    const configPath = path.join(process.cwd(), '..', 'config', ttsProvidersName);
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    if(!config) {
      console.log('Error reading tts_providers.json, Empty')
      return null
    }

    return config
  } catch (error) {
    console.error('Error reading tts_providers.json:', error);
    return null
  }
}