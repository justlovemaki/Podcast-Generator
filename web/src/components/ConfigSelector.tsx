'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { usePreventDuplicateCall } from '@/hooks/useApiCall';
import type { TTSConfig, Voice } from '@/types';
import { getTTSProviders } from '@/lib/config';
const enableTTSConfigPage = process.env.NEXT_PUBLIC_ENABLE_TTS_CONFIG_PAGE === 'true';

interface ConfigFile {
  name: string;
  displayName: string;
  path: string;
}

interface ConfigSelectorProps {
  onConfigChange?: (config: TTSConfig, name: string, voices: Voice[]) => void; // 添加 name 和 voices 参数
  className?: string;
}

const ConfigSelector: React.FC<ConfigSelectorProps> = ({
  onConfigChange,
  className
}) => {
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [currentConfig, setCurrentConfig] = useState<TTSConfig | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]); // 新增 voices 状态
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { executeOnce } = usePreventDuplicateCall();

  // 检查TTS配置是否已设置
  const isTTSConfigured = (configName: string, settings: any): boolean => {
    if (!settings) return false;
    
    const configKey = configName.replace('.json', '').split('-')[0];
    
    switch (configKey) {
      case 'index':
        return !!(settings.index?.api_url);
      case 'edge':
        return !!(settings.edge?.api_url);
      case 'doubao':
        return !!(settings.doubao?.['X-Api-App-Id'] && settings.doubao?.['X-Api-Access-Key']);
      case 'fish':
        return !!(settings.fish?.api_key);
      case 'minimax':
        return !!(settings.minimax?.group_id && settings.minimax?.api_key);
      case 'gemini':
        return !!(settings.gemini?.api_key);
      default:
        return false;
    }
  };

  // 加载配置文件列表 - 使用防重复调用机制
  const loadConfigFiles = async () => {
    const result = await executeOnce(async () => {
      const response = await fetch('/api/config');
      return response.json();
    });

    if (!result) {
      return; // 如果是重复调用，直接返回
    }

    try {
      if (result.success && Array.isArray(result.data)) {
        // 过滤出已配置的TTS选项
        const settings = await getTTSProviders();
        const availableConfigs = result.data.filter((config: ConfigFile) =>
          isTTSConfigured(config.name, settings)
        );
        
        setConfigFiles(availableConfigs);
        // 默认选择第一个可用配置
        if (availableConfigs.length > 0 && !selectedConfig) {
          setSelectedConfig(availableConfigs[0].name);
          loadConfig(availableConfigs[0].name);
        } else if (availableConfigs.length === 0) {
          // 如果没有可用配置，清空当前选择
          setSelectedConfig('');
          setCurrentConfig(null);
          onConfigChange?.(null as any, '', []); // 传递空数组作为 voices
        }
      } else {
        console.error('Invalid config files data:', result);
        setConfigFiles([]);
      }
    } catch (error) {
      console.error('Failed to process config files:', error);
      setConfigFiles([]);
    }
  };

  useEffect(() => {
    loadConfigFiles();
  }, [executeOnce]); // 添加 executeOnce 到依赖项

  // 监听localStorage变化，重新加载配置
  useEffect(() => {
    if (!enableTTSConfigPage) return;

    const handleStorageChange = () => {
      loadConfigFiles();
    };

    window.addEventListener('storage', handleStorageChange);
    // 也监听自定义事件，用于同一页面内的设置更新
    window.addEventListener('settingsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
    };
  }, [selectedConfig, executeOnce]);

  // 加载特定配置文件
  const loadConfig = async (configFile: string) => {
    setIsLoading(true);
    try {
      const configResponse = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configFile }),
      });

      const configResult = await configResponse.json();

      let fetchedVoices: Voice[] = [];
      if (configResult.success) {
        fetchedVoices = configResult.data.voices;
        setVoices(fetchedVoices); // 更新 voices 状态
        setCurrentConfig(configResult.data);
        onConfigChange?.(configResult.data, configFile, fetchedVoices); // 传递 fetchedVoices
      }
    } catch (error) {
      console.error('Failed to load config or voices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigSelect = (configFile: string) => {
    setSelectedConfig(configFile);
    setIsOpen(false);
    loadConfig(configFile);
  };

  const selectedConfigFile = Array.isArray(configFiles) ? configFiles.find(f => f.name === selectedConfig) : null;

  return (
    <div>
      {/* 配置选择器 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded-lg text-sm btn-secondary w-full"
          disabled={isLoading}
        >
          {/* <Settings className="w-4 h-4 text-neutral-500" /> */}
          <span className="flex-1 text-left text-sm">
            {isLoading ? '加载中...' : selectedConfigFile?.displayName || (configFiles.length === 0 ? '请先配置TTS' : '选择TTS配置')}
          </span>
          {/* <ChevronDown className={cn(
            "w-4 h-4 text-neutral-400 transition-transform",
            isOpen && "rotate-180"
          )} /> */}
        </button>

        {/* 下拉菜单 */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mb-1 bg-white border border-neutral-200 rounded-lg shadow-large z-50 max-h-60 overflow-y-auto">
            {Array.isArray(configFiles) && configFiles.length > 0 ? configFiles.map((config) => (
              <button
                key={config.name}
                onClick={() => handleConfigSelect(config.name)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-black">
                    {config.displayName}
                  </div>
                </div>
                {selectedConfig === config.name && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </button>
            )) : (
              <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                <div className="mb-1">暂无可用的TTS配置</div>
                <div className="text-xs">请先在设置中配置TTS服务</div>
              </div>
            )}
          </div>
        )}

    
      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ConfigSelector;