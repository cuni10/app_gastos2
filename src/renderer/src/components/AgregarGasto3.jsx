import { useState, useEffect } from 'react'
import { Save, Calendar, DollarSign, Tag, Repeat, AlertCircle, CheckCircle } from 'lucide-react'
import '../css/AgregarGasto3.css'

const AgregarGasto3 = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    mensual: false,
    fecha_cobro: '',
    categoria_id: ''
  })

  useEffect(() => {
    const fetchCategorias = async () => {
      const data = await window.api.getCategorias()
      setCategorias(data)
    }
    fetchCategorias()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setErrors({ ...errors, [name]: '' })

    setFormData((prev) => {
      let newValue = type === 'checkbox' ? checked : value

      if (name === 'monto') {
        const rawValue = value.replace(/\D/g, '')
        newValue = rawValue === '' ? '' : new Intl.NumberFormat('de-DE').format(parseInt(rawValue))
      }

      const newData = { ...prev, [name]: newValue }

      if (name === 'mensual') {
        newData.fecha_cobro = checked ? new Date().toISOString().split('T')[0] : ''
      }

      return newData
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    if (!formData.monto) {
      newErrors.monto = 'El monto es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    const formDataSql = {
      ...formData,
      mensual: formData.mensual ? 1 : 0,
      categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
      monto: Number(formData.monto.toString().replace(/\./g, ''))
    }

    try {
      await window.api.insertGastoConHistorial(formDataSql)
      setFormData({ nombre: '', monto: '', mensual: false, fecha_cobro: '', categoria_id: '' })
      setErrors({})

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
    } catch (error) {
      console.error(error)
      setErrors({ submit: 'Error al guardar. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gasto-container">
      <div className="form-wrapper">
        {showSuccess && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <span>¡Gasto registrado exitosamente!</span>
          </div>
        )}

        {errors.submit && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="form-header">
          <h1>Registrar Nuevo Gasto</h1>
          <p>Añade un nuevo gasto a tu historial</p>
        </div>

        <form className="modern-form" onSubmit={handleSubmit}>
          {/* Primera fila: Nombre */}
          <div className="form-group full-width">
            <label htmlFor="nombre">
              <Tag size={18} /> Nombre del Gasto
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Suscripción de Netflix"
              className={errors.nombre ? 'input-error' : ''}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          {/* Segunda fila: Monto y Categoría */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="monto">
                <DollarSign size={18} /> Monto
              </label>
              <input
                id="monto"
                type="text"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="0.00"
                className={errors.monto ? 'input-error' : ''}
              />
              {errors.monto && <span className="error-text">{errors.monto}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="categoria_id">Categoría</label>
              <select
                id="categoria_id"
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                className={errors.categoria_id ? 'input-error' : ''}
              >
                <option value="">Seleccionar categoría...</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              {errors.categoria_id && <span className="error-text">{errors.categoria_id}</span>}
            </div>
          </div>

          {/* Sección de gasto mensual */}
          <div className="monthly-section">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="mensual"
                name="mensual"
                checked={formData.mensual}
                onChange={handleChange}
              />
              <label htmlFor="mensual" className="checkbox-label">
                <Repeat size={18} />
                <div>
                  <span className="checkbox-text">¿Es un gasto mensual?</span>
                  <span className="checkbox-hint">Recurrente cada mes</span>
                </div>
              </label>
            </div>

            {formData.mensual && (
              <div className="form-group date-input-group">
                <label htmlFor="fecha_cobro">
                  <Calendar size={18} /> Fecha de Cobro
                </label>
                <input
                  id="fecha_cobro"
                  type="date"
                  name="fecha_cobro"
                  value={formData.fecha_cobro}
                  onChange={handleChange}
                  className={errors.fecha_cobro ? 'input-error' : ''}
                />
                {errors.fecha_cobro && <span className="error-text">{errors.fecha_cobro}</span>}
              </div>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            <Save size={20} />
            <span>{loading ? 'Registrando...' : 'Registrar Gasto'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default AgregarGasto3
