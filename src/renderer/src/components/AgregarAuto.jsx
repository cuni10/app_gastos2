import { useState } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import '../css/AgregarAuto.css'

const AgregarAuto = () => {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    patente: '',
    color: '',
    monto_compra: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    descripcion: ''
  })

  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.marca || !formData.modelo || !formData.patente) {
      setMessage({ type: 'error', text: 'Por favor completa los campos requeridos' })
      return
    }

    setLoading(true)
    try {
      const result = await window.api.insertAuto({
        ...formData,
        anio: parseInt(formData.anio),
        monto_compra: formData.monto_compra ? parseFloat(formData.monto_compra) : null
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Auto agregado correctamente' })
        setFormData({
          marca: '',
          modelo: '',
          anio: new Date().getFullYear(),
          patente: '',
          color: '',
          monto_compra: '',
          fecha_compra: new Date().toISOString().split('T')[0],
          descripcion: ''
        })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al agregar el auto' })
      }
    } catch (err) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'Error al conectar con la base de datos' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="agregar-auto-container">
      <div className="form-wrapper">
        <div className="agregar-auto-header">
          <h1>Agregar Nuevo Auto</h1>
          <p>Completa los datos del vehículo</p>
        </div>

        {message.text && (
          <div className={`message-box ${message.type}`}>
            <div className="message-content">
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
            <button className="close-message" onClick={() => setMessage({ type: '', text: '' })}>
              <X size={16} />
            </button>
          </div>
        )}

        <form className="agregar-auto-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Información General</h2>

            <div className="form-group">
              <label htmlFor="marca">
                Marca <span className="required">*</span>
              </label>
              <input
                type="text"
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Ej: Toyota, Ford, etc."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="modelo">
                Modelo <span className="required">*</span>
              </label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej: Corolla, Mustang, etc."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="anio">Año</label>
                <input
                  type="number"
                  id="anio"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">Color</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="Ej: Rojo, Blanco, etc."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="patente">
                Patente <span className="required">*</span>
              </label>
              <input
                type="text"
                id="patente"
                name="patente"
                value={formData.patente}
                onChange={handleChange}
                placeholder="Ej: ABC-1234"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Detalles de Compra</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="monto_compra">Monto de Compra ($)</label>
                <input
                  type="number"
                  id="monto_compra"
                  name="monto_compra"
                  value={formData.monto_compra}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_compra">Fecha de Compra</label>
                <input
                  type="date"
                  id="fecha_compra"
                  name="fecha_compra"
                  value={formData.fecha_compra}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Notas adicionales sobre el vehículo"
                rows="4"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Auto'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AgregarAuto
