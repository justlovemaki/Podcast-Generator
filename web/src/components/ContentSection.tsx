'use client';

import React, { useRef, useEffect } from 'react';
import { AiOutlineRight, AiOutlineReload } from 'react-icons/ai';
import PodcastCard from './PodcastCard';
import type { PodcastItem } from '@/types'; // 移除了 PodcastGenerationResponse

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  items: PodcastItem[];
  onViewAll?: () => void;
  onPlayPodcast?: (podcast: PodcastItem) => void;
  loading?: boolean;
  variant?: 'default' | 'compact';
  layout?: 'grid' | 'horizontal';
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  onTitleClick?: (podcast: PodcastItem) => void; // 确保传入 onTitleClick
  currentPodcast?: PodcastItem | null; // Keep this prop for PodcastCard
  isPlaying?: boolean; // Keep this prop for PodcastCard
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  items,
  onViewAll,
  onPlayPodcast,
  loading = false,
  variant = 'default',
  layout = 'grid',
  showRefreshButton,
  onRefresh,
  onTitleClick, // 确保解构
  currentPodcast, // 确保解构
  isPlaying // 确保解构
}) => {

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse" />
            {subtitle && (
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse mt-1" />
            )}
          </div>
          <div className="h-6 w-20 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <div className="aspect-square bg-neutral-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-neutral-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-black">{title}</h2>
            {subtitle && (
              <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
            )}
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-neutral-500 hover:text-black transition-colors text-sm"
            >
              查看全部
              <AiOutlineRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-center py-12 text-neutral-500">
          <p>暂无内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-1 sm:py-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex flex-col">
          <h2 className="text-xl sm:text-2xl font-bold text-black">{title}</h2>
          {subtitle && (
            <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2"> {/* 包装刷新按钮和查看全部按钮 */}
          {showRefreshButton && onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 text-neutral-500 hover:text-black transition-colors text-sm group whitespace-nowrap"
              title="刷新"
            >
              <AiOutlineReload className="w-4 h-4" />
              刷新
            </button>
          )}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-neutral-500 hover:text-black transition-colors text-sm group whitespace-nowrap"
            >
              查看全部
              <AiOutlineRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* 内容布局 */}
      {layout === 'horizontal' ? (
        // 水平滚动布局 - 隐藏滚动条并自动循环
        <HorizontalScrollSection
          items={items}
          onPlayPodcast={onPlayPodcast}
          variant={variant}
          onTitleClick={onTitleClick}
        />
      ) : (
        // 网格布局
        <div className={`grid justify-items-center ${ // 添加 justify-items-center 使网格项水平居中
          variant === 'compact'
            ? 'gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
        }`}>
          {items.map((item) => (
            <PodcastCard
              key={item.id}
              podcast={item}
              onPlay={onPlayPodcast}
              variant={variant}
              currentPodcast={currentPodcast}
              isPlaying={isPlaying}
              onTitleClick={onTitleClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 水平滚动组件 - 隐藏滚动条并自动循环
interface HorizontalScrollSectionProps {
  items: PodcastItem[];
  onPlayPodcast?: (podcast: PodcastItem) => void;
  variant?: 'default' | 'compact';
  onTitleClick?: (podcast: PodcastItem) => void;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  items,
  onPlayPodcast,
  variant = 'default',
  onTitleClick
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || items.length === 0) return;

    let scrollAmount = 0;
    const cardWidth = variant === 'compact' ? 320 : 288; // w-80 = 320px, w-72 = 288px
    const gap = 24; // gap-6 = 24px
    const totalWidth = (cardWidth + gap) * items.length;
    
    const scroll = () => {
      scrollAmount += 0.5; // 减慢滚动速度
      
      // 当滚动到末尾时重置到开始
      if (scrollAmount >= totalWidth) {
        scrollAmount = 0;
      }
      
      scrollContainer.scrollLeft = scrollAmount;
    };

    // 开始自动滚动
    const startScrolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(scroll, 10); // 每30ms滚动0.5px
    };

    // 停止自动滚动
    const stopScrolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // 鼠标悬停时暂停滚动
    const handleMouseEnter = () => stopScrolling();
    const handleMouseLeave = () => startScrolling();

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    // 开始滚动
    startScrolling();

    return () => {
      stopScrolling();
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [items.length, variant]);

  // 复制items数组以实现无缝循环
  const duplicatedItems = [...items, ...items];

  return (
    <div 
      ref={scrollRef}
      className="overflow-x-hidden scrollbar-hide"
      style={{
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
      }}
    >
      <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
        {duplicatedItems.map((item, index) => (
          <PodcastCard
            key={`${item.id}-${index}`}
            podcast={item}
            onPlay={onPlayPodcast}
            variant={variant}
            className={`flex-shrink-0 ${
              variant === 'compact' ? 'w-80' : 'w-72'
            }`}
            onTitleClick={onTitleClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ContentSection;