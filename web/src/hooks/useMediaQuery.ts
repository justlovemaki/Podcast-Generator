import { useState, useEffect } from 'react';

// 定义 Tailwind CSS 的断点，这里只关注 sm (640px)
const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * 一个用于检测媒体查询的React Hook。
 * @param query 媒体查询字符串，例如 "(min-width: 640px)"
 * @returns boolean 指示媒体查询是否匹配
 */
export function useMediaQuery(query: string): boolean {
  // 客户端渲染时，初始状态根据 window.matchMedia 确定
  // 服务端渲染时，初始状态设为 false，防止 Hydration 错误
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 添加监听器
    mediaQueryList.addEventListener('change', listener);

    // 组件卸载时移除监听器
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]); // 仅在 query 变化时重新设置监听器

  return matches;
}

// 导出常用媒体查询 Hook
export const useIsSmallScreen = () => useMediaQuery(`(max-width: ${screens.sm})`);
export const useIsMediumScreen = () => useMediaQuery(`(min-width: ${screens.md})`);