use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use btleplug::api::{Central, Manager as _, Peripheral as _, ScanFilter};
use btleplug::platform::{Adapter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BluetoothDevice {
    pub id: String,
    pub name: Option<String>,
    pub address: String,
    pub rssi: Option<i16>,
    pub is_connectable: bool,
    pub services: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub success: bool,
    pub message: String,
    pub devices: Vec<BluetoothDevice>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BluetoothError {
    pub error_type: String,
    pub message: String,
}

impl From<btleplug::Error> for BluetoothError {
    fn from(error: btleplug::Error) -> Self {
        let (error_type, message) = match error {
            btleplug::Error::PermissionDenied => (
                "PermissionDenied".to_string(),
                "Bluetooth permission denied. Please grant Bluetooth permissions to the application.".to_string(),
            ),
            btleplug::Error::NotSupported(_) => (
                "NotSupported".to_string(),
                "Bluetooth Low Energy is not supported on this device.".to_string(),
            ),
            btleplug::Error::DeviceNotFound => (
                "DeviceNotFound".to_string(),
                "Bluetooth adapter not found. Please ensure Bluetooth is enabled.".to_string(),
            ),
            _ => (
                "BluetoothError".to_string(),
                format!("Bluetooth operation failed: {error}"),
            ),
        };

        BluetoothError { error_type, message }
    }
}

pub struct BluetoothScanner {
    adapter: Option<Adapter>,
    discovered_devices: Arc<Mutex<HashMap<String, BluetoothDevice>>>,
    is_scanning: Arc<Mutex<bool>>,
}

impl BluetoothScanner {
    pub fn new() -> Self {
        Self {
            adapter: None,
            discovered_devices: Arc::new(Mutex::new(HashMap::new())),
            is_scanning: Arc::new(Mutex::new(false)),
        }
    }

    pub async fn initialize(&mut self) -> Result<(), BluetoothError> {
        let manager = Manager::new().await?;
        let adapters = manager.adapters().await?;

        if adapters.is_empty() {
            return Err(BluetoothError {
                error_type: "NoAdapter".to_string(),
                message: "No Bluetooth adapters found".to_string(),
            });
        }

        self.adapter = Some(adapters.into_iter().next().unwrap());
        Ok(())
    }

    pub async fn start_scan(&self) -> Result<String, BluetoothError> {
        let mut is_scanning = self.is_scanning.lock().await;
        if *is_scanning {
            return Ok("Scan already in progress".to_string());
        }

        let adapter = self.adapter.as_ref().ok_or_else(|| BluetoothError {
            error_type: "NotInitialized".to_string(),
            message: "Bluetooth adapter not initialized".to_string(),
        })?;

        adapter.start_scan(ScanFilter::default()).await?;
        *is_scanning = true;

        // Start background task to collect devices
        let adapter_clone = adapter.clone();
        let devices_map = Arc::clone(&self.discovered_devices);
        let scanning_flag = Arc::clone(&self.is_scanning);

        tokio::spawn(async move {
            while *scanning_flag.lock().await {
                let peripherals = adapter_clone.peripherals().await.unwrap_or_default();
                let mut devices = devices_map.lock().await;

                for peripheral in peripherals {
                    let properties = peripheral.properties().await.unwrap_or_default();
                    if let Some(props) = properties {
                        let device_id = peripheral.id().to_string();
                        let device = BluetoothDevice {
                            id: device_id.clone(),
                            name: props.local_name,
                            address: props.address.to_string(),
                            rssi: props.rssi,
                            is_connectable: true, // Assume connectable for BLE devices
                            services: props.services.iter().map(|s| s.to_string()).collect(),
                        };
                        devices.insert(device_id, device);
                    }
                }

                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
            }
        });

        Ok("Bluetooth scan started successfully".to_string())
    }

    pub async fn stop_scan(&self) -> Result<String, BluetoothError> {
        let mut is_scanning = self.is_scanning.lock().await;
        if !*is_scanning {
            return Ok("No scan in progress".to_string());
        }

        let adapter = self.adapter.as_ref().ok_or_else(|| BluetoothError {
            error_type: "NotInitialized".to_string(),
            message: "Bluetooth adapter not initialized".to_string(),
        })?;

        adapter.stop_scan().await?;
        *is_scanning = false;

        Ok("Bluetooth scan stopped successfully".to_string())
    }

    pub async fn get_discovered_devices(&self) -> Vec<BluetoothDevice> {
        let devices = self.discovered_devices.lock().await;
        devices.values().cloned().collect()
    }

    pub async fn is_scanning(&self) -> bool {
        *self.is_scanning.lock().await
    }

    pub async fn clear_devices(&self) {
        let mut devices = self.discovered_devices.lock().await;
        devices.clear();
    }
}
