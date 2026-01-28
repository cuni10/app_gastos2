import { useState, useEffect } from 'react'
import { Calendar, Repeat, Search, AlertCircle } from 'lucide-react'
import '../css/HistorialGastos.css'

const HistorialGastos = () => {
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredHistorial, setFilteredHistorial] = useState([])

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true)
        const datos = await window.api.getHistorial()
        console.log('Datos del historial:', datos)
        setHistorial(datos)
        setFilteredHistorial(datos)
        setError(null)
      } catch (err) {
        console.error('Error al cargar historial:', err)
        setError('Error al cargar el historial de gastos')
      } finally {
        setLoading(false)
      }
    }

    fetchHistorial()
  }, [])

  // Buscar gastos por nombre o categoría
  const handleSearch = (term) => {
    setSearchTerm(term)
    if (term.trim() === '') {
      setFilteredHistorial(historial)
    } else {
      const filtered = historial.filter(
        (gasto) =>
          (gasto.nombre?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (gasto.categoria?.toLowerCase() || '').includes(term.toLowerCase())
      )
      setFilteredHistorial(filtered)
      console.log('Gastos filtrados:', filtered)
    }
  }

  const getCategoryEmoji = (categoria) => {
    const emojiMap = {
      comida: '🍔',
      transporte: '🚗',
      suscripcion: '📱',
      entretenimiento: '🎮',
      salud: '⚕️',
      educacion: '📚',
      default: '💸'
    }
    return emojiMap[categoria?.toLowerCase()] || emojiMap.default
  }

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div>
          <h1>Historial de Gastos</h1>
          <p>Visualiza todos tus gastos registrados</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-wrapper">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
        {searchTerm && (
          <button className="clear-search" onClick={() => handleSearch('')}>
            Limpiar
          </button>
        )}
      </div>

      {/* Stats Summary */}
      {filteredHistorial.length > 0 && (
        <div className="stats-summary">
          <div className="summary-stat">
            <span className="summary-label">Total de gastos</span>
            <span className="summary-value">{filteredHistorial.length}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-stat">
            <span className="summary-label">Monto total</span>
            <span className="summary-value">
              ${filteredHistorial.reduce((sum, g) => sum + g.monto, 0).toLocaleString('es-AR')}
            </span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-stat">
            <span className="summary-label">Promedio</span>
            <span className="summary-value">
              $
              {Math.round(
                filteredHistorial.reduce((sum, g) => sum + g.monto, 0) / filteredHistorial.length
              ).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando historial...</p>
        </div>
      ) : filteredHistorial.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{searchTerm ? 'Sin resultados' : 'Sin gastos registrados'}</h3>
          <p>
            {searchTerm
              ? `No encontramos gastos con "${searchTerm}"`
              : 'Comienza a registrar tus gastos'}
          </p>
        </div>
      ) : (
        <div className="expense-list">
          {filteredHistorial.map((gasto, index) => (
            <div
              key={gasto.id}
              className="expense-card"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-left">
                <div className="expense-icon">
                  <span>{getCategoryEmoji(gasto.categoria)}</span>
                </div>
                <div className="expense-info">
                  <div className="expense-name">{gasto.nombre}</div>
                  <div className="expense-category">{gasto.categoria}</div>
                </div>
              </div>

              <div className="expense-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>{gasto.fechaPago}</span>
                </div>
                {gasto.esMensual && (
                  <div className="meta-item monthly-badge">
                    <Repeat size={14} />
                    <span>Día {gasto.diaPagoMensual}</span>
                  </div>
                )}
              </div>

              <div className="expense-amount">${gasto.monto.toLocaleString('es-AR')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistorialGastos
