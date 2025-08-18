'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerControlsProps {
  audioUrl: string;
  audioDuration?: string;
}

export default function AudioPlayerControls({ audioUrl, audioDuration }: AudioPlayerControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const onEnded = () => {
        setIsPlaying(false);
      };
      audio.addEventListener('ended', onEnded);
      return () => {
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, []);

  return (
    <div className="flex justify-center my-8">
      <button
        onClick={togglePlayPause}
        className="bg-gray-900 text-white rounded-full px-6 py-3 inline-flex items-center gap-2 font-semibold hover:bg-gray-700 transition-colors shadow-md"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        <span>{isPlaying ? '暂停' : '播放'} ({audioDuration ?? '00:00'})</span>
      </button>
      <audio ref={audioRef} src={audioUrl} preload="auto" />
    </div>
  );
}