const pool = require('../config/database');

// Obtener todos los tutores
const getTutores = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT t.*,
              COUNT(a.atleta_id) as total_atletas
       FROM tutor t
       LEFT JOIN atletas a ON t.tutor_id = a.tutor_id
       GROUP BY t.tutor_id
       ORDER BY t.nombre_completo ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo tutores:', error);
        res.status(500).json({ error: 'Error al obtener tutores' });
    }
};

// Obtener tutor por ID
const getTutorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `SELECT t.*, d.pais, d.estado, d.municipio, d.parroquia, d.descripcion_descriptiva 
             FROM tutor t
             LEFT JOIN direcciones d ON t.direccion_id = d.direccion_id
             WHERE t.tutor_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tutor no encontrado' });
        }

        // Obtener atletas asociados
        const [atletas] = await pool.execute(
            `SELECT atleta_id, nombre, apellido 
       FROM atletas 
       WHERE tutor_id = ? AND estatus IN ('ACTIVO', 'LESIONADO')`,
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

// Crear tutor
const createTutor = async (req, res) => {
    try {
        const { nombre_completo, cedula, telefono, correo, direccion, tipo_relacion } = req.body;

        let direccion_id = null;

        // Si hay datos de dirección estructurados, crear registro en tabla direcciones
        if (direccion && typeof direccion === 'object' && (direccion.pais || direccion.estado || direccion.municipio || direccion.parroquia || direccion.descripcion_descriptiva)) {
            const [dirResult] = await pool.execute(
                `INSERT INTO direcciones (pais, estado, municipio, parroquia, descripcion_descriptiva) VALUES (?, ?, ?, ?, ?)`,
                [direccion.pais || 'Venezuela', direccion.estado || '', direccion.municipio || '', direccion.parroquia || '', direccion.descripcion_descriptiva || '']
            );
            direccion_id = dirResult.insertId;
        }

        const [result] = await pool.execute(
            `INSERT INTO tutor (nombre_completo, cedula, telefono, correo, direccion_id, tipo_relacion) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre_completo, cedula, telefono, correo, direccion_id, tipo_relacion]
        );

        res.status(201).json({
            message: 'Tutor registrado exitosamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error creando tutor:', error);
        res.status(500).json({ error: 'Error al crear tutor' });
    }
};

// Actualizar tutor
const updateTutor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_completo, telefono, correo, direccion, tipo_relacion } = req.body;

        // 1. Obtener el direccion_id actual del tutor
        const [tutorRows] = await pool.execute('SELECT direccion_id FROM tutor WHERE tutor_id = ?', [id]);
        if (tutorRows.length === 0) {
            return res.status(404).json({ error: 'Tutor no encontrado' });
        }

        let currentDireccionId = tutorRows[0].direccion_id;

        // 2. Manejar la dirección (Crear si no existe, actualizar si existe)
        if (direccion && typeof direccion === 'object') {
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

        // 3. Actualizar tutor
        const [result] = await pool.execute(
            `UPDATE tutor 
       SET nombre_completo = ?, telefono = ?, correo = ?, direccion_id = ?, tipo_relacion = ?
       WHERE tutor_id = ?`,
            [nombre_completo, telefono, correo, currentDireccionId, tipo_relacion, id]
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

// Eliminar tutor
const deleteTutor = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hay atletas asociados
        const [atletas] = await pool.execute(
            'SELECT COUNT(*) as total FROM atletas WHERE tutor_id = ?',
            [id]
        );

        if (atletas[0].total > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el tutor porque tiene atletas asociados'
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM tutor WHERE tutor_id = ?',
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
