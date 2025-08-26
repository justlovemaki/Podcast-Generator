'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/client';

interface NotificationBannerProps {
  messageKey: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
  lang: string;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  messageKey,
  type = 'info',
  onClose,
  lang
}) => {
  const { t } = useTranslation(lang, 'components');
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // 从本地存储获取通知状态，避免重复显示
  useEffect(() => {
    const hasClosed = localStorage.getItem('notificationBannerClosed');
    if (hasClosed) {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // 添加关闭动画
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('notificationBannerClosed', 'true');
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  // 根据类型设置样式
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-0 transition-all duration-300 ease-in-out transform ${
      isClosing ? '-translate-y-full' : 'translate-y-0'
    }`}>
      <div className={`border-b ${getTypeStyles()} shadow-sm mx-auto`}>
        <div className="mx-auto px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-grow flex justify-center w-4/5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {type === 'success' && (
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {type === 'warning' && (
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {type === 'error' && (
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {type === 'info' && (
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{t(messageKey)}</p>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleClose}
                onTouchEnd={() => handleClose()}
                className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label={t('notificationBanner.close')}
              >
                <span className="sr-only">{t('close')}</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;