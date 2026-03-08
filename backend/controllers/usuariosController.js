const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración de Multer para avatares
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'avatar-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png)'));
  }
}).single('avatar');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Obtener todos los usuarios con información del rol y plantel
const getUsuarios = async (req, res) => {
  try {
    const { estatus, rol, sort, search } = req.query;

    let query = `
      SELECT u.email, u.rol, u.estatus, u.ultimo_acceso, u.created_at, u.foto,
             r.nombre_rol, r.descripcion as rol_descripcion
      FROM usuarios u
      LEFT JOIN rol_usuarios r ON u.rol = r.rol_id
    `;

    const conditions = [];
    const params = [];

    if (estatus && estatus !== 'TODOS') {
      conditions.push('u.estatus = ?');
      params.push(estatus);
    }

    if (rol) {
      conditions.push('u.rol = ?');
      params.push(rol);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(`LOWER(u.email) LIKE LOWER(?)`);
      params.push(searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Ordenamiento
    let orderBy = 'u.created_at DESC'; // Default: Más recientes

    switch (sort) {
      case 'antiguo':
        orderBy = 'u.created_at ASC';
        break;
      case 'az':
        orderBy = 'u.email ASC';
        break;
      case 'za':
        orderBy = 'u.email DESC';
        break;
      default:
        orderBy = 'u.created_at DESC';
    }

    query += ` ORDER BY ${orderBy}`;

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Obtener usuario por ID
const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT u.email, u.rol, u.estatus, u.ultimo_acceso, u.created_at, u.foto,
              r.nombre_rol, r.descripcion as rol_descripcion
       FROM usuarios u
       LEFT JOIN rol_usuarios r ON u.rol = r.rol_id
       WHERE u.email = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario en la base de datos
    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND estatus = ?',
      [email, 'Activo']
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña (comparación directa - sin hash para desarrollo)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.email,
        email: user.email,
        rol: user.rol
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Guardar token en la base de datos
    await pool.execute(
      'UPDATE usuarios SET token = ?, ultimo_acceso = NOW() WHERE email = ?',
      [token, user.email]
    );

    res.json({
      data: {
        token: token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getInfo = async (req, res) => {
  try {
    // El token ya fue verificado por el middleware
    const userId = req.userId; // Ahora es el email

    const [users] = await pool.execute(
      `SELECT u.email, u.rol, r.nombre_rol
       FROM usuarios u
       LEFT JOIN rol_usuarios r ON u.rol = r.rol_id
       WHERE u.email = ? AND u.estatus = ?`,
      [userId, 'Activo']
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    res.json({
      data: {
        roles: [user.nombre_rol], // Retornar el nombre del rol exacto de la BD: 'super_user', 'administrador', 'entrenador', 'medico'
        roleName: user.nombre_rol,
        roleId: user.rol,
        name: user.email, // Usamos email como nombre ya que no hay nombre/apellido
        avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
        introduction: `${user.nombre_rol} del Club Atlético Deportivo Acarigua`
      }
    });

  } catch (error) {
    console.error('Error obteniendo info del usuario:', error);
    res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
};

const logout = async (req, res) => {
  try {
    // Limpiar el token de la base de datos
    const userId = req.userId; // Ahora es el email

    await pool.execute(
      'UPDATE usuarios SET token = NULL WHERE email = ?',
      [userId]
    );

    res.json({
      data: {
        message: 'Logout exitoso'
      }
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

const createUsuario = async (req, res) => {
  try {
    let { email, password, rol } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    // Normalizar email a minúsculas
    email = email.toLowerCase().trim();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    // Validar contraseña (cuando se proporciona)
    if (password) {
      const passwordErrors = [];
      if (password.length < 12) {
        passwordErrors.push('Mínimo 12 caracteres');
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('Al menos una mayúscula');
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('Al menos una minúscula');
      }
      if (!/[0-9]/.test(password)) {
        passwordErrors.push('Al menos un número');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        passwordErrors.push('Al menos un carácter especial');
      }

      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: 'La contraseña no cumple los requisitos de seguridad',
          detalles: passwordErrors
        });
      }
    }

    // Verificar si el email ya existe
    const [existing] = await pool.execute(
      'SELECT email FROM usuarios WHERE LOWER(email) = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Verificar que el rol existe
    if (rol) {
      const [rolExists] = await pool.execute(
        'SELECT rol_id FROM rol_usuarios WHERE rol_id = ?',
        [rol]
      );
      if (rolExists.length === 0) {
        return res.status(400).json({ error: 'El rol especificado no existe' });
      }
    }

    await pool.execute(
      'INSERT INTO usuarios (email, password, rol, estatus) VALUES (?, ?, ?, ?)',
      [email, password || '12345678', rol || 2, 'Activo']
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      email: email
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params; // id es el email
    const { password, rol, estatus } = req.body;

    // Verificar que existe
    const [existing] = await pool.execute(
      'SELECT email FROM usuarios WHERE email = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el rol existe
    if (rol) {
      const [rolExists] = await pool.execute(
        'SELECT rol_id FROM rol_usuarios WHERE rol_id = ?',
        [rol]
      );
      if (rolExists.length === 0) {
        return res.status(400).json({ error: 'El rol especificado no existe' });
      }
    }

    // Construir query dinámico
    const updates = [];
    const params = [];

    if (password) {
      updates.push('password = ?');
      params.push(password);
    }
    if (rol) {
      updates.push('rol = ?');
      params.push(rol);
    }
    if (estatus) {
      updates.push('estatus = ?');
      params.push(estatus);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    params.push(id);
    await pool.execute(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE email = ?`,
      params
    );

    res.json({ message: 'Usuario actualizado exitosamente' });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Actualizar perfil del usuario logueado
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // Ahora es el email
    const { password, newPassword, confirmPassword, foto } = req.body;

    // Obtener usuario actual para verificar contraseña
    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND estatus = ?',
      [userId, 'Activo']
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = users[0];

    // Verificar contraseña actual obligatoria para cualquier cambio sensible
    if (!password) {
      return res.status(400).json({ error: 'Se requiere la contraseña actual para guardar cambios' });
    }

    if (password !== user.password) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    const updates = [];
    const params = [];

    // Cambiar Contraseña
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'La nueva contraseña y la confirmación no coinciden' });
      }
      updates.push('password = ?');
      params.push(newPassword);
    }

    // Actualizar foto (si se envió desde el frontend el filename)
    if (foto) {
      updates.push('foto = ?');
      params.push(foto);
    }

    if (updates.length === 0) {
      return res.json({ message: 'No se detectaron cambios' });
    }

    params.push(userId);
    await pool.execute(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE email = ?`,
      params
    );

    res.json({ message: 'Perfil actualizado exitosamente' });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// Subir Avatar
const uploadAvatar = (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      return res.status(500).json({ error: err.message });
    } else if (err) {
      // Otro error desconocido
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    // Retorna el nombre del archivo para que el frontend lo use en updateProfile
    res.json({ filename: req.file.filename });
  });
};


// Eliminar usuario (HARD DELETE - Eliminar físicamente)
const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params; // id es el email

    // Verificar que existe
    const [existing] = await pool.execute(
      'SELECT email FROM usuarios WHERE email = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Hard delete - Eliminar de la base de datos
    await pool.execute(
      'DELETE FROM usuarios WHERE email = ?',
      [id]
    );

    res.json({ message: 'Usuario eliminado físicamente exitosamente' });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    // Verificar si es error de constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        error: 'No se puede eliminar el usuario porque tiene registros relacionados (historial, etc). Considere desactivarlo en su lugar.'
      });
    }
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  login,
  getInfo,
  logout,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  updateProfile,
  uploadAvatar
};