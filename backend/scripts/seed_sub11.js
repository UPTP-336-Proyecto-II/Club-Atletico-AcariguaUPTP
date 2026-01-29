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

// Data transcribed from Sub 11 image
const athletes = [
    { nombre: "Javier José", apellido: "Galindez Montero", fn: "23/04/2014", cedula: "825" },
    { nombre: "Fabián Alessandro", apellido: "Mendoza Monje", fn: "24/10/2014", cedula: "36.657.082" },
    { nombre: "Samuel Josué", apellido: "Moleiro Rivero", fn: "27/05/2014", cedula: "981" },
    { nombre: "Dioner David", apellido: "Virquez Hernandez", fn: "15/02/2016", cedula: "37.173.225" }, // Also in Sub 9 list? Yes. Check duplicates.
    { nombre: "Fabián Emilio", apellido: "Rodríguez Parra", fn: "03/10/2014", cedula: "0874" },
    { nombre: "Victor David", apellido: "Cordero Escalona", fn: "28/08/2015", cedula: "968" },
    { nombre: "Sebastin Andres", apellido: "Vargas Parra", fn: "19/03/2014", cedula: "36.519.496" },
    { nombre: "Miland Alessandro", apellido: "Nelo Chavez", fn: "20/07/2015", cedula: "651" },
    { nombre: "Daniel Alonzo", apellido: "Barreto Guevara", fn: "17/01/2015", cedula: "36.478.504" },
    { nombre: "Camilo Lisandro de Jesus", apellido: "gil Cordero", fn: "23/04/2014", cedula: "0912" },
    { nombre: "Jesus Gabriel", apellido: "Mendoza Rodriguez", fn: "29/07/2014", cedula: "1435" }, // Date format fix: 2907/2014 -> 29/07/2014
    { nombre: "Eliezer David", apellido: "Molino Riva", fn: "21/08/2015", cedula: "1218" },
    { nombre: "Jose Andres", apellido: "Rodriguez Corobo", fn: "12/12/2014", cedula: "170" },
    { nombre: "Jesus Santiago", apellido: "Guedez Rodriguez", fn: "19/01/2015", cedula: "36.651.198" },
    { nombre: "Andres Eduardo", apellido: "Melendez Gonzalez", fn: "07/12/2014", cedula: "36.682.210" },
    { nombre: "Abel Santiago", apellido: "Zerpa Marquez", fn: "16/09/2014", cedula: null },
    { nombre: "Jose Daniel", apellido: "Martines Oropeza", fn: "06/03/2015", cedula: "36.539.661" }, // Check decimal vs dot
    { nombre: "Liam Esteban", apellido: "Figueroa Vargas", fn: "21/05/2014", cedula: "37.210.341" }
];

function formatDate(dateStr) {
    if (!dateStr) return null;
    // Fix typos in date if any
    if (dateStr === '2907/2014') return '2014-07-29';

    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

function cleanCedula(cedula) {
    if (!cedula) return null;
    return cedula.toString().replace(/[\.,]/g, ''); // Remove dots and commas
}

async function seed() {
    const pool = mysql.createPool(dbConfig);
    let connection;

    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database');

        // 1. Find Category ID for "Sub 11"
        const [categories] = await connection.execute(
            `SELECT categoria_id, nombre_categoria FROM categoria WHERE nombre_categoria LIKE ? OR nombre_categoria LIKE ?`,
            ['%Sub 11%', '%Sub-11%']
        );

        if (categories.length === 0) {
            console.error('❌ Category "Sub 11" not found. Please create it first.');
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

            // Correct simple typos
            let apellido = athlete.apellido;
            // if (apellido === 'gil Cordero') apellido = 'Gil Cordero'; // Optional fix

            await connection.execute(
                `INSERT INTO atletas 
                (nombre, apellido, cedula, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    athlete.nombre,
                    apellido,
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

        console.log('🎉 Seeding Sub 11 completed!');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

seed();
