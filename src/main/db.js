import path from 'path'
import fs from 'fs'
import dataBase from 'better-sqlite3'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import schema from './schema'

const dirDB = is.dev ? path.join(app.getAppPath(), 'src', 'db') : path.dirname(app.getPath('exe'))

if (!fs.existsSync(dirDB)) {
  fs.mkdirSync(dirDB, { recursive: true })
  console.log('Carpeta creada en: ', dirDB)
}

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
      g.monto,
      g.nota,
      h.fecha_pago as fechaPago,
      c.nombre as categoria,
      g.mensual as esMensual,
      g.cuotas as cuotas,
      g.fecha_cobro as diaPagoMensual
      
    FROM historial_gastos h
    JOIN gastos g ON h.gasto_id = g.id
    LEFT JOIN categorias c ON g.categoria_id = c.id
    ORDER BY datetime(h.fecha_pago) DESC, h.id DESC;
  `
      )
      .all()
  },
  gethistorialMes: () => {
    return db.prepare(
      `
    SELECT * FROM historial_gastos 
    WHERE strftime('%m', fechaPago) = ? 
    AND strftime('%Y', fechaPago) = ?
    ORDER BY fechaPago DESC;
  `
    )
  },
  getGastos: () => {
    return db.prepare('SELECT * FROM gastos').all()
  },
  getCategorias: () => {
    return db.prepare('SELECT * FROM categorias').all()
  },
  insertCategoria: (nombre, descripcion) => {
    db.prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)').run(
      nombre,
      descripcion
    )
  },
  insertGastoConHistorial: (nombre, monto, mensual, fecha, nota, cuotas, categoria_id) => {
    const crearGasto = db.transaction((gastoData) => {
      const info = db
        .prepare(
          'INSERT INTO gastos (nombre, monto, mensual, fecha_cobro, nota, cuotas, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          gastoData.nombre,
          gastoData.monto,
          gastoData.mensual,
          gastoData.fecha,
          gastoData.nota,
          gastoData.cuotas,
          gastoData.categoria_id
        )

      const gastoId = info.lastInsertRowid

      db.prepare('INSERT INTO historial_gastos (gasto_id, fecha_pago) VALUES (?, ?)').run(
        gastoId,
        new Date().toISOString().split('T')[0]
      )
    })

    return crearGasto({ nombre, monto, mensual, fecha, nota, cuotas, categoria_id })
  }
}

export default dbManager
