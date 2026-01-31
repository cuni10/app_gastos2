import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/logo.ico?asset'

import dbManager from './db'

function createWindow() {
  // Parametros de la ventana principal
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 800,
    minHeight: 800,
    minWidth: 900,
    title: 'JMT Automotores',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  // Muestra la ventana cuando esté lista para evitar pantalla blanca
  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle('JMT Automotores')
    mainWindow.show()
  })

  // Abrir enlaces externos en el navegador predeterminado
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Carga el archivo index.html de la aplicación.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Establece el ID del modelo de usuario para Windows
  electronApp.setAppUserModelId('com.electron')
  //Para resetear la base de datos en desarrollo
  // dbManager.resetDB()

  // IPC para controles de ventana
  ipcMain.on('window-control', (event, action) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return

    if (action === 'minimize') win.minimize()
    if (action === 'maximize') {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
    if (action === 'close') win.close()
  })

  // IPC para operaciones de base de datos
  ipcMain.handle('db:get-historial', () => {
    return dbManager.getHistorial()
  })
  ipcMain.handle('db:get-gastos', () => {
    return dbManager.getGastos()
  })
  ipcMain.handle('db:get-categorias', () => {
    return dbManager.getCategorias()
  })
  ipcMain.handle('db:insert-categoria', (event, categoria) => {
    const { nombre, descripcion } = categoria
    dbManager.insertCategoria(nombre, descripcion)
  })

  ipcMain.handle('db:insert-gasto-con-historial', (event, gasto) => {
    try {
      const { nombre, monto, mensual, fecha_cobro, nota, cuotas, categoria_id } = gasto
      const id = dbManager.insertGastoConHistorial(
        nombre,
        monto,
        mensual,
        fecha_cobro,
        nota,
        cuotas,
        categoria_id
      )
      return { success: true, id }
    } catch (error) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })
  // Crea la ventana principal de la aplicación
  createWindow()
  // Optimiza los atajos de teclado en desarrollo
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  // Reabre la ventana si se hace clic en el icono de la aplicación en el dock (macOS)
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
// Cierra la aplicación cuando se cierran todas las ventanas, excepto en macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
