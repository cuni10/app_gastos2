import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// Componente interno para renderizar una sola página
const PdfSinglePage = ({ pdfDoc, pageNumber, scale, onLoadSuccess }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let cancelled = false

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber)
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: ctx,
          viewport
        }).promise

        if (!cancelled && onLoadSuccess) onLoadSuccess()
      } catch (err) {
        if (!cancelled) console.error(`Error rendering page ${pageNumber}:`, err)
      }
    }
    renderPage()
    return () => {
      cancelled = true
    }
  }, [pdfDoc, pageNumber, scale])

  return <canvas ref={canvasRef} className="pdf-canvas" style={{ marginBottom: '20px' }} />
}

const PdfViewer = ({ dataUrl, scale = 1.2 }) => {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)

  // Load PDF document
  useEffect(() => {
    let cancelled = false
    const loadPdf = async () => {
      try {
        if (!dataUrl) return

        let doc
        if (dataUrl.startsWith('data:')) {
          // Legacy: Base64 data URI
          const base64 = dataUrl.split(',')[1]
          if (!base64) return
          const binary = atob(base64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
          doc = await pdfjsLib.getDocument({ data: bytes }).promise
        } else {
          // New: Stream from URL (attachments://)
          doc = await pdfjsLib.getDocument(dataUrl).promise
        }

        if (!cancelled) {
          setPdfDoc(doc)
          setNumPages(doc.numPages)
          setCurrentPage(1)
        }
      } catch (err) {
        console.error('Error loading PDF:', err)
      }
    }
    loadPdf()
    return () => {
      cancelled = true
    }
  }, [dataUrl])

  if (!pdfDoc) return <div className="pdf-loading">Cargando documento...</div>

  // Modo Visor: Paginación
  return (
    <div className="pdf-viewer-container">
      <PdfSinglePage pdfDoc={pdfDoc} pageNumber={currentPage} scale={scale} />
      
      {numPages > 1 && (
        <div className="pdf-pagination">
          <button
            className="pdf-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <span className="pdf-page-info">
            {currentPage} / {numPages}
          </span>
          <button
            className="pdf-page-btn"
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

export default PdfViewer
