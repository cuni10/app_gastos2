import { useState } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import '../css/DetalleAuto.css'

/* eslint-disable react/prop-types */
const DetalleAuto = ({ auto, onClose }) => {
  const [formData, setFormData] = useState({
    marca: auto?.marca || '',
    modelo: auto?.modelo || '',
    anio: auto?.anio || new Date().getFullYear(),
    patente: auto?.patente || '',
    color: auto?.color || '',
    monto_compra: auto?.monto_compra || '',
    fecha_compra: auto?.fecha_compra || '',
    descripcion: auto?.descripcion || '',
    estado: auto?.estado || 'disponible',
    monto_venta: auto?.monto_venta || '',
    fecha_venta: auto?.fecha_venta || ''
  })

  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  if (!auto) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await window.api.updateAuto({
        id: auto.id,
        ...formData,
        anio: parseInt(formData.anio),
        monto_compra: formData.monto_compra ? parseFloat(formData.monto_compra) : null,
        monto_venta: formData.monto_venta ? parseFloat(formData.monto_venta) : null,
        fecha_compra: formData.fecha_compra || null,
        fecha_venta: formData.fecha_venta || null
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Auto actualizado correctamente' })
        setTimeout(() => onClose(), 2000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al actualizar el auto' })
      }
    } catch (err) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'Error al conectar con la base de datos' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Auto</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {message.text && (
          <div className={`message-box ${message.type}`}>
            <div className="message-content">
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="detail-form">
          <div className="form-section">
            <h3>Información General</h3>

            <div className="form-group">
              <label>Marca</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Modelo</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Año</label>
                <input type="number" name="anio" value={formData.anio} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input type="text" name="color" value={formData.color} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Patente</label>
              <input
                type="text"
                name="patente"
                value={formData.patente}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Detalles Financieros</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Monto de Compra</label>
                <input
                  type="number"
                  name="monto_compra"
                  value={formData.monto_compra}
                  onChange={handleChange}
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Fecha de Compra</label>
                <input
                  type="date"
                  name="fecha_compra"
                  value={formData.fecha_compra}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select name="estado" value={formData.estado} onChange={handleChange}>
                <option value="disponible">Disponible</option>
                <option value="vendido">Vendido</option>
                <option value="reparo">En Reparación</option>
              </select>
            </div>

            {formData.estado === 'vendido' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Monto de Venta</label>
                    <input
                      type="number"
                      name="monto_venta"
                      value={formData.monto_venta}
                      onChange={handleChange}
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Venta</label>
                    <input
                      type="date"
                      name="fecha_venta"
                      value={formData.fecha_venta}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="form-section">
            <h3>Descripción</h3>
            <div className="form-group">
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                placeholder="Notas adicionales sobre el vehículo"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DetalleAuto
