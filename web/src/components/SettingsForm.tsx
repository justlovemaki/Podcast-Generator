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
}

export default function SettingsForm({ onSave, onSuccess, onError }: SettingsFormProps) {
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

      onSuccess?.('设置保存成功！');
    } catch (error) {
      console.error('Error saving settings:', error);
      onError?.('保存设置时出现错误，请重试');
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
        <h1 className="text-3xl font-bold text-black mb-2">设置</h1>
        <p className="text-neutral-600 break-words">配置播客生成器的API设置和TTS服务</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 通用设置 */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <CogIcon className="h-5 w-5 text-neutral-600" />
            </div>
            <h2 className="text-xl font-semibold text-black">通用设置</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderPasswordInput(
              'API Key',
              'apikey',
              formData.apikey,
              '输入您的OpenAI API Key',
              true
            )}

            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-neutral-700">
                模型
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  onFocus={() => setIsModelDropdownOpen(true)}
                  placeholder="选择或输入模型名称"
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
                        {model}
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
              'Base URL',
              'baseurl',
              formData.baseurl,
              '可选：自定义API基础URL',
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
            <h2 className="text-xl font-semibold text-black">TTS服务设置</h2>
          </div>

          <div className="space-y-8">
            {/* 网络 API TTS 服务 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                网络 API TTS 服务
              </h3>
              <div className="grid grid-cols-1 gap-8">
                {/* Edge TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    Edge TTS
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">基于微软Edge的TTS免费服务，提供高质量语音合成。</p>
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
                    Doubao TTS
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">由火山引擎提供支持的语音合成服务，baseUrl=https://openspeech.bytedance.com/api/v3/tts/unidirectional</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderTextInput(
                      'App ID',
                      'doubao.X-Api-App-Id',
                      formData.doubao['X-Api-App-Id'],
                      '输入Doubao App ID'
                    )}
                    {renderPasswordInput(
                      'Access Key',
                      'doubao.X-Api-Access-Key',
                      formData.doubao['X-Api-Access-Key'],
                      '输入Doubao Access Key'
                    )}
                  </div>
                </div>

                {/* Minimax TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    Minimax TTS
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">由Minimax提供支持的语音合成服务，baseUrl=https://api.minimaxi.com/v1/t2a_v2</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderTextInput(
                      'Group ID',
                      'minimax.group_id',
                      formData.minimax.group_id,
                      '输入Minimax Group ID'
                    )}
                    {renderPasswordInput(
                      'API Key',
                      'minimax.api_key',
                      formData.minimax.api_key,
                      '输入Minimax API Key'
                    )}
                  </div>
                </div>

                {/* Fish TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    Fish TTS
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">由FishAudio提供支持的语音合成服务，baseUrl=https://api.fish.audio/v1/tts</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderPasswordInput(
                      'API Key',
                      'fish.api_key',
                      formData.fish.api_key,
                      '输入Fish TTS API Key'
                    )}
                  </div>
                </div>

                {/* Gemini TTS */}
                <div className="space-y-4 border-l-4 border-blue-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    Gemini TTS
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">由Google Gemini提供支持的语音合成服务，baseUrl=https://generativelanguage.googleapis.com/v1beta/models</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderPasswordInput(
                      'API Key',
                      'gemini.api_key',
                      formData.gemini.api_key,
                      '输入Gemini API Key'
                    )}
                  </div>
                </div>
    
              </div>
            </div>

            {/* 本地 API TTS 服务 */}
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <SpeakerWaveIcon className="h-5 w-5 text-purple-500" />
                本地 API TTS 服务
              </h3>
              <div className="grid grid-cols-1 gap-8">
                {/* Index TTS */}
                <div className="space-y-4 border-l-4 border-purple-200 pl-4">
                  <h4 className="text-md font-medium text-black flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-neutral-500" />
                    Index TTS
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 mb-2 break-words">用于本地部署的IndexTTS服务，提供自定义语音合成能力。</p>
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
            重置
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="gradient-brand text-white px-8 py-3 rounded-full font-medium transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                保存中...
              </>
            ) : (
              <>
                保存设置
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
            <h3 className="text-sm font-medium text-amber-800">配置说明</h3>
            <ul className="text-sm text-amber-700 space-y-1 break-words">
              <li>• API Key 是必填项，用于调用OpenAI服务生成播客脚本</li>
              <li>• TTS服务配置为可选项，未配置的服务将不会在语音选择中显示</li>
              <li>• 空白字段将被保存为 null 值</li>
              <li>• 配置保存后将立即生效，无需重启应用</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
