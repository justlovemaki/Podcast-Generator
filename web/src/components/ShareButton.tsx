'use client';

import React from 'react';
import { AiOutlineShareAlt } from 'react-icons/ai';
import { useToast, ToastContainer} from './Toast'; // 确保路径正确
import { usePathname } from 'next/navigation'; // next/navigation 用于获取当前路径

interface ShareButtonProps {
  className?: string; // 允许外部传入样式
}

const ShareButton: React.FC<ShareButtonProps> = ({ className }) => {
  const { toasts, success, error, removeToast } = useToast();
  const pathname = usePathname(); // 获取当前路由路径

  const handleShare = async () => {
    console.log('handleShare clicked'); // 添加点击日志
    try {
      const currentUrl = window.location.origin + pathname; // 构建完整的当前页面 URL
      await navigator.clipboard.writeText(currentUrl);
      success('复制成功', '页面链接已复制到剪贴板！');
      console.log('页面链接已复制:', currentUrl); // 添加成功日志
    } catch (err) {
      console.error('复制失败:', err); // 保留原有错误日志
      error('复制失败', '无法复制页面链接到剪贴板。');
      console.error('无法复制页面链接到剪贴板，错误信息:', err); // 添加详细错误日志
    }
  };

  return (
    <>
    <button
      onClick={handleShare}
      className={`text-neutral-500 hover:text-black transition-colors text-sm ${className}`}
      aria-label="分享页面"
    >
      <AiOutlineShareAlt className="w-5 h-5" />
    </button>

    <ToastContainer
      toasts={toasts}
      onRemove={removeToast}
    />
    </>
  );
};

export default ShareButton;