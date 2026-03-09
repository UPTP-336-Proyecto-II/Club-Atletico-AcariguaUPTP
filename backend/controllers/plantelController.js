const pool = require('../config/database');
const addressService = require('../services/addressService');
const { isLegacySchema } = require('../services/schemaService');

const getPlantel = async (req, res) => {
  try {
    const { rol, sort, cedula, sin_cedula } = req.query;
    const legacySchema = await isLegacySchema();

    let query;
    const params = [];

    if (legacySchema) {
      query = `
            SELECT p.personal_id as plantel_id,
                   p.email_id,
                   p.nombre,
                   p.apellido,
                   p.cedula,
                   p.telefono,
                   p.fecha_nac,
                   p.rol_personal as rol_id,
                   p.direccion_id,
                   p.foto,
                   p.created_at,
                   p.updated_at,
                   r.nombre_rol,
                   'Venezuela' as pais,
                   e.estado as estado,
                   m.municipio as municipio,
                   pa.parroquia as parroquia,
                   d.localidad as descripcion_descriptiva
            FROM personal p
            LEFT JOIN rol_usuarios r ON p.rol_personal = r.rol_id
            LEFT JOIN direcciones d ON p.direccion_id = d.direccion_id
            LEFT JOIN parroquias pa ON d.parroquias_id = pa.parroquia_id
            LEFT JOIN municipios m ON pa.municipio_id = m.municipio_id
            LEFT JOIN estados e ON m.estadoi_id = e.estado_id
            WHERE 1=1`;
    } else {
      query = `
            SELECT p.*, r.nombre_rol,
                   ${addressService.getSelectColumns().replace(/d\./g, 'd.')}
            FROM plantel p
            LEFT JOIN rol_usuarios r ON p.rol_id = r.rol_id
            ${addressService.getJoins().replace('entity.direccion_id', 'p.direccion_id')}
            WHERE 1=1`;
    }

    if (cedula) {
      query += ' AND p.cedula LIKE ?';
      params.push(`%${cedula}%`);
    }

    if (sin_cedula === 'true') {
      query += ' AND (p.cedula IS NULL OR p.cedula = \'\')';
    }

    if (rol) {
      const rolId = parseInt(rol, 10);
      if (!Number.isNaN(rolId)) {
        query += legacySchema ? ' AND p.rol_personal = ?' : ' AND p.rol_id = ?';
        params.push(rolId);
      } else {
        query += ' AND UPPER(r.nombre_rol) = UPPER(?)';
        params.push(rol);
      }
    }

    let orderBy = legacySchema ? 'p.rol_personal ASC, p.nombre ASC' : 'p.rol_id ASC, p.nombre ASC';

    switch (sort) {
      case 'reciente':
        orderBy = 'p.created_at DESC';
        break;
      case 'antiguo':
        orderBy = 'p.created_at ASC';
        break;
      case 'az':
        orderBy = 'p.nombre ASC';
        break;
      case 'za':
        orderBy = 'p.nombre DESC';
        break;
    }

    query += ` ORDER BY ${orderBy}`;

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo plantel:', error);
    res.status(500).json({ error: 'Error al obtener plantel' });
  }
};

const getPlantelById = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();

    const [rows] = await pool.execute(
      legacySchema
        ? `SELECT p.personal_id as plantel_id,
                  p.email_id,
                  p.nombre,
                  p.apellido,
                  p.cedula,
                  p.telefono,
                  p.fecha_nac,
                  p.rol_personal as rol_id,
                  p.direccion_id,
                  p.foto,
                  p.created_at,
                  p.updated_at,
                  r.nombre_rol,
                  'Venezuela' as pais,
                  e.estado as estado,
                  m.municipio as municipio,
                  pa.parroquia as parroquia,
                  d.localidad as descripcion_descriptiva
           FROM personal p
           LEFT JOIN rol_usuarios r ON p.rol_personal = r.rol_id
           LEFT JOIN direcciones d ON p.direccion_id = d.direccion_id
           LEFT JOIN parroquias pa ON d.parroquias_id = pa.parroquia_id
           LEFT JOIN municipios m ON pa.municipio_id = m.municipio_id
           LEFT JOIN estados e ON m.estadoi_id = e.estado_id
           WHERE p.personal_id = ?`
        : `SELECT p.*,
                  ${addressService.getSelectColumns().replace(/d\./g, 'd.')}
           FROM plantel p
           ${addressService.getJoins().replace('entity.direccion_id', 'p.direccion_id')}
           WHERE p.plantel_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Miembro del plantel no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo miembro del plantel:', error);
    res.status(500).json({ error: 'Error al obtener miembro del plantel' });
  }
};

const getPlantelByRol = async (req, res) => {
  req.query = { ...req.query, rol: req.params.rol };
  return getPlantel(req, res);
};

const createMiembroPlantel = async (req, res) => {
  try {
    const { nombre, apellido, telefono, rol, cedula, fecha_nac, direccion } = req.body;

    let direccion_id = null;
    if (direccion) {
      direccion_id = await addressService.findOrCreateAddress(direccion);
    }

    const [result] = await pool.execute(
      `INSERT INTO plantel (nombre, apellido, telefono, rol_id, cedula, fecha_nac, direccion_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, telefono, rol, cedula || null, fecha_nac || null, direccion_id]
    );

    res.status(201).json({
      message: 'Miembro del plantel agregado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creando miembro del plantel:', error);
    res.status(500).json({ error: 'Error al crear miembro del plantel' });
  }
};

const updateMiembroPlantel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, rol, cedula, fecha_nac, direccion } = req.body;

    let finalDireccionId = undefined;
    if (direccion) {
      finalDireccionId = await addressService.findOrCreateAddress(direccion);
    } else {
      const [existing] = await pool.execute('SELECT direccion_id FROM plantel WHERE plantel_id = ?', [id]);
      if (existing.length > 0) finalDireccionId = existing[0].direccion_id;
    }

    const [result] = await pool.execute(
      `UPDATE plantel
       SET nombre = ?, apellido = ?, telefono = ?, rol_id = ?, cedula = ?, fecha_nac = ?, direccion_id = ?
       WHERE plantel_id = ?`,
      [nombre, apellido, telefono, rol, cedula || null, fecha_nac || null, finalDireccionId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Miembro del plantel no encontrado' });
    }

    res.json({ message: 'Miembro del plantel actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando miembro del plantel:', error);
    res.status(500).json({ error: 'Error al actualizar miembro del plantel' });
  }
};

const deleteMiembroPlantel = async (req, res) => {
  try {
    const { id } = req.params;

    const [categorias] = await pool.execute(
      'SELECT COUNT(*) as total FROM categoria WHERE entrenador_id = ?',
      [id]
    );

    if (categorias[0].total > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar porque esta asignado a una o mas categorias'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM plantel WHERE plantel_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Miembro del plantel no encontrado' });
    }

    res.json({ message: 'Miembro del plantel eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando miembro del plantel:', error);
    res.status(500).json({ error: 'Error al eliminar miembro del plantel' });
  }
};

module.exports = {
  getPlantel,
  getPlantelById,
  getPlantelByRol,
  createMiembroPlantel,
  updateMiembroPlantel,
  deleteMiembroPlantel
};
