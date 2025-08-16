/**
 * API调用追踪器 - 用于调试和监控API调用
 * 在开发环境中帮助识别重复调用问题
 */

interface ApiCall {
  url: string;
  method: string;
  timestamp: number;
  id: string;
}

class ApiCallTracker {
  private calls: ApiCall[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';

  // 记录API调用
  trackCall(url: string, method: string = 'GET'): string {
    if (!this.isDevelopment) return '';

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const call: ApiCall = {
      url,
      method,
      timestamp: Date.now(),
      id
    };

    this.calls.push(call);
    
    // 检查是否有重复调用（5秒内相同URL和方法）
    const recentCalls = this.calls.filter(
      c => c.url === url && 
           c.method === method && 
           Date.now() - c.timestamp < 5000 &&
           c.id !== id
    );

    if (recentCalls.length > 0) {
      console.warn(`🚨 检测到重复API调用:`, {
        url,
        method,
        重复次数: recentCalls.length + 1,
        最近调用时间: recentCalls.map(c => new Date(c.timestamp).toLocaleTimeString())
      });
    } else {
      console.log(`📡 API调用:`, { url, method, time: new Date().toLocaleTimeString() });
    }

    // 清理超过1分钟的记录
    this.calls = this.calls.filter(c => Date.now() - c.timestamp < 60000);
    
    return id;
  }

  // 获取调用统计
  getStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.calls.forEach(call => {
      const key = `${call.method} ${call.url}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    return stats;
  }

  // 清空记录
  clear(): void {
    this.calls = [];
  }
}

// 创建全局实例
export const apiCallTracker = new ApiCallTracker();

// 包装fetch函数以自动追踪
export const trackedFetch = (url: string, options?: RequestInit) => {
  const method = options?.method || 'GET';
  apiCallTracker.trackCall(url, method);
  return fetch(url, options);
};

// 开发环境下的调试工具
export const showApiStats = () => {
  if (process.env.NODE_ENV === 'development') {
    console.table(apiCallTracker.getStats());
  }
};

// 在控制台暴露调试工具
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).apiDebug = {
    showStats: showApiStats,
    clearStats: () => apiCallTracker.clear(),
    tracker: apiCallTracker
  };
}