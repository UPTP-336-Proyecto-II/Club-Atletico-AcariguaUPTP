const pool = require('../config/database');
const addressService = require('../services/addressService');

// Obtener todos los tutores
const getTutores = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT t.*,
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

// Obtener tutor por ID
const getTutorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `SELECT t.*, 
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
        const { nombres, apellidos, nombre_completo, cedula, telefono, correo, direccion, tipo_relacion } = req.body;

        // Support both old 'nombre_completo' and new 'nombres'/'apellidos' from frontend just in case
        let finalNombres = nombres;
        let finalApellidos = apellidos;
        if (!finalNombres && nombre_completo) {
            const parts = nombre_completo.trim().split(' ');
            finalNombres = parts[0];
            finalApellidos = parts.slice(1).join(' ');
        }

        let direccion_id = null;
        if (direccion) {
            direccion_id = await addressService.findOrCreateAddress(direccion);
        }

        const [result] = await pool.execute(
            `INSERT INTO tutor (nombres, apellidos, cedula, telefono, correo, direccion_id, tipo_relacion) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [finalNombres, finalApellidos || '', cedula, telefono, correo, direccion_id, tipo_relacion]
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
        const { nombres, apellidos, nombre_completo, telefono, correo, direccion, tipo_relacion } = req.body;

        let finalNombres = nombres;
        let finalApellidos = apellidos;
        if (!finalNombres && nombre_completo) {
            const parts = nombre_completo.trim().split(' ');
            finalNombres = parts[0];
            finalApellidos = parts.slice(1).join(' ');
        }

        let finalDireccionId = undefined;
        if (direccion) {
            finalDireccionId = await addressService.findOrCreateAddress(direccion);
        } else {
            const [existing] = await pool.execute('SELECT direccion_id FROM tutor WHERE tutor_id = ?', [id]);
            if (existing.length > 0) finalDireccionId = existing[0].direccion_id;
        }

        // Actualizar tutor
        const [result] = await pool.execute(
            `UPDATE tutor 
       SET nombres = ?, apellidos = ?, telefono = ?, correo = ?, direccion_id = ?, tipo_relacion = ?
       WHERE tutor_id = ?`,
            [finalNombres, finalApellidos || '', telefono, correo, finalDireccionId, tipo_relacion, id]
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
