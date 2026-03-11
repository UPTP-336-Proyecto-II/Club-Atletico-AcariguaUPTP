const pool = require('../config/database');
const addressService = require('../services/addressService');
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
const {
  isLegacySchema,
  isMigratedLegacySchema,
=======
const {
  isLegacySchema,
>>>>>>> main
  mapLegacyAthleteStatus,
  mapAthleteStatusToLegacy
} = require('../services/schemaService');

<<<<<<< HEAD
function buildLegacyAtletaSelect(isMigrated = false) {
  let selectColumns;
  let joins;

  if (isMigrated) {
      selectColumns = `
                 d.pais as pais,
                 d.estado as estado,
                 d.municipio as municipio,
                 d.parroquia as parroquia,
                 d.descripcion_descriptiva as descripcion_descriptiva`;
      joins = `
          LEFT JOIN direcciones d ON a.direccion_id = d.direccion_id`;
  } else {
      selectColumns = `
                 'Venezuela' as pais,
                 e.estado as estado,
                 m.municipio as municipio,
                 pa.parroquia as parroquia,
                 d.localidad as descripcion_descriptiva`;
      joins = `
          LEFT JOIN direcciones d ON a.direccion_id = d.direccion_id
          LEFT JOIN parroquias pa ON d.parroquias_id = pa.parroquia_id
          LEFT JOIN municipios m ON pa.municipio_id = m.municipio_id
          LEFT JOIN estados e ON m.estadoi_id = e.estado_id`;
  }

=======
function buildLegacyAtletaSelect() {
>>>>>>> main
  return `SELECT a.atleta_id,
                 a.nombre,
                 a.apellido,
                 a.fecha_nacimiento,
                 a.sexo,
                 a.cedula,
                 a.telefono,
                 a.posicion_de_juego,
                 a.pierna_dominante,
                 a.direccion_id,
                 a.categoria_id,
                 a.representante_id as tutor_id,
                 a.foto,
                 CASE a.estatus
                   WHEN 0 THEN 'SUSPENDIDO'
                   WHEN 1 THEN 'ACTIVO'
                   WHEN 2 THEN 'LESIONADO'
                   WHEN 3 THEN 'INACTIVO'
                   ELSE CAST(a.estatus AS CHAR)
                 END as estatus,
                 a.created_at,
                 a.updated_at,
                 TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) as edad,
                 c.nombre_categoria as categoria_nombre,
                 SUBSTRING_INDEX(COALESCE(r.nombre_completo, ''), ' ', 1) as tutor_nombres,
                 TRIM(SUBSTRING(COALESCE(r.nombre_completo, ''), LENGTH(SUBSTRING_INDEX(COALESCE(r.nombre_completo, ''), ' ', 1)) + 1)) as tutor_apellidos,
                 COALESCE(r.nombre_completo, '') as tutor_nombre,
                 r.telefono as tutor_telefono,
<<<<<<< HEAD
                 p.nombre_posicion as posicion_de_juego_nombre,
                 ${selectColumns}
=======
                 'Venezuela' as pais,
                 e.estado as estado,
                 m.municipio as municipio,
                 pa.parroquia as parroquia,
                 d.localidad as descripcion_descriptiva,
                 p.nombre_posicion as posicion_de_juego_nombre
>>>>>>> main
          FROM atletas a
          LEFT JOIN categoria c ON a.categoria_id = c.categoria_id
          LEFT JOIN representante r ON a.representante_id = r.representante_id
          LEFT JOIN posicion_juego p ON a.posicion_de_juego = p.posicion_id
<<<<<<< HEAD
          ${joins}`;
}
>>>>>>> Stashed changes
=======
          LEFT JOIN direcciones d ON a.direccion_id = d.direccion_id
          LEFT JOIN parroquias pa ON d.parroquias_id = pa.parroquia_id
          LEFT JOIN municipios m ON pa.municipio_id = m.municipio_id
          LEFT JOIN estados e ON m.estadoi_id = e.estado_id`;
}
>>>>>>> main

const getAtletas = async (req, res) => {
  try {
    const { search, cedula, sin_cedula, categoria_id, estatus, order } = req.query;
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
    const legacySchema = await isLegacySchema();
    const migratedLegacySchema = await isMigratedLegacySchema();
>>>>>>> Stashed changes
=======
    const legacySchema = await isLegacySchema();
>>>>>>> main

    let query;
    const params = [];

<<<<<<< HEAD
<<<<<<< Updated upstream
=======
    if (legacySchema) {
      query = `${buildLegacyAtletaSelect(migratedLegacySchema)} WHERE 1=1`;
=======
    if (legacySchema) {
      query = `${buildLegacyAtletaSelect()} WHERE 1=1`;
>>>>>>> main
    } else {
      query = `SELECT a.*,
                      TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) as edad,
                      c.nombre_categoria as categoria_nombre,
                      t.nombres as tutor_nombres, t.apellidos as tutor_apellidos,
                      CONCAT(t.nombres, ' ', t.apellidos) as tutor_nombre,
                      ${addressService.getSelectColumns().replace(/d\./g, 'd.')},
                      p.nombre_posicion as posicion_de_juego_nombre
               FROM atletas a
               LEFT JOIN categoria c ON a.categoria_id = c.categoria_id
               LEFT JOIN tutor t ON a.tutor_id = t.tutor_id
               LEFT JOIN posicion_juego p ON a.posicion_de_juego = p.posicion_id
               ${addressService.getJoins().replace('entity.direccion_id', 'a.direccion_id')}
               WHERE 1=1`;
    }

<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> main
    if (search) {
      query += ' AND (a.nombre LIKE ? OR a.apellido LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cedula) {
      query += ' AND a.cedula LIKE ?';
      params.push(`%${cedula}%`);
    }

    if (sin_cedula === 'true') {
      query += ' AND (a.cedula IS NULL OR a.cedula = \'\')';
    }

    if (req.query.con_cedula === 'true') {
      query += ' AND a.cedula IS NOT NULL AND a.cedula != \'\'';
    }

    if (categoria_id) {
      query += ' AND a.categoria_id = ?';
      params.push(categoria_id);
    }

    if (estatus && estatus !== 'TODOS') {
      if (legacySchema) {
        query += ' AND a.estatus = ?';
        params.push(mapAthleteStatusToLegacy(estatus));
      } else {
        query += ' AND a.estatus = ?';
        params.push(estatus);
      }
    } else if (!estatus) {
      query += legacySchema
        ? ' AND a.estatus IN (1, 2)'
        : " AND a.estatus IN ('ACTIVO', 'LESIONADO', 'Activo', 'Lesionado')";
    }

    switch (order) {
      case 'oldest':
        query += ' ORDER BY a.created_at ASC';
        break;
      case 'name_asc':
        query += ' ORDER BY a.nombre ASC, a.apellido ASC';
        break;
      case 'name_desc':
        query += ' ORDER BY a.nombre DESC, a.apellido DESC';
        break;
      default:
        query += ' ORDER BY a.created_at DESC';
    }

    const [rows] = await pool.execute(query, params);

    if (legacySchema) {
      rows.forEach(row => {
        row.estatus = mapLegacyAthleteStatus(row.estatus);
      });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo atletas:', error);
    res.status(500).json({ error: 'Error al obtener atletas', details: error.message });
  }
};

const getAtletaById = async (req, res) => {
  try {
    const { id } = req.params;
<<<<<<< HEAD
<<<<<<< Updated upstream
    const [rows] = await pool.execute(
      `SELECT a.*, 
              TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) as edad,
              c.nombre_categoria as categoria_nombre,
              t.nombres as tutor_nombres, t.apellidos as tutor_apellidos,
              CONCAT(t.nombres, ' ', t.apellidos) as tutor_nombre,
              t.telefono as tutor_telefono,
              ${addressService.getSelectColumns().replace(/d\./g, 'd.')},
              p.nombre_posicion as posicion_de_juego_nombre
       FROM atletas a 
       LEFT JOIN categoria c ON a.categoria_id = c.categoria_id
       LEFT JOIN tutor t ON a.tutor_id = t.tutor_id
       LEFT JOIN posicion_juego p ON a.posicion_de_juego = p.posicion_id
       ${addressService.getJoins().replace('entity.direccion_id', 'a.direccion_id')}
       WHERE a.atleta_id = ?`,
=======
    const legacySchema = await isLegacySchema();
    const migratedLegacySchema = await isMigratedLegacySchema();

    const [rows] = await pool.execute(
      legacySchema
        ? `${buildLegacyAtletaSelect(migratedLegacySchema)} WHERE a.atleta_id = ?`
=======
    const legacySchema = await isLegacySchema();

    const [rows] = await pool.execute(
      legacySchema
        ? `${buildLegacyAtletaSelect()} WHERE a.atleta_id = ?`
>>>>>>> main
        : `SELECT a.*,
                  TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) as edad,
                  c.nombre_categoria as categoria_nombre,
                  t.nombres as tutor_nombres, t.apellidos as tutor_apellidos,
                  CONCAT(t.nombres, ' ', t.apellidos) as tutor_nombre,
                  t.telefono as tutor_telefono,
                  ${addressService.getSelectColumns().replace(/d\./g, 'd.')},
                  p.nombre_posicion as posicion_de_juego_nombre
           FROM atletas a
           LEFT JOIN categoria c ON a.categoria_id = c.categoria_id
           LEFT JOIN tutor t ON a.tutor_id = t.tutor_id
           LEFT JOIN posicion_juego p ON a.posicion_de_juego = p.posicion_id
           ${addressService.getJoins().replace('entity.direccion_id', 'a.direccion_id')}
           WHERE a.atleta_id = ?`,
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> main
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }

    if (legacySchema) {
      rows[0].estatus = mapLegacyAthleteStatus(rows[0].estatus);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo atleta:', error);
    res.status(500).json({ error: 'Error al obtener atleta' });
  }
};

const createAtleta = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      cedula,
      telefono,
      direccion,
      fecha_nacimiento,
      sexo,
      posicion_de_juego,
      pierna_dominante,
      categoria_id,
      tutor_id,
      estatus,
      foto
    } = req.body;

    const legacySchema = await isLegacySchema();

    let direccion_id = null;
    if (direccion && (direccion.pais || direccion.estado || direccion.municipio || direccion.parroquia || direccion.descripcion_descriptiva)) {
      direccion_id = await addressService.findOrCreateAddress(direccion);
    }

<<<<<<< Updated upstream
    const [result] = await pool.execute(
      `INSERT INTO atletas
       (nombre, apellido, cedula, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, cedula || null, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante || 'Derecha', categoria_id, tutor_id, estatus || 'ACTIVO', foto]
    );

    res.status(201).json({
      message: 'Atleta creado exitosamente',
      id: result.insertId
    });
<<<<<<< HEAD

=======
    if (legacySchema) {
      if (!direccion_id) {
        const connection = await pool.getConnection();
        try {
          const [dirRes] = await connection.execute(
            'INSERT INTO direcciones (parroquias_id, localidad, tipo_vivienda, `ubicación vivienda`) VALUES (?, ?, ?, ?)',
            [0, '', '', '']
          );
          direccion_id = dirRes.insertId;
        } finally {
          connection.release();
        }
      }

      const estatusNumeric = mapAthleteStatusToLegacy(estatus || 'ACTIVO');
      const piernaNorm = (pierna_dominante || 'derecha').toLowerCase();
      const sexoValue = (sexo || 'M').toUpperCase().charAt(0);

      const [result] = await pool.execute(
        `INSERT INTO atletas
         (nombre, apellido, cedula, telefono, direccion_id, fecha_nacimiento, sexo, posicion_de_juego, pierna_dominante, categoria_id, representante_id, estatus, foto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, apellido, cedula || null, telefono || null, direccion_id, fecha_nacimiento, sexoValue, posicion_de_juego || null, piernaNorm, categoria_id, tutor_id || null, estatusNumeric, foto || null]
      );

      res.status(201).json({
        message: 'Atleta creado exitosamente',
        id: result.insertId
      });
    } else {
      const [result] = await pool.execute(
        `INSERT INTO atletas
         (nombre, apellido, cedula, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, apellido, cedula || null, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante || 'Derecha', categoria_id, tutor_id, estatus || 'ACTIVO', foto]
      );

      res.status(201).json({
        message: 'Atleta creado exitosamente',
        id: result.insertId
      });
    }
>>>>>>> Stashed changes
=======
>>>>>>> main
  } catch (error) {
    console.error('Error creando atleta:', error);
    res.status(500).json({ error: 'Error al crear atleta', details: error.message });
  }
};

const updateAtleta = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      sexo,
      posicion_de_juego,
      pierna_dominante,
      categoria_id,
      tutor_id,
      estatus,
      foto,
      cedula
    } = req.body;

<<<<<<< HEAD
<<<<<<< Updated upstream
    // 1. Obtener el direccion_id actual del atleta (opcional, si quisieramos actualizar en lugar de crear nuevo, pero AddressService maneja IDs complejos)
    // Simplificación: Resolvemos la nueva dirección (o existente) y actualizamos la FK.

    let currentDireccionId = null;
    if (direccion) {
      currentDireccionId = await addressService.findOrCreateAddress(direccion);
      // Note: This creates new entries if changed. Or reuses if same.
      // Effectively "updating" the athlete's address link.
      // If query was empty/null, currentDireccionId might be null or new ID.
    } else {
      // Keep existing? Or set null?
      // Typically if not provided in update, we might want to keep existing.
      // But if provided as null, we set null.
      // Assuming partial update logic usually implies checking if field is present.
      // Here we assume if 'direccion' key is sent, we process it.
      // If the user wants to KEEP existing without sending data, they shouldn't send 'direccion' key?
      // Let's assume frontend sends full object.

      // If direccion is undefined, we might need to fetch existing.
      // But let's act as if we just want to update with whatever we have.
      // Ideally we should check if direccion is provided.
    }

    // Check if we need to fetch existing if direccion is missing?
    // The previous code fetched existing ID:
    // const [atletaRows] = await pool.execute('SELECT direccion_id FROM atletas WHERE atleta_id = ?', [id]);
    // currentDireccionId = atletaRows[0].direccion_id;

    // If direccion object IS provided, we calculate new ID. 
    // If NOT provided, we should probably keep old ID. (But `const { direccion }` creates variable).
    // If we pass `currentDireccionId` to UPDATE, and it is null/undefined...

    // Better logic:
    let finalDireccionId = undefined; // Undefined means "do not update column"
=======
    const legacySchema = await isLegacySchema();
=======
    let finalDireccionId = undefined;
>>>>>>> main

    let finalDireccionId = undefined;
>>>>>>> Stashed changes

    if (direccion && (direccion.pais || direccion.estado || direccion.municipio || direccion.parroquia || direccion.descripcion_descriptiva)) {
      finalDireccionId = await addressService.findOrCreateAddress(direccion);
    } else {
      const [existing] = await pool.execute('SELECT direccion_id FROM atletas WHERE atleta_id = ?', [id]);
      if (existing.length > 0) finalDireccionId = existing[0].direccion_id;
    }

<<<<<<< HEAD
<<<<<<< Updated upstream
    // 3. Actualizar atleta
=======
>>>>>>> main
    await pool.execute(
      `UPDATE atletas
       SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, direccion_id = ?, fecha_nacimiento = ?,
           posicion_de_juego = ?, pierna_dominante = ?, categoria_id = ?, tutor_id = ?, estatus = ?, foto = ?
       WHERE atleta_id = ?`,
      [nombre, apellido, cedula || null, telefono, finalDireccionId, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto, id]
    );
=======
    if (legacySchema) {
      const estatusNumeric = mapAthleteStatusToLegacy(estatus || 'ACTIVO');
      const piernaNorm = (pierna_dominante || 'derecha').toLowerCase();
      const sexoValue = sexo ? sexo.toUpperCase().charAt(0) : undefined;

      let query = `UPDATE atletas SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, direccion_id = ?, 
                   fecha_nacimiento = ?, posicion_de_juego = ?, pierna_dominante = ?, categoria_id = ?, 
                   representante_id = ?, estatus = ?, foto = ?`;
      const params = [nombre, apellido, cedula || null, telefono || null, finalDireccionId, fecha_nacimiento,
                      posicion_de_juego || null, piernaNorm, categoria_id, tutor_id || null, estatusNumeric, foto || null];

      if (sexoValue) {
        query += ', sexo = ?';
        params.push(sexoValue);
      }

      query += ' WHERE atleta_id = ?';
      params.push(id);

      await pool.execute(query, params);
    } else {
      await pool.execute(
        `UPDATE atletas
         SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, direccion_id = ?, fecha_nacimiento = ?,
             posicion_de_juego = ?, pierna_dominante = ?, categoria_id = ?, tutor_id = ?, estatus = ?, foto = ?
         WHERE atleta_id = ?`,
        [nombre, apellido, cedula || null, telefono, finalDireccionId, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto, id]
      );
    }
>>>>>>> Stashed changes

    res.json({ message: 'Atleta actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando atleta:', error);
    res.status(500).json({ error: 'Error al actualizar atleta', details: error.message });
  }
};

const deleteAtleta = async (req, res) => {
  try {
    const { id } = req.params;
    const legacySchema = await isLegacySchema();
    const [result] = await pool.execute(
      'UPDATE atletas SET estatus = ? WHERE atleta_id = ?',
      [legacySchema ? 3 : 'INACTIVO', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }
    res.json({ message: 'Atleta eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando atleta:', error);
    res.status(500).json({ error: 'Error al eliminar atleta' });
  }
};
const updateAtletaTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const { tutor_id } = req.body;
    const legacySchema = await isLegacySchema();
    const [result] = await pool.execute(
      legacySchema
        ? 'UPDATE atletas SET representante_id = ? WHERE atleta_id = ?'
        : 'UPDATE atletas SET tutor_id = ? WHERE atleta_id = ?',
      [tutor_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }
    res.json({ message: 'Tutor asignado exitosamente' });
  } catch (error) {
    console.error('Error asignando tutor:', error);
    res.status(500).json({ error: 'Error al asignar tutor' });
  }
};
module.exports = {
  getAtletas,
  getAtletaById,
  createAtleta,
  updateAtleta,
  updateAtletaTutor,
  deleteAtleta,
  uploadFoto: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se subio ningun archivo' });
      }
      res.json({
        message: 'Foto subida exitosamente',
        filename: req.file.filename,
        url: `/uploads/atletas/${req.file.filename}`
      });
    } catch (error) {
      console.error('Error en uploadFoto:', error);
      res.status(500).json({ error: 'Error al procesar la foto' });
    }
  }
};


