import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Gastos
  getHistorial: () => ipcRenderer.invoke('db:get-historial'),
  getGastos: () => ipcRenderer.invoke('db:get-gastos'),
  insertGasto: (gasto) => ipcRenderer.invoke('db:insert-gasto', gasto),
  getCategorias: () => ipcRenderer.invoke('db:get-categorias'),
  insertCategoria: (categoria) => ipcRenderer.invoke('db:insert-categoria', categoria),
  insertGastoConHistorial: (gasto) => ipcRenderer.invoke('db:insert-gasto-con-historial', gasto),

  // Autos
  getAutos: () => ipcRenderer.invoke('db:get-autos'),
  getAutoById: (id) => ipcRenderer.invoke('db:get-auto-by-id', id),
  insertAuto: (auto) => ipcRenderer.invoke('db:insert-auto', auto),
  updateAuto: (auto) => ipcRenderer.invoke('db:update-auto', auto),
  updateAutoEstado: (data) => ipcRenderer.invoke('db:update-auto-estado', data),
  deleteAuto: (id) => ipcRenderer.invoke('db:delete-auto', id),

  // Papeles
  getPapelesAuto: (auto_id) => ipcRenderer.invoke('db:get-papeles-auto', auto_id),
  insertPapel: (papel) => ipcRenderer.invoke('db:insert-papel', papel),
  updatePapel: (papel) => ipcRenderer.invoke('db:update-papel', papel),
  updatePapelEstado: (data) => ipcRenderer.invoke('db:update-papel-estado', data),
  deletePapel: (id) => ipcRenderer.invoke('db:delete-papel', id)
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
