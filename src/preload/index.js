import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getHistorial: () => ipcRenderer.invoke('db:get-historial'),

  getGastos: () => ipcRenderer.invoke('db:get-gastos'),

  insertGasto: (gasto) => ipcRenderer.invoke('db:insert-gasto', gasto),
  getCategorias: () => ipcRenderer.invoke('db:get-categorias'),
  insertCategoria: (categoria) => ipcRenderer.invoke('db:insert-categoria', categoria),
  insertGastoConHistorial: (gasto) => ipcRenderer.invoke('db:insert-gasto-con-historial', gasto)
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
