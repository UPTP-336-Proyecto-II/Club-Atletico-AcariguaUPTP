const mysql = require('mysql2/promise');

const checkRows = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    try {
        const [rows] = await connection.execute(`
      SELECT table_name, table_rows 
      FROM information_schema.tables 
      WHERE table_schema = 'club_atletico_db'
    `);
        console.log('Row Counts for club_atletico_db:', rows);

        const [rowsV2] = await connection.execute(`
      SELECT table_name, table_rows 
      FROM information_schema.tables 
      WHERE table_schema = 'club_atletico_v2'
    `);
        console.log('Row Counts for club_atletico_v2:', rowsV2);

    } catch (error) {
        console.error('Error checking rows:', error);
    } finally {
        await connection.end();
    }
};

checkRows();
