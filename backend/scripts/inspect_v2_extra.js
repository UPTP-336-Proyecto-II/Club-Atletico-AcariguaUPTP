const mysql = require('mysql2/promise');

const inspect = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'club_atletico_v2'
    });
    try {
        const [plantel] = await connection.execute('SELECT * FROM plantel LIMIT 1');
        console.log('V2 Plantel Columns:', plantel.length > 0 ? Object.keys(plantel[0]) : 'Empty');

        const [users] = await connection.execute('SELECT * FROM usuarios LIMIT 1');
        console.log('V2 Usuarios Columns:', users.length > 0 ? Object.keys(users[0]) : 'Empty');
    } catch (error) { console.error(error); } finally { await connection.end(); }
};
inspect();
