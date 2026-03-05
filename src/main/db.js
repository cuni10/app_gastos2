import path from 'path'
import fs from 'fs'
import dataBase from 'better-sqlite3'
import { app } from 'electron'
import schema from './schema'

const isPortable = process.env.PORTABLE_EXECUTABLE_DIR
const folderPath = isPortable
  ? process.env.PORTABLE_EXECUTABLE_DIR
  : path.join(app.getAppPath(), 'src', 'db')

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true })
  console.log('Carpeta creada en: ', folderPath)
}

const dbPath = path.join(folderPath, 'gastos.db')
const db = new dataBase(dbPath)

db.exec(schema)
db.pragma('foreign_keys = ON')

const dbManager = {
  resetDB: () => {
    db.exec('DROP TABLE IF EXISTS sincronizaciones;')
    db.exec('DROP TABLE IF EXISTS documentos_gastos;')
    db.exec('DROP TABLE IF EXISTS historial_gastos;')
    db.exec('DROP TABLE IF EXISTS gastos;')
    db.exec('DROP TABLE IF EXISTS categorias;')
    db.exec(schema)
  },

  // Delete queries

  delHistorial: (historialId) => {
    try {
      db.prepare('DELETE FROM historial_gastos WHERE id = ?').run(historialId)
      console.log('Entrada de historial eliminada con ID:', historialId)
      return { success: true }
    } catch (error) {
      console.error('Error en query de eliminación de historial:', error)
      return { success: false, error: error.message }
    }
  },

  // Get queries

  getHistorial: () => {
    return db
      .prepare(
        `
    SELECT 
      h.id,
      h.gasto_id,
      g.nombre,
      h.monto,
      g.nota,
      h.fecha_pago as fechaPago,
      h.numero_cuota,
      c.nombre as categoria,
      g.estado,
      g.cuotas,
      g.cuotas_pagadas as cuotaActual,
      g.tipo_pago,
      g.fecha_cobro as diaPagoMensual
      
    FROM historial_gastos h
    JOIN gastos g ON h.gasto_id = g.id
    LEFT JOIN categorias c ON g.categoria_id = c.id
    ORDER BY datetime(h.fecha_pago) DESC, h.id DESC;
  `
      )
      .all()
  },
  gethistorialMes: (mes, anio) => {
    return db
      .prepare(
        `
    SELECT 
        h.id,
        g.nombre,
        h.monto,
        g.nota,
        h.fecha_pago as fechaPago,
        h.numero_cuota,
        c.nombre as categoria,
        g.estado,
        g.cuotas,
        g.cuotas_pagadas as cuotaActual
      FROM historial_gastos h
      JOIN gastos g ON h.gasto_id = g.id
      LEFT JOIN categorias c ON g.categoria_id = c.id
      WHERE strftime('%m', h.fecha_pago) = ? 
      AND strftime('%Y', h.fecha_pago) = ?
      ORDER BY datetime(h.fecha_pago) DESC, h.id DESC;
  `
      )
      .all(mes.toString().padStart(2, '0'), anio.toString())
  },
  getHistorialSeisMeses: () => {
    return db
      .prepare(
        `
    SELECT
      CASE strftime('%m', h.fecha_pago)
        WHEN '01' THEN 'Enero' 
        WHEN '02' THEN 'Febrero' 
        WHEN '03' THEN 'Marzo'
        WHEN '04' THEN 'Abril' 
        WHEN '05' THEN 'Mayo' 
        WHEN '06' THEN 'Junio'
        WHEN '07' THEN 'Julio' 
        WHEN '08' THEN 'Agosto' 
        WHEN '09' THEN 'Septiembre'
        WHEN '10' THEN 'Octubre' 
        WHEN '11' THEN 'Noviembre' 
        WHEN '12' THEN 'Diciembre'
      END as mes,
      SUM(h.monto) as total -- Sumamos lo que realmente se pagó en el historial
    FROM historial_gastos h
    JOIN gastos g ON h.gasto_id = g.id
    WHERE h.fecha_pago >= date('now', 'start of month', '-5 months')
    GROUP BY strftime('%m', h.fecha_pago)
    ORDER BY h.fecha_pago ASC;
  `
      )
      .all()
  },
  getGastos: () => {
    return db.prepare('SELECT * FROM gastos').all()
  },
  getCategorias: () => {
    return db.prepare('SELECT * FROM categorias').all()
  },

  // Insert queries

  insertCategoria: (nombre, descripcion) => {
    const info = db
      .prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)')
      .run(nombre, descripcion)
    return { id: info.lastInsertRowid, nombre, descripcion }
  },
  insertGastoConHistorial: (
    nombre,
    monto,
    estado,
    tipo_pago,
    fecha,
    nota,
    cuotas,
    cuotas_pagadas,
    categoria_id,
    cuotaActual
  ) => {
    const crearGasto = db.transaction((gastoData) => {
      const info = db
        .prepare(
          'INSERT INTO gastos (nombre, monto, estado, tipo_pago, fecha_cobro, nota, cuotas, cuotas_pagadas, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          gastoData.nombre,
          gastoData.monto,
          gastoData.estado,
          gastoData.tipo_pago,
          gastoData.fecha,
          gastoData.nota,
          gastoData.cuotas,
          gastoData.cuotas_pagadas,
          gastoData.categoria_id
        )

      const gastoId = info.lastInsertRowid

      const cuotaRegistro = gastoData.cuotaActual || 1

      db.prepare(
        'INSERT INTO historial_gastos (gasto_id, monto, fecha_pago, numero_cuota) VALUES (?, ?, ?, ?)'
      ).run(gastoId, gastoData.monto, new Date().toISOString().split('T')[0], cuotaRegistro)

      return Number(gastoId)
    })

    return crearGasto({
      nombre,
      monto,
      estado,
      tipo_pago,
      fecha,
      nota,
      cuotas,
      cuotas_pagadas,
      cuotaActual,
      categoria_id
    })
  },

  // Update queries

  sincronizarPagosPendientes: () => {
    const date = new Date()
    const mes = date.getMonth() + 1
    const anio = date.getFullYear()

    const transaction = db.transaction(() => {
      const pendientes = db
        .prepare(
          `SELECT * FROM gastos 
      WHERE estado = 'activo'
      AND tipo_pago IN ('cuotas') 
      AND id NOT IN (
        SELECT gasto_id FROM sincronizaciones 
        WHERE mes = ? AND anio = ?)`
        )
        .all(mes, anio)

      // Preparamos las sentencias fuera del bucle para mejor rendimiento
      const insertHistorial = db.prepare(
        'INSERT INTO historial_gastos (gasto_id, monto, fecha_pago, numero_cuota) VALUES (?, ?, ?, ?)'
      )
      const updateGasto = db.prepare(
        'UPDATE gastos SET estado = ?, cuotas_pagadas = ? WHERE id = ?'
      )
      const insertSync = db.prepare(
        'INSERT OR IGNORE INTO sincronizaciones (gasto_id, mes, anio) VALUES (?, ?, ?)'
      )

      for (const gasto of pendientes) {
        if (date.getDate() >= gasto.fecha_cobro) {
          const cuotasPagadas = gasto.cuotas_pagadas + 1
          let nuevoEstado = 'activo'

          insertHistorial.run(
            gasto.id,
            gasto.monto,
            date.toISOString().split('T')[0],
            cuotasPagadas
          )

          if (gasto.tipo_pago === 'cuotas' && gasto.cuotas > 0 && cuotasPagadas >= gasto.cuotas) {
            nuevoEstado = 'finalizado'
          }

          updateGasto.run(nuevoEstado, cuotasPagadas, gasto.id)
          insertSync.run(gasto.id, mes, anio)
        }
      }
    })
    return transaction()
  },

  // Documento queries

  insertDocumento: (
    gasto_id,
    nombre_original,
    nombre_archivo,
    ruta,
    tipo,
    tamaño_original,
    tamaño_comprimido,
    comprimido
  ) => {
    try {
      const info = db
        .prepare(
          `INSERT INTO documentos_gastos 
          (gasto_id, nombre_original, nombre_archivo, ruta, tipo, tamaño_original, tamaño_comprimido, comprimido) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          gasto_id,
          nombre_original,
          nombre_archivo,
          ruta,
          tipo,
          tamaño_original,
          tamaño_comprimido,
          comprimido
        )

      return { success: true, id: info.lastInsertRowid }
    } catch (error) {
      console.error('Error insertando documento:', error)
      return { success: false, error: error.message }
    }
  },

  getDocumentos: (gasto_id) => {
    try {
      return db
        .prepare(
          `SELECT id, gasto_id, nombre_original, nombre_archivo, ruta, tipo, tamaño_original, tamaño_comprimido, comprimido, created_at
           FROM documentos_gastos 
           WHERE gasto_id = ? 
           ORDER BY created_at DESC`
        )
        .all(gasto_id)
    } catch (error) {
      console.error('Error obteniendo documentos:', error)
      return []
    }
  },

  deleteDocumento: (id) => {
    try {
      const documento = db.prepare('SELECT ruta FROM documentos_gastos WHERE id = ?').get(id)

      if (documento) {
        db.prepare('DELETE FROM documentos_gastos WHERE id = ?').run(id)
        return { success: true }
      }

      return { success: false, error: 'Documento no encontrado' }
    } catch (error) {
      console.error('Error eliminando documento:', error)
      return { success: false, error: error.message }
    }
  },

  getDocumento: (id) => {
    try {
      return db.prepare(`SELECT * FROM documentos_gastos WHERE id = ?`).get(id)
    } catch (error) {
      console.error('Error obteniendo documento:', error)
      return null
    }
  },

  getGasto: (id) => {
    try {
      return db
        .prepare(
          `SELECT g.*, c.nombre as categoria_nombre FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id WHERE g.id = ?`
        )
        .get(id)
    } catch (error) {
      console.error('Error obteniendo gasto:', error)
      return null
    }
  },

  updateGasto: (id, data) => {
    try {
      const update = db.transaction(() => {
        db.prepare(
          `UPDATE gastos SET nombre = ?, monto = ?, nota = ?, categoria_id = ? WHERE id = ?`
        ).run(data.nombre, data.monto, data.nota, data.categoria_id, id)

        // Also update monto in historial entries
        db.prepare(`UPDATE historial_gastos SET monto = ? WHERE gasto_id = ?`).run(data.monto, id)
      })
      update()
      return { success: true }
    } catch (error) {
      console.error('Error actualizando gasto:', error)
      return { success: false, error: error.message }
    }
  }
}

export default dbManager
