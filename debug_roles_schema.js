const pool = require('./backend/config/database');

async function checkSchema() {
    try {
        const [rows] = await pool.execute("SHOW CREATE TABLE rol_usuarios");
        console.log(rows[0]['Create Table']);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
