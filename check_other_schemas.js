const pool = require('./backend/config/database');

async function checkAndLogSchemas() {
    try {
        const [plantel] = await pool.execute('DESCRIBE plantel');
        console.log('--- PLANTEL ---');
        console.log(JSON.stringify(plantel, null, 2));

        const [tutor] = await pool.execute('DESCRIBE tutor');
        console.log('\n--- TUTOR ---');
        console.log(JSON.stringify(tutor, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndLogSchemas();
