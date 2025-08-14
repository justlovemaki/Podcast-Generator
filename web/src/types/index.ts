// 播客生成相关类型定义
export interface PodcastGenerationRequest {
  topic: string;
  customInstructions?: string;
  speakers?: number;
  language?: string;
  style?: 'casual' | 'professional' | 'educational' | 'entertaining';
  duration?: 'short' | 'medium' | 'long'; // 5-10min, 15-20min, 25-30min
  ttsConfig?: TTSConfig;
}

export interface PodcastGenerationResponse {
  id: string;
  status: 'pending' | 'generating_outline' | 'generating_script' | 'generating_audio' | 'merging' | 'completed' | 'error';
  progress: number; // 0-100
  outline?: string;
  script?: PodcastScript;
  audioUrl?: string;
  error?: string;
  createdAt: string;
  estimatedTime?: number; // 预估完成时间（秒）
}

export interface PodcastScript {
  title: string;
  speakers: Speaker[];
  segments: ScriptSegment[];
  totalDuration?: number;
}

export interface Speaker {
  id: string;
  name: string;
  voice: string;
  role: string;
  description?: string;
}

export interface ScriptSegment {
  id: string;
  speakerId: string;
  text: string;
  timestamp?: number;
  audioUrl?: string;
}

// TTS配置类型
export interface TTSConfig {
  podUsers: Speaker[];
  voices: Voice[];
  apiUrl: string;
  tts_provider?: string;
  headers?: Record<string, string>;
  request_payload?: Record<string, any>;
}

export interface Voice {
  name?: string;
  code?: string;
  alias?: string;
  usedname?: string;
  locale?: string; // 新增 locale 字段
  gender?: 'Male' | 'Female';
  description?: string;
  volume_adjustment?: number;
  speed_adjustment?: number;
  sample_audio_url?: string; // 添加 sample_audio_url
}

// 音频播放器相关类型
export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: 'progress' | 'status' | 'error' | 'completed';
  data: {
    id: string;
    progress?: number;
    status?: PodcastGenerationResponse['status'];
    message?: string;
    result?: PodcastGenerationResponse;
  };
}

// 用户界面状态
export interface UIState {
  sidebarCollapsed: boolean;
  currentView: 'home' | 'library' | 'explore' | 'settings';
  theme: 'light' | 'dark';
}

// 播客库相关类型
export interface PodcastItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: {
    name: string;
    avatar: string;
  };
  duration: number;
  playCount: number;
  createdAt: string;
  audioUrl: string;
  tags: string[];
}

// API响应通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}