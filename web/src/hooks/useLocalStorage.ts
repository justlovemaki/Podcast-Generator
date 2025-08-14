import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { getItem, setItem } from '@/lib/storage';

/**
 * 一个自定义Hook，用于将组件的状态与localStorage同步。
 * 它提供了与useState类似的接口，但会将状态持久化到localStorage。
 *
 * @template T
 * @param {string} key localStorage中存储的键。
 * @param {T} initialValue 初始值，当localStorage中没有该键时使用。
 * @returns {[T, Dispatch<SetStateAction<T>>]} 返回一个状态元组，包含当前值和更新函数。
 *
 * @example
 * const [name, setName] = useLocalStorage('username', 'Guest');
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  /**
   * 从localStorage读取初始值的函数。
   * 使用函数作为useState的初始值可以确保此逻辑仅在初始渲染时执行一次。
   */
  const readValue = useCallback((): T => {
    try {
      const item = getItem<T>(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // 使用上面定义的函数来初始化state
  const [storedValue, setStoredValue] = useState<T>(readValue);

  /**
   * 创建一个包装过的setValue函数，它会同时更新state和localStorage。
   */
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        // 允许value是一个函数，以提供与useState相同的API
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        // 更新React state
        setStoredValue(valueToStore);
        // 持久化到localStorage
        setItem(key, valueToStore);
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );

  /**
   * 监听storage事件，以便在一个标签页中进行的更改可以同步到其他标签页。
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing storage change for key “${key}”:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  /**
   * 监听key或initialValue的变化，如果外部传入的key改变，需要重新读取值。
   */
  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;