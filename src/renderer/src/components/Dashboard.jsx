import { useState, useEffect } from 'react'
import { Plus, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../css/Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [historial, setHistorial] = useState([])
  const [totalMes, setTotalMes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const datos = await window.api.getHistorial()
        setHistorial(datos)

        // Calcular gastos del mes actual
        const ahora = new Date()
        const mesActual = ahora.getMonth()
        const anioActual = ahora.getFullYear()

        const gastosMes = datos.reduce((total, gasto) => {
          const fecha = new Date(gasto.fechaPago)
          if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
            return total + gasto.monto
          }
          return total
        }, 0)

        setTotalMes(gastosMes)
        setError(null)
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError('Error al cargar los datos del dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getUltimosGastos = (cantidad = 5) => {
    return historial.slice(0, cantidad)
  }

  const handleAgregarGasto = () => {
    navigate('/agregar')
  }

  const mesesNombres = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ]
  const mesActual = mesesNombres[new Date().getMonth()]

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="logo-section">
          <div className="logo-placeholder">
            <span>💰</span>
          </div>
          <div className="header-text">
            <h1>Gestor de Gastos</h1>
            <p>Control de tu economía personal</p>
          </div>
        </div>
        <button className="btn-agregar-principal" onClick={handleAgregarGasto}>
          <Plus size={22} />
          Agregar Gasto
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <Calendar size={20} />
            <span className="stat-label">Gastos del Mes</span>
          </div>
          <div className="stat-value">
            ${totalMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-sublabel">{mesActual}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <TrendingUp size={20} />
            <span className="stat-label">Total Registros</span>
          </div>
          <div className="stat-value">{historial.length}</div>
          <div className="stat-sublabel">en el historial</div>
        </div>

        {historial.length > 0 && (
          <div className="stat-card">
            <div className="stat-header">
              <TrendingUp size={20} />
              <span className="stat-label">Promedio por Gasto</span>
            </div>
            <div className="stat-value">
              $
              {(totalMes / (historial.length || 1)).toLocaleString('es-AR', {
                minimumFractionDigits: 2
              })}
            </div>
            <div className="stat-sublabel">este mes</div>
          </div>
        )}
      </div>

      {/* Últimos Gastos */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Últimos Gastos</h2>
          <button className="link-ver-todos" onClick={() => navigate('/historial')}>
            Ver todos →
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Sin gastos registrados</h3>
            <p>Comienza a registrar tus gastos</p>
            <button className="btn-empty-state" onClick={handleAgregarGasto}>
              <Plus size={18} /> Registrar Primer Gasto
            </button>
          </div>
        ) : (
          <div className="recent-list">
            {getUltimosGastos().map((gasto) => (
              <div key={gasto.id} className="recent-item">
                <div className="item-icon">
                  <span>{gasto.categoria?.charAt(0).toUpperCase() || '💸'}</span>
                </div>
                <div className="item-details">
                  <div className="item-name">{gasto.nombre}</div>
                  <div className="item-category">{gasto.categoria}</div>
                </div>
                <div className="item-amount">${gasto.monto.toLocaleString('es-AR')}</div>
                <div className="item-date">{gasto.fechaPago}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
