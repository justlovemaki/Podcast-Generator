'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AiFillPlayCircle,
  AiOutlineLink,
  AiOutlineCopy,
  AiOutlineUpload,
  AiOutlineGlobal,
  AiOutlineDown,
  AiOutlineLoading3Quarters,
 } from 'react-icons/ai';
 import {
  Wand2,
 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfigSelector from './ConfigSelector';
import VoicesModal from './VoicesModal'; // 引入 VoicesModal
import LoginModal from './LoginModal'; // 引入 LoginModal
import { useToast, ToastContainer } from './Toast'; // 引入 Toast Hook 和 Container
import { setItem, getItem } from '@/lib/storage'; // 引入 localStorage 工具
import { useSession } from '@/lib/auth-client'; // 引入 useSession
import type { PodcastGenerationRequest, TTSConfig, Voice, SettingsFormData } from '@/types';
import { Satisfy } from 'next/font/google'; // 导入艺术字体 Satisfy

// 定义艺术字体，预加载并设置 fallback
const satisfy = Satisfy({
  weight: '400', // Satisfy 只有 400 权重
  subsets: ['latin'], // 根据需要选择子集，这里选择拉丁字符集
  display: 'swap', // 字体加载策略
});

interface PodcastCreatorProps {
  onGenerate: (request: PodcastGenerationRequest) => Promise<void>; // 修改为返回 Promise<void>
  isGenerating?: boolean;
  credits: number;
  settings: SettingsFormData | null; // 新增 settings 属性
  onSignInSuccess: () => void; // 新增 onSignInSuccess 属性
  enableTTSConfigPage: boolean; // 新增 enableTTSConfigPage 属性
}

const PodcastCreator: React.FC<PodcastCreatorProps> = ({
  onGenerate,
  isGenerating = false,
  credits,
  settings, // 解构 settings 属性
  onSignInSuccess, // 解构 onSignInSuccess 属性
  enableTTSConfigPage // 解构 enableTTSConfigPage 属性
}) => {

  const languageOptions = [
    { value: 'Chinese', label: '简体中文' },
    { value: 'English', label: 'English' },
    { value: 'Japanese', label: '日本語' },
  ];

  const durationOptions = [
    { value: 'Under 5 minutes', label: '5分钟以内' },
    { value: '5-10 minutes', label: '5-10分钟' },
    { value: '10-15 minutes', label: '10-15分钟' },
  ];

   const [topic, setTopic] = useState('');
   const [customInstructions, setCustomInstructions] = useState('');
   const [selectedMode, setSelectedMode] = useState<'ai-podcast' | 'flowspeech'>('ai-podcast');

   // 初始化时从 localStorage 加载 topic 和 customInstructions
   useEffect(() => {
     const cachedTopic = getItem<string>('podcast-topic');
     if (cachedTopic) {
       setTopic(cachedTopic);
     }
     const cachedCustomInstructions = getItem<string>('podcast-custom-instructions');
     if (cachedCustomInstructions) {
       setCustomInstructions(cachedCustomInstructions);
     }
   }, []);
   const [language, setLanguage] = useState(languageOptions[0].value);
   const [duration, setDuration] = useState(durationOptions[0].value);
   const [showVoicesModal, setShowVoicesModal] = useState(false); // 新增状态
   const [showLoginModal, setShowLoginModal] = useState(false); // 控制登录模态框的显示
   const [voices, setVoices] = useState<Voice[]>([]); // 从 ConfigSelector 获取 voices
   const [selectedPodcastVoices, setSelectedPodcastVoices] = useState<{[key: string]: Voice[]}>(() => {
     // 从 localStorage 读取缓存的说话人配置
     const cachedVoices = getItem<{[key: string]: Voice[]}>('podcast-selected-voices');
     return cachedVoices || {};
   }); // 新增：单独存储选中的说话人
   const [selectedConfig, setSelectedConfig] = useState<TTSConfig | null>(null);
   const [selectedConfigName, setSelectedConfigName] = useState<string>(''); // 新增状态来存储配置文件的名称
   const fileInputRef = useRef<HTMLInputElement>(null);

   const { toasts, error, success, removeToast } = useToast(); // 使用 useToast hook, 引入 success
   const { data: session } = useSession(); // 获取 session

   const handleSubmit = async () => { // 修改为 async 函数
     if (!session?.user) { // 判断是否登录
       setShowLoginModal(true); // 未登录则显示登录模态框
       return;
     }
     if (!topic.trim()) {
         error("主题不能为空", "请输入播客主题。"); // 使用 toast.error
         return;
     }
     if (!selectedConfig) {
         error("TTS配置未选择", "请选择一个TTS配置。"); // 使用 toast.error
         return;
     }
 
     if (!selectedPodcastVoices[selectedConfigName] || selectedPodcastVoices[selectedConfigName].length === 0) {
         error("请选择说话人", "请至少选择一位播客说话人。"); // 使用 toast.error
         return;
     }

    let inputTxtContent = topic.trim();
    if (customInstructions.trim()) {
        inputTxtContent = "```custom-begin"+`\n${customInstructions.trim()}\n`+"```custom-end"+`\n${inputTxtContent}`;
    }

    const request: PodcastGenerationRequest = {
        tts_provider: selectedConfigName.replace('.json', ''),
        input_txt_content: inputTxtContent,
        podUsers_json_content: JSON.stringify(selectedPodcastVoices[selectedConfigName] || []),
        usetime: duration,
        output_language: language,
        ...(enableTTSConfigPage ? {
          tts_providers_config_content: JSON.stringify(settings),
          api_key: settings?.apikey,
          base_url: settings?.baseurl,
          model: settings?.model,
        } : {})
    };

    try {
        await onGenerate(request); // 等待 API 调用完成
        // 清空 topic 和 customInstructions，并更新 localStorage
        setTopic('');
        setItem('podcast-topic', '');
        setCustomInstructions('');
        setItem('podcast-custom-instructions', '');
    } catch (err) {
        console.error("播客生成失败:", err);
    }
  };

  const handleSignIn = async () => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        success("签到成功", data.message);
        onSignInSuccess(); // 签到成功后调用回调
      } else {
        error("签到失败", data.error);
      }
    } catch (err) {
      console.error("签到请求失败:", err);
      error("签到失败", "网络错误或服务器无响应");
    }
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

  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 品牌标题区域 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="h-[80px] w-[300px] sm:h-[100px] sm:w-[600px]" viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D869E5">
                    <animate attributeName="stop-color" values="#D069E6;#FB866C;#FA6F7E;#E968E2;" dur="5s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="1" stopColor="#D069E6">
                    <animate attributeName="stop-color" values="#FB866C;#FA6F7E;#E968E2;#D869E5;" dur="5s" repeatCount="indefinite"/>
                  </stop>
                </linearGradient>

                <linearGradient id="textGradient" x1="600" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#C75AD4">
                    <animate attributeName="stop-color" values="#C75AD4;#D85AD1;#F85F6F;#F9765B;#C15ED5;#C75AD4" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.1818" stopColor="#D85AD1">
                    <animate attributeName="stop-color" values="#D85AD1;#F85F6F;#F9765B;#C15ED5;#C75AD4;#D85AD1" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.3636" stopColor="#F85F6F">
                    <animate attributeName="stop-color" values="#F85F6F;#F9765B;#C15ED5;#C75AD4;#D85AD1;#F85F6F" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.5455" stopColor="#F9765B">
                    <animate attributeName="stop-color" values="#F9765B;#C15ED5;#C75AD4;#D85AD1;#F85F6F;#F9765B" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.7273" stopColor="#C15ED5">
                    <animate attributeName="stop-color" values="#C15ED5;#C75AD4;#D85AD1;#F85F6F;#F9765B;#C15ED5" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.9091" stopColor="#C75AD4">
                    <animate attributeName="stop-color" values="#C75AD4;#D85AD1;#F85F6F;#F9765B;#C15ED5;#C75AD4" dur="10s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>

              <g>
                <path 
                  d="M49 98.5 C 56 56.5, 65 56.5, 73 90.5 C 79 120.5, 85 125.5, 91 100.5 C 96 80.5, 100 75.5, 106 95.5 C 112 115.5, 118 108.5, 125 98.5"
                  className="fill-none stroke-[10] stroke-round stroke-join-round" // 调整描边宽度为 7
                  stroke="url(#waveGradient)"
                />

                <text
                  x="140"
                  y="125"
                  className={`${satisfy.className} text-[95px]`} // 应用艺术字体
                  fill="url(#textGradient)"
                >
                  PodcastHub
                </text>
              </g>
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl text-black mb-6 break-words">
            给创意一个真实的声音
          </h1>
          
          {/* 模式切换按钮 todo */}
          {/* <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setSelectedMode('ai-podcast')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-all duration-200",
                selectedMode === 'ai-podcast'
                  ? "btn-primary"
                  : "btn-secondary"
              )}
            >
              <AiFillPlayCircle className="w-4 h-4" />
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
              <AiOutlineStar className="w-4 h-4" />
              FlowSpeech
            </button>
          </div> */}
        </div>

        {/* 主要创作区域 */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-soft">
          {/* 输入区域 */}
          <div className="p-6">
            <textarea
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setItem('podcast-topic', e.target.value); // 实时保存到 localStorage
              }}
              placeholder="输入文字，支持Markdown格式..."
              className="w-full h-32 resize-none border-none outline-none text-lg placeholder-neutral-400 bg-white"
              disabled={isGenerating}
            />
            
            {/* 自定义指令 */}
            {customInstructions !== undefined && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <textarea
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    setItem('podcast-custom-instructions', e.target.value); // 实时保存到 localStorage
                  }}
                  placeholder="添加自定义指令（可选）... 例如：固定的开场白和结束语，文案脚本语境，输出内容的重点"
                  className="w-full h-16 resize-none border-none outline-none text-sm placeholder-neutral-400 bg-white"
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
                onConfigChange={(config, name, newVoices) => { // 接收新的 voices 参数
                  setSelectedConfig(config);
                  setSelectedConfigName(name); // 更新配置名称状态
                  setVoices(newVoices); // 更新 voices 状态
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
              <AiOutlineDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 pointer-events-none" />
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
              <AiOutlineDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* 右侧操作按钮 todo */}
          <div className="flex items-center gap-6 sm:gap-1 flex-wrap justify-center sm:justify-right w-full sm:w-auto">
            {/* 文件上传 */}
            {/* <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
              title="上传文件"
              disabled={isGenerating}
            >
              <AiOutlineUpload className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            /> */}

            {/* 粘贴链接 */}
            {/* <button
              onClick={handlePaste}
              className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
              title="粘贴内容"
              disabled={isGenerating}
            >
              <AiOutlineLink className="w-4 h-4 sm:w-5 sm:h-5" />
            </button> */}

            {/* 复制 */}
            {/* <button
              onClick={() => navigator.clipboard.writeText(topic)}
              className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
              title="复制内容"
              disabled={isGenerating || !topic}
            >
              <AiOutlineCopy className="w-4 h-4 sm:w-5 sm:h-5" />
            </button> */}
            
            {/* 积分显示 */}
              <div className="flex items-center justify-center gap-1 text-xs text-neutral-500 w-20 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gem flex-shrink-0">
                  <path d="M6 3v18l6-4 6 4V3z"/>
                  <path d="M12 3L20 9L12 15L4 9L12 3Z"/>
                </svg>
                <span className="truncate">{credits}</span>
              </div>

              {/* 签到按钮 */}
              <button
                onClick={handleSignIn}
                disabled={isGenerating}
                className={cn(
                  "btn-secondary flex items-center gap-1 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2",
                  isGenerating && "opacity-50 cursor-not-allowed"
                )}
              >
              签到
              </button>

            <div className="flex flex-col items-center gap-1">
              {/* 创作按钮 */}
              <button
                onClick={handleSubmit}
                disabled={!topic.trim() || isGenerating}
                className={cn(
                  "btn-primary flex items-center gap-1 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2",
                  (!topic.trim() || isGenerating) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <AiOutlineLoading3Quarters className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className=" xs:inline">Biu!</span>
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
            setSelectedPodcastVoices(prev => {
              const newState = {...prev, [selectedConfigName]: selectedVoices};
              setItem('podcast-selected-voices', newState); // 缓存选中的说话人
              return newState;
            }); // 更新选中的说话人状态
            setShowVoicesModal(false); // 选中后关闭模态框
          }}
          initialSelectedVoices={selectedPodcastVoices[selectedConfigName] || []} // 传递选中的说话人作为初始值
          currentSelectedVoiceIds={selectedPodcastVoices[selectedConfigName]?.map(v => v.code!) || []} // 更新 currentSelectedVoiceIds
          onRemoveVoice={(voiceCodeToRemove) => {
            setSelectedPodcastVoices(prev => {
              const newVoices = (prev[selectedConfigName] || []).filter(v => v.code !== voiceCodeToRemove);
              const newState = {
                ...prev,
                [selectedConfigName]: newVoices
              };
              setItem('podcast-selected-voices', newState); // 更新缓存
              return newState;
            });
          }}
        />
      )}
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
};

export default PodcastCreator;

