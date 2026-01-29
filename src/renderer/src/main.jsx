import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Historial from './pages/Historial'
import Agregar from './pages/Agregar'
import AgregarAuto from './pages/AgregarAuto'
import Autos from './pages/Autos'
import Root from './Root'

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'historial',
        element: <Historial />
      },
      {
        path: 'agregar',
        element: <Agregar />
      },
      {
        path: 'agregar-auto',
        element: <AgregarAuto />
      },
      {
        path: 'autos',
        element: <Autos />
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
