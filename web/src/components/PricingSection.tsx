'use client';

import React, { useState } from 'react';
import PricingCard from './PricingCard'; // 修改导入路径
import BillingToggle from './BillingToggle'; // 修改导入路径
import { PricingPlan } from '../types';

const PricingSection: React.FC = () => { // 重命名组件
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('annually');

  // 定义月度计划的特性常量
  const MONTHLY_CREATOR_FEATURES = [
    { name: '2,000 积分每月', included: true },
    { name: 'AI 语音合成', included: true },
    { name: '两个说话人支持', included: true },
    { name: '商业使用许可', included: true },
    { name: '音频下载', included: true },
  ] as const;

  const MONTHLY_PRO_FEATURES = [
    { name: '5,000 积分每月', included: true },
    { name: 'AI 语音合成', included: true },
    { name: '多说话人支持', included: true },
    { name: '商业使用许可', included: true },
    { name: '音频下载', included: true },
    { name: '高级音色', included: true },
    { name: '说书模式', included: true, notes: '即将推出'},
  ] as const;

  const MONTHLY_BUSINESS_FEATURES = [
    { name: '12,000 积分每月', included: true },
    { name: 'AI 语音合成', included: true },
    { name: '多说话人支持', included: true },
    { name: '商业使用许可', included: true },
    { name: '专用账户经理', included: true },
    { name: '音频下载', included: true },
    { name: '高级音色', included: true },
    { name: '说书模式', included: true, notes: '即将推出'},
    { name: 'API 访问', included: true, notes: '即将推出' },
  ] as const;

  const monthlyPlans: PricingPlan[] = [
    {
      name: '创作者',
      price: 9.9,
      currency: '$',
      period: 'monthly',
      features: MONTHLY_CREATOR_FEATURES,
      ctaText: '立即开始',
      buttonVariant: 'secondary',
    },
    {
      name: '专业版',
      price: 19.9,
      currency: '$',
      period: 'monthly',
      features: MONTHLY_PRO_FEATURES,
      ctaText: '升级至专业版',
      buttonVariant: 'primary',
      isMostPopular: true,
    },
    {
      name: '商业版',
      price: 39.9,
      currency: '$',
      period: 'monthly',
      features: MONTHLY_BUSINESS_FEATURES,
      ctaText: '升级至商业版',
      buttonVariant: 'secondary',
    },
  ];

  const annuallyPlans: PricingPlan[] = [
    {
      name: '创作者',
      price: 8, 
      currency: '$',
      period: 'annually',
      features: MONTHLY_CREATOR_FEATURES,
      ctaText: '立即开始',
      buttonVariant: 'secondary',
    },
    {
      name: '专业版',
      price: 16, 
      currency: '$',
      period: 'annually',
      features: MONTHLY_PRO_FEATURES,
      ctaText: '升级至专业版',
      buttonVariant: 'primary',
      isMostPopular: true,
    },
    {
      name: '商业版',
      price: 32, 
      currency: '$',
      period: 'annually',
      features: MONTHLY_BUSINESS_FEATURES,
      ctaText: '升级至商业版',
      buttonVariant: 'secondary',
    },
  ];

  const currentPlans = billingPeriod === 'monthly' ? monthlyPlans : annuallyPlans;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 leading-tight mb-4">
          选择适合你的计划
        </h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          无论你是个人创作者还是大型团队，我们都有满足你需求的方案。
        </p>
      </div>

      <div className="mb-12">
        <BillingToggle billingPeriod={billingPeriod} onToggle={setBillingPeriod} />
      </div>

      <div className="flex flex-col lg:flex-row justify-center items-center lg:items-end gap-8 w-full max-w-7xl">
        {currentPlans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </div>

      <div className="mt-12 text-center text-neutral-500">
        <a href="/pricing" target="_blank" className="flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
          访问定价页
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default PricingSection;