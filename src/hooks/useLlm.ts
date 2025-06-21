import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  LlmConfig,
  LlmServiceStatus,
  ChatRequest,
  ChatResponse,
  ModelsResponse,
  LlmServiceState,
  DEFAULT_LLM_CONFIG,
} from '../types/llm';
import { AppConfigManager } from '../config/app';

export const useLlm = () => {
  const [state, setState] = useState<LlmServiceState>({
    status: {
      is_running: false,
      port: 0,
      model_name: 'Llama-3.2-1B-Instruct-Q5_K_M',
      base_url: 'local',
    },
    config: DEFAULT_LLM_CONFIG,
    isInitialized: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [autoStartAttempted, setAutoStartAttempted] = useState(false);

  // Initialize LLM service with configuration
  const initializeLlm = useCallback(async (config: LlmConfig) => {
    try {
      setIsLoading(true);
      const message = await invoke<string>('initialize_llm', { config });
      setState(prev => ({
        ...prev,
        config,
        isInitialized: true,
        error: undefined,
      }));
      return message;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start LLM service
  const startService = useCallback(async () => {
    try {
      setIsLoading(true);
      const message = await invoke<string>('start_llm_service');
      await refreshStatus();
      return message;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop LLM service
  const stopService = useCallback(async () => {
    try {
      setIsLoading(true);
      const message = await invoke<string>('stop_llm_service');
      await refreshStatus();
      return message;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get service status
  const refreshStatus = useCallback(async () => {
    try {
      const status = await invoke<LlmServiceStatus>('get_llm_status');
      setState(prev => ({
        ...prev,
        status,
        error: undefined,
      }));
      return status;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback(async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      setIsLoading(true);
      const response = await invoke<ChatResponse>('chat_with_llm', { request });
      return response;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // List available models
  const listModels = useCallback(async (): Promise<ModelsResponse> => {
    try {
      const response = await invoke<ModelsResponse>('list_llm_models');
      return response;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Check LLM health
  const checkLlmHealth = useCallback(async (): Promise<string> => {
    try {
      const response = await invoke<string>('check_llm_health');
      return response;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  // Auto-initialize and start LLM service
  const autoInitializeAndStart = useCallback(async () => {
    if (autoStartAttempted) return;

    const appConfig = AppConfigManager.loadConfig();
    if (!appConfig.autoStartLlm) {
      console.log('Auto-start disabled in configuration');
      setAutoStartAttempted(true);
      return;
    }

    let attempt = 0;
    const maxAttempts = appConfig.retryAttempts;

    while (attempt < maxAttempts && !autoStartAttempted) {
      try {
        setAutoStartAttempted(true);
        console.log(`Auto-initializing LLM service with llama-cpp-2 (attempt ${attempt + 1}/${maxAttempts})...`);

        // First, check available models and auto-update config if needed
        try {
          const modelsResponse = await listModels();
          if (modelsResponse.data.length > 0) {
            const availableModelNames = modelsResponse.data.map(m => m.id);
            console.log('Available models:', availableModelNames);

            // If the configured model is not available, use the first available model
            if (!availableModelNames.includes(appConfig.defaultLlmConfig.model_name)) {
              console.log(`Configured model '${appConfig.defaultLlmConfig.model_name}' not found. Using '${availableModelNames[0]}'`);
              appConfig.defaultLlmConfig.model_name = availableModelNames[0];
              AppConfigManager.saveConfig(appConfig);
            }
          }
        } catch (modelsError: any) {
          console.warn('Failed to list models:', modelsError.message);
        }

        // Check if models are available
        try {
          const healthCheck = await checkLlmHealth();
          console.log('LLM health check passed:', healthCheck);
        } catch (healthError: any) {
          console.warn('LLM health check failed:', healthError.message);
          // Continue with initialization attempt anyway
        }

        // Use the config directly - the backend will load local models
        const config = {
          ...appConfig.defaultLlmConfig,
        };

        // Initialize with configured settings
        await initializeLlm(config);
        console.log('LLM service initialized successfully');

        // Start the service
        await startService();
        console.log('LLM service started successfully');
        return; // Success, exit retry loop

      } catch (error: any) {
        console.error(`Auto-initialization attempt ${attempt + 1} failed:`, error);
        attempt++;

        if (attempt < maxAttempts) {
          console.log(`Retrying in ${appConfig.retryDelay}ms...`);
          setAutoStartAttempted(false); // Allow retry
          await new Promise(resolve => setTimeout(resolve, appConfig.retryDelay));
        } else {
          // Final failure - provide helpful error message
          let errorMessage = `Auto-start failed after ${maxAttempts} attempts: ${error.message}`;

          if (error.message.includes('Model') && error.message.includes('not found')) {
            // Try to extract available models from error message
            const availableMatch = error.message.match(/Available models: \[(.*?)\]/);
            if (availableMatch) {
              const availableModels = availableMatch[1];
              errorMessage += `\n\n🔧 Available models: ${availableModels}\n\n` +
                'Troubleshooting steps:\n' +
                '1. Update the model name in configuration to match an available model\n' +
                '2. Or download the required GGUF model file to the models/ directory\n' +
                '3. Ensure the model file name matches the configured model name\n' +
                '4. Check that the models directory exists in the project root\n' +
                '5. Restart this application';
            } else {
              errorMessage += '\n\n🔧 Troubleshooting steps:\n' +
                '1. Download GGUF model files to the models/ directory\n' +
                '2. Ensure the model file name matches the configured model name\n' +
                '3. Check that the models directory exists in the project root\n' +
                '4. Verify the model file is not corrupted\n' +
                '5. Restart this application';
            }
          }

          setState(prev => ({
            ...prev,
            error: errorMessage
          }));
        }
      }
    }
  }, [autoStartAttempted, initializeLlm, startService, checkLlmHealth, listModels]);

  // Auto-initialize on component mount
  useEffect(() => {
    if (!autoStartAttempted) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        autoInitializeAndStart();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoStartAttempted, autoInitializeAndStart]);

  // Auto-refresh status when service is running
  useEffect(() => {
    let interval: number;

    if (state.status.is_running) {
      interval = setInterval(() => {
        refreshStatus().catch(console.error);
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.status.is_running, refreshStatus]);

  return {
    // State
    status: state.status,
    config: state.config,
    error: state.error,
    isInitialized: state.isInitialized,
    isLoading,
    autoStartAttempted,

    // Actions
    initializeLlm,
    startService,
    stopService,
    refreshStatus,
    sendChatMessage,
    listModels,
    clearError,
    autoInitializeAndStart,
    checkLlmHealth,

    // Computed properties
    isRunning: state.status.is_running,
    canStart: state.isInitialized && !state.status.is_running,
    canStop: state.status.is_running,
  };
};
