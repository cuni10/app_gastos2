import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import { Outlet } from 'react-router-dom'

import './css/Root.css'
import { useEffect } from 'react'

function Root() {
  const getGastos = async () => {
    const gastos = await window.api.getGastos()
    console.log(gastos)
  }

  useEffect(() => {
    getGastos()
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
