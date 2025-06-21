import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useLlmContext } from '../contexts/LlmContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import './ChatInterface.css';

const ChatInterface: React.FC = () => {
  const {
    currentConversation,
    isLoading,
    error,
    sendMessage,
    createConversation,
    clearError,
    canSendMessage,
  } = useChat();

  const {
    status,
    isRunning,
    error: llmError,
    clearError: clearLlmError,
  } = useLlmContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartNewConversation = () => {
    createConversation();
  };

  const handleClearError = () => {
    clearError();
    clearLlmError();
  };

  if (!isRunning) {
    return (
      <div className="chat-interface">
        <div className="chat-status-message">
          <div className="status-icon">⚠️</div>
          <h3>LLM Service Not Running</h3>
          <p>Please start the LLM service to begin chatting.</p>
          <p>Service Status: {status.is_running ? 'Running' : 'Stopped'}</p>
          <p>Model: {status.model_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-title">
          <h2>💬 Chat with {status.model_name}</h2>
          <div className="chat-status">
            <span className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}></span>
            {isRunning ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="chat-actions">
          <button
            onClick={handleStartNewConversation}
            className="new-conversation-button"
            title="Start new conversation"
          >
            ➕ New Chat
          </button>
        </div>
      </div>

      {(error || llmError) && (
        <div className="chat-error">
          <div className="error-content">
            <span className="error-icon">❌</span>
            <span className="error-message">{error || llmError}</span>
            <button onClick={handleClearError} className="error-close">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="chat-messages">

        {currentConversation?.messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isLoading={false}
          />
        ))}

        {isLoading && (
          <ChatMessage
            message={{ role: 'assistant', content: '' }}
            isLoading={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!canSendMessage}
        placeholder={
          canSendMessage
            ? "Type your message..."
            : isLoading
            ? "Waiting for response..."
            : "Service not available"
        }
      />
    </div>
  );
};

export default ChatInterface;
