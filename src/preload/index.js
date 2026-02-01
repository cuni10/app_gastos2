import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for base de datos
const api = {
  getHistorial: () => ipcRenderer.invoke('db:get-historial'),
  getGastos: () => ipcRenderer.invoke('db:get-gastos'),
  getCategorias: () => ipcRenderer.invoke('db:get-categorias'),
  getHistorialMes: (filtros) => ipcRenderer.invoke('db:get-historial-mes', filtros),
  getHistorialSeisMeses: () => ipcRenderer.invoke('db:get-historial-seis-meses'),

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
