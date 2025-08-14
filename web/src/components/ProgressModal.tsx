'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PodcastGenerationResponse } from '@/types';

interface ProgressModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: PodcastGenerationResponse) => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onComplete
}) => {
  const [task, setTask] = useState<PodcastGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !taskId) return;

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/generate-podcast?id=${taskId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch progress');
        }

        const result = await response.json();
        if (result.success) {
          setTask(result.data);
          
          if (result.data.status === 'completed') {
            onComplete?.(result.data);
          } else if (result.data.status === 'error') {
            setError(result.data.error || '生成失败');
          }
        } else {
          setError(result.error || '获取进度失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
      }
    };

    // 立即执行一次
    pollProgress();

    // 设置轮询
    const interval = setInterval(pollProgress, 2000);

    return () => clearInterval(interval);
  }, [taskId, isOpen, onComplete]);

  if (!isOpen) return null;

  const getStatusText = (status: PodcastGenerationResponse['status']) => {
    switch (status) {
      case 'pending': return '准备中...';
      case 'generating_outline': return '生成播客大纲...';
      case 'generating_script': return '生成播客脚本...';
      case 'generating_audio': return '生成音频文件...';
      case 'merging': return '合并音频...';
      case 'completed': return '生成完成！';
      case 'error': return '生成失败';
      default: return '处理中...';
    }
  };

  const getStatusIcon = (status: PodcastGenerationResponse['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
    }
  };

  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 60) return `约 ${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `约 ${minutes} 分 ${remainingSeconds} 秒`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">生成播客</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          /* 错误状态 */
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">生成失败</h3>
            <p className="text-neutral-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              关闭
            </button>
          </div>
        ) : task ? (
          /* 进度显示 */
          <div>
            {/* 状态图标和文本 */}
            <div className="text-center mb-6">
              {getStatusIcon(task.status)}
              <h3 className="text-lg font-medium text-black mt-3 mb-2">
                {getStatusText(task.status)}
              </h3>
              {task.status !== 'completed' && task.status !== 'error' && task.estimatedTime && (
                <p className="text-sm text-neutral-600">
                  预计还需 {formatEstimatedTime(Math.max(0, task.estimatedTime - (task.progress / 100) * task.estimatedTime))}
                </p>
              )}
            </div>

            {/* 进度条 */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-neutral-600 mb-2">
                <span>进度</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 ease-out",
                    task.status === 'error' ? 'bg-red-500' : 
                    task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>

            {/* 步骤指示器 */}
            <div className="space-y-3 mb-6">
              {[
                { key: 'generating_outline', label: '生成大纲' },
                { key: 'generating_script', label: '生成脚本' },
                { key: 'generating_audio', label: '生成音频' },
                { key: 'merging', label: '合并处理' },
              ].map((step, index) => {
                const isActive = task.status === step.key;
                const isCompleted = ['generating_outline', 'generating_script', 'generating_audio', 'merging'].indexOf(task.status) > index;
                
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-500 text-white' :
                      'bg-neutral-200 text-neutral-500'
                    )}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span className={cn(
                      "text-sm",
                      isActive ? 'text-black font-medium' :
                      isCompleted ? 'text-green-600' :
                      'text-neutral-500'
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 完成状态的操作按钮 */}
            {task.status === 'completed' && (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  关闭
                </button>
                {task.audioUrl && (
                  <button
                    onClick={() => {
                      // 这里可以触发播放或下载
                      window.open(task.audioUrl, '_blank');
                    }}
                    className="btn-primary flex-1"
                  >
                    播放
                  </button>
                )}
              </div>
            )}

            {/* 取消按钮（仅在进行中时显示） */}
            {task.status !== 'completed' && task.status !== 'error' && (
              <button
                onClick={onClose}
                className="btn-secondary w-full"
              >
                在后台继续
              </button>
            )}
          </div>
        ) : (
          /* 加载状态 */
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">正在获取任务信息...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressModal;