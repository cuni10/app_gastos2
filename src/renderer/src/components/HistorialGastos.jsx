import { useState, useEffect } from 'react'
import { Calendar, Tag, Repeat, ChevronRight } from 'lucide-react'
import '../css/HistorialGastos.css'

const HistorialGastos = () => {
  const [historial, setHistorial] = useState([])

  useEffect(() => {
    const fetchHistorial = async () => {
      // Llamamos a la función expuesta en el preload
      const datos = await window.api.getHistorial()
      console.log('Datos del historial:', datos)
      setHistorial(datos)
    }

    fetchHistorial()
  }, [])
  return (
    <div className="history-container">
      <h2 className="history-title">Historial de Gastos</h2>
      <div className="expense-list">
        {historial.map((gasto) => (
          <div key={gasto.id} className="expense-card">
            <div className="expense-icon-wrapper">
              <div className="category-icon">
                <Tag size={20} />
              </div>
            </div>

            <div className="expense-details">
              <div className="expense-header">
                <span className="expense-name">{gasto.nombre}</span>
                <span className="expense-amount">${gasto.monto.toLocaleString()}</span>
              </div>

              <div className="expense-info-grid">
                <div className="info-item">
                  <Calendar size={14} />
                  <span>Pago: {gasto.fechaPago}</span>
                </div>

                <div className="info-item">
                  <Tag size={14} />
                  <span>{gasto.categoria}</span>
                </div>

                {gasto.esMensual && (
                  <div className="info-item monthly-badge">
                    <Repeat size={14} />
                    <span>Mensual (Día {gasto.diaPagoMensual})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="expense-action">
              <ChevronRight size={20} className="arrow-icon" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistorialGastos
