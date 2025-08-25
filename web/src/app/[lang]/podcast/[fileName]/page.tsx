import { Metadata } from 'next';
import PodcastContent from '@/components/PodcastContent';
import { getTranslation } from '../../../../i18n'; // 导入 getTranslation
import { headers } from 'next/headers';
import { getTruePathFromHeaders } from '../../../../lib/utils';

export type paramsType = Promise<{ lang: string, fileName: string }>;

export async function generateMetadata({ params }: { params: paramsType }): Promise<Metadata> {
  const { fileName, lang } = await params;
  const { t } = await getTranslation(lang);
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

const PodcastDetailPage: React.FC<{ params: paramsType}> = async ({ params }) => {
  const { fileName, lang } = await params; // 解构 lang
  return (
    <div className="bg-white text-gray-800 font-sans">
      <PodcastContent fileName={decodeURIComponent(fileName)} lang={lang} />
    </div>
  );
}

export default PodcastDetailPage;