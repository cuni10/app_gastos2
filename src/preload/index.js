import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for base de datos
const api = {
  delHistorial: (id) => ipcRenderer.invoke('db:del-historial', id),

  getHistorial: () => ipcRenderer.invoke('db:get-historial'),
  getGastos: () => ipcRenderer.invoke('db:get-gastos'),
  getCategorias: () => ipcRenderer.invoke('db:get-categorias'),
  getHistorialMes: (filtros) => ipcRenderer.invoke('db:get-historial-mes', filtros),
  getHistorialSeisMeses: () => ipcRenderer.invoke('db:get-historial-seis-meses'),

  insertCategoria: (categoria) => ipcRenderer.invoke('db:insert-categoria', categoria),
  insertGastoConHistorial: (gasto) => ipcRenderer.invoke('db:insert-gasto-con-historial', gasto),

  sincronizarPagosPendientes: () => ipcRenderer.invoke('db:sincronizar-pagos-pendientes'),

  getGasto: (id) => ipcRenderer.invoke('db:get-gasto', id),
  updateGasto: (id, data) => ipcRenderer.invoke('db:update-gasto', { id, data }),

  // Documentos
  getFilePath: (file) => webUtils.getPathForFile(file),
  uploadDocumento: (gasto_id, filePath) =>
    ipcRenderer.invoke('docs:upload-documento', { gasto_id, filePath }),
  getDocumentos: (gasto_id) => ipcRenderer.invoke('docs:get-documentos', gasto_id),
  deleteDocumento: (id) => ipcRenderer.invoke('docs:delete-documento', id),
  getDocumentoPath: (id) => ipcRenderer.invoke('docs:get-documento-path', id),
  openDocumento: (id) => ipcRenderer.invoke('docs:open-documento', id),
  getDocumentoData: (id) => ipcRenderer.invoke('docs:get-documento-data', id)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
