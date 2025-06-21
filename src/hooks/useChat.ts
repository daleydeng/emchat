import { useState, useCallback } from 'react';
import { ChatMessage, Conversation, ChatRequest, ChatResponse } from '../types/llm';
import { useLlm } from './useLlm';

export const useChat = () => {
  const { sendChatMessage, status, isRunning } = useLlm();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Create a new conversation
  const createConversation = useCallback((title?: string): Conversation => {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: title || 'New Conversation',
      messages: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    setConversations(prev => [conversation, ...prev]);
    setCurrentConversation(conversation);
    return conversation;
  }, []);

  // Update conversation
  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, ...updates, updated_at: new Date() }
          : conv
      )
    );

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev =>
        prev ? { ...prev, ...updates, updated_at: new Date() } : null
      );
    }
  }, [currentConversation]);

  // Add message to conversation
  const addMessage = useCallback((conversationId: string, message: ChatMessage) => {
    const conversation = conversations.find(c => c.id === conversationId) || currentConversation;
    const existingMessages = conversation?.messages || [];
    updateConversation(conversationId, {
      messages: [...existingMessages, message],
    });
  }, [conversations, currentConversation, updateConversation]);

  // Send message and get response
  const sendMessage = useCallback(async (content: string, conversationId?: string) => {
    if (!isRunning) {
      throw new Error('LLM service is not running');
    }

    let conversation = currentConversation;

    // Create new conversation if none exists or specified
    if (!conversation || conversationId) {
      conversation = conversationId
        ? conversations.find(c => c.id === conversationId) || createConversation()
        : createConversation();
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content,
    };

    try {
      setIsLoading(true);
      setError(undefined);

      // Add user message to conversation
      const updatedMessages = [...conversation.messages, userMessage];
      updateConversation(conversation.id, {
        messages: updatedMessages,
      });

      // Prepare chat request
      const request: ChatRequest = {
        model: status.model_name,
        messages: updatedMessages,
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 512,
      };

      // Send to LLM
      const response: ChatResponse = await sendChatMessage(request);

      // Add assistant response
      if (response.choices && response.choices.length > 0) {
        const assistantMessage = response.choices[0].message;
        const finalMessages = [...updatedMessages, assistantMessage];

        updateConversation(conversation.id, {
          messages: finalMessages,
        });

        // Update conversation title if it's the first exchange
        if (conversation.messages.length === 0) {
          const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
          updateConversation(conversation.id, { title });
        }
      } else {
        throw new Error('No response received from LLM service');
      }

      return response;
    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    isRunning,
    currentConversation,
    conversations,
    status.model_name,
    sendChatMessage,
    createConversation,
    updateConversation,
  ]);

  // Select conversation
  const selectConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    setCurrentConversation(conversation || null);
  }, [conversations]);

  // Delete conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  }, [currentConversation]);

  // Clear all conversations
  const clearConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  return {
    // State
    conversations,
    currentConversation,
    isLoading,
    error,

    // Actions
    createConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
    clearConversations,
    clearError,

    // Computed properties
    hasConversations: conversations.length > 0,
    canSendMessage: isRunning && !isLoading,
  };
};
