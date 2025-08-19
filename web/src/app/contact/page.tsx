import React from 'react';
import { Metadata } from 'next';
import { AiOutlineTikTok, AiFillQqCircle, AiOutlineGithub, AiOutlineTwitter, AiFillMail } from 'react-icons/ai';

/**
 * 设置页面元数据。
 */
export const metadata: Metadata = {
  title: '联系我们 - PodcastHub',
  description: '有任何问题或建议？请随时联系 PodcastHub 团队。我们期待您的声音。',
};

/**
 * 联系我们页面组件。
 * 优化后的版本，移除了联系表单，专注于清晰地展示联系方式。
 * 采用单栏居中布局，设计简洁、现代。
 */
const ContactUsPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12">
            <header className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                联系我们
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                我们很乐意听取您的意见。无论是问题、建议还是合作机会，请随时通过以下方式与我们联系。
              </p>
            </header>

            <div className="space-y-12">
              {/* 电子邮件 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-blue-100 rounded-full p-3 mb-4">
                  <AiFillMail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  电子邮箱
                </h2>
                <p className="text-gray-600">
                  对于一般查询和支持，请发送邮件至：
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
                  社交媒体
                </h2>
                <p className="text-gray-600 mb-4">
                  在社交网络上关注我们，获取最新动态：
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