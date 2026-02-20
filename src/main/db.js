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
    db.exec('DROP TABLE IF EXISTS historial_gastos;')
    db.exec('DROP TABLE IF EXISTS gastos;')
    db.exec('DROP TABLE IF EXISTS categorias;')
    db.exec(schema)
  },

  // Delete queries

  delHistorial: (id) => {
    try {
      console.log('Registro de historial eliminado con ID:', id)
      return db.prepare('DELETE FROM historial_gastos WHERE gasto_id = ?').run(id)
    } catch (error) {
      console.error('Error en query de eliminación de gasto:', error)
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
        SELECT gasto_id FROM historial_gastos 
        WHERE strftime('%m', fecha_pago) = ? AND strftime('%Y', fecha_pago) = ?)`
        )
        .all(mes.toString().padStart(2, '0'), anio.toString())

      // Preparamos las sentencias fuera del bucle para mejor rendimiento
      const insertHistorial = db.prepare(
        'INSERT INTO historial_gastos (gasto_id, monto, fecha_pago, numero_cuota) VALUES (?, ?, ?, ?)'
      )
      const updateGasto = db.prepare(
        'UPDATE gastos SET estado = ?, cuotas_pagadas = ? WHERE id = ?'
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
        }
      }
    })
    return transaction()
  }
}

export default dbManager
