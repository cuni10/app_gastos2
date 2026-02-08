import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import { Outlet } from 'react-router-dom'

import './css/Root.css'
import { useEffect } from 'react'

function Root() {
  useEffect(() => {
    const checkPendientes = async () => {
      try {
        console.log('sincronizando pagos pendientes')
        await window.api.sincronizarPagosPendientes()
      } catch (error) {
        console.error('Error al sincronizar pagos pendientes', error)
      }
    }
    checkPendientes()
  }, [])

  return (
    <>
      <div className="app-container">
        <TitleBar />

        <div className="main-layout">
          <div className="sidebar-component">
            <Sidebar />
          </div>
          <div className="outlet-component">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}

export default Root
