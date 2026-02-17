const schema = `
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

        Foreign KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS historial_gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gasto_id INTEGER NOT NULL,
        monto INTEGER NOT NULL,
        fecha_pago DATE NOT NULL,
        numero_cuota INTEGER,

        foreign KEY (gasto_id) REFERENCES gastos(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
    );
`
export default schema
