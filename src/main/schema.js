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
        nota TEXT,
        cuotas INTEGER,
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

        foreign KEY (gasto_id) REFERENCES gastos(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
    );
`
export default schema
