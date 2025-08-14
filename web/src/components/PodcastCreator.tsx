'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Wand2, 
  Link, 
  Copy, 
  Upload,
  Globe,
  ChevronDown,
  Loader2,
 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfigSelector from './ConfigSelector';
import VoicesModal from './VoicesModal'; // 引入 VoicesModal
import type { PodcastGenerationRequest, TTSConfig, Voice } from '@/types';

interface PodcastCreatorProps {
  onGenerate: (request: PodcastGenerationRequest) => void;
  isGenerating?: boolean;
  credits: number; // 新增积分属性
}

const PodcastCreator: React.FC<PodcastCreatorProps> = ({
  onGenerate,
  isGenerating = false,
  credits // 解构 credits 属性
}) => {
   const [topic, setTopic] = useState('');
   const [customInstructions, setCustomInstructions] = useState('');
   const [selectedMode, setSelectedMode] = useState<'ai-podcast' | 'flowspeech'>('ai-podcast');
   const [language, setLanguage] = useState('zh-CN');
   const [showVoicesModal, setShowVoicesModal] = useState(false); // 新增状态
   const [voices, setVoices] = useState<Voice[]>([]); // 新增 voices 状态
   const [selectedPodcastVoices, setSelectedPodcastVoices] = useState<{[key: string]: Voice[]}>({}); // 新增：单独存储选中的说话人
   const [style, setStyle] = useState<'casual' | 'professional' | 'educational' | 'entertaining'>('casual');
   const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium');
   const [selectedConfig, setSelectedConfig] = useState<TTSConfig | null>(null);
   const [selectedConfigName, setSelectedConfigName] = useState<string>(''); // 新增状态来存储配置文件的名称
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const handleSubmit = () => {
     if (!topic.trim()) return;
 
     const request: PodcastGenerationRequest = {
       topic: topic.trim(),
       customInstructions: customInstructions.trim() || undefined,
       speakers: selectedPodcastVoices[selectedConfigName]?.length || selectedConfig?.podUsers?.length || 2, // 优先使用选中的说话人数量
       language,
       style,
       duration,
       ttsConfig: selectedConfig ? { ...selectedConfig, voices: selectedPodcastVoices[selectedConfigName] || [] } : undefined, // 将选中的说话人添加到 ttsConfig
     };
 
     onGenerate(request);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTopic(prev => prev + (prev ? '\n\n' : '') + content);
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTopic(prev => prev + (prev ? '\n\n' : '') + text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' },
  ];

  const durationOptions = [
    { value: 'short', label: '5-10分钟' },
    { value: 'medium', label: '15-20分钟' },
    { value: 'long', label: '25-30分钟' },
  ];

  useEffect(() => {
    const fetchVoices = async () => {
      if (selectedConfig && selectedConfigName) { // 确保 selectedConfigName 存在
        try {
          const response = await fetch('/api/tts-voices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ttsConfigName: selectedConfigName }), // 使用 selectedConfigName
          });
          const data = await response.json();
          if (data.success) {
            setVoices(data.data);
          } else {
            console.error('Failed to fetch voices:', data.error);
            setVoices([]);
          }
        } catch (error) {
          console.error('Error fetching voices:', error);
          setVoices([]);
        }
      } else {
        setVoices([]);
      }
    };

    fetchVoices();
  }, [selectedConfig, selectedConfigName]); // 依赖项中添加 selectedConfigName

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* 品牌标题区域 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded opacity-90" />
          </div>
          <h1 className="text-3xl font-bold text-black break-words">PodcastHub</h1>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-black mb-6 break-words">
          把你的创意转为播客
        </h2>
        
        {/* 模式切换按钮 */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedMode('ai-podcast')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-all duration-200",
              selectedMode === 'ai-podcast'
                ? "btn-primary"
                : "btn-secondary"
            )}
          >
            <Play className="w-4 h-4" />
            AI播客
          </button>
          <button
            onClick={() => setSelectedMode('flowspeech')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-all duration-200",
              selectedMode === 'flowspeech'
                ? "btn-primary"
                : "btn-secondary"
            )}
          >
            <Wand2 className="w-4 h-4" />
            FlowSpeech
          </button>
        </div>
      </div>

      {/* 主要创作区域 */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-soft">
        {/* 输入区域 */}
        <div className="p-6">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="输入文字、上传文件或粘贴链接..."
            className="w-full h-32 resize-none border-none outline-none text-lg placeholder-neutral-400"
            disabled={isGenerating}
          />
          
          {/* 自定义指令 */}
          {customInstructions !== undefined && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="添加自定义指令（可选）..."
                className="w-full h-20 resize-none border-none outline-none text-sm placeholder-neutral-400"
                disabled={isGenerating}
              />
            </div>
          )}
        </div>

        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between px-4 sm:px-6 py-3 border-t border-neutral-100 bg-neutral-50 gap-y-4 sm:gap-x-2">
          {/* 左侧配置选项 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full sm:max-w-[500px]">
            {/* TTS配置选择 */}
            <div className='relative w-full'>
            <ConfigSelector
              onConfigChange={(config, name) => {
                setSelectedConfig(config);
                setSelectedConfigName(name); // 更新配置名称状态
              }}
              className="w-full"
            /></div>

            {/* 说话人按钮 */}
            <div className='relative w-full'>
            <button
              onClick={() => setShowVoicesModal(true)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm",
                selectedPodcastVoices[selectedConfigName] && selectedPodcastVoices[selectedConfigName].length > 0
                  ? "w-full bg-black text-white"
                  : "btn-secondary w-full"
              )}
              disabled={isGenerating || !selectedConfig}
            >
              说话人
            </button></div>

            {/* 语言选择 */}
            <div className="relative w-full">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 sm:px-3 sm:py-2 pr-6 sm:pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black w-full text-center"
                disabled={isGenerating}
              >
                {languageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* 时长选择 */}
            <div className="relative w-full">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as any)}
                className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 sm:px-3 sm:py-2 pr-6 sm:pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black w-full text-center"
                disabled={isGenerating}
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-6 sm:gap-1 flex-wrap justify-center sm:justify-right w-full sm:w-auto">
            {/* 文件上传 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
              title="上传文件"
              disabled={isGenerating}
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* 粘贴链接 */}
            <button
              onClick={handlePaste}
              className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
              title="粘贴内容"
              disabled={isGenerating}
            >
              <Link className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 复制 */}
            <button
              onClick={() => navigator.clipboard.writeText(topic)}
              className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
              title="复制内容"
              disabled={isGenerating || !topic}
            >
              <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {/* 积分显示 */}
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gem flex-shrink-0">
                  <path d="M6 3v18l6-4 6 4V3z"/>
                  <path d="M12 3L20 9L12 15L4 9L12 3Z"/>
                </svg>
                <span className="break-all">{credits}</span>
              </div>
            <div className="flex flex-col items-center gap-1">
              {/* 创作按钮 */}
              <button
                onClick={handleSubmit}
                disabled={!topic.trim() || isGenerating || credits <= 0}
                className={cn(
                  "btn-primary flex items-center gap-1 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2",
                  (!topic.trim() || isGenerating || credits <= 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className=" xs:inline">生成中...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className=" xs:inline">创作</span>
                  </>
                )}
              </button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Voices Modal */}
      {selectedConfig && (
        <VoicesModal
          isOpen={showVoicesModal}
          onClose={() => setShowVoicesModal(false)}
          voices={voices}
          onSelectVoices={(selectedVoices) => {
            setSelectedPodcastVoices(prev => ({...prev, [selectedConfigName]: selectedVoices})); // 更新选中的说话人状态
            setShowVoicesModal(false); // 选中后关闭模态框
          }}
          initialSelectedVoices={selectedPodcastVoices[selectedConfigName] || []} // 传递选中的说话人作为初始值
          currentSelectedVoiceIds={selectedPodcastVoices[selectedConfigName]?.map(v => v.code!) || []} // 更新 currentSelectedVoiceIds
          onRemoveVoice={(voiceCodeToRemove) => {
            setSelectedPodcastVoices(prev => {
              const newVoices = (prev[selectedConfigName] || []).filter(v => v.code !== voiceCodeToRemove);
              return {
                ...prev,
                [selectedConfigName]: newVoices
              };
            });
          }}
        />
      )}
    </div>
  );
};

export default PodcastCreator;

