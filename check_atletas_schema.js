const pool = require('./backend/config/database');

async function checkAtletasSchema() {
    try {
        const [rows] = await pool.execute('DESCRIBE atletas');
        console.log('Schema for atletas table:');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAtletasSchema();
