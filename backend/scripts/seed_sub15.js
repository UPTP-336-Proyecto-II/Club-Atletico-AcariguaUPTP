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

// Data transcribed from Sub 15 image
const athletes = [
    { nombre: "Isabella del Carmen", apellido: "Montesino Garcia", fn: "02/11/2009", cedula: "33.176.437" },
    { nombre: "Katherin Sthefania", apellido: "Ramirez Urriola", fn: "05/04/2010", cedula: "34.343.195" },
    { nombre: "Sebastián Eduardo", apellido: "Hurtado Delgado", fn: "16/06/2010", cedula: "33.947.720" },
    { nombre: "Shantal Robertty", apellido: "Rodríguez", fn: "24/05/2012", cedula: "34.342.990" }, // Duplicate from Sub 13 list
    { nombre: "Juan David", apellido: "Blanca Rodríguez", fn: "20/02/2010", cedula: "33.305.827" },
    { nombre: "Neiker Javier", apellido: "Davida Ramos", fn: "18/11/2010", cedula: "34.304.348" },
    { nombre: "Ashlam Enoc", apellido: "Espinoza Mata", fn: "22/04/2010", cedula: "34.342.939" },
    { nombre: "Dargenson Javier", apellido: "Reyes Revilla", fn: "26/09/2012", cedula: "34.633.432" }, // Duplicate from Sub 13 list
    { nombre: "Johandris Alexander", apellido: "Lopez Marchan", fn: "24/09/2011", cedula: "34.487.306" },
    { nombre: "Diego Rafael", apellido: "Noguera Jimenez", fn: "21/04/2011", cedula: "34.303.981" },
    { nombre: "Geison Moises", apellido: "Rivas Aparicio", fn: "23/02/2013", cedula: "35.126.149" }, // Duplicate from Sub 13 list
    { nombre: "Josue Abraham", apellido: "Blanca Rodriguez", fn: "26/10/2011", cedula: "36.101.136" }, // "Blanca" matches Juan David above? Siblings?
    { nombre: "Juan Diego", apellido: "Medina Rodriguez", fn: "30/01/2011", cedula: "34.169.500" },
    { nombre: "Isaias Leonel", apellido: "Morales Brugos", fn: "05/11/2011", cedula: "36.625.911" },
    { nombre: "David Alejandro", apellido: "Salas Vasquez", fn: "09/07/2010", cedula: "33.880.208" },
    { nombre: "Argenis de sosa", apellido: "Campins", fn: "29/11/2011", cedula: "34.572.840" }, // Date in image was 29/11/201134, assuming 2011
    { nombre: "Jesus Anival", apellido: "Goyo Cordero", fn: "20/10/2010", cedula: "34.388.818" },
    { nombre: "Darweinso Enmanuel", apellido: "Granadillo Pena", fn: "05/11/2010", cedula: "33.736.118" },
    { nombre: "Alberlo Jose", apellido: "Ramirez Lugo", fn: "12/10/2010", cedula: "34.535.348" },
    { nombre: "Gustavo Alejandro", apellido: "Parra Castro", fn: "17/11/2011", cedula: "36.087.305" },
    { nombre: "Wilkendry Briggitte", apellido: "Vargas Rivero", fn: "29/03/2011", cedula: "34.811.520" },
    { nombre: "Ernesto Jose", apellido: "Alcantara", fn: "03/09/2011", cedula: "34.342.576" },
    { nombre: "Sebastian Jussen", apellido: "Salcedo Rojas", fn: "22/02/2010", cedula: "33.549.624" }
];

function formatDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.replace(/-/g, '/').split('/'); // Handle - or /
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

        // 1. Find Category ID for "Sub 15"
        const [categories] = await connection.execute(
            `SELECT categoria_id, nombre_categoria FROM categoria WHERE nombre_categoria LIKE ? OR nombre_categoria LIKE ?`,
            ['%Sub 15%', '%Sub-15%']
        );

        if (categories.length === 0) {
            console.error('❌ Category "Sub 15" not found. Please create it first.');
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

        console.log('🎉 Seeding Sub 15 completed!');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

seed();
