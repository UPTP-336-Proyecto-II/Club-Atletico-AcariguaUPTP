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

// Data transcribed from Sub 13 image
const athletes = [
    { nombre: "Sebastián Eduardo", apellido: "Henrrique", fn: "02/07/2012", cedula: "34.893.309" },
    { nombre: "Alam Leonardo", apellido: "Sabogal Yepez", fn: "19/04/2012", cedula: "34.774.242" },
    { nombre: "Shantal Robertty", apellido: "Rodríguez", fn: "24/05/2012", cedula: "34.342.990" },
    { nombre: "Ángel de Jesús", apellido: "Zabaleta Parra", fn: "14/10/2012", cedula: "34.633.417" },
    { nombre: "Elías Daniel", apellido: "Agüero Guedez", fn: "05/01/2012", cedula: "36.166.841" },
    { nombre: "Geison Moises", apellido: "Rivas Aparicio", fn: "23/02/2013", cedula: "35.126.149" },
    { nombre: "Alejandro Jose", apellido: "Moron Piñero", fn: "10/12/2012", cedula: "34.812.305" },
    { nombre: "Enrique Niomar", apellido: "Alvarado Ramos", fn: "29/01/2012", cedula: "34.487.225" },
    { nombre: "Jaiver Alejandro", apellido: "Ceballos Lopez", fn: "22/02/2012", cedula: "34.304.393" },
    { nombre: "Javier José", apellido: "Galindez Montero", fn: "23/04/2014", cedula: "825" }, // Note: Likely already processed in Sub 11
    { nombre: "Jose Manuel", apellido: "Sandobal Gudiño", fn: "31/03/2012", cedula: "24.534.577" },
    { nombre: "Alan David", apellido: "Perez Flores", fn: "03/06/2013", cedula: "34.959.903" },
    { nombre: "Carlos Valentin", apellido: "Zamora Torrealba", fn: "16/01/2013", cedula: "35.179.064" }, // Dot or comma in image? 35,179,064. Treating as dot.
    { nombre: "Andres David", apellido: "Leon Cordero", fn: "07/11/2013", cedula: "36.338.014" },
    { nombre: "Oliver Adrian", apellido: "Henrrique Pacheco", fn: "15/01/2013", cedula: "34.683.200" },
    { nombre: "Mathias Alejandro", apellido: "Arellano Rodríguez", fn: "09/08/2013", cedula: "36.167.312" },
    { nombre: "Ricardo Abel", apellido: "Mujica Garcia", fn: "09/08/2012", cedula: "34.847.977" },
    { nombre: "Davian Arturo", apellido: "Leon Ortiz", fn: "25/07/2013", cedula: "34.893.425" },
    { nombre: "Owen Ricardo", apellido: "Sierra Medina", fn: "18/09/2013", cedula: "36.043.154" },
    { nombre: "Dangerson Javier", apellido: "Reyes Revilla", fn: "26/09/2012", cedula: "34.633.432" },
    { nombre: "Carlos Jesus", apellido: "Alvarez Cedeño", fn: "17/10/2013", cedula: "35.030.313" },
    { nombre: "Fraimker Miguel", apellido: "Guevara Timaure", fn: "20/09/2013", cedula: "36.100.558" },
    { nombre: "Jesus Alberto", apellido: "Bolivar Castillo", fn: "22/04/2013", cedula: "36.415.905" } // Fixed double slash in date
];

function formatDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

function cleanCedula(cedula) {
    if (!cedula) return null;
    return cedula.toString().replace(/[\.,]/g, '');
}

async function seed() {
    const pool = mysql.createPool(dbConfig);
    let connection;

    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to database');

        // 1. Find Category ID for "Sub 13"
        // Try exact match or pattern
        const [categories] = await connection.execute(
            `SELECT categoria_id, nombre_categoria FROM categoria WHERE nombre_categoria LIKE ? OR nombre_categoria LIKE ?`,
            ['%Sub 13%', '%Sub-13%']
        );

        if (categories.length === 0) {
            console.error('❌ Category "Sub 13" not found. Please create it first.');
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

        console.log('🎉 Seeding Sub 13 completed!');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

seed();
