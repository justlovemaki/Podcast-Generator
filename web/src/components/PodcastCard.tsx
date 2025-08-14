'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Clock, Eye, User, Heart, MoreHorizontal } from 'lucide-react';
import { cn, formatTime, formatRelativeTime } from '@/lib/utils';
import type { PodcastItem } from '@/types';

interface PodcastCardProps {
  podcast: PodcastItem;
  onPlay?: (podcast: PodcastItem) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

const PodcastCard: React.FC<PodcastCardProps> = ({ 
  podcast, 
  onPlay,
  className,
  variant = 'default'
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  // 根据变体返回不同的布局
  if (variant === 'compact') {
    return (
      <div className={cn(
        "group bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-large hover:-translate-y-1 cursor-pointer w-full max-w-[320px] h-24",
        "sm:max-w-[350px] sm:h-28",
        "md:max-w-[320px] md:h-24",
        "lg:max-w-[350px] lg:h-28",
        className
      )}>
        <div className="flex gap-4 p-4 h-full">
          {/* 缩略图 */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-brand-purple to-brand-pink flex-shrink-0">
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
                <Play className="w-6 h-6 text-white" />
              </div>
            )}
            
            {/* 播放按钮覆盖层 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={handlePlayClick}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transform scale-90 hover:scale-100 transition-all duration-200"
              >
                <Play className="w-3 h-3 text-black ml-0.5" />
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-black text-base mb-1 truncate">
              {podcast.title}
            </h3>
            <p className="text-sm text-neutral-600 mb-2 truncate">
              {podcast.author.name}
            </p>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(podcast.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {podcast.playCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // 默认变体
  return (
    <div
      className={cn(
        "group bg-white border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-large hover:-translate-y-1 cursor-pointer w-full max-w-sm",
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
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        
        {/* 播放按钮覆盖层 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={handlePlayClick}
            className="w-14 h-14 bg-white/95 hover:bg-white rounded-full flex items-center justify-center transform scale-90 hover:scale-100 transition-all duration-300 shadow-medium"
          >
            <Play className="w-6 h-6 text-black ml-0.5" />
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
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          </button>
          <button
            onClick={handleMoreClick}
            className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-neutral-600 hover:text-black transition-all duration-200 backdrop-blur-sm"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* 时长标签 */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded-md backdrop-blur-sm">
          {formatTime(podcast.duration)}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-5">
        {/* 标题 */}
        <h3 className="font-semibold text-black text-lg mb-3 line-clamp-2 leading-tight group-hover:text-brand-purple transition-colors duration-200
                     sm:text-xl sm:mb-4">
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
                <User className="w-3.5 h-3.5 text-neutral-500" />
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
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{podcast.playCount.toLocaleString()}</span>
          </div>
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