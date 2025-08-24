'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AiFillPlayCircle, AiFillPauseCircle, AiOutlineClockCircle, AiOutlineEye, AiOutlineUser, AiFillHeart, AiOutlineEllipsis } from 'react-icons/ai';
import { cn, formatTime, formatRelativeTime } from '@/lib/utils';
import type { PodcastItem } from '@/types';
import { useTranslation } from '../i18n/client'; // 导入 useTranslation

interface PodcastCardProps {
  podcast: PodcastItem;
  onPlay?: (podcast: PodcastItem) => void;
  className?: string;
  variant?: 'default' | 'compact';
  currentPodcast?: PodcastItem | null;
  isPlaying?: boolean;
  onTitleClick?: (podcast: PodcastItem) => void; // 新增 onTitleClick 回调
  lang: string; // 新增 lang 属性
}

const PodcastCard: React.FC<PodcastCardProps> = ({
  podcast,
  onPlay,
  className,
  variant = 'default',
  currentPodcast,
  isPlaying,
  onTitleClick, // 解构 onTitleClick
  lang
}) => {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isCurrentlyPlaying = currentPodcast?.id === podcast.id && isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(podcast);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };


  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 更多操作菜单
  };

  const handleTitleClick = () => {
    onTitleClick?.(podcast); // 调用传入的 onTitleClick 回调
  };

  // 根据变体返回不同的布局
  if (variant === 'compact') {
    return (
      <div className={cn(
        "group bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-large hover:-translate-y-1 cursor-pointer w-full max-w-[320px] h-24 relative", // Added relative
        "sm:max-w-[350px] sm:h-28",
        "md:max-w-[320px] md:h-24",
        "lg:max-w-[350px] lg:h-28",
        className
      )}>
        <div className="flex items-center gap-4 p-4 h-full">
          {/* 缩略图 */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-brand-purple to-brand-pink">
            {podcast.thumbnail ? (
              <Image
                src={podcast.thumbnail}
                alt={podcast.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
              </div>
            )}
            
            {/* 播放按钮覆盖层 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={handlePlayClick}
                className="w-8 h-8 rounded-full flex items-center justify-center transform scale-100 hover:scale-100 transition-all duration-200"
              >
                {isCurrentlyPlaying ? (
                  <AiFillPauseCircle className="w-full h-full text-white" />
                ) : (
                  <AiFillPlayCircle className="w-full h-full text-white" />
                )}
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-black text-base mb-1 line-clamp-2 leading-tight cursor-pointer hover:underline"
              onClick={handleTitleClick}
            >
              {podcast.title}
            </h3>
            <p className="text-sm text-neutral-600 mb-2 line-clamp-1">
              {podcast.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <AiOutlineClockCircle className="w-3 h-3" />
                {podcast.audio_duration}
              </span>
              {/* <span className="flex items-center gap-1">
                <AiOutlineEye className="w-3 h-3" />
                {podcast.playCount.toLocaleString()}
              </span> */}
            </div>
          </div>
        </div>
        {/* 遮罩层 */}
        {(podcast.status === 'pending' || podcast.status === 'running') && (
          <div className="absolute inset-0 bg-black/100 z-10 flex flex-col items-center justify-center text-white text-lg font-semibold p-4 text-center">
            <p className="mb-2">
              {podcast.status === 'pending' ? t('podcastCard.podcastGenerationQueued') : t('podcastCard.podcastGenerating')}
            </p>
          </div>
        )}
      </div>
    );
  }


  // 默认变体
  return (
    <div
      className={cn(
        "group bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-large hover:-translate-y-1 cursor-pointer w-full max-w-sm relative", // Added relative
        "sm:max-w-md",
        "md:max-w-lg",
        "lg:max-w-xl",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 缩略图区域 */}
      <div className="relative aspect-square bg-gradient-to-br from-brand-purple to-brand-pink">
        {podcast.thumbnail ? (
          <Image
            src={podcast.thumbnail}
            alt={podcast.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            </div>
          </div>
        )}
        
        {/* 播放按钮覆盖层 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={handlePlayClick}
            className="w-14 h-14 rounded-full flex items-center justify-center transform scale-90 hover:scale-100 transition-all duration-300 shadow-medium"
          >
            {isCurrentlyPlaying ? (
              <AiFillPauseCircle className="w-full h-full text-white" />
            ) : (
              <AiFillPlayCircle className="w-full h-full text-white" />
            )}
          </button>
        </div>

        {/* 右上角操作按钮 */}
        <div className={cn(
          "absolute top-3 right-3 flex gap-2 transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}>
          <button
            onClick={handleLikeClick}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm",
              isLiked
                ? "bg-red-500 text-white"
                : "bg-white/90 hover:bg-white text-neutral-600 hover:text-red-500"
              )}
            >
              <AiFillHeart className={cn("w-4 h-4", isLiked && "fill-current")} />
          </button>
          <button
            onClick={handleMoreClick}
            className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-neutral-600 hover:text-black transition-all duration-200 backdrop-blur-sm"
            title={t('podcastCard.moreOperations')}
          >
            <AiOutlineEllipsis className="w-4 h-4" />
          </button>
        </div>

        {/* 时长标签 */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded-md backdrop-blur-sm">
          {podcast.audio_duration}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-5">
        {/* 标题 */}
        <h3
          className="font-semibold text-black text-lg mb-3 line-clamp-2 leading-tight group-hover:text-brand-purple transition-colors duration-200 cursor-pointer hover:underline
                     sm:text-xl sm:mb-4"
          onClick={handleTitleClick}
        >
          {podcast.title}
        </h3>

        {/* 作者信息 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
            {podcast.author.avatar ? (
              <Image
                src={podcast.author.avatar}
                alt={podcast.author.name}
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-300 flex items-center justify-center">
                <AiOutlineUser className="w-3.5 h-3.5 text-neutral-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-700 font-medium truncate">
              {podcast.author.name}
            </p>
          </div>
        </div>

        {/* 元数据 */}
        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
          {/* <div className="flex items-center gap-1.5">
            <AiOutlineEye className="w-4 h-4" />
            <span>{podcast.playCount.toLocaleString()}</span>
          </div> */}
          <div className="w-1 h-1 bg-neutral-300 rounded-full"></div>
          <span>{formatRelativeTime(podcast.createdAt)}</span>
        </div>

        {/* 标签 */}
        {podcast.tags && podcast.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {podcast.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs rounded-full transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
            {podcast.tags.length > 2 && (
              <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                +{podcast.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastCard;