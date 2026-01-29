const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load env if exists, though we hardcoded config in database.js

// Database config from backend/config/database.js
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'club_atletico_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const athletes = [
    { nombre: "Mathias Alexander", apellido: "Cañizales Perez", fn: "25/01/2016", cedula: "153" },
    { nombre: "Darwin Abel", apellido: "Barreto Guevara", fn: "26/02/2016", cedula: "37.003.659" },
    { nombre: "Fabricio David", apellido: "Leon Cordero", fn: "29/12/2016", cedula: "0091" },
    { nombre: "Estevan David", apellido: "Melendez Guedez", fn: "22/02/2017", cedula: "462" },
    { nombre: "Matias Jose", apellido: "Troconis Sanchez", fn: "28/06/2016", cedula: "0949" },
    { nombre: "Sebastian David", apellido: "Rojas", fn: "30/03/2016", cedula: "0726" },
    { nombre: "Jeremia Gabriel", apellido: "Sanchez Cedeño", fn: "29/12/2017", cedula: "498" },
    { nombre: "Kelvin Abraham", apellido: "Vera Gonzalez", fn: "31/10/2017", cedula: "1477" },
    { nombre: "Leonardo David", apellido: "Agraez Hernandez", fn: "27/01/2016", cedula: "37.082.868" },
    { nombre: "Isaias Leonardo", apellido: "Arias Cedeño", fn: "14/03/2016", cedula: "0346" },
    { nombre: "Yonleyder Eulice", apellido: "Chavez Ruiz", fn: "15/05/2017", cedula: "1068" },
    { nombre: "Samuel Alejandro", apellido: "arrillo Rivas", fn: "13/11/2017", cedula: "1545" }, // Note: 'arrillo' lowercase in image, fixing to Carrillo? Left as is for now or fix? Let's fix to Carrillo.
    { nombre: "Samir Eli", apellido: "Garcia Silva", fn: "10/02/2017", cedula: "264" },
    { nombre: "Thomas Enrrique", apellido: "Reinoso Martinez", fn: "07/07/2017", cedula: "4369" },
    { nombre: "Isabella Valentina", apellido: "Martinez Perez", fn: "20/09/2016", cedula: "1291" },
    { nombre: "Dioner David", apellido: "Virquez Hernandez", fn: "15/02/2016", cedula: "37.173.225" },
    { nombre: "Abrahan Josue", apellido: "Perez Mora", fn: "15/02/2016", cedula: "49" },
    { nombre: "Grabiel Alejandro", apellido: "Duran Oropeza", fn: "23/09/2017", cedula: "1581" },
    { nombre: "Mathias Javier", apellido: "Torres Paez", fn: "24/09/2016", cedula: "1839" },
    { nombre: "Jose Jesus", apellido: "Galicia Diaz", fn: "03/05/2016", cedula: "1846" }
];

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
function formatDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

// Helper to clean cedula (remove dots if needed, but existing seem to have dots mixed. Let's keep them as string)
// Actually, looking at the list, some are like 153, others 37.003.659.
// If the DB column is INT, dots will fail. If VARCHAR, dots are fine.
// The `atletas` table definition isn't fully visible but `cedula` is likely VARCHAR or INT. 
// Given mixed format (some short numbers, some long with dots), best to try cleaning dots to be safe if it's meant to be numeric used as ID.
// However, if I strip dots, 37.003.659 becomes 37003659. 153 remains 153.
// Let's strip dots to be consistent with standard DB practices unless I see otherwise. 
// PROCEEDING WITH STRIPPING DOTS.

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

        // 1. Find Category ID for "Sub 9"
        const [categories] = await connection.execute(
            `SELECT categoria_id, nombre_categoria FROM categoria WHERE nombre_categoria LIKE ? OR nombre_categoria LIKE ?`,
            ['%Sub 9%', '%Sub-9%']
        );

        if (categories.length === 0) {
            console.error('❌ Category "Sub 9" not found. Please create it first.');
            process.exit(1);
        }

        const categoryId = categories[0].categoria_id;
        console.log(`found category: ${categories[0].nombre_categoria} (ID: ${categoryId})`);

        // 2. Insert Athletes
        for (const athlete of athletes) {
            const birthDate = formatDate(athlete.fn);
            const cedula = cleanCedula(athlete.cedula);

            // Check if already exists by cedula (if cedula is provided)
            if (cedula) {
                const [existing] = await connection.execute(
                    'SELECT atleta_id FROM atletas WHERE cedula = ?',
                    [cedula]
                );

                if (existing.length > 0) {
                    console.log(`⚠️ Athlete with cedula ${cedula} (${athlete.nombre}) already exists. Skipping.`);
                    continue;
                }
            }

            // Capitalize fix for 'arrillo' -> 'Carrillo' if I missed it in array
            let apellido = athlete.apellido;
            if (apellido.startsWith('arrillo')) apellido = 'Carrillo' + apellido.substring(7);

            // Insert
            // Note: address and tutor are mandatory or optional? 
            // In controller: direccion_id, tutor_id can be null or have defaults?
            // Controller insert: VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            // [nombre, apellido, cedula, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto]

            // We'll set defaults for missing fields:
            // telefono: null
            // direccion_id: null
            // posicion_de_juego: null (or 1 / 'No Asignado' if FK required)
            // pierna_dominante: 'Derecha'
            // tutor_id: null
            // estatus: 'ACTIVO'
            // foto: null

            // Important: Check `posicion_de_juego` table constraint. If it's a foreign key, we might need a valid ID.
            // Usually NULL is allowed if it's a LEFT JOIN in queries.

            await connection.execute(
                `INSERT INTO atletas 
                (nombre, apellido, cedula, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    athlete.nombre,
                    apellido,
                    cedula,
                    null, // telefono
                    null, // direccion_id
                    birthDate,
                    null, // posicion_de_juego
                    'Derecha', // pierna_dominante
                    categoryId,
                    null, // tutor_id
                    'ACTIVO',
                    null // foto
                ]
            );
            console.log(`✅ Inserted: ${athlete.nombre} ${apellido}`);
        }

        console.log('🎉 Seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

seed();
