const mysql = require('mysql2/promise');

const check = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'club_atletico_db'
    });

    try {
        console.log('--- Checking club_atletico_db ---');

        // 1. Check Tables to confirm Schema
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('Tables found:', tableNames);

        const hasNormalizedTables = tableNames.includes('ubicacion_pais') && tableNames.includes('direcciones');
        console.log('Schema appears normalized?', hasNormalizedTables);

        // 2. Check Data
        const [users] = await connection.execute('SELECT usuario_id, email, rol_id, estatus FROM usuarios');
        console.log('Users count:', users.length);
        console.log('Users sample:', users);

        const [roles] = await connection.execute('SELECT * FROM rol_usuarios');
        console.log('Roles:', roles);

        // Check count of other important tables
        const [atletas] = await connection.execute('SELECT COUNT(*) as c FROM atletas');
        console.log('Atletas count:', atletas[0].c);

    } catch (error) {
        console.error('Error checking DB:', error);
    } finally {
        await connection.end();
    }
};

check();
