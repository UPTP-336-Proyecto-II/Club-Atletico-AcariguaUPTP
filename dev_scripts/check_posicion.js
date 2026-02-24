const pool = require('./backend/config/database');

async function checkPosicionSchema() {
    try {
        const [schema] = await pool.execute('DESCRIBE `posicion de juego`');
        console.log('--- SCHEMA ---');
        console.log(JSON.stringify(schema, null, 2));

        const [rows] = await pool.execute('SELECT * FROM `posicion de juego`');
        console.log('\n--- DATA ---');
        console.log(JSON.stringify(rows, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPosicionSchema();
