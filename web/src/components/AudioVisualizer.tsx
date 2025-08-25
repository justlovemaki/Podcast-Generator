'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioElement?: HTMLAudioElement | null;
  isPlaying?: boolean;
  className?: string;
  barCount?: number;
  height?: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  isPlaying = false,
  className,
  barCount = 20,
  height = 40,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    // 创建音频上下文和分析器
    const initAudioContext = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = context.createAnalyser();
        const source = context.createMediaElementSource(audioElement);
        
        source.connect(analyser);
        analyser.connect(context.destination);
        
        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        setAudioContext(context);
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
      } catch (error) {
        console.warn('Audio visualization not supported:', error);
      }
    };

    initAudioContext();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioElement, audioContext]); // 添加 audioContext

  useEffect(() => {
    if (!isPlaying || !analyserRef.current || !dataArrayRef.current || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      // @ts-ignore - Web Audio API类型兼容性问题
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      let x = 0;

      // 绘制频谱条
      for (let i = 0; i < barCount; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * canvas.height;
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#A076F9');
        gradient.addColorStop(1, '#E893CF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, barCount]);

  // 静态波形（当没有播放时）
  const renderStaticWave = () => {
    const bars = [];
    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * 0.7 + 0.1; // 10% - 80% 高度
      bars.push(
        <div
          key={i}
          className="bg-gradient-to-t from-brand-purple to-brand-pink rounded-sm opacity-30"
          style={{
            height: `${height * 100}%`,
            width: `${100 / barCount - 1}%`,
          }}
        />
      );
    }
    return bars;
  };

  return (
    <div className={cn("flex items-end justify-center gap-0.5", className)} style={{ height }}>
      {analyserRef.current && isPlaying ? (
        <canvas
          ref={canvasRef}
          width={200}
          height={height}
          className="w-full h-full"
        />
      ) : (
        renderStaticWave()
      )}
    </div>
  );
};

export default AudioVisualizer;