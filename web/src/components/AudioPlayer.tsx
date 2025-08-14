'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Download,
  Share2,
  ChevronDown, // 用于收起播放器
  ChevronUp,   // 用于展开播放器
} from 'lucide-react';
import { cn, formatTime, downloadFile } from '@/lib/utils';
import AudioVisualizer from './AudioVisualizer';
import { useIsSmallScreen } from '@/hooks/useMediaQuery'; // 导入新的 Hook
import type { AudioPlayerState, PodcastItem } from '@/types';

interface AudioPlayerProps {
  podcast: PodcastItem;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  podcast,
  className
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
  });
  
  const [isCollapsed, setIsCollapsed] = useState(false); // 用户控制的折叠状态
  const isSmallScreen = useIsSmallScreen(); // 获取小屏幕状态

  // 定义一个“生效的”折叠状态，它会服从 isSmallScreen 的约束
  const effectiveIsCollapsed = isSmallScreen ? true : isCollapsed;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({ ...prev, duration: audio.duration }));
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    // 自动播放音频（仅在用户交互后有效）
    if (playerState.isPlaying) {
      audio.play().catch(e => console.error("Audio play failed:", e));
    }


    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // 当播客URL变化时，重置并加载新音频
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && podcast.audioUrl) {
      // 停止当前播放
      audio.pause(); 
      // 重新设置src，这将触发loadedmetadata事件
      audio.src = podcast.audioUrl;
      audio.load();
      // 重置播放器状态
      setPlayerState({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: audio.volume,
        playbackRate: 1,
      });
      setIsLoading(true); // 开始加载，显示加载状态
      setIsMuted(audio.muted || audio.volume === 0);
    }
  }, [podcast.audioUrl]);


  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playerState.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Audio play failed:", e)); // 捕获播放错误
    }
    
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || playerState.duration === 0) return; // 确保有duration

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * playerState.duration;
    
    audio.currentTime = newTime;
    setPlayerState(prev => ({ ...prev, currentTime: newTime }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setPlayerState(prev => ({ ...prev, volume: newVolume }));
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      // 恢复到上次的音量，如果上次是0则恢复到0.5
      audio.volume = playerState.volume > 0 ? playerState.volume : 0.5; 
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || playerState.duration === 0) return; // 确保有duration

    const newTime = Math.max(0, Math.min(playerState.currentTime + seconds, playerState.duration));
    audio.currentTime = newTime;
    setPlayerState(prev => ({ ...prev, currentTime: newTime }));
  };

  const handleDownload = () => {
    downloadFile(podcast.audioUrl, `${podcast.title}.wav`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: podcast.title,
          text: podcast.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled', err);
      }
    } else {
      // 降级到复制链接
      await navigator.clipboard.writeText(window.location.href);
      // 这里可以显示一个toast提示
      alert('链接已复制到剪贴板！'); // 简单替代Toast
    }
  };

  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 bg-white border-t border-neutral-200 p-2 flex items-center justify-between overflow-hidden rounded-xl shadow-large", // 固定定位到右下角
      effectiveIsCollapsed ? "w-fit" : "max-w-screen-md", // 根据 effectiveIsCollapsed 调整宽度
      "transition-all duration-300 ease-in-out", // 添加过渡效果
      className
    )}>
      <audio
        ref={audioRef}
        src={podcast.audioUrl}
        preload="metadata"
      />

      {/* 左侧：播放按钮 & 播客信息 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="w-8 h-8 flex-shrink-0 bg-black text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors disabled:opacity-50"
          title={playerState.isPlaying ? "暂停" : "播放"}
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : playerState.isPlaying ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          {/* 播客标题和作者 */}
          <div className="min-w-0 flex-shrink-0">
            <h3 className="font-semibold text-sm text-black truncate max-w-[150px]"> {/* 限制宽度，确保截断 */}
              {podcast.title}
            </h3>
            {!effectiveIsCollapsed && ( // 根据 effectiveIsCollapsed 隐藏作者
              <p className="text-xs text-neutral-600 truncate max-w-[150px]"> {/* 限制宽度，确保截断 */}
                {podcast.author.name}
              </p>
            )}
          </div>
          
          {!effectiveIsCollapsed && ( // 根据 effectiveIsCollapsed 隐藏可视化器
            <AudioVisualizer
              audioElement={audioRef.current}
              isPlaying={playerState.isPlaying}
              className="flex-grow min-w-[50px] max-w-[150px]" // 响应式宽度，适应扁平布局
              height={20} // 更扁平的高度
            />
          )}
        </div>
      </div>

      {/* 中间：进度条 & 时间 - 根据 effectiveIsCollapsed 隐藏 */}
      {!effectiveIsCollapsed && (
        <div className="flex flex-col flex-grow mx-4 min-w-[200px] max-w-[400px]"> {/* 占据中间大部分空间，确保宽 */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="w-full h-1 bg-neutral-200 rounded-full cursor-pointer relative group" // 更窄的进度条
          >
            <div
              className="h-full bg-black rounded-full transition-all duration-150 relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity" /> {/* 调整把手大小 */}
            </div>
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-1"> {/* 调整时间显示间距 */}
            <span>{formatTime(playerState.currentTime)}</span>
            <span>{formatTime(playerState.duration)}</span>
          </div>
        </div>
      )}

      {/* 右侧：控制按钮组 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!effectiveIsCollapsed && ( // 根据 effectiveIsCollapsed 隐藏这些按钮
          <>
            <button
              onClick={() => skipTime(-10)}
              className="p-1 text-neutral-600 hover:text-black transition-colors"
              title="后退10秒"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => skipTime(10)}
              className="p-1 text-neutral-600 hover:text-black transition-colors"
              title="前进10秒"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* 音量控制 */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="p-1 text-neutral-600 hover:text-black transition-colors"
                title={isMuted ? "取消静音" : "静音"}
              >
                {isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : playerState.volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-neutral-200 rounded-full appearance-none cursor-pointer" // 窄高的音量条
              />
            </div>

            {/* 操作按钮 */}
            <button
              onClick={handleShare}
              className="p-1 text-neutral-600 hover:text-black transition-colors"
              title="分享"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1 text-neutral-600 hover:text-black transition-colors"
              title="下载"
            >
              <Download className="w-4 h-4" />
            </button>
          </>
        )}

        {/* 收起/展开按钮 */}
        <button
          onClick={() => {
            // 如果是小屏幕且当前已收起（按钮显示ChevronUp，试图展开），则不执行任何操作。
            if (isSmallScreen && effectiveIsCollapsed) {
              return;
            }
            setIsCollapsed(prev => !prev);
          }}
          className={cn(
            "p-1 text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0",
            { "opacity-50 cursor-not-allowed": isSmallScreen && effectiveIsCollapsed } // 当 effectiveIsCollapsed 为 true 且是小屏幕时禁用 (因为此时按钮功能是展开，不允许)
          )}
          title={isSmallScreen && effectiveIsCollapsed ? "小于sm尺寸不可展开" : (effectiveIsCollapsed ? "展开播放器" : "收起播放器")}
          disabled={isSmallScreen && effectiveIsCollapsed} // 当 effectiveIsCollapsed 为 true 且是小屏幕时禁用
        >
          {effectiveIsCollapsed ? ( // 根据 effectiveIsCollapsed 决定显示哪个图标
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;