const pool = require('../config/database');
const addressService = require('../services/addressService');

const getAtletas = async (req, res) => {
  try {
    const { search, cedula, sin_cedula, categoria_id, estatus, order } = req.query;

    let query = `SELECT a.*, 
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

    const params = [];

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

    // Filtro para mostrar solo atletas CON cédula registrada
    if (req.query.con_cedula === 'true') {
      query += ' AND a.cedula IS NOT NULL AND a.cedula != \'\'';
    }

    if (categoria_id) {
      query += ' AND a.categoria_id = ?';
      params.push(categoria_id);
    }

    if (estatus && estatus !== 'TODOS') {
      query += ' AND a.estatus = ?';
      params.push(estatus);
    } else if (!estatus) {
      // Por defecto ocultamos inactivos si no se especifica filtro de estatus
      query += " AND a.estatus IN ('ACTIVO', 'LESIONADO', 'Activo', 'Lesionado')";
    }

    // Ordenamiento
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
      default: // recent
        query += ' ORDER BY a.created_at DESC';
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo atletas:', error);
    res.status(500).json({ error: 'Error al obtener atletas', details: error.message });
  }
};

const getAtletaById = async (req, res) => {
  try {
    const { id } = req.params;
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
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
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
      direccion, // Objeto { pais, estado, municipio, parroquia, descripcion_descriptiva }
      fecha_nacimiento,
      posicion_de_juego,
      pierna_dominante,
      categoria_id,
      tutor_id,
      estatus,
      foto
    } = req.body;

    let direccion_id = null;

    if (direccion && (direccion.pais || direccion.estado || direccion.municipio || direccion.parroquia || direccion.descripcion_descriptiva)) {
      direccion_id = await addressService.findOrCreateAddress(direccion);
    }

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

  } catch (error) {
    console.error('Error creando atleta:', error);
    res.status(500).json({ error: 'Error al crear atleta' });
  }
};

const updateAtleta = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      telefono,
      direccion, // Objeto { pais, estado, municipio, parroquia, descripcion_descriptiva }
      fecha_nacimiento,
      posicion_de_juego,
      pierna_dominante,
      categoria_id,
      tutor_id,
      estatus,
      foto,
      cedula
    } = req.body;

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

    if (direccion) {
      finalDireccionId = await addressService.findOrCreateAddress(direccion);
    } else {
      // If we want to preserve existing, we just don't include it in UPDATE SET?
      // My SQL below updates ALL fields. So I must provide a value.
      // So I must fetch existing if not provided.
      const [existing] = await pool.execute('SELECT direccion_id FROM atletas WHERE atleta_id = ?', [id]);
      if (existing.length > 0) finalDireccionId = existing[0].direccion_id;
    }

    // 3. Actualizar atleta
    await pool.execute(
      `UPDATE atletas 
       SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, direccion_id = ?, fecha_nacimiento = ?, 
           posicion_de_juego = ?, pierna_dominante = ?, categoria_id = ?, tutor_id = ?, estatus = ?, foto = ?
       WHERE atleta_id = ?`,
      [nombre, apellido, cedula || null, telefono, finalDireccionId, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto, id]
    );

    res.json({ message: 'Atleta actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando atleta:', error);
    res.status(500).json({ error: 'Error al actualizar atleta' });
  }
};

const deleteAtleta = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'UPDATE atletas SET estatus = ? WHERE atleta_id = ?',
      ['INACTIVO', id]
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

    const [result] = await pool.execute(
      'UPDATE atletas SET tutor_id = ? WHERE atleta_id = ?',
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
        return res.status(400).json({ error: 'No se subió ningún archivo' });
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