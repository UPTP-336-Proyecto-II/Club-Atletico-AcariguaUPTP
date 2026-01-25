const pool = require('./backend/config/database');

async function testSearch(term) {
    try {
        const searchTerm = `%${term}%`;
        const query = `
      SELECT u.email, p.nombre, p.apellido
      FROM usuarios u
      LEFT JOIN plantel p ON u.plantel_id = p.plantel_id
      WHERE (
        LOWER(u.email) LIKE LOWER(?) OR 
        LOWER(p.nombre) LIKE LOWER(?) OR 
        LOWER(p.apellido) LIKE LOWER(?) OR 
        LOWER(CONCAT_WS(' ', p.nombre, p.apellido)) LIKE LOWER(?)
      )
    `;

        const [rows] = await pool.execute(query, [searchTerm, searchTerm, searchTerm, searchTerm]);
        console.log(`Buscando '${term}': ${rows.length} resultados`);
        rows.forEach(r => console.log(`- ${r.email} (${r.nombre} ${r.apellido})`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

const term = process.argv[2] || 'Sasuke';
testSearch(term);
