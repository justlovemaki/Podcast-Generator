'use client';

import { useRouter, usePathname } from 'next/navigation'; // 导入 usePathname
import { useTranslation } from '../i18n/client'; // 导入自定义的 useTranslation

interface LanguageSwitcherProps {
  lang: string; // 新增 lang 属性
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ lang }) => {
  const { t, i18n } = useTranslation(lang, 'components'); // 初始化 useTranslation
  const router = useRouter();

  const switchLanguage = (locale: string) => {
    // 获取当前路径，并替换语言部分
    const currentPath = usePathname(); // 使用 usePathname 获取当前路径
    const newPath = `/${locale}${currentPath.substring(currentPath.indexOf('/', 1))}`;
    router.push(newPath);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => switchLanguage('zh-CN')}
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          i18n.language === 'zh-CN'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {t('languageSwitcher.chinese')}
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          i18n.language === 'en'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {t('languageSwitcher.english')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;