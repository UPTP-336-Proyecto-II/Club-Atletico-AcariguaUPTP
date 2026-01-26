const pool = require('../config/database');

// Obtener todas las mediciones
const getMediciones = async (req, res) => {
  try {
    const { atleta_id } = req.query;

    let query = `
      SELECT m.*, 
             atl.nombre as atleta_nombre, 
             atl.apellido as atleta_apellido,
             c.nombre_categoria as categoria_nombre,
             TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad,
             (m.peso / ((m.altura / 100) * (m.altura / 100))) as indice_de_masa
      FROM medidas_antropometricas m
      LEFT JOIN atletas atl ON m.atleta_id = atl.atleta_id
      LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
      WHERE 1=1
    `;
    const params = [];

    if (atleta_id) {
      query += ' AND m.atleta_id = ?';
      params.push(atleta_id);
    }

    query += ' ORDER BY m.fecha_medicion DESC, m.medidas_id DESC, atl.nombre ASC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo mediciones:', error);
    res.status(500).json({ error: 'Error al obtener mediciones' });
  }
};

// Obtener mediciones por atleta
const getMedicionesByAtleta = async (req, res) => {
  try {
    const { atleta_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT m.*, 
              TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad,
              (m.peso / ((m.altura / 100) * (m.altura / 100))) as indice_de_masa
       FROM medidas_antropometricas m
       LEFT JOIN atletas atl ON m.atleta_id = atl.atleta_id
       WHERE m.atleta_id = ? AND atl.estatus IN ('ACTIVO', 'LESIONADO')
       ORDER BY m.fecha_medicion DESC, m.medidas_id DESC`,
      [atleta_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo mediciones por atleta:', error);
    res.status(500).json({ error: 'Error al obtener mediciones' });
  }
};

// Crear medición
const createMedicion = async (req, res) => {
  try {
    const {
      atleta_id,
      fecha_medicion,
      peso,
      altura,
      porcentaje_grasa,
      porcentaje_musculatura,
      envergadura,
      largo_de_pierna,
      largo_de_torso
    } = req.body;



    const [result] = await pool.execute(
      `INSERT INTO medidas_antropometricas 
       (atleta_id, fecha_medicion, peso, altura, envergadura, largo_de_pierna, largo_de_torso, porcentaje_grasa, porcentaje_musculatura) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [atleta_id, fecha_medicion, peso, altura, envergadura, largo_de_pierna, largo_de_torso, porcentaje_grasa || null, porcentaje_musculatura || null]
    );

    res.status(201).json({
      message: 'Medición registrada exitosamente',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error registrando medición:', error);
    res.status(500).json({ error: 'Error al registrar medición' });
  }
};

// Obtener última medición de un atleta
const getUltimaMedicion = async (req, res) => {
  try {
    const { atleta_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT m.*,
              (m.peso / ((m.altura / 100) * (m.altura / 100))) as indice_de_masa
       FROM medidas_antropometricas m
       WHERE m.atleta_id = ?
       ORDER BY m.fecha_medicion DESC, m.medidas_id DESC
       LIMIT 1`,
      [atleta_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron mediciones para este atleta' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo última medición:', error);
    res.status(500).json({ error: 'Error al obtener medición' });
  }
};

// Obtener evolución de peso de un atleta
const getEvolucionPeso = async (req, res) => {
  try {
    const { atleta_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT fecha_medicion, peso, (peso / ((altura / 100) * (altura / 100))) as indice_de_masa
       FROM medidas_antropometricas 
       WHERE atleta_id = ? AND peso IS NOT NULL
       ORDER BY fecha_medicion ASC`,
      [atleta_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo evolución de peso:', error);
    res.status(500).json({ error: 'Error al obtener evolución' });
  }
};

module.exports = {
  getMediciones,
  getMedicionesByAtleta,
  createMedicion,
  getUltimaMedicion,
  getEvolucionPeso
};