import React from 'react';
import { ChatMessage as ChatMessageType } from '../types/llm';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`chat-message ${isUser ? 'user' : isSystem ? 'system' : 'assistant'}`}>
      <div className="message-header">
        <span className="message-role">
          {isUser ? '👤 You' : isSystem ? '⚙️ System' : '🤖 Assistant'}
        </span>
        <span className="message-time">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
      <div className={`message-content ${isLoading ? 'loading' : ''}`}>
        {isLoading ? (
          <div className="loading-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        ) : (
          <div className="message-text">
            {message.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < message.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
