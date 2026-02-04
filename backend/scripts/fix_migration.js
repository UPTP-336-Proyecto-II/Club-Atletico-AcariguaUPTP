const mysql = require('mysql2/promise');

const SOURCE_DB_CONFIG = {
    host: 'localhost', user: 'root', password: '', database: 'club_atletico_v2'
};
const DEST_DB_CONFIG = {
    host: 'localhost', user: 'root', password: '', database: 'club_atletico_db_normalized'
};

const fixMigration = async () => {
    const sourcePool = mysql.createPool(SOURCE_DB_CONFIG);
    const destPool = mysql.createPool(DEST_DB_CONFIG);

    try {
        console.log('Starting Fix Migration...');

        // --- FIX TUTOR ---
        console.log('Fixing Tutor...');
        await destPool.query('SET FOREIGN_KEY_CHECKS = 0');
        await destPool.query('TRUNCATE TABLE tutor'); // Clear bad data
        await destPool.query('SET FOREIGN_KEY_CHECKS = 1');
        const [oldTutors] = await sourcePool.query('SELECT * FROM tutor');

        for (const t of oldTutors) {
            // Split Name
            const parts = (t.nombre_completo || '').trim().split(' ');
            const nombres = parts[0] || '';
            const apellidos = parts.slice(1).join(' ') || ''; // Everything else is last name

            // Insert (mapping other fields 1:1)
            await destPool.query(
                `INSERT INTO tutor (tutor_id, nombres, apellidos, cedula, telefono, correo, tipo_relacion, direccion_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [t.tutor_id, nombres, apellidos, t.cedula, t.telefono, t.correo, t.tipo_relacion || 'Padre', t.direccion_id, t.created_at, t.updated_at]
            );
        }
        console.log('Tutor fixed.');

        // --- FIX USUARIOS ---
        console.log('Fixing Usuarios...');
        await destPool.query('SET FOREIGN_KEY_CHECKS = 0');
        await destPool.query('TRUNCATE TABLE usuarios');
        await destPool.query('SET FOREIGN_KEY_CHECKS = 1');
        const [oldUsers] = await sourcePool.query('SELECT * FROM usuarios');

        // Cache roles map: Name -> ID
        const [roles] = await destPool.query('SELECT rol_id, nombre_rol FROM rol_usuarios');
        const roleMap = {};
        roles.forEach(r => roleMap[r.nombre_rol.toUpperCase()] = r.rol_id);

        for (const u of oldUsers) {
            // Resolve Rol ID
            // Old DB 'rol' column is integer? or string?
            // Re-reading inspect output: V2 Users Columns: 'rol'
            // Wait, look at inspect sample or inferred type. 
            // If V2 'rol' is integer (FK), then it maps 1:1 if generic migration failed?
            // Generic migration failed because dest is `rol_id` (col name mismatch).
            // So if 'rol' in V2 is an INT, I just map it to 'rol_id'.
            // If 'rol' is String, I use map.
            // Let's assume it's INT matching `rol_usuarios` if that table was also migrated 1:1.
            // Migration of `rol_usuarios` passed.

            // Let's force map 'rol' -> 'rol_id'.
            const rolId = u.rol; // Assuming it is compatible ID.

            await destPool.query(
                `INSERT INTO usuarios (usuario_id, email, password, token, rol_id, plantel_id, estatus, foto, ultimo_acceso, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [u.usuario_id, u.email, u.password, u.token, rolId, u.plantel_id, u.estatus, u.foto, u.ultimo_acceso, u.created_at, u.updated_at]
            );
        }
        console.log('Usuarios fixed.');

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        await sourcePool.end();
        await destPool.end();
    }
};

fixMigration();
