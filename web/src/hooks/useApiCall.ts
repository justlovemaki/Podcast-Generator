import { useRef, useCallback } from 'react';

/**
 * 防止重复API调用的自定义Hook
 * 通过防抖机制确保在短时间内多次调用时只执行最后一次
 */
export function useApiCall() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCallingRef = useRef<boolean>(false);

  const callApi = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    delay: number = 300
  ): Promise<T | null> => {
    // 如果正在调用中，取消之前的调用
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 如果已经在调用中，直接返回null
    if (isCallingRef.current) {
      return null;
    }

    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          isCallingRef.current = true;
          const result = await apiFunction();
          resolve(result);
        } catch (error) {
          console.error('API call failed:', error);
          resolve(null);
        } finally {
          isCallingRef.current = false;
        }
      }, delay);
    });
  }, []);

  const cancelPendingCall = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isCallingRef.current = false;
  }, []);

  return { callApi, cancelPendingCall };
}

/**
 * 防止重复调用的简单Hook
 * 使用标志位确保同一时间只有一个调用在进行
 */
export function usePreventDuplicateCall() {
  const isCallingRef = useRef<boolean>(false);

  const executeOnce = useCallback(async <T>(
    apiFunction: () => Promise<T>
  ): Promise<T | null> => {
    if (isCallingRef.current) {
      console.log('API call already in progress, skipping...');
      return null;
    }

    try {
      isCallingRef.current = true;
      const result = await apiFunction();
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      return null;
    } finally {
      isCallingRef.current = false;
    }
  }, []);

  return { executeOnce, isExecuting: isCallingRef.current };
}