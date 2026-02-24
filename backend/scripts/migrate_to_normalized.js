const mysql = require('mysql2/promise');

const SOURCE_DB_CONFIG = {
    host: 'localhost', user: 'root', password: '', database: 'club_atletico_v2'
};
const DEST_DB_CONFIG = {
    host: 'localhost', user: 'root', password: '', database: 'club_atletico_db_normalized'
};

// Main Migration Function
const migrate = async () => {
    const sourcePool = mysql.createPool(SOURCE_DB_CONFIG);
    const destPool = mysql.createPool(DEST_DB_CONFIG);

    try {
        console.log('Starting Migration...');

        // --- 1. Migrate Locations (Ubicacion & Direcciones) ---
        console.log('Migrating addresses...');
        const [oldDirecciones] = await sourcePool.query('SELECT * FROM direcciones');

        for (const dir of oldDirecciones) {
            // Logic to resolve Parroquia ID
            let parroquiaId = null;

            // Only attempt if we have full hierarchy data (Pais -> Estado -> Municipio -> Parroquia)
            // or at least handle partials if possible. Schema implies hierarchy is strict.
            // We will default missing hierarchy to 'Desconocido' or similar if necessary, 
            // but simplistic approach: Only insert if we have names.

            if (dir.pais && dir.estado && dir.municipio && dir.parroquia) {
                // 1. Pais
                let [paisRes] = await destPool.query('SELECT pais_id FROM ubicacion_pais WHERE nombre = ?', [dir.pais]);
                let paisId;
                if (paisRes.length > 0) paisId = paisRes[0].pais_id;
                else {
                    const [ins] = await destPool.query('INSERT INTO ubicacion_pais (nombre) VALUES (?)', [dir.pais]);
                    paisId = ins.insertId;
                }

                // 2. Estado
                let [estRes] = await destPool.query('SELECT estado_id FROM ubicacion_estado WHERE nombre = ? AND pais_id = ?', [dir.estado, paisId]);
                let estadoId;
                if (estRes.length > 0) estadoId = estRes[0].estado_id;
                else {
                    const [ins] = await destPool.query('INSERT INTO ubicacion_estado (nombre, pais_id) VALUES (?, ?)', [dir.estado, paisId]);
                    estadoId = ins.insertId;
                }

                // 3. Municipio
                let [munRes] = await destPool.query('SELECT municipio_id FROM ubicacion_municipio WHERE nombre = ? AND estado_id = ?', [dir.municipio, estadoId]);
                let municipioId;
                if (munRes.length > 0) municipioId = munRes[0].municipio_id;
                else {
                    const [ins] = await destPool.query('INSERT INTO ubicacion_municipio (nombre, estado_id) VALUES (?, ?)', [dir.municipio, estadoId]);
                    municipioId = ins.insertId;
                }

                // 4. Parroquia
                let [parRes] = await destPool.query('SELECT parroquia_id FROM ubicacion_parroquia WHERE nombre = ? AND municipio_id = ?', [dir.parroquia, municipioId]);
                if (parRes.length > 0) parroquiaId = parRes[0].parroquia_id;
                else {
                    const [ins] = await destPool.query('INSERT INTO ubicacion_parroquia (nombre, municipio_id) VALUES (?, ?)', [dir.parroquia, municipioId]);
                    parroquiaId = ins.insertId;
                }
            }
            // Preservation fallback: If we have partial data we might lose it because 'direcciones' only points to 'parroquia'.
            // We'll append partial info to 'punto_referencia' / 'descripcion_descriptiva' to NOT lose data.
            let extraInfo = [];
            if (dir.pais && !parroquiaId) extraInfo.push(`Pais: ${dir.pais}`);
            if (dir.estado && !parroquiaId) extraInfo.push(`Estado: ${dir.estado}`);
            if (dir.municipio && !parroquiaId) extraInfo.push(`Municipio: ${dir.municipio}`);
            if (dir.parroquia && !parroquiaId) extraInfo.push(`Parroquia: ${dir.parroquia}`);

            let puntoRef = dir.descripcion_descriptiva || '';
            if (extraInfo.length > 0) {
                puntoRef = (puntoRef ? puntoRef + '. ' : '') + extraInfo.join(', ');
            }

            // Insert into new Direcciones table
            // Force the SAME direccion_id
            await destPool.query(
                `INSERT INTO direcciones (direccion_id, parroquia_id, punto_referencia) VALUES (?, ?, ?)`,
                [dir.direccion_id, parroquiaId, puntoRef]
            );
        }

        // --- 2. Generic Migration Function ---
        // Helper to migrate simple tables 1:1 matching column names
        const migrateTable = async (tableName, idCol) => {
            console.log(`Migrating ${tableName}...`);
            const [rows] = await sourcePool.query(`SELECT * FROM ${tableName}`);
            if (rows.length === 0) return;

            // Get columns of dest table
            const [cols] = await destPool.query(`SHOW COLUMNS FROM ${tableName}`);
            const destColNames = cols.map(c => c.Field);

            for (const row of rows) {
                const insertData = {};
                for (const col of destColNames) {
                    if (row[col] !== undefined) {
                        insertData[col] = row[col];
                    }
                }

                const keys = Object.keys(insertData);
                const values = Object.values(insertData);
                const placeholders = keys.map(() => '?').join(',');

                // Use INSERT IGNORE to handle duplicates or re-runs safely
                await destPool.query(
                    `INSERT IGNORE INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`,
                    values
                );
            }
        };

        // --- 3. Execute Migrations in Order (Dependency Aware) ---
        await migrateTable('posicion_juego', 'posicion_id');
        await migrateTable('rol_usuarios', 'rol_id');
        await migrateTable('preguntas_seguridad', 'id');
        await migrateTable('implementos_deportivos', 'implemento_id');

        await migrateTable('tutor', 'tutor_id');
        await migrateTable('plantel', 'plantel_id');
        // Categoria requires Entrenador (Plantel)
        await migrateTable('categoria', 'categoria_id');

        await migrateTable('atletas', 'atleta_id');
        await migrateTable('usuarios', 'usuario_id');
        await migrateTable('usuario_preguntas', 'usuario_id');

        await migrateTable('evento_deportivo', 'evento_id');
        await migrateTable('detalle_asistencia', 'asistencia_id');
        await migrateTable('ficha_medica', 'ficha_id');
        await migrateTable('medidas_antropometricas', 'medidas_id');
        await migrateTable('resultado_pruebas', 'test_id');

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sourcePool.end();
        await destPool.end();
    }
};

migrate();
