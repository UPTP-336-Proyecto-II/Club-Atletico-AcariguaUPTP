const mysql = require('mysql2/promise');

const inspect = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'club_atletico_v2'
    });

    try {
        const [rows] = await connection.execute('SELECT * FROM direcciones LIMIT 1');
        console.log('V2 Direcciones Columns:', rows.length > 0 ? Object.keys(rows[0]) : 'Empty Table');
        console.log('V2 Direcciones Sample:', rows[0]);

        // Check relationships
        const [atletas] = await connection.execute('SELECT * FROM atletas LIMIT 1');
        console.log('V2 Atletas Columns:', atletas.length > 0 ? Object.keys(atletas[0]) : 'Empty Table');
        console.log('V2 Atletas Sample:', atletas[0]);

    } catch (error) {
        console.error('Error inspecting:', error);
    } finally {
        await connection.end();
    }
};

inspect();
