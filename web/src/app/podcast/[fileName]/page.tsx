import { Metadata } from 'next';
import PodcastContent from '@/components/PodcastContent';

export async function generateMetadata({ params }: PodcastDetailPageProps): Promise<Metadata> {
  const fileName = decodeURIComponent(params.fileName);
  const title = `播客详情 - ${fileName}`;
  const description = `收听 ${fileName} 的播客。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/podcast/${fileName}`,
    },
  };
}

interface PodcastDetailPageProps {
  params: {
    fileName: string;
  };
}

export default async function PodcastDetailPage({ params }: PodcastDetailPageProps) {
  return (
    <div className="bg-white text-gray-800 font-sans">
      <PodcastContent fileName={decodeURIComponent(params.fileName)} />
    </div>
  );
}