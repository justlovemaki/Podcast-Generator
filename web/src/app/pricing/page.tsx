import { Metadata } from 'next';
 
 import React from 'react';
 import PricingSection from '@/components/PricingSection'; // 导入 PricingSection 组件
 
 export const metadata: Metadata = {
  title: '定价 - PodcastHub',
  description: '查看 PodcastHub 的灵活定价方案，找到最适合您的播客创作计划。',
  alternates: {
    canonical: '/pricing',
  },
};
 
 const PricingPage: React.FC = () => {
   return (
     <PricingSection />
   );
 };
 
 export default PricingPage;