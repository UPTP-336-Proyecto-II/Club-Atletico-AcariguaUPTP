const pool = require('../config/database');

// Obtener o crear evento deportivo para una fecha
const getOrCreateEvento = async (fecha, tipo_evento, entrenador_id) => {
    // Buscar evento existente para esta fecha, tipo y entrenador
    const [existing] = await pool.execute(
        `SELECT evento_id FROM evento_deportivo 
         WHERE fecha_evento = ? AND tipo_evento = ? AND entrenador_id = ?`,
        [fecha, tipo_evento, entrenador_id]
    );

    if (existing.length > 0) {
        return existing[0].evento_id;
    }

    // Crear nuevo evento
    const [result] = await pool.execute(
        `INSERT INTO evento_deportivo (entrenador_id, tipo_evento, fecha_evento) 
         VALUES (?, ?, ?)`,
        [entrenador_id, tipo_evento, fecha]
    );

    return result.insertId;
};

// Obtener todas las asistencias
const getAsistencias = async (req, res) => {
    try {
        const { fecha, atleta_id, categoria_id } = req.query;

        let query = `
            SELECT 
                da.asistencia_id,
                da.evento_id,
                da.atleta_id,
                da.estatus,
                da.observaciones,
                e.fecha_evento as fecha,
                e.tipo_evento,
                e.entrenador_id,
                atl.nombre as atleta_nombre, 
                atl.apellido as atleta_apellido,
                atl.foto,
                c.nombre_categoria as categoria_nombre,
                p.nombre as entrenador_nombre,
                p.apellido as entrenador_apellido
            FROM detalle_asistencia da
            INNER JOIN evento_deportivo e ON da.evento_id = e.evento_id
            LEFT JOIN atletas atl ON da.atleta_id = atl.atleta_id
            LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
            LEFT JOIN plantel p ON e.entrenador_id = p.plantel_id
            WHERE 1=1
        `;
        const params = [];

        if (fecha) {
            query += ' AND e.fecha_evento = ?';
            params.push(fecha);
        }

        if (atleta_id) {
            query += ' AND da.atleta_id = ?';
            params.push(atleta_id);
        }

        if (categoria_id) {
            query += ' AND atl.categoria_id = ?';
            params.push(categoria_id);
        }

        query += ' ORDER BY e.fecha_evento DESC, atl.nombre ASC';

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo asistencias:', error);
        res.status(500).json({ error: 'Error al obtener asistencias' });
    }
};

// Registrar asistencia
const createAsistencia = async (req, res) => {
    try {
        const { atleta_id, fecha, tipo_evento, estatus, observaciones, entrenador_id } = req.body;

        // Obtener o crear el evento deportivo
        const evento_id = await getOrCreateEvento(
            fecha,
            tipo_evento || 'Entrenamiento',
            entrenador_id
        );

        // Verificar si ya existe registro para ese atleta en ese evento
        const [existing] = await pool.execute(
            'SELECT asistencia_id FROM detalle_asistencia WHERE atleta_id = ? AND evento_id = ?',
            [atleta_id, evento_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: 'Ya existe un registro de asistencia para este atleta en este evento'
            });
        }

        // Insertar en detalle_asistencia
        const [result] = await pool.execute(
            `INSERT INTO detalle_asistencia (evento_id, atleta_id, estatus, observaciones) 
             VALUES (?, ?, ?, ?)`,
            [evento_id, atleta_id, estatus || 'presente', observaciones || '']
        );

        res.status(200).json({
            message: 'Asistencia registrada exitosamente',
            id: result.insertId,
            evento_id: evento_id
        });

    } catch (error) {
        console.error('Error registrando asistencia:', error);
        res.status(500).json({ error: 'Error al registrar asistencia' });
    }
};

// Obtener asistencias por fecha
const getAsistenciasByFecha = async (req, res) => {
    try {
        const { fecha } = req.params;

        const [rows] = await pool.execute(
            `SELECT 
                da.asistencia_id,
                da.evento_id,
                da.atleta_id,
                da.estatus,
                da.observaciones,
                e.fecha_evento as fecha,
                e.tipo_evento,
                atl.nombre as atleta_nombre, 
                atl.apellido as atleta_apellido,
                atl.foto,
                c.nombre_categoria as categoria_nombre,
                TIMESTAMPDIFF(YEAR, atl.fecha_nacimiento, CURDATE()) as edad
            FROM detalle_asistencia da
            INNER JOIN evento_deportivo e ON da.evento_id = e.evento_id
            LEFT JOIN atletas atl ON da.atleta_id = atl.atleta_id
            LEFT JOIN categoria c ON atl.categoria_id = c.categoria_id
            WHERE e.fecha_evento = ? AND atl.estatus IN ('Activo', 'Lesionado')
            ORDER BY atl.nombre ASC`,
            [fecha]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo asistencias por fecha:', error);
        res.status(500).json({ error: 'Error al obtener asistencias' });
    }
};

// Actualizar asistencia
const updateAsistencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus, observaciones } = req.body;

        const [result] = await pool.execute(
            'UPDATE detalle_asistencia SET estatus = ?, observaciones = ? WHERE asistencia_id = ?',
            [estatus, observaciones || '', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
        }

        res.json({ message: 'Asistencia actualizada exitosamente' });
    } catch (error) {
        console.error('Error actualizando asistencia:', error);
        res.status(500).json({ error: 'Error al actualizar asistencia' });
    }
};

// Eliminar asistencia
const deleteAsistencia = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM detalle_asistencia WHERE asistencia_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
        }

        res.json({ message: 'Asistencia eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando asistencia:', error);
        res.status(500).json({ error: 'Error al eliminar asistencia' });
    }
};

module.exports = {
    getAsistencias,
    createAsistencia,
    getAsistenciasByFecha,
    updateAsistencia,
    deleteAsistencia
};

