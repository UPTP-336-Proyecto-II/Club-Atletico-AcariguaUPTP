const pool = require('../config/database');

// Obtener todos los roles
const getRoles = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM usuarios u WHERE u.rol = r.rol_id) as usuarios_count,
        (SELECT COUNT(*) FROM usuarios u WHERE u.rol = r.rol_id AND u.estatus = 'ACTIVO') as usuarios_activos,
        (SELECT COUNT(*) FROM usuarios u WHERE u.rol = r.rol_id AND u.estatus = 'INACTIVO') as usuarios_inactivos
       FROM rol_usuarios r 
       ORDER BY r.rol_id ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

// Obtener rol por ID
const getRolById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM usuarios u WHERE u.rol = r.rol_id) as usuarios_count
       FROM rol_usuarios r 
       WHERE r.rol_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo rol:', error);
    res.status(500).json({ error: 'Error al obtener rol' });
  }
};

// Crear nuevo rol
const createRol = async (req, res) => {
  try {
    const { nombre_rol, descripcion } = req.body;

    if (!nombre_rol) {
      return res.status(400).json({ error: 'El nombre del rol es requerido' });
    }

    // Verificar si ya existe (nombre + descripcion)
    const [existing] = await pool.execute(
      'SELECT rol_id FROM rol_usuarios WHERE nombre_rol = ? AND descripcion = ?',
      [nombre_rol, descripcion || null]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre y descripción' });
    }

    const [result] = await pool.execute(
      'INSERT INTO rol_usuarios (nombre_rol, descripcion) VALUES (?, ?)',
      [nombre_rol, descripcion || null]
    );

    res.status(201).json({
      message: 'Rol creado exitosamente',
      rol_id: result.insertId
    });

  } catch (error) {
    console.error('Error creando rol:', error);
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

// Actualizar rol
const updateRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_rol, descripcion } = req.body;

    // Verificar que existe
    const [existing] = await pool.execute(
      'SELECT rol_id FROM rol_usuarios WHERE rol_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Verificar duplicado (nombre + descripcion, excluyendo el actual)
    const [duplicate] = await pool.execute(
      'SELECT rol_id FROM rol_usuarios WHERE nombre_rol = ? AND descripcion = ? AND rol_id != ?',
      [nombre_rol, descripcion || null, id]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({ error: 'Ya existe otro rol con ese nombre y descripción' });
    }

    await pool.execute(
      'UPDATE rol_usuarios SET nombre_rol = ?, descripcion = ? WHERE rol_id = ?',
      [nombre_rol, descripcion || null, id]
    );

    res.json({ message: 'Rol actualizado exitosamente' });

  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

// Eliminar rol
const deleteRol = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const [existing] = await pool.execute(
      'SELECT rol_id FROM rol_usuarios WHERE rol_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Verificar que no tenga usuarios asignados
    const [users] = await pool.execute(
      'SELECT usuario_id FROM usuarios WHERE rol = ?',
      [id]
    );

    if (users.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el rol porque tiene usuarios asignados',
        usuarios_count: users.length
      });
    }

    await pool.execute('DELETE FROM rol_usuarios WHERE rol_id = ?', [id]);

    res.json({ message: 'Rol eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando rol:', error);
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
};

module.exports = {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol
};
