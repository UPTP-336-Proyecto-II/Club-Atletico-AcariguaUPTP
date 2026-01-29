const pool = require('../config/database');

// Obtener todo el plantel
const getPlantel = async (req, res) => {
    try {
        const { rol, sort, cedula, sin_cedula } = req.query;

        let query = `
            SELECT p.*, r.nombre_rol,
                   d.pais, d.estado, d.municipio, d.parroquia, d.descripcion_descriptiva
            FROM plantel p
            LEFT JOIN rol_usuarios r ON p.rol_id = r.rol_id
            LEFT JOIN direcciones d ON p.direccion_id = d.direccion_id
            WHERE 1=1`;
        const params = [];

        if (cedula) {
            query += ' AND p.cedula LIKE ?';
            params.push(`%${cedula}%`);
        }

        if (sin_cedula === 'true') {
            query += ' AND (p.cedula IS NULL OR p.cedula = \'\')';
        }

        if (rol) {
            // Verificar si es un número (rol_id) o un string (nombre del rol)
            const rolId = parseInt(rol);
            if (!isNaN(rolId)) {
                // Es un ID numérico
                query += ' AND p.rol_id = ?';
                params.push(rolId);
            } else {
                // Es un nombre de rol (ENTRENADOR, ADMINISTRADOR, etc.)
                query += ' AND UPPER(r.nombre_rol) = UPPER(?)';
                params.push(rol);
            }
        }

        // Ordenamiento
        let orderBy = 'p.rol_id ASC, p.nombre ASC'; // Default

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

// Obtener miembro del plantel por ID
const getPlantelById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `SELECT p.*, d.pais, d.estado, d.municipio, d.parroquia, d.descripcion_descriptiva
             FROM plantel p
             LEFT JOIN direcciones d ON p.direccion_id = d.direccion_id
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

// Obtener plantel por rol
const getPlantelByRol = async (req, res) => {
    try {
        const { rol } = req.params;

        const [rows] = await pool.execute(
            'SELECT * FROM plantel WHERE rol_id = ? ORDER BY nombre ASC',
            [rol]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo plantel por rol:', error);
        res.status(500).json({ error: 'Error al obtener plantel' });
    }
};

// Crear miembro del plantel
const createMiembroPlantel = async (req, res) => {
    try {
        const { nombre, apellido, telefono, rol, cedula, fecha_nac, direccion } = req.body;

        let direccion_id = null;

        // Si hay datos de dirección, crear registro en tabla direcciones
        if (direccion && (direccion.pais || direccion.estado || direccion.municipio || direccion.parroquia || direccion.descripcion_descriptiva)) {
            const [dirResult] = await pool.execute(
                `INSERT INTO direcciones (pais, estado, municipio, parroquia, descripcion_descriptiva) VALUES (?, ?, ?, ?, ?)`,
                [direccion.pais || 'Venezuela', direccion.estado || '', direccion.municipio || '', direccion.parroquia || '', direccion.descripcion_descriptiva || '']
            );
            direccion_id = dirResult.insertId;
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

// Actualizar miembro del plantel
const updateMiembroPlantel = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, rol, cedula, fecha_nac, direccion } = req.body;

        // 1. Obtener el direccion_id actual del miembro
        const [miembroRows] = await pool.execute('SELECT direccion_id FROM plantel WHERE plantel_id = ?', [id]);
        if (miembroRows.length === 0) {
            return res.status(404).json({ error: 'Miembro del plantel no encontrado' });
        }

        let currentDireccionId = miembroRows[0].direccion_id;

        // 2. Manejar la dirección (Crear si no existe, actualizar si existe)
        if (direccion) {
            if (currentDireccionId) {
                // Actualizar existente
                await pool.execute(
                    `UPDATE direcciones SET pais = ?, estado = ?, municipio = ?, parroquia = ?, descripcion_descriptiva = ? WHERE direccion_id = ?`,
                    [direccion.pais || 'Venezuela', direccion.estado || '', direccion.municipio || '', direccion.parroquia || '', direccion.descripcion_descriptiva || '', currentDireccionId]
                );
            } else {
                // Crear nueva si no tenía
                if (direccion.pais || direccion.estado || direccion.municipio || direccion.parroquia || direccion.descripcion_descriptiva) {
                    const [dirResult] = await pool.execute(
                        `INSERT INTO direcciones (pais, estado, municipio, parroquia, descripcion_descriptiva) VALUES (?, ?, ?, ?, ?)`,
                        [direccion.pais || 'Venezuela', direccion.estado || '', direccion.municipio || '', direccion.parroquia || '', direccion.descripcion_descriptiva || '']
                    );
                    currentDireccionId = dirResult.insertId;
                }
            }
        }

        // 3. Actualizar miembro del plantel
        const [result] = await pool.execute(
            `UPDATE plantel 
       SET nombre = ?, apellido = ?, telefono = ?, rol_id = ?, cedula = ?, fecha_nac = ?, direccion_id = ?
       WHERE plantel_id = ?`,
            [nombre, apellido, telefono, rol, cedula || null, fecha_nac || null, currentDireccionId, id]
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

        // Verificar si el miembro está asignado a alguna categoría
        const [categorias] = await pool.execute(
            'SELECT COUNT(*) as total FROM categoria WHERE entrenador_id = ?',
            [id]
        );

        if (categorias[0].total > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar porque está asignado a una o más categorías'
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
