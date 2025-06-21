mod bluetooth;
mod llm;
#[cfg(test)]
mod tests;

use bluetooth::{BluetoothScanner, BluetoothDevice, BluetoothError};
use llm::{LlmService, LlmConfig, LlmError, ChatRequest, ChatResponse, ModelsResponse, LlmServiceStatus};
use tokio::sync::Mutex;
use tauri::State;

type BluetoothState = std::sync::Arc<tokio::sync::Mutex<BluetoothScanner>>;

#[tauri::command]
async fn initialize_bluetooth(scanner: State<'_, BluetoothState>) -> Result<String, BluetoothError> {
    let mut scanner = scanner.lock().await;
    scanner.initialize().await?;
    Ok("Bluetooth initialized successfully".to_string())
}

#[tauri::command]
async fn start_bluetooth_scan(scanner: State<'_, BluetoothState>) -> Result<String, BluetoothError> {
    let scanner = scanner.lock().await;
    scanner.start_scan().await
}

#[tauri::command]
async fn stop_bluetooth_scan(scanner: State<'_, BluetoothState>) -> Result<String, BluetoothError> {
    let scanner = scanner.lock().await;
    scanner.stop_scan().await
}

#[tauri::command]
async fn get_bluetooth_devices(scanner: State<'_, BluetoothState>) -> Result<Vec<BluetoothDevice>, BluetoothError> {
    let scanner = scanner.lock().await;
    Ok(scanner.get_discovered_devices().await)
}

#[tauri::command]
async fn is_bluetooth_scanning(scanner: State<'_, BluetoothState>) -> Result<bool, BluetoothError> {
    let scanner = scanner.lock().await;
    Ok(scanner.is_scanning().await)
}

#[tauri::command]
async fn clear_bluetooth_devices(scanner: State<'_, BluetoothState>) -> Result<String, BluetoothError> {
    let scanner = scanner.lock().await;
    scanner.clear_devices().await;
    Ok("Device list cleared".to_string())
}

// LLM Commands
#[tauri::command]
async fn initialize_llm(llm_service: State<'_, Mutex<LlmService>>, config: LlmConfig) -> Result<String, LlmError> {
    let mut service = llm_service.lock().await;
    *service = LlmService::new(config);
    Ok("LLM service initialized successfully".to_string())
}

#[tauri::command]
async fn start_llm_service(llm_service: State<'_, Mutex<LlmService>>) -> Result<String, LlmError> {
    let mut service = llm_service.lock().await;
    service.start().await
}

#[tauri::command]
async fn stop_llm_service(llm_service: State<'_, Mutex<LlmService>>) -> Result<String, LlmError> {
    let mut service = llm_service.lock().await;
    service.stop().await
}

#[tauri::command]
async fn get_llm_status(llm_service: State<'_, Mutex<LlmService>>) -> Result<LlmServiceStatus, LlmError> {
    let service = llm_service.lock().await;
    Ok(service.get_status())
}

#[tauri::command]
async fn chat_with_llm(llm_service: State<'_, Mutex<LlmService>>, request: ChatRequest) -> Result<ChatResponse, LlmError> {
    let service = llm_service.lock().await;
    service.chat_completion(request).await
}

#[tauri::command]
async fn list_llm_models(llm_service: State<'_, Mutex<LlmService>>) -> Result<ModelsResponse, LlmError> {
    let service = llm_service.lock().await;
    service.list_models().await
}

#[tauri::command]
async fn check_llm_health(llm_service: State<'_, Mutex<LlmService>>) -> Result<String, LlmError> {
    let service = llm_service.lock().await;
    service.check_llm_health().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .filter_module("tauri_app", log::LevelFilter::Debug)
        .init();

    log::info!("🚀 Starting Tauri application with LLM and Bluetooth support");

    let bluetooth_scanner = std::sync::Arc::new(tokio::sync::Mutex::new(BluetoothScanner::new()));
    let llm_service = Mutex::new(LlmService::new(LlmConfig::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(bluetooth_scanner)
        .manage(llm_service)
        .invoke_handler(tauri::generate_handler![
            initialize_bluetooth,
            start_bluetooth_scan,
            stop_bluetooth_scan,
            get_bluetooth_devices,
            is_bluetooth_scanning,
            clear_bluetooth_devices,
            initialize_llm,
            start_llm_service,
            stop_llm_service,
            get_llm_status,
            chat_with_llm,
            list_llm_models,
            check_llm_health
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
