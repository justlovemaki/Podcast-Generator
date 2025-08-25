'use client';

import { useRouter, usePathname } from 'next/navigation'; // 导入 usePathname
import { useTranslation } from '../i18n/client'; // 导入自定义的 useTranslation

interface LanguageSwitcherProps {
  lang: string; // 新增 lang 属性
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ lang }) => {
  const { t, i18n } = useTranslation(lang, 'components'); // 初始化 useTranslation
  const router = useRouter();
  const currentPath = usePathname(); // 将 usePathname 移到组件顶层

  const switchLanguage = (locale: string) => {
    // 获取当前路径，并替换语言部分
    let newPath = currentPath;
    
    // 检查当前路径是否以语言代码开头
    const langPattern = /^\/(en|zh-CN|ja)/;
    if (langPattern.test(currentPath)) {
      // 如果是，则替换为新的语言代码
      newPath = currentPath.replace(langPattern, `/${locale}`);
    } else {
      // 如果不是，则在路径开头添加语言代码
      newPath = `/${locale}${currentPath}`;
    }
    
    router.push(newPath);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => switchLanguage('zh-CN')}
        className={`px-3 py-1 rounded-md text-sm font-medium text-gray-500 ${
          i18n.language === 'zh-CN'
            ? 'text-gray-900 transition-colors duration-200'
            : 'hover:text-gray-900 transition-colors duration-200'
        }`}
      >
        {t('languageSwitcher.chinese')}
      </button>
      <button
        onClick={() => switchLanguage('')}
        className={`px-3 py-1 rounded-md text-sm font-medium text-gray-500 ${
          i18n.language === 'en'
            ? 'text-gray-900 transition-colors duration-200'
            : 'hover:text-gray-900 transition-colors duration-200'
        }`}
      >
        {t('languageSwitcher.english')}
      </button>
      <button
        onClick={() => switchLanguage('ja')}
        className={`px-3 py-1 rounded-md text-sm font-medium text-gray-500 ${
          i18n.language === 'ja'
            ? 'text-gray-900 transition-colors duration-200'
            : 'hover:text-gray-900 transition-colors duration-200'
        }`}
      >
        {t('languageSwitcher.japanese')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
