import React, { useState, useEffect } from 'react';
import { AppConfigManager, AppConfig, DEFAULT_APP_CONFIG, validateLlmConfig } from '../config/app';
import { LlmConfig } from '../types/llm';
import './AppSettings.css';

const AppSettings: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const loadedConfig = AppConfigManager.loadConfig();
    setConfig(loadedConfig);
  }, []);

  const handleConfigChange = (field: keyof AppConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setHasChanges(true);

    // Validate LLM config if it changed
    if (field === 'defaultLlmConfig') {
      const errors = validateLlmConfig(value as LlmConfig);
      setValidationErrors(errors);
    }
  };

  const handleLlmConfigChange = (field: keyof LlmConfig, value: string | number) => {
    const newLlmConfig = { ...config.defaultLlmConfig, [field]: value };
    handleConfigChange('defaultLlmConfig', newLlmConfig);
  };

  const handleSave = () => {
    const errors = validateLlmConfig(config.defaultLlmConfig);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    AppConfigManager.saveConfig(config);
    setHasChanges(false);
    setValidationErrors([]);
    console.log('App configuration saved');
  };

  const handleReset = () => {
    const defaultConfig = AppConfigManager.resetConfig();
    setConfig(defaultConfig);
    setHasChanges(false);
    setValidationErrors([]);
  };

  const handleReload = () => {
    const loadedConfig = AppConfigManager.loadConfig();
    setConfig(loadedConfig);
    setHasChanges(false);
    setValidationErrors([]);
  };

  return (
    <div className="app-settings">
      <div className="settings-header">
        <h3>⚙️ Application Settings</h3>
        <div className="settings-actions">
          <button
            onClick={handleReload}
            className="reload-button"
            title="Reload settings from storage"
          >
            🔄 Reload
          </button>
          <button
            onClick={handleReset}
            className="reset-button"
            title="Reset to default settings"
          >
            🔧 Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || validationErrors.length > 0}
            className="save-button"
            title="Save current settings"
          >
            💾 Save Settings
          </button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>⚠️ Configuration Errors:</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="settings-section">
        <h4>Startup Behavior</h4>

        <div className="setting-field">
          <label>
            <input
              type="checkbox"
              checked={config.autoStartLlm}
              onChange={(e) => handleConfigChange('autoStartLlm', e.target.checked)}
            />
            Automatically start LLM service on app launch
          </label>
        </div>

        <div className="setting-field">
          <label>Retry Attempts:</label>
          <input
            type="number"
            value={config.retryAttempts}
            onChange={(e) => handleConfigChange('retryAttempts', parseInt(e.target.value))}
            min="0"
            max="10"
          />
        </div>

        <div className="setting-field">
          <label>Retry Delay (ms):</label>
          <input
            type="number"
            value={config.retryDelay}
            onChange={(e) => handleConfigChange('retryDelay', parseInt(e.target.value))}
            min="1000"
            max="30000"
            step="1000"
          />
        </div>
      </div>

      <div className="settings-section">
        <h4>Default LLM Configuration</h4>

        <div className="setting-field">
          <label>Model Name:</label>
          <input
            type="text"
            value={config.defaultLlmConfig.model_name}
            onChange={(e) => handleLlmConfigChange('model_name', e.target.value)}
            placeholder="Model identifier (e.g., deepseek-r1-distill-qwen-1.5b)"
          />
        </div>

        <div className="setting-field">
          <label>Host:</label>
          <input
            type="text"
            value={config.defaultLlmConfig.host}
            onChange={(e) => handleLlmConfigChange('host', e.target.value)}
            placeholder="Ollama host (e.g., http://127.0.0.1)"
          />
        </div>

        <div className="setting-field">
          <label>Context Size:</label>
          <input
            type="number"
            value={config.defaultLlmConfig.ctx_size}
            onChange={(e) => handleLlmConfigChange('ctx_size', parseInt(e.target.value))}
            min="512"
            max="32768"
          />
        </div>

        <div className="setting-row">
          <div className="setting-field">
            <label>Temperature:</label>
            <input
              type="number"
              step="0.1"
              value={config.defaultLlmConfig.temperature}
              onChange={(e) => handleLlmConfigChange('temperature', parseFloat(e.target.value))}
              min="0.1"
              max="2.0"
            />
          </div>
          <div className="setting-field">
            <label>Top P:</label>
            <input
              type="number"
              step="0.1"
              value={config.defaultLlmConfig.top_p}
              onChange={(e) => handleLlmConfigChange('top_p', parseFloat(e.target.value))}
              min="0.1"
              max="1.0"
            />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-field">
            <label>Port:</label>
            <input
              type="number"
              value={config.defaultLlmConfig.port}
              onChange={(e) => handleLlmConfigChange('port', parseInt(e.target.value))}
              min="1024"
              max="65535"
            />
          </div>
          <div className="setting-field">
            <label>Max Tokens:</label>
            <input
              type="number"
              value={config.defaultLlmConfig.max_tokens}
              onChange={(e) => handleLlmConfigChange('max_tokens', parseInt(e.target.value))}
              placeholder="-1 for unlimited"
            />
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="unsaved-changes-notice">
          ⚠️ You have unsaved changes. Click "Save Settings" to apply them.
        </div>
      )}
    </div>
  );
};

export default AppSettings;
