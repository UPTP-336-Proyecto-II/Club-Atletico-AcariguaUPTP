const pool = require('../config/database');
const addressService = require('../services/addressService');
const { isLegacySchema } = require('../services/schemaService');
const { normalizeDateInput, validateDateField } = require('../services/dateValidationService');

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeRoleValue(value) {
  const roleId = Number.parseInt(value, 10);
  return Number.isNaN(roleId) ? null : roleId;
}

function hasAddressPayload(address) {
  if (!address || typeof address !== 'object') return false;
  return Boolean(
    address.pais ||
    address.estado ||
    address.municipio ||
    address.parroquia ||
    address.descripcion_descriptiva
  );
}

async function ensureLegacyAddressId(currentAddressId = null) {
  if (currentAddressId) return currentAddressId;

  const [dirRes] = await pool.execute(
    'INSERT INTO direcciones (parroquias_id, localidad, tipo_vivienda, `ubicaciÃ³n vivienda`) VALUES (?, ?, ?, ?)',
    [0, '', '', '']
  );
  return dirRes.insertId;
}

async function resolveLegacyEmail(emailFromBody, roleId, currentEmail = null) {
  const requestedEmail = normalizeText(emailFromBody);

  if (requestedEmail) {
    const [userExists] = await pool.execute('SELECT 1 FROM usuarios WHERE email = ? LIMIT 1', [requestedEmail]);
    if (userExists.length === 0) {
      throw new Error('El correo no existe en usuarios');
    }

    const [inUse] = await pool.execute(
      'SELECT personal_id FROM personal WHERE email_id = ? LIMIT 1',
      [requestedEmail]
    );

    if (inUse.length > 0 && requestedEmail !== currentEmail) {
      throw new Error('El correo ya esta asignado a otro miembro del plantel');
    }

    return requestedEmail;
  }

  if (currentEmail) {
    return currentEmail;
  }

  const params = [];
  let query = `
    SELECT u.email
    FROM usuarios u
    LEFT JOIN personal p ON p.email_id = u.email
    WHERE p.personal_id IS NULL`;

  if (roleId) {
    query += ' AND u.rol = ?';
    params.push(roleId);
  }

  query += ' ORDER BY u.email ASC LIMIT 1';

  const [byRole] = await pool.execute(query, params);
  if (byRole.length > 0) {
    return byRole[0].email;
  }

  const [anyRole] = await pool.execute(
    `SELECT u.email
     FROM usuarios u
     LEFT JOIN personal p ON p.email_id = u.email
     WHERE p.personal_id IS NULL
     ORDER BY u.email ASC
     LIMIT 1`
  );

  if (anyRole.length > 0) {
    return anyRole[0].email;
  }

  return null;
}

async function buildBaseSelect(legacySchema) {
  const addressColumns = await addressService.getSelectColumnsForSchema();
  const addressJoins = await addressService.getJoinsForSchema('pl');

  if (legacySchema) {
    return `
      SELECT
        pl.personal_id AS plantel_id,
        pl.email_id,
        pl.nombre,
        pl.apellido,
        pl.telefono,
        pl.rol_personal AS rol_id,
        pl.cedula,
        pl.fecha_nac,
        pl.direccion_id,
        pl.foto,
        pl.created_at,
        pl.updated_at,
        r.nombre_rol,
        ${addressColumns}
      FROM personal pl
      LEFT JOIN rol_usuarios r ON pl.rol_personal = r.rol_id
      ${addressJoins}
      WHERE 1=1`;
  }

  return `
    SELECT
      pl.plantel_id,
      pl.nombre,
      pl.apellido,
      pl.telefono,
      pl.rol_id,
      pl.cedula,
      pl.fecha_nac,
      pl.direccion_id,
      pl.foto,
      pl.created_at,
      pl.updated_at,
      r.nombre_rol,
      ${addressColumns}
    FROM plantel pl
    LEFT JOIN rol_usuarios r ON pl.rol_id = r.rol_id
    ${addressJoins}
    WHERE 1=1`;
}

// Obtener todo el plantel
const getPlantel = async (req, res) => {
  try {
    const { rol, sort, cedula, sin_cedula } = req.query;
    const legacySchema = await isLegacySchema();

    let query = await buildBaseSelect(legacySchema);
    const params = [];

    if (cedula) {
      query += ' AND pl.cedula LIKE ?';
      params.push(`%${cedula}%`);
    }

    if (sin_cedula === 'true') {
      query += ' AND (pl.cedula IS NULL OR pl.cedula = \'\')';
    }

    if (rol) {
      const rolId = normalizeRoleValue(rol);
      if (rolId !== null) {
        query += legacySchema ? ' AND pl.rol_personal = ?' : ' AND pl.rol_id = ?';
        params.push(rolId);
      } else {
        query += ' AND UPPER(r.nombre_rol) = UPPER(?)';
        params.push(rol);
      }
    }

    let orderBy = legacySchema
      ? 'pl.rol_personal ASC, pl.nombre ASC'
      : 'pl.rol_id ASC, pl.nombre ASC';

    switch (sort) {
      case 'reciente':
        orderBy = 'pl.created_at DESC';
        break;
      case 'antiguo':
        orderBy = 'pl.created_at ASC';
        break;
      case 'az':
        orderBy = 'pl.nombre ASC';
        break;
      case 'za':
        orderBy = 'pl.nombre DESC';
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

// Obtener miembro del plantel por ID
const getPlantelById = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();

    let query = await buildBaseSelect(legacySchema);
    query += legacySchema ? ' AND pl.personal_id = ?' : ' AND pl.plantel_id = ?';

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Miembro del plantel no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo miembro del plantel:', error);
    res.status(500).json({ error: 'Error al obtener miembro del plantel' });
  }
};

// Obtener plantel por rol
const getPlantelByRol = async (req, res) => {
  try {
    const { rol } = req.params;
    const legacySchema = await isLegacySchema();

    let query = await buildBaseSelect(legacySchema);
    const params = [];
    const rolId = normalizeRoleValue(rol);

    if (rolId !== null) {
      query += legacySchema ? ' AND pl.rol_personal = ?' : ' AND pl.rol_id = ?';
      params.push(rolId);
    } else {
      query += ' AND UPPER(r.nombre_rol) = UPPER(?)';
      params.push(rol);
    }

    query += ' ORDER BY pl.nombre ASC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo plantel por rol:', error);
    res.status(500).json({ error: 'Error al obtener plantel' });
  }
};

// Crear miembro del plantel
const createMiembroPlantel = async (req, res) => {
  try {
    const { nombre, apellido, telefono, rol, cedula, fecha_nac, direccion, foto, email_id } = req.body;
    const legacySchema = await isLegacySchema();
    const fechaNacValue = normalizeDateInput(fecha_nac);
    const fechaNacError = validateDateField(fechaNacValue, 'La fecha de nacimiento', { notFuture: true });

    if (fechaNacError) {
      return res.status(400).json({ error: fechaNacError });
    }

    let direccionId = null;
    if (hasAddressPayload(direccion)) {
      direccionId = await addressService.findOrCreateAddress(direccion);
    }

    if (legacySchema) {
      const rolId = normalizeRoleValue(rol);
      const finalRole = rolId === null ? 1 : rolId;
      const finalDireccionId = await ensureLegacyAddressId(direccionId);
      const finalEmail = await resolveLegacyEmail(email_id, finalRole);

      if (!finalEmail) {
        return res.status(400).json({
          error: 'No hay correos disponibles en usuarios para vincular este miembro'
        });
      }

      const cedulaValue = normalizeText(cedula) || `TEMP${Date.now().toString().slice(-8)}`;
      const telefonoValue = normalizeText(telefono) || '00000000000';
      const legacyFechaNacValue = fechaNacValue || '2000-01-01';

      const [result] = await pool.execute(
        `INSERT INTO personal
         (email_id, nombre, apellido, cedula, telefono, fecha_nac, direccion_id, rol_personal, foto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalEmail,
          normalizeText(nombre),
          normalizeText(apellido),
          cedulaValue,
          telefonoValue,
          legacyFechaNacValue,
          finalDireccionId,
          finalRole,
          foto || null
        ]
      );

      return res.status(201).json({
        message: 'Miembro del plantel agregado exitosamente',
        id: result.insertId
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO plantel (nombre, apellido, telefono, rol_id, cedula, fecha_nac, direccion_id, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizeText(nombre),
        normalizeText(apellido),
        telefono || null,
        normalizeRoleValue(rol),
        cedula || null,
        fechaNacValue || null,
        direccionId,
        foto || null
      ]
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

// Actualizar miembro del plantel
const updateMiembroPlantel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, rol, cedula, fecha_nac, direccion, foto, email_id } = req.body;
    const legacySchema = await isLegacySchema();
    const fechaNacValue = normalizeDateInput(fecha_nac);
    const fechaNacError = validateDateField(fechaNacValue, 'La fecha de nacimiento', { notFuture: true });

    if (fechaNacError) {
      return res.status(400).json({ error: fechaNacError });
    }

    if (legacySchema) {
      const [existingRows] = await pool.execute(
        `SELECT personal_id, email_id, nombre, apellido, telefono, rol_personal, cedula, fecha_nac, direccion_id, foto
         FROM personal
         WHERE personal_id = ?`,
        [id]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'Miembro del plantel no encontrado' });
      }

      const existing = existingRows[0];
      const parsedRole = normalizeRoleValue(rol);
      const finalRole = parsedRole === null ? existing.rol_personal : parsedRole;
      const finalEmail = await resolveLegacyEmail(email_id, finalRole, existing.email_id);

      if (!finalEmail) {
        return res.status(400).json({
          error: 'No hay correos disponibles en usuarios para vincular este miembro'
        });
      }

      let finalDireccionId = existing.direccion_id;
      if (hasAddressPayload(direccion)) {
        finalDireccionId = await addressService.findOrCreateAddress(direccion);
      }
      finalDireccionId = await ensureLegacyAddressId(finalDireccionId);

      const cedulaValue = normalizeText(cedula) || existing.cedula;
      const telefonoValue = normalizeText(telefono) || existing.telefono;
      const finalFechaNacValue = fechaNacValue || existing.fecha_nac;

      await pool.execute(
        `UPDATE personal
         SET email_id = ?,
             nombre = ?,
             apellido = ?,
             cedula = ?,
             telefono = ?,
             fecha_nac = ?,
             direccion_id = ?,
             rol_personal = ?,
             foto = ?
         WHERE personal_id = ?`,
        [
          finalEmail,
          normalizeText(nombre) || existing.nombre,
          normalizeText(apellido) || existing.apellido,
          cedulaValue,
          telefonoValue,
          finalFechaNacValue,
          finalDireccionId,
          finalRole,
          foto !== undefined ? (foto || null) : existing.foto,
          id
        ]
      );

      return res.json({ message: 'Miembro del plantel actualizado exitosamente' });
    }

    let finalDireccionId = null;
    if (hasAddressPayload(direccion)) {
      finalDireccionId = await addressService.findOrCreateAddress(direccion);
    } else {
      const [existing] = await pool.execute('SELECT direccion_id FROM plantel WHERE plantel_id = ?', [id]);
      if (existing.length > 0) finalDireccionId = existing[0].direccion_id;
    }

    const [result] = await pool.execute(
      `UPDATE plantel
       SET nombre = ?, apellido = ?, telefono = ?, rol_id = ?, cedula = ?, fecha_nac = ?, direccion_id = ?, foto = ?
       WHERE plantel_id = ?`,
      [nombre, apellido, telefono, rol, cedula || null, fechaNacValue || null, finalDireccionId, foto || null, id]
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

// Eliminar miembro del plantel
const deleteMiembroPlantel = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();

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
      legacySchema ? 'DELETE FROM personal WHERE personal_id = ?' : 'DELETE FROM plantel WHERE plantel_id = ?',
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
