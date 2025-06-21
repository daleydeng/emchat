#[cfg(test)]
mod tests {
    use crate::llm::{LlmConfig, LlmService, ChatRequest, ChatMessage};

    #[test]
    fn test_llm_config_default() {
        let config = LlmConfig::default();
        assert_eq!(config.model_name, "deepseek-r1-distill-qwen-1.5b");
        assert_eq!(config.host, "http://127.0.0.1");
        assert_eq!(config.port, 11434);
        assert_eq!(config.temperature, 0.8);
        assert_eq!(config.top_p, 0.9);
        assert_eq!(config.max_tokens, -1);
        assert_eq!(config.ctx_size, 4096);
    }

    #[test]
    fn test_llm_service_creation() {
        let config = LlmConfig {
            model_name: "test_model".to_string(),
            host: "http://127.0.0.1".to_string(),
            port: 8081,
            temperature: 0.7,
            top_p: 0.8,
            max_tokens: 1000,
            ctx_size: 2048,
        };

        let service = LlmService::new(config.clone());
        let status = service.get_status();

        assert!(!status.is_running);
        assert_eq!(status.port, 8081);
        assert_eq!(status.model_name, "test_model");
        assert_eq!(status.base_url, "http://127.0.0.1:8081");
    }

    #[test]
    fn test_chat_request_serialization() {
        let request = ChatRequest {
            model: "test_model".to_string(),
            messages: vec![
                ChatMessage {
                    role: "user".to_string(),
                    content: "Hello, world!".to_string(),
                },
            ],
            temperature: Some(0.8),
            top_p: Some(0.9),
            max_tokens: Some(100),
            stream: Some(false),
        };

        // Test that the request can be serialized to JSON
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("Hello, world!"));
        assert!(json.contains("test_model"));
        assert!(json.contains("user"));
    }

    #[test]
    fn test_chat_message_roles() {
        let user_msg = ChatMessage {
            role: "user".to_string(),
            content: "Test message".to_string(),
        };

        let assistant_msg = ChatMessage {
            role: "assistant".to_string(),
            content: "Test response".to_string(),
        };

        let system_msg = ChatMessage {
            role: "system".to_string(),
            content: "System prompt".to_string(),
        };

        assert_eq!(user_msg.role, "user");
        assert_eq!(assistant_msg.role, "assistant");
        assert_eq!(system_msg.role, "system");
    }

    #[test]
    fn test_llm_service_not_running_initially() {
        let config = LlmConfig::default();
        let service = LlmService::new(config);

        assert!(!service.is_running());
        assert!(!service.get_status().is_running);
    }
}
