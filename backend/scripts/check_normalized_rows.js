const mysql = require('mysql2/promise');

const check = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'club_atletico_db_normalized'
    });
    try {
        const [rows] = await connection.execute(`
      SELECT table_name, table_rows 
      FROM information_schema.tables 
      WHERE table_schema = 'club_atletico_db_normalized'
    `);
        console.log('Row Counts Normalized:', rows);

        // Specific check for tutor content
        const [tutors] = await connection.execute('SELECT * FROM tutor');
        console.log('Tutors in new DB:', tutors);

    } catch (error) { console.error(error); } finally { await connection.end(); }
};
check();
