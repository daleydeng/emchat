import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { BluetoothDevice, BluetoothScannerState } from '../types/bluetooth';
import './BluetoothScanner.css';

const BluetoothScanner: React.FC = () => {
  const [state, setState] = useState<BluetoothScannerState>({
    isScanning: false,
    devices: [],
    isInitialized: false,
  });

  const [statusMessage, setStatusMessage] = useState<string>('');

  const initializeBluetooth = useCallback(async () => {
    try {
      const message = await invoke<string>('initialize_bluetooth');
      setState(prev => ({ ...prev, isInitialized: true }));
      setStatusMessage(message);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      setStatusMessage(`Initialization failed: ${error.message}`);
    }
  }, []);

  const startScan = useCallback(async () => {
    try {
      const message = await invoke<string>('start_bluetooth_scan');
      setState(prev => ({ ...prev, isScanning: true, error: undefined }));
      setStatusMessage(message);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      setStatusMessage(`Scan failed: ${error.message}`);
    }
  }, []);

  const stopScan = useCallback(async () => {
    try {
      const message = await invoke<string>('stop_bluetooth_scan');
      setState(prev => ({ ...prev, isScanning: false }));
      setStatusMessage(message);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      setStatusMessage(`Stop scan failed: ${error.message}`);
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await invoke<BluetoothDevice[]>('get_bluetooth_devices');
      setState(prev => ({ ...prev, devices }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, []);

  const clearDevices = useCallback(async () => {
    try {
      const message = await invoke<string>('clear_bluetooth_devices');
      setState(prev => ({ ...prev, devices: [] }));
      setStatusMessage(message);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      setStatusMessage(`Clear failed: ${error.message}`);
    }
  }, []);

  const checkScanningStatus = useCallback(async () => {
    try {
      const isScanning = await invoke<boolean>('is_bluetooth_scanning');
      setState(prev => ({ ...prev, isScanning }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, []);

  useEffect(() => {
    initializeBluetooth();
  }, [initializeBluetooth]);

  useEffect(() => {
    let interval: number;

    if (state.isScanning) {
      interval = setInterval(() => {
        refreshDevices();
        checkScanningStatus();
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isScanning, refreshDevices, checkScanningStatus]);

  const formatRSSI = (rssi?: number): string => {
    if (rssi === undefined || rssi === null) return 'N/A';
    return `${rssi} dBm`;
  };

  const getSignalStrength = (rssi?: number): string => {
    if (rssi === undefined || rssi === null) return 'unknown';
    if (rssi >= -50) return 'excellent';
    if (rssi >= -60) return 'good';
    if (rssi >= -70) return 'fair';
    return 'poor';
  };

  return (
    <div className="bluetooth-scanner">
      <div className="scanner-header">
        <h1>Bluetooth Low Energy Scanner</h1>
        <div className="status-indicator">
          <span className={`status-dot ${state.isInitialized ? 'initialized' : 'not-initialized'}`}></span>
          <span>Bluetooth {state.isInitialized ? 'Ready' : 'Not Ready'}</span>
        </div>
      </div>

      <div className="scanner-controls">
        <button
          onClick={startScan}
          disabled={!state.isInitialized || state.isScanning}
          className="btn btn-primary"
        >
          {state.isScanning ? 'Scanning...' : 'Start Scan'}
        </button>

        <button
          onClick={stopScan}
          disabled={!state.isScanning}
          className="btn btn-secondary"
        >
          Stop Scan
        </button>

        <button
          onClick={refreshDevices}
          disabled={!state.isInitialized}
          className="btn btn-tertiary"
        >
          Refresh
        </button>

        <button
          onClick={clearDevices}
          disabled={!state.isInitialized}
          className="btn btn-danger"
        >
          Clear
        </button>
      </div>

      {statusMessage && (
        <div className="status-message">
          {statusMessage}
        </div>
      )}

      {state.error && (
        <div className="error-message">
          Error: {state.error}
        </div>
      )}

      <div className="devices-section">
        <h2>Discovered Devices ({state.devices.length})</h2>

        {state.devices.length === 0 ? (
          <div className="no-devices">
            {state.isScanning ? 'Scanning for devices...' : 'No devices found. Start a scan to discover BLE devices.'}
          </div>
        ) : (
          <div className="devices-list">
            {state.devices.map((device) => (
              <div key={device.id} className="device-card">
                <div className="device-header">
                  <h3 className="device-name">
                    {device.name || 'Unknown Device'}
                  </h3>
                  <span className={`signal-strength ${getSignalStrength(device.rssi)}`}>
                    {formatRSSI(device.rssi)}
                  </span>
                </div>

                <div className="device-details">
                  <div className="device-info">
                    <span className="label">Address:</span>
                    <span className="value">{device.address}</span>
                  </div>

                  <div className="device-info">
                    <span className="label">Connectable:</span>
                    <span className={`value ${device.is_connectable ? 'yes' : 'no'}`}>
                      {device.is_connectable ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {device.services.length > 0 && (
                    <div className="device-info">
                      <span className="label">Services:</span>
                      <div className="services-list">
                        {device.services.slice(0, 3).map((service, index) => (
                          <span key={index} className="service-uuid">
                            {service}
                          </span>
                        ))}
                        {device.services.length > 3 && (
                          <span className="service-more">
                            +{device.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BluetoothScanner;
