import { LlmConfig } from '../types/llm';

export interface AppConfig {
  autoStartLlm: boolean;
  defaultLlmConfig: LlmConfig;
  retryAttempts: number;
  retryDelay: number; // in milliseconds
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  autoStartLlm: true,
  defaultLlmConfig: {
    model_name: "Llama-3.2-1B-Instruct-Q5_K_M",
    temperature: 0.8,
    top_p: 0.9,
    max_tokens: 512,
    ctx_size: 4096,
    n_gpu_layers: 0,
  },
  retryAttempts: 3,
  retryDelay: 2000,
};

// Configuration management utilities
export class AppConfigManager {
  private static readonly CONFIG_KEY = 'tauri-app-config';

  static loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_APP_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load app config from localStorage:', error);
    }
    return DEFAULT_APP_CONFIG;
  }

  static saveConfig(config: AppConfig): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save app config to localStorage:', error);
    }
  }

  static resetConfig(): AppConfig {
    try {
      localStorage.removeItem(this.CONFIG_KEY);
    } catch (error) {
      console.warn('Failed to remove app config from localStorage:', error);
    }
    return DEFAULT_APP_CONFIG;
  }

  static updateConfig(updates: Partial<AppConfig>): AppConfig {
    const current = this.loadConfig();
    const updated = { ...current, ...updates };
    this.saveConfig(updated);
    return updated;
  }
}

// Model name validation for llama-cpp-2
export const validateModelName = (modelName: string): boolean => {
  // Check if model name is valid (not empty)
  if (!modelName || modelName.trim() === '') {
    return false;
  }

  // Check for invalid characters that might cause issues
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(modelName)) {
    return false;
  }

  return true;
};

// LLM configuration validation for llama-cpp-2
export const validateLlmConfig = (config: LlmConfig): string[] => {
  const errors: string[] = [];

  if (!validateModelName(config.model_name)) {
    errors.push('Model name must be a valid identifier');
  }

  if (config.ctx_size <= 0) {
    errors.push('Context size must be greater than 0');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (config.top_p < 0 || config.top_p > 1) {
    errors.push('Top P must be between 0 and 1');
  }

  if (config.max_tokens <= 0) {
    errors.push('Max tokens must be greater than 0');
  }

  if (config.n_gpu_layers < 0) {
    errors.push('GPU layers must be 0 or greater');
  }

  if (config.n_threads !== undefined && config.n_threads <= 0) {
    errors.push('Thread count must be greater than 0');
  }

  return errors;
};



export const isValidAppConfig = (config: AppConfig): boolean => {
  if (typeof config.autoStartLlm !== 'boolean') return false;
  if (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0) return false;
  if (typeof config.retryDelay !== 'number' || config.retryDelay < 0) return false;

  const llmErrors = validateLlmConfig(config.defaultLlmConfig);
  return llmErrors.length === 0;
};
