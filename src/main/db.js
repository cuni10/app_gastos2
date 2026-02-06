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

  //Delete queries

  delHistorial: (id) => {
    try {
      return db.prepare('DELETE FROM historial_gastos WHERE gasto_id = ?').run(id)
    } catch (error) {
      console.error('Error en query de eliminación de gasto:', error)
      return { success: false, error: error.message }
    }
  },

  //Get queries

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
  gethistorialMes: (mes, anio) => {
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
        g.mensual as esMensual
      FROM historial_gastos h
      JOIN gastos g ON h.gasto_id = g.id
      LEFT JOIN categorias c ON g.categoria_id = c.id
      WHERE strftime('%m', h.fecha_pago) = ? 
      AND strftime('%Y', h.fecha_pago) = ?
      ORDER BY datetime(h.fecha_pago) DESC, h.id DESC;
  `
      )
      .all(mes, anio)
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
      SUM(g.monto) as total
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
