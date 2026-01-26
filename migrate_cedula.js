const pool = require('./backend/config/database');

async function migrate() {
    try {
        console.log('Checking for cedula column...');
        const [columns] = await pool.execute("SHOW COLUMNS FROM atletas LIKE 'cedula'");

        if (columns.length === 0) {
            console.log('Adding cedula column...');
            await pool.execute("ALTER TABLE atletas ADD COLUMN cedula VARCHAR(20) DEFAULT NULL AFTER apellido");
            console.log('Migration successful: cedula column added.');
        } else {
            console.log('Column cedula already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
