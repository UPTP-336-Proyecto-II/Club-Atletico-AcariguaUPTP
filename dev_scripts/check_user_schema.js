const pool = require('./backend/config/database');

async function checkUsuariosSchema() {
    try {
        const [columns] = await pool.execute("SHOW COLUMNS FROM usuarios");
        console.log("Columnas de la tabla 'usuarios':");
        columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUsuariosSchema();
