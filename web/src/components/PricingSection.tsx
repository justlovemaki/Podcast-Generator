'use client';

import React, { useState } from 'react';
import PricingCard from './PricingCard'; // 修改导入路径
import BillingToggle from './BillingToggle'; // 修改导入路径
import { PricingPlan } from '../types';
import { useTranslation } from '../i18n/client'; // 导入 useTranslation
import { usePathname } from 'next/navigation'; // 导入 usePathname
import { getTruePathFromPathname } from '../lib/utils'; // 导入新函数
 
interface PricingSectionProps {
  lang: string;
}

const PricingSection: React.FC<PricingSectionProps> = ({ lang }) => { // 重命名组件
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('annually');

  // 定义月度计划的特性常量
  const MONTHLY_CREATOR_FEATURES = [
    { name: t('pricingSection.monthlyCreatorFeatures.points'), included: true },
    { name: t('pricingSection.monthlyCreatorFeatures.aiVoiceSynthesis'), included: true },
    { name: t('pricingSection.monthlyCreatorFeatures.twoSpeakers'), included: true },
    { name: t('pricingSection.monthlyCreatorFeatures.commercialLicense'), included: true },
    { name: t('pricingSection.monthlyCreatorFeatures.audioDownload'), included: true },
  ] as const;

  const MONTHLY_PRO_FEATURES = [
    { name: t('pricingSection.monthlyProFeatures.points'), included: true },
    { name: t('pricingSection.monthlyProFeatures.aiVoiceSynthesis'), included: true },
    { name: t('pricingSection.monthlyProFeatures.multiSpeakers'), included: true },
    { name: t('pricingSection.monthlyProFeatures.commercialLicense'), included: true },
    { name: t('pricingSection.monthlyProFeatures.audioDownload'), included: true },
    { name: t('pricingSection.monthlyProFeatures.advancedVoices'), included: true },
    { name: t('pricingSection.monthlyProFeatures.storytellingMode'), included: true, notes: t('pricingSection.comingSoon')},
  ] as const;

  const MONTHLY_BUSINESS_FEATURES = [
    { name: t('pricingSection.monthlyBusinessFeatures.points'), included: true },
    { name: t('pricingSection.monthlyBusinessFeatures.aiVoiceSynthesis'), included: true },
    { name: t('pricingSection.monthlyBusinessFeatures.multiSpeakers'), included: true },
    { name: t('pricingSection.monthlyBusinessFeatures.commercialLicense'), included: true },
    { name: t('pricingSection.monthlyBusinessFeatures.dedicatedAccountManager'), included: true },
    { name: t('pricingSection.monthlyBusinessFeatures.audioDownload'), included: true },
    { name: t('pricingSection.monthlyBusinessFeatures.advancedVoices'), included: true },
    { name: t('pricingSection.monthlyBusinessFeatures.storytellingMode'), included: true, notes: t('pricingSection.comingSoon')},
    { name: t('pricingSection.monthlyBusinessFeatures.apiAccess'), included: true, notes: t('pricingSection.comingSoon') },
  ] as const;

  const monthlyPlans: PricingPlan[] = [
    {
      name: t('pricingSection.creator'),
      price: 9.9,
      currency: '$',
      period: 'monthly',
      features: MONTHLY_CREATOR_FEATURES,
      ctaText: t('pricingCard.getStarted'),
      buttonVariant: 'secondary',
    },
    {
      name: t('pricingSection.pro'),
      price: 19.9,
      currency: '$',
      period: 'monthly',
      features: MONTHLY_PRO_FEATURES,
      ctaText: t('pricingCard.upgradeToPro'),
      buttonVariant: 'primary',
      isMostPopular: true,
    },
    {
      name: t('pricingSection.business'),
      price: 39.9,
      currency: '$',
      period: 'monthly',
      features: MONTHLY_BUSINESS_FEATURES,
      ctaText: t('pricingCard.upgradeToBusiness'),
      buttonVariant: 'secondary',
    },
  ];

  const annuallyPlans: PricingPlan[] = [
    {
      name: t('pricingSection.creator'),
      price: 8,
      currency: '$',
      period: 'annually',
      features: MONTHLY_CREATOR_FEATURES,
      ctaText: t('pricingCard.getStarted'),
      buttonVariant: 'secondary',
    },
    {
      name: t('pricingSection.pro'),
      price: 16,
      currency: '$',
      period: 'annually',
      features: MONTHLY_PRO_FEATURES,
      ctaText: t('pricingCard.upgradeToPro'),
      buttonVariant: 'primary',
      isMostPopular: true,
    },
    {
      name: t('pricingSection.business'),
      price: 32,
      currency: '$',
      period: 'annually',
      features: MONTHLY_BUSINESS_FEATURES,
      ctaText: t('pricingCard.upgradeToBusiness'),
      buttonVariant: 'secondary',
    },
  ];

  const currentPlans = billingPeriod === 'monthly' ? monthlyPlans : annuallyPlans;
  const pathname = usePathname();
  const truePath = getTruePathFromPathname(pathname, lang);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 leading-tight mb-4">
          {t('pricingSection.chooseYourPlan')}
        </h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          {t('pricingSection.forIndividualsOrTeams')}
        </p>
      </div>

      <div className="mb-12">
        <BillingToggle billingPeriod={billingPeriod} onToggle={setBillingPeriod} lang={lang} />
      </div>

      <div className="flex flex-col lg:flex-row justify-center items-center lg:items-end gap-8 w-full max-w-7xl">
        {currentPlans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} lang={lang} />
        ))}
      </div>

      <div className="mt-12 text-center text-neutral-500">
        <a href={`${truePath}/pricing`} target="_blank" className="flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
          {t('pricingSection.visitPricingPage')}
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default PricingSection;