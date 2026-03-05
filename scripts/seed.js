/**
 * Script para poblar la base de datos con datos de prueba.
 * Ejecutar: node scripts/seed.js
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbDir = path.join(__dirname, '..', 'src', 'db')
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const dbPath = path.join(dbDir, 'gastos.db')
const db = new Database(dbPath)

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT
  );
  CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    monto INTEGER NOT NULL, 
    estado TEXT NOT NULL,
    tipo_pago TEXT DEFAULT 'unico',
    fecha_cobro INTEGER,
    nota TEXT,
    cuotas INTEGER DEFAULT 1,
    cuotas_pagadas INTEGER DEFAULT 0,
    categoria_id INTEGER, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
  );
  CREATE TABLE IF NOT EXISTS historial_gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gasto_id INTEGER NOT NULL,
    monto INTEGER NOT NULL,
    fecha_pago DATE NOT NULL,
    numero_cuota INTEGER,
    FOREIGN KEY (gasto_id) REFERENCES gastos(id)
  );
  CREATE TABLE IF NOT EXISTS documentos_gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gasto_id INTEGER NOT NULL,
    nombre_original TEXT NOT NULL,
    nombre_archivo TEXT NOT NULL,
    ruta TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tamaño_original INTEGER,
    tamaño_comprimido INTEGER,
    comprimido BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gasto_id) REFERENCES gastos(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS sincronizaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gasto_id INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    UNIQUE(gasto_id, mes, anio),
    FOREIGN KEY (gasto_id) REFERENCES gastos(id) ON DELETE CASCADE
  );
`)

db.pragma('foreign_keys = ON')

// --- Categorías ---
const insertCat = db.prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)')
const categorias = [
  ['Seguros', 'Seguros de vehículos y locales'],
  ['Repuestos', 'Autopartes y accesorios'],
  ['Servicios', 'Agua, luz, internet, etc.'],
  ['Sueldos', 'Sueldos del personal'],
  ['Alquiler', 'Alquiler del local'],
  ['Impuestos', 'IIBB, monotributo, etc.'],
  ['Herramientas', 'Herramientas de taller'],
  ['Limpieza', 'Productos de limpieza'],
  ['Publicidad', 'Marketing y publicidad'],
  ['Varios', 'Gastos varios']
]
const catIds = {}
for (const [nombre, desc] of categorias) {
  const info = insertCat.run(nombre, desc)
  catIds[nombre] = Number(info.lastInsertRowid)
}
console.log(`✔ ${categorias.length} categorías creadas`)

// --- Gastos y Historial ---
const insertGasto = db.prepare(
  'INSERT INTO gastos (nombre, monto, estado, tipo_pago, fecha_cobro, nota, cuotas, cuotas_pagadas, categoria_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
)
const insertHist = db.prepare(
  'INSERT INTO historial_gastos (gasto_id, monto, fecha_pago, numero_cuota) VALUES (?, ?, ?, ?)'
)
const insertSync = db.prepare(
  'INSERT OR IGNORE INTO sincronizaciones (gasto_id, mes, anio) VALUES (?, ?, ?)'
)

function randomDate(monthsBack) {
  const d = new Date()
  d.setMonth(d.getMonth() - Math.floor(Math.random() * monthsBack))
  d.setDate(1 + Math.floor(Math.random() * 28))
  return d.toISOString().split('T')[0]
}

const seed = db.transaction(() => {
  // Gastos únicos (variados, últimos 6 meses)
  const gastosUnicos = [
    { nombre: 'Filtro de aceite', monto: 15000, cat: 'Repuestos', nota: 'Toyota Hilux' },
    { nombre: 'Pastillas freno', monto: 32000, cat: 'Repuestos', nota: 'Delanteras' },
    { nombre: 'Aceite Motul 5W30', monto: 28000, cat: 'Repuestos', nota: '4 litros' },
    { nombre: 'Kit distribución', monto: 85000, cat: 'Repuestos', nota: 'VW Gol' },
    { nombre: 'Amortiguadores', monto: 120000, cat: 'Repuestos', nota: 'Par trasero' },
    { nombre: 'Bujías NGK', monto: 18000, cat: 'Repuestos', nota: 'x4 unidades' },
    { nombre: 'Luz del taller', monto: 45000, cat: 'Servicios', nota: null },
    { nombre: 'Internet', monto: 22000, cat: 'Servicios', nota: 'Fibra óptica' },
    { nombre: 'Agua', monto: 8500, cat: 'Servicios', nota: null },
    { nombre: 'Llave torque', monto: 65000, cat: 'Herramientas', nota: 'Stanley' },
    { nombre: 'Compresor', monto: 180000, cat: 'Herramientas', nota: 'Gamma 50L' },
    { nombre: 'Crickets', monto: 42000, cat: 'Herramientas', nota: '2 toneladas' },
    { nombre: 'Detergente', monto: 5200, cat: 'Limpieza', nota: null },
    { nombre: 'Lavandina', monto: 3800, cat: 'Limpieza', nota: '5 litros' },
    { nombre: 'Escobas', monto: 7500, cat: 'Limpieza', nota: 'x3' },
    { nombre: 'Flyers', monto: 15000, cat: 'Publicidad', nota: '500 unidades' },
    { nombre: 'Google Ads', monto: 25000, cat: 'Publicidad', nota: 'Campaña marzo' },
    { nombre: 'Monotributo', monto: 35000, cat: 'Impuestos', nota: 'Cat. E' },
    { nombre: 'IIBB', monto: 28000, cat: 'Impuestos', nota: 'Bimestral' },
    { nombre: 'Sellador', monto: 4500, cat: 'Varios', nota: 'Silicona' },
    { nombre: 'Pintura', monto: 22000, cat: 'Varios', nota: 'Esmalte sintético' },
    { nombre: 'Matafuego', monto: 35000, cat: 'Varios', nota: 'Recarga anual' },
    { nombre: 'Café y galletitas', monto: 8500, cat: 'Varios', nota: 'Oficina' },
    { nombre: 'Almuerzo equipo', monto: 45000, cat: 'Varios', nota: 'Asado viernes' }
  ]

  for (const g of gastosUnicos) {
    const fecha = randomDate(6)
    const info = insertGasto.run(
      g.nombre,
      g.monto,
      'finalizado',
      'unico',
      null,
      g.nota,
      1,
      0,
      catIds[g.cat],
      fecha
    )
    insertHist.run(Number(info.lastInsertRowid), g.monto, fecha, 1)
  }
  console.log(`✔ ${gastosUnicos.length} gastos únicos creados`)

  // Gastos mensuales (con múltiples cuotas en historial)
  const gastosMensuales = [
    {
      nombre: 'Alquiler local',
      monto: 350000,
      cat: 'Alquiler',
      nota: 'Av. San Martín',
      cuotas: 12,
      dia: 10
    },
    { nombre: 'Seguro local', monto: 55000, cat: 'Seguros', nota: 'La Caja', cuotas: 12, dia: 1 },
    {
      nombre: 'Seguro camioneta',
      monto: 78000,
      cat: 'Seguros',
      nota: 'Zurich',
      cuotas: 6,
      dia: 15
    },
    { nombre: 'Sueldo Juan', monto: 650000, cat: 'Sueldos', nota: 'Mecánico', cuotas: 12, dia: 5 },
    { nombre: 'Sueldo Pedro', monto: 580000, cat: 'Sueldos', nota: 'Ayudante', cuotas: 12, dia: 5 },
    {
      nombre: 'Hosting web',
      monto: 12000,
      cat: 'Servicios',
      nota: 'Plan anual',
      cuotas: 12,
      dia: 20
    },
    {
      nombre: 'Préstamo banco',
      monto: 95000,
      cat: 'Varios',
      nota: 'Cuota fija',
      cuotas: 24,
      dia: 12
    }
  ]

  for (const g of gastosMensuales) {
    const cuotasPagadas = Math.min(g.cuotas, 3 + Math.floor(Math.random() * 3)) // 3-5 cuotas pagadas
    const info = insertGasto.run(
      g.nombre,
      g.monto,
      'activo',
      'cuotas',
      g.dia,
      g.nota,
      g.cuotas,
      cuotasPagadas,
      catIds[g.cat],
      new Date(2025, 9, 1).toISOString() // creado ~oct 2025
    )
    const gastoId = Number(info.lastInsertRowid)

    // Crear historial de cuotas pagadas
    for (let c = 1; c <= cuotasPagadas; c++) {
      const d = new Date(2025, 9 + c, g.dia) // oct+1, oct+2, etc.
      insertHist.run(gastoId, g.monto, d.toISOString().split('T')[0], c)
      insertSync.run(gastoId, d.getMonth() + 1, d.getFullYear())
    }
  }
  console.log(`✔ ${gastosMensuales.length} gastos mensuales creados con historial de cuotas`)
})

seed()

db.close()
console.log(`\n✔ Base de datos creada en: ${dbPath}`)
console.log(`  Total registros:`)
const db2 = new Database(dbPath)
console.log(`    Categorías: ${db2.prepare('SELECT COUNT(*) as c FROM categorias').get().c}`)
console.log(`    Gastos: ${db2.prepare('SELECT COUNT(*) as c FROM gastos').get().c}`)
console.log(`    Historial: ${db2.prepare('SELECT COUNT(*) as c FROM historial_gastos').get().c}`)
console.log(
  `    Sincronizaciones: ${db2.prepare('SELECT COUNT(*) as c FROM sincronizaciones').get().c}`
)
db2.close()
