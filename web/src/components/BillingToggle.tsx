import React from 'react';

interface BillingToggleProps {
  billingPeriod: 'monthly' | 'annually';
  onToggle: (period: 'monthly' | 'annually') => void;
}

const BillingToggle: React.FC<BillingToggleProps> = ({ billingPeriod, onToggle }) => {
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
        连续包月
      </button>
      <button
        type="button"
        onClick={() => onToggle('annually')}
        className={`
          relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
          ${billingPeriod === 'annually' ? 'bg-white text-neutral-900 shadow-medium' : 'text-neutral-500'}
        `}
      >
        连续包年
      </button>
      {billingPeriod === 'annually' && (
        <span className="absolute right-0 mr-4 ml-2 -translate-y-1/2 top-1/2 px-3 py-1 bg-[#FCE7F3] text-[#F381AA] rounded-full text-xs font-semibold whitespace-nowrap hidden sm:inline-block">
          节省 20%
        </span>
      )}
    </div>
  );
};

export default BillingToggle;