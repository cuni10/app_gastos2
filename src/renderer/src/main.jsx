import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Historial from './pages/Historial'
import Agregar from './pages/Agregar'
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
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
