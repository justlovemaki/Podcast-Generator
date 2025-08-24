import React from 'react';
import { useTranslation } from '../i18n/client'; // 导入 useTranslation

interface BillingToggleProps {
  billingPeriod: 'monthly' | 'annually';
  onToggle: (period: 'monthly' | 'annually') => void;
  lang: string; // 新增 lang 属性
}

const BillingToggle: React.FC<BillingToggleProps> = ({ billingPeriod, onToggle, lang }) => {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
  return (
    <div className="relative flex items-center justify-center p-1 bg-neutral-100 rounded-full shadow-inner-sm">
      <button
        type="button"
        onClick={() => onToggle('monthly')}
        className={`
          relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
          ${billingPeriod === 'monthly' ? 'bg-white text-neutral-900 shadow-medium' : 'text-neutral-500'}
        `}
      >
        {t('billingToggle.monthly')}
      </button>
      <button
        type="button"
        onClick={() => onToggle('annually')}
        className={`
          relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
          ${billingPeriod === 'annually' ? 'bg-white text-neutral-900 shadow-medium' : 'text-neutral-500'}
        `}
      >
        {t('billingToggle.annually')}
      </button>
      {billingPeriod === 'annually' && (
        <span className="absolute right-0 mr-4 ml-2 -translate-y-1/2 top-1/2 px-3 py-1 bg-[#FCE7F3] text-[#F381AA] rounded-full text-xs font-semibold whitespace-nowrap hidden sm:inline-block">
          {t('billingToggle.save20Percent')}
        </span>
      )}
    </div>
  );
};

export default BillingToggle;