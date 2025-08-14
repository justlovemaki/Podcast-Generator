/**
 * 检查当前是否在浏览器环境中
 * @returns {boolean} 如果是浏览器环境则返回 true, 否则返回 false.
 */
const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * 向 localStorage 中存储数据。
 * 数据会以 JSON 格式进行序列化。
 * @template T
 * @param {string} key - 存储项的键。
 * @param {T} value - 要存储的值。
 */
export function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) {
    console.warn(`Attempted to set localStorage item in a non-browser environment. Key: "${key}"`);
    return;
  }
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting item "${key}" to localStorage:`, error);
  }
}

/**
 * 从 localStorage 中获取数据。
 * 数据会自动从 JSON 格式进行反序列化。
 * @template T
 * @param {string} key - 要获取项的键。
 * @returns {T | null} 如果找到并成功解析则返回数据，否则返回 null。
 */
export function getItem<T>(key: string): T | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return null;
    }
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage:`, error);
    // 如果解析失败，为防止应用崩溃，可以选择删除该项
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * 从 localStorage 中移除一个数据项。
 * @param {string} key - 要移除项的键。
 */
export function removeItem(key: string): void {
  if (!isBrowser()) {
    console.warn(`Attempted to remove localStorage item in a non-browser environment. Key: "${key}"`);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item "${key}" from localStorage:`, error);
  }
}

/**
 * 清空所有 localStorage 中的数据。
 * 请谨慎使用此功能。
 */
export function clearAll(): void {
  if (!isBrowser()) {
    console.warn('Attempted to clear localStorage in a non-browser environment.');
    return;
  }
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}