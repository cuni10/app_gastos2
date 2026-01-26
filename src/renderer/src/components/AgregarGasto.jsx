import { useState, useEffect } from 'react'
import { Save, Calendar, DollarSign, Tag, Repeat } from 'lucide-react'
import '../css/AgregarGasto.css'

const AgregarGasto = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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

    setFormData((prev) => {
      let newValue = type === 'checkbox' ? checked : value

      if (name === 'monto') {
        const rawValue = value.replace(/\D/g, '')
        newValue = rawValue === '' ? '' : new Intl.NumberFormat('de-DE').format(parseInt(rawValue))
      }

      const newData = { ...prev, [name]: newValue }

      // Lógica de fecha_cobro
      if (name === 'mensual') {
        newData.fecha_cobro = checked ? new Date().toISOString().split('T')[0] : ''
      }

      return newData
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    console.log(formData)

    const formDataSql = {
      ...formData,
      mensual: formData.mensual ? 1 : 0,
      categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
      monto: Number(formData.monto.toString().replace(/\./g, ''))
    }

    console.log('Datos para SQL:', formDataSql)
    try {
      await window.api.insertGastoConHistorial(formDataSql)
      setFormData({ nombre: '', monto: '', mensual: false, fecha_cobro: '', categoria_id: '' })
      setLoading(false)

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000) // Se quita en 3 segundos
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-container dark">
      {showSuccess && (
        <div
          style={{
            backgroundColor: '#2ecc71',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            textAlign: 'center'
          }}
        >
          ¡Registro guardado con éxito!
        </div>
      )}
      <form className="gasto-form" onSubmit={handleSubmit}>
        <h2>Nuevo Registro</h2>

        <div className="input-group">
          <label>
            <Tag size={18} /> Nombre
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            autoComplete="off"
            placeholder="Ej: Internet"
            required
          />
        </div>

        <div className="row">
          <div className="input-group">
            <label>
              <DollarSign size={18} /> Monto
            </label>
            <input
              type="text"
              name="monto"
              value={formData.monto}
              onChange={handleChange}
              placeholder="0.00"
              autoComplete="off"
              step="0.01"
              required
            />
          </div>

          <div className="input-group">
            <label>Categoría</label>
            <select name="categoria_id" value={formData.categoria_id} onChange={handleChange}>
              <option value="">Seleccionar...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="checkbox-section">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="mensual"
              name="mensual"
              checked={formData.mensual}
              onChange={handleChange}
            />
            <label htmlFor="es_mensual">
              <Repeat size={18} /> ¿Es un gasto mensual?
            </label>
          </div>

          {/* Fecha de cobro debajo del checkbox */}
          <div className={`input-group ${!formData.mensual ? 'disabled' : ''}`}>
            <label>
              <Calendar size={18} /> Fecha de Cobro
            </label>
            <input
              type="date"
              name="fecha_cobro"
              value={formData.fecha_cobro}
              onChange={handleChange}
              disabled={!formData.mensual}
              required={formData.mensual}
            />
          </div>
        </div>

        <button type="submit" className="btn-save" disabled={loading}>
          <Save size={18} /> {loading ? 'Procesando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}

export default AgregarGasto
