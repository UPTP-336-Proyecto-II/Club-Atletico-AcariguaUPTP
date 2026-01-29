const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'club_atletico_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Data transcribed from Sub 7 image
const athletes = [
    { nombre: "Samara Valentina", apellido: "Perez Belis", fn: "28/01/2018", cedula: "0732" },
    { nombre: "Ian Isrrael", apellido: "Salcedo Pinto", fn: "05/11/2018", cedula: "0417" },
    { nombre: "Mauricio Jose", apellido: "Perez Escalona", fn: "02/08/2018", cedula: "0015" }, // Corrected "Eacalona" -> "Escalona"
    { nombre: "Franchesco Alexandro", apellido: "Rodriguez Lucena", fn: "15/07/2019", cedula: "58847603" },
    { nombre: "Yonleyder Eulice", apellido: "Chavez Ruiz", fn: "15/05/2017", cedula: "1068" }, // Also in Sub 9 list
    { nombre: "Daniel Alejandro", apellido: "Caraballo Sanchez", fn: "14/08/2018", cedula: null }, // Empty in image
    { nombre: "Matthius David", apellido: "Rodriguez", fn: "03/06/2018", cedula: "978" },
    { nombre: "Jeremias Jose", apellido: "Arredondo Navarro", fn: "23/04/2018", cedula: "508" },
    { nombre: "Luciano Said", apellido: "Guanche Perez", fn: "14/02/2019", cedula: "0417" } // Note: Same ID '0417' as Ian? Will warn/skip if unique constraint.
];

function formatDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

function cleanCedula(cedula) {
    if (!cedula) return null;
    return cedula.toString().replace(/\./g, '');
}

async function seed() {
    const pool = mysql.createPool(dbConfig);
    let connection;

    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database');

        // 1. Find Category ID for "Sub 7"
        const [categories] = await connection.execute(
            `SELECT categoria_id, nombre_categoria FROM categoria WHERE nombre_categoria LIKE ? OR nombre_categoria LIKE ?`,
            ['%Sub 7%', '%Sub-7%']
        );

        if (categories.length === 0) {
            console.error('❌ Category "Sub 7" not found. Please create it first.');
            process.exit(1);
        }

        const categoryId = categories[0].categoria_id;
        console.log(`found category: ${categories[0].nombre_categoria} (ID: ${categoryId})`);

        // 2. Insert Athletes
        for (const athlete of athletes) {
            const birthDate = formatDate(athlete.fn);
            const cedula = cleanCedula(athlete.cedula);

            // Validation: Check if exists
            let exists = false;

            // Check by Cedula if present
            if (cedula) {
                const [existing] = await connection.execute(
                    'SELECT atleta_id FROM atletas WHERE cedula = ?',
                    [cedula]
                );
                if (existing.length > 0) {
                    console.log(`⚠️ Athlete with cedula ${cedula} (${athlete.nombre}) already exists. Skipping.`);
                    exists = true;
                }
            }

            // If no cedula, or not found by cedula, check by Name + DOB to avoid duplicates for those without cedula
            if (!exists && !cedula) {
                const [existingName] = await connection.execute(
                    'SELECT atleta_id FROM atletas WHERE nombre = ? AND apellido = ? AND fecha_nacimiento = ?',
                    [athlete.nombre, athlete.apellido, birthDate]
                );
                if (existingName.length > 0) {
                    console.log(`⚠️ Athlete ${athlete.nombre} ${athlete.apellido} matches existing record. Skipping.`);
                    exists = true;
                }
            }

            if (exists) continue;

            await connection.execute(
                `INSERT INTO atletas 
                (nombre, apellido, cedula, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    athlete.nombre,
                    athlete.apellido,
                    cedula,
                    null,
                    null,
                    birthDate,
                    null,
                    'Derecha',
                    categoryId,
                    null,
                    'ACTIVO',
                    null
                ]
            );
            console.log(`✅ Inserted: ${athlete.nombre} ${athlete.apellido}`);
        }

        console.log('🎉 Seeding Sub 7 completed!');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

seed();
