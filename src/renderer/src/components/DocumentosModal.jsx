import { useState, useEffect, useCallback } from 'react'
import { X, FileText, Image, Download, Trash2, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import PropTypes from 'prop-types'
import '../css/DocumentosModal.css'

const MySwal = withReactContent(Swal)

const DocumentosModal = ({ isOpen, onClose, gasto_id, nombre_gasto, onDocumentChange }) => {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDocumento, setSelectedDocumento] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const loadDocumentos = useCallback(async () => {
    try {
      setLoading(true)
      const docs = await window.api.getDocumentos(gasto_id)
      setDocumentos(docs || [])
    } catch (error) {
      console.error('Error cargando documentos:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los documentos',
        background: 'var(--card-bg)',
        color: 'var(--text-light)',
        confirmButtonColor: 'var(--primary-accent)'
      })
    } finally {
      setLoading(false)
    }
  }, [gasto_id])

  useEffect(() => {
    if (isOpen && gasto_id) {
      loadDocumentos()
    }
  }, [isOpen, gasto_id, loadDocumentos])

  const handleDelete = async (id) => {
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
      try {
        const response = await window.api.deleteDocumento(id)
        if (response.success) {
          setDocumentos((prev) => prev.filter((d) => d.id !== id))
          if (onDocumentChange) onDocumentChange()
          MySwal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: 'Documento eliminado correctamente',
            background: 'var(--card-bg)',
            color: 'var(--text-light)',
            confirmButtonColor: 'var(--primary-accent)'
          })
        }
      } catch {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el documento',
          background: 'var(--card-bg)',
          color: 'var(--text-light)',
          confirmButtonColor: 'var(--primary-accent)'
        })
      }
    }
  }

  const handlePreview = async (documento) => {
    setSelectedDocumento(documento)
    setShowPreview(true)
  }

  const handleDownload = async (documento) => {
    try {
      await window.api.openDocumento(documento.id)
    } catch (error) {
      console.error('Error abriendo documento:', error)
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getCompresionInfo = (documento) => {
    if (!documento.comprimido) return null
    const reduction = ((1 - documento.tamaño_comprimido / documento.tamaño_original) * 100).toFixed(
      0
    )
    return `${reduction}% reducido`
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Documentos: {nombre_gasto}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="loading-state">
                <p>Cargando documentos...</p>
              </div>
            ) : documentos.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <p>No hay documentos adjuntos</p>
              </div>
            ) : (
              <div className="documentos-list">
                {documentos.map((doc) => (
                  <div key={doc.id} className="documento-item">
                    <div className="documento-icon">
                      {doc.tipo === 'pdf' ? <FileText size={32} /> : <Image size={32} />}
                    </div>

                    <div className="documento-info">
                      <p className="documento-nombre">{doc.nombre_original}</p>
                      <div className="documento-meta">
                        <span className="size">{formatSize(doc.tamaño_comprimido)}</span>
                        {doc.comprimido && (
                          <span className="compressed-badge">{getCompresionInfo(doc)}</span>
                        )}
                        <span className="date">
                          {new Date(doc.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>

                    <div className="documento-actions">
                      {doc.tipo === 'imagen' && (
                        <button
                          className="action-btn preview"
                          onClick={() => handlePreview(doc)}
                          title="Vista previa"
                        >
                          <Image size={18} />
                        </button>
                      )}
                      <button
                        className="action-btn download"
                        onClick={() => handleDownload(doc)}
                        title="Descargar/Abrir"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(doc.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPreview && selectedDocumento && (
        <ImagePreview documento={selectedDocumento} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}

const ImagePreview = ({ documento, onClose }) => {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  const [loadingImage, setLoadingImage] = useState(true)

  useEffect(() => {
    const loadImage = async () => {
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
        setLoadingImage(false)
      }
    }
    loadImage()
  }, [documento.id])

  return (
    <>
      <div className="preview-overlay" onClick={onClose}></div>
      <div className="preview-modal">
        <button className="preview-close" onClick={onClose}>
          <X size={28} />
        </button>

        <div className="preview-content">
          {loadingImage ? (
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

        <div className="preview-info">
          <p className="preview-title">{documento.nombre_original}</p>
          <p className="preview-date">
            {new Date(documento.created_at).toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </>
  )
}

export default DocumentosModal

DocumentosModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  gasto_id: PropTypes.number.isRequired,
  nombre_gasto: PropTypes.string.isRequired,
  onDocumentChange: PropTypes.func
}

ImagePreview.propTypes = {
  documento: PropTypes.shape({
    id: PropTypes.number,
    ruta: PropTypes.string.isRequired,
    nombre_original: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
}
