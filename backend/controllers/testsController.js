const pool = require('../config/database');
const { isLegacySchema } = require('../services/schemaService');

// Obtener todos los tests
const getTests = async (req, res) => {
  try {
    const { atleta_id } = req.query;
    const legacySchema = await isLegacySchema();

    let query = legacySchema
      ? `SELECT t.*, 
                a.fecha as fecha_test,
                atl.nombre as atleta_nombre, 
                atl.apellido as atleta_apellido,
                c.nombre_categoria as categoria_nombre,
                TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad
         FROM resultado_pruebas t
         LEFT JOIN actividades a ON t.actividad_id = a.actividad_id
         LEFT JOIN atletas atl ON t.atleta_id = atl.atleta_id
         LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
         WHERE 1=1`
      : `SELECT t.*, 
                e.fecha_evento as fecha_test,
                atl.nombre as atleta_nombre, 
                atl.apellido as atleta_apellido,
                c.nombre_categoria as categoria_nombre,
                TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad
         FROM resultado_pruebas t
         LEFT JOIN evento_deportivo e ON t.evento_id = e.evento_id
         LEFT JOIN atletas atl ON t.atleta_id = atl.atleta_id
         LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
         WHERE 1=1`;

    const params = [];

    if (atleta_id) {
      query += ' AND t.atleta_id = ?';
      params.push(atleta_id);
    }

    query += legacySchema 
      ? ' ORDER BY a.fecha DESC, t.test_id DESC, atl.nombre ASC'
      : ' ORDER BY e.fecha_evento DESC, t.test_id DESC, atl.nombre ASC';

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
    const legacySchema = await isLegacySchema();

    const query = legacySchema
      ? `SELECT t.*, a.fecha as fecha_test
         FROM resultado_pruebas t
         LEFT JOIN actividades a ON t.actividad_id = a.actividad_id
         LEFT JOIN atletas atl ON t.atleta_id = atl.atleta_id
         WHERE t.atleta_id = ? AND atl.estatus IN ('ACTIVO', 'LESIONADO', 'Activo', 'Lesionado', 1, 2)
         ORDER BY a.fecha DESC, t.test_id DESC`
      : `SELECT t.*, e.fecha_evento as fecha_test
         FROM resultado_pruebas t
         LEFT JOIN evento_deportivo e ON t.evento_id = e.evento_id
         LEFT JOIN atletas atl ON t.atleta_id = atl.atleta_id
         WHERE t.atleta_id = ? AND atl.estatus IN ('ACTIVO', 'LESIONADO', 'Activo', 'Lesionado')
         ORDER BY e.fecha_evento DESC, t.test_id DESC`;

    const [rows] = await pool.execute(query, [atleta_id]);

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

    const legacySchema = await isLegacySchema();

    let result;
    if (legacySchema) {
      // 1. Buscar o crear actividad para la fecha
      let actividadId;
      if (fecha_test) {
        const [actividades] = await pool.execute("SELECT actividad_id FROM actividades WHERE fecha = ? AND tipo_actividad = 2", [fecha_test]); // Asumiremos 2 para tests/pruebas
        if (actividades.length > 0) {
          actividadId = actividades[0].actividad_id;
        } else {
          const [newActividad] = await pool.execute(
            "INSERT INTO actividades (tipo_actividad, objetivo_principal, fecha, estatus) VALUES (2, 'Pruebas Físicas', ?, 2)",
            [fecha_test]
          );
          actividadId = newActividad.insertId;
        }
      }

      [result] = await pool.execute(
        `INSERT INTO resultado_pruebas 
         (actividad_id, atleta_id, test_de_fuerza, test_resistencia, test_velocidad, test_coordinacion, test_de_reaccion) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [actividadId || null, atleta_id, test_de_fuerza, test_resistencia, test_velocidad, test_coordinacion, test_de_reaccion]
      );
    } else {
      // 1. Buscar o crear evento_deportivo para la fecha
      let eventoId;
      if (fecha_test) {
        const [eventos] = await pool.execute('SELECT evento_id FROM evento_deportivo WHERE fecha_evento = ? AND tipo_evento = ?', [fecha_test, 'Prueba']);
        if (eventos.length > 0) {
          eventoId = eventos[0].evento_id;
        } else {
          // Buscar el primer entrenador disponible
          const [entrenadores] = await pool.execute('SELECT plantel_id FROM plantel WHERE rol_id = 3 LIMIT 1');
          const entrenadorId = entrenadores.length > 0 ? entrenadores[0].plantel_id : 1;

          const [newEvento] = await pool.execute(
            'INSERT INTO evento_deportivo (entrenador_id, tipo_evento, fecha_evento) VALUES (?, ?, ?)',
            [entrenadorId, 'Prueba', fecha_test]
          );
          eventoId = newEvento.insertId;
        }
      }

      [result] = await pool.execute(
        `INSERT INTO resultado_pruebas 
         (atleta_id, evento_id, test_de_fuerza, test_resistencia, test_velocidad, test_coordinacion, test_de_reaccion) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [atleta_id, eventoId || null, test_de_fuerza, test_resistencia, test_velocidad, test_coordinacion, test_de_reaccion]
      );
    }

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

const getEvolucionTest = async (req, res) => {
  try {
    const { atleta_id } = req.params;
    const legacySchema = await isLegacySchema();

    const query = legacySchema
      ? `SELECT a.fecha as fecha_test, t.test_de_fuerza, t.test_resistencia, t.test_velocidad, t.test_coordinacion, t.test_de_reaccion
         FROM resultado_pruebas t
         LEFT JOIN actividades a ON t.actividad_id = a.actividad_id
         WHERE t.atleta_id = ?
         ORDER BY a.fecha ASC`
      : `SELECT e.fecha_evento as fecha_test, t.test_de_fuerza, t.test_resistencia, t.test_velocidad, t.test_coordinacion, t.test_de_reaccion
         FROM resultado_pruebas t
         LEFT JOIN evento_deportivo e ON t.evento_id = e.evento_id
         WHERE t.atleta_id = ?
         ORDER BY e.fecha_evento ASC`;

    const [rows] = await pool.execute(query, [atleta_id]);

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
    const legacySchema = await isLegacySchema();

    const query = legacySchema
      ? `SELECT t.*, a.fecha as fecha_test
         FROM resultado_pruebas t
         LEFT JOIN actividades a ON t.actividad_id = a.actividad_id 
         WHERE t.atleta_id = ?
         ORDER BY a.fecha DESC, t.test_id DESC
         LIMIT 1`
      : `SELECT t.*, e.fecha_evento as fecha_test
         FROM resultado_pruebas t
         LEFT JOIN evento_deportivo e ON t.evento_id = e.evento_id 
         WHERE t.atleta_id = ?
         ORDER BY e.fecha_evento DESC, t.test_id DESC
         LIMIT 1`;

    const [rows] = await pool.execute(query, [atleta_id]);

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