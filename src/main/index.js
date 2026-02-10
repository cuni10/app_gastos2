import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog, protocol, net } from 'electron'
import { join } from 'path'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/logo.ico?asset'

import dbManager from './db'

// Función auxiliar para obtener el directorio de adjuntos
const getAttachmentsDir = () => {
  const isPortable = process.env.PORTABLE_EXECUTABLE_DIR
  const base = isPortable
    ? process.env.PORTABLE_EXECUTABLE_DIR
    : path.join(app.getAppPath(), 'src', 'db')
  const dir = path.join(base, 'attachments')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

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

  // Registrar protocolo 'attachments' para carga rápida (streaming)
  protocol.handle('attachments', (request) => {
    const url = request.url.replace('attachments://', '')
    const filename = decodeURIComponent(url)
    const filePath = path.join(getAttachmentsDir(), filename)
    // Convertir a URL de archivo válida para fetch (Windows separators fix)
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/')
    return net.fetch(fileUrl)
  })

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

  //Para resetear la base de datos en desarrollo
  //dbManager.resetDB()

  ipcMain.handle('db:del-historial', (event, id) => {
    return dbManager.delHistorial(id)
  })
  ipcMain.handle('db:get-historial', () => {
    return dbManager.getHistorial()
  })
  ipcMain.handle('db:get-historial-mes', async (event, { mes, anio }) => {
    try {
      const resultados = dbManager.gethistorialMes(mes, anio)
      return resultados
    } catch (error) {
      console.error('Error en query de historial mensual', error)
      return []
    }
  })
  ipcMain.handle('db:get-historial-seis-meses', () => {
    return dbManager.getHistorialSeisMeses()
  })
  ipcMain.handle('db:get-gastos', (event, filters) => {
    return dbManager.getGastos(filters)
  })
  ipcMain.handle('db:get-categorias', () => {
    return dbManager.getCategorias()
  })
  ipcMain.handle('db:insert-categoria', (event, categoria) => {
    const { nombre, descripcion } = categoria
    dbManager.insertCategoria(nombre, descripcion)
  })

  ipcMain.handle('db:insert-gasto', (event, gasto) => {
    try {
      const { nombre, monto, estado, fecha_cobro, nota, cuotas, cuotas_pagadas, categoria_id } =
        gasto
      const id = dbManager.insertGastoConHistorial(
        nombre,
        monto,
        estado,
        fecha_cobro,
        nota,
        cuotas,
        cuotas_pagadas,
        categoria_id
      )
      return { success: true, id }
    } catch (error) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle('db:sincronizar-pagos-pendientes', () => {
    return dbManager.sincronizarPagosPendientes()
  })

  // Adjuntos handlers - upload logic remains, getAttachmentsDir hoisted
  
  ipcMain.handle('dialog:upload-adjunto', async (event, historialId) => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win, {
      title: 'Seleccionar archivo adjunto',
      filters: [
        { name: 'Imágenes y PDF', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    try {
      const filePath = result.filePaths[0]
      const ext = path.extname(filePath).toLowerCase()
      const nombreOriginal = path.basename(filePath)
      const nombreArchivo = crypto.randomUUID() + ext
      const tipo = ext === '.pdf' ? 'pdf' : 'image'
      const destDir = getAttachmentsDir()
      const destPath = path.join(destDir, nombreArchivo)

      fs.copyFileSync(filePath, destPath)
      dbManager.insertAdjunto(historialId, nombreOriginal, nombreArchivo, tipo)

      return { success: true, nombreOriginal, tipo }
    } catch (error) {
      console.error('Error al subir adjunto:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:get-adjuntos', (event, historialId) => {
    return dbManager.getAdjuntos(historialId)
  })

  ipcMain.handle('db:del-adjunto', (event, id) => {
    try {
      const adjunto = dbManager.delAdjunto(id)
      if (adjunto) {
        const filePath = path.join(getAttachmentsDir(), adjunto.nombre_archivo)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar adjunto:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('file:get-attachment-path', (event, filename) => {
    // Retorna URL del protocolo personalizado en lugar de base64
    // Esto habilita el streaming directo del archivo (carga instantánea)
    return `attachments://${filename}`
  })

  // Nuevo handler para imprimir usando el sistema operativo (abre el archivo)
  ipcMain.handle('file:open-external', async (event, filename) => {
    const filePath = path.join(getAttachmentsDir(), filename)
    await shell.openPath(filePath)
    return { success: true }
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
