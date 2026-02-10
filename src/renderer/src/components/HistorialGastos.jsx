import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Calendar,
  Tag,
  CalendarSync,
  Calendar1,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Trash2,
  Paperclip,
  Image,
  File,
  X,
  Upload,
  Eye,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
import '../css/HistorialGastos.css'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import PdfViewer from './PdfViewer'

const HistorialGastos = () => {
  const [historial, setHistorial] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cardIsOpen, setCardIsOpen] = useState(null)
  const [adjuntosMap, setAdjuntosMap] = useState({})
  const [viewerOpen, setViewerOpen] = useState(null)
  const [viewerData, setViewerData] = useState([])
  const [previewFile, setPreviewFile] = useState(null)


  // Zoom & pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.min(5, Math.max(0.3, z + delta)))
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    isPanning.current = true
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const doSetPreviewFile = (file) => {
    setPreviewFile(file)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleToggle = (id) => {
    setCardIsOpen(cardIsOpen === id ? null : id)
  }

  const MySwal = withReactContent(Swal)

  const baseAlert = {
    background: 'var(--bg-dark)',
    color: 'var(--text-light)'
  }

  const handleDelete = async (id) => {
    MySwal.fire({
      ...baseAlert,
      title: '¿Estás seguro?',
      text: 'Esta acción eliminara permanentemente.',
      icon: 'warning',
      iconColor: 'var(--primary-accent)',
      showCancelButton: true,
      cancelButtonColor: 'var(--primary-accent)',
      confirmButtonColor: 'var(--card-bg)',
      confirmButtonText: 'Sí, borrar registro',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          window.api.delHistorial(id)
          setHistorial(historial.filter((gasto) => gasto.id !== id))
          MySwal.fire({
            ...baseAlert,
            title: '¡Borrado!',
            text: 'El registro ha sido eliminado de la base de datos.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: 'var(--primary-accent)'
          })
        } catch (error) {
          MySwal.fire('Error', 'No se pudo borrar: ' + error.message, 'error')
        }
      }
    })
  }

  // --- Adjuntos handlers ---

  const handleUpload = async (historialId) => {
    const result = await window.api.uploadAdjunto(historialId)
    if (result.success) {
      MySwal.fire({
        ...baseAlert,
        title: '¡Archivo cargado!',
        text: `Se adjuntó "${result.nombreOriginal}" correctamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: 'var(--primary-accent)'
      })
      // Refresh adjuntos count
      const adjuntos = await window.api.getAdjuntos(historialId)
      setAdjuntosMap((prev) => ({ ...prev, [historialId]: adjuntos.length }))
    } else if (!result.canceled) {
      MySwal.fire({
        ...baseAlert,
        title: 'Error',
        text: result.error || 'No se pudo cargar el archivo.',
        icon: 'error',
        confirmButtonColor: 'var(--primary-accent)'
      })
    }
  }

  const handleViewAdjuntos = async (historialId) => {
    const adjuntos = await window.api.getAdjuntos(historialId)
    if (adjuntos.length === 0) {
      // No adjuntos — offer to upload
      MySwal.fire({
        ...baseAlert,
        title: 'Sin adjuntos',
        text: '¿Deseas cargar un archivo?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Cargar archivo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'var(--primary-accent)',
        cancelButtonColor: 'var(--card-bg)'
      }).then((result) => {
        if (result.isConfirmed) {
          handleUpload(historialId)
        }
      })
      return
    }
    // Load paths for preview
    const enriched = await Promise.all(
      adjuntos.map(async (adj) => {
        const filePath = await window.api.getAttachmentPath(adj.nombre_archivo)
        return { ...adj, filePath }
      })
    )
    setViewerData(enriched)
    setViewerOpen(historialId)
    setPreviewFile(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleDeleteAdjunto = async (adjuntoId, historialId) => {
    MySwal.fire({
      ...baseAlert,
      title: '¿Eliminar adjunto?',
      text: 'El archivo será eliminado permanentemente.',
      icon: 'warning',
      iconColor: 'var(--primary-accent)',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--card-bg)',
      cancelButtonColor: 'var(--primary-accent)'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await window.api.delAdjunto(adjuntoId)
        const adjuntos = await window.api.getAdjuntos(historialId)
        const enriched = await Promise.all(
          adjuntos.map(async (adj) => {
            const filePath = await window.api.getAttachmentPath(adj.nombre_archivo)
            return { ...adj, filePath }
          })
        )
        setViewerData(enriched)
        setAdjuntosMap((prev) => ({ ...prev, [historialId]: adjuntos.length }))
        setPreviewFile(null)
        setZoom(1)
        setPan({ x: 0, y: 0 })
        if (adjuntos.length === 0) {
          setViewerOpen(null)
        }
      }
    })
  }

  // Load adjuntos counts on mount
  useEffect(() => {
    const fetchHistorial = async () => {
      const datos = await window.api.getHistorial()
      setHistorial(datos)

      // Load adjuntos counts
      const counts = {}
      for (const gasto of datos) {
        const adjuntos = await window.api.getAdjuntos(gasto.id)
        counts[gasto.id] = adjuntos.length
      }
      setAdjuntosMap(counts)
    }

    fetchHistorial()
  }, [])

  const filteredGastos = historial.filter((gasto) =>
    gasto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="container-history">
        <div className="card-history">
        <div className="card-titles">
          <h2 className="history-title">Historial de Gastos</h2>

          <div className="search-container">
            <Search size={24} />
            <input
              type="text"
              placeholder="Nombre del gasto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="expenses-list">
          {filteredGastos.length > 0 ? (
            filteredGastos.map((gasto) => (
              <div key={gasto.id} className="expense-card">
                <div className="wrapper" onClick={() => handleToggle(gasto.id)}>
                  <div className="expense-icon-wrapper">
                    <div className="category-icon">
                      <Tag size={20} />
                    </div>
                  </div>

                  <div className="expense-details">
                    <div className="expense-header">
                      <span className="expense-name">{gasto.nombre}</span>
                    </div>

                    <div className={`expense-note ${gasto.nota ? 'is-active' : ''}`}>
                      <FileText size={16} />
                      <span>{gasto.nota}</span>
                    </div>

                    <div className="expense-info-grid">
                      <div className="info-item">
                        <Calendar size={14} />
                        <span>
                          {gasto.fechaPago
                            ? new Date(gasto.fechaPago).toLocaleDateString('es-AR')
                            : 'Sin fecha'}
                        </span>
                      </div>
                      {gasto.categoria ? (
                        <div className="info-item">
                          <Tag size={14} />
                          <span>{gasto.categoria}</span>
                        </div>
                      ) : (
                        ''
                      )}

                      {gasto.numero_cuota ? (
                        <div className="info-item">
                          <div className="info-item monthly-badge">
                            <CalendarSync size={14} />
                            <span>Mensual (Día {gasto.diaPagoMensual})</span>
                          </div>
                          <div className="info-item monthly-badge">
                            <Calendar1 size={14} />
                            <span>Cuota: {gasto.numero_cuota + '/' + gasto.cuotas}</span>
                          </div>
                        </div>
                      ) : (
                        ''
                      )}
                    </div>
                  </div>
                  <div className="expense-end">
                    <span className="expense-amount">${gasto.monto.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="expense-action">
                    {cardIsOpen === gasto.id ? (
                      <ChevronDown size={20} className="arrow-icon" />
                    ) : (
                      <ChevronRight size={20} className="arrow-icon" />
                    )}
                  </div>
                </div>
                <div className={`card-options ${cardIsOpen === gasto.id ? 'open' : ''}`}>
                  <button
                    className="btn-delete"
                    onClick={() => {
                      handleDelete(gasto.id)
                    }}
                  >
                    <Trash2 /> Eliminar
                  </button>
                  <button
                    className="btn-attach"
                    onClick={() => handleViewAdjuntos(gasto.id)}
                  >
                    <Paperclip size={18} />
                    Adjuntos
                    {adjuntosMap[gasto.id] > 0 && (
                      <span className="attach-badge">{adjuntosMap[gasto.id]}</span>
                    )}
                  </button>
                  <button
                    className="btn-upload"
                    onClick={() => handleUpload(gasto.id)}
                  >
                    <Upload size={18} />
                    Cargar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="not-expense-card">
              <span>No se encontraron registros.</span>
            </div>
          )}
        </div>
      </div>

      {/* Viewer Modal */}
      {viewerOpen && (
        <div className="viewer-overlay" onClick={() => { setViewerOpen(null); setPreviewFile(null) }}>
          <div className="viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-header">
              <h3>
                <Paperclip size={20} /> Adjuntos
              </h3>
              <button className="viewer-close" onClick={() => { setViewerOpen(null); setPreviewFile(null) }}>
                <X size={20} />
              </button>
            </div>

            <div className="viewer-body">
              <div className="attachment-list">
                {viewerData.map((adj) => (
                  <div
                    key={adj.id}
                    className={`attachment-item ${previewFile?.id === adj.id ? 'active' : ''}`}
                  >
                    <div className="attachment-info" onClick={() => doSetPreviewFile(adj)}>
                      {adj.tipo === 'image' ? <Image size={18} /> : <File size={18} />}
                      <span className="attachment-name">{adj.nombre_original}</span>
                    </div>
                    <div className="attachment-actions">
                      <button
                        className="btn-preview-sm"
                        title="Ver"
                        onClick={() => doSetPreviewFile(adj)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-delete-sm"
                        title="Eliminar"
                        onClick={() => handleDeleteAdjunto(adj.id, viewerOpen)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {previewFile && (
                <div className="preview-container">
                  <div
                    className="preview-area"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <div
                      className="preview-content"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        cursor: 'grab'
                      }}
                    >
                      {previewFile.tipo === 'image' ? (
                        <img
                          src={previewFile.filePath}
                          alt={previewFile.nombre_original}
                          className="preview-image"
                          draggable={false}
                        />
                      ) : (
                        <PdfViewer dataUrl={previewFile.filePath} scale={1.2} />
                      )}
                    </div>
                  </div>
                  <div className="preview-toolbar">
                    <span className="preview-filename">{previewFile.nombre_original}</span>
                    <div className="preview-controls">
                      <button className="btn-zoom" onClick={() => setZoom((z) => Math.min(5, z + 0.25))} title="Acercar">
                        <ZoomIn size={16} />
                      </button>
                      <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                      <button className="btn-zoom" onClick={() => setZoom((z) => Math.max(0.3, z - 0.25))} title="Alejar">
                        <ZoomOut size={16} />
                      </button>
                      <button className="btn-zoom" onClick={resetView} title="Restablecer">
                        <RotateCcw size={16} />
                      </button>
                      <button
                        className="btn-print"
                        onClick={() => {
                          // Abrir con el visor predeterminado del sistema (impresión nativa)
                          window.api.openExternal(previewFile.nombre_archivo)
                        }}
                        title="Abrir / Imprimir"
                      >
                        <Printer size={16} /> Abrir / Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="viewer-footer">
              <button
                className="btn-attach"
                onClick={() => {
                  handleUpload(viewerOpen).then(() => handleViewAdjuntos(viewerOpen))
                }}
              >
                <Upload size={18} /> Cargar otro archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    </>
  )
}

export default HistorialGastos
