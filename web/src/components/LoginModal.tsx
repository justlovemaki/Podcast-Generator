// web/src/components/LoginModal.tsx
"use client"; // 标记为客户端组件，因为需要交互性

import React, { FC, MouseEventHandler, useCallback, useRef } from "react";
import { signIn } from '@/lib/auth-client';
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline"; // 导入关闭图标
import { Chrome, Github } from "lucide-react"; // 从 lucide-react 导入 Google 和 GitHub 图标

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: FC<LoginModalProps> = ({ isOpen, onClose }) => {
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
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 sm:p-8 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-scale-in"
        // 使用 Tailwind CSS 动画来优化进入效果，确保布局健壮性
        style={{ animationFillMode: 'forwards' }} // 动画结束后保持最终状态
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label="关闭登录弹出框"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          登录您的账户
        </h2>

        <div className="space-y-4">
          <button
            onClick={() => signIn.social({ provider: "google" , newUserCallbackURL: "/api/newuser?provider=google"})}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-lg font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Chrome className="h-6 w-6" />
            <span className="text-lg">使用 Google 登录</span>
          </button>

          <button
            onClick={() => signIn.social({ provider: "github" , newUserCallbackURL: "/api/newuser?provider=github" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-lg font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Github className="h-6 w-6" />
            <span className="text-lg">使用 GitHub 登录</span>
          </button>
        </div>
      </div>
    </div>,
    document.body // 渲染到 body 元素下
  );
};

export default LoginModal;

// 添加一个简单的 Tailwind CSS 动画到你的 web/tailwind.config.js 文件中
// 示例：
// module.exports = {
//   theme: {
//     extend: {
//       keyframes: {
//         'scale-in': {
//           '0%': { transform: 'scale(0.95)', opacity: '0' },
//           '100%': { transform: 'scale(1)', opacity: '1' },
//         }
//       },
//       animation: {
//         'scale-in': 'scale-in 0.2s ease-out',
//       }
//     }
//   }
// }