import { Metadata } from 'next';
import React, { use } from 'react';
import PricingSection from '@/components/PricingSection'; // 导入 PricingSection 组件
import { useTranslation } from '../../../i18n';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await (await import('../../../i18n')).useTranslation(lang, 'components');
  return {
    title: t('pricing_page_title'),
    description: t('pricing_page_description'),
    alternates: {
      canonical: `/${lang}/pricing`,
    },
  };
}

const PricingPage = async ({ params: { lang } }: { params: { lang: string } }) => {
  // 尽管 PricingSection 是客户端组件，为了使 PricingPage 成为服务器组件并加载服务端 i18n，我们在这里模拟加载
  await useTranslation(lang, 'components');
  return (
    <PricingSection lang={lang} />
  );
};

export default PricingPage;