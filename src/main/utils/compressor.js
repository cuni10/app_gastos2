import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Límites de tamaño en bytes
const LIMITS = {
  imagen: 5 * 1024 * 1024, // 5 MB
  pdf: 3 * 1024 * 1024 // 3 MB
}

/**
 * Obtiene información del archivo
 */
export const getFileInfo = (filePath) => {
  try {
    const stats = fs.statSync(filePath)
    return {
      size: stats.size,
      path: filePath,
      name: path.basename(filePath)
    }
  } catch (error) {
    throw new Error(`Error al leer archivo: ${error.message}`)
  }
}

/**
 * Determina el tipo de archivo
 */
export const getFileType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext)) {
    return 'imagen'
  }
  if (ext === '.pdf') {
    return 'pdf'
  }
  throw new Error(`Tipo de archivo no soportado: ${ext}`)
}

/**
 * Valida el tamaño del archivo
 */
export const validateFileSize = (filePath, fileType) => {
  const fileInfo = getFileInfo(filePath)
  const limit = LIMITS[fileType]

  if (!limit) {
    throw new Error(`Tipo de archivo desconocido: ${fileType}`)
  }

  return {
    isValid: fileInfo.size <= limit,
    size: fileInfo.size,
    limit: limit,
    needsCompression: fileInfo.size > limit * 0.7 // Comprimir si ocupa >70% del límite
  }
}

/**
 * Comprime imágenes a WebP o JPG
 */
export const compressImage = async (inputPath, outputPath) => {
  try {
    const ext = path.extname(inputPath).toLowerCase()
    let pipeline = sharp(inputPath)

    // Optimizar según el formato original
    if (['.png', '.gif'].includes(ext)) {
      // Convertir a WebP para mejor compresión
      pipeline = pipeline.webp({ quality: 80, effort: 6 })
    } else {
      // JPG/JPEG - optimizar como JPG
      pipeline = pipeline.jpeg({ quality: 85, progressive: true })
    }

    await pipeline.toFile(outputPath)

    const originalSize = fs.statSync(inputPath).size
    const compressedSize = fs.statSync(outputPath).size
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(2)

    console.log(`Imagen comprimida: ${reduction}% de reducción`)

    return {
      success: true,
      originalSize,
      compressedSize,
      reduction: parseFloat(reduction),
      format: ['.png', '.gif'].includes(ext) ? 'webp' : 'jpeg'
    }
  } catch (error) {
    throw new Error(`Error al comprimir imagen: ${error.message}`)
  }
}

/**
 * Procesa un documento (imagen o PDF)
 * Retorna la ruta del archivo final (comprimido o original)
 */
export const processDocument = async (inputPath, outputDir, fileName) => {
  try {
    // Validar tipo
    const fileType = getFileType(inputPath)

    // Validar tamaño
    const sizeValidation = validateFileSize(inputPath, fileType)

    console.log(`Procesando ${fileType}:`, {
      size: sizeValidation.size,
      limit: sizeValidation.limit,
      needsCompression: sizeValidation.needsCompression
    })

    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Para PDFs, solo copiar (no comprimimos PDFs)
    if (fileType === 'pdf') {
      if (!sizeValidation.isValid) {
        throw new Error(
          `PDF muy grande: ${(sizeValidation.size / 1024 / 1024).toFixed(2)}MB (máximo 3MB)`
        )
      }

      const outputPath = path.join(outputDir, fileName)
      fs.copyFileSync(inputPath, outputPath)

      return {
        success: true,
        fileType: 'pdf',
        originalSize: sizeValidation.size,
        compressedSize: sizeValidation.size,
        filePath: outputPath,
        compressed: false
      }
    }

    // Para imágenes
    if (!sizeValidation.isValid) {
      throw new Error(
        `Imagen muy grande: ${(sizeValidation.size / 1024 / 1024).toFixed(2)}MB (máximo 5MB)`
      )
    }

    if (sizeValidation.needsCompression) {
      const ext = path.extname(inputPath).toLowerCase()
      const newExt = ['.png', '.gif'].includes(ext) ? '.webp' : '.jpg'
      const compressedFileName = fileName.replace(/\.[^.]+$/, newExt)
      const outputPath = path.join(outputDir, compressedFileName)

      const result = await compressImage(inputPath, outputPath)

      return {
        success: true,
        fileType: 'imagen',
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        filePath: outputPath,
        compressed: true,
        reduction: result.reduction
      }
    } else {
      // Imagen pequeña, solo copiar
      const outputPath = path.join(outputDir, fileName)
      fs.copyFileSync(inputPath, outputPath)

      return {
        success: true,
        fileType: 'imagen',
        originalSize: sizeValidation.size,
        compressedSize: sizeValidation.size,
        filePath: outputPath,
        compressed: false
      }
    }
  } catch (error) {
    throw new Error(`Error procesando documento: ${error.message}`)
  }
}

/**
 * Genera nombre único para archivo
 */
export const generateUniqueFileName = (originalFileName) => {
  const ext = path.extname(originalFileName)
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `${timestamp}-${random}${ext}`
}

/**
 * Elimina archivo de disco
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    console.error(`Error eliminando archivo: ${error.message}`)
    return false
  }
}
