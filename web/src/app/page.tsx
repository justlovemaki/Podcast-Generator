'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PodcastCreator from '@/components/PodcastCreator';
import ContentSection from '@/components/ContentSection';
import AudioPlayer from '@/components/AudioPlayer';
import SettingsForm from '@/components/SettingsForm';
import PointsOverview from '@/components/PointsOverview'; // 导入 PointsOverview
import LoginModal from '@/components/LoginModal'; // 导入 LoginModal
import { ToastContainer, useToast } from '@/components/Toast';
import { usePreventDuplicateCall } from '@/hooks/useApiCall';
import { trackedFetch } from '@/utils/apiCallTracker';
import type { PodcastGenerationRequest, PodcastItem, UIState, PodcastGenerationResponse, SettingsFormData } from '@/types';
import { getTTSProviders } from '@/lib/config';
import { getSessionData } from '@/lib/server-actions';

const enableTTSConfigPage = process.env.NEXT_PUBLIC_ENABLE_TTS_CONFIG_PAGE === 'true';

// 辅助函数：规范化设置数据
const normalizeSettings = (savedSettings: any): SettingsFormData => {
  return {
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
};

export default function HomePage() {
  const { toasts, success, error, warning, info, removeToast } = useToast();
  const { executeOnce } = usePreventDuplicateCall();
  const router = useRouter(); // Initialize useRouter

  // 辅助函数：将 API 响应映射为 PodcastItem 数组
  const mapApiResponseToPodcasts = (tasks: PodcastGenerationResponse[]): PodcastItem[] => {
    return tasks.map((task: any) => ({
      id: task.task_id,
      title: task.title ? task.title : task.status === 'failed' ? '播客生成失败，请重试' : ' ',
      description: task.tags ? task.tags.split('#').map((tag: string) => tag.trim()).filter((tag: string) => !!tag).join(', ') : task.status === 'failed' ? task.error || '待生成的播客标签' : '待生成的播客标签',
      thumbnail: task.avatar_base64 ? `data:image/png;base64,${task.avatar_base64}` : '',
      author: {
        name: '',
        avatar: '',
      },
      audio_duration: task.audio_duration || '00:00',
      playCount: 0,
      createdAt: task.timestamp ? new Date(task.timestamp * 1000).toISOString() : new Date().toISOString(),
      audioUrl: task.audioUrl ? task.audioUrl : '',
      tags: task.tags ? task.tags.split('#').map((tag: string) => tag.trim()).filter((tag: string) => !!tag) : task.status === 'failed' ? [task.error] : ['待生成的播客标签'],
      status: task.status,
      file_name: task.output_audio_filepath || '',
    }));
  };

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
  const [pointHistory, setPointHistory] = useState<any[]>([]); // 积分历史
  const [user, setUser] = useState<any>(null); // 用户信息
  const [settings, setSettings] = useState<SettingsFormData | null>(null); // 加载设置的状态

  // 音频播放器状态
  const [currentPodcast, setCurrentPodcast] = useState<PodcastItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 播客详情页状态

  // 从后端获取积分数据和初始化数据加载
  const initialized = React.useRef(false); // 使用 useRef 追踪是否已初始化

  useEffect(() => {
    // 确保只在组件首次挂载时执行一次
    if (!initialized.current) {
      initialized.current = true;

      // 首次加载时获取播客列表和积分/用户信息
      fetchRecentPodcasts();
      // fetchCreditsAndUserInfo(); // 在fetchRecentPodcasts中调用

    }
    
    // 设置定时器每20秒刷新一次
    // const interval = setInterval(() => {
    //   fetchRecentPodcasts();
    // }, 20000);

    // // 清理定时器
    // return () => clearInterval(interval);
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getTTSProviders();
      if (savedSettings) {
        const normalizedSettings = normalizeSettings(savedSettings);
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

  const handleCreditsChange = (newCredits: number) => {
    setCredits(newCredits);
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
          throw new Error('生成播客失败，请检查API Key是否正确，或登录状态。');
        }
        if(response.status === 402) {
          throw new Error('生成播客失败，请检查积分是否足够。');
        }
        if(response.status === 403) {
          setIsLoginModalOpen(true); // 显示登录模态框
          throw new Error('生成播客失败，请登录后重试。');
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
      throw new Error(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理播客标题点击
  const handleTitleClick = (podcast: PodcastItem) => {
    router.push(`/podcast/${podcast.file_name.split(".")[0]}`);
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
      if (apiResponse.success && apiResponse.tasks && Array.isArray(apiResponse.tasks)) {
        const newPodcasts = mapApiResponseToPodcasts(apiResponse.tasks);
        const reversedPodcasts = newPodcasts.reverse();
        setExplorePodcasts(reversedPodcasts);
      }
    } catch (err) {
      console.error('Error processing podcast data:', err);
      error('数据处理失败', err instanceof Error ? err.message : '无法处理播客列表数据');
    }

    fetchCreditsAndUserInfo();
  };

  // 新增辅助函数：获取积分和用户信息
  const fetchCreditsAndUserInfo = async () => {
      try {
          const pointsResponse = await fetch('/api/points');
          if (pointsResponse.ok) {
              const data = await pointsResponse.json();
              if (data.success) {
                  setCredits(data.points);
              } else {
                  console.error('Failed to fetch credits:', data.error);
                  setCredits(0); // 获取失败则设置为0
              }
          } else {
              console.error('Failed to fetch credits with status:', pointsResponse.status);
              setCredits(0); // 获取失败则设置为0
          }
      } catch (error) {
          console.error('Error fetching credits:', error);
          setCredits(0); // 发生错误则设置为0
      }

      try {
          const transactionsResponse = await fetch('/api/points/transactions');
          if (transactionsResponse.ok) {
              const data = await transactionsResponse.json();
              if (data.success) {
                  setPointHistory(data.transactions);
              } else {
                  console.error('Failed to fetch point transactions:', data.error);
                  setPointHistory([]);
              }
          } else {
              console.error('Failed to fetch point transactions with status:', transactionsResponse.status);
              setPointHistory([]);
          }
      } catch (error) {
          console.error('Error fetching point transactions:', error);
          setPointHistory([]);
      }

      const { session, user } = await getSessionData();
      setUser(user); // 设置用户信息
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
                onTitleClick={handleTitleClick} // 传递 handleTitleClick
                currentPodcast={currentPodcast} // 继续传递给 ContentSection
                isPlaying={isPlaying} // 继续传递给 ContentSection
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
              onTitleClick={handleTitleClick} // 传递 handleTitleClick
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

      case 'credits':
        return (
          <PointsOverview
            totalPoints={credits}
            user={user}
            pointHistory={pointHistory}
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
        onPodcastExplore={setExplorePodcasts} // 传递刷新播客函数
        onCreditsChange={handleCreditsChange} // 传递积分更新函数
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
        <div className="pb-8 pt-8 sm:pt-16 px-4 sm:px-6">
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