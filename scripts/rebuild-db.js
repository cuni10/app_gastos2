/**
 * Script para eliminar y recrear la base de datos con datos de prueba.
 * Reconstruye better-sqlite3 para Node, ejecuta el seed, y reconstruye para Electron.
 *
 * Ejecutar: node scripts/rebuild-db.js
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const dbPath = path.join(root, 'src', 'db', 'gastos.db')

function run(cmd, label) {
  console.log(`\n> ${label}...`)
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit' })
  } catch (e) {
    console.error(`Error en: ${label}`)
    process.exit(1)
  }
}

// 1. Eliminar DB existente
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath)
    console.log('✔ Base de datos eliminada')
  } catch (e) {
    if (e.code === 'EBUSY') {
      console.error(
        '✖ La base de datos está en uso. Cerrá la app de Electron antes de ejecutar este script.'
      )
      process.exit(1)
    }
    throw e
  }
} else {
  console.log('No existe DB previa, se creará una nueva')
}

// 2. Rebuild better-sqlite3 para Node.js
run('npm rebuild better-sqlite3', 'Rebuild better-sqlite3 para Node.js')

// 3. Ejecutar seed
run('node scripts/seed.js', 'Ejecutando seed')

// 4. Rebuild better-sqlite3 para Electron
run('npx electron-rebuild -f -o better-sqlite3', 'Rebuild better-sqlite3 para Electron')

console.log('\n✔ Base de datos recreada y better-sqlite3 listo para Electron')
