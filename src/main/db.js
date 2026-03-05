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

// Performance PRAGMAs – must be set before any queries run
db.pragma('journal_mode = WAL') // WAL allows concurrent reads while writing
db.pragma('synchronous = NORMAL') // Safe but faster than FULL
db.pragma('cache_size = -64000') // 64 MB in-memory page cache
db.pragma('temp_store = MEMORY') // Keep temp tables in RAM
db.pragma('foreign_keys = ON')

// Pre-compiled statements (parsed once, reused on every call)
const stmts = {
  getHistorial: db.prepare(`
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
    ORDER BY h.fecha_pago DESC, h.id DESC
  `),

  getHistorialMes: db.prepare(`
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
    WHERE strftime('%m', h.fecha_pago) = ? AND strftime('%Y', h.fecha_pago) = ?
    ORDER BY h.fecha_pago DESC, h.id DESC
  `),

  getHistorialSeisMeses: db.prepare(`
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
      SUM(h.monto) as total
    FROM historial_gastos h
    JOIN gastos g ON h.gasto_id = g.id
    WHERE h.fecha_pago >= date('now', 'start of month', '-5 months')
    GROUP BY strftime('%m', h.fecha_pago)
    ORDER BY h.fecha_pago ASC
  `),

  getGastos: db.prepare('SELECT * FROM gastos'),

  getCategorias: db.prepare('SELECT * FROM categorias'),

  insertCategoria: db.prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)'),

  insertGasto: db.prepare(
    'INSERT INTO gastos (nombre, monto, estado, tipo_pago, fecha_cobro, nota, cuotas, cuotas_pagadas, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ),

  insertHistorial: db.prepare(
    'INSERT INTO historial_gastos (gasto_id, monto, fecha_pago, numero_cuota) VALUES (?, ?, ?, ?)'
  ),

  delHistorial: db.prepare('DELETE FROM historial_gastos WHERE gasto_id = ?'),

  getPendientes: db.prepare(`
    SELECT * FROM gastos
    WHERE estado = 'activo'
      AND tipo_pago IN ('cuotas')
      AND id NOT IN (
        SELECT gasto_id FROM historial_gastos
        WHERE strftime('%m', fecha_pago) = ? AND strftime('%Y', fecha_pago) = ?
      )
  `),

  updateGasto: db.prepare('UPDATE gastos SET estado = ?, cuotas_pagadas = ? WHERE id = ?')
}

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
      return stmts.delHistorial.run(id)
    } catch (error) {
      console.error('Error en query de eliminación de gasto:', error)
      return { success: false, error: error.message }
    }
  },

  // Get queries

  getHistorial: () => {
    return stmts.getHistorial.all()
  },
  gethistorialMes: (mes, anio) => {
    return stmts.getHistorialMes.all(mes.toString().padStart(2, '0'), anio.toString())
  },
  getHistorialSeisMeses: () => {
    return stmts.getHistorialSeisMeses.all()
  },
  getGastos: () => {
    return stmts.getGastos.all()
  },
  getCategorias: () => {
    return stmts.getCategorias.all()
  },

  // Insert queries

  insertCategoria: (nombre, descripcion) => {
    const info = stmts.insertCategoria.run(nombre, descripcion)
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
      const info = stmts.insertGasto.run(
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

      stmts.insertHistorial.run(
        gastoId,
        gastoData.monto,
        new Date().toISOString().split('T')[0],
        cuotaRegistro
      )
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
      const pendientes = stmts.getPendientes.all(mes.toString().padStart(2, '0'), anio.toString())

      for (const gasto of pendientes) {
        if (date.getDate() >= gasto.fecha_cobro) {
          const cuotasPagadas = gasto.cuotas_pagadas + 1
          let nuevoEstado = 'activo'

          stmts.insertHistorial.run(
            gasto.id,
            gasto.monto,
            date.toISOString().split('T')[0],
            cuotasPagadas
          )

          if (gasto.tipo_pago === 'cuotas' && gasto.cuotas > 0 && cuotasPagadas >= gasto.cuotas) {
            nuevoEstado = 'finalizado'
          }

          stmts.updateGasto.run(nuevoEstado, cuotasPagadas, gasto.id)
        }
      }
    })
    return transaction()
  }
}

export default dbManager
