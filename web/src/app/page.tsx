'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PodcastCreator from '@/components/PodcastCreator';
import ContentSection from '@/components/ContentSection';
import AudioPlayer from '@/components/AudioPlayer';
import SettingsForm from '@/components/SettingsForm';
import { ToastContainer, useToast } from '@/components/Toast';
import { usePreventDuplicateCall } from '@/hooks/useApiCall';
import { trackedFetch } from '@/utils/apiCallTracker';
import type { PodcastGenerationRequest, PodcastItem, UIState, PodcastGenerationResponse, SettingsFormData } from '@/types';
import { getTTSProviders } from '@/lib/config';
import { useSession, signOut } from 'next-auth/react'; // 导入 useSession 和 signOut
import LoginModal from '@/components/LoginModal'; // 导入 LoginModal

const enableTTSConfigPage = process.env.NEXT_PUBLIC_ENABLE_TTS_CONFIG_PAGE === 'true';

export default function HomePage() {
  const { toasts, success, error, warning, info, removeToast } = useToast();
  const { executeOnce } = usePreventDuplicateCall();

  const [uiState, setUIState] = useState<UIState>({
    sidebarCollapsed: true,
    currentView: 'home',
    theme: 'light',
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // 控制登录模态框的显示

  const [isGenerating, setIsGenerating] = useState(false);
  const [libraryPodcasts, setLibraryPodcasts] = useState<PodcastItem[]>([]);
  const [explorePodcasts, setExplorePodcasts] = useState<PodcastItem[]>([]);
  const [credits, setCredits] = useState(0); // 积分状态
  const [settings, setSettings] = useState<SettingsFormData | null>(null); // 加载设置的状态

  // 音频播放器状态
  const [currentPodcast, setCurrentPodcast] = useState<PodcastItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  

  // 模拟从后端获取积分数据和初始化数据加载
  useEffect(() => {
    // 实际应用中，这里会发起API请求获取用户积分
    // 例如：fetch('/api/user/credits').then(res => res.json()).then(data => setCredits(data.credits));
    setCredits(100000); // 模拟初始积分100
    
    // 首次加载时获取播客列表
    fetchRecentPodcasts();
    
    // 设置定时器每20秒刷新一次
    const interval = setInterval(() => {
      fetchRecentPodcasts();
    }, 20000);

    // 清理定时器
    return () => clearInterval(interval);
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getTTSProviders();
      if (savedSettings) {
        // 确保从 localStorage 加载的设置中，所有预期的字符串字段都为字符串
        const normalizedSettings: SettingsFormData = {
          apikey: savedSettings.apikey || '',
          model: savedSettings.model || '',
          baseurl: savedSettings.baseurl || '',
          index: {
            api_url: savedSettings.index?.api_url || '',
          },
          edge: {
            api_url: savedSettings.edge?.api_url || '',
          },
          doubao: {
            'X-Api-App-Id': savedSettings.doubao?.['X-Api-App-Id'] || '',
            'X-Api-Access-Key': savedSettings.doubao?.['X-Api-Access-Key'] || '',
          },
          fish: {
            api_key: savedSettings.fish?.api_key || '',
          },
          minimax: {
            group_id: savedSettings.minimax?.group_id || '',
            api_key: savedSettings.minimax?.api_key || '',
          },
          gemini: {
            api_key: savedSettings.gemini?.api_key || '',
          },
        };
        setSettings(normalizedSettings);
      }
    };

    loadSettings(); // 页面加载时加载一次
    if(enableTTSConfigPage){
      window.addEventListener('settingsUpdated', loadSettings as EventListener); // 监听设置更新事件
    }
    // 清理事件监听器
    return () => {
      if(enableTTSConfigPage){
        window.removeEventListener('settingsUpdated', loadSettings as EventListener);
      }
    };
  }, []);


  const handleViewChange = (view: string) => {
    setUIState(prev => ({ ...prev, currentView: view as UIState['currentView'] }));
  };

  const handleToggleSidebar = () => {
    setUIState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };
  
  const handleToggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  const handlePodcastGeneration = async (request: PodcastGenerationRequest) => {
    setIsGenerating(true);
    
    try {
      // info('开始生成播客', '正在处理您的请求...');
      
      if (!settings || !settings.apikey || !settings.model) {
        error('配置错误', 'API Key 或模型未设置，请前往设置页填写。');
        setIsGenerating(false);
        return;
      }

      // 直接发送JSON格式的请求体
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if(response.status === 401) { 
          throw new Error('生成播客失败，请检查API Key是否正确');
        }
        if(response.status === 409) {
          throw new Error(`生成播客失败，有正在进行中的任务 (状态码: ${response.status})`);
        }
        throw new Error(`生成播客失败，请检查后端服务或配置 (状态码: ${response.status})`);
      }

      const apiResponse: { success: boolean; data?: PodcastGenerationResponse; error?: string } = await response.json();
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || '生成播客失败');
      }

      if (apiResponse.data && apiResponse.data.id) {
        success('任务已创建', `播客生成任务已启动，任务ID: ${apiResponse.data.id}`);
        await fetchRecentPodcasts(); // 刷新最近生成列表
      } else {
        throw new Error('生成任务失败，未返回任务ID');
      }
      
    } catch (err) {
      console.error('Error generating podcast:', err);
      error('生成失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPodcast = (podcast: PodcastItem) => {
    if (currentPodcast?.id === podcast.id) {
      setIsPlaying(prev => !prev);
    } else {
      setCurrentPodcast(podcast);
      // 强制设置为 true，确保在切换播客时立即播放
      setIsPlaying(true);
    }
  };

  const handleTogglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };


  // 获取最近播客列表 - 使用防重复调用机制
  const fetchRecentPodcasts = async () => {
    const result = await executeOnce(async () => {
      const response = await trackedFetch('/api/podcast-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch podcast status');
      }
      return response.json();
    });

    if (!result) {
      return; // 如果是重复调用，直接返回
    }

    try {
      const apiResponse: { success: boolean; tasks?: { message: string; tasks: PodcastGenerationResponse[]; }; error?: string } = result;
      if (apiResponse.success && apiResponse.tasks && Array.isArray(apiResponse.tasks)) { // 检查 tasks 属性是否存在且为数组
        const newPodcasts: PodcastItem[] = apiResponse.tasks.map((task: any) => ({ // 遍历 tasks 属性
            id: task.task_id, // 使用 task_id
            title: task.title ? task.title : task.status === 'failed' ? '播客生成失败，请重试' : ' ',
            description: task.tags ? task.tags.split('#').map((tag: string) => tag.trim()).join(', ') : task.status === 'failed' ? task.error || '待生成的播客标签' : '待生成的播客标签', 
            thumbnail: task.avatar_base64 ? `data:image/png;base64,${task.avatar_base64}` : '',
            author: {
                name: '', 
                avatar: '',
            },
            duration: parseDurationToSeconds(task.audio_duration || '00:00'),
            playCount: 0,
            createdAt: task.timestamp ? new Date(task.timestamp * 1000).toISOString() : new Date().toISOString(),
            audioUrl: task.audioUrl ? task.audioUrl : '',
            tags: task.tags ? task.tags.split('#').map((tag: string) => tag.trim()) : task.status === 'failed' ? [task.error] : ['待生成的播客标签'],
            status: task.status,
        }));
        // 直接倒序，确保最新生成的播客排在前面
        const reversedPodcasts = newPodcasts.reverse();
        setExplorePodcasts(reversedPodcasts);
        // 如果有最新生成的播客，自动播放
      }
    } catch (err) {
      console.error('Error processing podcast data:', err);
      error('数据处理失败', err instanceof Error ? err.message : '无法处理播客列表数据');
    }
  };

  // 辅助函数：解析时长字符串为秒数
  const parseDurationToSeconds = (durationStr: string): number => {
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) { // 支持 HH:MM:SS 格式
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
  };

  const renderMainContent = () => {
    switch (uiState.currentView) {
      case 'home':
        return (
          <div className="space-y-12">
            {/* 播客创建器 */}
            <PodcastCreator
              onGenerate={handlePodcastGeneration}
              isGenerating={isGenerating}
              credits={credits}
              settings={settings} // 传递 settings
            />
            
            {/* 最近生成 - 紧凑布局 */}
            {explorePodcasts.length > 0 && (
              <ContentSection
                title="最近生成"
                subtitle="数据只保留30分钟，请尽快下载保存"
                items={explorePodcasts}
                onPlayPodcast={handlePlayPodcast}
                currentPodcast={currentPodcast}
                isPlaying={isPlaying}
                variant="compact"
                layout="grid"
                showRefreshButton={true}
                onRefresh={fetchRecentPodcasts}
              />
            )}
            
            {/* 推荐播客 - 水平滚动 */}
            {/* <ContentSection
              title="为你推荐"
              items={[...explorePodcasts].slice(0, 6)}
              onPlayPodcast={handlePlayPodcast}
              variant="default"
              layout="horizontal"
            /> */}
          </div>
        );
        
      case 'settings':
        return (
          <SettingsForm
            onSuccess={(message) => success('保存成功', message)}
            onError={(message) => error('保存失败', message)}
          />
        );
        
      default:
        return (
          <div className="max-w-4xl mx-auto px-6 text-center py-12">
            <h1 className="text-2xl font-bold text-black mb-4">页面开发中</h1>
            <p className="text-neutral-600">该功能正在开发中，敬请期待。</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* 侧边栏 */}
      <Sidebar
        currentView={uiState.currentView}
        onViewChange={handleViewChange}
        collapsed={uiState.sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        mobileOpen={mobileSidebarOpen} // 传递移动端侧边栏状态
        credits={credits} // 将积分传递给Sidebar
      />

      {/* 移动端菜单按钮 */}
      <button
        className="fixed top-4 left-4 z-30 p-2 bg-white border border-neutral-200 rounded-lg shadow-md md:hidden"
        onClick={handleToggleMobileSidebar}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-black"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 移动端侧边栏遮罩 */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={handleToggleMobileSidebar}
        ></div>
      )}

      {/* 主内容区域 */}
      <main className={`flex-1 transition-all duration-300 ${
        uiState.sidebarCollapsed ? 'ml-16' : 'ml-64'
      } max-md:ml-0`}>
        <div className="pb-8 pt-8 sm:pt-32 px-4 sm:px-6">
          {renderMainContent()}
        </div>
      </main>

      {/* 音频播放器 */}
      {currentPodcast && (
          <AudioPlayer
            podcast={currentPodcast}
            isPlaying={isPlaying}
            onPlayPause={handleTogglePlayPause}
            onEnded={() => setIsPlaying(false)}
          />
      )}

      {/* 登录模态框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Toast通知容器 */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
}