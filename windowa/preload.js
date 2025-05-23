const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Funciones para interactuar con el proceso principal (main.js)
  startScan: () => ipcRenderer.invoke('ble-start-scan'),
  stopScan: () => ipcRenderer.invoke('ble-stop-scan'),
  connectToDevice: (deviceId) => ipcRenderer.invoke('ble-connect-device', deviceId),
  bleDisconnectDevice: (deviceId) => ipcRenderer.invoke('ble-disconnect-device', deviceId),
  // Más funciones si son necesarias (ej. disconnect, writeCharacteristic)

  // Funciones para suscribirse a eventos desde el proceso principal
  onDeviceFound: (callback) => {
    const listener = (_event, device) => callback(device);
    ipcRenderer.on('ble-device-found', listener);
    return () => ipcRenderer.removeListener('ble-device-found', listener); // Para limpiar
  },
  onDeviceConnected: (callback) => {
    const listener = (_event, device) => callback(device);
    ipcRenderer.on('ble-device-connected', listener);
    return () => ipcRenderer.removeListener('ble-device-connected', listener);
  },
  onDeviceDisconnected: (callback) => {
    const listener = (_event, deviceId) => callback(deviceId);
    ipcRenderer.on('ble-device-disconnected', listener);
    return () => ipcRenderer.removeListener('ble-device-disconnected', listener);
  },
  onHeartRateUpdate: (callback) => {
    const listener = (_event, heartRate) => callback(heartRate);
    ipcRenderer.on('ble-hr-update', listener);
    return () => ipcRenderer.removeListener('ble-hr-update', listener);
  },
  onRawDataUpdate: (callback) => {
    const listener = (event, rawData) => callback(rawData);
    ipcRenderer.on('ble-raw-data-update', listener);
    return () => ipcRenderer.removeListener('ble-raw-data-update', listener);
  },
  // Función para remover todos los listeners de un canal (útil al desmontar componentes en frameworks)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  onBLEDevice: (callback) => ipcRenderer.on('ble-device', (event, data) => callback(data)),
});

console.log('Preload script cargado y electronAPI expuesta.'); 