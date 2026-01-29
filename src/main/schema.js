const schema = `
    CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT
    );
    CREATE TABLE IF NOT EXISTS gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        monto REAL NOT NULL,
        mensual BOOLEAN NOT NULL,
        fecha_cobro INTEGER,
        categoria_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        Foreign KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS historial_gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gasto_id INTEGER NOT NULL,
        fecha_pago DATE NOT NULL,
        monto_pagado REAL NOT NULL,

        foreign KEY (gasto_id) REFERENCES gastos(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS autos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marca TEXT NOT NULL,
        modelo TEXT NOT NULL,
        anio INTEGER NOT NULL,
        patente TEXT UNIQUE NOT NULL,
        color TEXT,
        monto_compra REAL,
        monto_venta REAL,
        fecha_compra DATE,
        fecha_venta DATE,
        estado TEXT DEFAULT 'disponible',
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS autos_papeles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        auto_id INTEGER NOT NULL,
        tipo_papel TEXT NOT NULL,
        descripcion TEXT,
        fecha_obtencion DATE,
        estado TEXT DEFAULT 'pendiente',
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        foreign KEY (auto_id) REFERENCES autos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    );
`
export default schema
