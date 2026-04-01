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

const normalizeUserIdentifier = (value) => String(value || '').trim();

let usuariosSchemaCache = null;

const getUsuariosSchema = async () => {
  if (usuariosSchemaCache) {
    return usuariosSchemaCache;
  }

  const [userColumns] = await pool.execute('SHOW COLUMNS FROM usuarios');
  const userColumnSet = new Set(userColumns.map((column) => column.Field));

  const [plantelTable] = await pool.execute("SHOW TABLES LIKE 'plantel'");
  const [personalTable] = await pool.execute("SHOW TABLES LIKE 'personal'");

  usuariosSchemaCache = {
    hasUsuarioId: userColumnSet.has('usuario_id'),
    hasPlantelId: userColumnSet.has('plantel_id'),
    roleColumn: userColumnSet.has('rol') ? 'rol' : 'rol_id',
    hasPlantelTable: plantelTable.length > 0,
    hasPersonalTable: personalTable.length > 0
  };

  return usuariosSchemaCache;
};

const buildUserIdentifierCondition = (identifier, schema, tableAlias = 'u') => {
  const normalized = normalizeUserIdentifier(identifier);
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (schema.hasUsuarioId && /^\d+$/.test(normalized)) {
    return {
      clause: `${prefix}usuario_id = ?`,
      value: Number(normalized)
    };
  }

  return {
    clause: `LOWER(${prefix}email) = LOWER(?)`,
    value: normalized.toLowerCase()
  };
};

// Obtener todos los usuarios con información del rol y plantel
// Obtener todos los usuarios con informaci�n del rol y plantel
const getUsuarios = async (req, res) => {
  try {
    const { estatus, rol, sort, search } = req.query;
    const schema = await getUsuariosSchema();
    const roleColumnQualified = `u.${schema.roleColumn}`;

    const selectFields = [
      schema.hasUsuarioId ? 'u.usuario_id' : 'u.email AS usuario_id',
      'u.email',
      `${roleColumnQualified} AS rol`,
      'u.estatus',
      'u.ultimo_acceso',
      'u.created_at',
      'u.foto'
    ];

    if (schema.hasPlantelId) {
      selectFields.push('u.plantel_id');
    } else if (schema.hasPersonalTable) {
      selectFields.push('per.personal_id AS plantel_id');
    } else {
      selectFields.push('NULL AS plantel_id');
    }

    selectFields.push('r.nombre_rol', 'r.descripcion as rol_descripcion');

    if (schema.hasPlantelId && schema.hasPlantelTable) {
      selectFields.push('p.nombre AS plantel_nombre', 'p.apellido AS plantel_apellido');
    } else if (schema.hasPersonalTable) {
      selectFields.push('per.nombre AS plantel_nombre', 'per.apellido AS plantel_apellido');
    } else {
      selectFields.push('NULL AS plantel_nombre', 'NULL AS plantel_apellido');
    }

    let query = `
      SELECT ${selectFields.join(', ')}
      FROM usuarios u
      LEFT JOIN rol_usuarios r ON ${roleColumnQualified} = r.rol_id
    `;

    if (schema.hasPlantelId && schema.hasPlantelTable) {
      query += '\n LEFT JOIN plantel p ON u.plantel_id = p.plantel_id';
    } else if (schema.hasPersonalTable) {
      query += '\n LEFT JOIN personal per ON per.email_id = u.email';
    }

    const conditions = [];
    const params = [];

    if (estatus && String(estatus).toUpperCase() !== 'TODOS') {
      conditions.push('UPPER(u.estatus) = UPPER(?)');
      params.push(estatus);
    }

    if (rol) {
      conditions.push(`${roleColumnQualified} = ?`);
      params.push(rol);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      const searchConditions = ['LOWER(u.email) LIKE LOWER(?)'];
      params.push(searchTerm);

      if (schema.hasPlantelId && schema.hasPlantelTable) {
        searchConditions.push("LOWER(COALESCE(p.nombre, '')) LIKE LOWER(?)");
        searchConditions.push("LOWER(COALESCE(p.apellido, '')) LIKE LOWER(?)");
        params.push(searchTerm, searchTerm);
      } else if (schema.hasPersonalTable) {
        searchConditions.push("LOWER(COALESCE(per.nombre, '')) LIKE LOWER(?)");
        searchConditions.push("LOWER(COALESCE(per.apellido, '')) LIKE LOWER(?)");
        params.push(searchTerm, searchTerm);
      }

      conditions.push(`(${searchConditions.join(' OR ')})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    let orderBy = 'u.created_at DESC';
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
    const schema = await getUsuariosSchema();
    const roleColumnQualified = `u.${schema.roleColumn}`;
    const identifier = buildUserIdentifierCondition(id, schema, 'u');

    const selectFields = [
      schema.hasUsuarioId ? 'u.usuario_id' : 'u.email AS usuario_id',
      'u.email',
      `${roleColumnQualified} AS rol`,
      'u.estatus',
      'u.ultimo_acceso',
      'u.created_at',
      'u.foto'
    ];

    if (schema.hasPlantelId) {
      selectFields.push('u.plantel_id');
    } else if (schema.hasPersonalTable) {
      selectFields.push('per.personal_id AS plantel_id');
    } else {
      selectFields.push('NULL AS plantel_id');
    }

    selectFields.push('r.nombre_rol', 'r.descripcion as rol_descripcion');

    if (schema.hasPlantelId && schema.hasPlantelTable) {
      selectFields.push('p.nombre AS plantel_nombre', 'p.apellido AS plantel_apellido');
    } else if (schema.hasPersonalTable) {
      selectFields.push('per.nombre AS plantel_nombre', 'per.apellido AS plantel_apellido');
    } else {
      selectFields.push('NULL AS plantel_nombre', 'NULL AS plantel_apellido');
    }

    let query = `
      SELECT ${selectFields.join(', ')}
      FROM usuarios u
      LEFT JOIN rol_usuarios r ON ${roleColumnQualified} = r.rol_id
    `;

    if (schema.hasPlantelId && schema.hasPlantelTable) {
      query += '\n LEFT JOIN plantel p ON u.plantel_id = p.plantel_id';
    } else if (schema.hasPersonalTable) {
      query += '\n LEFT JOIN personal per ON per.email_id = u.email';
    }

    query += `\n WHERE ${identifier.clause}`;

    const [rows] = await pool.execute(query, [identifier.value]);

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
        rol: user.rol || user.rol_id
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
    const userId = req.userId;
    const schema = await getUsuariosSchema();
    const roleColumnQualified = `u.${schema.roleColumn}`;

    const [users] = await pool.execute(
      `SELECT u.email, ${roleColumnQualified} AS rol, r.nombre_rol
       FROM usuarios u
       LEFT JOIN rol_usuarios r ON ${roleColumnQualified} = r.rol_id
       WHERE u.email = ? AND u.estatus = ?`,
      [userId, 'Activo']
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    res.json({
      data: {
        roles: [user.nombre_rol],
        roleName: user.nombre_rol,
        roleId: user.rol,
        name: user.email,
        avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
        introduction: `${user.nombre_rol} del Club Atletico Deportivo Acarigua`
      }
    });

  } catch (error) {
    console.error('Error obteniendo info del usuario:', error);
    res.status(500).json({ error: 'Error al obtener informacion del usuario' });
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
    const schema = await getUsuariosSchema();
    let { email, password, rol, plantel_id } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    email = String(email).toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es valido' });
    }

    if (password) {
      const passwordErrors = [];
      if (password.length < 12) {
        passwordErrors.push('Minimo 12 caracteres');
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('Al menos una mayuscula');
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('Al menos una minuscula');
      }
      if (!/[0-9]/.test(password)) {
        passwordErrors.push('Al menos un numero');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        passwordErrors.push('Al menos un caracter especial');
      }

      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: 'La contrasena no cumple los requisitos de seguridad',
          detalles: passwordErrors
        });
      }
    }

    const [existing] = await pool.execute(
      'SELECT email FROM usuarios WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El email ya esta registrado' });
    }

    if (rol !== undefined && rol !== null && rol !== '') {
      const [rolExists] = await pool.execute(
        'SELECT rol_id FROM rol_usuarios WHERE rol_id = ?',
        [rol]
      );
      if (rolExists.length === 0) {
        return res.status(400).json({ error: 'El rol especificado no existe' });
      }
    }

    let normalizedPlantelId = null;
    if (schema.hasPlantelId && Object.prototype.hasOwnProperty.call(req.body, 'plantel_id')) {
      if (plantel_id === '' || plantel_id === undefined) {
        normalizedPlantelId = null;
      } else {
        normalizedPlantelId = Number(plantel_id);
        if (!Number.isInteger(normalizedPlantelId) || normalizedPlantelId <= 0) {
          return res.status(400).json({ error: 'plantel_id invalido' });
        }

        if (schema.hasPlantelTable) {
          const [plantelExists] = await pool.execute(
            'SELECT plantel_id FROM plantel WHERE plantel_id = ?',
            [normalizedPlantelId]
          );
          if (plantelExists.length === 0) {
            return res.status(400).json({ error: 'El miembro del plantel especificado no existe' });
          }
        }
      }
    }

    const fields = ['email', 'password', schema.roleColumn, 'estatus'];
    const values = [email, password || '12345678', rol || 2, 'Activo'];

    if (schema.hasPlantelId) {
      fields.push('plantel_id');
      values.push(normalizedPlantelId);
    }

    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO usuarios (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario_id: schema.hasUsuarioId ? result.insertId : email,
      email
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};
// Actualizar usuario
const updateUsuario = async (req, res) => {
  try {
    const schema = await getUsuariosSchema();
    const { id } = req.params;
    let { email, password, rol, estatus, plantel_id } = req.body;

    const identifier = buildUserIdentifierCondition(id, schema, 'u');
    const selectExisting = schema.hasUsuarioId
      ? `SELECT u.usuario_id, u.email FROM usuarios u WHERE ${identifier.clause}`
      : `SELECT u.email FROM usuarios u WHERE ${identifier.clause}`;

    const [existing] = await pool.execute(selectExisting, [identifier.value]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userKey = schema.hasUsuarioId ? existing[0].usuario_id : existing[0].email;
    const currentEmail = String(existing[0].email || '').toLowerCase();

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
      if (!email || !String(email).trim()) {
        return res.status(400).json({ error: 'El email es requerido' });
      }

      email = String(email).toLowerCase().trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El formato del email no es valido' });
      }

      if (email !== currentEmail) {
        const duplicateQuery = schema.hasUsuarioId
          ? 'SELECT email FROM usuarios WHERE LOWER(email) = LOWER(?) AND usuario_id != ?'
          : 'SELECT email FROM usuarios WHERE LOWER(email) = LOWER(?) AND LOWER(email) != LOWER(?)';

        const duplicateParams = schema.hasUsuarioId
          ? [email, userKey]
          : [email, currentEmail];

        const [emailInUse] = await pool.execute(duplicateQuery, duplicateParams);

        if (emailInUse.length > 0) {
          return res.status(400).json({ error: 'El email ya esta registrado' });
        }
      }
    }

    if (rol !== undefined && rol !== null && rol !== '') {
      const [rolExists] = await pool.execute(
        'SELECT rol_id FROM rol_usuarios WHERE rol_id = ?',
        [rol]
      );
      if (rolExists.length === 0) {
        return res.status(400).json({ error: 'El rol especificado no existe' });
      }
    }

    const updates = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
      updates.push('email = ?');
      params.push(email);
    }

    if (password) {
      const passwordErrors = [];
      if (password.length < 12) {
        passwordErrors.push('Minimo 12 caracteres');
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('Al menos una mayuscula');
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('Al menos una minuscula');
      }
      if (!/[0-9]/.test(password)) {
        passwordErrors.push('Al menos un numero');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        passwordErrors.push('Al menos un caracter especial');
      }

      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: 'La contrasena no cumple los requisitos de seguridad',
          detalles: passwordErrors
        });
      }

      updates.push('password = ?');
      params.push(password);
    }

    if (rol !== undefined && rol !== null && rol !== '') {
      updates.push(`${schema.roleColumn} = ?`);
      params.push(rol);
    }

    if (estatus !== undefined && estatus !== null && estatus !== '') {
      const normalizedEstatus = String(estatus).toLowerCase();
      if (normalizedEstatus !== 'activo' && normalizedEstatus !== 'inactivo') {
        return res.status(400).json({ error: 'Estatus invalido. Use Activo o Inactivo' });
      }
      updates.push('estatus = ?');
      params.push(normalizedEstatus === 'activo' ? 'Activo' : 'Inactivo');
    }

    if (schema.hasPlantelId && Object.prototype.hasOwnProperty.call(req.body, 'plantel_id')) {
      if (plantel_id === '' || plantel_id === undefined) {
        plantel_id = null;
      }

      if (plantel_id !== null) {
        const normalizedPlantelId = Number(plantel_id);
        if (!Number.isInteger(normalizedPlantelId) || normalizedPlantelId <= 0) {
          return res.status(400).json({ error: 'plantel_id invalido' });
        }

        if (schema.hasPlantelTable) {
          const [plantelExists] = await pool.execute(
            'SELECT plantel_id FROM plantel WHERE plantel_id = ?',
            [normalizedPlantelId]
          );

          if (plantelExists.length === 0) {
            return res.status(400).json({ error: 'El miembro del plantel especificado no existe' });
          }
        }

        updates.push('plantel_id = ?');
        params.push(normalizedPlantelId);
      } else {
        updates.push('plantel_id = ?');
        params.push(null);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const whereClause = schema.hasUsuarioId ? 'usuario_id = ?' : 'LOWER(email) = LOWER(?)';
    params.push(userKey);

    await pool.execute(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE ${whereClause}`,
      params
    );

    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario_id: schema.hasUsuarioId ? userKey : (email || existing[0].email),
      email: email || existing[0].email
    });

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


// Eliminar usuario (HARD DELETE - Eliminar fisicamente)
const deleteUsuario = async (req, res) => {
  try {
    const schema = await getUsuariosSchema();
    const { id } = req.params;
    const identifier = buildUserIdentifierCondition(id, schema, '');

    const selectExisting = schema.hasUsuarioId
      ? `SELECT usuario_id, email FROM usuarios WHERE ${identifier.clause}`
      : `SELECT email FROM usuarios WHERE ${identifier.clause}`;

    const [existing] = await pool.execute(selectExisting, [identifier.value]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (schema.hasUsuarioId) {
      await pool.execute('DELETE FROM usuarios WHERE usuario_id = ?', [existing[0].usuario_id]);
    } else {
      await pool.execute('DELETE FROM usuarios WHERE LOWER(email) = LOWER(?)', [existing[0].email]);
    }

    res.json({ message: 'Usuario eliminado fisicamente exitosamente' });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
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
