import { useState, useEffect } from 'react'
import {
  Calendar,
  Tag,
  CalendarSync,
  Calendar1,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Trash2,
  ClipboardCheck
} from 'lucide-react'
import '../css/HistorialGastos.css'
import Swal from 'sweetalert2'

import withReactContent from 'sweetalert2-react-content'

const HistorialGastos = () => {
  const [historial, setHistorial] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const [cardIsOpen, setCardIsOpen] = useState(null)

  const handleToggle = (id) => {
    setCardIsOpen(cardIsOpen === id ? null : id)
  }

  const MySwal = withReactContent(Swal)

  const baseAlert = {
    background: 'var(--bg-dark)',
    color: 'var(--text-light)'
  }
  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      ...baseAlert,
      title: '¿Estás seguro?',
      text: 'Esta acción eliminara permanentemente.',
      icon: 'warning',
      iconColor: 'var(--primary-accent)',
      showCancelButton: true,
      cancelButtonColor: 'var(--primary-accent)',
      confirmButtonColor: 'var(--card-bg)',
      confirmButtonText: 'Sí, borrar registro',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        await window.api.delHistorial(id)
        setHistorial((prev) => prev.filter((gasto) => gasto.id !== id))
        MySwal.fire({
          ...baseAlert,
          title: '¡Borrado!',
          text: 'El registro ha sido eliminado de la base de datos.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: 'var(--primary-accent)'
        })
      } catch (error) {
        MySwal.fire('Error', 'No se pudo borrar: ' + error.message, 'error')
      }
    }
  }

  useEffect(() => {
    const fetchHistorial = async () => {
      const datos = await window.api.getHistorial()
      console.log('Datos del historial:', datos)
      setHistorial(datos)
    }

    fetchHistorial()
  }, [])

  const filteredGastos = historial.filter((gasto) =>
    gasto.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
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

                      {gasto.tipo_pago !== 'unico' ? (
                        <div className="info-item">
                          <div className="info-item monthly-badge">
                            <CalendarSync size={14} />
                            <span>Mensual (Día {gasto.diaPagoMensual})</span>
                          </div>
                          <div className="info-item monthly-badge">
                            <Calendar1 size={14} />
                            <span>
                              Cuota: {gasto.numero_cuota}/{gasto.cuotas}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="info-item">
                          <div className="info-item unico-badge">
                            <ClipboardCheck size={14} />
                            <span>Unico</span>
                          </div>
                        </div>
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
