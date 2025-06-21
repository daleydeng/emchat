use serde::{Deserialize, Serialize};

use thiserror::Error;
use std::path::PathBuf;
use std::fs;
use std::time::Instant;
use log::{debug, info, warn, error};
use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::params::LlamaModelParams,
    model::LlamaModel,
    model::{AddBos, Special},
    sampling::LlamaSampler,

};
use encoding_rs::UTF_8;

#[derive(Debug, Error, Serialize, Deserialize)]
pub enum LlmError {
    #[error("Service not initialized")]
    NotInitialized,
    #[error("Service not running")]
    NotRunning,
    #[error("HTTP error: {0}")]
    HttpError(String),
    #[error("Serialization error: {0}")]
    SerializationError(String),
    #[error("Configuration error: {0}")]
    ConfigError(String),
    #[error("Model error: {0}")]
    ModelError(String),
    #[error("LlamaCpp error: {0}")]
    LlamaCppError(String),
    #[error("IO error: {0}")]
    IoError(String),
}



impl From<serde_json::Error> for LlmError {
    fn from(error: serde_json::Error) -> Self {
        LlmError::SerializationError(error.to_string())
    }
}

impl From<std::io::Error> for LlmError {
    fn from(error: std::io::Error) -> Self {
        LlmError::IoError(error.to_string())
    }
}

impl From<llama_cpp_2::LLamaCppError> for LlmError {
    fn from(error: llama_cpp_2::LLamaCppError) -> Self {
        LlmError::LlamaCppError(error.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub model_name: String,
    pub model_path: Option<PathBuf>,
    pub temperature: f32,
    pub top_p: f32,
    pub max_tokens: i32,
    pub ctx_size: u32,
    pub n_threads: Option<i32>,
    pub n_gpu_layers: i32,
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            model_name: "Llama-3.2-1B-Instruct-Q5_K_M".to_string(),
            model_path: None,
            temperature: 0.8,
            top_p: 0.9,
            max_tokens: 512,
            ctx_size: 4096,
            n_threads: None,
            n_gpu_layers: 0,
        }
    }
}



// Our own ChatMessage struct for API compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f64>,
    pub top_p: Option<f64>,
    pub max_tokens: Option<i32>,
    pub stream: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatChoice {
    pub index: u32,
    pub message: ChatMessage,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<ChatChoice>,
    pub usage: Option<ChatUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub owned_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelsResponse {
    pub object: String,
    pub data: Vec<ModelInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmServiceStatus {
    pub is_running: bool,
    pub port: u16,
    pub model_name: String,
    pub base_url: String,
}

pub struct LlmService {
    config: LlmConfig,
    backend: Option<LlamaBackend>,
    model: Option<LlamaModel>,
    is_initialized: bool,
}

impl LlmService {
    pub fn new(config: LlmConfig) -> Self {
        Self {
            config,
            backend: None,
            model: None,
            is_initialized: false,
        }
    }

    pub fn is_running(&self) -> bool {
        self.is_initialized && self.backend.is_some() && self.model.is_some()
    }

    pub fn get_status(&self) -> LlmServiceStatus {
        LlmServiceStatus {
            is_running: self.is_running(),
            port: 0, // Not applicable for local models
            model_name: self.config.model_name.clone(),
            base_url: "local".to_string(),
        }
    }

    fn get_models_directory() -> PathBuf {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("models")
    }

    fn find_model_file(&self, model_name: &str) -> Result<PathBuf, LlmError> {
        if let Some(ref path) = self.config.model_path {
            if path.exists() {
                return Ok(path.clone());
            }
        }

        let models_dir = Self::get_models_directory();
        if !models_dir.exists() {
            return Err(LlmError::ModelError(format!(
                "Models directory does not exist: {}",
                models_dir.display()
            )));
        }

        // Try different possible filenames for the model
        let possible_names = vec![
            format!("{}.gguf", model_name),
            format!("{}.bin", model_name),
            model_name.to_string(),
        ];

        for name in possible_names {
            let path = models_dir.join(&name);
            if path.exists() {
                log::info!("Found model file: {}", path.display());
                return Ok(path);
            }
        }

        // If not found, list available models for better error message
        let available_models = self.scan_available_models();
        let available_list = available_models
            .iter()
            .map(|m| m.id.as_str())
            .collect::<Vec<_>>()
            .join(", ");

        Err(LlmError::ModelError(format!(
            "Model '{}' not found in {}. Available models: [{}]",
            model_name,
            models_dir.display(),
            available_list
        )))
    }

    fn scan_available_models(&self) -> Vec<ModelInfo> {
        let models_dir = Self::get_models_directory();
        let mut models = Vec::new();

        if let Ok(entries) = fs::read_dir(&models_dir) {
            for entry in entries.flatten() {
                if let Some(file_name) = entry.file_name().to_str() {
                    if file_name.ends_with(".gguf") || file_name.ends_with(".bin") {
                        let model_name = file_name
                            .strip_suffix(".gguf")
                            .or_else(|| file_name.strip_suffix(".bin"))
                            .unwrap_or(file_name);

                        models.push(ModelInfo {
                            id: model_name.to_string(),
                            object: "model".to_string(),
                            created: chrono::Utc::now().timestamp() as u64,
                            owned_by: "local".to_string(),
                        });
                    }
                }
            }
        }

        models
    }

    /// Check if the model file exists and is accessible
    pub async fn check_llm_health(&self) -> Result<String, LlmError> {
        let models_dir = Self::get_models_directory();
        log::info!("Checking model availability in {}", models_dir.display());

        if !models_dir.exists() {
            let error_msg = format!(
                "Models directory does not exist: {}. Please create the directory and add GGUF model files.",
                models_dir.display()
            );
            log::error!("{}", error_msg);
            return Err(LlmError::ConfigError(error_msg));
        }

        let available_models = self.scan_available_models();
        if available_models.is_empty() {
            let error_msg = format!(
                "No GGUF model files found in {}. Please add .gguf model files to this directory.",
                models_dir.display()
            );
            log::warn!("{}", error_msg);
            return Err(LlmError::ModelError(error_msg));
        }

        let model_names: Vec<String> = available_models.iter().map(|m| m.id.clone()).collect();
        let success_msg = format!(
            "Found {} model(s) in {}: [{}]",
            available_models.len(),
            models_dir.display(),
            model_names.join(", ")
        );
        log::info!("{}", success_msg);
        Ok(success_msg)
    }

    pub async fn start(&mut self) -> Result<String, LlmError> {
        if self.is_running() {
            let msg = "LLM service already initialized".to_string();
            info!("⚠️ {}", msg);
            return Ok(msg);
        }

        info!("🚀 Initializing LLM service with model: {}", self.config.model_name);
        debug!("🔧 Configuration: ctx_size={}, n_gpu_layers={}, n_threads={:?}",
            self.config.ctx_size, self.config.n_gpu_layers, self.config.n_threads);

        // Initialize the backend
        info!("🔧 Initializing LLaMA backend...");
        let backend_start = Instant::now();
        let backend = LlamaBackend::init()
            .map_err(|e| {
                error!("❌ Failed to initialize backend: {}", e);
                LlmError::LlamaCppError(format!("Failed to initialize backend: {}", e))
            })?;
        info!("✅ Backend initialized in {:?}", backend_start.elapsed());

        // Find the model file
        info!("🔍 Searching for model file: {}", self.config.model_name);
        let model_path = self.find_model_file(&self.config.model_name)?;
        info!("📁 Model file found: {}", model_path.display());

        // Set up model parameters
        info!("⚙️ Setting up model parameters...");
        let mut model_params = LlamaModelParams::default();
        if self.config.n_gpu_layers > 0 {
            info!("🎮 Configuring {} GPU layers", self.config.n_gpu_layers);
            model_params = model_params.with_n_gpu_layers(self.config.n_gpu_layers as u32);
        } else {
            info!("💻 Using CPU-only inference");
        }

        // Load the model
        info!("📚 Loading model from file...");
        let model_start = Instant::now();
        let model = LlamaModel::load_from_file(&backend, model_path, &model_params)
            .map_err(|e| {
                error!("❌ Failed to load model: {}", e);
                LlmError::LlamaCppError(format!("Failed to load model: {}", e))
            })?;
        let model_duration = model_start.elapsed();
        info!("✅ Model loaded successfully in {:?}", model_duration);

        // Store everything
        self.backend = Some(backend);
        self.model = Some(model);
        self.is_initialized = true;

        let success_msg = format!(
            "LLM service initialized successfully with model: {} (context size: {})",
            self.config.model_name, self.config.ctx_size
        );
        info!("🎉 {}", success_msg);
        Ok(success_msg)
    }

    pub async fn stop(&mut self) -> Result<String, LlmError> {
        if self.is_initialized {
            info!("🛑 Stopping LLM service...");
            self.backend = None;
            self.model = None;
            self.is_initialized = false;
            let msg = "LLM service stopped successfully".to_string();
            info!("✅ {}", msg);
            Ok(msg)
        } else {
            let error_msg = "LLM service is not running";
            warn!("⚠️ {}", error_msg);
            Err(LlmError::NotRunning)
        }
    }



    pub async fn chat_completion(&self, request: ChatRequest) -> Result<ChatResponse, LlmError> {
        let start_time = Instant::now();

        // Log incoming chat request
        info!("🚀 Chat completion request received");
        debug!("📋 Request details: model={}, message_count={}, temperature={:?}, top_p={:?}, max_tokens={:?}",
            request.model,
            request.messages.len(),
            request.temperature,
            request.top_p,
            request.max_tokens
        );

        // Log each message in the conversation
        for (i, message) in request.messages.iter().enumerate() {
            debug!("💬 Message {}: role='{}', content_length={} chars",
                i + 1,
                message.role,
                message.content.len()
            );
            debug!("📝 Message {} content: '{}'", i + 1, message.content);
        }

        let backend = self.backend.as_ref().ok_or_else(|| {
            error!("❌ Backend not initialized");
            LlmError::NotRunning
        })?;

        let model = self.model.as_ref().ok_or_else(|| {
            error!("❌ Model not loaded");
            LlmError::NotRunning
        })?;

        info!("✅ Backend and model are ready for processing");

        // Build the prompt from messages
        info!("🔨 Building prompt from {} messages", request.messages.len());
        let mut prompt = String::new();
        for (i, message) in request.messages.iter().enumerate() {
            let formatted_message = match message.role.as_str() {
                "system" => format!("<|im_start|>system\n{}<|im_end|>\n", message.content),
                "user" => format!("<|im_start|>user\n{}<|im_end|>\n", message.content),
                "assistant" => format!("<|im_start|>assistant\n{}<|im_end|>\n", message.content),
                _ => {
                    warn!("⚠️ Unknown message role '{}', treating as user", message.role);
                    format!("<|im_start|>user\n{}<|im_end|>\n", message.content)
                }
            };
            debug!("🔧 Formatted message {}: {} chars", i + 1, formatted_message.len());
            prompt.push_str(&formatted_message);
        }
        prompt.push_str("<|im_start|>assistant\n");

        info!("📄 Final prompt built: {} total characters", prompt.len());
        debug!("📋 Complete prompt: '{}'", prompt);

        // Tokenize the prompt
        info!("🔤 Tokenizing prompt...");
        let tokenize_start = Instant::now();
        let tokens_list = model
            .str_to_token(&prompt, AddBos::Always)
            .map_err(|e| {
                error!("❌ Failed to tokenize prompt: {}", e);
                LlmError::LlamaCppError(format!("Failed to tokenize prompt: {}", e))
            })?;

        let tokenize_duration = tokenize_start.elapsed();
        let max_tokens = request.max_tokens.unwrap_or(self.config.max_tokens);
        let prompt_tokens_len = tokens_list.len();
        let n_len = prompt_tokens_len as i32 + max_tokens;

        info!("✅ Tokenization complete: {} prompt tokens in {:?}", prompt_tokens_len, tokenize_duration);
        debug!("🎯 Generation parameters: max_tokens={}, total_limit={}", max_tokens, n_len);

        // Create a batch for processing
        info!("📦 Creating token batch for processing...");
        let mut batch = LlamaBatch::new(512, 1);
        let last_index = prompt_tokens_len as i32 - 1;

        for (i, token) in (0_i32..).zip(tokens_list.into_iter()) {
            let is_last = i == last_index;
            batch.add(token, i, &[0], is_last)
                .map_err(|e| {
                    error!("❌ Failed to add token {} to batch: {}", i, e);
                    LlmError::LlamaCppError(format!("Failed to add token to batch: {}", e))
                })?;
        }

        debug!("✅ Batch created with {} tokens", batch.n_tokens());

        // Create a context for this request
        info!("🧠 Creating context for inference...");
        let context_start = Instant::now();
        let mut ctx_params = LlamaContextParams::default()
            .with_n_ctx(Some(std::num::NonZeroU32::new(self.config.ctx_size).unwrap()));

        if let Some(threads) = self.config.n_threads {
            debug!("🔧 Using {} threads for processing", threads);
            ctx_params = ctx_params.with_n_threads(threads);
        } else {
            debug!("🔧 Using default thread count");
        }

        let mut context = model
            .new_context(backend, ctx_params)
            .map_err(|e| {
                error!("❌ Failed to create context: {}", e);
                LlmError::LlamaCppError(format!("Failed to create context: {}", e))
            })?;

        let context_duration = context_start.elapsed();
        info!("✅ Context created successfully in {:?}", context_duration);

        // Process the prompt
        info!("⚡ Processing prompt through model...");
        let decode_start = Instant::now();
        context.decode(&mut batch)
            .map_err(|e| {
                error!("❌ Failed to decode prompt: {}", e);
                LlmError::LlamaCppError(format!("Failed to decode prompt: {}", e))
            })?;

        let decode_duration = decode_start.elapsed();
        info!("✅ Prompt processed in {:?}", decode_duration);

        let mut n_cur = batch.n_tokens();
        let initial_tokens = n_cur;
        let mut response_content = String::new();
        let mut decoder = UTF_8.new_decoder();
        let mut sampler = LlamaSampler::greedy();
        let generation_start = Instant::now();

        info!("🎯 Starting token generation (max {} tokens)...", max_tokens);
        debug!("📊 Initial state: n_cur={}, initial_tokens={}, target_length={}", n_cur, initial_tokens, n_len);

        // Generate response tokens
        let mut tokens_generated = 0;
        while n_cur <= n_len {
            let token = sampler.sample(&context, batch.n_tokens() - 1);
            sampler.accept(token);

            // Check for end of generation
            if model.is_eog_token(token) {
                info!("🏁 End of generation token encountered at position {}", n_cur);
                break;
            }

            // Convert token to text
            let output_bytes = model.token_to_bytes(token, Special::Tokenize)
                .map_err(|e| {
                    error!("❌ Failed to convert token {} to bytes: {}", token, e);
                    LlmError::LlamaCppError(format!("Failed to convert token to bytes: {}", e))
                })?;

            let mut output_string = String::with_capacity(32);
            let _decode_result = decoder.decode_to_string(&output_bytes, &mut output_string, false);
            response_content.push_str(&output_string);

            tokens_generated += 1;

            // Log progress every 10 tokens or for first few tokens
            if tokens_generated <= 5 || tokens_generated % 10 == 0 {
                debug!("🔄 Token {}: '{}' (total response length: {} chars)",
                    tokens_generated,
                    output_string.replace('\n', "\\n"),
                    response_content.len()
                );
            }

            // Prepare for next iteration
            batch.clear();
            batch.add(token, n_cur, &[0], true)
                .map_err(|e| {
                    error!("❌ Failed to add token {} to batch at position {}: {}", token, n_cur, e);
                    LlmError::LlamaCppError(format!("Failed to add token to batch: {}", e))
                })?;

            n_cur += 1;

            // Decode the next token
            context.decode(&mut batch)
                .map_err(|e| {
                    error!("❌ Failed to decode token at position {}: {}", n_cur, e);
                    LlmError::LlamaCppError(format!("Failed to decode token: {}", e))
                })?;
        }

        let generation_duration = generation_start.elapsed();
        let completion_tokens = n_cur - initial_tokens;

        info!("✅ Token generation complete: {} tokens in {:?} ({:.2} tokens/sec)",
            completion_tokens,
            generation_duration,
            completion_tokens as f64 / generation_duration.as_secs_f64()
        );

        // Build the response
        info!("📦 Building chat response...");
        let total_duration = start_time.elapsed();
        let prompt_tokens = prompt_tokens_len as u32;
        let completion_tokens = (n_cur - initial_tokens) as u32;
        let total_tokens = n_cur as u32;

        // Log response statistics
        info!("📊 Response statistics:");
        info!("   • Prompt tokens: {}", prompt_tokens);
        info!("   • Completion tokens: {}", completion_tokens);
        info!("   • Total tokens: {}", total_tokens);
        info!("   • Response length: {} characters", response_content.len());
        info!("   • Total processing time: {:?}", total_duration);

        // Log the complete response content
        info!("💬 Generated response content:");
        debug!("📝 Full response: '{}'", response_content);

        let chat_response = ChatResponse {
            id: "chat-completion".to_string(),
            object: "chat.completion".to_string(),
            created: chrono::Utc::now().timestamp() as u64,
            model: self.config.model_name.clone(),
            choices: vec![ChatChoice {
                index: 0,
                message: ChatMessage {
                    role: "assistant".to_string(),
                    content: response_content.clone(),
                },
                finish_reason: Some("stop".to_string()),
            }],
            usage: Some(ChatUsage {
                prompt_tokens,
                completion_tokens,
                total_tokens,
            }),
        };

        info!("🎉 Chat completion successful! Returning response to frontend");
        debug!("📋 Complete response structure: {:?}", chat_response);

        Ok(chat_response)
    }

    pub async fn list_models(&self) -> Result<ModelsResponse, LlmError> {
        info!("📋 Listing available models...");
        let models = self.scan_available_models();

        info!("✅ Found {} available models", models.len());
        for (i, model) in models.iter().enumerate() {
            debug!("📄 Model {}: {} ({})", i + 1, model.id, model.owned_by);
        }

        Ok(ModelsResponse {
            object: "list".to_string(),
            data: models,
        })
    }
}


