// 播客生成相关类型定义
export interface PodcastGenerationRequest {
  tts_provider?: string;//tts选项的值
  input_txt_content: string; //输入文字和自定义指令的拼接，自定义指令放在最上面，用```custom-begin```custom-end包裹
  tts_providers_config_content?: string; // 根据用户反馈，这个是配置内容，来自设置
  podUsers_json_content?: string; // 说话人配置，来自选择
  api_key?: string; // 来自保存的设置
  base_url?: string; // 来自保存的设置
  model?: string; // 来自保存的设置
  callback_url?: string; // 固定值
  usetime?: string; // 时长 来自选择
  output_language?: string; // 语言 来自设置
}

export interface PodcastGenerationResponse {
  id?: string; // 任务ID
  status: 'pending' | 'running' | 'completed' | 'failed' ;
  task_id?: string;
  podUsers?: Array<{ role: string; code: string; }>;
  output_audio_filepath?: string;
  overview_content?: string;
  podcast_script?: { podcast_transcripts: Array<{ speaker_id: number; dialog: string; }>; };
  avatar_base64?: string;
  audio_duration?: string;
  title?: string;
  tags?: string;
  error?: string;
  timestamp?: number;
  audioUrl?: string;
  estimatedTime?: number; // 新增预估时间
  progress?: number; // 新增进度百分比
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
  name?: string; // 新增 name 属性
  podUsers?: Speaker[]; // 将 podUsers 改为可选
  voices: Voice[];
  apiUrl?: string; // 将 apiUrl 改为可选
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
  audio?: string; 
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
  status: 'pending' | 'running' | 'completed' | 'failed'; // 添加status属性
}

// 设置表单数据类型 - 从 SettingsForm.tsx 复制过来并导出
export interface SettingsFormData {
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

// API响应通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number; // 新增状态码
}

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

// PodcastStatusResponse 接口，用于匹配 api/podcast-status 的返回结构
export interface PodcastStatusResponse {
  message: string;
  tasks: PodcastGenerationResponse[]; // 包含任务列表
}