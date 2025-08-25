"use client";

import Link from 'next/link';
import React from 'react';
import { useTranslation } from '../i18n/client'; // 导入 useTranslation
import { usePathname } from 'next/navigation'; // 导入 usePathname
import { getTruePathFromPathname } from '../lib/utils'; // 导入新函数
import LanguageSwitcher from './LanguageSwitcher'; // 导入语言切换组件

/**
 * FooterLinks 组件用于展示页脚的法律和联系链接。
 * 采用了 Next.js 的 Link 组件进行客户端路由，并使用 Tailwind CSS 进行样式布局。
 *
 * @returns {React.FC} 包含链接布局的 React 函数组件。
 */
const FooterLinks: React.FC<{ lang: string }> = ({ lang: initialLang }) => {
  const { t } = useTranslation(initialLang, 'components'); // 初始化 useTranslation 并指定命名空间
  const pathname = usePathname();
  const truePath = getTruePathFromPathname(pathname, initialLang); // 使用公共方法获取 lang
  // console.log('truePath:', truePath);
  const links = [
    { href: `${truePath}/terms`, label: t('footerLinks.termsOfUse') },
    { href: `${truePath}/privacy`, label: t('footerLinks.privacyPolicy') },
    { href: `${truePath}/contact`, label: t('footerLinks.contactUs') },
    { href: '/', label: t('footerLinks.copyright') },
  ];

  return (
    <div className="w-full">
      {/* 分隔符 */}
      <div className="border-t border-gray-200 pt-6 mt-6"></div>
      <div className="flex flex-col md:flex-col justify-between items-center">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
          {/* 遍历链接数组，为每个链接创建 Link 组件 */}
          {links.map((link) => (
            <Link key={link.href} href={link.href} target="_blank" className="hover:text-gray-900 transition-colors duration-200">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 md:mt-0">
          <LanguageSwitcher lang={initialLang} />
        </div>
      </div>
    </div>
  );
};

export default FooterLinks;