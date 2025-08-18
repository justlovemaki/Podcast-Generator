import PodcastContent from '@/components/PodcastContent';

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