import Link from 'next/link';
import React from 'react';

/**
 * FooterLinks 组件用于展示页脚的法律和联系链接。
 * 采用了 Next.js 的 Link 组件进行客户端路由，并使用 Tailwind CSS 进行样式布局。
 *
 * @returns {React.FC} 包含链接布局的 React 函数组件。
 */
const FooterLinks: React.FC = () => {
  const links = [
    { href: '/terms', label: '使用条款' },
    { href: '/privacy', label: '隐私政策' },
    { href: '/contact', label: '联系我们' },
    { href: '#', label: '© 2025 Hex2077' },
  ];

  return (
    <div className="w-full">
      {/* 分隔符 */}
      <div className="border-t border-gray-200 pt-6 mt-6"></div>
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
        {/* 遍历链接数组，为每个链接创建 Link 组件 */}
        {links.map((link) => (
          <Link key={link.href} href={link.href} target="_blank" className="hover:text-gray-900 transition-colors duration-200">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default FooterLinks;