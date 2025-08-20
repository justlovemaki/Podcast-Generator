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
  title: 'PodcastHub - 给创意一个真实的声音',
  description: '使用AI技术将您的想法和内容转换为高质量的播客音频，支持多种语音和风格选择。',
  keywords: ['播客', 'AI', '语音合成', 'TTS', '音频生成'],
  authors: [{ name: 'PodcastHub Team' }],
  icons: {
    icon: '/favicon.webp',
    apple: '/favicon.webp',
  },
  openGraph: {
    title: 'PodcastHub - 给创意一个真实的声音',
    description: '使用AI技术将您的想法和内容转换为高质量的播客音频，支持多种语音和风格选择。',
    type: 'website',
    locale: 'zh_CN',
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