import { useState, useEffect, useRef } from 'react'
import {
  X,
  Save,
  DollarSign,
  Tag,
  FileText,
  List,
  CirclePlus,
  Plus,
  Image,
  Download,
  Trash2,
  AlertCircle
} from 'lucide-react'
import PropTypes from 'prop-types'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { showAddCategoryAlert } from './categoryAlert'
import '../css/EditarGastoModal.css'

const MySwal = withReactContent(Swal)

const EditarGastoModal = ({ isOpen, onClose, gastoId, onUpdate }) => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    nota: '',
    categoria_id: ''
  })

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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([])
      setFileErrors([])
      setDragActive(false)
      setPreviewDoc(null)
      setDocumentos([])
      setFormData({ nombre: '', monto: '', nota: '', categoria_id: '' })
      return
    }
    if (!gastoId) return

    const loadData = async () => {
      setLoading(true)
      try {
        const [gasto, cats, docs] = await Promise.all([
          window.api.getGasto(gastoId),
          window.api.getCategorias(),
          window.api.getDocumentos(gastoId)
        ])

        setCategorias(cats || [])
        setDocumentos(docs || [])

        if (gasto) {
          setFormData({
            nombre: gasto.nombre || '',
            monto: gasto.monto ? new Intl.NumberFormat('es-AR').format(gasto.monto) : '',
            nota: gasto.nota || '',
            categoria_id: gasto.categoria_id ? gasto.categoria_id.toString() : ''
          })
        }
      } catch (error) {
        console.error('Error cargando gasto:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isOpen, gastoId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      let newValue = value
      if (name === 'monto') {
        const rawValue = value.replace(/\D/g, '')
        newValue = rawValue === '' ? '' : new Intl.NumberFormat('es-AR').format(parseInt(rawValue))
      }
      return { ...prev, [name]: newValue }
    })
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updateData = {
        nombre: formData.nombre,
        monto: Number(formData.monto.toString().replace(/\./g, '')),
        nota: formData.nota || null,
        categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null
      }

      const result = await window.api.updateGasto(gastoId, updateData)

      // Upload new files
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const filePath = window.api.getFilePath(file)
          await window.api.uploadDocumento(gastoId, filePath)
        }
        // Reload documents list
        const docs = await window.api.getDocumentos(gastoId)
        setDocumentos(docs || [])
      }

      if (result.success) {
        setSelectedFiles([])
        setFileErrors([])
        onUpdate?.()
        onClose()
        MySwal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'El gasto fue modificado correctamente',
          background: 'var(--card-bg)',
          color: 'var(--text-light)',
          confirmButtonColor: 'var(--primary-accent)',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Error actualizando gasto:', error)
    } finally {
      setSaving(false)
    }
  }

  // --- File handling ---
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) return `${file.name}: tipo no permitido`
    const isPdf = file.type === 'application/pdf'
    const maxSize = isPdf ? MAX_SIZE_PDF : MAX_SIZE_IMAGE
    if (file.size > maxSize) return `${file.name}: supera ${isPdf ? '3MB' : '5MB'}`
    return null
  }

  const processFiles = (files) => {
    const errors = []
    const valid = []
    for (const file of Array.from(files)) {
      const isDuplicate = selectedFiles.some((f) => f.name === file.name && f.size === file.size)
      if (isDuplicate) continue
      const err = validateFile(file)
      if (err) errors.push(err)
      else valid.push(file)
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
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setFileErrors([])
    if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files)
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // --- Document actions ---
  const handleDeleteDoc = async (id) => {
    const result = await MySwal.fire({
      title: '¿Eliminar documento?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--card-bg)',
      color: 'var(--text-light)',
      confirmButtonColor: 'var(--primary-accent)',
      cancelButtonColor: 'var(--card-bg)'
    })
    if (result.isConfirmed) {
      await window.api.deleteDocumento(id)
      setDocumentos((prev) => prev.filter((d) => d.id !== id))
    }
  }

  const handleOpenDoc = async (doc) => {
    await window.api.openDocumento(doc.id)
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <>
      <div className="edit-overlay" onClick={onClose}>
        <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="edit-modal-header">
            <h2>Editar Gasto</h2>
            <button className="edit-modal-close" onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          {loading ? (
            <div className="edit-loading">
              <p>Cargando...</p>
            </div>
          ) : (
            <form className="edit-modal-body" onSubmit={handleSubmit}>
              <div className="edit-section">
                <div className="input-group-alt">
                  <label>Monto</label>
                  <div className="input-with-icon">
                    <DollarSign size={20} />
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
                  <label>Nombre</label>
                  <div className="input-with-icon">
                    <Tag size={18} />
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

              <div className="edit-section-row">
                <div className="input-group-alt">
                  <label>
                    <FileText size={14} /> Nota
                  </label>
                  <input
                    type="text"
                    name="nota"
                    value={formData.nota}
                    onChange={handleChange}
                    placeholder="Detalle..."
                    maxLength={20}
                  />
                </div>
                <div className="input-group-alt">
                  <label>
                    <List size={14} /> Categoría
                  </label>
                  <div className="category">
                    <select
                      name="categoria_id"
                      value={formData.categoria_id}
                      onChange={handleChange}
                    >
                      <option value="">Sin Categoría</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                    <div className="add-category" onClick={handleAddCategory}>
                      <CirclePlus size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing documents */}
              {documentos.length > 0 && (
                <div className="edit-docs-section">
                  <label>Documentos adjuntos</label>
                  <div className="edit-docs-list">
                    {documentos.map((doc) => (
                      <div key={doc.id} className="edit-doc-item">
                        <div className="edit-doc-icon">
                          {doc.tipo === 'pdf' ? <FileText size={18} /> : <Image size={18} />}
                        </div>
                        <span className="edit-doc-name">{doc.nombre_original}</span>
                        <span className="edit-doc-size">{formatSize(doc.tamaño_comprimido)}</span>
                        <div className="edit-doc-actions">
                          {doc.tipo === 'imagen' && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              title="Vista previa"
                            >
                              <Image size={14} />
                            </button>
                          )}
                          <button type="button" onClick={() => handleOpenDoc(doc)} title="Abrir">
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            className="doc-delete"
                            onClick={() => handleDeleteDoc(doc.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drop zone for new files */}
              <div className="edit-docs-section">
                <label>Agregar documentos</label>
                <div
                  className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
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
                    <Plus size={24} />
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
                        <FileText size={14} className="archivo-icon" />
                        <span className="archivo-name">{file.name}</span>
                        <span className="archivo-size">{(file.size / 1024).toFixed(0)} KB</span>
                        <button
                          type="button"
                          className="archivo-remove"
                          onClick={() => removeSelectedFile(idx)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="edit-btn-save" disabled={saving}>
                {saving ? (
                  'Guardando...'
                ) : (
                  <>
                    <Save size={18} /> Guardar Cambios
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {previewDoc && (
        <ImagePreviewInline documento={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  )
}

const ImagePreviewInline = ({ documento, onClose }) => {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  const [loadingImg, setLoadingImg] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.api.getDocumentoData(documento.id)
        if (result.success) {
          setImageSrc(`data:${result.mime};base64,${result.data}`)
        } else {
          setImageError(true)
        }
      } catch {
        setImageError(true)
      } finally {
        setLoadingImg(false)
      }
    }
    load()
  }, [documento.id])

  return (
    <>
      <div className="preview-overlay" onClick={onClose}></div>
      <div className="preview-modal">
        <button className="preview-close" onClick={onClose}>
          <X size={28} />
        </button>
        <div className="preview-content">
          {loadingImg ? (
            <div className="preview-error">
              <p>Cargando...</p>
            </div>
          ) : imageError ? (
            <div className="preview-error">
              <AlertCircle size={48} />
              <p>No se pudo cargar la imagen</p>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={documento.nombre_original}
              onError={() => setImageError(true)}
              className="preview-image"
            />
          )}
        </div>
      </div>
    </>
  )
}

EditarGastoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  gastoId: PropTypes.number,
  onUpdate: PropTypes.func
}

ImagePreviewInline.propTypes = {
  documento: PropTypes.shape({
    id: PropTypes.number,
    nombre_original: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
}

export default EditarGastoModal
