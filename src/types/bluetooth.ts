export interface BluetoothDevice {
  id: string;
  name?: string;
  address: string;
  rssi?: number;
  is_connectable: boolean;
  services: string[];
}

export interface ScanResult {
  success: boolean;
  message: string;
  devices: BluetoothDevice[];
}

export interface BluetoothError {
  error_type: string;
  message: string;
}

export interface BluetoothScannerState {
  isScanning: boolean;
  devices: BluetoothDevice[];
  error?: string;
  isInitialized: boolean;
}
