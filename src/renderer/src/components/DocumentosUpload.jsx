import { useState } from 'react'
import PropTypes from 'prop-types'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import '../css/DocumentosUpload.css'

const DocumentosUpload = ({ gasto_id, onDocumentosUploaded, disabled = false }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [errors, setErrors] = useState([])

  const MAX_SIZE_IMAGE = 5 * 1024 * 1024 // 5 MB
  const MAX_SIZE_PDF = 3 * 1024 * 1024 // 3 MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'application/pdf'
  ]

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: tipo de archivo no permitido`
    }

    const isPDF = file.type === 'application/pdf'
    const maxSize = isPDF ? MAX_SIZE_PDF : MAX_SIZE_IMAGE
    const maxSizeMB = isPDF ? 3 : 5

    if (file.size > maxSize) {
      return `${file.name}: debe ser menor a ${maxSizeMB}MB`
    }

    return null
  }

  const handleFiles = async (files) => {
    const fileArray = Array.from(files)
    const newErrors = []
    const validFiles = []

    // Validar archivos
    fileArray.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    if (validFiles.length === 0) return

    // Subir archivos
    setUploading(true)
    const uploadedList = []

    for (const file of validFiles) {
      try {
        const path = file.path // Electron proporciona la ruta del archivo
        const response = await window.api.uploadDocumento(gasto_id, path)

        if (response.success) {
          uploadedList.push({
            id: response.id,
            nombre: response.nombre_original,
            tipo: response.fileType,
            tamaño: response.compressedSize,
            comprimido: response.compressed,
            reduction: response.reduction
          })
        } else {
          newErrors.push(`Error al subir ${file.name}: ${response.error}`)
        }
      } catch (error) {
        newErrors.push(`Error al subir ${file.name}: ${error.message}`)
      }
    }

    setUploadedDocs((prev) => [...prev, ...uploadedList])
    setErrors(newErrors)
    setUploading(false)

    if (uploadedList.length > 0 && onDocumentosUploaded) {
      onDocumentosUploaded(uploadedList)
    }
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

    if (!disabled && !uploading) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeUploadedDoc = (index) => {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== index))
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="documentos-upload">
      <div
        className={`upload-area ${dragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf"
          onChange={handleChange}
          disabled={disabled || uploading}
          className="file-input"
        />

        <label htmlFor="file-input" className={`upload-label ${uploading ? 'uploading' : ''}`}>
          <Upload size={40} />
          <h3>Arrastra archivos aquí</h3>
          <p>o haz clic para seleccionar</p>
          <span className="file-info">JPG, PNG, PDF • Imágenes: max 5MB • PDF: max 3MB</span>
        </label>
      </div>

      {errors.length > 0 && (
        <div className="errors-container">
          {errors.map((error, idx) => (
            <div key={idx} className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {uploadedDocs.length > 0 && (
        <div className="uploaded-docs">
          <h4>Documentos cargados</h4>
          <div className="docs-list">
            {uploadedDocs.map((doc, idx) => (
              <div key={idx} className="uploaded-item">
                <div className="item-icon">
                  <CheckCircle size={20} />
                </div>
                <div className="item-info">
                  <p className="item-name">{doc.nombre}</p>
                  <div className="item-meta">
                    <span className="item-size">{formatSize(doc.tamaño)}</span>
                    {doc.comprimido && (
                      <span className="item-badge">Optimizado ({doc.reduction}%)</span>
                    )}
                  </div>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeUploadedDoc(idx)}
                  title="Remover de lista"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentosUpload

DocumentosUpload.propTypes = {
  gasto_id: PropTypes.number.isRequired,
  onDocumentosUploaded: PropTypes.func,
  disabled: PropTypes.bool
}

DocumentosUpload.defaultProps = {
  onDocumentosUploaded: null,
  disabled: false
}
