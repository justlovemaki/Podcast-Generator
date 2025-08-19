import { AiOutlineArrowLeft, AiOutlineCloudDownload } from 'react-icons/ai';
import { getAudioInfo, getUserInfo } from '@/lib/podcastApi';
import AudioPlayerControls from './AudioPlayerControls';
import PodcastTabs from './PodcastTabs';
import ShareButton from './ShareButton'; // 导入 ShareButton 组件

// 脚本解析函数 (与 page.tsx 中保持一致)
const parseTranscript = (
  transcript: { speaker_id: number; dialog: string }[] | undefined,
  podUsers: { role: string; code: string; name: string; usedname: string }[] | undefined
) => {
  if (!transcript) return [];

  return transcript.map((item, index) => {
    let speakerName: string | null = null;
    if (podUsers && podUsers[item.speaker_id]) {
      speakerName = podUsers[item.speaker_id].usedname; // 使用 podUsers 中的 usedname 字段作为 speakerName
    } else {
      speakerName = `Speaker ${item.speaker_id}`; // 回退到 Speaker ID
    }
    return { id: index, speaker: speakerName, dialogue: item.dialog };
  });
};

interface PodcastContentProps {
  fileName: string;
}


export default async function PodcastContent({ fileName }: PodcastContentProps) {
  const result = await getAudioInfo(fileName);

  if (!result.success || !result.data || result.data.status!='completed') {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-800">
        <p className="text-red-500 text-lg">无法加载播客详情：{result.error || '未知错误'}</p>
        <a href="/" className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors">
          返回首页
        </a>
      </div>
    );
  }

  const authId = result.data?.auth_id; // 确保 auth_id 存在且安全访问
  let userInfoData = null;
  if (authId) {
    const userInfo = await getUserInfo(authId);
    if (userInfo.success && userInfo.data) {
      userInfoData = {
        name: userInfo.data.name,
        email: userInfo.data.email,
        image: userInfo.data.image,
      };
    }
  }
  const responseData = {
    ...result.data,
    user: userInfoData // 将用户信息作为嵌套对象添加
  };

  const audioInfo = responseData;
  const parsedScript = parseTranscript(audioInfo.podcast_script?.podcast_transcripts || [], audioInfo.podUsers);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* 返回首页按钮和分享按钮 */}
      <div className="flex justify-between items-center mb-6"> {/* 修改为 justify-between 和 items-center */}
        <a
          href="/"
          className="flex items-center gap-1 text-neutral-500 hover:text-black transition-colors text-sm"
        >
          <AiOutlineArrowLeft className="w-5 h-5 mr-1" />
          返回首页
        </a>
        <div className="flex items-center gap-4"> {/* 使用 flex 容器包裹分享和下载按钮 */}
          <ShareButton /> {/* 添加分享按钮 */}
          {audioInfo.audioUrl && (
            <a
              href={audioInfo.audioUrl}
              download
              className="flex items-center gap-1 text-neutral-500 hover:text-black transition-colors text-sm"
              aria-label="下载音频"
            >
              <AiOutlineCloudDownload className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
      {/* 1. 顶部信息区 */}
      <div className="flex flex-col items-center text-center">
        {/* 缩略图 */}
        <div className="w-32 h-32 md:w-32 md:h-32 rounded-2xl mb-6 shadow-lg overflow-hidden bg-gradient-to-br from-brand-purple to-brand-pink">
          {audioInfo.avatar_base64 && (
            <img
              src={`data:image/jpeg;base64,${audioInfo.avatar_base64}`}
              alt="Podcast Thumbnail"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* 标题 */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight break-words">
          {audioInfo.title}
        </h1>

        {/* 标签 */}
        {audioInfo.tags && audioInfo.tags.split('#').map((tag: string) => tag.trim()).filter((tag: string) => !!tag).length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {audioInfo.tags.split('#').filter((tag: string) => !!tag).map((tag: string) => (
              <span key={tag.trim()} className="px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* 元数据栏 */}
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
              <img
                src={audioInfo.user?.image || '/default-avatar.png'}
                alt={audioInfo.user?.name || 'User Avatar'}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span>{audioInfo.user?.name}</span>
          </div>
        </div>
      </div>

      {/* 2. 播放控制区 - 使用客户端组件 */}
      <AudioPlayerControls
        audioUrl={audioInfo.audioUrl || ''}
        audioDuration={audioInfo.audio_duration}
      />

      {/* 3. 内容导航区和内容展示区 - 使用客户端组件 */}
      <PodcastTabs
        parsedScript={parsedScript}
        overviewContent={audioInfo.overview_content ? audioInfo.overview_content.split('\n').slice(2).join('\n') : ''}
      />
    </main>
  );
}