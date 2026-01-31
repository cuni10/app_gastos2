import { useState, useEffect } from 'react'
import { Calendar, Tag, Repeat, ChevronRight, FileText, Search } from 'lucide-react'
import '../css/HistorialGastos.css'

const HistorialGastos = () => {
  const [historial, setHistorial] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

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
                      <span>{gasto.fechaPago}</span>
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
                  <span className="expense-amount">${gasto.monto.toLocaleString()}</span>
                </div>
                <div className="expense-action">
                  <ChevronRight size={20} className="arrow-icon" />
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
