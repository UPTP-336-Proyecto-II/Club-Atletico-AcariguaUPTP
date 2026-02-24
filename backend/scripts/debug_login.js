const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// Mock Config from controller
const JWT_SECRET = 'secreto_super_seguro_para_jwt_club_atletico'; // Default usually

const simulateLogin = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'club_atletico_db'
    });

    try {
        const email = 'test@gmail.com';
        // From previous diagnosis: { usuario_id: 1, email: 'test@gmail.com', rol_id: 1, estatus: 'Activo' }
        // We don't know password. Controller uses plain text comparison: if (password !== user.password)
        // We need to fetch the password first to see what it expects.

        const [users] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            console.log('User not found.');
            return;
        }
        const user = users[0];
        console.log('User found:', user.email);
        console.log('Stored Password:', user.password); // Checking what's in DB

        // Attempt Update Query that controller does
        const token = 'MOCK_TOKEN_' + Date.now();
        console.log('Attempting UPDATE...');

        // Controller code:
        // 'UPDATE usuarios SET token = ?, ultimo_acceso = NOW() WHERE usuario_id = ?'

        await connection.execute(
            'UPDATE usuarios SET token = ?, ultimo_acceso = NOW() WHERE usuario_id = ?',
            [token, user.usuario_id]
        );
        console.log('✅ UPDATE Successful!');

    } catch (error) {
        console.error('❌ Login Logic Failed:', error);
    } finally {
        await connection.end();
    }
};

simulateLogin();
