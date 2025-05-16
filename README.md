# Monitor BLE Ivolution - Mac

¡Hola Seba! Aquí tienes una guía paso a paso para correr este proyecto en Mac, recibir datos de los dispositivos Ivolution (dinamómetro, balance, libre), guardar tests, exportar resultados y más.

---

## 1. Requisitos previos

- **Mac con macOS 11 o superior**
- **Node.js** (recomendado v18 o superior)
- **Git**

---

## 2. Instalar Node.js y Git

1. Descarga Node.js desde [nodejs.org](https://nodejs.org/)
2. Instala Git desde [git-scm.com](https://git-scm.com/download/mac) o usando Homebrew:
   ```sh
   brew install git
   ```

---

## 3. Clonar el repositorio

Abre la Terminal y ejecuta:

```sh
git clone <https://github.com/nahudavila12/prueba-mac.git>
cd windowa
```

(Si el proyecto está en otra carpeta, navega a ella con `cd`)

---

## 4. Instalar dependencias

```sh
npm install
```

---

## 5. Permisos de Bluetooth en Mac

- Al abrir la app por primera vez, macOS te pedirá permiso para usar Bluetooth. Dale a "Permitir".
- Si no aparece el permiso, ve a **Preferencias del Sistema > Seguridad y Privacidad > Privacidad > Bluetooth** y asegúrate de que la app esté habilitada.

---

## 6. Ejecutar la app

```sh
npm run dev
```

Esto abrirá la app en modo desarrollo. Si usas Vite/Electron, se abrirá una ventana de escritorio.

---

## 7. Uso básico

1. Selecciona el tipo de dispositivo (dinamómetro, balance, libre) en el selector.
2. Haz clic en "Escanear Dispositivos" y conecta el dispositivo BLE.
3. Inicia y finaliza tests, guarda los resultados y exporta a CSV.
4. Visualiza los datos parseados y los gráficos en la app.

---

## 8. Problemas comunes

- **No aparecen dispositivos:**
  - Asegúrate de que el Bluetooth esté activado en el Mac.
  - Verifica los permisos de Bluetooth.
  - Reinicia la app si es necesario.
- **Error de dependencias:**
  - Ejecuta `npm install` nuevamente.
- **El puerto está en uso:**
  - Cierra otras instancias de la app o procesos que usen el mismo puerto.

---

## 9. Consejos para desarrollo

- Si modificas el código, la app se recargará automáticamente en modo dev.
- Para limpiar dependencias y reinstalar:
  ```sh
  rm -rf node_modules package-lock.json
  npm install
  ```

---

## 10. Contacto

Cualquier duda, escribime por Slack o WhatsApp. ¡Éxitos Seba! 