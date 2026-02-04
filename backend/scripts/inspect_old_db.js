const mysql = require('mysql2/promise');

const inspect = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'club_atletico_db'
    });

    try {
        const [rows] = await connection.execute('SELECT * FROM direcciones LIMIT 1');
        console.log('Old Direcciones Columns:', rows.length > 0 ? Object.keys(rows[0]) : 'Empty Table');

        // Check other tables potentially
        const [tutors] = await connection.execute('SELECT * FROM tutor LIMIT 1');
        console.log('Old Tutor Columns:', tutors.length > 0 ? Object.keys(tutors[0]) : 'Empty Table');

        const [plantel] = await connection.execute('SELECT * FROM plantel LIMIT 1');
        console.log('Old Plantel Columns:', plantel.length > 0 ? Object.keys(plantel[0]) : 'Empty Table');

        const [atletas] = await connection.execute('SELECT * FROM atletas LIMIT 1');
        console.log('Old Atletas Columns:', atletas.length > 0 ? Object.keys(atletas[0]) : 'Empty Table');

    } catch (error) {
        console.error('Error inspecting:', error);
    } finally {
        await connection.end();
    }
};

inspect();
