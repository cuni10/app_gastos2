import path from 'path'
import dataBase from 'better-sqlite3'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import schema from './schema'

const dirDB = is.dev ? path.join(app.getAppPath(), 'src', 'db') : path.dirname(app.getPath('exe'))
const dbPath = path.join(dirDB, 'gastos.db')
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
  getHistorial: () => {
    return db
      .prepare(
        `
    SELECT 
      h.id,
      g.nombre,
      h.monto_pagado as monto,
      h.fecha_pago as fechaPago,
      c.nombre as categoria,
      g.mensual as esMensual,
      g.fecha_cobro as diaPagoMensual
    FROM historial_gastos h
    JOIN gastos g ON h.gasto_id = g.id
    LEFT JOIN categorias c ON g.categoria_id = c.id
    ORDER BY datetime(h.fecha_pago) DESC, h.id DESC;
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
  insertGasto: (nombre, monto, mensual, fecha, categoria_id) => {
    db.prepare(
      'INSERT INTO gastos (nombre, monto, mensual, fecha_cobro, categoria_id) VALUES (?, ?, ?, ?, ?)'
    ).run(nombre, monto, mensual, fecha, categoria_id)
  },
  insertCategoria: (nombre, descripcion) => {
    db.prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)').run(
      nombre,
      descripcion
    )
  },
  insertGastoConHistorial: (nombre, monto, mensual, fecha, categoria_id) => {
    const crearGasto = db.transaction((gastoData) => {
      const info = db
        .prepare(
          'INSERT INTO gastos (nombre, monto, mensual, fecha_cobro, categoria_id) VALUES (?, ?, ?, ?, ?)'
        )
        .run(
          gastoData.nombre,
          gastoData.monto,
          gastoData.mensual,
          gastoData.fecha,
          gastoData.categoria_id
        )

      const gastoId = info.lastInsertRowid

      db.prepare(
        'INSERT INTO historial_gastos (gasto_id, fecha_pago, monto_pagado) VALUES (?, ?, ?)'
      ).run(gastoId, new Date().toISOString().split('T')[0], gastoData.monto)
    })

    return crearGasto({ nombre, monto, mensual, fecha, categoria_id })
  }
}

export default dbManager
