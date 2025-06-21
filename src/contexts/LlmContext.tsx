import React, { createContext, useContext, ReactNode } from 'react';
import { useLlm } from '../hooks/useLlm';
import {
  LlmConfig,
  LlmServiceStatus,
  ChatRequest,
  ChatResponse,
  ModelsResponse,
} from '../types/llm';

interface LlmContextType {
  // State
  status: LlmServiceStatus;
  config: LlmConfig;
  error?: string;
  isInitialized: boolean;
  isLoading: boolean;
  autoStartAttempted: boolean;

  // Actions
  initializeLlm: (config: LlmConfig) => Promise<string>;
  startService: () => Promise<string>;
  stopService: () => Promise<string>;
  refreshStatus: () => Promise<LlmServiceStatus>;
  sendChatMessage: (request: ChatRequest) => Promise<ChatResponse>;
  listModels: () => Promise<ModelsResponse>;
  clearError: () => void;
  autoInitializeAndStart: () => Promise<void>;
  checkLlmHealth: () => Promise<string>;

  // Computed properties
  isRunning: boolean;
  canStart: boolean;
  canStop: boolean;
}

const LlmContext = createContext<LlmContextType | undefined>(undefined);

interface LlmProviderProps {
  children: ReactNode;
}

export const LlmProvider: React.FC<LlmProviderProps> = ({ children }) => {
  const llmHook = useLlm();

  return (
    <LlmContext.Provider value={llmHook}>
      {children}
    </LlmContext.Provider>
  );
};

export const useLlmContext = (): LlmContextType => {
  const context = useContext(LlmContext);
  if (context === undefined) {
    throw new Error('useLlmContext must be used within a LlmProvider');
  }
  return context;
};
