'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PodcastCreator from '@/components/PodcastCreator';
import ContentSection from '@/components/ContentSection';
import AudioPlayer from '@/components/AudioPlayer';
import ProgressModal from '@/components/ProgressModal';
import SettingsForm from '@/components/SettingsForm';
import { ToastContainer, useToast } from '@/components/Toast';
import type { PodcastGenerationRequest, PodcastItem, UIState, PodcastGenerationResponse } from '@/types';

// 模拟数据
const mockPodcasts: PodcastItem[] = [
  {
    id: '1',
    title: 'AI技术的未来发展趋势',
    description: '探讨人工智能在各个领域的应用前景',
    thumbnail: '',
    author: {
      name: 'AI研究员',
      avatar: '',
    },
    duration: 1200, // 20分钟
    playCount: 15420,
    createdAt: '2024-01-15T10:00:00Z',
    audioUrl: '/api/audio/sample1.mp3',
    tags: ['AI', '技术', '未来'],
  },
  {
    id: '2',
    title: '创业路上的那些坑',
    description: '分享创业过程中的经验教训',
    thumbnail: '',
    author: {
      name: '创业导师',
      avatar: '',
    },
    duration: 900, // 15分钟
    playCount: 8750,
    createdAt: '2024-01-14T15:30:00Z',
    audioUrl: '/api/audio/sample2.mp3',
    tags: ['创业', '经验', '商业'],
  },
  {
    id: '3',
    title: '健康生活方式指南',
    description: '如何在忙碌的生活中保持健康',
    thumbnail: '',
    author: {
      name: '健康专家',
      avatar: '',
    },
    duration: 1800, // 30分钟
    playCount: 12300,
    createdAt: '2024-01-13T09:15:00Z',
    audioUrl: '/api/audio/sample3.mp3',
    tags: ['健康', '生活', '养生'],
  },
];

export default function HomePage() {
  const { toasts, success, error, warning, info, removeToast } = useToast();
  
  const [uiState, setUIState] = useState<UIState>({
    sidebarCollapsed: false,
    currentView: 'home',
    theme: 'light',
  });
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [libraryPodcasts, setLibraryPodcasts] = useState<PodcastItem[]>(mockPodcasts);
  const [explorePodcasts, setExplorePodcasts] = useState<PodcastItem[]>(mockPodcasts);
  const [credits, setCredits] = useState(0); // 新增积分状态
  
  // 音频播放器状态
  const [currentPodcast, setCurrentPodcast] = useState<PodcastItem | null>(null);
  
  // 进度模态框状态
  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean;
    taskId: string | null;
  }>({
    isOpen: false,
    taskId: null,
  });

  // 模拟从后端获取积分数据
  useEffect(() => {
    // 实际应用中，这里会发起API请求获取用户积分
    // 例如：fetch('/api/user/credits').then(res => res.json()).then(data => setCredits(data.credits));
    setCredits(100000); // 模拟初始积分100
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
      info('开始生成播客', '正在处理您的请求...');
      
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to generate podcast');
      }

      const result = await response.json();
      
      if (result.success) {
        success('任务已创建', '播客生成任务已启动，请查看进度');
        // 显示进度模态框
        setProgressModal({
          isOpen: true,
          taskId: result.data.id,
        });
      } else {
        throw new Error(result.error || 'Generation failed');
      }
      
    } catch (err) {
      console.error('Error generating podcast:', err);
      error('生成失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPodcast = (podcast: PodcastItem) => {
    setCurrentPodcast(podcast);
  };

  const handleProgressComplete = (result: PodcastGenerationResponse) => {
    // 生成完成后，可以将新的播客添加到库中
    if (result.audioUrl) {
      success('播客生成完成！', '您的播客已成功生成并添加到资料库');
      
      const newPodcast: PodcastItem = {
        id: result.id,
        title: result.script?.title || '新生成的播客',
        description: '使用AI生成的播客内容',
        thumbnail: '',
        author: {
          name: '我',
          avatar: '',
        },
        duration: result.script?.totalDuration || 0,
        playCount: 0,
        createdAt: result.createdAt,
        audioUrl: result.audioUrl,
        tags: ['AI生成'],
      };
      
      setLibraryPodcasts(prev => [newPodcast, ...prev]);
      
      // 自动播放新生成的播客
      setCurrentPodcast(newPodcast);
    } else {
      warning('生成完成但无音频', '播客生成过程完成，但未找到音频文件');
    }
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
              credits={credits} // 将积分传递给PodcastCreator
            />
            
            
            {/* 最近生成 - 紧凑布局 */}
            <ContentSection
              title="最近生成"
              subtitle="数据只保留30分钟，请尽快下载保存"
              items={explorePodcasts}
              onPlayPodcast={handlePlayPodcast}
              variant="compact"
              layout="grid"
            />
            
            {/* 推荐播客 - 水平滚动 */}
            {/* <ContentSection
              title="为你推荐"
              items={[...libraryPodcasts, ...explorePodcasts].slice(0, 6)}
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
        <div className="py-8 px-4 sm:px-6">
          {renderMainContent()}
        </div>
      </main>

      {/* 音频播放器 */}
      {currentPodcast && (
          <AudioPlayer
            podcast={currentPodcast}
          />
      )}

      {/* 进度模态框 */}
      <ProgressModal
        taskId={progressModal.taskId || ''}
        isOpen={progressModal.isOpen}
        onClose={() => setProgressModal({ isOpen: false, taskId: null })}
        onComplete={handleProgressComplete}
      />

      {/* Toast通知容器 */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
}