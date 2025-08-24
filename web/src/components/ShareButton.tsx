'use client';

import React from 'react';
import { AiOutlineShareAlt } from 'react-icons/ai';
import { useToast, ToastContainer} from './Toast'; // 确保路径正确
import { usePathname } from 'next/navigation'; // next/navigation 用于获取当前路径
import { useTranslation } from '../i18n/client'; // 导入 useTranslation

interface ShareButtonProps {
  className?: string; // 允许外部传入样式
  lang: string; // 新增 lang 属性
}

const ShareButton: React.FC<ShareButtonProps> = ({ className, lang }) => {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
  const { toasts, success, error, removeToast } = useToast();
  const pathname = usePathname(); // 获取当前路由路径

  const handleShare = async () => {
    console.log('handleShare clicked'); // 添加点击日志
    try {
      const currentUrl = window.location.origin + pathname; // 构建完整的当前页面 URL
      await navigator.clipboard.writeText(currentUrl);
      success(t('shareButton.copySuccess'), t('shareButton.pageLinkCopied'));
      console.log(`${t('shareButton.pageLinkCopied')}:`, currentUrl); // 添加成功日志
    } catch (err) {
      console.error(`${t('shareButton.copyFailed')}:`, err); // 保留原有错误日志
      error(t('shareButton.copyFailed'), t('shareButton.cannotCopyPageLink'));
      console.error(`${t('shareButton.cannotCopyPageLink')}, ${t('shareButton.errorInfo')}:`, err); // 添加详细错误日志
    }
  };

  return (
    <>
    <button
      onClick={handleShare}
      className={`text-neutral-500 hover:text-black transition-colors text-sm ${className}`}
      aria-label={t('shareButton.sharePage')}
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