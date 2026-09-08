
const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let backendProcess = null

// ======================================================
// INICIAR BACKEND
// ======================================================
function startBackend() {
  // En desarrollo el backend ya se inicia con npm run dev
  if (!app.isPackaged) {
    console.log('[BACKEND] Modo desarrollo: backend iniciado externamente')
    return
  }

  const backendPath = path.join(
    process.resourcesPath,
    'backend',
    'index.js'
  )

  console.log('[BACKEND] Iniciando backend...')
  console.log('[BACKEND] Ruta:', backendPath)

  backendProcess = spawn(
    process.execPath,
    [backendPath],
    {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: '5000',
      },
      cwd: path.dirname(backendPath),
      stdio: 'pipe',
    }
  )

  backendProcess.stdout.on('data', (data) => {
    console.log(`[BACKEND] ${data.toString()}`)
  })

  backendProcess.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR] ${data.toString()}`)
  })

  backendProcess.on('error', (error) => {
    console.error('[BACKEND] Error al iniciar:', error)
  })

  backendProcess.on('exit', (code, signal) => {
    console.log(
      `[BACKEND] Proceso terminado. Código: ${code}, Señal: ${signal}`
    )

    backendProcess = null
  })
}


// ======================================================
// ESPERAR A QUE EL BACKEND ESTÉ DISPONIBLE
// ======================================================
function waitForBackend() {
  return new Promise((resolve) => {
    const http = require('http')

    const check = () => {
      const request = http.get(
        'http://127.0.0.1:5000',
        (response) => {
          console.log('[BACKEND] Backend disponible')
          response.resume()
          resolve()
        }
      )

      request.on('error', () => {
        setTimeout(check, 300)
      })

      request.setTimeout(1000, () => {
        request.destroy()
        setTimeout(check, 300)
      })
    }

    check()
  })
}


// ======================================================
// CREAR VENTANA
// ======================================================
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Mantener ventana maximizada
  win.maximize()

  if (app.isPackaged) {
    // Aplicación empaquetada
    win.loadFile(
      path.join(__dirname, '../dist/index.html')
    )
  } else {
    // Desarrollo
    win.loadURL('http://127.0.0.1:8080')
  }
}


// ======================================================
// INICIO DE ELECTRON
// ======================================================
app.whenReady().then(async () => {

  // Solo iniciar backend automáticamente
  // cuando estamos en la versión empaquetada
  if (app.isPackaged) {
    startBackend()

    // Esperar hasta que Express esté disponible
    await waitForBackend()
  }

  // Crear ventana
  createWindow()

  // macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})


// ======================================================
// CERRAR BACKEND AL CERRAR LA APLICACIÓN
// ======================================================
app.on('window-all-closed', () => {

  if (backendProcess) {
    console.log('[BACKEND] Cerrando backend...')

    backendProcess.kill()
    backendProcess = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})


// ======================================================
// SEGURIDAD EXTRA:
// Cerrar backend cuando Electron termina
// ======================================================
app.on('before-quit', () => {

  if (backendProcess) {
    console.log('[BACKEND] Cerrando backend...')

    backendProcess.kill()
    backendProcess = null
  }
})
