const pool = require('../config/database');
const addressService = require('../services/addressService');
const { isLegacySchema } = require('../services/schemaService');

function getNameParts({ nombres, apellidos, nombre_completo }) {
  if (nombres || apellidos) {
    const firstName = (nombres || '').trim();
    const lastName = (apellidos || '').trim();
    return {
      nombres: firstName,
      apellidos: lastName,
      nombreCompleto: `${firstName} ${lastName}`.trim()
    };
  }

  const fullName = String(nombre_completo || '').trim();
  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    nombres: parts[0] || '',
    apellidos: parts.slice(1).join(' '),
    nombreCompleto: fullName
  };
}

function mapTutorRelation(value, legacySchema) {
  const rawValue = String(value || '').trim();
  const normalized = rawValue.toLowerCase();

  if (legacySchema) {
    const allowedLegacy = ['abuelo/a', 'padres', 'tio/a', 'hermano/a', 'primo/a', 'representante'];
    if (allowedLegacy.includes(normalized)) {
      return normalized;
    }

    switch (normalized) {
      case 'familiar':
      case 'padre':
      case 'madre':
      case 'padre/madre':
      case 'familiar (padre/madre)':
        return 'padres';
      case 'adyegado a familia':
      case 'allegado a familia':
      case 'representante legal':
      case 'otro':
      case 'otro':
      case 'tutor legal':
        return 'representante';
      default:
        return 'representante';
    }
  }

  const allowedNormalized = ['Padre', 'Madre', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Tutor Legal', 'Otro'];
  if (allowedNormalized.includes(rawValue)) {
    return rawValue;
  }

  switch (normalized) {
    case 'familiar':
    case 'padre/madre':
    case 'familiar (padre/madre)':
      return 'Padre';
    case 'madre':
      return 'Madre';
    case 'abuelo/a':
      return 'Abuelo/a';
    case 'tio/a':
      return 'Tío/a';
    case 'hermano/a':
      return 'Hermano/a';
    case 'representante legal':
    case 'tutor legal':
    case 'allegado a familia':
    case 'adyegado a familia':
      return 'Tutor Legal';
    case 'otro':
      return 'Otro';
    default:
      return 'Tutor Legal';
  }
}

async function findOrCreateLegacyAddress(addressData = {}) {
  const estadoName = String(addressData.estado || 'Sin estado').trim();
  const municipioName = String(addressData.municipio || 'Sin municipio').trim();
  const parroquiaName = String(addressData.parroquia || 'Sin parroquia').trim();
  const description = String(addressData.descripcion_descriptiva || 'Sin referencia').trim();

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let [estados] = await connection.execute(
      'SELECT estado_id FROM estados WHERE UPPER(estado) = UPPER(?) LIMIT 1',
      [estadoName]
    );

    let estadoId;
    if (estados.length > 0) {
      estadoId = estados[0].estado_id;
    } else {
      const [estadoResult] = await connection.execute(
        'INSERT INTO estados (`estado`, `iso_3166-2`) VALUES (?, ?)',
        [estadoName, '']
      );
      estadoId = estadoResult.insertId;
    }

    let [municipios] = await connection.execute(
      'SELECT municipio_id FROM municipios WHERE UPPER(municipio) = UPPER(?) AND estadoi_id = ? LIMIT 1',
      [municipioName, estadoId]
    );

    let municipioId;
    if (municipios.length > 0) {
      municipioId = municipios[0].municipio_id;
    } else {
      const [municipioResult] = await connection.execute(
        'INSERT INTO municipios (estadoi_id, municipio) VALUES (?, ?)',
        [estadoId, municipioName]
      );
      municipioId = municipioResult.insertId;
    }

    let [parroquias] = await connection.execute(
      'SELECT parroquia_id FROM parroquias WHERE UPPER(parroquia) = UPPER(?) AND municipio_id = ? LIMIT 1',
      [parroquiaName, municipioId]
    );

    let parroquiaId;
    if (parroquias.length > 0) {
      parroquiaId = parroquias[0].parroquia_id;
    } else {
      const [parroquiaResult] = await connection.execute(
        'INSERT INTO parroquias (municipio_id, parroquia) VALUES (?, ?)',
        [municipioId, parroquiaName]
      );
      parroquiaId = parroquiaResult.insertId;
    }

    let [direcciones] = await connection.execute(
      'SELECT direccion_id FROM direcciones WHERE parroquias_id = ? AND localidad = ? LIMIT 1',
      [parroquiaId, description]
    );

    let direccionId;
    if (direcciones.length > 0) {
      direccionId = direcciones[0].direccion_id;
    } else {
      const [direccionResult] = await connection.execute(
        'INSERT INTO direcciones (parroquias_id, localidad, tipo_vivienda, `ubicación vivienda`) VALUES (?, ?, ?, ?)',
        [parroquiaId, description, 'casa', description]
      );
      direccionId = direccionResult.insertId;
    }

    await connection.commit();
    return direccionId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const getTutores = async (req, res) => {
  try {
    const legacySchema = await isLegacySchema();

    const [rows] = await pool.execute(
      legacySchema
        ? `SELECT r.representante_id as tutor_id,
                  r.nombre_completo,
                  r.cedula,
                  r.telefono,
                  NULL as correo,
                  r.tipo_relacion,
                  r.direccion_id,
                  r.foto,
                  r.created_at,
                  r.updated_at,
                  COUNT(a.atleta_id) as total_atletas
           FROM representante r
           LEFT JOIN atletas a ON r.representante_id = a.representante_id AND a.estatus IN (1, 2)
           GROUP BY r.representante_id, r.nombre_completo, r.cedula, r.telefono, r.tipo_relacion, r.direccion_id, r.foto, r.created_at, r.updated_at
           ORDER BY r.nombre_completo ASC`
        : `SELECT t.*,
                  CONCAT(t.nombres, ' ', t.apellidos) as nombre_completo,
                  COUNT(a.atleta_id) as total_atletas
           FROM tutor t
           LEFT JOIN atletas a ON t.tutor_id = a.tutor_id
           GROUP BY t.tutor_id
           ORDER BY t.nombres ASC, t.apellidos ASC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo tutores:', error);
    res.status(500).json({ error: 'Error al obtener tutores' });
  }
};

const getTutorById = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();

    const [rows] = await pool.execute(
      legacySchema
        ? `SELECT r.representante_id as tutor_id,
                  r.nombre_completo,
                  r.cedula,
                  r.telefono,
                  NULL as correo,
                  r.tipo_relacion,
                  r.direccion_id,
                  r.foto,
                  r.created_at,
                  r.updated_at,
                  'Venezuela' as pais,
                  e.estado as estado,
                  m.municipio as municipio,
                  pa.parroquia as parroquia,
                  d.localidad as descripcion_descriptiva
           FROM representante r
           LEFT JOIN direcciones d ON r.direccion_id = d.direccion_id
           LEFT JOIN parroquias pa ON d.parroquias_id = pa.parroquia_id
           LEFT JOIN municipios m ON pa.municipio_id = m.municipio_id
           LEFT JOIN estados e ON m.estadoi_id = e.estado_id
           WHERE r.representante_id = ?`
        : `SELECT t.*,
                  CONCAT(t.nombres, ' ', t.apellidos) as nombre_completo,
                  ${addressService.getSelectColumns().replace(/d\./g, 'd.')}
           FROM tutor t
           ${addressService.getJoins().replace('entity.direccion_id', 't.direccion_id')}
           WHERE t.tutor_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }

    const [atletas] = await pool.execute(
      legacySchema
        ? `SELECT atleta_id, nombre, apellido
           FROM atletas
           WHERE representante_id = ? AND estatus IN (1, 2)`
        : `SELECT atleta_id, nombre, apellido
           FROM atletas
           WHERE tutor_id = ? AND estatus IN ('ACTIVO', 'LESIONADO', 'Activo', 'Lesionado')`,
      [id]
    );

    res.json({
      ...rows[0],
      atletas
    });
  } catch (error) {
    console.error('Error obteniendo tutor:', error);
    res.status(500).json({ error: 'Error al obtener tutor' });
  }
};

const createTutor = async (req, res) => {
  try {
    const { nombres, apellidos, nombre_completo, cedula, telefono, correo, direccion, tipo_relacion } = req.body;
    const legacySchema = await isLegacySchema();
    const nameParts = getNameParts({ nombres, apellidos, nombre_completo });
    const relation = mapTutorRelation(tipo_relacion, legacySchema);

    if (legacySchema) {
      const direccionId = await findOrCreateLegacyAddress(direccion || {});

      const [result] = await pool.execute(
        `INSERT INTO representante (nombre_completo, telefono, cedula, tipo_relacion, direccion_id, foto)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nameParts.nombreCompleto, telefono, cedula, relation, direccionId, null]
      );

      return res.status(201).json({
        message: 'Tutor registrado exitosamente',
        id: result.insertId,
        tutor_id: result.insertId
      });
    }

    let direccion_id = null;
    if (direccion) {
      direccion_id = await addressService.findOrCreateAddress(direccion);
    }

    const [result] = await pool.execute(
      `INSERT INTO tutor (nombres, apellidos, cedula, telefono, correo, direccion_id, tipo_relacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nameParts.nombres, nameParts.apellidos || '', cedula, telefono, correo || null, direccion_id, relation]
    );

    res.status(201).json({
      message: 'Tutor registrado exitosamente',
      id: result.insertId,
      tutor_id: result.insertId
    });
  } catch (error) {
    console.error('Error creando tutor:', error);
    res.status(500).json({ error: 'Error al crear tutor' });
  }
};

const updateTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, nombre_completo, cedula, telefono, correo, direccion, tipo_relacion } = req.body;
    const legacySchema = await isLegacySchema();
    const nameParts = getNameParts({ nombres, apellidos, nombre_completo });
    const relation = mapTutorRelation(tipo_relacion, legacySchema);

    if (legacySchema) {
      let direccionId;
      if (direccion) {
        direccionId = await findOrCreateLegacyAddress(direccion);
      } else {
        const [existing] = await pool.execute('SELECT direccion_id FROM representante WHERE representante_id = ?', [id]);
        direccionId = existing.length > 0 ? existing[0].direccion_id : null;
      }

      const [result] = await pool.execute(
        `UPDATE representante
         SET nombre_completo = ?, cedula = ?, telefono = ?, tipo_relacion = ?, direccion_id = ?
         WHERE representante_id = ?`,
        [nameParts.nombreCompleto, cedula, telefono, relation, direccionId, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tutor no encontrado' });
      }

      return res.json({ message: 'Tutor actualizado exitosamente' });
    }

    let finalDireccionId;
    if (direccion) {
      finalDireccionId = await addressService.findOrCreateAddress(direccion);
    } else {
      const [existing] = await pool.execute('SELECT direccion_id FROM tutor WHERE tutor_id = ?', [id]);
      finalDireccionId = existing.length > 0 ? existing[0].direccion_id : null;
    }

    const [result] = await pool.execute(
      `UPDATE tutor
       SET nombres = ?, apellidos = ?, cedula = ?, telefono = ?, correo = ?, direccion_id = ?, tipo_relacion = ?
       WHERE tutor_id = ?`,
      [nameParts.nombres, nameParts.apellidos || '', cedula, telefono, correo || null, finalDireccionId, relation, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }

    res.json({ message: 'Tutor actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando tutor:', error);
    res.status(500).json({ error: 'Error al actualizar tutor' });
  }
};

const deleteTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();

    const [atletas] = await pool.execute(
      legacySchema
        ? 'SELECT COUNT(*) as total FROM atletas WHERE representante_id = ?'
        : 'SELECT COUNT(*) as total FROM atletas WHERE tutor_id = ?',
      [id]
    );

    if (atletas[0].total > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el tutor porque tiene atletas asociados'
      });
    }

    const [result] = await pool.execute(
      legacySchema
        ? 'DELETE FROM representante WHERE representante_id = ?'
        : 'DELETE FROM tutor WHERE tutor_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }

    res.json({ message: 'Tutor eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando tutor:', error);
    res.status(500).json({ error: 'Error al eliminar tutor' });
  }
};

module.exports = {
  getTutores,
  getTutorById,
  createTutor,
  updateTutor,
  deleteTutor
};
