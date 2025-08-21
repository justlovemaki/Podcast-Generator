import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import FooterLinks from '../components/FooterLinks';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.podcasthub.com'),
  title: 'PodcastHub: 您的AI播客创作平台 - 轻松将文字转化为高质量播客音频，支持多种语音和风格，让创意触手可及',
  description: 'PodcastHub 利用尖端AI技术，为您的创意提供无限可能。轻松将文字和想法转化为专业品质的播客音频，支持多种个性化语音和风格选择。立即体验高效创作，让您的声音在全球范围内传播，吸引更多听众，并简化您的播客制作流程。',
  keywords: ['播客', 'AI', '语音合成', 'TTS', '音频生成'],
  authors: [{ name: 'PodcastHub Team' }],
  icons: {
    icon: '/favicon.webp',
    apple: '/favicon.webp',
  },
  openGraph: {
    title: 'PodcastHub: 您的AI播客创作平台 - 轻松将文字转化为高质量播客音频，支持多种语音和风格，让创意触手可及',
    description: 'PodcastHub 利用尖端AI技术，为您的创意提供无限可能。轻松将文字和想法转化为专业品质的播客音频，支持多种个性化语音和风格选择。立即体验高效创作，让您的声音在全球范围内传播，吸引更多听众，并简化您的播客制作流程。',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PodcastHub: 您的AI播客创作平台 - 轻松将文字转化为高质量播客音频，支持多种语音和风格，让创意触手可及',
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
          <div id="root" className="min-h-screen bg-white">
            {children}
          </div>
          {/* Toast容器 */}
          <div id="toast-root" />
          {/* Modal容器 */}
          <div id="modal-root" />
          <footer className="py-8">
            <FooterLinks />
          </footer>
      </body>
    </html>
  );
}