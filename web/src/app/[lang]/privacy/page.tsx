import React from 'react';
import { Metadata } from 'next';
import { getTranslation } from '@/i18n';
import { headers } from 'next/headers';
import { getTruePathFromHeaders } from '../../../lib/utils';

export type paramsType = Promise<{ lang: string }>;
/**
 * 设置页面元数据。
 */
export async function generateMetadata({ params }: { params: paramsType }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getTranslation(lang, 'privacy');
  const truePath = await getTruePathFromHeaders(await headers(), lang);
  return {
    title: t('privacy_policy.title'),
    description: t('privacy_policy.description'),
    alternates: {
      canonical: `${truePath}/privacy`,
    },
  };
}

const PrivacyPolicyPage: React.FC<{ params: paramsType}> = async ({ params }) => {
  const { lang } = await params;
  const { t } = await getTranslation(lang, 'privacy');
  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-16">
      <div className="container mx-auto p-6 md:p-8 max-w-4xl bg-white shadow-lg rounded-lg">
        <article className="prose max-w-full break-words">
          <h1 className="text-4xl font-extrabold mb-6 text-gray-900 border-b pb-4">
            {t('privacy_policy.title')}
          </h1>
          <p className="text-gray-600">{t('privacy_policy.last_updated')}</p>
          <p>{t('privacy_policy.intro_paragraph')}</p>

          <h2 id="info-we-collect">{t('privacy_policy.section1.title')}</h2>
          <p>{t('privacy_policy.section1.intro')}</p>
          <ul>
            <li>
              <strong>{t('privacy_policy.section1.point1.heading')}</strong>
              {t('privacy_policy.section1.point1.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section1.point2.heading')}</strong>
              {t('privacy_policy.section1.point2.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section1.point3.heading')}</strong>
              {t('privacy_policy.section1.point3.content')}
            </li>
          </ul>

          <h2 id="how-we-use-info">{t('privacy_policy.section2.title')}</h2>
          <p>{t('privacy_policy.section2.intro')}</p>
          <ul>
            <li>
              <strong>{t('privacy_policy.section2.point1.heading')}</strong>
              {t('privacy_policy.section2.point1.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section2.point2.heading')}</strong>
              {t('privacy_policy.section2.point2.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section2.point3.heading')}</strong>
              {t('privacy_policy.section2.point3.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section2.point4.heading')}</strong>
              {t('privacy_policy.section2.point4.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section2.point5.heading')}</strong>
              {t('privacy_policy.section2.point5.content')}
            </li>
          </ul>

          <h2 id="info-sharing">{t('privacy_policy.section3.title')}</h2>
          <p>{t('privacy_policy.section3.intro')}</p>
          <ul>
            <li>
              <strong>{t('privacy_policy.section3.point1.heading')}</strong>
              {t('privacy_policy.section3.point1.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section3.point2.heading')}</strong>
              {t('privacy_policy.section3.point2.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section3.point3.heading')}</strong>
              {t('privacy_policy.section3.point3.content')}
            </li>
            <li>
              <strong>{t('privacy_policy.section3.point4.heading')}</strong>
              {t('privacy_policy.section3.point4.content')}
            </li>
          </ul>

          <h2 id="data-security">{t('privacy_policy.section4.title')}</h2>
          <p>{t('privacy_policy.section4.content')}</p>

          <h2 id="user-rights">{t('privacy_policy.section5.title')}</h2>
          <p>{t('privacy_policy.section5.content')}</p>

          <h2 id="policy-changes">{t('privacy_policy.section6.title')}</h2>
          <p>{t('privacy_policy.section6.content')}</p>

          <h2 id="contact-us">{t('privacy_policy.section7.title')}</h2>
          <p>{t('privacy_policy.section7.content')}</p>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;