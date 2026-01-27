const pool = require('../config/database');

// Obtener todas las categorías
const getCategorias = async (req, res) => {
    try {
        const { estatus } = req.query;

        let query = `SELECT c.*, 
              p.nombre as entrenador_nombre,
              p.apellido as entrenador_apellido,
              COUNT(a.atleta_id) as total_atletas
       FROM categoria c
       LEFT JOIN plantel p ON c.entrenador_id = p.plantel_id
       LEFT JOIN atletas a ON c.categoria_id = a.categoria_id AND a.estatus IN ('Activo', 'Lesionado')`;

        const params = [];

        if (estatus) {
            query += ' WHERE c.estatus = ?';
            params.push(estatus);
        }

        query += ' GROUP BY c.categoria_id ORDER BY c.edad_min ASC';

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
};

// Obtener categoría por ID
const getCategoriaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            `SELECT c.*, 
              p.nombre as entrenador_nombre,
              p.apellido as entrenador_apellido
       FROM categoria c
       LEFT JOIN plantel p ON c.entrenador_id = p.plantel_id
       WHERE c.categoria_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo categoría:', error);
        res.status(500).json({ error: 'Error al obtener categoría' });
    }
};

// Actualizar categoría (solo entrenador y estatus)
const updateCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { entrenador_id, estatus } = req.body;

        const [result] = await pool.execute(
            `UPDATE categoria 
       SET entrenador_id = ?, estatus = ?
       WHERE categoria_id = ?`,
            [entrenador_id || null, estatus || 'Activa', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría actualizada exitosamente' });
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
};

module.exports = {
    getCategorias,
    getCategoriaById,
    updateCategoria
};
