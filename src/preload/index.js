import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for base de datos
const api = {
  delHistorial: (id) => ipcRenderer.invoke('db:del-historial', id),

  getHistorial: () => ipcRenderer.invoke('db:get-historial'),
  getGastos: (filters) => ipcRenderer.invoke('db:get-gastos', filters),
  getCategorias: () => ipcRenderer.invoke('db:get-categorias'),
  getHistorialMes: (filtros) => ipcRenderer.invoke('db:get-historial-mes', filtros),
  getHistorialSeisMeses: () => ipcRenderer.invoke('db:get-historial-seis-meses'),

  insertCategoria: (categoria) => ipcRenderer.invoke('db:insert-categoria', categoria),
  insertGastoConHistorial: (gasto) => ipcRenderer.invoke('db:insert-gasto-con-historial', gasto),

  sincronizarPagosPendientes: () => ipcRenderer.invoke('db:sincronizar-pagos-pendientes'),

  // Adjuntos
  uploadAdjunto: (historialId) => ipcRenderer.invoke('dialog:upload-adjunto', historialId),
  getAdjuntos: (historialId) => ipcRenderer.invoke('db:get-adjuntos', historialId),
  delAdjunto: (id) => ipcRenderer.invoke('db:del-adjunto', id),
  getAttachmentPath: (filename) => ipcRenderer.invoke('file:get-attachment-path', filename),
  openExternal: (filename) => ipcRenderer.invoke('file:open-external', filename)
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
