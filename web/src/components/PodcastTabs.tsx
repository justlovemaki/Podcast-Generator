'use client';

import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface PodcastTabsProps {
  parsedScript: { id: number; speaker: string | null; dialogue: string }[];
  overviewContent?: string;
}

export default function PodcastTabs({ parsedScript, overviewContent }: PodcastTabsProps) {
  const [activeTab, setActiveTab] = useState<'script' | 'overview'>('script');

  return (
    <>
      {/* 3. 内容导航区 */}
      <div className="sticky top-0 bg-white z-10">
        <div className="flex justify-center border-b border-gray-200">
          <div className="flex gap-8">
            {/* 脚本 */}
            <button
              className={`py-4 px-1 text-base font-semibold ${
                activeTab === 'script' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('script')}
            >
              脚本
            </button>
            {/* 大纲 */}
            <button
              className={`py-4 px-1 text-base font-semibold ${
                activeTab === 'overview' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              大纲
            </button>
          </div>
        </div>
      </div>

      {/* 4. 内容展示区 */}
      <div className="mt-8">
        <article className="prose prose-lg max-w-none">
          {activeTab === 'script' ? (
            parsedScript.map(({ id, speaker, dialogue }) => (
              <p key={id}>
                {speaker && (
                  <strong className="text-900">{speaker}: </strong>
                )}
                {dialogue}
              </p>
            ))
          ) : (
            // 大纲内容
            overviewContent ? (
              <MarkdownRenderer content={overviewContent} />
            ) : (
              <p>暂无大纲内容。</p>
            )
          )}
        </article>
      </div>
    </>
  );
}