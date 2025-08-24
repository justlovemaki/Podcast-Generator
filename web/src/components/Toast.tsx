'use client';

import React, { useEffect, useState } from 'react';
import { AiOutlineClose, AiFillCheckCircle, AiFillWarning, AiFillInfoCircle } from 'react-icons/ai';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 进入动画
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 10); // 短暂延迟，确保CSS动画生效
    
    // 自动关闭
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 200); // 调整动画时长，保持流畅
  };
 
   const getIcon = () => {
     switch (type) {
       case 'success':
           return <AiFillCheckCircle className="w-5 h-5 text-green-600" />; // 更深沉的绿色
       case 'error':
           return <AiFillWarning className="w-5 h-5 text-red-600" />; // 更深沉的红色
       case 'warning':
           return <AiFillWarning className="w-5 h-5 text-orange-500" />; // 调整为橙色
       case 'info':
           return <AiFillInfoCircle className="w-5 h-5 text-blue-600" />; // 更深沉的蓝色
       default:
           return <AiFillInfoCircle className="w-5 h-5 text-gray-500" />; // 默认灰色
     }
   };
 
   const getAccentColor = () => {
     switch (type) {
       case 'success':
         return 'border-green-500';
       case 'error':
         return 'border-red-500';
       case 'warning':
         return 'border-orange-400';
       case 'info':
         return 'border-blue-500';
       default:
         return 'border-gray-300';
     }
   };
 
   return (
     <div
       className={cn(
         "flex items-start gap-3 p-4 rounded-lg shadow-lg bg-white border border-gray-200 backdrop-blur-md max-w-sm w-full transition-all duration-300 ease-in-out pointer-events-auto",
         getAccentColor(), // 添加左侧强调色边框
         isVisible && !isLeaving ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0" // 向上弹出动画
       )}
     >
       {getIcon()}
       
       <div className="flex-1 min-w-0">
         <h4 className="font-semibold text-base text-gray-800 mb-1"> {/* 字体更粗，颜色更深 */}
           {title}
         </h4>
         {message && (
           <p className="text-sm text-gray-600 leading-relaxed break-words"> {/* 字体稍大，颜色更深，允许换行 */}
             {message}
           </p>
         )}
       </div>
 
       <button
         onClick={handleClose}
         className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
       >
         <AiOutlineClose className="w-4 h-4" />
       </button>
     </div>
   );
 };
 
 // Toast容器组件
 export interface ToastContainerProps {
   toasts: ToastProps[];
   onRemove: (id: string) => void;
 }
 
 export const ToastContainer: React.FC<ToastContainerProps> = ({
   toasts,
   onRemove,
 }) => {
   return (
     <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 flex flex-col items-center space-y-3"> {/* 定位到顶部水平居中，并限制宽度，使用flex布局垂直居中，增加间距 */}
       {toasts.map((toast) => (
         <Toast
           key={toast.id}
           {...toast}
           onClose={onRemove}
         />
       ))}
     </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, message?: string) =>
    addToast({ type: 'success', title, message });
  
  const error = (title: string, message?: string) =>
    addToast({ type: 'error', title, message });
  
  const warning = (title: string, message?: string) =>
    addToast({ type: 'warning', title, message });
  
  const info = (title: string, message?: string) =>
    addToast({ type: 'info', title, message });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
};

export default Toast;