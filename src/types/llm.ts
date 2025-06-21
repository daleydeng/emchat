export interface LlmConfig {
  model_name: string;
  model_path?: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  ctx_size: number;
  n_threads?: number;
  n_gpu_layers: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finish_reason?: string;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage?: ChatUsage;
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface LlmServiceStatus {
  is_running: boolean;
  port: number;
  model_name: string;
  base_url: string;
}

export interface LlmError {
  error_type: string;
  message: string;
}

export interface LlmServiceState {
  status: LlmServiceStatus;
  config: LlmConfig;
  error?: string;
  isInitialized: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation?: Conversation;
  isLoading: boolean;
  error?: string;
  serviceStatus: LlmServiceStatus;
}

// Default configurations
export const DEFAULT_LLM_CONFIG: LlmConfig = {
  model_name: "Llama-3.2-1B-Instruct-Q5_K_M",
  temperature: 0.8,
  top_p: 0.9,
  max_tokens: 512,
  ctx_size: 4096,
  n_gpu_layers: 0,
};

export const POPULAR_MODELS = [
  {
    name: "Llama 3.2 1B Instruct Q5_K_M",
    model_name: "Llama-3.2-1B-Instruct-Q5_K_M",
    size: "1.3 GB",
    description: "Fast and efficient model for basic conversations (default)",
  },
  {
    name: "DeepSeek-R1-Distill-Qwen-1.5B",
    model_name: "deepseek-r1-distill-qwen-1.5b",
    size: "1.5 GB",
    description: "Fast and efficient reasoning model",
  },
  {
    name: "Llama 3.2 3B Instruct",
    model_name: "Llama-3.2-3B-Instruct-Q5_K_M",
    size: "2.0 GB",
    description: "Balanced performance and quality",
  },
];
