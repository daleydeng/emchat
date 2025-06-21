import React, { useState, useEffect } from 'react';
import { useLlmContext } from '../contexts/LlmContext';
import { LlmConfig, DEFAULT_LLM_CONFIG } from '../types/llm';
import './LlmServicePanel.css';

const LlmServicePanel: React.FC = () => {
  const {
    status,
    config,
    error,
    isInitialized,
    isLoading,
    initializeLlm,
    startService,
    stopService,
    refreshStatus,
    clearError,
    checkLlmHealth,
    isRunning,
    canStart,
    canStop,
  } = useLlmContext();

  const [localConfig, setLocalConfig] = useState<LlmConfig>(config);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConfigChange = (field: keyof LlmConfig, value: string | number) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInitialize = async () => {
    try {
      await initializeLlm(localConfig);
    } catch (error) {
      console.error('Failed to initialize LLM:', error);
    }
  };

  const handleStart = async () => {
    try {
      await startService();
    } catch (error) {
      console.error('Failed to start service:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopService();
    } catch (error) {
      console.error('Failed to stop service:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshStatus();
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const result = await checkLlmHealth();
      alert(`Health Check Result:\n${result}`);
    } catch (error: any) {
      alert(`Health Check Failed:\n${error.message}`);
    }
  };

  const resetToDefaults = () => {
    setLocalConfig(DEFAULT_LLM_CONFIG);
  };

  return (
    <div className="llm-service-panel">
      <div className="panel-header">
        <h3>🤖 LLM Service Control</h3>
        <div className="service-status">
          <span className={`status-badge ${isRunning ? 'running' : 'stopped'}`}>
            {isRunning ? '🟢 Running' : '🔴 Stopped'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={clearError} className="error-close">✕</button>
        </div>
      )}

      <div className="panel-section">
        <h4>Configuration</h4>

        <div className="config-field">
          <label>Model Name:</label>
          <input
            type="text"
            value={localConfig.model_name}
            onChange={(e) => handleConfigChange('model_name', e.target.value)}
            disabled={isRunning}
            placeholder="Model identifier (e.g., Llama-3.2-1B-Instruct-Q5_K_M)"
          />
        </div>

        <div className="config-field">
          <label>Model Path (optional):</label>
          <input
            type="text"
            value={localConfig.model_path || ''}
            onChange={(e) => handleConfigChange('model_path', e.target.value)}
            disabled={isRunning}
            placeholder="Custom path to model file (leave empty for auto-detection)"
          />
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="toggle-advanced"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="advanced-config">
            <div className="config-field">
              <label>Context Size:</label>
              <input
                type="number"
                value={localConfig.ctx_size}
                onChange={(e) => handleConfigChange('ctx_size', parseInt(e.target.value))}
                disabled={isRunning}
                min="512"
                max="32768"
              />
            </div>

            <div className="config-row">
              <div className="config-field">
                <label>Temperature:</label>
                <input
                  type="number"
                  step="0.1"
                  value={localConfig.temperature}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  disabled={isRunning}
                  min="0.1"
                  max="2.0"
                />
              </div>
              <div className="config-field">
                <label>Top P:</label>
                <input
                  type="number"
                  step="0.1"
                  value={localConfig.top_p}
                  onChange={(e) => handleConfigChange('top_p', parseFloat(e.target.value))}
                  disabled={isRunning}
                  min="0.1"
                  max="1.0"
                />
              </div>
            </div>

            <div className="config-field">
              <label>Max Tokens:</label>
              <input
                type="number"
                value={localConfig.max_tokens}
                onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
                disabled={isRunning}
                min="1"
                max="8192"
              />
            </div>

            <div className="config-row">
              <div className="config-field">
                <label>GPU Layers:</label>
                <input
                  type="number"
                  value={localConfig.n_gpu_layers}
                  onChange={(e) => handleConfigChange('n_gpu_layers', parseInt(e.target.value))}
                  disabled={isRunning}
                  min="0"
                  max="100"
                  title="Number of layers to offload to GPU (0 = CPU only)"
                />
              </div>
              <div className="config-field">
                <label>Threads (optional):</label>
                <input
                  type="number"
                  value={localConfig.n_threads || ''}
                  onChange={(e) => handleConfigChange('n_threads', e.target.value ? parseInt(e.target.value) : undefined)}
                  disabled={isRunning}
                  min="1"
                  max="32"
                  placeholder="Auto"
                  title="Number of CPU threads to use (leave empty for auto)"
                />
              </div>
            </div>
          </div>
        )}

        <div className="config-actions">
          <button
            onClick={resetToDefaults}
            className="reset-button"
            disabled={isRunning}
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h4>Service Control</h4>

        <div className="service-info">
          <div className="info-row">
            <span>Status:</span>
            <span>{isRunning ? 'Running' : 'Stopped'}</span>
          </div>
          <div className="info-row">
            <span>Port:</span>
            <span>{status.port}</span>
          </div>
          <div className="info-row">
            <span>Model:</span>
            <span>{status.model_name}</span>
          </div>
          <div className="info-row">
            <span>Base URL:</span>
            <span>{status.base_url}</span>
          </div>
        </div>

        <div className="service-actions">
          {!isInitialized && (
            <button
              onClick={handleInitialize}
              disabled={isLoading}
              className="initialize-button"
            >
              {isLoading ? '⏳ Initializing...' : '🚀 Initialize'}
            </button>
          )}

          {canStart && (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="start-button"
            >
              {isLoading ? '⏳ Starting...' : '▶️ Start Service'}
            </button>
          )}

          {canStop && (
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="stop-button"
            >
              {isLoading ? '⏳ Stopping...' : '⏹️ Stop Service'}
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="refresh-button"
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>

          <button
            onClick={handleHealthCheck}
            disabled={isLoading}
            className="health-check-button"
            title="Check if LLM models are available and accessible"
          >
            {isLoading ? '⏳' : '🏥'} Health Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default LlmServicePanel;
