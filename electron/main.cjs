const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { autoUpdater } = require('electron-updater')

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
// ACTUALIZACIONES
// ======================================================
function setupAutoUpdater() {

  // Nunca buscar actualizaciones durante desarrollo
  if (!app.isPackaged) {
    console.log('[UPDATE] Modo desarrollo: actualizaciones desactivadas')
    return
  }

  console.log('[UPDATE] Buscando actualizaciones...')

  // ----------------------------------------------------
  // Hay una actualización disponible
  // ----------------------------------------------------
  autoUpdater.on('update-available', (info) => {
    console.log(
      `[UPDATE] Nueva versión disponible: ${info.version}`
    )
  })


  // ----------------------------------------------------
  // No hay actualización
  // ----------------------------------------------------
  autoUpdater.on('update-not-available', () => {
    console.log('[UPDATE] FarmMedicus ya está actualizado')
  })


  // ----------------------------------------------------
  // Error
  // ----------------------------------------------------
  autoUpdater.on('error', (error) => {
    console.error('[UPDATE] Error al actualizar:', error)
  })


  // ----------------------------------------------------
  // Actualización descargada
  // ----------------------------------------------------
  autoUpdater.on('update-downloaded', async (info) => {

    console.log(
      `[UPDATE] Actualización descargada: ${info.version}`
    )

    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Actualización disponible',
      message: `FarmMedicus ${info.version} está listo para instalar.`,
      detail:
        'La aplicación debe reiniciarse para completar la actualización.',
      buttons: [
        'Reiniciar ahora',
        'Más tarde'
      ],
      defaultId: 0,
      cancelId: 1
    })

    if (result.response === 0) {

      console.log('[UPDATE] Reiniciando para instalar...')

      autoUpdater.quitAndInstall(
        false,
        true
      )
    }
  })


  // ----------------------------------------------------
  // Iniciar búsqueda
  // ----------------------------------------------------
  autoUpdater.checkForUpdates()
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
    win.loadURL(
      'http://127.0.0.1:8080'
    )
  }
}


// ======================================================
// INICIO DE ELECTRON
// ======================================================
app.whenReady().then(async () => {

  // ----------------------------------------------------
  // PRODUCCIÓN
  // ----------------------------------------------------
  if (app.isPackaged) {

    // Iniciar backend
    startBackend()

    // Esperar hasta que Express esté disponible
    await waitForBackend()
  }


  // ----------------------------------------------------
  // Crear ventana
  // ----------------------------------------------------
  createWindow()


  // ----------------------------------------------------
  // Buscar actualizaciones
  // ----------------------------------------------------
  if (app.isPackaged) {
    setupAutoUpdater()
  }


  // ----------------------------------------------------
  // macOS
  // ----------------------------------------------------
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
// CERRAR BACKEND CUANDO ELECTRON TERMINA
// ======================================================
app.on('before-quit', () => {

  if (backendProcess) {

    console.log('[BACKEND] Cerrando backend...')

    backendProcess.kill()

    backendProcess = null
  }
})