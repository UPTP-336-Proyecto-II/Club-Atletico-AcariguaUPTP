const pool = require('../config/database');
const { isLegacySchema } = require('../services/schemaService');

const getCategorias = async (req, res) => {
  try {
    const { estatus } = req.query;
    const legacySchema = await isLegacySchema();

    let query = legacySchema
      ? `SELECT c.*,
                p.nombre as entrenador_nombre,
                p.apellido as entrenador_apellido,
                COUNT(a.atleta_id) as total_atletas
         FROM categoria c
         LEFT JOIN personal p ON c.entrenador_id = p.personal_id
         LEFT JOIN atletas a ON c.categoria_id = a.categoria_id AND a.estatus IN (1, 2)`
      : `SELECT c.*,
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
    console.error('Error obteniendo categorias:', error);
    res.status(500).json({ error: 'Error al obtener categorias' });
  }
};

const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();

    const [rows] = await pool.execute(
      legacySchema
        ? `SELECT c.*,
                  p.nombre as entrenador_nombre,
                  p.apellido as entrenador_apellido
           FROM categoria c
           LEFT JOIN personal p ON c.entrenador_id = p.personal_id
           WHERE c.categoria_id = ?`
        : `SELECT c.*,
                  p.nombre as entrenador_nombre,
                  p.apellido as entrenador_apellido
           FROM categoria c
           LEFT JOIN plantel p ON c.entrenador_id = p.plantel_id
           WHERE c.categoria_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoria no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo categoria:', error);
    res.status(500).json({ error: 'Error al obtener categoria' });
  }
};

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
      return res.status(404).json({ error: 'Categoria no encontrada' });
    }

    res.json({ message: 'Categoria actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando categoria:', error);
    res.status(500).json({ error: 'Error al actualizar categoria' });
  }
};

module.exports = {
  getCategorias,
  getCategoriaById,
  updateCategoria
};
