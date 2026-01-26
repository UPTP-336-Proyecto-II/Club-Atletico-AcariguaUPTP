const pool = require('./backend/config/database');

async function checkSchemas() {
    try {
        const [atletas] = await pool.execute('DESCRIBE atletas');
        console.log('--- ATLETAS ---');
        console.log(JSON.stringify(atletas, null, 2));

        const [direcciones] = await pool.execute('DESCRIBE direcciones');
        console.log('\n--- DIRECCIONES ---');
        console.log(JSON.stringify(direcciones, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchemas();
