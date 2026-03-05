import { useState, useEffect, useRef } from 'react'
import { Save, DollarSign, Tag, FileText, List, CirclePlus, Plus, X } from 'lucide-react'
import '../css/AgregarGasto.css'
import { showAddCategoryAlert } from './categoryAlert'

const AgregarGasto = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const MAX_SIZE_IMAGE = 5 * 1024 * 1024
  const MAX_SIZE_PDF = 3 * 1024 * 1024
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'application/pdf'
  ]

  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    nota: '',
    categoria_id: '',
    tipo_pago: 'unico',
    estado: 'creado',
    fecha_cobro: '',
    cuotas: '',
    cuotas_pagadas: 0
  })

  useEffect(() => {
    const fetchCategorias = async () => {
      const data = await window.api.getCategorias()
      setCategorias(data)
    }
    fetchCategorias()
  }, [])

  const handleAddCategory = async () => {
    const newCategoryData = await showAddCategoryAlert()
    if (newCategoryData) {
      try {
        const newCategory = await window.api.insertCategoria(newCategoryData)
        setCategorias((prev) => [...prev, newCategory])
        setFormData((prev) => ({ ...prev, categoria_id: newCategory.id.toString() }))
      } catch (error) {
        console.error('Error al agregar categoría:', error)
      }
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => {
      let newValue = type === 'checkbox' ? checked : value
      if (name === 'monto') {
        const rawValue = value.replace(/\D/g, '')
        newValue = rawValue === '' ? '' : new Intl.NumberFormat('es-AR').format(parseInt(rawValue))
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
        if (value === '') {
          newValue = ''
        } else {
          const numValue = parseInt(value, 10)

          if (numValue === 1) {
            newValue = value
          } else {
            newValue = numValue > 200 ? '200' : value
          }
        }
      }
      return { ...prev, [name]: newValue }
    })
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (name === 'cuotas') {
      const numValue = parseInt(value, 10)
      if (numValue < 2 || value === '') {
        setFormData({ ...formData, cuotas: '2' })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formDataSql = {
      ...formData,
      estado: formData.mensual ? 'activo' : 'finalizado',
      tipo_pago: formData.mensual ? 'cuotas' : 'unico',
      nota: formData.nota || null,
      categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
      monto: Number(formData.monto.toString().replace(/\./g, '')),
      fecha_cobro: formData.fecha_cobro ? Number(formData.fecha_cobro) : null,
      cuotas: Number(formData.cuotas),
      cuotas_pagadas: 1
    }
    try {
      const result = await window.api.insertGastoConHistorial(formDataSql)
      const gastoId = result?.id

      if (gastoId && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const filePath = window.api.getFilePath(file)
          await window.api.uploadDocumento(gastoId, filePath)
        }
      }

      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 6000)
      }

      setFormData({
        nombre: '',
        monto: '',
        nota: '',
        categoria_id: '',
        estado: 'creado',
        fecha_cobro: '',
        cuotas: '',
        cuotas_pagadas: 0
      })
      setSelectedFiles([])
      setFileErrors([])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: tipo no permitido`
    }

    const isPdf = file.type === 'application/pdf'
    const maxSize = isPdf ? MAX_SIZE_PDF : MAX_SIZE_IMAGE
    const maxLabel = isPdf ? '3MB' : '5MB'

    if (file.size > maxSize) {
      return `${file.name}: supera ${maxLabel}`
    }

    return null
  }

  const processFiles = (files) => {
    const fileArray = Array.from(files)
    const errors = []
    const valid = []

    for (const file of fileArray) {
      const isDuplicate = selectedFiles.some((f) => f.name === file.name && f.size === file.size)
      if (isDuplicate) continue

      const validationError = validateFile(file)
      if (validationError) {
        errors.push(validationError)
      } else {
        valid.push(file)
      }
    }

    if (errors.length > 0) setFileErrors(errors)
    if (valid.length > 0) setSelectedFiles((prev) => [...prev, ...valid])
  }

  const handleFileChange = (e) => {
    setFileErrors([])
    processFiles(e.target.files || [])
    e.target.value = ''
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setFileErrors([])
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
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
                maxLength={16}
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
                maxLength={20}
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
              maxLength={20}
            />
          </div>
          <div className="input-group-alt">
            <label>
              <List size={16} /> Categoría (Opcional)
            </label>
            <div className="category">
              <select name="categoria_id" value={formData.categoria_id} onChange={handleChange}>
                <option value="">Sin Categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              <div className="add-category" onClick={handleAddCategory}>
                <CirclePlus size={18} />
              </div>
            </div>
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
                  required
                />
              </div>
              <div className="input-group-alt">
                <label>Cuotas</label>
                <input
                  type="number"
                  name="cuotas"
                  value={formData.cuotas}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="6"
                  maxLength={4}
                  min="2"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="section-archivos">
          <label>Facturas / Comprobantes</label>

          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf"
              onChange={handleFileChange}
              className="drop-zone-input"
            />
            <div className="drop-zone-icon">
              <Plus size={28} />
            </div>
            <span className="drop-zone-text">
              {dragActive ? 'Soltar aquí' : 'Arrastrá o hacé clic'}
            </span>
            <span className="drop-zone-hint">IMG hasta 5MB · PDF hasta 3MB</span>
          </div>

          {fileErrors.length > 0 && (
            <div className="archivos-errors">
              {fileErrors.map((error) => (
                <span key={error}>{error}</span>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="archivos-list">
              {selectedFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="archivo-item">
                  <FileText size={16} className="archivo-icon" />
                  <span className="archivo-name">{file.name}</span>
                  <span className="archivo-size">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    className="archivo-remove"
                    onClick={() => removeSelectedFile(idx)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
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
