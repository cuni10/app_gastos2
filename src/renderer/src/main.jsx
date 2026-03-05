import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Root from './Root'

const Historial = lazy(() => import('./pages/Historial'))
const Agregar = lazy(() => import('./pages/Agregar'))

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
        element: (
          <Suspense fallback={<div className="page-loading">Cargando...</div>}>
            <Historial />
          </Suspense>
        )
      },
      {
        path: 'agregar',
        element: (
          <Suspense fallback={<div className="page-loading">Cargando...</div>}>
            <Agregar />
          </Suspense>
        )
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
