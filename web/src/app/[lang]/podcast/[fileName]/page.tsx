import { Metadata } from 'next';
import PodcastContent from '@/components/PodcastContent';
import { useTranslation } from '../../../../i18n'; // 导入 useTranslation
import { headers } from 'next/headers';
import { getTruePathFromHeaders } from '../../../../lib/utils';

export async function generateMetadata({ params }: PodcastDetailPageProps): Promise<Metadata> {
  const { fileName, lang } = await params;
  const { t } = await useTranslation(lang);
  const decodedFileName = decodeURIComponent(fileName);
  const title = `${t('podcastContent.podcastDetails')} - ${decodedFileName}`;
  const description = `${t('podcastContent.listenToPodcast')} ${decodedFileName}。`;
  const truePath = await getTruePathFromHeaders(await headers(), lang);
  return {
    title,
    description,
    alternates: {
      canonical: `${truePath}/podcast/${decodedFileName}`,
    },
  };
}

interface PodcastDetailPageProps {
  params: {
    fileName: string;
    lang: string; // 添加 lang 属性
  };
}

export default async function PodcastDetailPage({ params }: PodcastDetailPageProps) {
  const { fileName, lang } = await params; // 解构 lang
  return (
    <div className="bg-white text-gray-800 font-sans">
      <PodcastContent fileName={decodeURIComponent(fileName)} lang={lang} />
    </div>
  );
}