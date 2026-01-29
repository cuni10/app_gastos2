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
    db.exec('DROP TABLE IF EXISTS autos_papeles;')
    db.exec('DROP TABLE IF EXISTS autos;')
    db.exec('DROP TABLE IF EXISTS historial_gastos;')
    db.exec('DROP TABLE IF EXISTS gastos;')
    db.exec('DROP TABLE IF EXISTS categorias;')
    db.exec(schema)
  },

  // ==================== GASTOS ====================
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
  },

  // ==================== AUTOS ====================
  getAutos: () => {
    return db
      .prepare(
        `SELECT a.*, COUNT(ap.id) as papeles_count 
         FROM autos a 
         LEFT JOIN autos_papeles ap ON a.id = ap.auto_id 
         GROUP BY a.id 
         ORDER BY a.created_at DESC`
      )
      .all()
  },
  getAutoById: (id) => {
    return db.prepare('SELECT * FROM autos WHERE id = ?').get(id)
  },
  insertAuto: (marca, modelo, anio, patente, color, monto_compra, fecha_compra, descripcion) => {
    const info = db
      .prepare(
        `INSERT INTO autos (marca, modelo, anio, patente, color, monto_compra, fecha_compra, descripcion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(marca, modelo, anio, patente, color, monto_compra, fecha_compra, descripcion)
    return info.lastInsertRowid
  },
  updateAuto: (
    id,
    marca,
    modelo,
    anio,
    patente,
    color,
    monto_compra,
    fecha_compra,
    descripcion,
    estado,
    monto_venta,
    fecha_venta
  ) => {
    db.prepare(
      `UPDATE autos SET marca = ?, modelo = ?, anio = ?, patente = ?, color = ?, 
       monto_compra = ?, fecha_compra = ?, descripcion = ?, estado = ?, monto_venta = ?, fecha_venta = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).run(
      marca,
      modelo,
      anio,
      patente,
      color,
      monto_compra,
      fecha_compra,
      descripcion,
      estado,
      monto_venta,
      fecha_venta,
      id
    )
  },
  updateAutoEstado: (id, estado, monto_venta, fecha_venta) => {
    db.prepare(
      `UPDATE autos SET estado = ?, monto_venta = ?, fecha_venta = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(estado, monto_venta, fecha_venta, id)
  },
  deleteAuto: (id) => {
    db.prepare('DELETE FROM autos WHERE id = ?').run(id)
  },

  // ==================== PAPELES ====================
  getPapelesAuto: (auto_id) => {
    return db
      .prepare('SELECT * FROM autos_papeles WHERE auto_id = ? ORDER BY created_at DESC')
      .all(auto_id)
  },
  insertPapel: (auto_id, tipo_papel, descripcion, fecha_obtencion, notas) => {
    const info = db
      .prepare(
        `INSERT INTO autos_papeles (auto_id, tipo_papel, descripcion, fecha_obtencion, notas)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(auto_id, tipo_papel, descripcion, fecha_obtencion, notas)
    return info.lastInsertRowid
  },
  updatePapel: (id, tipo_papel, descripcion, fecha_obtencion, estado, notas) => {
    db.prepare(
      `UPDATE autos_papeles SET tipo_papel = ?, descripcion = ?, fecha_obtencion = ?, 
       estado = ?, notas = ? WHERE id = ?`
    ).run(tipo_papel, descripcion, fecha_obtencion, estado, notas, id)
  },
  updatePapelEstado: (id, estado) => {
    db.prepare('UPDATE autos_papeles SET estado = ? WHERE id = ?').run(estado, id)
  },
  deletePapel: (id) => {
    db.prepare('DELETE FROM autos_papeles WHERE id = ?').run(id)
  }
}

export default dbManager
