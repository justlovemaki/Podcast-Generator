import React, { use } from 'react';
import { Metadata } from 'next';
import { AiOutlineTikTok, AiFillQqCircle, AiOutlineGithub, AiOutlineTwitter, AiFillMail } from 'react-icons/ai';
export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await (await import('../../../i18n')).useTranslation(lang, 'contact');
  return {
    title: t('contact_us_title'),
    description: t('contact_us_description'),
    alternates: {
      canonical: `/${lang}/contact`,
    },
  };
}

import { useTranslation } from '../../../i18n'; // 导入服务端的 useTranslation

/**
* 联系我们页面组件。
* 优化后的版本，移除了联系表单，专注于清晰地展示联系方式。
* 采用单栏居中布局，设计简洁、现代。
*/
const ContactUsPage = async ({ params: { lang } }: { params: { lang: string } }) => {
  const { t } = await useTranslation(lang, 'contact');

  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12">
            <header className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                {t('contact_us_heading')}
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                {t('contact_us_subheading')}
              </p>
            </header>

            <div className="space-y-12">
              {/* 电子邮件 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-blue-100 rounded-full p-3 mb-4">
                  <AiFillMail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {t('email_title')}
                </h2>
                <p className="text-gray-600">
                  {t('email_description')}
                  <a
                    href="mailto:support@podcasthub.com"
                    className="block text-blue-600 hover:text-blue-700 transition-colors break-all mt-1 font-medium"
                  >
                    justlikemaki@foxmail.com
                  </a>
                </p>
              </div>

              {/* 社交媒体 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-blue-100 rounded-full p-3 mb-4">
                  <AiFillQqCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {t('social_media_title')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t('social_media_description')}
                </p>
                <div className="flex justify-center space-x-6">
                  <a
                    href="https://github.com/justlovemaki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-700 transition-colors"
                    aria-label="Github"
                  >
                    <AiOutlineGithub className="w-9 h-9" />
                  </a>
                  <a
                    href="https://x.com/justlikemaki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                    aria-label="Twitter"
                  >
                    <AiOutlineTwitter className="w-9 h-9" />
                  </a>
                  <a
                    href="https://cdn.jsdmirror.com/gh/justlovemaki/imagehub@main/logo/7fc30805eeb831e1e2baa3a240683ca3.md.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                    aria-label="Douyin"
                  >
                    <AiOutlineTikTok className="w-9 h-9" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;