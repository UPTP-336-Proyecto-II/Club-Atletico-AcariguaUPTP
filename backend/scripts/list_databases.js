const mysql = require('mysql2/promise');

const listDbs = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    try {
        const [rows] = await connection.execute('SHOW DATABASES');
        console.log('Databases:', rows.map(r => r.Database));
    } catch (error) {
        console.error('Error listing databases:', error);
    } finally {
        await connection.end();
    }
};

listDbs();
