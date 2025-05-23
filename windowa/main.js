const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const noble = require('@abandonware/noble');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('dist/index.html');
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Escaneo BLE real
ipcMain.handle('ble-start-scan', async () => {
  console.log('Iniciando escaneo BLE...');
  noble.on('stateChange', async (state) => {
    console.log('Estado del adaptador BLE:', state);
    if (state === 'poweredOn') {
      console.log('Bluetooth encendido, comenzando escaneo...');
      noble.startScanning([], true);
      console.log('Escaneo iniciado');
    } else {
      noble.stopScanning();
      console.log('Bluetooth apagado o no disponible');
    }
  });

  noble.on('discover', (peripheral) => {
    console.log('Dispositivo encontrado:');
    console.log('  Nombre:', peripheral.advertisement.localName);
    console.log('  ID:', peripheral.id);
    console.log('  RSSI:', peripheral.rssi);
    if (peripheral.advertisement && peripheral.advertisement.localName) {
      mainWindow.webContents.send('ble-device-found', {
        id: peripheral.id,
        name: peripheral.advertisement.localName
      });
    }
  });

  // Si el adaptador ya está encendido, inicia el escaneo directamente
  if (noble.state === 'poweredOn') {
    noble.startScanning([], true);
    console.log('Escaneo iniciado (adaptador ya encendido)');
  }

  return { success: true };
});

ipcMain.handle('ble-stop-scan', async () => {
  noble.stopScanning();
  return { success: true };
});

// Conexión y suscripción a Heart Rate
ipcMain.handle('ble-connect-device', async (event, deviceId) => {
  const peripheral = noble._peripherals[deviceId];
  if (!peripheral) return { success: false, error: 'Dispositivo no encontrado' };

  console.log(`Intentando conectar a: ${peripheral.id}`);

  peripheral.connect((err) => {
    if (err) {
      console.error(`Error al conectar a ${deviceId}:`, err);
      mainWindow.webContents.send('ble-device-disconnected', deviceId);
      return;
    }
    console.log(`Conectado a ${deviceId}`);
    noble.stopScanning();
    console.log('Escaneo detenido automáticamente después de la conexión.');

    mainWindow.webContents.send('ble-device-connected', {
      id: deviceId,
      name: peripheral.advertisement.localName
    });

    peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
      if (err) {
        console.error(`Error al descubrir servicios/características para ${deviceId}:`, err);
        return;
      }

      console.log(`Servicios y características descubiertos para ${deviceId}`);

      characteristics.forEach((char) => {
        console.log('  Característica UUID:', char.uuid, 'Propiedades:', char.properties.join(', '));

        if (char.properties.includes('notify') || char.properties.includes('indicate')) {
          console.log(`  Suscribiendo a característica: ${char.uuid}`);
          char.subscribe((err) => {
            if (err) {
              console.error(`Error al suscribir a ${char.uuid} para ${deviceId}:`, err);
            } else {
              console.log(`  Suscrito exitosamente a: ${char.uuid}`);
            }
          });

          char.on('data', (data, isNotification) => {
            const rawDataString = data.toString('hex');
            console.log(`Datos recibidos de ${char.uuid} (${isNotification ? 'notificación' : 'indicación'}): ${rawDataString}`);
            mainWindow.webContents.send('ble-raw-data-update', {
              deviceId: peripheral.id,
              characteristicId: char.uuid,
              data: rawDataString,
              timestamp: new Date().toLocaleTimeString()
            });

            // Lógica específica para Heart Rate (si es la característica de HR)
            if (char.uuid === '2a37') { // UUID de Heart Rate Measurement
              let hr = 0;
              if (data.length > 1) {
                // El primer byte (Flags) indica el formato del valor de HR
                // Bit 0: 0 para UINT8, 1 para UINT16
                if ((data[0] & 0x01) === 0) {
                  hr = data[1]; // Formato UINT8
                } else {
                  // Formato UINT16, ocupa 2 bytes (poco usual para HR típicas)
                  if (data.length >= 3) { // Asegurarse que hay suficientes bytes
                    hr = data.readUInt16LE(1);
                  } else {
                    console.warn("Datos de HR en formato UINT16 pero longitud insuficiente.");
                  }
                }
              } else if (data.length === 1) {
                 // A veces algunos dispositivos envían solo el valor UINT8 directamente
                 hr = data[0];
              }
              if (hr > 0) { // Solo enviar si parece un valor válido
                mainWindow.webContents.send('ble-hr-update', hr);
              }
            }
          });
        }
      });
    });
  });
  return { success: true };
});

// Considera añadir ipcMain.handle para desconexión también.

// En este archivo puedes incluir el resto del código específico del proceso principal de tu aplicación.
// También puedes ponerlos en archivos separados y requerirlos aquí.

ipcMain.handle('ble-disconnect-device', async (event, deviceId) => {
  const peripheral = noble._peripherals[deviceId];
  if (peripheral) {
    peripheral.disconnect();
  }
  return { success: true };
});

// Comunicación BLE -> Renderer
noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning([], true);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  // Envía los datos al renderer usando IPC
  const data = {
    name: peripheral.advertisement.localName,
    id: peripheral.id,
    rssi: peripheral.rssi,
  };
  // Envía a todas las ventanas
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('ble-device', data);
  });
});