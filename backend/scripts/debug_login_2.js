const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const testControllerLogic = async () => {
    try {
        const email = 'test@gmail.com';
        const [users] = await pool.execute(
            'SELECT * FROM usuarios WHERE email = ? AND estatus = ?',
            [email, 'ACTIVO']
        );

        if (users.length === 0) console.log('User not found via controller query');
        else console.log('User found via controller query:', users[0]);

        const user = users[0];
        // Controller logic uses: user.rol 
        // Is user.rol defined?
        console.log('User Rol:', user.rol);

    } catch (error) {
        console.error(error);
    }
};
testControllerLogic();
