'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  AiFillPlayCircle,
  AiFillPauseCircle,
  AiOutlineStepBackward,
  AiOutlineStepForward,
  AiOutlineSound,
  AiOutlineMuted,
  AiOutlineCloudDownload,
  AiOutlineShareAlt,
  AiOutlineDown, // 用于收起播放器
  AiOutlineUp,   // 用于展开播放器
} from 'react-icons/ai';
import { cn, formatTime, downloadFile } from '@/lib/utils';
import AudioVisualizer from './AudioVisualizer';
import { useIsSmallScreen } from '@/hooks/useMediaQuery'; // 导入新的 Hook
import type { AudioPlayerState, PodcastItem } from '@/types';
import { useToast, ToastContainer } from '@/components/Toast';

interface AudioPlayerProps {
  podcast: PodcastItem;
  isPlaying: boolean;
  onPlayPause: () => void;
  onEnded: () => void;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  podcast,
  isPlaying,
  onPlayPause,
  onEnded,
  className,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { toasts, success: toastSuccess, removeToast } = useToast(); // 使用 useToast Hook

  const [playerState, setPlayerState] = useState<Omit<AudioPlayerState, 'isPlaying'>>({
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1, // 将 playbackRate 设回 playerState
  });
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState<number>(1); // 保持独立倍速状态用于UI显示
  const playbackRates = [0.5, 1, 1.25, 1.5, 2.0]; // 定义可选倍速
  
  const [isCollapsed, setIsCollapsed] = useState(true); // 用户控制的折叠状态
  const isSmallScreen = useIsSmallScreen(); // 获取小屏幕状态

  // 定义一个“生效的”折叠状态，它会服从 isSmallScreen 的约束
  const effectiveIsCollapsed = isSmallScreen ? true : isCollapsed;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [canPlay, setCanPlay] = useState(false); // 新增状态，表示音频是否可以播放


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
      onEnded();
      setPlayerState(prev => ({ ...prev, currentTime: 0 }));
    };

    const handleLoadStart = () => { setIsLoading(true); setCanPlay(false); }; // 加载开始时重置 canPlay
    const handleCanPlay = () => { setIsLoading(false); setCanPlay(true); }; // 可以播放时设置 canPlay

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    // 播放状态由外部 props 控制，并且只有当音频可以播放时才尝试播放
    if (isPlaying && canPlay) {
      audio.play().catch(e => {
        // 只有当不是 AbortError 时才输出错误
        if (e.name !== 'AbortError') {
          console.error("Audio play failed:", e);
        }
      });
      // 确保音频播放速度与状态一致
      audio.playbackRate = currentPlaybackRate;
    } else {
      audio.pause();
    }


    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isPlaying, podcast.audioUrl, canPlay]); // 将 canPlay 加入依赖，确保状态变化时触发播放

  // 当播客URL变化时，更新audio元素的src
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && podcast.audioUrl && audio.src !== podcast.audioUrl) { // 避免不必要的SRC更新
      audio.src = podcast.audioUrl;
      audio.load(); // 强制重新加载媒体
      setPlayerState(prev => ({ // 重置时间，保持音量
        ...prev,
        currentTime: 0,
        duration: 0, // 重置duration直到loadedmetadata
        playbackRate: 1, // 重置playerState中的playbackRate
      }));
      setCurrentPlaybackRate(1); // 重置倍速状态
      if (audio) {
        audio.playbackRate = 1; // 确保实际音频倍速也重置
      }
      setIsLoading(true);
      setCanPlay(false); // 重新加载时重置 canPlay
    }
  }, [podcast.audioUrl]);


  const togglePlayPause = () => {
    onPlayPause();
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
    // 从 podcast.audioUrl 中提取文件名
    const audioFileName = podcast.file_name;
    if (!audioFileName) {
      console.error("无法获取音频文件名进行分享。");
      toastSuccess('分享失败：无法获取音频文件名。');
      return;
    }

    // 构建分享链接：网站根目录 + podcast/路径 + 音频文件名
    const shareUrl = `${window.location.origin}/podcast/${audioFileName}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: podcast.title,
          text: podcast.description,
          url: shareUrl, // 使用构建的分享链接
        });
      } catch (err) {
        console.log('Share cancelled', err);
      }
    } else {
      // 降级到复制音频链接
      await navigator.clipboard.writeText(shareUrl); // 使用构建的分享链接
      // 使用Toast提示
      toastSuccess('播放链接已复制到剪贴板！');
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
          className="w-8 h-8 flex-shrink-0 bg-white text-black rounded-full flex items-center justify-center hover:bg-neutral-400 transition-colors disabled:opacity-50"
          title={isPlaying ? "暂停" : "播放"}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />

          ) : isPlaying ? (
            <AiFillPauseCircle className="w-8 h-8" />
          ) : (
            <AiFillPlayCircle className="w-8 h-8" />
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
          
          {/* {!effectiveIsCollapsed && ( // 根据 effectiveIsCollapsed 隐藏可视化器
            <AudioVisualizer
              audioElement={audioRef.current}
              isPlaying={isPlaying}
              className="flex-grow min-w-[50px] max-w-[150px]" // 响应式宽度，适应扁平布局
              height={20} // 更扁平的高度
            />
          )} */}
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
              <AiOutlineStepBackward className="w-4 h-4" />
            </button>
            <button
              onClick={() => skipTime(10)}
              className="p-1 text-neutral-600 hover:text-black transition-colors"
              title="前进10秒"
            >
              <AiOutlineStepForward className="w-4 h-4" />
            </button>

            {/* 倍速控制按钮 */}
            <button
              onClick={() => {
                const currentIndex = playbackRates.indexOf(currentPlaybackRate);
                const nextIndex = (currentIndex + 1) % playbackRates.length;
                const newRate = playbackRates[nextIndex];
                setCurrentPlaybackRate(newRate);
                if (audioRef.current) {
                  audioRef.current.playbackRate = newRate;
                }
              }}
              className="p-1 text-neutral-600 hover:text-black transition-colors min-w-[40px] text-xs"
              title={`当前倍速: ${currentPlaybackRate.toFixed(2)}x`}
            >
              {currentPlaybackRate.toFixed(2)}x
            </button>

            {/* 音量控制 */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="p-1 text-neutral-600 hover:text-black transition-colors"
                title={isMuted ? "取消静音" : "静音"}
              >
                {isMuted || playerState.volume === 0 ? (
                  <AiOutlineMuted className="w-4 h-4" />
                ) : (
                  <AiOutlineSound className="w-4 h-4" />
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
              <AiOutlineShareAlt className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1 text-neutral-600 hover:text-black transition-colors"
              title="下载"
            >
              <AiOutlineCloudDownload className="w-4 h-4" />
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
            <AiOutlineUp className="w-4 h-4" />
          ) : (
            <AiOutlineDown className="w-4 h-4" />
          )}
        </button>
      </div>

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
};

export default AudioPlayer;