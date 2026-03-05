import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/logo.ico?asset'
import fs from 'fs'
import path from 'path'

import dbManager from './db'
import { processDocument, generateUniqueFileName, deleteFile } from './utils/compressor'

// Directorio para almacenar facturas
let facturasDir = ''

function getFacturasDir() {
  const isPortable = process.env.PORTABLE_EXECUTABLE_DIR
  const baseDir = isPortable
    ? process.env.PORTABLE_EXECUTABLE_DIR
    : path.join(app.getAppPath(), 'src', 'db')

  facturasDir = path.join(baseDir, 'facturas')

  if (!fs.existsSync(facturasDir)) {
    fs.mkdirSync(facturasDir, { recursive: true })
    console.log('Carpeta de facturas creada en:', facturasDir)
  }

  return facturasDir
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
      sandbox: false,
      contextIsolation: false,
      enableremoteModule: false,
      nodeIntegration: false
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
  // Crea la ventana principal de la aplicación
  createWindow()

  // Inicializa directorio de facturas
  getFacturasDir()

  // Establece el ID del modelo de usuario para Windows
  electronApp.setAppUserModelId('com.electron')

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
  ipcMain.handle('db:get-gastos', () => {
    return dbManager.getGastos()
  })
  ipcMain.handle('db:get-categorias', () => {
    return dbManager.getCategorias()
  })
  ipcMain.handle('db:insert-categoria', (event, categoria) => {
    const { nombre, descripcion } = categoria
    return dbManager.insertCategoria(nombre, descripcion)
  })

  ipcMain.handle('db:insert-gasto-con-historial', (event, gasto) => {
    try {
      const {
        nombre,
        monto,
        estado,
        tipo_pago,
        fecha_cobro,
        nota,
        cuotas,
        cuotas_pagadas,
        categoria_id,
        cuotaActual
      } = gasto
      const id = dbManager.insertGastoConHistorial(
        nombre,
        monto,
        estado,
        tipo_pago,
        fecha_cobro,
        nota,
        cuotas,
        cuotas_pagadas,
        categoria_id,
        cuotaActual
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

  ipcMain.handle('db:get-gasto', (event, id) => {
    return dbManager.getGasto(id)
  })

  ipcMain.handle('db:update-gasto', (event, { id, data }) => {
    return dbManager.updateGasto(id, data)
  })

  // IPC para documentos

  ipcMain.handle('docs:upload-documento', async (event, { gasto_id, filePath }) => {
    try {
      const facturasPath = getFacturasDir()
      const gastoDir = path.join(facturasPath, gasto_id.toString())

      // Procesar documento (compresión si es necesario)
      const processResult = await processDocument(
        filePath,
        gastoDir,
        generateUniqueFileName(path.basename(filePath))
      )

      if (!processResult.success) {
        return { success: false, error: processResult.error || 'Error procesando documento' }
      }

      // Guardar en BD
      const dbResult = dbManager.insertDocumento(
        gasto_id,
        path.basename(filePath),
        path.basename(processResult.filePath),
        processResult.filePath,
        processResult.fileType,
        processResult.originalSize,
        processResult.compressedSize,
        processResult.compressed ? 1 : 0
      )

      if (dbResult.success) {
        return {
          success: true,
          id: dbResult.id,
          ...processResult
        }
      } else {
        // Si falla la BD, eliminar archivo
        deleteFile(processResult.filePath)
        return { success: false, error: 'Error guardando en BD: ' + dbResult.error }
      }
    } catch (error) {
      console.error('Error subiendo documento:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('docs:get-documentos', (event, gasto_id) => {
    try {
      return dbManager.getDocumentos(gasto_id)
    } catch (error) {
      console.error('Error obteniendo documentos:', error)
      return []
    }
  })

  ipcMain.handle('docs:delete-documento', (event, id) => {
    try {
      const documento = dbManager.getDocumento(id)

      if (!documento) {
        return { success: false, error: 'Documento no encontrado' }
      }

      // Eliminar archivo de disco
      deleteFile(documento.ruta)

      // Eliminar de BD
      const result = dbManager.deleteDocumento(id)

      return result.success ? { success: true } : result
    } catch (error) {
      console.error('Error eliminando documento:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('docs:get-documento-path', (event, id) => {
    try {
      const documento = dbManager.getDocumento(id)
      if (documento && fs.existsSync(documento.ruta)) {
        return { success: true, path: documento.ruta, tipo: documento.tipo }
      }
      return { success: false, error: 'Documento no encontrado o ruta inválida' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('docs:open-documento', async (event, id) => {
    try {
      const documento = dbManager.getDocumento(id)
      if (documento && fs.existsSync(documento.ruta)) {
        await shell.openPath(documento.ruta)
        return { success: true }
      }
      return { success: false, error: 'Documento no encontrado' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('docs:get-documento-data', (event, id) => {
    try {
      const documento = dbManager.getDocumento(id)
      if (documento && fs.existsSync(documento.ruta)) {
        const data = fs.readFileSync(documento.ruta)
        const ext = path.extname(documento.ruta).toLowerCase()
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
          '.bmp': 'image/bmp'
        }
        const mime = mimeTypes[ext] || 'image/jpeg'
        return { success: true, data: data.toString('base64'), mime }
      }
      return { success: false, error: 'Documento no encontrado' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

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
