'use client';

import React from 'react';
import { 
  Home, 
  Library, 
  Compass, 
  DollarSign, 
  Coins, 
  Settings,
  Twitter,
  MessageCircle,
  Mail,
  Cloud,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean; // 添加移动端侧边栏状态属性
  credits: number; // 添加 credits 属性
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false, // 解构移动端侧边栏状态属性
  credits // 解构 credits 属性
}) => {
  const mainNavItems: NavItem[] = [
    { id: 'home', label: '首页', icon: Home },
    // 隐藏资料库和探索
    // { id: 'library', label: '资料库', icon: Library },
    // { id: 'explore', label: '探索', icon: Compass },
  ];

  const bottomNavItems: NavItem[] = [
    // 隐藏定价和积分
    // { id: 'pricing', label: '定价', icon: DollarSign },
    // { id: 'credits', label: '积分', icon: Coins, badge: credits.toString() }, // 动态设置 badge
    { id: 'settings', label: 'TTS设置', icon: Settings },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: MessageCircle, href: '#', label: 'Discord' },
    { icon: Mail, href: '#', label: 'Email' },
    { icon: Cloud, href: '#', label: 'Cloud' },
    { icon: Smartphone, href: '#', label: 'Mobile' },
  ];

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-neutral-50 border-r border-neutral-200 flex flex-col justify-between transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-64",
      "max-md:left-[-256px] max-md:transition-transform max-md:duration-300", // 在中等屏幕以下默认隐藏
      mobileOpen && "max-md:left-0" // 在移动端打开时显示侧边栏
    )}>
      {/* 顶部Logo区域 */}
      <div className={cn("p-6", collapsed && "px-2")}>
        {/* Logo和品牌区域 - 统一结构 */}
        <div className="flex items-center mb-8 h-8">
          {collapsed ? (
            /* 收起状态 - 只显示展开按钮 */
            <div className="w-full flex justify-center">
              <button 
                onClick={onToggleCollapse}
                className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                title="展开侧边栏"
              >
                <PanelLeftOpen className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            /* 展开状态 - Logo和品牌名称 */
            <>
              {/* Logo图标 */}
              <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-white rounded-sm opacity-80" />
              </div>
              
              {/* 品牌名称容器 - 慢慢收缩动画 */}
              <div className="overflow-hidden transition-all duration-500 ease-in-out w-auto ml-3">
                <span className="text-xl font-semibold text-black whitespace-nowrap transition-all duration-500 ease-in-out transform-gpu opacity-100 scale-x-100">PodcastHub</span>
              </div>
              
              {/* 收起按钮 */}
              <div className="flex-shrink-0 ml-auto">
                <button 
                  onClick={onToggleCollapse}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 border border-neutral-200 transition-all duration-200"
                  title="收起侧边栏"
                >
                  <PanelLeftClose className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* 主导航 */}
        <nav className="space-y-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <div key={item.id} className={cn(collapsed && "flex justify-center")}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "flex items-center rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-50 transition-all duration-200",
                    isActive && "bg-white text-black shadow-soft",
                    collapsed ? "justify-center w-8 h-8 px-0" : "w-full px-3 py-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {/* 文字容器 - 慢慢收缩动画 */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-500 ease-in-out",
                    collapsed ? "w-0 ml-0" : "w-auto ml-3"
                  )}>
                    <span className={cn(
                      "text-sm whitespace-nowrap transition-all duration-500 ease-in-out transform-gpu",
                      collapsed ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                    )}>{item.label}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 底部区域 */}
      <div className={cn("p-6", collapsed && "px-2")}>
        {/* 底部导航 */}
        <nav className="space-y-2 mb-6">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <div key={item.id} className={cn(collapsed && "flex justify-center")}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "flex items-center rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-50 transition-all duration-200",
                    isActive && "bg-white text-black shadow-soft",
                    collapsed ? "justify-center w-8 h-8 px-0" : "w-full px-3 py-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {/* 文字容器 - 慢慢收缩动画 */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-500 ease-in-out",
                    collapsed ? "w-0 ml-0" : "w-auto ml-3"
                  )}>
                    <span className={cn(
                      "text-sm whitespace-nowrap transition-all duration-500 ease-in-out transform-gpu",
                      collapsed ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                    )}>{item.label}</span>
                    {item.badge && !collapsed && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </nav>

        {/* 社交链接 - 慢慢收缩动画 */}
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out border-t border-neutral-200",
          collapsed ? "h-0 pt-0" : "h-auto pt-4"
        )}>
          <div className={cn(
            "flex items-center gap-3 transition-all duration-500 ease-in-out transform-gpu",
            collapsed ? "opacity-0 scale-y-0" : "opacity-100 scale-y-100"
          )}>
            {socialLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={link.href}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  title={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;