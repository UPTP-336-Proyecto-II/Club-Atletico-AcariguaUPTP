const pool = require('./backend/config/database');

async function testGetAtletas() {
    try {
        const query = `SELECT a.*, 
                TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) as edad,
                c.nombre_categoria as categoria_nombre,
                t.nombre_completo as tutor_nombre,
                d.pais, d.estado, d.municipio, d.parroquia, d.descripcion_descriptiva,
                p.nombre_posicion as posicion_de_juego_nombre
         FROM atletas a 
         LEFT JOIN categoria c ON a.categoria_id = c.categoria_id
         LEFT JOIN tutor t ON a.tutor_id = t.tutor_id
         LEFT JOIN direcciones d ON a.direccion_id = d.direccion_id
         LEFT JOIN \`posicion de juego\` p ON a.posicion_de_juego = p.posicion_id
         WHERE 1=1 ORDER BY a.created_at DESC`;

        console.log('Executing query...');
        const [rows] = await pool.execute(query);
        console.log(`Success! Found ${rows.length} records.`);
        if (rows.length > 0) {
            console.log('First record sample:', rows[0]);
        }
        process.exit(0);
    } catch (error) {
        console.error('Query failed:', error);
        process.exit(1);
    }
}

testGetAtletas();
