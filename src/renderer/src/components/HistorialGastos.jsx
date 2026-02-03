import { useState, useEffect } from 'react'
import {
  Calendar,
  Tag,
  Repeat,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Trash2
} from 'lucide-react'
import '../css/HistorialGastos.css'

const HistorialGastos = () => {
  const [historial, setHistorial] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const [cardIsOpen, setCardIsOpen] = useState(null)

  const handleToggle = (id) => {
    setCardIsOpen(cardIsOpen === id ? null : id)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto?')) {
      return
    }
    const result = await window.api.delHistorial(id)
    console.log('Resultado de eliminación:', result.changes)
    if (result.changes === 1) {
      setHistorial(historial.filter((gasto) => gasto.id !== id))
    } else {
      alert('Error', result.error)
    }
  }

  useEffect(() => {
    const fetchHistorial = async () => {
      // Llamamos a la función expuesta en el preload
      const datos = await window.api.getHistorial()
      console.log('Datos del historial:', datos)
      setHistorial(datos)
    }

    fetchHistorial()
  }, [])

  const filteredGastos = historial.filter((gasto) =>
    gasto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <div className="container-history">
      <div className="card-history">
        <div className="card-titles">
          <h2 className="history-title">Historial de Gastos</h2>

          <div className="search-container">
            <Search size={24} />
            <input
              type="text"
              placeholder="Nombre del gasto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="expenses-list">
          {filteredGastos.length > 0 ? (
            filteredGastos.map((gasto) => (
              <div key={gasto.id} className="expense-card">
                <div className="wrapper" onClick={() => handleToggle(gasto.id)}>
                  <div className="expense-icon-wrapper">
                    <div className="category-icon">
                      <Tag size={20} />
                    </div>
                  </div>

                  <div className="expense-details">
                    <div className="expense-header">
                      <span className="expense-name">{gasto.nombre}</span>
                    </div>

                    <div className={`expense-note ${gasto.nota ? 'is-active' : ''}`}>
                      <FileText size={16} />
                      <span>{gasto.nota}</span>
                    </div>

                    <div className="expense-info-grid">
                      <div className="info-item">
                        <Calendar size={14} />
                        <span>
                          {gasto.fechaPago
                            ? new Date(gasto.fechaPago).toLocaleDateString('es-AR')
                            : 'Sin fecha'}
                        </span>
                      </div>
                      {gasto.categoria ? (
                        <div className="info-item">
                          <Tag size={14} />
                          <span>{gasto.categoria}</span>
                        </div>
                      ) : (
                        ''
                      )}

                      {gasto.esMensual ? (
                        <div className="info-item monthly-badge">
                          <Repeat size={14} />
                          <span>Mensual (Día {gasto.diaPagoMensual})</span>
                        </div>
                      ) : (
                        ''
                      )}
                    </div>
                  </div>
                  <div className="expense-end">
                    <span className="expense-amount">${gasto.monto.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="expense-action">
                    {cardIsOpen === gasto.id ? (
                      <ChevronDown size={20} className="arrow-icon" />
                    ) : (
                      <ChevronRight size={20} className="arrow-icon" />
                    )}
                  </div>
                </div>
                <div className={`card-options ${cardIsOpen === gasto.id ? 'open' : ''}`}>
                  <button
                    className="btn-delete"
                    onClick={() => {
                      handleDelete(gasto.id)
                    }}
                  >
                    <Trash2 /> Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="not-expense-card">
              <span>No se encontraron registros.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistorialGastos
