import { useState, useEffect } from 'react'
import { Save, DollarSign, Tag, FileText, List } from 'lucide-react'
import '../css/AgregarGasto.css'

const AgregarGasto = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    nota: '',
    categoria_id: '',
    mensual: false,
    fecha_cobro: '',
    cuotas: ''
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
      // Limit dia_cobro between 1 and 31
      if (name === 'fecha_cobro') {
        if (value === '' || value === 0) {
          newValue = value
        } else {
          newValue = value < 1 ? '1' : value > 31 ? '31' : value
        }
      }

      // limit min
      if (name === 'cuotas') {
        if (value === '' || value === '0') {
          newValue = value
        } else if (parseInt(value, 10) < 2) {
          newValue = '2'
        }
      }
      return { ...prev, [name]: newValue }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formDataSql = {
      ...formData,
      mensual: formData.mensual ? 1 : 0,
      categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
      monto: Number(formData.monto.toString().replace(/\./g, '')),
      fecha_cobro: formData.fecha_cobro ? Number(formData.fecha_cobro) : null,
      cuotas: Number(formData.cuotas)
    }
    try {
      await window.api.insertGastoConHistorial(formDataSql)
      setFormData({
        nombre: '',
        monto: '',
        nota: '',
        categoria_id: '',
        mensual: false,
        fecha_cobro: '',
        cuotas: ''
      })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 6000)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-alt">
      {showSuccess && <div className="toast-success">¡Guardado con éxito!</div>}

      <form className="form-alt" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>Registrar Gasto</h2>
          <p>Completa la información del nuevo movimiento</p>
        </div>

        <div className="section-main">
          <div className="input-group-alt">
            <label>Monto Total</label>
            <div className="input-with-icon">
              <DollarSign size={24} />
              <input
                type="text"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>
          </div>
          <div className="input-group-alt">
            <label>¿En qué gastaste?</label>
            <div className="input-with-icon">
              <Tag size={20} />
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre del gasto"
                required
              />
            </div>
          </div>
        </div>

        <div className="section-details">
          <div className="input-group-alt">
            <label>
              <FileText size={16} /> Nota (Opcional)
            </label>
            <input
              type="text"
              name="nota"
              value={formData.nota}
              onChange={handleChange}
              placeholder="Añade un detalle..."
            />
          </div>
          <div className="input-group-alt">
            <label>
              <List size={16} /> Categoría (Opcional)
            </label>
            <select name="categoria_id" value={formData.categoria_id} onChange={handleChange}>
              <option value="">Sin Categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="section-mensual">
          <label className={`toggle-control ${formData.mensual ? 'is-active' : ''}`}>
            <input
              type="checkbox"
              name="mensual"
              checked={formData.mensual}
              onChange={handleChange}
            />
            <div className="toggle-switch"></div>
            <span>Gasto Mensual</span>
          </label>

          {formData.mensual && (
            <div className="row-mensual">
              <div className="input-group-alt">
                <label>Día</label>
                <input
                  type="number"
                  name="fecha_cobro"
                  value={formData.fecha_cobro}
                  onChange={handleChange}
                  placeholder="31"
                  min={1}
                  max={31}
                />
              </div>
              <div className="input-group-alt">
                <label>Cuotas</label>
                <input
                  type="number"
                  name="cuotas"
                  value={formData.cuotas}
                  onChange={handleChange}
                  placeholder="6"
                  min="2"
                />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn-gradient" disabled={loading}>
          {loading ? (
            'Procesando...'
          ) : (
            <>
              <Save size={20} /> Guardar Registro
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default AgregarGasto
