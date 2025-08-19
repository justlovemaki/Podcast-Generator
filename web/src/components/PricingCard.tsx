import React from 'react';
import { PricingPlan, Feature } from '../types'; // 导入之前定义的类型

interface PricingCardProps {
  plan: PricingPlan;
}

const FeatureItem: React.FC<{ feature: Feature }> = ({ feature }) => (
  <li className="flex items-start gap-3">
    {feature.included ? (
      <svg
        className="h-5 w-5 text-neutral-500 flex-shrink-0" // 使用中度灰色作为对勾图标的颜色
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        ></path>
      </svg>
    ) : (
      <svg
        className="h-5 w-5 text-neutral-300 flex-shrink-0" // 未包含的功能使用更浅的灰色
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    )}
    <span className="text-neutral-900 text-base font-medium"> {/* 文字调小，从text-lg到text-base */}
      {feature.name}
      {feature.notes && (
        <span className="ml-2 text-neutral-500 text-xs"> {/* 文字调小，从text-sm到text-xs */}
          {feature.notes}
        </span>
      )}
    </span>
  </li>
);

const PricingCard: React.FC<PricingCardProps> = ({ plan }) => {
  const isMostPopular = plan.isMostPopular;

  return (
    <div
      className={`
        relative
        ${isMostPopular ? 'p-5 rounded-[2rem] bg-[#EBE9FE]' : ''} /* 突出卡片的外部容器 */
        flex-shrink-0
        w-full lg:w-1/3 xl:w-96 {/* 确保在小屏幕全宽，在大屏幕为1/3宽度，并限制最大宽度为96 (384px) */}
      `}
    >
      {isMostPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-medium text-sm font-semibold text-neutral-800 whitespace-nowrap">
          最受欢迎
        </div>
      )}
      <div
        className={`
          bg-white
          rounded-[1.5rem] /* border-radius 24px */
          p-8 /* padding 32px */
          shadow-medium /* 对应 .card-hover 中的 shadow-medium */
          flex
          flex-col
          gap-6 /* 控制内部元素的垂直间距 24px */
          min-h-[580px] md:h-[680px] {/* 固定高度，可根据实际内容调整 */}
        `}
      >
        <h3 className="text-3xl font-bold text-neutral-900 text-center">
          {plan.name}
        </h3>

        <div className="text-center my-4">
          <span className="text-6xl font-extrabold text-neutral-900">
            {plan.currency}
            {plan.price}
          </span>
          <span className="text-xl text-neutral-500 ml-2">
            /{plan.period === 'monthly' ? '月' : '月'}
          </span>
        </div>

        <button
          className={`
            w-full
            py-4 /* padding 12px 0 */
            rounded-xl /* border-radius 12px */
            font-semibold
            text-white
            transition-transform
            duration-200
            ease-in-out
            hover:scale-[1.03]
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            ${plan.buttonVariant === 'primary' ? 'bg-gradient-to-r from-brand-purple to-brand-pink focus:ring-[#7C6BDE]' : 'bg-neutral-900 focus:ring-neutral-900'}
          `}
        >
          {plan.ctaText}
        </button>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar"> {/* 允许特性列表滚动，并添加自定义滚动条和右边距 */}
          <ul className="space-y-4"> {/* 控制功能列表项之间的间距 */}
            {plan.features.map((feature, index) => (
              <FeatureItem key={index} feature={feature} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;