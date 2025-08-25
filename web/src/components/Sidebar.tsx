'use client';

import React, { useState, useEffect, useRef } from 'react'; // 导入 useState, useEffect, 和 useRef 钩子
import {
  AiOutlineHome,
  AiOutlineSetting,
  AiOutlineAudio,
  AiOutlineTwitter,
  AiOutlineTikTok,
  AiOutlineMail,
  AiOutlineGithub,
  AiOutlineMenuFold,
  AiOutlineMenuUnfold,
  AiOutlineMoneyCollect, // 或者 AiOutlineDollarCircle
  AiOutlineLogin, // 导入 AiOutlineLogin 图标用于登录按钮
  AiOutlineUser // 导入 AiOutlineUser 图标用于默认头像
} from 'react-icons/ai';
import { signOut } from '@/lib/auth-client'; // 导入 signOut 函数
import { useRouter } from 'next/navigation'; // 导入 useRouter 钩子
import { getSessionData } from '@/lib/server-actions';
import { cn } from '@/lib/utils';
import LoginModal from './LoginModal'; // 导入 LoginModal 组件
import type { PodcastItem } from '@/types';
import { useTranslation } from '../i18n/client'; // 导入 useTranslation
import { usePathname } from 'next/navigation'; // 导入 usePathname
import { getTruePathFromPathname } from '../lib/utils'; // 导入新函数

const enableTTSConfigPage = process.env.NEXT_PUBLIC_ENABLE_TTS_CONFIG_PAGE === 'true';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean; // 添加移动端侧边栏状态属性
  credits: number; // 添加 credits 属性
  onPodcastExplore: (podcasts: PodcastItem[]) => void; // 添加刷新播客函数
  onCreditsChange: (newCredits: number) => void; // 添加 onCreditsChange 回调函数
  lang: string; // 新增 lang 属性
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
  mobileOpen, // 解构移动端侧边栏状态属性
  credits, // 解构 credits 属性
  onPodcastExplore, // 解构刷新播客函数
  onCreditsChange, // 解构 onCreditsChange 属性
  lang // 解构 lang 属性
}) => {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
  const [showLoginModal, setShowLoginModal] = useState(false); // 控制登录模态框的显示状态
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // 控制注销确认模态框的显示状态
  const [session, setSession] = useState<any>(null); // 使用 useState 管理 session
  const didFetch = useRef(false); // 使用 useRef 确保 useEffect 只在组件挂载时执行一次
  const router = useRouter(); // 初始化 useRouter 钩子
  const pathname = usePathname();
  const truePath = getTruePathFromPathname(pathname, lang);

  useEffect(() => {
    // 首次加载时获取 session
    if (!didFetch.current) {
      didFetch.current = true; // 标记为已执行，避免在开发模式下重复执行
      const fetchSession = async () => {
        const { session: fetchedSession, user: fetchedUser } = await getSessionData();
        setSession(fetchedSession);
        console.log('session', fetchedSession); // 确保只在 session 数据获取并设置后打印
      };
      fetchSession();
    }

    // 检查 session 是否过期
    if (session?.expiresAt) {
      const expirationTime = session.expiresAt.getTime();
      const currentTime = new Date().getTime();

      if (currentTime > expirationTime) {
        console.log(t('sidebar.sessionExpired'));
        signOut({
          fetchOptions: {
            onSuccess: () => {
              setSession(null); // 会话过期，注销成功后清空本地 session 状态
              onCreditsChange(0); // 清空积分
              router.push(truePath+"/"); // 会话过期，执行注销并重定向到主页
            },
          },
        });
      }
    }
  }, [session, router, onCreditsChange, t]); // 监听 session 变化和 router（因为 signOut 中使用了 router.push），并添加 onCreditsChange

  // todo
  const mainNavItems: NavItem[] = [
    { id: 'home', label: t('sidebar.home'), icon: AiOutlineHome },
    // 隐藏资料库和探索
    // { id: 'library', label: t('sidebar.library'), icon: Library },
    // { id: 'explore', label: t('sidebar.explore'), icon: Compass },
  ];

  const bottomNavItems: NavItem[] = [
    // 隐藏定价和积分
    // { id: 'pricing', label: t('sidebar.pricing'), icon: DollarSign },
    { id: 'credits', label: t('sidebar.points'), icon: AiOutlineMoneyCollect, badge: credits.toString() }, // 动态设置 badge
    ...(enableTTSConfigPage ? [{ id: 'tts-settings', label: t('sidebar.ttsSettings'), icon: AiOutlineAudio }] : []),
  ];


  const socialLinks = [
    { icon: AiOutlineGithub, href: 'https://github.com/justlovemaki', label: t('sidebar.github') },
    { icon: AiOutlineTwitter, href: 'https://x.com/justlikemaki', label: t('sidebar.twitter') },
    { icon: AiOutlineTikTok, href: 'https://cdn.jsdmirror.com/gh/justlovemaki/imagehub@main/logo/7fc30805eeb831e1e2baa3a240683ca3.md.png', label: t('sidebar.tiktok') },
    { icon: AiOutlineMail, href: 'mailto:justlikemaki@foxmail.com', label: t('sidebar.email') },
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
                title={t('sidebar.expandSidebar')}
              >
                <AiOutlineMenuUnfold className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            /* 展开状态 - Logo和品牌名称 */
            <>
              {/* 品牌名称容器 - 慢慢收缩动画 */}
              <div className="overflow-hidden transition-all duration-500 ease-in-out w-auto ">
                <svg className="h-[30px] w-[180px] sm:h-[30px] sm:w-[180px]" viewBox="0 0 800 150" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path 
                      d="M49 98.5 C 56 56.5, 65 56.5, 73 90.5 C 79 120.5, 85 125.5, 91 100.5 C 96 80.5, 100 75.5, 106 95.5 C 112 115.5, 118 108.5, 125 98.5"
                      className="fill-none stroke-[10] stroke-round stroke-join-round" // 调整描边宽度为 7
                      stroke="black"
                    />

                    <text
                      x="140"
                      y="125"
                      className={`font-bold text-[95px]`} // 应用艺术字体
                      fill="black"
                    >
                      PodcastHub
                    </text>
                  </g>
                </svg>
              </div>
              
              {/* 收起按钮 */}
              <div className="flex-shrink-0 ml-auto">
                <button
                  onClick={onToggleCollapse}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 border border-neutral-200 transition-all duration-200"
                  title={t('sidebar.collapseSidebar')}
                >
                  <AiOutlineMenuFold className="w-4 h-4 text-neutral-500" />
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
        <nav className="space-y-2 mb-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <div key={item.id} className={cn(collapsed && "flex justify-center")}>
                <button
                  onClick={() => {
                    if (item.id === 'credits' && !session) {
                      setShowLoginModal(true);
                    } else {
                      onViewChange(item.id);
                    }
                  }}
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
            "flex items-center justify-center gap-3 transition-all duration-500 ease-in-out transform-gpu",
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

        {/* 用户认证区域 */}
        <div className={cn("mt-2", "flex", "justify-center")}>
          {session?.user ? (
            // 用户已登录
            <div className={cn(
              "flex items-center transition-all duration-200",
              collapsed ? "flex-col" : "flex-row py-2 pr-2 gap-1", // 调整：collapsed时移除gap，展开时添加gap
            )}>
              {/* 用户头像 - 添加点击事件 */}
              <button
                onClick={() => {
                  if (!collapsed) { // 只有在展开状态下点击头像才弹出确认
                    setShowLogoutConfirm(true);
                  } else { // 折叠状态下，点击头像可以考虑不做任何事或做其他提示
                    // 可以在这里添加其他逻辑，例如提示“展开侧边栏以注销”
                  }
                }}
                className={cn(
                  "flex items-center justify-center rounded-full overflow-hidden cursor-pointer",
                  collapsed ? "w-8 h-8" : "w-10 h-10",
                  !collapsed && "hover:opacity-80 transition-opacity" // 展开时添加悬停效果
                )}
                title={collapsed ? (session.user.name || session.user.email || t('sidebar.user')) : t('sidebar.clickAvatarToLogout')}
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={t('sidebar.userAvatar')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                    <AiOutlineUser className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
              </button>

              {/* 用户名 */}
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                collapsed ? "hidden" : "w-auto flex-grow ml-3" // 收缩时添加 hidden class，不占用空间
              )}>
                <span className={cn(
                  "whitespace-nowrap transition-all duration-500 ease-in-out transform-gpu",
                  collapsed ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100 text-neutral-800 font-medium" // 收缩时文字也隐藏
                )}>
                  {session.user.name || session.user.email || t('sidebar.user')}
                </span>
              </div>
            </div>
          ) : (
            // 用户未登录
            <button
              onClick={() => setShowLoginModal(true)}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200",
                collapsed ? "justify-center w-8 h-8 px-0 text-neutral-600 hover:text-black hover:bg-neutral-50" : "justify-center w-[95%] mx-auto py-2 bg-black text-white hover:opacity-80"
              )}
              title={collapsed ? t('sidebar.login') : undefined}
            >
              <AiOutlineLogin className="w-5 h-5 flex-shrink-0" />
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                collapsed ? "w-0 ml-0" : "w-auto ml-3"
              )}>
                <span className={cn(
                  "text-sm whitespace-nowrap transition-all duration-500 ease-in-out transform-gpu",
                  collapsed ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                )}>{t('sidebar.login')}</span>
              </div>
            </button>
          )}
        </div>
        {/* 注销确认模态框 */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <p className="mb-4 text-lg font-semibold">{t('sidebar.areYouSureToLogout')}</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition-colors"
                >
                  {t('sidebar.cancel')}
                </button>
                <button
                  onClick={() => {
                    signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          setSession(null); // 注销成功后清空本地 session 状态
                          onPodcastExplore([]); // 注销后清空播客卡片
                          onCreditsChange(0); // 清空积分
                          router.push(truePath+"/"); // 注销成功后重定向到主页
                        },
                      },
                    });
                    setShowLogoutConfirm(false); // 关闭确认模态框
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  {t('sidebar.confirmLogout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 登录模态框 */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} lang={lang} />
    </div>
  );
};

export default Sidebar;