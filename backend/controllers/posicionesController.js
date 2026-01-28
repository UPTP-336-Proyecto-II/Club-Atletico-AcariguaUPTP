const pool = require('../config/database');

// Obtener todas las posiciones de juego
const getPosiciones = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT posicion_id, nombre_posicion FROM posicion_juego ORDER BY nombre_posicion ASC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo posiciones:', error);
        res.status(500).json({ error: 'Error al obtener posiciones' });
    }
};

module.exports = {
    getPosiciones
};
