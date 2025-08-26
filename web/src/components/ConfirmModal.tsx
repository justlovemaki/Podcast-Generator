// web/src/components/ConfirmModal.tsx
"use client"; // 标记为客户端组件，因为需要交互性

import React, { FC, MouseEventHandler, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline"; // 导入关闭图标
import { useTranslation } from '../i18n/client'; // 导入 useTranslation

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  points?: number; // 新增 points 属性
  confirmText?: string;
  cancelText?: string;
  lang: string; // 新增 lang 属性
}

const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  points,
  confirmText,
  cancelText,
  lang
}) => {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击背景关闭模态框
  const handleOverlayClick: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  // 使用 React Portal 将模态框渲染到 body 下，避免Z-index问题和父组件样式影响
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-auto"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-4 sm:p-6 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-scale-in"
        // 使用 Tailwind CSS 动画来优化进入效果，确保布局健壮性
        style={{ animationFillMode: 'forwards' }} // 动画结束后保持最终状态
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label={t('podcastCreator.close')}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h2>
        
        <p
          className="text-gray-700 dark:text-gray-300 mb-6 text-center"
          dangerouslySetInnerHTML={{
            __html: message.replace('{{points}}',
              points !== undefined ?
              `<span class="font-bold text-brand-purple dark:text-brand-pink">${points}</span>` :
              '{{points}}'
            )
          }}
        />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {cancelText || t('podcastCreator.cancel')}
          </button>
          
          <button
            onClick={handleConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm font-medium text-white bg-gradient-to-r from-brand-purple to-brand-pink hover:from-brand-purple-hover hover:to-brand-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple transition-all"
          >
            {confirmText || t('podcastCreator.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body // 渲染到 body 元素下
  );
};

export default ConfirmModal;