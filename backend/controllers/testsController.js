const pool = require('../config/database');

// Obtener todos los tests
const getTests = async (req, res) => {
  try {
    const { atleta_id } = req.query;

    let query = `
      SELECT t.*, 
             d.fecha_pruebas as fecha_test,
             atl.nombre as atleta_nombre, 
             atl.apellido as atleta_apellido,
             c.nombre_categoria as categoria_nombre,
             TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad
      FROM resultado_pruebas t
      LEFT JOIN dia_pruebas d ON t.pruebas_id = d.pruebas_id
      LEFT JOIN atletas atl ON t.atleta_id = atl.atleta_id
      LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
      WHERE 1=1
    `;
    const params = [];

    if (atleta_id) {
      query += ' AND t.atleta_id = ?';
      params.push(atleta_id);
    }

    query += ' ORDER BY d.fecha_pruebas DESC, t.test_id DESC, atl.nombre ASC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo tests:', error);
    res.status(500).json({ error: 'Error al obtener tests' });
  }
};

// Obtener tests por atleta
const getTestsByAtleta = async (req, res) => {
  try {
    const { atleta_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT t.*, d.fecha_pruebas as fecha_test
       FROM resultado_pruebas t
       LEFT JOIN dia_pruebas d ON t.pruebas_id = d.pruebas_id
       LEFT JOIN atletas atl ON t.atleta_id = atl.atleta_id
       WHERE t.atleta_id = ? AND atl.estatus IN ('ACTIVO', 'LESIONADO', 'Activo', 'Lesionado')
       ORDER BY d.fecha_pruebas DESC, t.test_id DESC`,
      [atleta_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo tests por atleta:', error);
    res.status(500).json({ error: 'Error al obtener tests' });
  }
};

// Crear test
const createTest = async (req, res) => {
  try {
    const {
      atleta_id,
      fecha_test,
      test_de_fuerza,
      test_resistencia,
      test_velocidad,
      test_coordinacion,
      test_de_reaccion
    } = req.body;

    // Nota: El frontend debe enviar pruebas_id, o se debe crear un registro en dia_pruebas primero.
    // Asumiremos que el frontend enviará pruebas_id si existe, o tendremos que manejar la creación de dia_pruebas.
    // Dado que el frontend enviaba fecha_test, necesitaremos buscar o crear un dia_pruebas para esa fecha.

    // 1. Buscar o crear dia_pruebas para la fecha
    let pruebasId;
    if (fecha_test) {
      const [dias] = await pool.execute('SELECT pruebas_id FROM dia_pruebas WHERE fecha_pruebas = ?', [fecha_test]);
      if (dias.length > 0) {
        pruebasId = dias[0].pruebas_id;
      } else {
        // Se requiere entrenador_id, usaremos uno por defecto o null si la tabla lo permite (no lo permite, NOT NULL)
        // Necesitamos un entrenador_id válido. Buscaré el primer entrenador disponible.
        const [entrenadores] = await pool.execute('SELECT plantel_id FROM plantel WHERE rol_id = 3 LIMIT 1'); // Rol 3 = entrenador
        const entrenadorId = entrenadores.length > 0 ? entrenadores[0].plantel_id : 1; // Fallback a 1 si no hay entrenadores

        const [newDia] = await pool.execute(
          'INSERT INTO dia_pruebas (entrenador_id, fecha_pruebas, observaciones) VALUES (?, ?, ?)',
          [entrenadorId, fecha_test, 'Test registrado individualmente']
        );
        pruebasId = newDia.insertId;
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO resultado_pruebas 
       (atleta_id, pruebas_id, test_de_fuerza, test_resistencia, test_velocidad, test_coordinacion, test_de_reaccion) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [atleta_id, pruebasId, test_de_fuerza, test_resistencia, test_velocidad, test_coordinacion, test_de_reaccion]
    );

    res.status(201).json({
      message: 'Test registrado exitosamente',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error registrando test:', error);
    res.status(500).json({ error: 'Error al registrar test' });
  }
};

// Obtener estadísticas de tests
const getEstadisticasTests = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as total_tests,
        AVG(test_de_fuerza) as promedio_fuerza,
        AVG(test_resistencia) as promedio_resistencia,
        AVG(test_velocidad) as promedio_velocidad,
        AVG(test_coordinacion) as promedio_coordinacion,
        AVG(test_de_reaccion) as promedio_reaccion
       FROM resultado_pruebas`
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener evolución de tests para un atleta
const getEvolucionTest = async (req, res) => {
  try {
    const { atleta_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT d.fecha_pruebas as fecha_test, t.test_de_fuerza, t.test_resistencia, t.test_velocidad, t.test_coordinacion, t.test_de_reaccion
       FROM resultado_pruebas t
       LEFT JOIN dia_pruebas d ON t.pruebas_id = d.pruebas_id
       WHERE t.atleta_id = ?
       ORDER BY d.fecha_pruebas ASC`,
      [atleta_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo evolución de test:', error);
    res.status(500).json({ error: 'Error al obtener evolución' });
  }
};

// Obtener último test de un atleta
const getUltimoTest = async (req, res) => {
  try {
    const { atleta_id } = req.params;

    const [rows] = await pool.execute(
      `SELECT t.*, d.fecha_pruebas as fecha_test
       FROM resultado_pruebas t
       LEFT JOIN dia_pruebas d ON t.pruebas_id = d.pruebas_id 
       WHERE t.atleta_id = ?
       ORDER BY d.fecha_pruebas DESC, t.test_id DESC
       LIMIT 1`,
      [atleta_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron tests para este atleta' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo último test:', error);
    res.status(500).json({ error: 'Error al obtener test' });
  }
};

module.exports = {
  getTests,
  getTestsByAtleta,
  createTest,
  getEstadisticasTests,
  getEvolucionTest,
  getUltimoTest
};