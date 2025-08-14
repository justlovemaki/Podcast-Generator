'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getItem } from '@/lib/storage';
import type { TTSConfig } from '@/types';

interface ConfigFile {
  name: string;
  displayName: string;
  path: string;
}

interface ConfigSelectorProps {
  onConfigChange?: (config: TTSConfig, name: string) => void; // 添加 name 参数
  className?: string;
}

const ConfigSelector: React.FC<ConfigSelectorProps> = ({
  onConfigChange,
  className
}) => {
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [currentConfig, setCurrentConfig] = useState<TTSConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查TTS配置是否已设置
  const isTTSConfigured = (configName: string): boolean => {
    const settings = getItem<any>('podcast-settings');
    if (!settings) return false;
    
    const configKey = configName.replace('.json', '').split('-')[0];
    // console.log('configKey', configKey);
    
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

  // 加载配置文件列表
  const loadConfigFiles = async () => {
    try {
      const response = await fetch('/api/config');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        // 过滤出已配置的TTS选项
        const availableConfigs = result.data.filter((config: ConfigFile) => 
          isTTSConfigured(config.name)
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
          onConfigChange?.(null as any, '');
        }
      } else {
        console.error('Invalid config files data:', result);
        setConfigFiles([]);
      }
    } catch (error) {
      console.error('Failed to load config files:', error);
      setConfigFiles([]);
    }
  };

  useEffect(() => {
    loadConfigFiles();
  }, []);

  // 监听localStorage变化，重新加载配置
  useEffect(() => {
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
  }, [selectedConfig]);

  // 加载特定配置文件
  const loadConfig = async (configFile: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configFile }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentConfig(result.data);
        onConfigChange?.(result.data, configFile); // 传递 configFile 作为 name
      }
    } catch (error) {
      console.error('Failed to load config:', error);
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