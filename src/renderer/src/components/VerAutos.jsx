import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Edit2, Trash2, FileText } from 'lucide-react'
import '../css/VerAutos.css'
import DetalleAuto from './DetalleAuto'
import GestionarPapeles from './GestionarPapeles'

const VerAutos = () => {
  const [autos, setAutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedAutoModal, setSelectedAutoModal] = useState(null)
  const [modalType, setModalType] = useState(null)

  useEffect(() => {
    cargarAutos()
  }, [])

  const cargarAutos = async () => {
    setLoading(true)
    try {
      const resultado = await window.api.getAutos()
      setAutos(resultado)
    } catch (error) {
      console.error('Error al cargar autos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este auto?')) {
      try {
        const result = await window.api.deleteAuto(id)
        if (result.success) {
          cargarAutos()
        }
      } catch (error) {
        console.error('Error al eliminar auto:', error)
      }
    }
  }

  const handleEdit = (auto) => {
    setSelectedAutoModal(auto)
    setModalType('edit')
  }

  const handlePapeles = (auto) => {
    setSelectedAutoModal(auto)
    setModalType('papeles')
  }

  const handleCloseModal = () => {
    setSelectedAutoModal(null)
    setModalType(null)
    cargarAutos()
  }

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getEstadoBadge = (estado) => {
    const colors = {
      disponible: 'badge-disponible',
      vendido: 'badge-vendido',
      reparo: 'badge-reparo'
    }
    return colors[estado] || 'badge-disponible'
  }

  if (loading) {
    return (
      <div className="ver-autos-container">
        <p>Cargando autos...</p>
      </div>
    )
  }

  return (
    <>
      <div className={`ver-autos-container ${selectedAutoModal ? 'modal-open' : ''}`}>
        <div className="form-wrapper">
          <div className="ver-autos-header">
            <h1>Mis Autos</h1>
            <p>Total: {autos.length} vehículos</p>
          </div>

          {autos.length === 0 ? (
            <div className="empty-state">
              <p>No hay autos registrados aún</p>
              <small>
                Comienza agregando un nuevo auto desde la opción &quot;Agregar auto&quot;
              </small>
            </div>
          ) : (
            <div className="autos-list">
              {autos.map((auto) => (
                <div key={auto.id} className="auto-card">
                  <div className="auto-card-header" onClick={() => toggleExpanded(auto.id)}>
                    <div className="auto-info">
                      <h3>
                        {auto.marca} {auto.modelo}
                      </h3>
                      <div className="auto-meta">
                        <span className="patente">{auto.patente}</span>
                        <span className={`badge ${getEstadoBadge(auto.estado)}`}>
                          {auto.estado}
                        </span>
                        {auto.anio && <span className="anio">Año: {auto.anio}</span>}
                      </div>
                    </div>
                    <div className="toggle-icon">
                      {expandedId === auto.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>

                  {expandedId === auto.id && (
                    <div className="auto-card-content">
                      <div className="auto-details">
                        {auto.color && (
                          <p>
                            <strong>Color:</strong> {auto.color}
                          </p>
                        )}
                        {auto.monto_compra && (
                          <p>
                            <strong>Monto de Compra:</strong> ${auto.monto_compra.toFixed(2)}
                          </p>
                        )}
                        {auto.fecha_compra && (
                          <p>
                            <strong>Fecha de Compra:</strong>{' '}
                            {new Date(auto.fecha_compra).toLocaleDateString()}
                          </p>
                        )}
                        {auto.descripcion && (
                          <p>
                            <strong>Descripción:</strong> {auto.descripcion}
                          </p>
                        )}
                        {auto.estado === 'vendido' && auto.monto_venta && (
                          <p>
                            <strong>Monto de Venta:</strong> ${auto.monto_venta.toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div className="auto-card-actions">
                        <button
                          className="btn-action btn-papeles"
                          onClick={() => handlePapeles(auto)}
                          title="Gestionar papeles"
                        >
                          <FileText size={18} />
                          Papeles ({auto.papeles_count || 0})
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(auto)}
                          title="Editar auto"
                        >
                          <Edit2 size={18} />
                          Editar
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(auto.id)}
                          title="Eliminar auto"
                        >
                          <Trash2 size={18} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAutoModal && modalType === 'edit' && (
        <DetalleAuto auto={selectedAutoModal} onClose={handleCloseModal} />
      )}

      {selectedAutoModal && modalType === 'papeles' && (
        <GestionarPapeles auto={selectedAutoModal} onClose={handleCloseModal} />
      )}
    </>
  )
}

export default VerAutos
