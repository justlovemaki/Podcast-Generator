import React from 'react';
import { Metadata } from 'next';
import { useTranslation } from '@/i18n';
import { languages } from '@/i18n/settings';

export async function generateMetadata({ params: { lang } }: { params: { lang: string } }): Promise<Metadata> {
  const { t } = await useTranslation(lang, 'terms');
  return {
    title: t('terms_of_service.title'),
    description: t('terms_of_service.description'),
    alternates: {
      canonical: `/${lang}/terms`,
    },
  };
}

const TermsOfServicePage: React.FC<{ params: { lang: string } }> = async ({ params: { lang } }) => {
  const { t } = await useTranslation(lang, 'terms');
  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-16">
      <div className="container mx-auto p-6 md:p-8 max-w-4xl bg-white shadow-lg rounded-lg">
        <article className="prose max-w-full break-words">
          <h1 className="text-4xl font-extrabold mb-6 text-gray-900 border-b pb-4">
            {t('terms_of_service.heading')}
          </h1>
          <p className="text-gray-600">{t('terms_of_service.last_updated')}</p>
          <p>
            {t('terms_of_service.intro_paragraph')}
          </p>

          <h2 id="service-overview">{t('terms_of_service.section1.title')}</h2>
          <p>
            {t('terms_of_service.section1.content')}
          </p>

          <h2 id="user-account">{t('terms_of_service.section2.title')}</h2>
          <p>
            {t('terms_of_service.section2.content')}
          </p>

          <h2 id="user-conduct">{t('terms_of_service.section3.title')}</h2>
          <p>{t('terms_of_service.section3.intro')}</p>
          <ul>
            <li>
              {t('terms_of_service.section3.point1')}
            </li>
            <li>
              {t('terms_of_service.section3.point2')}
            </li>
            <li>
              {t('terms_of_service.section3.point3')}
            </li>
            <li>
              {t('terms_of_service.section3.point4')}
            </li>
            <li>
              {t('terms_of_service.section3.point5')}
            </li>
          </ul>

          <h2 id="intellectual-property">{t('terms_of_service.section4.title')}</h2>
          <p>
            <strong>{t('terms_of_service.section4.point1.heading')}</strong>
            {t('terms_of_service.section4.point1.content')}
          </p>
          <p>
            <strong>{t('terms_of_service.section4.point2.heading')}</strong>
            {t('terms_of_service.section4.point2.content')}
          </p>
          <p>
            <strong>{t('terms_of_service.section4.point3.heading')}</strong>
            {t('terms_of_service.section4.point3.content')}
          </p>

          <h2 id="limitation-of-liability">{t('terms_of_service.section5.title')}</h2>
          <p>
            {t('terms_of_service.section5.point1')}
          </p>
          <p>
            {t('terms_of_service.section5.point2')}
          </p>

          <h2 id="termination">{t('terms_of_service.section6.title')}</h2>
          <p>
            {t('terms_of_service.section6.content')}
          </p>

          <h2 id="modification">{t('terms_of_service.section7.title')}</h2>
          <p>
            {t('terms_of_service.section7.content')}
          </p>

          <h2 id="governing-law">{t('terms_of_service.section8.title')}</h2>
          <p>
            {t('terms_of_service.section8.content')}
          </p>

          <h2 id="contact">{t('terms_of_service.section9.title')}</h2>
          <p>
            {t('terms_of_service.section9.content')}
          </p>
        </article>
      </div>
    </div>
  );
};

export default TermsOfServicePage;