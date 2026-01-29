import { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import '../css/GestionarPapeles.css'

/* eslint-disable react/prop-types */
const GestionarPapeles = ({ auto, onClose }) => {
  const [papeles, setPapeles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    tipo_papel: '',
    descripcion: '',
    fecha_obtencion: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
    notas: ''
  })

  useEffect(() => {
    if (auto?.id) {
      cargarPapeles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto?.id])

  const cargarPapeles = async () => {
    setLoading(true)
    try {
      const resultado = await window.api.getPapelesAuto(auto.id)
      setPapeles(resultado || [])
    } catch (error) {
      console.error('Error al cargar papeles:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo_papel: '',
      descripcion: '',
      fecha_obtencion: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      notas: ''
    })
    setEditingId(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.tipo_papel) {
      setMessage({ type: 'error', text: 'Por favor ingresa el tipo de papel' })
      return
    }

    try {
      let result
      if (editingId) {
        result = await window.api.updatePapel({
          id: editingId,
          ...formData
        })
      } else {
        result = await window.api.insertPapel({
          auto_id: auto.id,
          ...formData
        })
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: editingId ? 'Papel actualizado correctamente' : 'Papel agregado correctamente'
        })
        resetForm()
        setShowForm(false)
        cargarPapeles()
        setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al guardar' })
      }
    } catch (err) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'Error al conectar con la base de datos' })
    }
  }

  const handleEdit = (papel) => {
    setFormData({
      tipo_papel: papel.tipo_papel,
      descripcion: papel.descripcion || '',
      fecha_obtencion: papel.fecha_obtencion || new Date().toISOString().split('T')[0],
      estado: papel.estado || 'pendiente',
      notas: papel.notas || ''
    })
    setEditingId(papel.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este papel?')) {
      try {
        const result = await window.api.deletePapel(id)
        if (result.success) {
          cargarPapeles()
        }
      } catch (error) {
        console.error('Error al eliminar:', error)
      }
    }
  }

  const getEstadoBadge = (estado) => {
    const colors = {
      pendiente: 'badge-pendiente',
      obtenido: 'badge-obtenido',
      en_proceso: 'badge-en-proceso'
    }
    return colors[estado] || 'badge-pendiente'
  }

  return (
    <>
      {!auto ? null : (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content papeles-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>
                  Papeles - {auto.marca} {auto.modelo}
                </h2>
                <p className="patente-small">{auto.patente}</p>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            {message.text && (
              <div className={`message-box ${message.type}`}>
                <div className="message-content">
                  {message.type === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            <div className="papeles-content">
              {!showForm ? (
                <>
                  <button className="btn-add-papel" onClick={() => setShowForm(true)}>
                    <Plus size={20} />
                    Agregar Papel
                  </button>

                  {loading ? (
                    <p>Cargando papeles...</p>
                  ) : papeles.length === 0 ? (
                    <div className="empty-papeles">
                      <p>No hay papeles registrados para este vehículo</p>
                    </div>
                  ) : (
                    <div className="papeles-list">
                      {papeles.map((papel) => (
                        <div key={papel.id} className="papel-item">
                          <div className="papel-info">
                            <h4>{papel.tipo_papel}</h4>
                            <p className="papel-descripcion">{papel.descripcion}</p>
                            <div className="papel-meta">
                              <span className={`badge ${getEstadoBadge(papel.estado)}`}>
                                {papel.estado}
                              </span>
                              {papel.fecha_obtencion && (
                                <span className="fecha">
                                  {new Date(papel.fecha_obtencion).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {papel.notas && <p className="papel-notas">Notas: {papel.notas}</p>}
                          </div>
                          <div className="papel-actions">
                            <button
                              className="btn-small btn-edit-small"
                              onClick={() => handleEdit(papel)}
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-small btn-delete-small"
                              onClick={() => handleDelete(papel.id)}
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleSubmit} className="papel-form">
                  <div className="form-group">
                    <label>Tipo de Papel *</label>
                    <input
                      type="text"
                      name="tipo_papel"
                      value={formData.tipo_papel}
                      onChange={handleChange}
                      placeholder="Ej: Título, Matricula, Compraventa..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Detalles adicionales"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Estado</label>
                      <select name="estado" value={formData.estado} onChange={handleChange}>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="obtenido">Obtenido</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fecha de Obtención</label>
                      <input
                        type="date"
                        name="fecha_obtencion"
                        value={formData.fecha_obtencion}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notas</label>
                    <textarea
                      name="notas"
                      value={formData.notas}
                      onChange={handleChange}
                      placeholder="Observaciones importantes"
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel-form"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save-form">
                      {editingId ? 'Actualizar Papel' : 'Agregar Papel'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GestionarPapeles
