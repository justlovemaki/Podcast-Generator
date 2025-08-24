'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyIcon,
  CogIcon,
  GlobeAltIcon,
  SpeakerWaveIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { getItem, setItem } from '@/lib/storage';
import { useTranslation } from '../i18n/client'; // 导入 useTranslation

// 存储键名
const SETTINGS_STORAGE_KEY = 'podcast-settings';

// 设置表单数据类型
interface SettingsFormData {
  apikey: string;
  model: string;
  baseurl: string;
  index: {
    api_url: string;
  };
  edge: {
    api_url: string;
  };
  doubao: {
    'X-Api-App-Id': string;
    'X-Api-Access-Key': string;
  };
  fish: {
    api_key: string;
  };
  minimax: {
    group_id: string;
    api_key: string;
  };
  gemini: {
    api_key: string;
  };
}

// 模型选项
const MODEL_OPTIONS = [
  'gpt-4-turbo',
  'gpt-4o-mini',
  'gpt-4o',
];

// TTS服务配置
const TTS_SERVICES = [
  { key: 'doubao', name: 'Doubao TTS', icon: SpeakerWaveIcon },
  { key: 'fish', name: 'Fish TTS', icon: SpeakerWaveIcon },
  { key: 'minimax', name: 'Minimax TTS', icon: SpeakerWaveIcon },
  { key: 'gemini', name: 'Gemini TTS', icon: SpeakerWaveIcon },
  { key: 'edge', name: 'Edge TTS', icon: SpeakerWaveIcon }, // Edge TTS 仍在网络 API 服务中
  { key: 'index', name: 'Index TTS', icon: SpeakerWaveIcon }, // Index TTS 保持本地 API
];

interface SettingsFormProps {
  onSave?: (data: SettingsFormData) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  lang: string; // 新增 lang 属性
}

export default function SettingsForm({ onSave, onSuccess, onError, lang }: SettingsFormProps) {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间
  const [formData, setFormData] = useState<SettingsFormData>({
    apikey: '',
    model: '',
    baseurl: '',
    index: { api_url: '' },
    edge: { api_url: '' },
    doubao: { 'X-Api-App-Id': '', 'X-Api-Access-Key': '' },
    fish: { api_key: '' },
    minimax: { group_id: '', api_key: '' },
    gemini: { api_key: '' },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // 组件挂载时从 localStorage 加载设置
  useEffect(() => {
    const savedSettings = getItem<SettingsFormData>(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      // 确保从 localStorage 加载的设置中，所有预期的字符串字段都为字符串
      // 防止出现受控组件变为非受控组件的警告
      const normalizedSettings = {
        apikey: savedSettings.apikey || '',
        model: savedSettings.model || '',
        baseurl: savedSettings.baseurl || '',
        index: {
          api_url: savedSettings.index?.api_url || '',
        },
        edge: {
          api_url: savedSettings.edge?.api_url || '',
        },
        doubao: {
          'X-Api-App-Id': savedSettings.doubao?.['X-Api-App-Id'] || '',
          'X-Api-Access-Key': savedSettings.doubao?.['X-Api-Access-Key'] || '',
        },
        fish: {
          api_key: savedSettings.fish?.api_key || '',
        },
        minimax: {
          group_id: savedSettings.minimax?.group_id || '',
          api_key: savedSettings.minimax?.api_key || '',
        },
        gemini: {
          api_key: savedSettings.gemini?.api_key || '',
        },
      };
      setFormData(normalizedSettings);
    }
  }, []);


  const togglePasswordVisibility = (fieldKey: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  const handleInputChange = (path: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      
      if (keys.length === 1) {
        (newData as any)[keys[0]] = value;
      } else if (keys.length === 2) {
        (newData as any)[keys[0]][keys[1]] = value;
      }
      
      return newData;
    });
  };

  const handleReset = () => {
    const defaultData: SettingsFormData = {
      apikey: '',
      model: '',
      baseurl: '',
      index: { api_url: '' },
      edge: { api_url: '' },
      doubao: { 'X-Api-App-Id': '', 'X-Api-Access-Key': '' },
      fish: { api_key: '' },
      minimax: { group_id: '', api_key: '' },
      gemini: { api_key: '' },
    };
    
    setFormData(defaultData);
    setShowPasswords({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 转换空字符串为 null
      const processedData = JSON.parse(JSON.stringify(formData), (key, value) => {
        return value === '' ? null : value;
      });

      // 保存到 localStorage
      setItem(SETTINGS_STORAGE_KEY, processedData);

      // 触发自定义事件，通知其他组件设置已更新
      window.dispatchEvent(new CustomEvent('settingsUpdated'));

      // 调用保存回调
      if (onSave) {
        onSave(processedData);
      }
 
       onSuccess?.(t('settingsForm.settingsSavedSuccessfully'));
     } catch (error) {
       console.error('Error saving settings:', error);
       onError?.(t('settingsForm.errorSavingSettings'));
     } finally {
       setIsLoading(false);
     }
   };

  const renderPasswordInput = (
    label: string,
    path: string,
    value: string,
    placeholder?: string,
    required?: boolean
  ) => {
    const fieldKey = path.replace('.', '_');
    const isVisible = showPasswords[fieldKey];

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type={isVisible ? 'text' : 'password'}
            value={value}
            onChange={(e) => handleInputChange(path, e.target.value)}
            placeholder={placeholder}
            className="input-primary pr-10 w-full"
            required={required}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility(fieldKey)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
          >
            {isVisible ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderTextInput = (
    label: string,
    path: string,
    value: string,
    placeholder?: string,
    required?: boolean,
    wrapperClassName?: string // 新增 wrapperClassName 参数
  ) => (
    <div className={`space-y-2 ${wrapperClassName || ''}`}> {/* 应用 wrapperClassName */}
      <label className="block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(path, e.target.value)}
        placeholder={placeholder}
        className="input-primary w-full"
        required={required}
      />
    </div>
  );

  const renderSelectInput = (
    label: string,
    path: string,
    value: string,
    options: { value: string; label: string }[],
    required?: boolean
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => handleInputChange(path, e.target.value)}
        className="input-primary"
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-black mb-2">{t('settingsForm.settings')}</h1>
        <p className="text-neutral-600 break-words">{t('settingsForm.apiSettingsDescription')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 通用设置 */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <CogIcon className="h-5 w-5 text-neutral-600" />
            </div>
            <h2 className="text-xl font-semibold text-black">{t('settingsForm.generalSettings')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderPasswordInput(
              t('settingsForm.apiKey'),
              'apikey',
              formData.apikey,
              t('settingsForm.inputYourOpenAIAPIKey'),
              true
            )}

            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-neutral-700">
                {t('settingsForm.model')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  onFocus={() => setIsModelDropdownOpen(true)}
                  placeholder={t('settingsForm.selectOrEnterModelName')}
                  className="input-primary w-full pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {MODEL_OPTIONS.map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => {
                          if (model === '输入自定义模型') {
                            handleInputChange('model', '');
                          } else {
                            handleInputChange('model', model);
                          }
                          setIsModelDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-neutral-50 transition-colors text-sm"
                      >
                        {model === '输入自定义模型' ? t('settingsForm.customModelInput') : model}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 点击外部关闭下拉菜单 */}
              {isModelDropdownOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsModelDropdownOpen(false)}
                />
              )}
            </div>

            {renderTextInput(
              t('settingsForm.baseURL'),
              'baseurl',
              formData.baseurl,
              t('settingsForm.optionalCustomBaseURL'),
              false, // required
              'md:col-span-2' // wrapperClassName
            )}
          </div>
        </div>

        {/* TTS服务设置 */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <SpeakerWaveIcon className="h-5 w-5 text-neutral-600" />
            </div>
            <h2 className="text-xl font-semibold text-black">{t('settingsForm.ttsServiceSettings')}</h2>
          </div>

          <div className="space-y-8">
            {/* 网络 API TTS 服务 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                {t('settingsForm.webAPITTSServices')}
              </h3>
              <div className="grid grid-cols-1 gap-8">
                {/* Edge TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    {t('settingsForm.edgeTTS')}
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">{t('settingsForm.edgeTTSDescription')}</p>
                  {renderTextInput(
                    'API URL',
                    'edge.api_url',
                    formData.edge.api_url,
                    'http://localhost:8001'
                  )}
                </div>

                {/* Doubao TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    {t('settingsForm.doubaoTTS')}
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">{t('settingsForm.doubaoTTSDescription')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderTextInput(
                      t('settingsForm.appID'),
                      'doubao.X-Api-App-Id',
                      formData.doubao['X-Api-App-Id'],
                      t('settingsForm.inputDoubaoAppID')
                    )}
                    {renderPasswordInput(
                      t('settingsForm.accessKey'),
                      'doubao.X-Api-Access-Key',
                      formData.doubao['X-Api-Access-Key'],
                      t('settingsForm.inputDoubaoAccessKey')
                    )}
                  </div>
                </div>

                {/* Minimax TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    {t('settingsForm.minimaxTTS')}
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">{t('settingsForm.minimaxTTSDescription')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderTextInput(
                      t('settingsForm.groupID'),
                      'minimax.group_id',
                      formData.minimax.group_id,
                      t('settingsForm.inputMinimaxGroupID')
                    )}
                    {renderPasswordInput(
                      t('settingsForm.apiKey'),
                      'minimax.api_key',
                      formData.minimax.api_key,
                      t('settingsForm.inputMinimaxAPIKey')
                    )}
                  </div>
                </div>

                {/* Fish TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    {t('settingsForm.fishTTS')}
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">{t('settingsForm.fishTTSDescription')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderPasswordInput(
                      t('settingsForm.apiKey'),
                      'fish.api_key',
                      formData.fish.api_key,
                      t('settingsForm.inputFishTTSAPIKey')
                    )}
                  </div>
                </div>

                {/* Gemini TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    {t('settingsForm.geminiTTS')}
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">{t('settingsForm.geminiTTSDescription')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderPasswordInput(
                      t('settingsForm.apiKey'),
                      'gemini.api_key',
                      formData.gemini.api_key,
                      t('settingsForm.inputGeminiAPIKey')
                    )}
                  </div>
                </div>
    
              </div>
            </div>

            {/* 本地 API TTS 服务 */}
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <SpeakerWaveIcon className="h-5 w-5 text-purple-500" />
                {t('settingsForm.localAPITTSServices')}
              </h3>
              <div className="grid grid-cols-1 gap-8">
                {/* Index TTS */}
                <div className="space-y-4 border-l-4 border-purple-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    {t('settingsForm.indexTTS')}
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">{t('settingsForm.indexTTSDescription')}</p>
                  {renderTextInput(
                    'API URL',
                    'index.api_url',
                    formData.index.api_url,
                    'http://localhost:8000'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-full font-medium transition-all duration-200 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
          >
            {t('settingsForm.reset')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="gradient-brand text-white px-8 py-3 rounded-full font-medium transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {t('settingsForm.saving')}
              </>
            ) : (
              <>
                {t('settingsForm.saveSettings')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* 帮助信息 */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-amber-800">{t('settingsForm.configurationNotes')}</h3>
            <ul className="text-sm text-amber-700 space-y-1 break-words">
              <li>• {t('settingsForm.apiKeyRequired')}</li>
              <li>• {t('settingsForm.ttsOptional')}</li>
              <li>• {t('settingsForm.emptyFieldsNull')}</li>
              <li>• {t('settingsForm.settingsApplyImmediately')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
