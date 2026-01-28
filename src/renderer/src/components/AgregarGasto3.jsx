import { useState, useEffect } from 'react'
import { Save, DollarSign, Repeat, AlertCircle, CheckCircle } from 'lucide-react'
import '../css/AgregarGasto3.css'

const AgregarGasto3 = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    nota: '',
    mensual: false,
    fecha_cobro: '',
    categoria_id: '',
    cuotas: 1
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
        if (!checked) {
          newData.cuotas = 1
        }
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
      monto: Number(formData.monto.toString().replace(/\./g, '')),
      cuotas: Number(formData.cuotas) || 1
    }

    try {
      await window.api.insertGastoConHistorial(formDataSql)
      setFormData({
        nombre: '',
        monto: '',
        nota: '',
        mensual: false,
        fecha_cobro: '',
        categoria_id: '',
        cuotas: 1
      })
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
          <h1>Registrar Gasto</h1>
          <p>Añade un nuevo gasto a tu historial</p>
        </div>

        <form className="modern-form" onSubmit={handleSubmit}>
          {/* Sección Principal: Nombre y Monto Grandes */}
          <div className="main-section">
            <div className="input-large">
              <label htmlFor="nombre">Nombre del Gasto</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Suscripción de Netflix"
                className={`input-main ${errors.nombre ? 'input-error' : ''}`}
              />
              {errors.nombre && <span className="error-text">{errors.nombre}</span>}
            </div>

            <div className="input-large">
              <label htmlFor="monto">
                <DollarSign size={20} /> Monto
              </label>
              <input
                id="monto"
                type="text"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="0.00"
                className={`input-main ${errors.monto ? 'input-error' : ''}`}
              />
              {errors.monto && <span className="error-text">{errors.monto}</span>}
            </div>
          </div>

          {/* Sección: Nota y Categoría */}
          <div className="secondary-section">
            <div className="input-group">
              <label htmlFor="nota">Nota (Descripción)</label>
              <textarea
                id="nota"
                name="nota"
                value={formData.nota}
                onChange={handleChange}
                placeholder="Agrega una descripción (opcional)"
                className="input-textarea"
              />
            </div>

            <div className="input-group">
              <label htmlFor="categoria_id">Categoría</label>
              <select
                id="categoria_id"
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoría...</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección Inferior: Opciones Pequeñas */}
          <div className="footer-section">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="mensual"
                name="mensual"
                checked={formData.mensual}
                onChange={handleChange}
              />
              <label htmlFor="mensual">
                <Repeat size={16} />
                <span>Mensual</span>
              </label>
            </div>

            {formData.mensual && (
              <>
                <div className="small-input">
                  <label htmlFor="fecha_cobro">Día de Cobro</label>
                  <input
                    id="fecha_cobro"
                    type="date"
                    name="fecha_cobro"
                    value={formData.fecha_cobro}
                    onChange={handleChange}
                  />
                </div>

                <div className="small-input">
                  <label htmlFor="cuotas">Cuotas</label>
                  <input
                    id="cuotas"
                    type="number"
                    name="cuotas"
                    value={formData.cuotas}
                    onChange={handleChange}
                    min="1"
                    max="12"
                  />
                </div>
              </>
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
