import { getItem } from './storage';

const SETTINGS_STORAGE_KEY = 'podcast-settings';
const enableTTSConfigPage = process.env.NEXT_PUBLIC_ENABLE_TTS_CONFIG_PAGE === 'true';

let ttsProvidersPromise: Promise<any> | null = null;

/**
 * 获取TTS提供商的配置
 * 如果启用了配置页面，则从localStorage获取；
 * 否则，从服务器的默认配置文件中获取。
 * 通过缓存Promise来防止并发请求，并缓存成功的结果。
 * @returns {Promise<any>} 返回包含配置信息的对象，如果失败则返回null。
 */
const fetchAndCacheProviders = (): Promise<any> => {
  return (async () => {
    try {
      const response = await fetch('/api/tts-providers');
      if (!response.ok) {
        console.error('Failed to fetch tts-providers, status:', response.status);
        ttsProvidersPromise = null; // 失败时重置，以便重试
        return null;
      }
      const result = await response.json();
      if (result.success) {
        return result.data; // 成功获取后，缓存数据
      }
      ttsProvidersPromise = null; // 业务失败时重置，以便重试
      return null;
    } catch (error) {
      console.error('Failed to fetch tts-providers:', error);
      ttsProvidersPromise = null; // 失败时重置，以便重试
      return null;
    }
  })();
};

export const getTTSProviders = async (): Promise<any> => {
  if (enableTTSConfigPage) {
    return getItem<any>(SETTINGS_STORAGE_KEY);
  } else {
    // 1. 如果没有并发请求，则发起新请求
    if (!ttsProvidersPromise) {
      ttsProvidersPromise = fetchAndCacheProviders();
    }

    // 2. 返回 Promise，后续调用将复用此 Promise 直到其解决
    return ttsProvidersPromise;
  }
};