import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import FooterLinks from '../../components/FooterLinks';
import { dir } from 'i18next';
import { languages } from '../../i18n/settings';
import { getTranslation } from '../../i18n';
import { headers } from 'next/headers';
import { getTruePathFromHeaders } from '../../lib/utils';


const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getTranslation(lang, 'layout');
  const truePath = await getTruePathFromHeaders(await headers(), lang);
  return {
    metadataBase: new URL('https://www.podcasthub.com'),
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(','),
    authors: [{ name: 'PodcastHub Team' }],
    icons: {
      icon: '/favicon.webp',
      apple: '/favicon.webp',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
    },
    alternates: {
      canonical: `${truePath}`,
      languages: languages.reduce((acc: Record<string, string>, l) => {
        acc[l] = `/${l}`;
        return acc;
      }, {}),
    },
  };
}

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {
    lang: string;
  }
}) {

  const { lang } = await params;
  return (
    <html lang={lang} dir={dir(lang)} className={inter.variable}>
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
            <FooterLinks lang={lang} />
          </footer>
      </body>
    </html>
  );
}