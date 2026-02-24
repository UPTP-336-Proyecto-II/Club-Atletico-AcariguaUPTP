const pool = require('./backend/config/database');

async function listTables() {
    try {
        const [rows] = await pool.execute("SHOW TABLES");
        console.log(rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listTables();
