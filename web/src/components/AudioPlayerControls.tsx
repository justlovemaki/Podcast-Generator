'use client';

 import { useState, useRef, useEffect } from 'react';
 import { AiFillPlayCircle, AiFillPauseCircle } from 'react-icons/ai';
 import { useTranslation } from '../i18n/client'; // 导入 useTranslation

 interface AudioPlayerControlsProps {
   audioUrl: string;
   audioDuration?: string;
   lang: string; // 新增 lang 属性
 }

 export default function AudioPlayerControls({ audioUrl, audioDuration, lang }: AudioPlayerControlsProps) {
   const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
   const [isPlaying, setIsPlaying] = useState(false);
   const audioRef = useRef<HTMLAudioElement>(null);

   const togglePlayPause = () => {
     if (audioRef.current) {
       if (isPlaying) {
         audioRef.current.pause();
       } else {
         audioRef.current.play();
       }
       setIsPlaying(!isPlaying);
     }
   };

   useEffect(() => {
     const audio = audioRef.current;
     if (audio) {
       const onEnded = () => {
         setIsPlaying(false);
       };
       audio.addEventListener('ended', onEnded);
       return () => {
         audio.removeEventListener('ended', onEnded);
       };
     }
   }, []);

   return (
     <div className="flex justify-center my-8">
       <button
         onClick={togglePlayPause}
         className="bg-gray-900 text-white rounded-full px-6 py-3 inline-flex items-center gap-2 font-semibold hover:bg-gray-700 transition-colors shadow-md"
       >
         {isPlaying ? (
           <AiFillPauseCircle className="w-5 h-5" />
         ) : (
           <AiFillPlayCircle className="w-5 h-5" />
         )}
         <span>{isPlaying ? t('audioPlayerControls.pause') : t('audioPlayerControls.play')} ({audioDuration ?? '00:00'})</span>
       </button>
       <audio ref={audioRef} src={audioUrl} preload="auto" />
     </div>
   );
 }