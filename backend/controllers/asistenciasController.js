const pool = require('../config/database');
const {
  isLegacySchema,
  mapAttendanceStatusToApi,
  mapAttendanceStatusToLegacy,
  mapAttendanceStatusToNormalized,
  mapActivityTypeToApi,
  mapActivityTypeToLegacy
} = require('../services/schemaService');

function normalizeAttendanceRows(rows) {
  return rows.map(row => ({
    ...row,
    estatus: mapAttendanceStatusToApi(row.estatus),
    tipo_evento: mapActivityTypeToApi(row.tipo_evento)
  }));
}

const getOrCreateEvento = async (fecha, tipo_evento, entrenador_id) => {
  const legacySchema = await isLegacySchema();

  if (legacySchema) {
    const tipoActividad = mapActivityTypeToLegacy(tipo_evento);
    const [existing] = await pool.execute(
      `SELECT actividad_id
       FROM actividades
       WHERE fecha = ? AND tipo_actividad = ?
       ORDER BY actividad_id DESC
       LIMIT 1`,
      [fecha, tipoActividad]
    );

    if (existing.length > 0) {
      return existing[0].actividad_id;
    }

    const [result] = await pool.execute(
      `INSERT INTO actividades (tipo_actividad, objetivo_principal, fecha, estatus)
       VALUES (?, ?, ?, ?)`,
      [tipoActividad, `Control de asistencia - ${mapActivityTypeToApi(tipo_evento)}`, fecha, 1]
    );

    return result.insertId;
  }

  const normalizedStatus = mapActivityTypeToApi(tipo_evento);
  const [existing] = await pool.execute(
    `SELECT evento_id FROM evento_deportivo
     WHERE fecha_evento = ? AND tipo_evento = ? AND entrenador_id = ?`,
    [fecha, normalizedStatus, entrenador_id]
  );

  if (existing.length > 0) {
    return existing[0].evento_id;
  }

  const [result] = await pool.execute(
    `INSERT INTO evento_deportivo (entrenador_id, tipo_evento, fecha_evento)
     VALUES (?, ?, ?)`,
    [entrenador_id, normalizedStatus, fecha]
  );

  return result.insertId;
};

const getAsistencias = async (req, res) => {
  try {
    const { fecha, atleta_id, categoria_id } = req.query;
    const legacySchema = await isLegacySchema();

    let query;
    const params = [];

    if (legacySchema) {
      query = `
            SELECT a.asistencia_id,
                   a.actividad_id as evento_id,
                   a.atleta_id,
                   a.estatus,
                   a.observaciones,
                   act.fecha as fecha,
                   act.tipo_actividad as tipo_evento,
                   c.entrenador_id,
                   atl.nombre as atleta_nombre,
                   atl.apellido as atleta_apellido,
                   atl.foto,
                   c.nombre_categoria as categoria_nombre,
                   p.nombre as entrenador_nombre,
                   p.apellido as entrenador_apellido
            FROM asistencias a
            INNER JOIN actividades act ON a.actividad_id = act.actividad_id
            LEFT JOIN atletas atl ON a.atleta_id = atl.atleta_id
            LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
            LEFT JOIN personal p ON c.entrenador_id = p.personal_id
            WHERE 1=1`;
    } else {
      query = `
            SELECT da.asistencia_id,
                   da.evento_id,
                   da.atleta_id,
                   da.estatus,
                   da.observaciones,
                   e.fecha_evento as fecha,
                   e.tipo_evento,
                   e.entrenador_id,
                   atl.nombre as atleta_nombre,
                   atl.apellido as atleta_apellido,
                   atl.foto,
                   c.nombre_categoria as categoria_nombre,
                   p.nombre as entrenador_nombre,
                   p.apellido as entrenador_apellido
            FROM detalle_asistencia da
            INNER JOIN evento_deportivo e ON da.evento_id = e.evento_id
            LEFT JOIN atletas atl ON da.atleta_id = atl.atleta_id
            LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
            LEFT JOIN plantel p ON e.entrenador_id = p.plantel_id
            WHERE 1=1`;
    }

    if (fecha) {
      query += legacySchema ? ' AND act.fecha = ?' : ' AND e.fecha_evento = ?';
      params.push(fecha);
    }

    if (atleta_id) {
      query += legacySchema ? ' AND a.atleta_id = ?' : ' AND da.atleta_id = ?';
      params.push(atleta_id);
    }

    if (categoria_id) {
      query += ' AND atl.categoria_id = ?';
      params.push(categoria_id);
    }

    query += legacySchema
      ? ' ORDER BY act.fecha DESC, atl.nombre ASC'
      : ' ORDER BY e.fecha_evento DESC, atl.nombre ASC';

    const [rows] = await pool.execute(query, params);
    res.json(normalizeAttendanceRows(rows));
  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
};

const createAsistencia = async (req, res) => {
  try {
    const { atleta_id, fecha, tipo_evento, estatus, observaciones, entrenador_id } = req.body;
    const legacySchema = await isLegacySchema();
    const evento_id = await getOrCreateEvento(fecha, tipo_evento || 'Entrenamiento', entrenador_id || null);

    const [existing] = await pool.execute(
      legacySchema
        ? 'SELECT asistencia_id FROM asistencias WHERE atleta_id = ? AND actividad_id = ?'
        : 'SELECT asistencia_id FROM detalle_asistencia WHERE atleta_id = ? AND evento_id = ?',
      [atleta_id, evento_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Ya existe un registro de asistencia para este atleta en este evento'
      });
    }

    const [result] = await pool.execute(
      legacySchema
        ? `INSERT INTO asistencias (actividad_id, atleta_id, estatus, observaciones)
           VALUES (?, ?, ?, ?)`
        : `INSERT INTO detalle_asistencia (evento_id, atleta_id, estatus, observaciones)
           VALUES (?, ?, ?, ?)`,
      [
        evento_id,
        atleta_id,
        legacySchema ? mapAttendanceStatusToLegacy(estatus) : mapAttendanceStatusToNormalized(estatus),
        observaciones || ''
      ]
    );

    res.status(200).json({
      message: 'Asistencia registrada exitosamente',
      id: result.insertId,
      evento_id
    });
  } catch (error) {
    console.error('Error registrando asistencia:', error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
};

const getAsistenciasByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const legacySchema = await isLegacySchema();

    const [rows] = await pool.execute(
      legacySchema
        ? `SELECT a.asistencia_id,
                  a.actividad_id as evento_id,
                  a.atleta_id,
                  a.estatus,
                  a.observaciones,
                  act.fecha as fecha,
                  act.tipo_actividad as tipo_evento,
                  atl.nombre as atleta_nombre,
                  atl.apellido as atleta_apellido,
                  atl.foto,
                  c.nombre_categoria as categoria_nombre,
                  TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad
           FROM asistencias a
           INNER JOIN actividades act ON a.actividad_id = act.actividad_id
           LEFT JOIN atletas atl ON a.atleta_id = atl.atleta_id
           LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
           WHERE act.fecha = ? AND atl.estatus IN (1, 2)
           ORDER BY atl.nombre ASC`
        : `SELECT da.asistencia_id,
                  da.evento_id,
                  da.atleta_id,
                  da.estatus,
                  da.observaciones,
                  e.fecha_evento as fecha,
                  e.tipo_evento,
                  atl.nombre as atleta_nombre,
                  atl.apellido as atleta_apellido,
                  atl.foto,
                  c.nombre_categoria as categoria_nombre,
                  TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad
           FROM detalle_asistencia da
           INNER JOIN evento_deportivo e ON da.evento_id = e.evento_id
           LEFT JOIN atletas atl ON da.atleta_id = atl.atleta_id
           LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
           WHERE e.fecha_evento = ? AND atl.estatus IN ('Activo', 'Lesionado')
           ORDER BY atl.nombre ASC`,
      [fecha]
    );

    res.json(normalizeAttendanceRows(rows));
  } catch (error) {
    console.error('Error obteniendo asistencias por fecha:', error);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
};

const updateAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estatus, observaciones } = req.body;
    const legacySchema = await isLegacySchema();

    const [result] = await pool.execute(
      legacySchema
        ? 'UPDATE asistencias SET estatus = ?, observaciones = ? WHERE asistencia_id = ?'
        : 'UPDATE detalle_asistencia SET estatus = ?, observaciones = ? WHERE asistencia_id = ?',
      [legacySchema ? mapAttendanceStatusToLegacy(estatus) : mapAttendanceStatusToNormalized(estatus), observaciones || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
    }

    res.json({ message: 'Asistencia actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando asistencia:', error);
    res.status(500).json({ error: 'Error al actualizar asistencia' });
  }
};

const deleteAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();

    const [result] = await pool.execute(
      legacySchema
        ? 'DELETE FROM asistencias WHERE asistencia_id = ?'
        : 'DELETE FROM detalle_asistencia WHERE asistencia_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
    }

    res.json({ message: 'Asistencia eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando asistencia:', error);
    res.status(500).json({ error: 'Error al eliminar asistencia' });
  }
};

module.exports = {
  getAsistencias,
  createAsistencia,
  getAsistenciasByFecha,
  updateAsistencia,
  deleteAsistencia
};
