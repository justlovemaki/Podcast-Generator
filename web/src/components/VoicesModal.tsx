import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Voice } from '@/types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { AiOutlineClose } from 'react-icons/ai';
import { useTranslation } from '../i18n/client'; // 导入 useTranslation

interface VoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: Voice[];
  onSelectVoices: (voices: Voice[]) => void;
  initialSelectedVoices: Voice[];
  currentSelectedVoiceIds: string[];
  onRemoveVoice: (voiceCode: string) => void;
  lang: string;
}

const VoicesModal: React.FC<VoicesModalProps> = ({ isOpen, onClose, voices, onSelectVoices, initialSelectedVoices, currentSelectedVoiceIds, onRemoveVoice, lang }) => {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const [selectedLocalVoices, setSelectedLocalVoices] = useState<Voice[]>([]);

  // 最佳实践：在源头去重
  // 虽然使用 index 可以解决 key 的问题，但更好的做法是确保数据源本身没有重复项。
  const uniqueVoices = useMemo(() => {
    const seen = new Set();
    return voices.filter(voice => {
      const duplicate = seen.has(voice.code);
      seen.add(voice.code);
      return !duplicate;
    });
  }, [voices]);


  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(inputValue);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [inputValue]);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setDebouncedSearchTerm('');
      setSelectedLocalVoices(initialSelectedVoices);

      // 根据 lang 属性设置默认语言筛选
      if (lang === 'zh-CN') {
        setLanguageFilter('zh');
      } else if (lang === 'en') {
        setLanguageFilter('en');
      } else if (lang === 'ja') {
        setLanguageFilter('ja');
      } else {
        setLanguageFilter(''); // 其他语言默认不筛选
      }
    }
  }, [isOpen, initialSelectedVoices, lang]);

  const filteredVoices = useMemo(() => {
    // 【修复】使用去重后的 uniqueVoices 数组进行过滤
    let currentFilteredVoices = uniqueVoices;

    if (debouncedSearchTerm) {
      const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
      currentFilteredVoices = currentFilteredVoices.filter(voice =>
        (voice.alias && voice.alias.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (voice.name && voice.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (voice.description && voice.description.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    if (genderFilter) {
      currentFilteredVoices = currentFilteredVoices.filter(voice =>
        voice.gender === genderFilter
      );
    }

    if (languageFilter) {
      currentFilteredVoices = currentFilteredVoices.filter(voice =>
        voice.locale && voice.locale.toLowerCase().startsWith(languageFilter.toLowerCase())
      );
    }

    return currentFilteredVoices;
  }, [uniqueVoices, debouncedSearchTerm, genderFilter, languageFilter]); // 【修复】依赖项更新为 uniqueVoices

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:w-[40vw] md:h-[70vh] w-[80%] h-[90%] relative flex flex-col shadow-large">
        {/* Header and Filters */}
        <div className="flex items-center mb-4 pr-10 flex-wrap gap-2 justify-end">
          <div className="min-w-[220px] mr-auto"><h2 className="text-2xl font-bold text-black">{t('voicesModal.selectSpeaker')} ({selectedLocalVoices.length}/{uniqueVoices.length})</h2></div>
          {/* Filter buttons... */}
          <button
            onClick={() => { setGenderFilter(''); setLanguageFilter(''); }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${genderFilter === '' && languageFilter === '' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            {t('voicesModal.all')}
          </button>
          <button
            onClick={() => setGenderFilter('Male')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${genderFilter === 'Male' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            {t('voicesModal.male')}
          </button>
          <button
            onClick={() => setGenderFilter('Female')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${genderFilter === 'Female' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            {t('voicesModal.female')}
          </button>
          <button
            onClick={() => setLanguageFilter('zh')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${languageFilter === 'zh' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            {t('voicesModal.chinese')}
          </button>
          <button
            onClick={() => setLanguageFilter('en')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${languageFilter === 'en' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            {t('voicesModal.english')}
          </button>
          <button
            onClick={() => setLanguageFilter('ja')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${languageFilter === 'ja' ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            {t('voicesModal.japanese')}
          </button>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-black transition-all duration-200 z-10"
            aria-label={t('voicesModal.close')}
          >
            <AiOutlineClose className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative flex-shrink-0 mb-4">
          <label htmlFor="voice-search" className="sr-only">{t('voicesModal.searchVoices')}</label>
          <input
            id="voice-search"
            className="peer block w-full rounded-lg border border-neutral-200 py-3 pl-10 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 placeholder:text-neutral-500 transition-all duration-200"
            placeholder={t('voicesModal.searchVoicesPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500 peer-focus:text-black transition-colors duration-200" />
        </div>
        
        {/* Voices List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto p-3 scrollbar-hide">
          {filteredVoices.length > 0 ? (
            filteredVoices.map((voice: Voice, index: number) => (
              // 【修复】将 voice.code 和 index 结合，创建唯一的 key。
              // 即使数据源被清理过，这也是一种安全的做法。
              <div
                key={`${voice.code}-${index}`}
                className={`border border-neutral-200 rounded-xl p-4 shadow-sm w-223 h-110 flex items-center justify-between cursor-pointer transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5 ${
                  voice.gender === 'Female' ? 'bg-gradient-to-br from-pink-50 to-rose-50' : voice.gender === 'Male' ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-neutral-50'
                } ${selectedLocalVoices.some(v => v.code === voice.code) ? 'border-brand-purple ring-2 ring-brand-purple/50 bg-brand-purple/5' : 'hover:border-neutral-300'}`}
                onClick={() => {
                  const isSelected = selectedLocalVoices.some(v => v.code === voice.code);
                  if (isSelected) {
                    setSelectedLocalVoices(prev => prev.filter(v => v.code !== voice.code));
                  } else {
                    if (selectedLocalVoices.length < 5) {
                      setSelectedLocalVoices(prev => [...prev, voice]);
                    } else {
                      alert(t('voicesModal.maxVoicesAlert'));
                    }
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  {voice.audio && voice.audio.length > 0 && voice.audio !== 'undefined' && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const audio = audioRefs.current.get(voice.code!);
                          if (audio) {
                            if (playingVoiceId === voice.code) {
                              audio.pause();
                              setPlayingVoiceId(null);
                            } else {
                              if (playingVoiceId && audioRefs.current.has(playingVoiceId)) {
                                audioRefs.current.get(playingVoiceId)?.pause();
                              }
                              audio.play();
                              setPlayingVoiceId(voice.code!);
                            }
                          }
                        }}
                        className="p-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink text-white hover:from-brand-purple-hover hover:to-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all duration-200"
                      >
                        {playingVoiceId === voice.code ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                      </button>
                      <audio
                        ref={el => {
                          if (el) audioRefs.current.set(voice.code!, el);
                          else audioRefs.current.delete(voice.code!);
                        }}
                        src={voice.audio}
                        onEnded={() => setPlayingVoiceId(null)}
                        onPause={() => setPlayingVoiceId(null)}
                        preload="none"
                        className="hidden"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg break-words line-clamp-2 text-black">{voice.alias || voice.name}</h3>
                    <p className="text-sm text-neutral-600 break-words">{t('voicesModal.language')}: {voice.locale || t('voicesModal.unknown')}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-neutral-500">{t('voicesModal.noMatchingVoices')}</p>
          )}
        </div>

        {/* Footer with Selected Voices and Confirm Button */}
        <div className="flex items-center justify-end p-4 border-t border-neutral-200 mt-auto">
          {selectedLocalVoices.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 mr-auto">
              {selectedLocalVoices.map((voice, index) => (
                // 【修复】此处同样使用复合键，确保唯一性
                <div
                  key={`${voice.code}-${index}`}
                  className={`relative px-4 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center group transition-all duration-200 ${
                    index === 0 ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white' :
                    voice.gender === 'Female' ? 'bg-pink-100 text-pink-800 border border-pink-200' :
                    voice.gender === 'Male' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    'bg-neutral-100 text-neutral-800 border border-neutral-200'
                  }`}
                >
                  {index === 0 ? (
                    <div className="text-center leading-tight">
                      <div>{t('voicesModal.presenter')}</div>
                      <div className="text-xs">{voice.alias || voice.name}</div>
                    </div>
                  ) : (
                    <span>{voice.alias || voice.name}</span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedLocalVoices(prev => prev.filter(v => v.code !== voice.code));
                      if (currentSelectedVoiceIds.includes(voice.code!)) {
                        onRemoveVoice(voice.code!);
                      }
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full backdrop-blur-sm"
                    aria-label={t('voicesModal.delete')}
                  >
                    <AiOutlineClose className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              if (selectedLocalVoices.length > 5) {
                alert(t('voicesModal.maxVoicesAlert'));
                return;
              }
              onSelectVoices(selectedLocalVoices);
              onClose();
            }}
            className="px-6 py-3 bg-gradient-to-r text-xs sm:text-lg from-brand-purple to-brand-pink text-white rounded-full font-medium hover:from-brand-purple-hover hover:to-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all duration-200 shadow-medium hover:shadow-large"
          >
            {t('voicesModal.confirmSelection')} ({selectedLocalVoices.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoicesModal;
