const pool = require('../config/database');

const getAtletas = async (req, res) => {
  try {
    const { search, categoria_id, estatus } = req.query;

    let query = `SELECT a.*, 
                TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) as edad,
                c.nombre_categoria as categoria_nombre,
                t.nombre_completo as tutor_nombre
         FROM atletas a 
         LEFT JOIN categoria c ON a.categoria_id = c.categoria_id
         LEFT JOIN tutor t ON a.tutor_id = t.tutor_id
         WHERE 1=1`;

    const params = [];

    if (search) {
      query += ' AND (a.nombre LIKE ? OR a.apellido LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
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
      query += " AND a.estatus IN ('ACTIVO', 'LESIONADO')";
    }

    query += ' ORDER BY a.created_at DESC';

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
              t.nombre_completo as tutor_nombre,
              t.telefono as tutor_telefono
       FROM atletas a 
       LEFT JOIN categoria c ON a.categoria_id = c.categoria_id
       LEFT JOIN tutor t ON a.tutor_id = t.tutor_id
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
      telefono,
      direccion, // Ahora es un objeto { pais, estado, municipio, localidad }
      fecha_nacimiento,
      posicion_de_juego,
      pierna_dominante,
      categoria_id,
      tutor_id,
      estatus,
      foto
    } = req.body;

    let direccion_id = null;

    if (direccion && (direccion.pais || direccion.estado || direccion.municipio || direccion.localidad)) {
      const [dirResult] = await pool.execute(
        `INSERT INTO direcciones (pais, estado, municipio, localidad) VALUES (?, ?, ?, ?)`,
        [direccion.pais || '', direccion.estado || '', direccion.municipio || '', direccion.localidad || '']
      );
      direccion_id = dirResult.insertId;
    }

    const [result] = await pool.execute(
      `INSERT INTO atletas 
       (nombre, apellido, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, telefono, direccion_id, fecha_nacimiento, posicion_de_juego, pierna_dominante || 'Derecha', categoria_id, tutor_id, estatus || 'ACTIVO', foto]
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
      direccion, // Objeto { pais, estado, municipio, localidad }
      fecha_nacimiento,
      posicion_de_juego,
      pierna_dominante,
      categoria_id,
      tutor_id,
      estatus,
      foto
    } = req.body;

    // 1. Obtener el direccion_id actual del atleta
    const [atletaRows] = await pool.execute('SELECT direccion_id FROM atletas WHERE atleta_id = ?', [id]);
    if (atletaRows.length === 0) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }

    let currentDireccionId = atletaRows[0].direccion_id;

    // 2. Manejar la dirección (Crear si no existe, actualizar si existe)
    if (direccion) {
      if (currentDireccionId) {
        // Actualizar existente
        await pool.execute(
          `UPDATE direcciones SET pais = ?, estado = ?, municipio = ?, localidad = ? WHERE direccion_id = ?`,
          [direccion.pais || '', direccion.estado || '', direccion.municipio || '', direccion.localidad || '', currentDireccionId]
        );
      } else {
        // Crear nueva si no tenía
        if (direccion.pais || direccion.estado || direccion.municipio || direccion.localidad) {
          const [dirResult] = await pool.execute(
            `INSERT INTO direcciones (pais, estado, municipio, localidad) VALUES (?, ?, ?, ?)`,
            [direccion.pais || '', direccion.estado || '', direccion.municipio || '', direccion.localidad || '']
          );
          currentDireccionId = dirResult.insertId;
        }
      }
    }

    // 3. Actualizar atleta con el (posiblemente nuevo) direccion_id
    await pool.execute(
      `UPDATE atletas 
       SET nombre = ?, apellido = ?, telefono = ?, direccion_id = ?, fecha_nacimiento = ?, 
           posicion_de_juego = ?, pierna_dominante = ?, categoria_id = ?, tutor_id = ?, estatus = ?, foto = ?
       WHERE atleta_id = ?`,
      [nombre, apellido, telefono, currentDireccionId, fecha_nacimiento, posicion_de_juego, pierna_dominante, categoria_id, tutor_id, estatus, foto, id]
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